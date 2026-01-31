import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extras a serem gerados (JSON estruturado)
const EXTRAS_CONFIG = [
  { tipo: "correspondencias", minimo: 8 },
  { tipo: "exemplos", minimo: 5 },
  { tipo: "termos", minimo: 10 },
  { tipo: "flashcards", minimo: 15 },
  { tipo: "questoes", minimo: 8 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    // SISTEMA DE FILA
    // ============================================
    const { data: gerandoAtivo } = await supabase
      .from("conceitos_topicos")
      .select("id, titulo")
      .eq("status", "gerando")
      .neq("id", topico_id)
      .limit(1);

    if (gerandoAtivo && gerandoAtivo.length > 0) {
      console.log(`[Conceitos Fila] Geração ativa: ${gerandoAtivo[0].titulo}`);
      
      const { data: maxPosicao } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      const { data: jaEnfileirado } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila, status")
        .eq("id", topico_id)
        .single();
      
      if (jaEnfileirado?.status === "na_fila") {
        return new Response(
          JSON.stringify({ queued: true, position: jaEnfileirado.posicao_fila }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      await supabase
        .from("conceitos_topicos")
        .update({ status: "na_fila", posicao_fila: novaPosicao })
        .eq("id", topico_id);
      
      return new Response(
        JSON.stringify({ queued: true, position: novaPosicao }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // BUSCAR TÓPICO
    // ============================================
    const { data: topico, error: topicoError } = await supabase
      .from("conceitos_topicos")
      .select(`*, materia:conceitos_materias(id, nome, codigo)`)
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
        JSON.stringify({ message: "Geração já em andamento" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Marcar como gerando
    await supabase
      .from("conceitos_topicos")
      .update({ status: "gerando", progresso: 5, posicao_fila: null })
      .eq("id", topico_id);

    const materiaNome = topico.materia?.nome || "";
    const topicoTitulo = topico.titulo;
    console.log(`[Conceitos] Iniciando geração página-por-página: ${topicoTitulo}`);

    // ============================================
    // BUSCAR CONTEÚDO DO PDF
    // ============================================
    const { data: paginas } = await supabase
      .from("conceitos_topico_paginas")
      .select("pagina, conteudo")
      .eq("topico_id", topico_id)
      .order("pagina", { ascending: true });

    let conteudoPDF = "";
    if (paginas && paginas.length > 0) {
      conteudoPDF = paginas
        .filter(p => p.conteudo && p.conteudo.trim().length > 0)
        .map(p => `\n--- PÁGINA ${p.pagina} ---\n${p.conteudo}`)
        .join("\n\n");
      console.log(`[Conceitos] PDF: ${paginas.length} páginas, ${conteudoPDF.length} chars`);
    }

    // ============================================
    // CONFIGURAR GEMINI
    // ============================================
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
    ].filter(Boolean);
    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    // Usando gemini-2.5-flash-lite para geração de conteúdo de conceitos (mais rápido e econômico)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Função para atualizar progresso
    const updateProgress = async (value: number) => {
      await supabase
        .from("conceitos_topicos")
        .update({ progresso: value })
        .eq("id", topico_id);
    };

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

    // Função para gerar e fazer parse de JSON
    async function gerarJSON(prompt: string): Promise<any> {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.5 },
      });
      
      let text = result.response.text();
      text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!match) throw new Error("JSON não encontrado na resposta");
      
      const sanitized = sanitizeJsonString(match[0]);
      
      try {
        return JSON.parse(sanitized);
      } catch {
        const fixed = sanitized.replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(fixed);
      }
    }

    // ============================================
    // PROMPT BASE PARA GERAÇÃO
    // ============================================
    const promptBase = `Você é um professor de Direito descontraído, didático e apaixonado por ensinar.
Seu estilo é como uma CONVERSA COM UM AMIGO - você explica os conceitos como se estivesse tomando um café e ajudando um colega a entender a matéria.

## 🎯 SEU ESTILO DE ESCRITA OBRIGATÓRIO:

### ✅ FAÇA SEMPRE:
- Escreva como se estivesse CONVERSANDO com o estudante
- Use expressões naturais (varie, não repita a mesma mais de 2x):
  • "Olha só, é assim que funciona..."
  • "Veja bem, isso é super importante porque..."
  • "Percebeu a diferença? Esse é o pulo do gato!"
  • "Agora vem a parte interessante..."
  • "Resumindo pra você não esquecer..."
- Use perguntas retóricas para engajar ("E por que isso importa tanto?")
- Faça analogias com situações do dia a dia
- A cada termo técnico, EXPLIQUE o que significa COM DETALHES E EXEMPLOS
- Cite exemplos práticos DURANTE a explicação
- Após conceitos complexos, faça um breve resumo informal

### 📖 PROFUNDIDADE DE CONTEÚDO (CRÍTICO!):

Para CADA página de tipo "texto":
1. Comece explicando O QUE É o conceito (definição clara e completa)
2. Explique POR QUE é importante (contexto jurídico brasileiro)
3. Dê exemplos práticos detalhados
4. Se tiver termo em latim, EXPLIQUE com aplicação prática
5. Se o PDF citar doutrina/jurisprudência, INCLUA
6. Se for ponto de prova, marque com > ⚠️ **ATENÇÃO:**
7. Faça transições naturais entre conceitos

### ❌ NÃO FAÇA:
- Linguagem excessivamente formal/acadêmica
- Parágrafos longos e densos sem pausas
- **NUNCA USE EMOJIS NO TEXTO CORRIDO** (emojis SÓ nos elementos visuais)

## 📋 FORMATO DOS ELEMENTOS VISUAIS (CRÍTICO!):

SEMPRE use o caractere > (blockquote) no INÍCIO da linha para elementos especiais:
> ⚠️ **ATENÇÃO:** texto aqui
> 💡 **DICA:** texto aqui
> 📌 **EM RESUMO:** texto aqui
> 💼 **CASO PRÁTICO:** texto aqui
> 🎯 **VOCÊ SABIA?:** texto aqui

## 📚 FIDELIDADE AO PDF:
- Use 100% do texto e informações do PDF
- Cite APENAS artigos/leis que aparecem LITERALMENTE no PDF
- Inclua TODAS as citações de doutrinadores do PDF

**Matéria:** ${materiaNome}
**Tópico:** ${topicoTitulo}

═══ CONTEÚDO DO PDF ═══
${conteudoPDF || "Conteúdo não disponível"}
═══════════════════════`;

    await updateProgress(15);

    // ============================================
    // GERAR EXTRAS (JSON)
    // ============================================
    console.log(`[Conceitos] Gerando extras (correspondências, flashcards, questões)...`);

    const promptExtras = `${promptBase}

═══ SUA TAREFA ═══
Gere os seguintes elementos de estudo baseados no conteúdo:

Retorne um JSON válido com esta estrutura EXATA:
{
  "correspondencias": [
    {"termo": "Termo do PDF", "definicao": "Definição curta (máx 60 chars)"}
  ],
  "exemplos": [
    {"titulo": "Título do caso", "situacao": "Descrição", "analise": "Análise jurídica", "conclusao": "Conclusão"}
  ],
  "termos": [
    {"termo": "Termo jurídico", "definicao": "Definição completa"}
  ],
  "flashcards": [
    {"frente": "Pergunta", "verso": "Resposta", "exemplo": "Exemplo prático"}
  ],
  "questoes": [
    {"pergunta": "Enunciado da questão", "alternativas": ["A) opção", "B) opção", "C) opção", "D) opção"], "correta": 0, "explicacao": "Explicação da resposta"}
  ]
}

QUANTIDADES:
- correspondencias: mínimo 8 pares
- exemplos: mínimo 5 casos
- termos: mínimo 10 termos
- flashcards: mínimo 15 cards
- questoes: mínimo 8 questões

Retorne APENAS o JSON, sem texto adicional.`;

    let extras: any = {};
    try {
      extras = await gerarJSON(promptExtras);
      console.log(`[Conceitos] ✓ Extras gerados`);
    } catch (err) {
      console.error(`[Conceitos] ❌ Erro nos extras, gerando fallback:`, err);
      extras = {
        correspondencias: [],
        exemplos: [],
        termos: [],
        flashcards: [],
        questoes: []
      };
    }

    await updateProgress(90);

    // Validar correspondências
    let correspondencias = extras.correspondencias || [];
    if (!Array.isArray(correspondencias) || correspondencias.length < 6) {
      // Fallback: usar termos se disponíveis
      if (extras.termos && Array.isArray(extras.termos) && extras.termos.length >= 6) {
        correspondencias = extras.termos.slice(0, 10).map((t: any) => ({
          termo: t.termo || t.nome || String(t),
          definicao: (t.definicao || t.descricao || "Conceito jurídico").substring(0, 60)
        }));
      }
    }
    
    correspondencias = correspondencias
      .filter((c: any) => c && c.termo && c.definicao)
      .slice(0, 10)
      .map((c: any) => ({
        termo: String(c.termo).trim().substring(0, 50),
        definicao: String(c.definicao).trim().substring(0, 80)
      }));

    console.log(`[Conceitos] Correspondências válidas: ${correspondencias.length}`);

    // ============================================
    // GERAR ESTRUTURA DE SLIDES INTERATIVOS
    // ============================================
    console.log(`[Conceitos] Gerando estrutura de páginas interativas...`);
    
    const promptSlides = `${promptBase}

═══ SUA TAREFA ═══
Transforme o conteúdo do PDF em uma estrutura de PÁGINAS INTERATIVAS para estudo.

CADA PÁGINA DEVE SER SUPER EXPLICATIVA com:
- Mínimo 200-400 palavras por página de tipo "texto"
- Exemplos práticos imediatos após cada conceito
- Explicação de TODOS os termos em latim e juridiquês
- Citações de artigos, doutrina e jurisprudência do PDF

Retorne um JSON válido com esta estrutura EXATA:
{
  "versao": 1,
  "titulo": "${topicoTitulo}",
  "tempoEstimado": "25 min",
  "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
  "secoes": [
    {
      "id": 1,
      "titulo": "Nome da Seção",
      "slides": [
        {
          "tipo": "introducao",
          "titulo": "O que você vai aprender",
          "conteudo": "Texto introdutório motivador...",
          "imagemPrompt": "Professional legal illustration showing..."
        },
        {
          "tipo": "texto",
          "titulo": "Conceito Principal",
          "conteudo": "Explicação EXTENSA e DIDÁTICA do conceito...\\n\\n📚 **EXEMPLO PRÁTICO:** Maria comprou um celular...\\n\\nO termo *pacta sunt servanda* (que significa 'os pactos devem ser cumpridos') indica que...\\n\\n> \\"Art. 421 do CC - A liberdade contratual será exercida...\\" (Código Civil)\\n\\n> ⚠️ **ATENÇÃO:** Este ponto costuma cair em provas!",
          "imagemPrompt": "Educational illustration of..."
        },
        {
          "tipo": "termos",
          "titulo": "Termos Importantes",
          "conteudo": "Conheça os termos essenciais:",
          "termos": [
            {"termo": "Termo em latim", "definicao": "Significado claro em português"},
            {"termo": "Termo jurídico", "definicao": "Explicação acessível"}
          ],
          "imagemPrompt": "Legal glossary concept..."
        },
        {
          "tipo": "linha_tempo",
          "titulo": "Evolução Histórica",
          "conteudo": "Veja como o tema evoluiu:",
          "etapas": [
            {"titulo": "Etapa 1", "descricao": "Descrição da etapa"},
            {"titulo": "Etapa 2", "descricao": "Descrição da etapa"}
          ],
          "imagemPrompt": "Timeline showing legal evolution..."
        },
        {
          "tipo": "tabela",
          "titulo": "Comparativo",
          "conteudo": "Compare os principais aspectos:",
          "tabela": {
            "cabecalhos": ["Aspecto", "Tipo A", "Tipo B"],
            "linhas": [
              ["Característica 1", "Valor A1", "Valor B1"],
              ["Característica 2", "Valor A2", "Valor B2"]
            ]
          },
          "imagemPrompt": "Comparison chart concept..."
        },
        {
          "tipo": "atencao",
          "titulo": "Ponto de Atenção",
          "conteudo": "⚠️ Cuidado! Este é um ponto importante que costuma cair em provas...\\n\\n📚 **EXEMPLO:** Imagine que...",
          "imagemPrompt": "Warning sign concept..."
        },
        {
          "tipo": "dica",
          "titulo": "Dica de Memorização",
          "conteudo": "💡 Use este mnemônico para lembrar: SIGLA = ...\\n\\nOutra dica: associe o conceito X com...",
          "imagemPrompt": "Memory tip concept..."
        },
        {
          "tipo": "caso",
          "titulo": "Caso Prático",
          "conteudo": "💼 Imagine a seguinte situação:\\n\\nJoão comprou um imóvel...\\n\\n**Análise jurídica:** Aplicando o que estudamos...\\n\\n**Conclusão:** Portanto...",
          "imagemPrompt": "Legal case study illustration..."
        },
        {
          "tipo": "quickcheck",
          "titulo": "Verificação Rápida",
          "conteudo": "Teste seu conhecimento:",
          "pergunta": "Qual é a característica principal de X?",
          "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
          "resposta": 0,
          "feedback": "Correto! A resposta é A porque..."
        },
        {
          "tipo": "resumo",
          "titulo": "Resumo da Seção",
          "conteudo": "Recapitulando os pontos principais:",
          "pontos": ["Ponto 1", "Ponto 2", "Ponto 3"],
          "imagemPrompt": "Summary concept..."
        }
      ]
    }
  ]
}

REGRAS CRÍTICAS:
1. Gere entre 35-55 páginas no total, divididas em 5-7 seções
2. Use TODOS os tipos de páginas disponíveis de forma variada
3. Cada seção deve ter 5-10 páginas
4. Inclua imagemPrompt para TODOS as páginas (descrição para gerar imagem ilustrativa)
5. O imagemPrompt deve ser em INGLÊS e descrever uma ilustração educacional profissional
6. Use tom CONVERSACIONAL e didático no conteúdo
7. Inclua pelo menos 4 páginas tipo "quickcheck" espalhadas pelo conteúdo
8. Inclua pelo menos 2 páginas tipo "atencao" com pontos importantes
9. Inclua pelo menos 2 páginas tipo "dica" com mnemônicos e macetes
10. Garanta que o conteúdo seja COMPLETO - não pule informações importantes do PDF

CONTEÚDO OBRIGATÓRIO EM CADA PÁGINA TIPO "texto":
- Mínimo 200 palavras de explicação clara e didática
- Exemplo prático imediato: "📚 **EXEMPLO PRÁTICO:** Maria vendeu..."
- Explicação de termos: "O termo *habeas corpus* (que significa 'que tenhas o corpo') é..."
- Citações quando houver no PDF: "> \\"Art. 5º, inciso XXXV...\\" (CF/88)"
- Cards visuais: "> ⚠️ **ATENÇÃO:** ...", "> 💡 **DICA:** ..."

TIPOS DE PÁGINAS DISPONÍVEIS (NÃO use collapsible):
- introducao: Página de abertura com objetivos
- texto: Explicação EXTENSA de um conceito com exemplos
- termos: Lista de termos com definições
- linha_tempo: Timeline/etapas/procedimentos
- tabela: Quadro comparativo
- atencao: Ponto importante/pegadinha
- dica: Dica de memorização/estudo
- caso: Caso prático/exemplo detalhado
- resumo: Resumo com pontos principais
- quickcheck: Mini-quiz rápido

⛔ NÃO USE tipo "collapsible" - substitua por "texto" com subtítulos

Retorne APENAS o JSON válido, sem texto adicional.`;

    let slidesData: any = null;
    try {
      slidesData = await gerarJSON(promptSlides);
      console.log(`[Conceitos] ✓ Páginas geradas: ${slidesData?.secoes?.length || 0} seções`);
    } catch (err) {
      console.error(`[Conceitos] ❌ Erro ao gerar páginas:`, err);
      slidesData = null;
    }

    // ============================================
    // MONTAR TERMOS COM CORRESPONDÊNCIAS
    // ============================================
    const termosComCorrespondencias = {
      glossario: extras.termos || [],
      correspondencias: correspondencias
    };

    // Contar total de páginas no slides_json
    let totalPaginas = 0;
    if (slidesData?.secoes && Array.isArray(slidesData.secoes)) {
      slidesData.secoes.forEach((secao: any) => {
        if (secao.slides && Array.isArray(secao.slides)) {
          totalPaginas += secao.slides.length;
        }
      });
    }

    // ============================================
    // SALVAR NO BANCO
    // ============================================
    const { error: updateError } = await supabase
      .from("conceitos_topicos")
      .update({
        exemplos: extras.exemplos || [],
        termos: termosComCorrespondencias,
        flashcards: extras.flashcards || [],
        questoes: extras.questoes || [],
        slides_json: slidesData, // Estrutura de slides interativos (ÚNICO formato)
        status: "concluido",
        progresso: 100,
        tentativas: (topico.tentativas || 0) + 1,
        posicao_fila: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topico_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`[Conceitos] ✅ Conteúdo salvo: ${topicoTitulo} (${totalPaginas} páginas)`);

    // ============================================
    // DISPARAR BATCH DE IMAGENS PARA OS SLIDES
    // ============================================
    if (slidesData?.secoes && Array.isArray(slidesData.secoes)) {
      const imagensParaBatch: Array<{id: number; slideId: string; prompt: string}> = [];
      
      slidesData.secoes.forEach((secao: any, secaoIdx: number) => {
        if (secao.slides && Array.isArray(secao.slides)) {
          secao.slides.forEach((slideItem: any, slideIdx: number) => {
            if (slideItem.imagemPrompt) {
              imagensParaBatch.push({
                id: imagensParaBatch.length,
                slideId: `${secaoIdx}-${slideIdx}`,
                prompt: slideItem.imagemPrompt
              });
            }
          });
        }
      });
      
      // Disparar batch se houver imagens a gerar
      if (imagensParaBatch.length > 0) {
        console.log(`[Conceitos] Disparando batch para ${imagensParaBatch.length} imagens de slides`);
        
        fetch(`${supabaseUrl}/functions/v1/batch-imagens-iniciar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            tipo: "imagens_slides",
            items: imagensParaBatch,
            materia_id: topico.materia?.id || null,
            topico_id: topico_id
          })
        }).catch(err => {
          console.error("[Conceitos] Erro ao iniciar batch de imagens:", err);
        });
      }
    }

    // Processar próximo da fila
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conteúdo gerado em formato de páginas interativas",
        topico_id,
        titulo: topicoTitulo,
        paginas: totalPaginas,
        secoes: slidesData?.secoes?.length || 0,
        stats: {
          correspondencias: correspondencias.length,
          exemplos: extras.exemplos?.length || 0,
          termos: extras.termos?.length || 0,
          flashcards: extras.flashcards?.length || 0,
          questoes: extras.questoes?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Conceitos] ❌ Erro:", error);

    try {
      if (topicoIdForCatch && supabaseForCatch) {
        await supabaseForCatch
          .from("conceitos_topicos")
          .update({ status: "erro", progresso: 0 })
          .eq("id", topicoIdForCatch);

        await processarProximoDaFila(
          supabaseForCatch,
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
      }
    } catch (catchErr) {
      console.error("[Conceitos] Erro no fallback:", catchErr);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função auxiliar para processar próximo da fila
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
      console.log("[Conceitos Fila] Fila vazia");
      return;
    }

    console.log(`[Conceitos Fila] Próximo: ${proximo.titulo}`);

    fetch(`${supabaseUrl}/functions/v1/gerar-conteudo-conceitos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ topico_id: proximo.id }),
    }).catch(err => console.error("[Conceitos Fila] Erro:", err));
  } catch (err) {
    console.error("[Conceitos Fila] Erro:", err);
  }
}
