import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const VERSION = "v1.0.0-categorias";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_PAGINAS = 40;
const MAX_TENTATIVAS = 3;

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

    console.log(`[Categorias] Gerando: ${topicoTitulo} (área: ${areaNome}, categoria: ${categoriaNome})`);

    // Buscar conteúdo extraído das páginas
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

    // Configurar Gemini
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

    async function gerarJSON(prompt: string, maxRetries = 2, maxTokens = 8192): Promise<any> {
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
          try { return JSON.parse(repaired); } catch {
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
      ];
      let resultado = texto;
      for (const regex of saudacoes) resultado = resultado.replace(regex, '');
      if (resultado.length > 0 && /^[a-z]/.test(resultado))
        resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
      return resultado.trim();
    };

    // PROMPT BASE - Adaptado para estudo genérico (sem OAB)
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

2. **TRADUÇÃO IMEDIATA de termos técnicos e latim**

3. **ANALOGIAS DO COTIDIANO**

═══ CUIDADOS ═══
- NÃO use emojis no texto corrido
- NÃO mencione "PDF", "material", "documento"
- NÃO mencione "OAB", "prova da OAB" ou "exame de ordem" - foque no ESTUDO da área
- Slides tipo "caso" JÁ SÃO exemplo prático

═══ GRIFO E ÊNFASE (OBRIGATÓRIO) ═══
Termos-chave em NEGRITO + ASPAS: **'competência absoluta'**, **'Art. 5º da CF'**, **'30 dias'**

═══ CITAÇÕES DE ARTIGOS ═══
Use BLOCKQUOTE: > "Art. 5º - Todos são iguais perante a lei..." (CF/88)

═══ PROFUNDIDADE ═══
- Mínimo 250-400 palavras em slides tipo "texto"
- Cite artigos de lei de forma acessível
- Termos-chave em negrito + aspas

**Categoria:** ${categoriaNome}
**Matéria:** ${areaNome}
**Tópico:** ${topicoTitulo}

═══ REFERÊNCIA DE ESTUDO ═══
${conteudoPDF || "Conteúdo não disponível - gere com base no seu conhecimento sobre o tema"}
═══════════════════════`;

    // ETAPA 1: Estrutura
    await updateProgress(30);
    const promptEstrutura = `${promptBase}

═══ SUA TAREFA ═══
Crie a ESTRUTURA do conteúdo interativo. NÃO gere conteúdo completo, apenas títulos e tipos.

Retorne JSON:
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
        {"tipo": "texto", "titulo": "Conceito X"},
        {"tipo": "quickcheck", "titulo": "Verificação"}
      ]
    }
  ]
}

REGRAS:
1. 6-8 seções (40-55 páginas totais)
2. Cada seção: 6-9 páginas
3. TIPOS: introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck, correspondencias
4. "introducao" APENAS na primeira seção
5. DISTRIBUIÇÃO: 15-20 texto, 4-5 atencao, 3-4 dica, 4-5 caso, 2-3 tabela, 5-6 quickcheck, 1 correspondencias
6. Em vez de "ISSO CAI NA PROVA", use "ATENÇÃO: Conceito fundamental!" ou "PONTO CRUCIAL para entender a área!"
7. MANTENHA o título: "${topicoTitulo}"

Retorne APENAS o JSON.`;

    let estrutura = await gerarJSON(promptEstrutura);
    if (!estrutura?.secoes || estrutura.secoes.length < 3) throw new Error("Estrutura inválida");

    await updateProgress(35);

    // ETAPA 2: Gerar conteúdo por seção
    const secoesCompletas: any[] = [];
    const totalSecoes = estrutura.secoes.length;

    for (let i = 0; i < totalSecoes; i++) {
      const secaoEstrutura = estrutura.secoes[i];
      const progressoSecao = Math.round(35 + (i / totalSecoes) * 40);
      await updateProgress(progressoSecao);

      const promptSecao = `${promptBase}

═══ SUA TAREFA ═══
Gere CONTEÚDO COMPLETO para a SEÇÃO ${i + 1}: "${secaoEstrutura.titulo}"

PÁGINAS: ${JSON.stringify(secaoEstrutura.paginas, null, 2)}

