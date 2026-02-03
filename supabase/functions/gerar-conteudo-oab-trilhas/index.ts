import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

// VERSÃO para debugging de deploy
const VERSION = "v2.6.0-resumo-unified";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Constantes de configuração
const MIN_PAGINAS = 30;
const MAX_TENTATIVAS = 3;

// Declarar EdgeRuntime para processamento em background
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { topico_id, resumo_id, force_restart, force_regenerate } = body;
    
    // Aceitar resumo_id OU topico_id
    const isResumoMode = !!resumo_id && !topico_id;
    
    if (!topico_id && !resumo_id) {
      return new Response(
        JSON.stringify({ error: "topico_id ou resumo_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // MODO RESUMO (Subtema): Gerar conteúdo para tabela RESUMO
    // ============================================
    if (isResumoMode) {
      console.log(`[OAB Trilhas] ══════════════════════════════════════════`);
      console.log(`[OAB Trilhas] 🚀 MODO RESUMO: Gerando subtema ID ${resumo_id}`);
      console.log(`[OAB Trilhas] 📦 VERSÃO: ${VERSION}`);
      console.log(`[OAB Trilhas] ══════════════════════════════════════════`);

      // Buscar dados do resumo
      const { data: resumo, error: resumoError } = await supabase
        .from("RESUMO")
        .select("*")
        .eq("id", resumo_id)
        .single();

      if (resumoError || !resumo) {
        return new Response(
          JSON.stringify({ error: "Resumo não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verificar se já tem conteúdo e não é force
      if (resumo.slides_json && !force_regenerate) {
        console.log(`[OAB Trilhas] Resumo ${resumo_id} já tem conteúdo, retornando`);
        return new Response(
          JSON.stringify({ success: true, already_generated: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Processar em background
      EdgeRuntime.waitUntil(processarGeracaoResumoBackground(
        supabase, 
        resumo_id, 
        resumo
      ));

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: "gerando",
          background: true,
          message: "Geração do subtema iniciada em background.",
          resumo_id,
          titulo: resumo.subtema
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // MODO TÓPICO: Fluxo original com fila
    // ============================================
    const STALE_GENERATION_MINUTES = 30;
    const staleCutoff = new Date(Date.now() - STALE_GENERATION_MINUTES * 60 * 1000).toISOString();

    const { data: gerandoAtivo, error: checkError } = await supabase
      .from("oab_trilhas_topicos")
      .select("id, titulo, updated_at, progresso")
      .eq("status", "gerando")
      .neq("id", topico_id)
      .order("updated_at", { ascending: false })
      .limit(1);

    // Se existir uma geração ativa muito antiga, provavelmente travou. Nesse caso, marcamos como erro e seguimos.
    if (!checkError && gerandoAtivo && gerandoAtivo.length > 0) {
      const ativo = gerandoAtivo[0];
      const updatedAt = ativo.updated_at as string | null;
      const isStale = !!updatedAt && updatedAt < staleCutoff;

      if (isStale) {
        console.log(
          `[OAB Watchdog] Geração travada detectada (>${STALE_GENERATION_MINUTES}min). Marcando como erro: ${ativo.titulo} (ID: ${ativo.id}) updated_at=${updatedAt} progresso=${ativo.progresso}`
        );

        await supabase
          .from("oab_trilhas_topicos")
          .update({
            status: "erro",
            progresso: 0,
            posicao_fila: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", ativo.id);

        // continua a execução normalmente (não enfileira)
      } else {
        console.log(`[OAB Fila] Geração ativa detectada: ${ativo.titulo} (ID: ${ativo.id})`);
      
      const { data: maxPosicao } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      const { data: jaEnfileirado } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila, status")
        .eq("id", topico_id)
        .single();
      
      if (jaEnfileirado?.status === "na_fila") {
        const { count: totalFila } = await supabase
          .from("oab_trilhas_topicos")
          .select("id", { count: "exact", head: true })
          .eq("status", "na_fila");
        
        return new Response(
          JSON.stringify({ 
            queued: true, 
            position: jaEnfileirado.posicao_fila,
            total: totalFila || 1,
            message: `Já está na fila na posição ${jaEnfileirado.posicao_fila}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      await supabase
        .from("oab_trilhas_topicos")
        .update({ 
          status: "na_fila", 
          posicao_fila: novaPosicao,
          updated_at: new Date().toISOString() 
        })
        .eq("id", topico_id);
      
      const { count: totalFila } = await supabase
        .from("oab_trilhas_topicos")
        .select("id", { count: "exact", head: true })
        .eq("status", "na_fila");
      
      console.log(`[OAB Fila] Tópico ${topico_id} adicionado na posição ${novaPosicao} (total: ${totalFila})`);
      
      return new Response(
        JSON.stringify({ 
          queued: true, 
          position: novaPosicao,
          total: totalFila || 1,
          message: `Adicionado à fila na posição ${novaPosicao}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      }
    }

    // ============================================
    // VERIFICAR TÓPICO E MARCAR COMO GERANDO
    // ============================================
    const { data: topico, error: topicoError } = await supabase
      .from("oab_trilhas_topicos")
      .select(`
        *,
        materia:oab_trilhas_materias(id, nome)
      `)
      .eq("id", topico_id)
      .single();

    if (topicoError || !topico) {
      return new Response(
        JSON.stringify({ error: "Tópico não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "gerando" && !force_restart) {
      return new Response(
        JSON.stringify({ message: "Geração já em andamento", background: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "gerando" && force_restart) {
      console.log(`[OAB Trilhas] 🔁 Force restart solicitado para topico_id=${topico_id}`);
    }

    const posicaoRemovida = topico.posicao_fila;
    
    // Marcar como gerando IMEDIATAMENTE
    await supabase
      .from("oab_trilhas_topicos")
      .update({ 
        status: "gerando", 
        progresso: 5,
        posicao_fila: null,
        updated_at: new Date().toISOString() 
      })
      .eq("id", topico_id);

    // Atualizar posições da fila
    if (posicaoRemovida) {
      const { data: filaParaAtualizar } = await supabase
        .from("oab_trilhas_topicos")
        .select("id, posicao_fila")
        .eq("status", "na_fila")
        .gt("posicao_fila", posicaoRemovida);
      
      if (filaParaAtualizar && filaParaAtualizar.length > 0) {
        for (const item of filaParaAtualizar) {
          await supabase
            .from("oab_trilhas_topicos")
            .update({ posicao_fila: (item.posicao_fila || 1) - 1 })
            .eq("id", item.id);
        }
        console.log(`[OAB Fila] Posições atualizadas: ${filaParaAtualizar.length} itens`);
      }
    }

    console.log(`[OAB Trilhas] ══════════════════════════════════════════`);
    console.log(`[OAB Trilhas] 🚀 Iniciando geração em BACKGROUND: ${topico.titulo}`);
    console.log(`[OAB Trilhas] ══════════════════════════════════════════`);

    // ============================================
    // PROCESSAR EM BACKGROUND - Retornar imediatamente
    // ============================================
    EdgeRuntime.waitUntil(processarGeracaoBackground(
      supabase, 
      supabaseUrl, 
      supabaseServiceKey, 
      topico_id, 
      topico
    ));

    // Retornar IMEDIATAMENTE - processamento continua em background
    return new Response(
      JSON.stringify({ 
        success: true, 
        background: true,
        message: "Geração iniciada em background. O progresso será atualizado automaticamente.",
        topico_id,
        titulo: topico.titulo
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[OAB Trilhas] ❌ Erro ao iniciar geração:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================
// FUNÇÃO DE PROCESSAMENTO EM BACKGROUND
// ============================================
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
        .from("oab_trilhas_topicos")
        .update({ progresso: value, updated_at: new Date().toISOString() })
        .eq("id", topico_id);
    };

    const areaNome = topico.materia?.nome || "";
    const topicoTitulo = topico.titulo;
    const tentativasAtuais = topico.tentativas || 0;

    console.log(`[OAB Trilhas] ══════════════════════════════════════════`);
    console.log(`[OAB Trilhas] 🚀 Iniciando geração em BACKGROUND: ${topicoTitulo}`);
    console.log(`[OAB Trilhas] 📦 VERSÃO: ${VERSION}`);
    console.log(`[OAB Trilhas] ══════════════════════════════════════════`);
    console.log(`[OAB Trilhas] Gerando conteúdo INCREMENTAL: ${topicoTitulo} (tentativa ${tentativasAtuais + 1})`);

    // 1. Buscar conteúdo extraído das páginas do PDF
    await updateProgress(10);
    const { data: paginas } = await supabase
      .from("oab_trilhas_topico_paginas")
      .select("pagina, conteudo")
      .eq("topico_id", topico_id)
      .order("pagina", { ascending: true });

    let conteudoPDF = "";
    if (paginas && paginas.length > 0) {
      conteudoPDF = paginas
        .filter((p: any) => p.conteudo && p.conteudo.trim().length > 0)
        .map((p: any) => `\n--- PÁGINA ${p.pagina} ---\n${p.conteudo}`)
        .join("\n\n");
      console.log(`[OAB Trilhas] PDF: ${paginas.length} páginas, ${conteudoPDF.length} chars`);
    } else {
      console.log("[OAB Trilhas] ALERTA: Nenhuma página do PDF encontrada!");
    }

    await updateProgress(15);

    // 2. Buscar contexto adicional do RESUMO se existir
    let conteudoResumo = "";
    const { data: resumos } = await supabase
      .from("RESUMO")
      .select("conteudo, subtema")
      .eq("area", areaNome)
      .eq("tema", topicoTitulo)
      .order("\"ordem subtema\"", { ascending: true })
      .limit(15);

    if (resumos && resumos.length > 0) {
      conteudoResumo = resumos.map((r: any) => {
        const sub = r.subtema ? `### ${r.subtema}\n` : "";
        return sub + (r.conteudo || "");
      }).join("\n\n");
      console.log(`[OAB Trilhas] RESUMO: ${resumos.length} subtemas`);
    }

    await updateProgress(20);

    // 3. Buscar contexto da Base de Conhecimento OAB
    let contextoBase = "";
    try {
      const { data: contextData } = await supabase.functions.invoke("buscar-contexto-base-oab", {
        body: { area: areaNome, topico: topicoTitulo, maxTokens: 5000 }
      });
      
      if (contextData?.contexto) {
        contextoBase = contextData.contexto;
        console.log(`[OAB Trilhas] Base OAB: ${contextData.tokensUsados} tokens`);
      }
    } catch (e) {
      console.log("[OAB Trilhas] Base de conhecimento não disponível");
    }

    await updateProgress(25);

    // 4. Configurar Gemini
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

    // Função para reparar JSON truncado/malformado
    function repairJson(text: string): string {
      let repaired = text.trim();
      
      // Remover markdown
      repaired = repaired.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      
      // Encontrar início do JSON
      const jsonStart = repaired.indexOf("{");
      if (jsonStart === -1) return "{}";
      repaired = repaired.substring(jsonStart);
      
      // Contar chaves e colchetes
      let braceCount = 0;
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      let lastValidIndex = 0;
      
      for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        
        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        
        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') { braceCount--; if (braceCount === 0) lastValidIndex = i; }
          else if (char === '[') bracketCount++;
          else if (char === ']') bracketCount--;
        }
      }
      
      // Se JSON está completo, retornar
      if (braceCount === 0 && bracketCount === 0) {
        return repaired.substring(0, lastValidIndex + 1);
      }
      
      // Truncado: fechar estruturas abertas
      repaired = repaired.replace(/,\s*$/, ""); // Remover vírgula final
      repaired = repaired.replace(/:\s*$/, ': null'); // Fechar valor pendente
      repaired = repaired.replace(/"\s*$/, '"'); // Fechar string
      
      // Fechar arrays e objetos pendentes
      while (bracketCount > 0) { repaired += "]"; bracketCount--; }
      while (braceCount > 0) { repaired += "}"; braceCount--; }
      
      return repaired;
    }

    // Função para gerar e fazer parse de JSON com retry e reparo robusto
    async function gerarJSON(prompt: string, maxRetries = 2, maxTokens = 8192): Promise<any> {
      let lastError: any = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[OAB Trilhas] Retry ${attempt}/${maxRetries}...`);
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
          
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.5 },
          });
          
          let text = result.response.text();
          
          // Tentar parse direto primeiro
          const sanitized = sanitizeJsonString(text);
          const repaired = repairJson(sanitized);
          
          try {
            return JSON.parse(repaired);
          } catch {
            // Segunda tentativa: limpar mais agressivamente
            const fixed = repaired
              .replace(/,\s*([}\]])/g, "$1")
              .replace(/([{,])\s*}/g, "$1}")
              .replace(/\[\s*,/g, "[")
              .replace(/,\s*,/g, ",");
            return JSON.parse(fixed);
          }
        } catch (err) {
          lastError = err;
          console.error(`[OAB Trilhas] Tentativa ${attempt + 1} falhou:`, err);
        }
      }
      
      throw lastError;
    }

    // ============================================
    // PROMPT BASE (ESTILO CONCEITOS - CONVERSA DESCONTRAÍDA)
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
   - "O 'habeas corpus' (do latim 'que tenhas o corpo' - basicamente: traga a pessoa presa para o juiz ver)"

3. **DESMEMBRE conceitos difíceis:**
   Divida em partes menores, explicando passo a passo, como se estivesse "mastigando" o conteúdo para o aluno.

4. **ANALOGIAS DO COTIDIANO:**
   - "Pense na competência como o território de cada juiz. Assim como um policial de SP não pode multar alguém no RJ..."
   - "É tipo quando você pede um lanche: se vier errado, você pode reclamar - isso é o seu 'direito de consumidor'."

5. **ANTECIPE DÚVIDAS:**
   "Você pode estar pensando: 'Mas isso não seria injusto?' Veja bem..."

═══ CUIDADOS IMPORTANTES ═══
- NÃO use emojis no texto corrido (a interface já adiciona os ícones visuais)
- NÃO mencione "PDF", "material", "documento" - escreva como conhecimento SEU
- NÃO comece slides com saudações (exceto introdução da primeira seção)
- Slides tipo "caso" JÁ SÃO exemplo prático - não adicione outro dentro
- NUNCA seja formal demais ou use "juridiquês" sem explicação imediata

═══ PROFUNDIDADE ═══
- Mínimo 200-400 palavras em slides tipo "texto"
- Cite artigos de lei de forma acessível: "O artigo 5º da Constituição garante que todos são iguais perante a lei - parece óbvio, mas veja como isso funciona na prática..."
- Termos-chave entre aspas simples: 'tipicidade', 'culpabilidade', 'antijuridicidade'
- Cite juristas de forma acessível: "Como ensina Humberto Theodoro Júnior (um dos grandes estudiosos do tema)..."

**Matéria:** ${areaNome} - OAB 1ª Fase
**Tópico:** ${topicoTitulo}

═══ REFERÊNCIA DE ESTUDO ═══
${conteudoPDF || "Conteúdo não disponível"}
${conteudoResumo ? `\n═══ SUBTEMAS ═══\n${conteudoResumo}` : ""}
${contextoBase ? `\n═══ BASE OAB ═══\n${contextoBase}` : ""}
═══════════════════════`;

    // Função para remover APENAS saudações formais/repetitivas no início dos slides
    // PRESERVAR expressões naturais como "Olha só", "Veja bem", "Percebeu?" - fazem parte do tom conversacional
    const limparSaudacoesProibidas = (texto: string): string => {
      if (!texto) return texto;
      const saudacoesProibidas = [
        // Saudações formais/artificiais que devem ser removidas
        /^Futuro\s+colega,?\s*/gi,
        /^Prezad[oa]\s+(advogad[oa]|coleg[ao]|estudante)[^.]*,?\s*/gi,
        /^Car[oa]\s+(colega|estudante|futuro)[^.]*,?\s*/gi,
        /^Coleg[ao],?\s*/gi,
        /^Estimad[oa]\s+(colega|estudante|futuro)[^.]*,?\s*/gi,
        /^E aí,?\s*(galera|futuro|colega|pessoal)?[!,.\s]*/gi,
        /^Olá[!,.\s]*/gi,
        /^Bem-vind[oa][!,.\s]*/gi,
        /^Tá preparad[oa][?!.\s]*/gi,
        /^Beleza[?!,.\s]*/gi,
        /^Partiu[!,.\s]*/gi,
        /^(Cara|Mano),?\s*/gi,
        /^Galera,?\s*/gi,
        /^Pessoal,?\s*/gi,
        /^Oi[!,.\s]*/gi,
        // NÃO remover: "Olha só", "Veja bem", "Percebeu?", "Vamos lá", "Bora" - são expressões naturais do tom conversacional
      ];
      let resultado = texto;
      for (const regex of saudacoesProibidas) {
        resultado = resultado.replace(regex, '');
      }
      if (resultado.length > 0 && /^[a-z]/.test(resultado)) {
        resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
      }
      return resultado.trim();
    };

    // ============================================
    // ETAPA 1: GERAR ESTRUTURA/ESQUELETO
    // ============================================
    console.log(`[OAB Trilhas] ETAPA 1: Gerando estrutura/esqueleto...`);
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

REGRAS:
1. Gere entre 5-7 seções (para alcançar 35-55 páginas totais)
2. Cada seção deve ter 6-10 páginas
3. TIPOS DISPONÍVEIS: introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck
4. Distribua bem os tipos (não só "texto")
5. Cada seção deve ter pelo menos 1 quickcheck
6. Use títulos descritivos para cada página
7. Cubra TODO o conteúdo do material

Retorne APENAS o JSON, sem texto adicional.`;

    let estrutura: any = null;
    try {
      estrutura = await gerarJSON(promptEstrutura);
      
      if (!estrutura?.secoes || !Array.isArray(estrutura.secoes) || estrutura.secoes.length < 3) {
        throw new Error("Estrutura inválida: menos de 3 seções");
      }
      
      const totalPaginasEstrutura = estrutura.secoes.reduce(
        (acc: number, s: any) => acc + (s.paginas?.length || 0), 0
      );
      console.log(`[OAB Trilhas] ✓ Estrutura: ${estrutura.secoes.length} seções, ${totalPaginasEstrutura} páginas planejadas`);
    } catch (err) {
      console.error(`[OAB Trilhas] ❌ Erro na estrutura:`, err);
      throw new Error(`Falha ao gerar estrutura: ${err}`);
    }

    await updateProgress(35);

    // ============================================
    // ETAPA 2: GERAR CONTEÚDO POR SEÇÃO
    // ============================================
    console.log(`[OAB Trilhas] ETAPA 2: Gerando conteúdo seção por seção...`);
    
    const secoesCompletas: any[] = [];
    const totalSecoes = estrutura.secoes.length;

    for (let i = 0; i < totalSecoes; i++) {
      const secaoEstrutura = estrutura.secoes[i];
      const progressoSecao = Math.round(35 + (i / totalSecoes) * 40);
      
      console.log(`[OAB Trilhas] Gerando seção ${i + 1}/${totalSecoes}: ${secaoEstrutura.titulo}`);
      await updateProgress(progressoSecao);

      const promptSecao = `${promptBase}

═══ SUA TAREFA ═══
Gere o CONTEÚDO COMPLETO para a SEÇÃO ${i + 1}:
Título: "${secaoEstrutura.titulo}"

PÁGINAS A GERAR (com seus tipos):
${JSON.stringify(secaoEstrutura.paginas, null, 2)}

Para CADA página, retorne o objeto completo com TOM CONVERSACIONAL (como café com professor):

1. Para tipo "introducao":
   {"tipo": "introducao", "titulo": "...", "conteudo": "Texto motivador e acolhedor: 'Olha só, vamos entender juntos um tema que cai muito na OAB...'"}

2. Para tipo "texto" (MÍNIMO 250 PALAVRAS):
   {"tipo": "texto", "titulo": "...", "conteudo": "Explicação EXTENSA começando com linguagem simples, depois introduzindo o termo técnico. Use analogias do cotidiano. Antecipe dúvidas: 'Você pode estar pensando...'"}

3. Para tipo "termos":
   {"tipo": "termos", "titulo": "...", "conteudo": "Vamos conhecer os termos que você vai encontrar na prova:", "termos": [{"termo": "Termo Técnico", "definicao": "Explicação em linguagem simples, como se explicasse para um amigo que nunca estudou Direito"}]}

4. Para tipo "linha_tempo":
   {"tipo": "linha_tempo", "titulo": "...", "conteudo": "Passo a passo para entender o processo:", "etapas": [{"titulo": "1ª Etapa", "descricao": "Descrição clara e didática"}]}

5. Para tipo "tabela":
   {"tipo": "tabela", "titulo": "...", "conteudo": "Veja a comparação lado a lado:", "tabela": {"cabecalhos": [...], "linhas": [[...], [...]]}}

6. Para tipo "atencao":
   {"tipo": "atencao", "titulo": "Cuidado com essa pegadinha!", "conteudo": "Muita gente erra aqui... Veja bem: [explicar o ponto de atenção com clareza]"}

7. Para tipo "dica":
   {"tipo": "dica", "titulo": "...", "conteudo": "Uma dica que me ajudou muito: [técnica de memorização ou macete prático]"}

8. Para tipo "caso":
   {"tipo": "caso", "titulo": "...", "conteudo": "Imagine a seguinte situação: João está [situação cotidiana]. [Análise jurídica explicada de forma simples]"}

9. Para tipo "quickcheck":
   {"tipo": "quickcheck", "titulo": "...", "conteudo": "Vamos testar se ficou claro:", "pergunta": "Pergunta prática em linguagem acessível", "opcoes": ["A) ...", "B) ...", "C) ...", "D) ..."], "resposta": 0, "feedback": "A resposta certa é a alternativa X porque... [explicação didática do porquê, não só da certa mas também do erro das outras]"}

10. Para tipo "resumo":
    {"tipo": "resumo", "titulo": "...", "conteudo": "Recapitulando o que aprendemos:", "pontos": ["Ponto 1 com linguagem clara", "Ponto 2", "..."]}

Retorne um JSON com a seção COMPLETA:
{
  "id": ${secaoEstrutura.id},
  "titulo": "${secaoEstrutura.titulo}",
  "slides": [
    // Array com TODAS as páginas completas
  ]
}

REGRAS CRÍTICAS:
- Use TOM CONVERSACIONAL: "Olha só...", "Percebeu?", "Faz sentido, né?"
- SIMPLES PRIMEIRO → TÉCNICO DEPOIS: Explique o conceito antes de dar o nome técnico
- Tradução IMEDIATA de latim e juridiquês
- Páginas "texto" devem ter 250-400 palavras
- Use analogias do cotidiano
- NUNCA use emojis no texto (a interface já adiciona ícones)

Retorne APENAS o JSON da seção, sem texto adicional.`;

      try {
        const secaoCompleta = await gerarJSON(promptSecao);
        
        if (!secaoCompleta?.slides || !Array.isArray(secaoCompleta.slides)) {
          throw new Error(`Seção ${i + 1} sem slides válidos`);
        }
        
        if (secaoCompleta.slides.length < 3) {
          throw new Error(`Seção ${i + 1} com apenas ${secaoCompleta.slides.length} slides`);
        }
        
        // PÓS-PROCESSAMENTO: Remover saudações proibidas
        for (const slide of secaoCompleta.slides) {
          const isPrimeiraSecaoIntro = i === 0 && slide.tipo === 'introducao';
          if (!isPrimeiraSecaoIntro && slide.conteudo) {
            slide.conteudo = limparSaudacoesProibidas(slide.conteudo);
          }
        }
        
        secoesCompletas.push(secaoCompleta);
        console.log(`[OAB Trilhas] ✓ Seção ${i + 1}: ${secaoCompleta.slides.length} páginas`);
        
      } catch (err) {
        console.error(`[OAB Trilhas] ❌ Erro na seção ${i + 1}:`, err);
        secoesCompletas.push({
          id: secaoEstrutura.id,
          titulo: secaoEstrutura.titulo,
          slides: [{
            tipo: "texto",
            titulo: secaoEstrutura.titulo,
            conteudo: `Conteúdo da seção "${secaoEstrutura.titulo}" está sendo regenerado. Por favor, tente novamente em alguns instantes.`
          }]
        });
      }
    }

    await updateProgress(80);

    // ============================================
    // ETAPA 3: GERAR EXTRAS (dividido em 2 chamadas para evitar truncamento)
    // ============================================
    console.log(`[OAB Trilhas] [${VERSION}] ETAPA 3: Gerando extras em 2 partes...`);

    // PARTE A: Gamificação (correspondências, ligar_termos, explique_com_palavras, termos)
    const promptGamificacao = `${promptBase}

═══ SUA TAREFA ═══
Gere elementos de GAMIFICAÇÃO para estudo interativo sobre "${topicoTitulo}".

Retorne JSON com EXATAMENTE esta estrutura:
{
  "correspondencias": [
    {"termo": "Termo técnico", "definicao": "Definição curta (máx 50 chars)"}
  ],
  "ligar_termos": [
    {"conceito": "Descrição em linguagem simples do que significa", "termo": "Nome técnico"}
  ],
  "explique_com_palavras": [
    {"conceito": "Conceito a explicar", "dica": "Dica para ajudar"}
  ],
  "termos": [
    {"termo": "Termo jurídico", "definicao": "Explicação para leigo"}
  ],
  "exemplos": [
    {"titulo": "Título do caso", "situacao": "Situação", "analise": "Análise", "conclusao": "Conclusão"}
  ]
}

QUANTIDADES EXATAS:
- correspondencias: 8 pares
- ligar_termos: 6 pares (conceito simples → termo técnico)
- explique_com_palavras: 4 desafios
- termos: 10 termos
- exemplos: 5 casos

IMPORTANTE: Definições curtas, máximo 50 caracteres cada.
Retorne APENAS o JSON, nada mais.`;

    // PARTE B: Flashcards e Questões
    const promptFlashQuestoes = `${promptBase}

═══ SUA TAREFA ═══
Gere FLASHCARDS e QUESTÕES estilo OAB sobre "${topicoTitulo}".

Retorne JSON com EXATAMENTE esta estrutura:
{
  "flashcards": [
    {"frente": "Pergunta direta", "verso": "Resposta clara", "exemplo": "Exemplo prático"}
  ],
  "questoes": [
    {"pergunta": "Enunciado", "alternativas": ["A) ...", "B) ...", "C) ...", "D) ..."], "correta": 0, "explicacao": "Por que a alternativa X está certa"}
  ]
}

QUANTIDADES EXATAS:
- flashcards: 15 cards
- questoes: 12 questões estilo OAB

Retorne APENAS o JSON, nada mais.`;

    let extras: any = { 
      correspondencias: [], 
      ligar_termos: [],
      explique_com_palavras: [],
      exemplos: [], 
      termos: [], 
      flashcards: [], 
      questoes: [] 
    };

    // Executar ambas as chamadas em paralelo
    try {
      const [gamificacao, flashQuestoes] = await Promise.all([
        gerarJSON(promptGamificacao, 2, 4096).catch(e => {
          console.error(`[OAB Trilhas] ⚠️ Erro gamificação:`, e.message);
          return {};
        }),
        gerarJSON(promptFlashQuestoes, 2, 6144).catch(e => {
          console.error(`[OAB Trilhas] ⚠️ Erro flash/questões:`, e.message);
          return {};
        })
      ]);

      // Mesclar resultados
      extras = {
        correspondencias: gamificacao.correspondencias || [],
        ligar_termos: gamificacao.ligar_termos || [],
        explique_com_palavras: gamificacao.explique_com_palavras || [],
        termos: gamificacao.termos || [],
        exemplos: gamificacao.exemplos || [],
        flashcards: flashQuestoes.flashcards || [],
        questoes: flashQuestoes.questoes || []
      };

      console.log(`[OAB Trilhas] ✓ Gamificação: ${extras.correspondencias.length} corresp, ${extras.ligar_termos.length} ligar, ${extras.explique_com_palavras.length} explicar`);
      console.log(`[OAB Trilhas] ✓ Estudo: ${extras.flashcards.length} flashcards, ${extras.questoes.length} questões`);
    } catch (err) {
      console.error(`[OAB Trilhas] ⚠️ Erro geral nos extras:`, err);
    }

    await updateProgress(85);

    // ============================================
    // VALIDAR PÁGINAS MÍNIMAS
    // ============================================
    const totalPaginas = secoesCompletas.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
    console.log(`[OAB Trilhas] Total de páginas geradas: ${totalPaginas}`);

    if (totalPaginas < MIN_PAGINAS) {
      console.log(`[OAB Trilhas] ⚠️ Apenas ${totalPaginas} páginas (mínimo: ${MIN_PAGINAS})`);
      
      const novasTentativas = tentativasAtuais + 1;
      
      if (novasTentativas >= MAX_TENTATIVAS) {
        console.log(`[OAB Trilhas] ❌ Máximo de tentativas atingido, marcando como erro`);
        await supabase.from("oab_trilhas_topicos")
          .update({ status: "erro", tentativas: novasTentativas, progresso: 0 })
          .eq("id", topico_id);
        
        await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
        return;
      }
      
      // Recolocar na fila
      const { data: maxPosicao } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      await supabase.from("oab_trilhas_topicos")
        .update({ 
          status: "na_fila", 
          posicao_fila: novaPosicao,
          tentativas: novasTentativas,
          conteudo_gerado: null,
          progresso: 0
        })
        .eq("id", topico_id);
      
      await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
      return;
    }

    // ============================================
    // ETAPA 4: GERAR SÍNTESE FINAL
    // ============================================
    console.log(`[OAB Trilhas] ETAPA 4: Gerando síntese final...`);
    
    const promptSintese = `${promptBase}

═══ SUA TAREFA ═══
Com base em TODO o conteúdo gerado sobre "${topicoTitulo}", crie uma SÍNTESE FINAL completa.

Esta síntese deve:
1. Resumir os PONTOS-CHAVE de cada seção estudada
2. Destacar os conceitos mais importantes para a OAB
3. Incluir termos-chave que DEVEM ser memorizados
4. Listar dicas de prova e pegadinhas comuns

Retorne um JSON com a estrutura:
{
  "pontos": [
    "Ponto-chave 1: Descrição clara e objetiva",
    "Ponto-chave 2: Conceito fundamental para a OAB",
    "Ponto-chave 3: Termo importante a memorizar",
    "Ponto-chave 4: Dica de prova",
    "Ponto-chave 5: Outro conceito essencial"
  ]
}

Gere entre 8-12 pontos-chave que resumam TODO o conteúdo estudado.
Cada ponto deve ter entre 15-50 palavras.

Retorne APENAS o JSON, sem texto adicional.`;

    let sinteseFinalPontos: string[] = [];
    try {
      const sintese = await gerarJSON(promptSintese);
      if (sintese?.pontos && Array.isArray(sintese.pontos)) {
        sinteseFinalPontos = sintese.pontos.slice(0, 12);
        console.log(`[OAB Trilhas] ✓ Síntese final: ${sinteseFinalPontos.length} pontos`);
      }
    } catch (err) {
      console.error(`[OAB Trilhas] ⚠️ Erro na síntese final (usando fallback):`, err);
      sinteseFinalPontos = secoesCompletas.flatMap(s => 
        (s.slides || []).slice(0, 2).map((slide: any) => slide.titulo || "")
      ).filter(Boolean).slice(0, 8);
    }

    // Criar slide de Síntese Final
    const slideSinteseFinal = {
      tipo: "resumo",
      titulo: "Síntese Final",
      conteudo: `Parabéns, futuro colega! Você completou o estudo de **${topicoTitulo}**.\n\nAbaixo estão os pontos mais importantes que você precisa dominar para a OAB:`,
      pontos: sinteseFinalPontos
    };

    const secaoSinteseFinal = {
      id: secoesCompletas.length + 1,
      titulo: "Síntese Final",
      slides: [slideSinteseFinal]
    };
    secoesCompletas.push(secaoSinteseFinal);

    // Montar estrutura final
    const conteudoFinal = {
      versao: 1,
      titulo: topicoTitulo,
      tempoEstimado: estrutura.tempoEstimado || "25 min",
      area: areaNome,
      objetivos: estrutura.objetivos || [],
      secoes: secoesCompletas,
      paginas: secoesCompletas.flatMap(s => s.slides || []).map((slide: any) => ({
        titulo: slide.titulo,
        tipo: slide.tipo,
        markdown: slide.conteudo
      }))
    };

    await updateProgress(90);

    // Validar correspondências
    let correspondenciasValidas = extras.correspondencias || [];
    correspondenciasValidas = correspondenciasValidas
      .filter((c: any) => c && c.termo && c.definicao)
      .slice(0, 10)
      .map((c: any) => ({
        termo: String(c.termo).trim().substring(0, 50),
        definicao: String(c.definicao).trim().substring(0, 80)
      }));

    // Guardar toda a gamificação em um único JSON (campo "termos" já existente na tabela)
    const termosComGamificacao = {
      glossario: extras.termos || [],
      correspondencias: correspondenciasValidas,
      ligar_termos: Array.isArray(extras.ligar_termos) ? extras.ligar_termos : [],
      explique_com_palavras: Array.isArray(extras.explique_com_palavras) ? extras.explique_com_palavras : [],
    };

    // Salvar no banco
    const { error: updateError } = await supabase
      .from("oab_trilhas_topicos")
      .update({
        conteudo_gerado: conteudoFinal,
        exemplos: extras.exemplos || [],
        termos: termosComGamificacao,
        flashcards: extras.flashcards || [],
        questoes: extras.questoes || [],
        status: "concluido",
        progresso: 100,
        tentativas: tentativasAtuais + 1,
        posicao_fila: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topico_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`[OAB Trilhas] ✅ Conteúdo salvo com sucesso: ${topicoTitulo}`);
    console.log(`[OAB Trilhas] Stats: ${totalPaginas} páginas, ${secoesCompletas.length} seções`);
    console.log(`[OAB Trilhas] Gamificação: corresp=${termosComGamificacao.correspondencias.length}, ligar=${termosComGamificacao.ligar_termos.length}, explicar=${termosComGamificacao.explique_com_palavras.length}`);

    await updateProgress(95);

    // Gerar capa do tópico
    console.log(`[OAB Trilhas] Gerando capa do tópico...`);
    try {
      await supabase.functions.invoke("gerar-capa-topico-oab", {
        body: { 
          topico_id,
          titulo: topicoTitulo,
          area: areaNome
        }
      });
      console.log(`[OAB Trilhas] ✓ Capa solicitada`);
    } catch (e) {
      console.log(`[OAB Trilhas] ⚠️ Capa não gerada (continuando sem):`, e);
    }

    // Processar próximo da fila
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);

  } catch (error: any) {
    console.error("[OAB Trilhas] ❌ Erro no processamento background:", error);

    try {
      const { data: topicoAtual } = await supabase
        .from("oab_trilhas_topicos")
        .select("tentativas")
        .eq("id", topico_id)
        .single();

      const tentativas = (topicoAtual?.tentativas || 0) + 1;

      if (tentativas < MAX_TENTATIVAS) {
        const { data: maxPos } = await supabase
          .from("oab_trilhas_topicos")
          .select("posicao_fila")
          .eq("status", "na_fila")
          .order("posicao_fila", { ascending: false })
          .limit(1)
          .single();

        const novaPosicao = (maxPos?.posicao_fila || 0) + 1;

        await supabase
          .from("oab_trilhas_topicos")
          .update({ 
            status: "na_fila", 
            posicao_fila: novaPosicao,
            tentativas,
            progresso: 0,
            conteudo_gerado: null,
            updated_at: new Date().toISOString()
          })
          .eq("id", topico_id);

        console.log(`[OAB Fila] ♻️ Erro recuperável, recolocando na fila (tentativa ${tentativas}/${MAX_TENTATIVAS})`);
      } else {
        await supabase
          .from("oab_trilhas_topicos")
          .update({ status: "erro", tentativas, progresso: 0, updated_at: new Date().toISOString() })
          .eq("id", topico_id);

        console.log(`[OAB Fila] ❌ Erro após ${MAX_TENTATIVAS} tentativas`);
      }
      
      await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
    } catch (catchErr) {
      console.error("[OAB Trilhas] Erro ao processar retry:", catchErr);
    }
  }
}

// Função auxiliar para processar próximo item da fila
async function processarProximoDaFila(supabase: any, supabaseUrl: string, supabaseServiceKey: string) {
  try {
    const { data: proximo, error } = await supabase
      .from("oab_trilhas_topicos")
      .select("id, titulo")
      .eq("status", "na_fila")
      .order("posicao_fila", { ascending: true })
      .limit(1)
      .single();

    if (error || !proximo) {
      console.log("[OAB Fila] Nenhum item na fila para processar");
      return;
    }

    console.log(`[OAB Fila] Iniciando próximo da fila: ${proximo.titulo} (ID: ${proximo.id})`);

    const functionUrl = `${supabaseUrl}/functions/v1/gerar-conteudo-oab-trilhas`;
    
    fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ topico_id: proximo.id }),
    }).catch(err => {
      console.error("[OAB Fila] Erro ao iniciar próximo:", err);
    });
    
  } catch (err) {
    console.error("[OAB Fila] Erro ao buscar próximo da fila:", err);
  }
}

// ============================================
// FUNÇÃO DE PROCESSAMENTO EM BACKGROUND PARA RESUMO (Subtema)
// ============================================
async function processarGeracaoResumoBackground(
  supabase: any, 
  resumo_id: number,
  resumo: any
) {
  try {
    const areaNome = resumo.area || "";
    const subtema = resumo.subtema || "";
    const conteudoFonte = resumo.conteudo || "";

    console.log(`[OAB Resumo] ══════════════════════════════════════════`);
    console.log(`[OAB Resumo] 🚀 Gerando conteúdo para subtema: ${subtema}`);
    console.log(`[OAB Resumo] 📦 VERSÃO: ${VERSION}`);
    console.log(`[OAB Resumo] ══════════════════════════════════════════`);

    if (!conteudoFonte || conteudoFonte.trim().length < 50) {
      console.log(`[OAB Resumo] ⚠️ Conteúdo fonte muito curto ou vazio`);
      await supabase
        .from("RESUMO")
        .update({
          conteudo_gerado: JSON.stringify({
            erro: true,
            mensagem: "Conteúdo fonte não disponível",
            detalhe: "O texto extraído do PDF para este subtema está vazio ou muito curto."
          })
        })
        .eq("id", resumo_id);
      return;
    }

    // Configurar Gemini
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
    ].filter(Boolean);

    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Funções auxiliares (reutilizáveis)
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
      
      let braceCount = 0;
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      let lastValidIndex = 0;
      
      for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        
        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') { braceCount--; if (braceCount === 0) lastValidIndex = i; }
          else if (char === '[') bracketCount++;
          else if (char === ']') bracketCount--;
        }
      }
      
      if (braceCount === 0 && bracketCount === 0) {
        return repaired.substring(0, lastValidIndex + 1);
      }
      
      repaired = repaired.replace(/,\s*$/, "");
      repaired = repaired.replace(/:\s*$/, ': null');
      repaired = repaired.replace(/"\s*$/, '"');
      
      while (bracketCount > 0) { repaired += "]"; bracketCount--; }
      while (braceCount > 0) { repaired += "}"; braceCount--; }
      
      return repaired;
    }

    async function gerarJSON(prompt: string, maxRetries = 2, maxTokens = 8192): Promise<any> {
      let lastError: any = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[OAB Resumo] Retry ${attempt}/${maxRetries}...`);
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
          
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.5 },
          });
          
          let text = result.response.text();
          const sanitized = sanitizeJsonString(text);
          const repaired = repairJson(sanitized);
          
          try {
            return JSON.parse(repaired);
          } catch {
            const fixed = repaired
              .replace(/,\s*([}\]])/g, "$1")
              .replace(/([{,])\s*}/g, "$1}")
              .replace(/\[\s*,/g, "[")
              .replace(/,\s*,/g, ",");
            return JSON.parse(fixed);
          }
        } catch (err) {
          lastError = err;
          console.error(`[OAB Resumo] Tentativa ${attempt + 1} falhou:`, err);
        }
      }
      
      throw lastError;
    }

    // Prompt base para subtema (mesmo estilo café)
    const promptBase = `Você é um professor experiente explicando Direito para uma pessoa LEIGA.
Seu estilo é como uma CONVERSA DE CAFÉ - descontraído, acolhedor e didático.

═══ PÚBLICO-ALVO ═══
Pessoas que NUNCA estudaram o tema. Assuma ZERO conhecimento prévio.

═══ TOM DE VOZ ═══
- Descontraído, claro e acolhedor
- Use expressões naturais: "Olha só...", "Percebeu?", "Faz sentido, né?", "Na prática..."
- Perguntas guiadas: "E por que isso importa?", "Percebeu a diferença?"
- Seguro e correto tecnicamente
- NUNCA infantilizado ou condescendente

═══ ESTRUTURA DIDÁTICA OBRIGATÓRIA ═══

1. **SIMPLES PRIMEIRO → TÉCNICO DEPOIS (REGRA DE OURO)**
   ❌ ERRADO: "A jurisdição voluntária caracteriza-se por..."
   ✅ CERTO: "Sabe quando duas pessoas concordam com tudo, mas ainda precisam do juiz para oficializar? Isso é o que o Direito chama de 'jurisdição voluntária'."

2. **TRADUÇÃO IMEDIATA de termos técnicos e latim:**
   - "O 'pacta sunt servanda' (significa 'os pactos devem ser cumpridos')"
   - "Isso é o que chamamos de 'trânsito em julgado' (quando não dá mais para recorrer)"

3. **ANALOGIAS DO COTIDIANO**

═══ CUIDADOS ═══
- NÃO use emojis no texto (a interface já adiciona ícones)
- NÃO mencione "PDF", "material", "documento"
- Slides tipo "caso" JÁ SÃO exemplo prático

**Área:** ${areaNome}
**Subtema:** ${subtema}

═══ CONTEÚDO FONTE ═══
${conteudoFonte.substring(0, 15000)}
═══════════════════════`;

    // ETAPA 1: Gerar estrutura
    console.log(`[OAB Resumo] ETAPA 1: Gerando estrutura...`);
    
    const promptEstrutura = `${promptBase}

═══ SUA TAREFA ═══
Crie APENAS a ESTRUTURA/ESQUELETO do conteúdo interativo para este subtema.

Retorne um JSON com esta estrutura:
{
  "titulo": "${subtema}",
  "tempoEstimado": "15 min",
  "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
  "secoes": [
    {
      "id": 1,
      "titulo": "Nome da Seção",
      "paginas": [
        {"tipo": "introducao", "titulo": "O que você vai aprender"},
        {"tipo": "texto", "titulo": "Conceito X"},
        {"tipo": "quickcheck", "titulo": "Verificação"}
      ]
    }
  ]
}

REGRAS:
1. Gere entre 3-5 seções (para alcançar 20-35 páginas totais)
2. Cada seção deve ter 4-8 páginas
3. TIPOS: introducao, texto, termos, atencao, dica, caso, resumo, quickcheck, correspondencias
4. IMPORTANTE: Inclua pelo menos 1 slide "correspondencias" para gamificação
5. Cubra TODO o conteúdo fonte

Retorne APENAS o JSON.`;

    let estrutura: any = null;
    try {
      estrutura = await gerarJSON(promptEstrutura);
      
      if (!estrutura?.secoes || !Array.isArray(estrutura.secoes) || estrutura.secoes.length < 2) {
        throw new Error("Estrutura inválida");
      }
      
      console.log(`[OAB Resumo] ✓ Estrutura: ${estrutura.secoes.length} seções`);
    } catch (err) {
      console.error(`[OAB Resumo] ❌ Erro na estrutura:`, err);
      throw new Error(`Falha ao gerar estrutura: ${err}`);
    }

    // ETAPA 2: Gerar conteúdo por seção
    console.log(`[OAB Resumo] ETAPA 2: Gerando conteúdo por seção...`);
    
    const secoesCompletas: any[] = [];
    const totalSecoes = estrutura.secoes.length;

    for (let i = 0; i < totalSecoes; i++) {
      const secaoEstrutura = estrutura.secoes[i];
      console.log(`[OAB Resumo] Gerando seção ${i + 1}/${totalSecoes}: ${secaoEstrutura.titulo}`);

      const promptSecao = `${promptBase}

═══ SUA TAREFA ═══
Gere o CONTEÚDO COMPLETO para a SEÇÃO ${i + 1}:
Título: "${secaoEstrutura.titulo}"

PÁGINAS A GERAR:
${JSON.stringify(secaoEstrutura.paginas, null, 2)}

Para CADA página, retorne:

1. tipo "texto" (MÍNIMO 200 PALAVRAS):
   {"tipo": "texto", "titulo": "...", "conteudo": "Explicação conversacional completa..."}

2. tipo "quickcheck":
   {"tipo": "quickcheck", "titulo": "...", "pergunta": "...", "opcoes": ["A", "B", "C", "D"], "resposta": 0, "feedback": "..."}

3. tipo "correspondencias" (GAMIFICAÇÃO - jogo de ligar termos):
   {"tipo": "correspondencias", "titulo": "Ligue os Termos", "correspondencias": [
     {"termo": "Termo 1", "definicao": "Definição curta 1"},
     {"termo": "Termo 2", "definicao": "Definição curta 2"}
   ]}

4. outros tipos: introducao, termos, atencao, dica, caso, resumo

RETORNE um JSON:
{
  "id": ${secaoEstrutura.id},
  "titulo": "${secaoEstrutura.titulo}",
  "slides": [...]
}

IMPORTANTE: Use tom conversacional ("Olha só...", "Percebeu?")`;

      try {
        const secaoGerada = await gerarJSON(promptSecao, 2, 8192);
        
        if (secaoGerada?.slides && Array.isArray(secaoGerada.slides)) {
          secoesCompletas.push({
            id: secaoEstrutura.id,
            titulo: secaoEstrutura.titulo,
            slides: secaoGerada.slides
          });
          console.log(`[OAB Resumo] ✓ Seção ${i + 1}: ${secaoGerada.slides.length} slides`);
        }
      } catch (err) {
        console.error(`[OAB Resumo] ⚠️ Erro na seção ${i + 1}:`, err);
      }
    }

    // Adicionar slide de Síntese Final
    const slideSinteseFinal = {
      tipo: "resumo",
      titulo: "Síntese Final",
      conteudo: `Parabéns! Você completou o estudo de **${subtema}**.`,
      pontos: secoesCompletas.flatMap(s => 
        (s.slides || []).slice(0, 2).map((slide: any) => slide.titulo || "")
      ).filter(Boolean).slice(0, 8)
    };

    secoesCompletas.push({
      id: secoesCompletas.length + 1,
      titulo: "Síntese Final",
      slides: [slideSinteseFinal]
    });

    // Montar estrutura final
    const totalPaginas = secoesCompletas.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
    
    const slidesJson = {
      versao: 2,
      titulo: subtema,
      tempoEstimado: estrutura.tempoEstimado || "15 min",
      area: areaNome,
      objetivos: estrutura.objetivos || [],
      secoes: secoesCompletas
    };

    const conteudoGerado = {
      secoes: secoesCompletas,
      objetivos: estrutura.objetivos || [],
      paginas: secoesCompletas.flatMap(s => s.slides || []).map((slide: any) => ({
        titulo: slide.titulo,
        tipo: slide.tipo,
        markdown: slide.conteudo
      }))
    };

    // Salvar no banco
    const { error: updateError } = await supabase
      .from("RESUMO")
      .update({
        slides_json: slidesJson,
        conteudo_gerado: conteudoGerado
      })
      .eq("id", resumo_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`[OAB Resumo] ✅ Conteúdo salvo com sucesso: ${subtema}`);
    console.log(`[OAB Resumo] Stats: ${totalPaginas} slides, ${secoesCompletas.length} seções`);

  } catch (error: any) {
    console.error("[OAB Resumo] ❌ Erro no processamento:", error);

    try {
      await supabase
        .from("RESUMO")
        .update({
          conteudo_gerado: JSON.stringify({
            erro: true,
            mensagem: "Erro ao gerar conteúdo",
            detalhe: error.message || "Erro desconhecido"
          })
        })
        .eq("id", resumo_id);
    } catch (catchErr) {
      console.error("[OAB Resumo] Erro ao salvar erro:", catchErr);
    }
  }
}
