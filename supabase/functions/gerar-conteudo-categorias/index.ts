import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const VERSION = "v2.1.0-split-extras-fix";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_PAGINAS = 40;
const MAX_TENTATIVAS = 5;

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { topico_id, force_restart } = body;

    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: "topico_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar tópico
    const { data: topico, error: topicoError } = await supabase
      .from("categorias_topicos")
      .select(`*, materia:categorias_materias(id, nome, categoria)`)
      .eq("id", topico_id)
      .single();

    if (topicoError || !topico) {
      return new Response(
        JSON.stringify({ error: "Tópico não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const materiaId = topico.materia_id;

    // === DETECTAR TÓPICO CONCLUÍDO COM EXTRAS VAZIOS (ANTES DA FILA) ===
    const extrasVazios = topico.status === "concluido" && (
      (!topico.flashcards || (Array.isArray(topico.flashcards) && topico.flashcards.length === 0)) ||
      (!topico.questoes || (Array.isArray(topico.questoes) && topico.questoes.length === 0))
    );

    if (extrasVazios && !force_restart) {
      console.log(`[Categorias] 🔄 Tópico ${topico_id} concluído mas com extras vazios - regenerando apenas extras`);
      
      EdgeRuntime.waitUntil(regenerarExtras(supabase, topico_id, topico));

      return new Response(
        JSON.stringify({
          success: true,
          background: true,
          message: "Regenerando flashcards e questões em background.",
          topico_id,
          titulo: topico.titulo,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === SISTEMA DE FILA - Permitir até 5 gerações simultâneas ===
    const MAX_CONCURRENT = 5;
    const WATCHDOG_MS = 30 * 60 * 1000; // 30 minutos

    // Buscar todos os tópicos gerando na mesma matéria (exceto o atual)
    const { data: topicosAtivos } = await supabase
      .from("categorias_topicos")
      .select("id, updated_at")
      .eq("materia_id", materiaId)
      .eq("status", "gerando")
      .neq("id", topico_id);

    // Watchdog: marcar como erro os que estão travados há +30min
    let ativosValidos = 0;
    if (topicosAtivos && topicosAtivos.length > 0) {
      const agora = Date.now();
      for (const ativo of topicosAtivos) {
        const updatedAt = new Date(ativo.updated_at).getTime();
        if (agora - updatedAt > WATCHDOG_MS) {
          console.log(`[Categorias] ⏰ Watchdog: tópico ${ativo.id} travado há +30min, marcando como erro`);
          await supabase
            .from("categorias_topicos")
            .update({ status: "erro", progresso: 0, updated_at: new Date().toISOString() })
            .eq("id", ativo.id);
        } else {
          ativosValidos++;
        }
      }
    }

    // Se já tem 5 ou mais ativos, enfileirar
    if (ativosValidos >= MAX_CONCURRENT && !force_restart) {
      const { data: maxFila } = await supabase
        .from("categorias_topicos")
        .select("posicao_fila")
        .eq("materia_id", materiaId)
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();

      const novaPosicao = (maxFila?.posicao_fila || 0) + 1;

      await supabase
        .from("categorias_topicos")
        .update({
          status: "na_fila",
          posicao_fila: novaPosicao,
          progresso: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", topico_id);

      console.log(`[Categorias] 📋 Enfileirado: ${topico.titulo} (posição ${novaPosicao}, ${ativosValidos} ativos)`);

      return new Response(
        JSON.stringify({
          success: true,
          status: "na_fila",
          posicao_fila: novaPosicao,
          message: `Tópico enfileirado na posição ${novaPosicao}`,
          topico_id,
          titulo: topico.titulo,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se o próprio tópico já está gerando e não é force_restart, ignorar
    if (topico.status === "gerando" && !force_restart) {
      return new Response(
        JSON.stringify({ message: "Geração já em andamento", background: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // Marcar como gerando
    await supabase
      .from("categorias_topicos")
      .update({
        status: "gerando",
        progresso: 5,
        posicao_fila: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topico_id);

    console.log(`[Categorias] 🚀 Iniciando geração: ${topico.titulo}`);

    EdgeRuntime.waitUntil(processarGeracaoBackground(supabase, supabaseUrl, supabaseServiceKey, topico_id, topico));

    return new Response(
      JSON.stringify({
        success: true,
        background: true,
        message: "Geração iniciada em background.",
        topico_id,
        titulo: topico.titulo,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Categorias] ❌ Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processarGeracaoBackground(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  topico_id: number,
  topico: any
) {
  try {
    const updateProgress = async (value: number) => {
      await supabase
        .from("categorias_topicos")
        .update({ progresso: value, updated_at: new Date().toISOString() })
        .eq("id", topico_id);
    };

    const areaNome = topico.materia?.nome || topico.materia?.categoria || "";
    const categoriaNome = topico.materia?.categoria || "";
    const topicoTitulo = topico.titulo;
    const tentativasAtuais = topico.tentativas || 0;

    console.log(`[Categorias] ══════════════════════════════════════════`);
    console.log(`[Categorias] 🚀 Iniciando geração: ${topicoTitulo}`);
    console.log(`[Categorias] 📦 VERSÃO: ${VERSION}`);
    console.log(`[Categorias] ══════════════════════════════════════════`);

    // 1. Buscar conteúdo extraído das páginas do PDF
    await updateProgress(10);
    const { data: paginas } = await supabase
      .from("categorias_topico_paginas")
      .select("pagina, conteudo")
      .eq("topico_id", topico_id)
      .order("pagina", { ascending: true });

    let conteudoPDF = "";
    if (paginas && paginas.length > 0) {
      conteudoPDF = paginas
        .filter((p: any) => p.conteudo && p.conteudo.trim().length > 0)
        .map((p: any) => `\n--- PÁGINA ${p.pagina} ---\n${p.conteudo}`)
        .join("\n\n");
      console.log(`[Categorias] PDF: ${paginas.length} páginas, ${conteudoPDF.length} chars`);
    }

    await updateProgress(15);

    // 2. Configurar Gemini
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
    ].filter(Boolean);

    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Função para sanitizar JSON
    function sanitizeJsonString(str: string): string {
      let result = "";
      let inString = false;
      let escapeNext = false;
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const code = str.charCodeAt(i);
        if (escapeNext) { result += char; escapeNext = false; continue; }
        if (char === '\\') { result += char; escapeNext = true; continue; }
        if (char === '"') { inString = !inString; result += char; continue; }
        if (inString) {
          if (code === 0x0A) result += '\\n';
          else if (code === 0x0D) result += '\\r';
          else if (code === 0x09) result += '\\t';
          else if (code < 0x20 || code === 0x7F) continue;
          else result += char;
        } else {
          if (char === '\n' || char === '\r' || char === '\t' || char === ' ') result += char;
          else if (code < 0x20 || code === 0x7F) continue;
          else result += char;
        }
      }
      return result;
    }

    function repairJson(text: string): string {
      let repaired = text.trim();
      repaired = repaired.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const jsonStart = repaired.indexOf("{");
      if (jsonStart === -1) return "{}";
      repaired = repaired.substring(jsonStart);
      let braceCount = 0, bracketCount = 0, inStr = false, escNext = false, lastValid = 0;
      for (let i = 0; i < repaired.length; i++) {
        const c = repaired[i];
        if (escNext) { escNext = false; continue; }
        if (c === '\\') { escNext = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (!inStr) {
          if (c === '{') braceCount++;
          else if (c === '}') { braceCount--; if (braceCount === 0) lastValid = i; }
          else if (c === '[') bracketCount++;
          else if (c === ']') bracketCount--;
        }
      }
      if (braceCount === 0 && bracketCount === 0) return repaired.substring(0, lastValid + 1);
      repaired = repaired.replace(/,\s*$/, "").replace(/:\s*$/, ': null').replace(/"\s*$/, '"');
      while (bracketCount > 0) { repaired += "]"; bracketCount--; }
      while (braceCount > 0) { repaired += "}"; braceCount--; }
      return repaired;
    }

    async function gerarJSON(prompt: string, maxRetries = 2, maxTokens = 8192): Promise<any> {
      let lastError: any = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[Categorias] Retry ${attempt}/${maxRetries}...`);
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.5 },
          });
          let text = result.response.text();
          const sanitized = sanitizeJsonString(text);
          const repaired = repairJson(sanitized);
          try { return JSON.parse(repaired); } catch (parseErr: any) {
            // Fallback: tentar reparar JSON truncado
            if (parseErr?.message?.includes("Unterminated") || parseErr?.message?.includes("Unexpected end")) {
              console.log(`[Categorias] ⚠️ JSON truncado detectado, tentando reparo...`);
              let truncFixed = repaired.replace(/,\s*$/, "");
              // Fechar strings abertas
              const lastQuote = truncFixed.lastIndexOf('"');
              const afterLastQuote = truncFixed.substring(lastQuote + 1);
              if (lastQuote > 0 && !afterLastQuote.includes('"')) {
                truncFixed += '"';
              }
              // Fechar arrays e objetos abertos
              let bc = 0, bk = 0, inS = false, esc = false;
              for (const c of truncFixed) {
                if (esc) { esc = false; continue; }
                if (c === '\\') { esc = true; continue; }
                if (c === '"') { inS = !inS; continue; }
                if (!inS) {
                  if (c === '{') bc++; else if (c === '}') bc--;
                  else if (c === '[') bk++; else if (c === ']') bk--;
                }
              }
              while (bk > 0) { truncFixed += "]"; bk--; }
              while (bc > 0) { truncFixed += "}"; bc--; }
              try {
                const result = JSON.parse(truncFixed);
                console.log(`[Categorias] ✓ JSON truncado reparado com sucesso`);
                return result;
              } catch { /* fall through */ }
            }
            const fixed = repaired.replace(/,\s*([}\]])/g, "$1").replace(/\[\s*,/g, "[").replace(/,\s*,/g, ",");
            return JSON.parse(fixed);
          }
        } catch (err) { lastError = err; }
      }
      throw lastError;
    }

    const limparSaudacoesProibidas = (texto: string): string => {
      if (!texto) return texto;
      const saudacoes = [
        /^Futuro\s+colega,?\s*/gi, /^Prezad[oa]\s+[^.]*,?\s*/gi, /^Car[oa]\s+[^.]*,?\s*/gi,
        /^Coleg[ao],?\s*/gi, /^E aí,?\s*[^.]*[!,.\s]*/gi, /^Olá[!,.\s]*/gi,
        /^Bem-vind[oa][!,.\s]*/gi, /^Galera,?\s*/gi, /^Pessoal,?\s*/gi, /^Oi[!,.\s]*/gi,
        /^Tá preparad[oa][?!.\s]*/gi, /^Beleza[?!,.\s]*/gi, /^Partiu[!,.\s]*/gi,
      ];
      let resultado = texto;
      for (const regex of saudacoes) resultado = resultado.replace(regex, '');
      if (resultado.length > 0 && /^[a-z]/.test(resultado))
        resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
      return resultado.trim();
    };

    // ============================================
    // PROMPT BASE (IDÊNTICO AO OAB TRILHAS, adaptado sem referências OAB)
    // ============================================
    const promptBase = `Você é um professor experiente explicando Direito para uma pessoa LEIGA.
Seu estilo é como uma CONVERSA DE CAFÉ - descontraído, acolhedor e didático.

═══ PÚBLICO-ALVO ═══
Pessoas que NUNCA estudaram o tema. Assuma ZERO conhecimento prévio.

═══ TOM DE VOZ ═══
- Descontraído, claro e acolhedor
- Use expressões naturais: "Olha só...", "Percebeu?", "Faz sentido, né?", "Na prática..."
- Perguntas guiadas: "E por que isso importa?", "Percebeu a diferença?"
- Seguro e correto tecnicamente
- Próximo, como conversa entre amigos reais
- NUNCA infantilizado ou condescendente

═══ ESTRUTURA DIDÁTICA OBRIGATÓRIA ═══

1. **SIMPLES PRIMEIRO → TÉCNICO DEPOIS (REGRA DE OURO)**
   ❌ ERRADO: "A jurisdição voluntária caracteriza-se por..."
   ✅ CERTO: "Sabe quando duas pessoas concordam com tudo, mas ainda precisam do juiz para oficializar? Isso é o que o Direito chama de 'jurisdição voluntária'."

2. **TRADUÇÃO IMEDIATA de termos técnicos e latim:**
   - "O 'pacta sunt servanda' (significa 'os pactos devem ser cumpridos' - ou seja, combinado é combinado!)"
   - "Isso é o que chamamos de 'trânsito em julgado' (quando não dá mais para recorrer de uma decisão)"

3. **DESMEMBRE conceitos difíceis:**
   Divida em partes menores, explicando passo a passo.

4. **ANALOGIAS DO COTIDIANO:**
   - "Pense na competência como o território de cada juiz..."
   - "É tipo quando você pede um lanche: se vier errado, você pode reclamar..."

5. **ANTECIPE DÚVIDAS:**
   "Você pode estar pensando: 'Mas isso não seria injusto?' Veja bem..."

═══ CUIDADOS IMPORTANTES ═══
- NÃO use emojis no texto corrido (a interface já adiciona os ícones visuais)
- NÃO mencione "PDF", "material", "documento" - escreva como conhecimento SEU
- NÃO mencione "OAB", "prova da OAB" ou "exame de ordem" - foque no ESTUDO da área
- NÃO comece slides com saudações (exceto introdução da primeira seção)
- Slides tipo "caso" JÁ SÃO exemplo prático - não adicione outro dentro

═══ GRIFO E ÊNFASE (OBRIGATÓRIO) ═══
Para destacar termos-chave, use NEGRITO + ASPAS SIMPLES:
• TERMOS TÉCNICOS: **'competência absoluta'**, **'litispendência'**
• LEIS E ARTIGOS: **'Art. 5º da CF'**, **'Lei 9.504/97'**
• PRAZOS: **'30 dias'**, **'prazo de 15 dias'**
• VALORES: **'R$ 5.000'**, **'10 salários mínimos'**

═══ CITAÇÕES DE ARTIGOS (OBRIGATÓRIO) ═══
Sempre que citar um artigo de lei, use BLOCKQUOTE:
> "Art. 5º - Todos são iguais perante a lei..." (CF/88)

═══ PROFUNDIDADE E DETALHAMENTO ═══
- Mínimo 250-400 palavras em slides tipo "texto"
- SEMPRE que usar um termo jurídico, explique-o INLINE imediatamente
- Cite artigos de lei de forma acessível
- Estruture com hierarquias claras: parágrafos curtos, conexões entre conceitos
- Termos-chave em negrito + aspas

**Categoria:** ${categoriaNome}
**Matéria:** ${areaNome}
**Tópico:** ${topicoTitulo}

═══ REFERÊNCIA DE ESTUDO ═══
${conteudoPDF || "Conteúdo não disponível - gere com base no seu conhecimento sobre o tema"}
═══════════════════════`;

    // ============================================
    // ETAPA 1: GERAR ESTRUTURA/ESQUELETO
    // ============================================
    console.log(`[Categorias] ETAPA 1: Gerando estrutura/esqueleto...`);
    await updateProgress(30);

    const promptEstrutura = `${promptBase}

═══ SUA TAREFA ═══
Crie APENAS a ESTRUTURA/ESQUELETO do conteúdo interativo.
NÃO gere o conteúdo completo agora, apenas títulos e tipos de página.

Retorne um JSON com esta estrutura EXATA:
{
  "titulo": "${topicoTitulo}",
  "tempoEstimado": "25 min",
  "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3", "Objetivo 4"],
  "secoes": [
    {
      "id": 1,
      "titulo": "Nome da Seção",
      "paginas": [
        {"tipo": "introducao", "titulo": "O que você vai aprender"},
        {"tipo": "texto", "titulo": "Conceito Principal X"},
        {"tipo": "texto", "titulo": "Detalhamento de Y"},
        {"tipo": "termos", "titulo": "Termos Importantes"},
        {"tipo": "quickcheck", "titulo": "Verificação Rápida"}
      ]
    },
    {
      "id": 2,
      "titulo": "Segunda Seção",
      "paginas": [...]
    }
  ]
}

REGRAS OBRIGATÓRIAS:
1. Gere entre 6-8 seções (para alcançar 40-55 páginas totais)
2. Cada seção deve ter 6-9 páginas
3. TIPOS DISPONÍVEIS: introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck, correspondencias

DISTRIBUIÇÃO MÍNIMA OBRIGATÓRIA:
- "introducao": 1 slide (APENAS na primeira seção)
- "texto": 15-20 slides (conteúdo principal detalhado)
- "atencao": 4-5 slides com "⚠️ Conceito Fundamental!" ou "ATENÇÃO: Ponto crucial!"
- "dica": 3-4 slides com técnicas de memorização e macetes
- "caso": 4-5 slides com exemplos práticos do cotidiano
- "tabela": 2-3 slides comparativos
- "quickcheck": 5-6 slides (pelo menos 1 por seção)
- "correspondencias": 1 slide no meio (entre páginas 25-30)
- "termos": 2-3 slides com vocabulário jurídico
- "resumo": 1 slide ao final de cada seção

4. NUNCA repita o slide "introducao" após a primeira seção
5. Cada seção deve ter MIX de tipos - não apenas "texto"
6. INCLUA exatamente 1 slide "correspondencias" NA SEÇÃO DO MEIO
7. Use títulos descritivos para cada página
8. MANTENHA o título original: "${topicoTitulo}" (não altere)
9. Cubra TODO o conteúdo do material

Retorne APENAS o JSON, sem texto adicional.`;

    let estrutura = await gerarJSON(promptEstrutura);
    if (!estrutura?.secoes || estrutura.secoes.length < 3) throw new Error("Estrutura inválida");

    const totalPaginasEstrutura = estrutura.secoes.reduce(
      (acc: number, s: any) => acc + (s.paginas?.length || 0), 0
    );
    console.log(`[Categorias] ✓ Estrutura: ${estrutura.secoes.length} seções, ${totalPaginasEstrutura} páginas planejadas`);

    await updateProgress(35);

    // ============================================
    // ETAPA 2: GERAR CONTEÚDO POR SEÇÃO
    // ============================================
    console.log(`[Categorias] ETAPA 2: Gerando conteúdo seção por seção...`);
    const secoesCompletas: any[] = [];
    const totalSecoes = estrutura.secoes.length;

    for (let i = 0; i < totalSecoes; i++) {
      const secaoEstrutura = estrutura.secoes[i];
      const progressoSecao = Math.round(35 + (i / totalSecoes) * 40);
      console.log(`[Categorias] Gerando seção ${i + 1}/${totalSecoes}: ${secaoEstrutura.titulo}`);
      await updateProgress(progressoSecao);

      const promptSecao = `${promptBase}

═══ SUA TAREFA ═══
Gere o CONTEÚDO COMPLETO para a SEÇÃO ${i + 1}:
Título: "${secaoEstrutura.titulo}"

PÁGINAS A GERAR (com seus tipos):
${JSON.stringify(secaoEstrutura.paginas, null, 2)}

Para CADA página, retorne o objeto completo com TOM CONVERSACIONAL (como café com professor):

1. Para tipo "introducao" (APENAS NA PRIMEIRA SEÇÃO - ENGAJAMENTO OBRIGATÓRIO):
   {"tipo": "introducao", "titulo": "${topicoTitulo}", "conteudo": "☕ Prepare seu café, pois vamos mergulhar juntos em um tema muito importante!\\n\\nNesta aula sobre **${topicoTitulo}**, vamos estudar de forma clara e prática. Ao final, você vai dominar:\\n\\n• **Conceito principal**: O que é e para que serve\\n• **Requisitos legais**: O que a lei exige\\n• **Casos práticos**: Como se aplica na realidade\\n• **Pontos de atenção**: O que mais importa\\n• **Dicas de memorização**: Macetes para não esquecer\\n\\nVamos juntos? Bora começar! 🎯"}
   ⚠️ ATENÇÃO: O slide "introducao" SÓ aparece na PRIMEIRA seção.
   IMPORTANTE: MANTENHA o título original "${topicoTitulo}" - NÃO altere!

2. Para tipo "texto" (MÍNIMO 250 PALAVRAS - BEM DETALHADO):
   {"tipo": "texto", "titulo": "...", "conteudo": "Explicação EXTENSA e HIERÁRQUICA. Sempre use **'negrito + aspas'** para termos-chave: A **'competência absoluta'** (ou seja, regras que não podem ser mudadas pelas partes) determina...\\n\\nQuando citar artigos, use blockquote:\\n\\n> \\"Art. XX - Texto do artigo...\\" (Lei X)\\n\\nUse parágrafos curtos. Crie conexões: 'Agora que você entendeu X, vamos ver como isso se aplica em Y...'"}

3. Para tipo "correspondencias" (GAMIFICAÇÃO - COLOCAR NO MEIO DA AULA):
   {"tipo": "correspondencias", "titulo": "Vamos praticar?", "conteudo": "Conecte cada termo à sua definição correta:", "correspondencias": [
     {"termo": "Termo técnico 1", "definicao": "Definição simples 1"},
     {"termo": "Termo técnico 2", "definicao": "Definição simples 2"},
     {"termo": "Termo técnico 3", "definicao": "Definição simples 3"},
     {"termo": "Termo técnico 4", "definicao": "Definição simples 4"}
   ]}

4. Para tipo "termos":
   {"tipo": "termos", "titulo": "...", "conteudo": "Vamos conhecer os termos importantes:", "termos": [{"termo": "Termo Técnico", "definicao": "Explicação em linguagem simples"}]}

5. Para tipo "linha_tempo":
   {"tipo": "linha_tempo", "titulo": "...", "conteudo": "Passo a passo:", "etapas": [{"titulo": "1ª Etapa", "descricao": "Descrição clara"}]}

6. Para tipo "tabela":
   {"tipo": "tabela", "titulo": "...", "conteudo": "Veja a comparação lado a lado:", "tabela": {"cabecalhos": [...], "linhas": [[...], [...]]}}

7. Para tipo "atencao" (ALERTA IMPORTANTE):
   {"tipo": "atencao", "titulo": "⚠️ Conceito Fundamental!", "conteudo": "**Atenção redobrada aqui!**\\n\\nEsse é um dos pontos mais importantes. Veja:\\n\\n> \\"Art. XX - [texto do artigo relevante]\\" (Lei X)\\n\\nMuita gente confunde [conceito A] com [conceito B], mas a diferença é crucial:\\n\\n• **'Conceito A'**: significa X\\n• **'Conceito B'**: significa Y\\n\\n💡 **Dica para não errar**: Lembre-se que [macete de memorização]."}
   ⚠️ Obrigatório: 4-5 slides "atencao" por aula!

8. Para tipo "dica" (TÉCNICA DE MEMORIZAÇÃO):
   {"tipo": "dica", "titulo": "💡 Macete para Memorizar", "conteudo": "**Técnica de Memorização: [Nome da técnica]**\\n\\nPara lembrar de **'[termo técnico]'**, use esta associação:\\n\\n📌 **Mnemônico**: [frase ou acrônimo]\\n\\n**Por que funciona?**\\nQuando você [explicação simples da associação]...\\n\\n✅ **Teste agora**: Feche os olhos e repita o mnemônico 3 vezes!"}
   ⚠️ Obrigatório: 3-4 slides "dica" por aula!

9. Para tipo "caso" (EXEMPLO PRÁTICO DO COTIDIANO):
   {"tipo": "caso", "titulo": "📋 Na Prática: Caso de [Contexto]", "conteudo": "**Situação Real:**\\n\\nImagine que João, um [profissão/situação], está enfrentando [problema concreto do dia-a-dia]...\\n\\n**Análise Jurídica:**\\n\\nAqui, aplica-se o **'[termo jurídico]'** (ou seja, [explicação simples]). Conforme:\\n\\n> \\"Art. XX - [citação do artigo]\\" ([Lei])\\n\\n**Conclusão Prática:**\\n\\nJoão [resultado/solução]. Isso mostra que sempre que aparecer [situação similar], você deve pensar em [conceito-chave]."}
   ⚠️ Obrigatório: 4-5 slides "caso" por aula!

10. Para tipo "quickcheck" (FORMATO OBRIGATÓRIO - UMA PERGUNTA POR SLIDE):
    {"tipo": "quickcheck", "titulo": "Verificação Rápida", "conteudo": "Vamos testar se ficou claro:", "pergunta": "Qual é o prazo para interposição de recurso?", "opcoes": ["A) 5 dias", "B) 10 dias", "C) 15 dias", "D) 30 dias"], "resposta": 2, "feedback": "Correto! O prazo é de **'15 dias'** conforme o Art. X..."}
    ⚠️ ATENÇÃO: Use "pergunta" (singular), NÃO "perguntas" (plural). Cada slide quickcheck tem UMA pergunta só.

11. Para tipo "resumo":
    {"tipo": "resumo", "titulo": "...", "conteudo": "Recapitulando:", "pontos": ["Ponto 1", "Ponto 2", "..."]}

Retorne um JSON com a seção COMPLETA:
{
  "id": ${secaoEstrutura.id},
  "titulo": "${secaoEstrutura.titulo}",
  "slides": [...]
}

REGRAS CRÍTICAS:
- Use TOM CONVERSACIONAL: "Olha só...", "Percebeu?", "Faz sentido, né?"
- SIMPLES PRIMEIRO → TÉCNICO DEPOIS
- EXPLICAÇÃO INLINE: Todo termo jurídico deve ser explicado entre parênteses imediatamente
- Páginas "texto" devem ter 250-400 palavras - BEM DETALHADAS
- Use HIERARQUIA clara: conceito principal → detalhes → aplicação prática
- NÃO mencione OAB ou prova - foque no estudo aprofundado
- ${i === 0 ? 'INCLUA slide introducao' : 'NÃO inclua introducao, vá direto ao conteúdo'}
- USE BLOCKQUOTE (>) para citações de artigos de lei
- USE **'negrito + aspas'** para termos-chave

Retorne APENAS o JSON da seção, sem texto adicional.`;

      try {
        const secaoCompleta = await gerarJSON(promptSecao);
        if (!secaoCompleta?.slides || secaoCompleta.slides.length < 3) throw new Error("Poucos slides");

        // Remover introducao duplicada
        if (i > 0) {
          secaoCompleta.slides = secaoCompleta.slides.filter((s: any) => s.tipo !== 'introducao');
        }

        // Pós-processamento
        for (const slide of secaoCompleta.slides) {
          const isPrimeiraSecaoIntro = i === 0 && slide.tipo === 'introducao';
          if (!isPrimeiraSecaoIntro && slide.conteudo) {
            slide.conteudo = limparSaudacoesProibidas(slide.conteudo);
          }
          // Normalizar quickcheck
          if (slide.tipo === 'quickcheck' && !slide.pergunta && slide.perguntas?.length > 0) {
            const q = slide.perguntas[0];
            slide.pergunta = q.texto || q.pergunta || '';
            slide.opcoes = q.opcoes || [];
            slide.resposta = q.respostaCorreta ?? q.resposta ?? 0;
            slide.feedback = q.feedback || '';
            delete slide.perguntas;
          }
        }

        secoesCompletas.push(secaoCompleta);
        console.log(`[Categorias] ✓ Seção ${i + 1}: ${secaoCompleta.slides.length} páginas`);
      } catch (err) {
        console.error(`[Categorias] ❌ Erro seção ${i + 1}:`, err);
        secoesCompletas.push({
          id: secaoEstrutura.id, titulo: secaoEstrutura.titulo,
          slides: [{ tipo: "texto", titulo: secaoEstrutura.titulo, conteudo: `Conteúdo em regeneração.` }]
        });
      }
    }

    await updateProgress(80);

    // ============================================
    // ETAPA 3: GERAR EXTRAS (gamificação + flashcards + questões)
    // ============================================
    console.log(`[Categorias] ETAPA 3: Gerando extras...`);

    const promptGamificacao = `${promptBase}

═══ SUA TAREFA ═══
Gere elementos de GAMIFICAÇÃO para estudo interativo sobre "${topicoTitulo}".

Retorne JSON com EXATAMENTE esta estrutura:
{
  "correspondencias": [{"termo": "Termo técnico", "definicao": "Definição curta (máx 50 chars)"}],
  "ligar_termos": [{"conceito": "Descrição em linguagem simples", "termo": "Nome técnico"}],
  "explique_com_palavras": [{"conceito": "Conceito a explicar", "dica": "Dica para ajudar"}],
  "termos": [{"termo": "Termo jurídico", "definicao": "Explicação para leigo"}],
  "exemplos": [{"titulo": "Título do caso", "situacao": "Situação", "analise": "Análise", "conclusao": "Conclusão"}]
}

QUANTIDADES EXATAS:
- correspondencias: 8 pares
- ligar_termos: 6 pares
- explique_com_palavras: 4 desafios
- termos: 10 termos
- exemplos: 5 casos

IMPORTANTE: Definições curtas, máximo 50 caracteres cada. NÃO mencione OAB.
Retorne APENAS o JSON.`;

    const promptFlashcards = `${promptBase}

═══ SUA TAREFA ═══
Gere FLASHCARDS sobre "${topicoTitulo}" (foco em estudo aprofundado, NÃO OAB).

Retorne JSON:
{
  "flashcards": [{"frente": "Pergunta direta sobre conceito-chave", "verso": "Resposta clara e objetiva", "exemplo": "Exemplo prático"}]
}

QUANTIDADES EXATAS (OBRIGATÓRIO):
- flashcards: EXATAMENTE 22 cards

REGRAS PARA FLASHCARDS:
- Frente: Pergunta direta e objetiva
- Verso: Resposta clara (máx 100 palavras)
- Exemplo: Situação prática que ilustra

Retorne APENAS o JSON.`;

    const promptQuestoes = `${promptBase}

═══ SUA TAREFA ═══
Gere QUESTÕES sobre "${topicoTitulo}" (foco em estudo aprofundado, NÃO OAB).

Retorne JSON:
{
  "questoes": [{"pergunta": "Enunciado completo da questão", "alternativas": ["A) ...", "B) ...", "C) ...", "D) ..."], "correta": 0, "explicacao": "Explicação detalhada"}]
}

QUANTIDADES EXATAS (OBRIGATÓRIO):
- questoes: EXATAMENTE 17 questões

REGRAS PARA QUESTÕES:
- Enunciado claro e contextualizado
- 4 alternativas plausíveis
- Explicação que justifique a correta E refute as incorretas

Retorne APENAS o JSON.`;

    let extras: any = { correspondencias: [], ligar_termos: [], explique_com_palavras: [], exemplos: [], termos: [], flashcards: [], questoes: [] };

    try {
      const [gam, flashData, questData] = await Promise.all([
        gerarJSON(promptGamificacao, 2, 4096).catch(e => { console.error(`[Categorias] ⚠️ Erro gamificação:`, e.message); return {}; }),
        gerarJSON(promptFlashcards, 3, 8192).catch(e => { console.error(`[Categorias] ⚠️ Erro flashcards:`, e.message); return {}; }),
        gerarJSON(promptQuestoes, 3, 8192).catch(e => { console.error(`[Categorias] ⚠️ Erro questões:`, e.message); return {}; }),
      ]);
      extras = {
        correspondencias: gam.correspondencias || [], ligar_termos: gam.ligar_termos || [],
        explique_com_palavras: gam.explique_com_palavras || [], termos: gam.termos || [],
        exemplos: gam.exemplos || [], flashcards: flashData.flashcards || [], questoes: questData.questoes || [],
      };
      console.log(`[Categorias] ✓ Gamificação: ${extras.correspondencias.length} corresp, ${extras.ligar_termos.length} ligar`);
      console.log(`[Categorias] ✓ Estudo: ${extras.flashcards.length} flashcards, ${extras.questoes.length} questões`);
    } catch (err) { console.error("[Categorias] Extras error:", err); }

    await updateProgress(85);

    // ============================================
    // VALIDAR PÁGINAS MÍNIMAS
    // ============================================
    const totalPaginas = secoesCompletas.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
    console.log(`[Categorias] Total de páginas geradas: ${totalPaginas}`);

    if (totalPaginas < MIN_PAGINAS) {
      console.log(`[Categorias] ⚠️ Apenas ${totalPaginas} páginas (mínimo: ${MIN_PAGINAS})`);
      const novasTentativas = tentativasAtuais + 1;
      if (novasTentativas >= MAX_TENTATIVAS) {
        await supabase.from("categorias_topicos").update({ status: "erro", tentativas: novasTentativas, progresso: 0 }).eq("id", topico_id);
      } else {
        await supabase.from("categorias_topicos").update({ status: "pendente", tentativas: novasTentativas, progresso: 0 }).eq("id", topico_id);
      }
      await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey, topico.materia_id);
      return;
    }

    // ============================================
    // ETAPA 4: GERAR SÍNTESE FINAL COMPLETA
    // ============================================
    console.log(`[Categorias] ETAPA 4: Gerando síntese final...`);

    const promptSintese = `${promptBase}

═══ SUA TAREFA ═══
Com base em TODO o conteúdo gerado sobre "${topicoTitulo}", crie uma SÍNTESE FINAL COMPLETA.

Retorne JSON:
{
  "resumo_texto": "Texto 150-200 palavras de resumo conversacional",
  "termos_chave": [{"termo": "Termo 1", "definicao": "Definição curta"}],
  "dicas_memorizacao": ["Dica 1: macete", "Dica 2: associação"],
  "tabela_comparativa": {"cabecalhos": ["Aspecto", "A", "B"], "linhas": [["Caract.", "V1", "V2"]]}
}

8-12 termos, 4-6 dicas. NÃO mencione OAB. APENAS JSON.`;

    let sinteseFinal: any = { resumo_texto: "", termos_chave: [], dicas_memorizacao: [], tabela_comparativa: null };
    try {
      const s = await gerarJSON(promptSintese, 3, 8192);
      sinteseFinal = {
        resumo_texto: s?.resumo_texto || "",
        termos_chave: Array.isArray(s?.termos_chave) ? s.termos_chave.slice(0, 12) : [],
        dicas_memorizacao: Array.isArray(s?.dicas_memorizacao) ? s.dicas_memorizacao.slice(0, 6) : [],
        tabela_comparativa: s?.tabela_comparativa || null,
      };
      console.log(`[Categorias] ✓ Síntese: ${sinteseFinal.termos_chave.length} termos, ${sinteseFinal.dicas_memorizacao.length} dicas`);
    } catch { sinteseFinal.resumo_texto = `Você completou o estudo de ${topicoTitulo}.`; }

    // Criar slides de Síntese Final
    const slidesSintese: any[] = [];
    slidesSintese.push({ tipo: "texto", titulo: "📚 Resumo Geral", conteudo: sinteseFinal.resumo_texto || `Estudo de **${topicoTitulo}** completo!` });
    if (sinteseFinal.termos_chave?.length) {
      slidesSintese.push({ tipo: "termos", titulo: "🔑 Termos-Chave para Memorizar", conteudo: "Estes são os termos que você DEVE dominar:", termos: sinteseFinal.termos_chave.map((t: any) => ({ termo: t.termo || t, definicao: t.definicao || "" })) });
    }
    if (sinteseFinal.dicas_memorizacao?.length) {
      slidesSintese.push({ tipo: "dica", titulo: "💡 Dicas de Memorização", conteudo: sinteseFinal.dicas_memorizacao.map((d: string, i: number) => `**${i + 1}.** ${d}`).join('\n\n') });
    }
    if (sinteseFinal.tabela_comparativa?.cabecalhos) {
      slidesSintese.push({ tipo: "tabela", titulo: "📊 Comparativo Rápido", conteudo: "Revisão lado a lado:", tabela: sinteseFinal.tabela_comparativa });
    }
    slidesSintese.push({
      tipo: "resumo", titulo: "✅ Síntese Final",
      conteudo: `Parabéns! Você completou o estudo de **${topicoTitulo}**.\n\nAgora é hora de testar com flashcards!`,
      pontos: ["Revise os termos-chave", "Use as dicas de memorização", "Pratique com flashcards", "Faça as questões"]
    });

    secoesCompletas.push({ id: secoesCompletas.length + 1, titulo: "Síntese Final", slides: slidesSintese });

    const conteudoFinal = {
      versao: 1, titulo: topicoTitulo, tempoEstimado: estrutura.tempoEstimado || "25 min",
      area: areaNome, categoria: categoriaNome, objetivos: estrutura.objetivos || [],
      secoes: secoesCompletas,
      paginas: secoesCompletas.flatMap(s => s.slides || []).map((slide: any) => ({ titulo: slide.titulo, tipo: slide.tipo, markdown: slide.conteudo }))
    };

    await updateProgress(90);

    const correspondenciasValidas = (extras.correspondencias || [])
      .filter((c: any) => c?.termo && c?.definicao).slice(0, 10)
      .map((c: any) => ({ termo: String(c.termo).trim().substring(0, 50), definicao: String(c.definicao).trim().substring(0, 80) }));

    const termosComGamificacao = {
      glossario: extras.termos || [], correspondencias: correspondenciasValidas,
      ligar_termos: Array.isArray(extras.ligar_termos) ? extras.ligar_termos : [],
      explique_com_palavras: Array.isArray(extras.explique_com_palavras) ? extras.explique_com_palavras : [],
    };

    const { error: updateError } = await supabase
      .from("categorias_topicos")
      .update({
        conteudo_gerado: conteudoFinal, exemplos: extras.exemplos || [],
        termos: termosComGamificacao, flashcards: extras.flashcards || [],
        questoes: extras.questoes || [], status: "concluido", progresso: 100,
        tentativas: tentativasAtuais + 1, posicao_fila: null, updated_at: new Date().toISOString(),
      })
      .eq("id", topico_id);

    if (updateError) throw updateError;

    console.log(`[Categorias] ✅ Concluído: ${topicoTitulo} (${totalPaginas} páginas, ${secoesCompletas.length} seções)`);

    await updateProgress(95);

    // Gerar capa
    try {
      await supabase.functions.invoke("gerar-capa-topico-oab", {
        body: { topico_id, titulo: topicoTitulo, area: areaNome, tabela: "categorias_topicos" }
      });
    } catch { console.log("[Categorias] Capa não gerada"); }

    // === ENCADEAMENTO: processar próximo da fila ===
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey, topico.materia_id);

  } catch (error: any) {
    console.error("[Categorias] ❌ Erro background:", error);
    try {
      const { data: t } = await supabase.from("categorias_topicos").select("tentativas, materia_id").eq("id", topico_id).single();
      const tent = (t?.tentativas || 0) + 1;
      if (tent < MAX_TENTATIVAS) {
        await supabase.from("categorias_topicos").update({ status: "pendente", tentativas: tent, progresso: 0 }).eq("id", topico_id);
      } else {
        await supabase.from("categorias_topicos").update({ status: "erro", tentativas: tent, progresso: 0 }).eq("id", topico_id);
      }
      if (t?.materia_id) {
        await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey, t.materia_id);
      }
    } catch (e) { console.error("[Categorias] Erro retry:", e); }
  }
}

// === REGENERAR APENAS EXTRAS (flashcards/questões) ===
async function regenerarExtras(supabase: any, topico_id: number, topico: any) {
  try {
    console.log(`[Categorias] 🔄 Regenerando extras para: ${topico.titulo}`);

    const areaNome = topico.materia?.nome || topico.materia?.categoria || "";
    const categoriaNome = topico.materia?.categoria || "";
    const topicoTitulo = topico.titulo;

    // Buscar conteúdo PDF
    const { data: paginas } = await supabase
      .from("categorias_topico_paginas")
      .select("pagina, conteudo")
      .eq("topico_id", topico_id)
      .order("pagina", { ascending: true });

    let conteudoPDF = "";
    if (paginas && paginas.length > 0) {
      conteudoPDF = paginas
        .filter((p: any) => p.conteudo && p.conteudo.trim().length > 0)
        .map((p: any) => `\n--- PÁGINA ${p.pagina} ---\n${p.conteudo}`)
        .join("\n\n");
    }

    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
    ].filter(Boolean);
    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    function sanitizeJsonString(str: string): string {
      let result = "";
      let inString = false;
      let escapeNext = false;
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const code = str.charCodeAt(i);
        if (escapeNext) { result += char; escapeNext = false; continue; }
        if (char === '\\') { result += char; escapeNext = true; continue; }
        if (char === '"') { inString = !inString; result += char; continue; }
        if (inString) {
          if (code === 0x0A) result += '\\n';
          else if (code === 0x0D) result += '\\r';
          else if (code === 0x09) result += '\\t';
          else if (code < 0x20 || code === 0x7F) continue;
          else result += char;
        } else {
          if (char === '\n' || char === '\r' || char === '\t' || char === ' ') result += char;
          else if (code < 0x20 || code === 0x7F) continue;
          else result += char;
        }
      }
      return result;
    }

    function repairJson(text: string): string {
      let repaired = text.trim();
      repaired = repaired.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const jsonStart = repaired.indexOf("{");
      if (jsonStart === -1) return "{}";
      repaired = repaired.substring(jsonStart);
      let braceCount = 0, bracketCount = 0, inStr = false, escNext = false, lastValid = 0;
      for (let i = 0; i < repaired.length; i++) {
        const c = repaired[i];
        if (escNext) { escNext = false; continue; }
        if (c === '\\') { escNext = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (!inStr) {
          if (c === '{') braceCount++;
          else if (c === '}') { braceCount--; if (braceCount === 0) lastValid = i; }
          else if (c === '[') bracketCount++;
          else if (c === ']') bracketCount--;
        }
      }
      if (braceCount === 0 && bracketCount === 0) return repaired.substring(0, lastValid + 1);
      repaired = repaired.replace(/,\s*$/, "").replace(/:\s*$/, ': null').replace(/"\s*$/, '"');
      while (bracketCount > 0) { repaired += "]"; bracketCount--; }
      while (braceCount > 0) { repaired += "}"; braceCount--; }
      return repaired;
    }

    async function gerarJSON(prompt: string, maxRetries = 3, maxTokens = 8192): Promise<any> {
      let lastError: any = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.5 },
          });
          let text = result.response.text();
          const sanitized = sanitizeJsonString(text);
          const repaired = repairJson(sanitized);
          try { return JSON.parse(repaired); } catch (parseErr: any) {
            if (parseErr?.message?.includes("Unterminated") || parseErr?.message?.includes("Unexpected end")) {
              let truncFixed = repaired.replace(/,\s*$/, "");
              const lastQuote = truncFixed.lastIndexOf('"');
              const afterLastQuote = truncFixed.substring(lastQuote + 1);
              if (lastQuote > 0 && !afterLastQuote.includes('"')) truncFixed += '"';
              let bc = 0, bk = 0, inS = false, esc = false;
              for (const c of truncFixed) {
                if (esc) { esc = false; continue; }
                if (c === '\\') { esc = true; continue; }
                if (c === '"') { inS = !inS; continue; }
                if (!inS) {
                  if (c === '{') bc++; else if (c === '}') bc--;
                  else if (c === '[') bk++; else if (c === ']') bk--;
                }
              }
              while (bk > 0) { truncFixed += "]"; bk--; }
              while (bc > 0) { truncFixed += "}"; bc--; }
              try { return JSON.parse(truncFixed); } catch { /* fall through */ }
            }
            const fixed = repaired.replace(/,\s*([}\]])/g, "$1").replace(/\[\s*,/g, "[").replace(/,\s*,/g, ",");
            return JSON.parse(fixed);
          }
        } catch (err) { lastError = err; }
      }
      throw lastError;
    }

    const promptBase = `Você é um professor experiente explicando Direito para uma pessoa LEIGA.
**Categoria:** ${categoriaNome}
**Matéria:** ${areaNome}
**Tópico:** ${topicoTitulo}

═══ REFERÊNCIA DE ESTUDO ═══
${conteudoPDF || "Gere com base no seu conhecimento sobre o tema"}
═══════════════════════`;

    const needFlashcards = !topico.flashcards || (Array.isArray(topico.flashcards) && topico.flashcards.length === 0);
    const needQuestoes = !topico.questoes || (Array.isArray(topico.questoes) && topico.questoes.length === 0);

    const updateData: any = { updated_at: new Date().toISOString() };

    if (needFlashcards) {
      const promptF = `${promptBase}\n\nGere EXATAMENTE 22 flashcards sobre "${topicoTitulo}".\nRetorne JSON: {"flashcards": [{"frente": "Pergunta", "verso": "Resposta", "exemplo": "Exemplo"}]}\nAPENAS JSON.`;
      try {
        const r = await gerarJSON(promptF, 3, 8192);
        updateData.flashcards = r.flashcards || [];
        console.log(`[Categorias] ✓ Regenerados ${updateData.flashcards.length} flashcards`);
      } catch (e) { console.error(`[Categorias] ❌ Erro regenerar flashcards:`, e); }
    }

    if (needQuestoes) {
      const promptQ = `${promptBase}\n\nGere EXATAMENTE 17 questões sobre "${topicoTitulo}".\nRetorne JSON: {"questoes": [{"pergunta": "Enunciado", "alternativas": ["A)...", "B)...", "C)...", "D)..."], "correta": 0, "explicacao": "Explicação"}]}\nAPENAS JSON.`;
      try {
        const r = await gerarJSON(promptQ, 3, 8192);
        updateData.questoes = r.questoes || [];
        console.log(`[Categorias] ✓ Regeneradas ${updateData.questoes.length} questões`);
      } catch (e) { console.error(`[Categorias] ❌ Erro regenerar questões:`, e); }
    }

    if (Object.keys(updateData).length > 1) {
      await supabase.from("categorias_topicos").update(updateData).eq("id", topico_id);
      console.log(`[Categorias] ✅ Extras regenerados para: ${topicoTitulo}`);
    }
  } catch (err) {
    console.error(`[Categorias] ❌ Erro regenerarExtras:`, err);
  }
}

// === PROCESSAR PRÓXIMO DA FILA (igual OAB Trilhas) ===
async function processarProximoDaFila(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  materiaId: number
) {
  const MAX_CONCURRENT = 5;
  try {
    // Contar quantos estão gerando atualmente
    const { data: ativosAtual } = await supabase
      .from("categorias_topicos")
      .select("id")
      .eq("materia_id", materiaId)
      .eq("status", "gerando");

    const ativosCount = ativosAtual?.length || 0;
    const slotsDisponiveis = MAX_CONCURRENT - ativosCount;

    if (slotsDisponiveis <= 0) {
      console.log(`[Categorias] Fila: ${ativosCount} ativos, sem slots disponíveis`);
      return;
    }

    // Buscar próximos da fila (até preencher slots)
    const { data: proximosFila } = await supabase
      .from("categorias_topicos")
      .select("id, titulo")
      .eq("materia_id", materiaId)
      .eq("status", "na_fila")
      .order("posicao_fila", { ascending: true })
      .limit(slotsDisponiveis);

    let itensParaDisparar = proximosFila || [];

    // Se fila vazia, buscar pendentes
    if (itensParaDisparar.length === 0) {
      const { data: pendentes } = await supabase
        .from("categorias_topicos")
        .select("id, titulo")
        .eq("materia_id", materiaId)
        .in("status", ["pendente"])
        .is("conteudo_gerado", null)
        .order("ordem", { ascending: true })
        .limit(slotsDisponiveis);

      itensParaDisparar = pendentes || [];
    }

    if (itensParaDisparar.length === 0) {
      console.log(`[Categorias] ✅ Fila vazia para matéria ${materiaId}`);
      return;
    }

    console.log(`[Categorias] 🔄 Disparando ${itensParaDisparar.length} próximos (${ativosCount} ativos, ${slotsDisponiveis} slots)`);

    // Disparar todos em paralelo
    for (const item of itensParaDisparar) {
      fetch(`${supabaseUrl}/functions/v1/gerar-conteudo-categorias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ topico_id: item.id }),
      }).catch(err => console.error("[Categorias] Erro ao disparar:", err));
    }
  } catch (err) {
    console.error("[Categorias] Erro ao processar próximo da fila:", err);
  }
}