Para cada página:
1. "introducao": {"tipo": "introducao", "titulo": "${topicoTitulo}", "conteudo": "☕ Prepare seu café, pois vamos mergulhar juntos em ${topicoTitulo}!\\n\\nNesta aula vamos estudar de forma clara e prática..."}
2. "texto" (MÍNIMO 250 PALAVRAS): {"tipo": "texto", "titulo": "...", "conteudo": "Explicação detalhada..."}
3. "correspondencias": {"tipo": "correspondencias", "titulo": "Vamos praticar?", "conteudo": "Conecte:", "correspondencias": [{"termo": "T1", "definicao": "D1"}]}
4. "termos": {"tipo": "termos", "titulo": "...", "conteudo": "...", "termos": [{"termo": "T", "definicao": "D"}]}
5. "linha_tempo": {"tipo": "linha_tempo", "titulo": "...", "conteudo": "...", "etapas": [{"titulo": "E", "descricao": "D"}]}
6. "tabela": {"tipo": "tabela", "titulo": "...", "conteudo": "...", "tabela": {"cabecalhos": [...], "linhas": [...]}}
7. "atencao": {"tipo": "atencao", "titulo": "⚠️ Conceito Fundamental!", "conteudo": "**Atenção redobrada aqui!**..."}
8. "dica": {"tipo": "dica", "titulo": "💡 Macete para Memorizar", "conteudo": "**Técnica:**..."}
9. "caso": {"tipo": "caso", "titulo": "📋 Na Prática", "conteudo": "**Situação Real:**..."}
10. "quickcheck": {"tipo": "quickcheck", "titulo": "Verificação Rápida", "conteudo": "...", "pergunta": "?", "opcoes": ["A)", "B)", "C)", "D)"], "resposta": 0, "feedback": "..."}
11. "resumo": {"tipo": "resumo", "titulo": "...", "conteudo": "...", "pontos": ["..."]}

Retorne JSON: {"id": ${secaoEstrutura.id}, "titulo": "${secaoEstrutura.titulo}", "slides": [...]}

REGRAS:
- TOM CONVERSACIONAL
- SIMPLES PRIMEIRO → TÉCNICO DEPOIS
- NÃO mencione OAB ou prova - foque no estudo aprofundado da área
- ${i === 0 ? 'INCLUA slide introducao' : 'NÃO inclua introducao'}
- USE **'negrito + aspas'** para termos-chave
- USE BLOCKQUOTE (>) para artigos de lei

Retorne APENAS o JSON.`;

      try {
        const secaoCompleta = await gerarJSON(promptSecao);
        if (!secaoCompleta?.slides || secaoCompleta.slides.length < 3) throw new Error("Poucos slides");
        
        if (i > 0) secaoCompleta.slides = secaoCompleta.slides.filter((s: any) => s.tipo !== 'introducao');
        
        for (const slide of secaoCompleta.slides) {
          if (!(i === 0 && slide.tipo === 'introducao') && slide.conteudo)
            slide.conteudo = limparSaudacoesProibidas(slide.conteudo);
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
        console.log(`[Categorias] ✓ Seção ${i + 1}: ${secaoCompleta.slides.length} slides`);
      } catch (err) {
        console.error(`[Categorias] ❌ Erro seção ${i + 1}:`, err);
        secoesCompletas.push({
          id: secaoEstrutura.id, titulo: secaoEstrutura.titulo,
          slides: [{ tipo: "texto", titulo: secaoEstrutura.titulo, conteudo: `Conteúdo em regeneração.` }]
        });
      }
    }

    await updateProgress(80);

    // ETAPA 3: Extras (gamificação + flashcards + questões)
    const promptGamificacao = `${promptBase}

Gere elementos de GAMIFICAÇÃO para "${topicoTitulo}". Retorne JSON:
{
  "correspondencias": [{"termo": "T", "definicao": "D (máx 50 chars)"}],
  "ligar_termos": [{"conceito": "Descrição simples", "termo": "Nome técnico"}],
  "explique_com_palavras": [{"conceito": "C", "dica": "D"}],
  "termos": [{"termo": "T", "definicao": "D"}],
  "exemplos": [{"titulo": "T", "situacao": "S", "analise": "A", "conclusao": "C"}]
}
Quantidades: 8 correspondencias, 6 ligar_termos, 4 explique, 10 termos, 5 exemplos.
APENAS JSON.`;

    const promptFlash = `${promptBase}

