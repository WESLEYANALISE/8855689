import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Constantes de configuração
const MIN_PAGINAS = 8;
const MAX_TENTATIVAS = 3;
// Se uma geração ficar marcada como "gerando" por muito tempo, consideramos travada.
const STALE_GERACAO_MS = 12 * 60 * 1000; // 12 min

function isStaleGeracao(updatedAt: string | null | undefined) {
  if (!updatedAt) return false;
  const ts = Date.parse(updatedAt);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts > STALE_GERACAO_MS;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Guardar referências para o catch (req.json só pode ser lido 1x)
  let topicoIdForCatch: number | null = null;
  let supabaseForCatch: any = null;

  try {
    const { topico_id, force_restart } = await req.json();
    topicoIdForCatch = topico_id ?? null;
    
    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: "topico_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    supabaseForCatch = supabase;

    // ============================================
    // SISTEMA DE FILA: Verificar se já há geração ativa
    // ============================================
    const { data: gerandoAtivo, error: checkError } = await supabase
      .from("conceitos_topicos")
      .select("id, titulo, updated_at")
      .eq("status", "gerando")
      .neq("id", topico_id)
      .limit(1);

    // Se existir um "gerando" antigo demais, ele provavelmente travou.
    // Para não bloquear a fila indefinidamente, marcamos como erro e seguimos.
    if (!checkError && gerandoAtivo && gerandoAtivo.length > 0) {
      const ativo = gerandoAtivo[0] as { id: number; titulo: string; updated_at?: string | null };
      if (isStaleGeracao(ativo.updated_at)) {
        console.log(`[Conceitos Fila] ⚠️ Geração travada detectada (stale): ${ativo.titulo} (ID: ${ativo.id}). Marcando como erro e liberando fila.`);
        await supabase
          .from("conceitos_topicos")
          .update({ status: "erro", progresso: 0, updated_at: new Date().toISOString() })
          .eq("id", ativo.id);
      }
    }

    // Recarregar após possível limpeza de "stale" acima
    const { data: gerandoAtivoAtual, error: checkError2 } = await supabase
      .from("conceitos_topicos")
      .select("id, titulo")
      .eq("status", "gerando")
      .neq("id", topico_id)
      .limit(1);

    if (!checkError2 && gerandoAtivoAtual && gerandoAtivoAtual.length > 0) {
      console.log(`[Conceitos Fila] Geração ativa detectada: ${gerandoAtivoAtual[0].titulo} (ID: ${gerandoAtivoAtual[0].id})`);
      
      // Calcular próxima posição na fila
      const { data: maxPosicao } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      // Verificar se já está na fila
      const { data: jaEnfileirado } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila, status")
        .eq("id", topico_id)
        .single();
      
      if (jaEnfileirado?.status === "na_fila") {
        // Já está na fila, retornar posição atual
        const { count: totalFila } = await supabase
          .from("conceitos_topicos")
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
      
      // Colocar na fila
      await supabase
        .from("conceitos_topicos")
        .update({ 
          status: "na_fila", 
          posicao_fila: novaPosicao,
          updated_at: new Date().toISOString() 
        })
        .eq("id", topico_id);
      
      // Contar total na fila
      const { count: totalFila } = await supabase
        .from("conceitos_topicos")
        .select("id", { count: "exact", head: true })
        .eq("status", "na_fila");
      
      console.log(`[Conceitos Fila] Tópico ${topico_id} adicionado na posição ${novaPosicao} (total: ${totalFila})`);
      
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

    // ============================================
    // INÍCIO DA GERAÇÃO
    // ============================================

    // Buscar tópico com matéria
    const { data: topico, error: topicoError } = await supabase
      .from("conceitos_topicos")
      .select(`
        *,
        materia:conceitos_materias(id, nome, codigo)
      `)
      .eq("id", topico_id)
      .single();

    if (topicoError || !topico) {
      return new Response(
        JSON.stringify({ error: "Tópico não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se já está gerando (permitir restart forçado)
    const shouldForceRestart = Boolean(force_restart) || (topico.status === "gerando" && isStaleGeracao(topico.updated_at));

    if (topico.status === "gerando" && !shouldForceRestart) {
      return new Response(
        JSON.stringify({ message: "Geração já em andamento" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "gerando" && shouldForceRestart) {
      console.log(`[Conceitos] 🔁 Reiniciando geração (force/stale) para topico_id=${topico_id}`);
    }

    // Se o usuário pediu force_restart, permitimos recomeçar do zero (inclusive após 3/3)
    const tentativasBase = shouldForceRestart ? 0 : (topico.tentativas || 0);

    // Marcar como gerando com progresso inicial, limpar posição da fila
    const posicaoRemovida = topico.posicao_fila;
    
    await supabase
      .from("conceitos_topicos")
      .update({ 
        status: "gerando", 
        progresso: 5,
        tentativas: tentativasBase,
        posicao_fila: null,
        updated_at: new Date().toISOString() 
      })
      .eq("id", topico_id);

    // Atualizar posições na fila (decrementar todos acima da posição removida)
    if (posicaoRemovida) {
      // Buscar todos na fila com posição maior e atualizar
      const { data: filaParaAtualizar } = await supabase
        .from("conceitos_topicos")
        .select("id, posicao_fila")
        .eq("status", "na_fila")
        .gt("posicao_fila", posicaoRemovida);
      
      if (filaParaAtualizar && filaParaAtualizar.length > 0) {
        for (const item of filaParaAtualizar) {
          await supabase
            .from("conceitos_topicos")
            .update({ posicao_fila: (item.posicao_fila || 1) - 1 })
            .eq("id", item.id);
        }
        console.log(`[Conceitos Fila] Posições atualizadas: ${filaParaAtualizar.length} itens`);
      }
    }

    // Função auxiliar para atualizar progresso
    const updateProgress = async (value: number) => {
      await supabase
        .from("conceitos_topicos")
        .update({ progresso: value })
        .eq("id", topico_id);
    };

    const materiaNome = topico.materia?.nome || "";
    const topicoTitulo = topico.titulo;
    const tentativasAtuais = tentativasBase;

    console.log(`[Conceitos] Gerando conteúdo para: ${materiaNome} - ${topicoTitulo} (tentativa ${tentativasAtuais + 1})`);

    // 1. Buscar TODO o conteúdo extraído das páginas do PDF
    await updateProgress(10);
    const { data: paginas, error: paginasError } = await supabase
      .from("conceitos_materia_paginas")
      .select("pagina, conteudo")
      .eq("materia_id", topico.materia?.id)
      .gte("pagina", topico.pagina_inicial || 1)
      .lte("pagina", topico.pagina_final || 999)
      .order("pagina", { ascending: true });

    let conteudoPDF = "";
    if (paginas && paginas.length > 0) {
      conteudoPDF = paginas
        .filter(p => p.conteudo && p.conteudo.trim().length > 0)
        .map(p => `\n--- PÁGINA ${p.pagina} ---\n${p.conteudo}`)
        .join("\n\n");
      console.log(`[Conceitos] PDF: ${paginas.length} páginas, ${conteudoPDF.length} caracteres`);
    } else {
      console.log("[Conceitos] ALERTA: Nenhuma página do PDF encontrada!");
    }

    await updateProgress(20);

    // 2. Buscar contexto adicional do RESUMO se existir
    let conteudoResumo = "";
    const { data: resumos } = await supabase
      .from("RESUMO")
      .select("conteudo, subtema")
      .or(`subtema.ilike.%${topicoTitulo}%,tema.ilike.%${topicoTitulo}%`)
      .limit(5);

    if (resumos && resumos.length > 0) {
      conteudoResumo = resumos.map(r => {
        const sub = r.subtema ? `### ${r.subtema}\n` : "";
        return sub + (r.conteudo || "");
      }).join("\n\n");
      console.log(`[Conceitos] RESUMO: ${resumos.length} subtemas`);
    }

    await updateProgress(30);

    // 3. Configurar Gemini - IGUAL À OAB (escolha aleatória de chave)
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
    ].filter(Boolean);

    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 4. PROMPT - Igual OAB mas para iniciantes
    const prompt = `Você é um professor de Direito acolhedor e didático, especializado em ensinar INICIANTES.
Seu estilo é como uma CONVERSA COM UM AMIGO - você explica os conceitos como se estivesse ajudando alguém que está começando agora a estudar Direito.

## 🎯 SEU ESTILO DE ESCRITA OBRIGATÓRIO:

### ✅ FAÇA SEMPRE:
- Escreva como se estivesse CONVERSANDO com o estudante iniciante
- Use expressões naturais como:
  • "Olha só, você está começando a entender uma das bases do Direito..."
  • "Veja bem, isso aqui é fundamental pra sua formação..."
  • "Sabe quando você ouve falar de...? Pois é, é isso que vamos entender!"
  • "Deixa eu te explicar de um jeito mais simples..."
  • "Esse é um conceito que você vai usar em toda sua carreira jurídica!"
  • "Calma, parece complicado, mas vou te mostrar passo a passo..."
- Use perguntas retóricas para engajar
- Faça analogias com situações do dia a dia
- Antecipe dúvidas ("Você pode estar pensando: mas o que isso significa na prática?")
- A cada conceito importante, explique de forma simples antes de aprofundar

### ❌ NÃO FAÇA:
- Linguagem excessivamente formal/acadêmica
- Parágrafos longos e densos sem pausas
- Explicações secas e diretas demais
- Texto que pareça copiado de um livro jurídico
- **NUNCA USE EMOJIS NO TEXTO**

═══════════════════════════════════════════════════════════════════
⛔⛔⛔ REGRA ABSOLUTA: FIDELIDADE 100% AO CONTEÚDO DO PDF ⛔⛔⛔
═══════════════════════════════════════════════════════════════════

O CONTEÚDO ABAIXO FOI EXTRAÍDO DE UM PDF OFICIAL. VOCÊ DEVE:
✅ Usar 100% do texto e informações do PDF
✅ Citar APENAS artigos/leis que aparecem LITERALMENTE no PDF
✅ Explicar cada conceito presente no material de forma didática
✅ NÃO pular nenhum tópico ou seção do PDF

VOCÊ NÃO PODE:
❌ INVENTAR artigos de lei que NÃO estejam no PDF
❌ ADICIONAR citações legais que você "sabe" mas NÃO estão no conteúdo
❌ CRIAR jurisprudência ou números de processos não presentes
❌ OMITIR informações importantes do PDF

## INFORMAÇÕES DO TEMA
**Matéria:** ${materiaNome}
**Tópico:** ${topicoTitulo}

═══════════════════════════════════════════════════════════════════
📄 CONTEÚDO COMPLETO DO PDF (USE 100% DESTE MATERIAL):
═══════════════════════════════════════════════════════════════════

${conteudoPDF || "Conteúdo do PDF não disponível"}

${conteudoResumo ? `
═══════════════════════════════════════════════════════════════════
📚 CONTEXTO ADICIONAL:
═══════════════════════════════════════════════════════════════════

${conteudoResumo}
` : ""}

═══════════════════════════════════════════════════════════════════
📝 SUA MISSÃO: GERAR CONTEÚDO COM EXATAMENTE 8 PÁGINAS
═══════════════════════════════════════════════════════════════════

Crie um material de estudo em formato JSON com EXATAMENTE 8 PÁGINAS:

### ESTRUTURA OBRIGATÓRIA (8 PÁGINAS):

**PÁGINA 1 - INTRODUÇÃO** (Tom: acolhedor e motivador para INICIANTES)
- Tipo: "introducao"
- Comece com algo engajador: "Você está começando sua jornada no Direito..."
- Visão geral do tema em 300-500 palavras
- Contextualize a importância
- "Ao final dessa trilha, você vai dominar..."

**PÁGINA 2 - CONTEÚDO COMPLETO** (Tom: professor explicando para iniciante)
- Tipo: "conteudo_principal"
- Explique TODO o tema usando 100% do conteúdo do PDF
- Organize com subtítulos claros (##, ###)
- Use tom CONVERSACIONAL
- Cite os artigos de lei EXATAMENTE como aparecem no PDF
- Mínimo 3000 palavras - cubra TUDO do PDF

**PÁGINA 3 - DESMEMBRANDO** (Tom: "Agora vou destrinchar cada parte...")
- Tipo: "desmembrando"
- Análise detalhada de cada elemento importante
- Decomponha conceitos complexos em partes menores

**PÁGINA 4 - ENTENDENDO NA PRÁTICA** (Tom: "Imagina essa situação...")
- Tipo: "entendendo_na_pratica"
- Casos práticos do dia a dia baseados no conteúdo
- Situações reais de aplicação

**PÁGINA 5 - QUADRO COMPARATIVO**
- Tipo: "quadro_comparativo"
- Tabelas comparativas dos principais conceitos
- Use formato Markdown de tabela

**PÁGINA 6 - DICAS PARA MEMORIZAR** (Tom: "Olha esse truque...")
- Tipo: "dicas_provas"
- Técnicas de memorização (mnemônicos, associações)
- Pontos mais importantes para lembrar

**PÁGINA 7 - LIGAR TERMOS (EXERCÍCIO INTERATIVO)**
- Tipo: "correspondencias"
- NÃO é conteúdo markdown normal!
- Será um jogo de arrastar e conectar termos às definições
- O conteúdo deve ser apenas uma introdução breve
- Os dados reais do jogo vão no campo "correspondencias" separado

**PÁGINA 8 - SÍNTESE FINAL** (Tom: "Recapitulando tudo que vimos...")
- Tipo: "sintese_final"
- Resumo de todos os pontos-chave
- Checklist do que você aprendeu

### FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):

\`\`\`json
{
  "paginas": [
    {
      "titulo": "Introdução: ${topicoTitulo}",
      "tipo": "introducao",
      "markdown": "# Bem-vindo ao estudo de ${topicoTitulo}!\\n\\n[Visão geral acolhedora]"
    },
    {
      "titulo": "Conteúdo Completo: ${topicoTitulo}",
      "tipo": "conteudo_principal",
      "markdown": "# ${topicoTitulo}\\n\\n[TODO o conteúdo do PDF em 3000+ palavras]"
    },
    {
      "titulo": "Desmembrando o Tema",
      "tipo": "desmembrando",
      "markdown": "# Desmembrando\\n\\n[Análise detalhada]"
    },
    {
      "titulo": "Entendendo na Prática",
      "tipo": "entendendo_na_pratica",
      "markdown": "# Entendendo na Prática\\n\\n[Casos práticos]"
    },
    {
      "titulo": "Quadro Comparativo",
      "tipo": "quadro_comparativo",
      "markdown": "# Quadro Comparativo\\n\\n[Tabelas comparativas]"
    },
    {
      "titulo": "Dicas para Memorizar",
      "tipo": "dicas_provas",
      "markdown": "# Dicas para Memorizar\\n\\n[Técnicas e mnemônicos]"
    },
    {
      "titulo": "Ligar Termos",
      "tipo": "correspondencias",
      "markdown": "# Exercício: Ligar Termos\\n\\nConecte cada termo à sua definição correta."
    },
    {
      "titulo": "Síntese Final",
      "tipo": "sintese_final",
      "markdown": "# Síntese Final\\n\\n[Resumo e checklist]"
    }
  ],
  "correspondencias": [
    {
      "termo": "Nome do termo/conceito do PDF",
      "definicao": "Definição correspondente do PDF"
    },
    {
      "termo": "Outro termo",
      "definicao": "Outra definição"
    }
  ],
  "exemplos": [
    {
      "titulo": "Título do caso",
      "situacao": "Descrição do caso prático",
      "analise": "Análise",
      "conclusao": "Conclusão"
    }
  ],
  "termos": [
    {
      "termo": "Termo do PDF",
      "definicao": "Definição conforme o PDF"
    }
  ],
  "flashcards": [
    {
      "frente": "Pergunta baseada no PDF",
      "verso": "Resposta do PDF",
      "exemplo": "Exemplo prático"
    }
  ],
  "questoes": [
    {
      "pergunta": "Enunciado",
      "alternativas": ["A)", "B)", "C)", "D)"],
      "correta": 0,
      "explicacao": "Explicação"
    }
  ]
}
\`\`\`

### QUANTIDADES OBRIGATÓRIAS:
- Páginas: EXATAMENTE 8 páginas (estrutura acima)
- Página 2 (Conteúdo): Mínimo 3000 palavras
- Correspondências: Mínimo 8 pares termo/definição para o jogo
- Exemplos: Mínimo 5 casos práticos
- Termos: Mínimo 10 termos jurídicos
- Flashcards: Mínimo 15 flashcards
- Questões: Mínimo 8 questões

IMPORTANTE: 
- Use ABSOLUTAMENTE TODO o conteúdo do PDF
- NÃO invente artigos ou citações legais
- MANTENHA O TOM CONVERSACIONAL em todas as páginas
- O campo "correspondencias" é SEPARADO das páginas - são os dados para o jogo interativo
- Retorne APENAS o JSON válido, sem texto adicional`;

    // 5. Função auxiliar para gerar e continuar se truncado - IGUAL À OAB
    async function gerarComContinuacao(promptInicial: string, maxTentativas = 3): Promise<string> {
      let textoCompleto = "";
      let tentativas = 0;
      let promptAtual = promptInicial;
      
      while (tentativas < maxTentativas) {
        tentativas++;
        console.log(`[Conceitos] Chamando Gemini (tentativa ${tentativas})...`);
        
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: promptAtual }] }],
          generationConfig: {
            maxOutputTokens: 65000,
            temperature: 0.6,
          },
        });
        
        const responseText = result.response.text();
        textoCompleto += responseText;
        console.log(`[Conceitos] Resposta ${tentativas}: ${responseText.length} chars`);
        
        // Verificar se a resposta está completa (tem o fechamento do JSON)
        const temFechamento = textoCompleto.includes('"questoes"') && 
                              textoCompleto.trim().endsWith("}") ||
                              textoCompleto.includes("```") && textoCompleto.lastIndexOf("```") > textoCompleto.lastIndexOf("```json");
        
        // Verificar se parece truncado no meio de uma string ou array
        const pareceTruncado = !temFechamento && (
          responseText.trim().endsWith(",") ||
          responseText.trim().endsWith('"') ||
          responseText.trim().endsWith("[") ||
          responseText.trim().endsWith("{") ||
          !responseText.includes("questoes")
        );
        
        if (!pareceTruncado) {
          console.log(`[Conceitos] Resposta completa após ${tentativas} tentativa(s)`);
          break;
        }
        
        console.log(`[Conceitos] Resposta truncada, solicitando continuação...`);
        
        // Preparar prompt de continuação com contexto
        const ultimasLinhas = responseText.slice(-500);
        promptAtual = `CONTINUE exatamente de onde parou. A resposta anterior terminou com:

"""
${ultimasLinhas}
"""

Continue gerando o JSON a partir deste ponto. NÃO repita o que já foi gerado. 
Mantenha a mesma estrutura e formato JSON.
Complete TODAS as seções que faltam: correspondencias, exemplos, termos, flashcards, questoes.
Termine com o fechamento correto do JSON.`;
      }
      
      return textoCompleto;
    }

    // Gerar conteúdo com lógica de continuação
    await updateProgress(50);
    const responseText = await gerarComContinuacao(prompt);
    await updateProgress(70);
    console.log(`[Conceitos] Resposta final: ${responseText.length} chars`);
    
    // Extrair JSON da resposta (pode estar em múltiplas partes)
    let jsonStr = responseText;
    
    // Remover marcadores de código duplicados se houver
    jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "");

    // Escolher o melhor candidato de JSON (evita pegar um "{" que apareça dentro do markdown)
    function pickBestJsonCandidate(text: string) {
      const hay = text;
      const candidates: { start: number; score: number }[] = [];
      for (let i = 0; i < hay.length; i++) {
        if (hay[i] !== "{") continue;
        const window = hay.slice(i, i + 800);
        // Heurística: JSON real deve conter "paginas" muito cedo.
        const hasPaginas = window.includes('"paginas"') || window.includes('"páginas"');
        const hasQuestoes = window.includes('"questoes"') || window.includes('"questões"');
        if (!hasPaginas) continue;
        const score = (hasPaginas ? 5 : 0) + (hasQuestoes ? 2 : 0);
        candidates.push({ start: i, score });
      }
      if (candidates.length === 0) return hay;
      candidates.sort((a, b) => b.score - a.score || a.start - b.start);
      const best = candidates[0];
      const tail = hay.slice(best.start);
      const end = tail.lastIndexOf("}");
      return end !== -1 ? tail.slice(0, end + 1) : tail;
    }

    jsonStr = pickBestJsonCandidate(jsonStr);
    
    // Encontrar o JSON principal
    const jsonStart = jsonStr.indexOf("{");
    const jsonEnd = jsonStr.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
    }

    // Debug para entender falhas de parse (primeiros chars + seus códigos)
    const head = jsonStr.slice(0, 80);
    const headCodes = head.split("").map((c) => c.charCodeAt(0));
    console.log("[Conceitos] JSON head:", head);
    console.log("[Conceitos] JSON head codes:", headCodes);
    
    function normalizeJsonLoose(input: string) {
      let s = input.trim();

      // Remove BOM
      s = s.replace(/^\uFEFF/, "");

      // Normaliza aspas “inteligentes”
      s = s
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");

      // Se a IA devolveu algo como { paginas: [...] }, coloca aspas nas chaves
      // ({, ou ,) + key + :  ->  "key":
      s = s.replace(/([\{,]\s*)([A-Za-z_][A-Za-z0-9_\-]*)\s*:/g, '$1"$2":');

      // Troca strings com aspas simples por aspas duplas quando parecer JSON (conservador)
      // Ex: 'paginas' -> "paginas"
      s = s.replace(/'([A-Za-z_][A-Za-z0-9_\-]*)'/g, '"$1"');

      // Remove vírgula antes de fechamento
      s = s.replace(/,\s*([}\]])/g, "$1");

      return s;
    }

    // Escapa \n/\r/\t SOMENTE quando estiver dentro de strings JSON.
    // Fora de strings, mantém newlines como whitespace (válido em JSON).
    function escapeControlsInStringsOnly(input: string) {
      let out = "";
      let inStr = false;
      let esc = false;

      for (let i = 0; i < input.length; i++) {
        const c = input[i];
        const code = c.charCodeAt(0);

        if (!inStr) {
          if (c === '"') {
            inStr = true;
            out += c;
            continue;
          }
          // Fora de string: mantém whitespace normal (\n/\r/\t) e remove outros controles.
          if (code < 32 && c !== "\n" && c !== "\r" && c !== "\t") continue;
          out += c;
          continue;
        }

        // Dentro de string
        if (esc) {
          out += c;
          esc = false;
          continue;
        }
        if (c === "\\") {
          out += c;
          esc = true;
          continue;
        }
        if (c === '"') {
          out += c;
          inStr = false;
          continue;
        }
        if (c === "\n") {
          out += "\\n";
          continue;
        }
        if (c === "\r") {
          out += "\\r";
          continue;
        }
        if (c === "\t") {
          out += "\\t";
          continue;
        }
        if (code < 32) continue;
        out += c;
      }

      return out;
    }

    // Tentar corrigir JSON truncado se necessário - IGUAL À OAB + normalização extra
    let conteudoGerado;
    try {
      // Sanitizar caracteres de controle antes do parse
      const sanitizedJson = escapeControlsInStringsOnly(normalizeJsonLoose(jsonStr));
      conteudoGerado = JSON.parse(sanitizedJson);
    } catch (parseError) {
      console.log("[Conceitos] Erro no parse, tentando corrigir JSON...");
      
      // Sanitizar caracteres de controle
      let jsonCorrigido = escapeControlsInStringsOnly(normalizeJsonLoose(jsonStr));
      
      // Adicionar fechamentos faltantes
      const aberturasObj = (jsonCorrigido.match(/{/g) || []).length;
      const fechamentosObj = (jsonCorrigido.match(/}/g) || []).length;
      const aberturasArr = (jsonCorrigido.match(/\[/g) || []).length;
      const fechamentosArr = (jsonCorrigido.match(/]/g) || []).length;
      
      // Adicionar fechamentos faltantes
      for (let i = 0; i < aberturasArr - fechamentosArr; i++) {
        jsonCorrigido += "]";
      }
      for (let i = 0; i < aberturasObj - fechamentosObj; i++) {
        jsonCorrigido += "}";
      }
      
      // Remover vírgula antes de fechamento
      jsonCorrigido = jsonCorrigido.replace(/,\s*([}\]])/g, "$1");
      
      try {
        conteudoGerado = JSON.parse(jsonCorrigido);
        console.log("[Conceitos] JSON corrigido com sucesso");
      } catch (finalError) {
        console.error("[Conceitos] Falha definitiva no parse JSON:", finalError);
        // Marcar como erro para tentar novamente depois
        await supabase.from("conceitos_topicos")
          .update({ status: "erro", progresso: 0 })
          .eq("id", topico_id);
        throw new Error("Falha ao processar resposta da IA");
      }
    }

    // 6. Processar o conteúdo das páginas
    let conteudoPrincipal = "";
    const numPaginas = conteudoGerado.paginas?.length || 0;
    
    if (conteudoGerado.paginas && Array.isArray(conteudoGerado.paginas)) {
      // Concatenar todas as páginas em um único markdown com separadores
      conteudoPrincipal = conteudoGerado.paginas
        .map((p: any, i: number) => {
          const separador = i > 0 ? "\n\n---\n\n" : "";
          return `${separador}${p.markdown || ""}`;
        })
        .join("");
      
      console.log(`[Conceitos] ${numPaginas} páginas geradas`);
    } else {
      // Fallback para formato antigo
      conteudoPrincipal = conteudoGerado.conteudo || "";
    }

    // ============================================
    // VALIDAÇÃO DE PÁGINAS E REPROCESSAMENTO AUTOMÁTICO
    // ============================================
    if (numPaginas < MIN_PAGINAS) {
      console.log(`[Conceitos Fila] ⚠️ Apenas ${numPaginas} páginas (mínimo: ${MIN_PAGINAS})`);
      
      const novasTentativas = tentativasAtuais + 1;
      
      if (novasTentativas >= MAX_TENTATIVAS) {
        console.log(`[Conceitos Fila] ❌ Máximo de tentativas (${MAX_TENTATIVAS}) atingido, marcando como erro`);
        await supabase.from("conceitos_topicos")
          .update({ 
            status: "erro", 
            tentativas: novasTentativas,
            progresso: 0 
          })
          .eq("id", topico_id);
        
        // Processar próximo da fila
        await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
        
        return new Response(
          JSON.stringify({ 
            error: `Falha após ${MAX_TENTATIVAS} tentativas (${numPaginas}/${MIN_PAGINAS} páginas)`,
            tentativas: novasTentativas
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Calcular próxima posição na fila
      const { data: maxPosicao } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      console.log(`[Conceitos Fila] Recolocando na fila: posição ${novaPosicao}, tentativa ${novasTentativas + 1}`);
      
      // Limpar conteúdo e recolocar no final da fila
      await supabase.from("conceitos_topicos")
        .update({ 
          status: "na_fila", 
          posicao_fila: novaPosicao,
          tentativas: novasTentativas,
          conteudo_gerado: null,
          progresso: 0
        })
        .eq("id", topico_id);
      
      // Processar próximo da fila
      await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
      
      return new Response(
        JSON.stringify({ 
          requeued: true,
          reason: `${numPaginas}/${MIN_PAGINAS} páginas`,
          position: novaPosicao,
          tentativas: novasTentativas + 1
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. VALIDAR correspondências antes de salvar - mínimo 8 pares para o jogo "Ligar Termos"
    await updateProgress(85);
    let correspondenciasValidas = conteudoGerado.correspondencias || [];
    
    // Verificar se tem correspondências suficientes
    if (!Array.isArray(correspondenciasValidas) || correspondenciasValidas.length < 8) {
      console.log(`[Conceitos] ⚠️ Correspondências insuficientes (${correspondenciasValidas.length}), tentando extrair do conteúdo...`);
      
      // Tentar extrair correspondências a partir das páginas
      const paginaLigarTermos = conteudoGerado.paginas?.find((p: any) => 
        p.titulo?.toLowerCase().includes("ligar") || 
        p.tipo === "correspondencias" ||
        p.markdown?.toLowerCase().includes("ligar termos")
      );
      
      // Extrair termos do próprio conteúdo se existirem listas de termos/definições
      if (paginaLigarTermos?.dados_interativos?.pares) {
        correspondenciasValidas = paginaLigarTermos.dados_interativos.pares;
        console.log(`[Conceitos] ✓ Extraídas ${correspondenciasValidas.length} correspondências da página 7`);
      } else if (conteudoGerado.termos && Array.isArray(conteudoGerado.termos) && conteudoGerado.termos.length >= 8) {
        // Converter termos do glossário em correspondências (usar descrição curta)
        correspondenciasValidas = conteudoGerado.termos.slice(0, 10).map((t: any) => ({
          termo: t.termo || t.nome || t,
          definicao: t.definicao?.substring(0, 60) || t.descricao?.substring(0, 60) || "Conceito jurídico"
        }));
        console.log(`[Conceitos] ✓ Convertidos ${correspondenciasValidas.length} termos em correspondências`);
      }
    }
    
    // Validar cada par de correspondência
    correspondenciasValidas = correspondenciasValidas
      .filter((c: any) => c && c.termo && c.definicao)
      .slice(0, 10) // Máximo 10 pares
      .map((c: any) => ({
        termo: String(c.termo).trim().substring(0, 50),
        definicao: String(c.definicao).trim().substring(0, 80)
      }));
    
    console.log(`[Conceitos] Correspondências finais: ${correspondenciasValidas.length} pares válidos`);
    
    // Se ainda não tiver correspondências suficientes, marcar como erro para retry
    if (correspondenciasValidas.length < 6) {
      console.error(`[Conceitos] ❌ Falha: apenas ${correspondenciasValidas.length} correspondências (mínimo 6)`);
      await supabase.from("conceitos_topicos")
        .update({ status: "erro", progresso: 80 })
        .eq("id", topico_id);
      throw new Error(`Correspondências insuficientes para o jogo Ligar Termos (${correspondenciasValidas.length}/6)`);
    }
    
    const termosComCorrespondencias = {
      glossario: conteudoGerado.termos || [],
      correspondencias: correspondenciasValidas
    };
    
    const { error: updateError } = await supabase
      .from("conceitos_topicos")
      .update({
        conteudo_gerado: conteudoPrincipal,
        exemplos: conteudoGerado.exemplos || [],
        termos: termosComCorrespondencias,
        flashcards: conteudoGerado.flashcards || [],
        questoes: conteudoGerado.questoes || [],
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

    console.log(`[Conceitos] ✅ Conteúdo salvo com sucesso: ${topicoTitulo}`);
    console.log(`[Conceitos] Stats: ${numPaginas} páginas, ${correspondenciasValidas.length} correspondências, ${conteudoGerado.flashcards?.length || 0} flashcards`);

    // 8. NÃO gerar capa automaticamente - usar capa da matéria
    console.log("[Conceitos] Capa será herdada da matéria, não gerando individual");

    // ============================================
    // PROCESSAR PRÓXIMO DA FILA
    // ============================================
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conteúdo gerado com sucesso - 8 páginas incluindo Ligar Termos",
        topico_id,
        titulo: topicoTitulo,
        materia: materiaNome,
        paginas: numPaginas,
        stats: {
          correspondencias: correspondenciasValidas.length,
          exemplos: conteudoGerado.exemplos?.length || 0,
          termos: conteudoGerado.termos?.length || 0,
          flashcards: conteudoGerado.flashcards?.length || 0,
          questoes: conteudoGerado.questoes?.length || 0,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[Conceitos] ❌ Erro ao gerar conteúdo:", error);
    console.log(`[Conceitos] ❌ Erro detalhado:`, {
      topico_id: topicoIdForCatch,
      erro: error.message,
      stack: error.stack?.substring(0, 500)
    });

    // Tentar fazer retry automático
    try {
      if (topicoIdForCatch) {
        const supabase = supabaseForCatch || createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Buscar tentativas atuais
        const { data: topicoAtual } = await supabase
          .from("conceitos_topicos")
          .select("tentativas")
          .eq("id", topicoIdForCatch)
          .single();

        const tentativas = (topicoAtual?.tentativas || 0) + 1;

        if (tentativas < MAX_TENTATIVAS) {
          // Calcular próxima posição na fila
          const { data: maxPos } = await supabase
            .from("conceitos_topicos")
            .select("posicao_fila")
            .eq("status", "na_fila")
            .order("posicao_fila", { ascending: false })
            .limit(1)
            .single();

          const novaPosicao = (maxPos?.posicao_fila || 0) + 1;

          // Recolocar na fila para nova tentativa
          await supabase
            .from("conceitos_topicos")
            .update({ 
              status: "na_fila", 
              posicao_fila: novaPosicao,
              tentativas,
              progresso: 0,
              conteudo_gerado: null,
              updated_at: new Date().toISOString()
            })
            .eq("id", topicoIdForCatch);

          console.log(`[Conceitos Fila] ♻️ Erro recuperável, recolocando na fila (tentativa ${tentativas}/${MAX_TENTATIVAS})`);
        } else {
          // Esgotou tentativas, marcar como erro definitivo
          await supabase
            .from("conceitos_topicos")
            .update({ status: "erro", tentativas, progresso: 0, updated_at: new Date().toISOString() })
            .eq("id", topicoIdForCatch);

          console.log(`[Conceitos Fila] ❌ Erro após ${MAX_TENTATIVAS} tentativas, marcando como falha definitiva`);
        }
        
        // Processar próximo da fila mesmo em caso de erro
        await processarProximoDaFila(
          supabase, 
          Deno.env.get("SUPABASE_URL")!, 
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
      }
    } catch (catchErr) {
      console.error("[Conceitos] Erro ao processar falha:", catchErr);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função auxiliar para processar próximo item da fila - IGUAL À OAB
async function processarProximoDaFila(supabase: any, supabaseUrl: string, supabaseServiceKey: string) {
  try {
    const { data: proximo, error } = await supabase
      .from("conceitos_topicos")
      .select("id, titulo")
      .eq("status", "na_fila")
      .order("posicao_fila", { ascending: true })
      .limit(1)
      .single();

    if (error || !proximo) {
      console.log("[Conceitos Fila] Nenhum item na fila para processar");
      return;
    }

    console.log(`[Conceitos Fila] Iniciando próximo da fila: ${proximo.titulo} (ID: ${proximo.id})`);

    // Usar fetch diretamente para não bloquear a resposta atual
    const functionUrl = `${supabaseUrl}/functions/v1/gerar-conteudo-conceitos`;
    
    fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ topico_id: proximo.id }),
    }).catch(err => {
      console.error("[Conceitos Fila] Erro ao iniciar próximo:", err);
    });
    
  } catch (err) {
    console.error("[Conceitos Fila] Erro ao buscar próximo da fila:", err);
  }
}