Gere FLASHCARDS e QUESTÕES sobre "${topicoTitulo}" (foco em estudo aprofundado, NÃO OAB). Retorne JSON:
{
  "flashcards": [{"frente": "Pergunta", "verso": "Resposta", "exemplo": "Exemplo prático"}],
  "questoes": [{"pergunta": "Enunciado", "alternativas": ["A)", "B)", "C)", "D)"], "correta": 0, "explicacao": "Explicação"}]
}
EXATAMENTE 22 flashcards e 17 questões. APENAS JSON.`;

    let extras: any = { correspondencias: [], ligar_termos: [], explique_com_palavras: [], exemplos: [], termos: [], flashcards: [], questoes: [] };

    try {
      const [gam, fq] = await Promise.all([
        gerarJSON(promptGamificacao, 2, 4096).catch(() => ({})),
        gerarJSON(promptFlash, 2, 6144).catch(() => ({})),
      ]);
      extras = {
        correspondencias: gam.correspondencias || [], ligar_termos: gam.ligar_termos || [],
        explique_com_palavras: gam.explique_com_palavras || [], termos: gam.termos || [],
        exemplos: gam.exemplos || [], flashcards: fq.flashcards || [], questoes: fq.questoes || [],
      };
    } catch (err) { console.error("[Categorias] Extras error:", err); }

    await updateProgress(85);

    // Validar páginas
    const totalPaginas = secoesCompletas.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
    if (totalPaginas < MIN_PAGINAS) {
      const novasTentativas = tentativasAtuais + 1;
      if (novasTentativas >= MAX_TENTATIVAS) {
        await supabase.from("categorias_topicos").update({ status: "erro", tentativas: novasTentativas, progresso: 0 }).eq("id", topico_id);
        return;
      }
      await supabase.from("categorias_topicos").update({ status: "pendente", tentativas: novasTentativas, progresso: 0 }).eq("id", topico_id);
      return;
    }

    // Síntese final
    const promptSintese = `${promptBase}

Crie SÍNTESE FINAL de "${topicoTitulo}" para revisão rápida. JSON:
{
  "resumo_texto": "150-200 palavras de resumo",
  "termos_chave": [{"termo": "T", "definicao": "D curta"}],
  "dicas_memorizacao": ["Dica 1", "Dica 2"],
  "tabela_comparativa": {"cabecalhos": ["A", "B", "C"], "linhas": [["1", "2", "3"]]}
}
8-12 termos, 4-6 dicas. NÃO mencione OAB. APENAS JSON.`;

    let sintese: any = { resumo_texto: "", termos_chave: [], dicas_memorizacao: [], tabela_comparativa: null };
    try {
      const s = await gerarJSON(promptSintese, 3, 8192);
      sintese = { resumo_texto: s?.resumo_texto || "", termos_chave: s?.termos_chave || [], dicas_memorizacao: s?.dicas_memorizacao || [], tabela_comparativa: s?.tabela_comparativa || null };
    } catch { sintese.resumo_texto = `Você completou o estudo de ${topicoTitulo}.`; }

    // Slides de síntese
    const slidesSintese: any[] = [
      { tipo: "texto", titulo: "📚 Resumo Geral", conteudo: sintese.resumo_texto || `Estudo de **${topicoTitulo}** completo!` },
    ];
    if (sintese.termos_chave?.length) slidesSintese.push({ tipo: "termos", titulo: "🔑 Termos-Chave", conteudo: "Termos essenciais:", termos: sintese.termos_chave });
    if (sintese.dicas_memorizacao?.length) slidesSintese.push({ tipo: "dica", titulo: "💡 Dicas de Memorização", conteudo: sintese.dicas_memorizacao.map((d: string, i: number) => `**${i + 1}.** ${d}`).join('\n\n') });
    if (sintese.tabela_comparativa?.cabecalhos) slidesSintese.push({ tipo: "tabela", titulo: "📊 Comparativo", conteudo: "Revisão:", tabela: sintese.tabela_comparativa });
    slidesSintese.push({ tipo: "resumo", titulo: "✅ Síntese Final", conteudo: `Parabéns! Estudo de **${topicoTitulo}** completo!\n\nAgora teste com flashcards!`, pontos: ["Revise termos-chave", "Use dicas de memorização", "Pratique com flashcards", "Faça as questões"] });

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
      ligar_termos: extras.ligar_termos || [], explique_com_palavras: extras.explique_com_palavras || [],
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

    console.log(`[Categorias] ✅ Concluído: ${topicoTitulo} (${totalPaginas} páginas)`);

    // Gerar capa
    try {
      await supabase.functions.invoke("gerar-capa-topico-oab", {
        body: { topico_id, titulo: topicoTitulo, area: areaNome, tabela: "categorias_topicos" }
      });
    } catch { console.log("[Categorias] Capa não gerada"); }

  } catch (error: any) {
    console.error("[Categorias] ❌ Erro background:", error);
    try {
      const { data: t } = await supabase.from("categorias_topicos").select("tentativas").eq("id", topico_id).single();
      const tent = (t?.tentativas || 0) + 1;
      if (tent < MAX_TENTATIVAS) {
        await supabase.from("categorias_topicos").update({ status: "pendente", tentativas: tent, progresso: 0 }).eq("id", topico_id);
      } else {
        await supabase.from("categorias_topicos").update({ status: "erro", tentativas: tent, progresso: 0 }).eq("id", topico_id);
      }
    } catch (e) { console.error("[Categorias] Erro retry:", e); }
  }
}
