import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

async function chamarGemini(prompt: string, maxTokens: number = 16000): Promise<string> {
  for (let attempt = 0; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const keyIndex = attempt % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIndex];
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: maxTokens,
            },
          }),
        }
      );

      if (response.status === 429) {
        console.log(`Rate limit na key ${keyIndex + 1}, tentando próxima...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`Erro Gemini: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (error) {
      console.error(`Erro na tentativa ${attempt + 1}:`, error);
      if (attempt === GEMINI_KEYS.length * 2 - 1) throw error;
    }
  }
  throw new Error("Todas as tentativas falharam");
}

// Declaração para TypeScript reconhecer EdgeRuntime
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

async function processarConteudoBackground(temaId: string) {
  console.log(`[Background] Iniciando processamento do tema clássico ${temaId}`);
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Buscar informações do tema
    const { data: tema, error: temaError } = await supabase
      .from('biblioteca_classicos_temas')
      .select('*')
      .eq('id', temaId)
      .single();

    if (temaError || !tema) {
      throw new Error(`Tema não encontrado: ${temaError?.message}`);
    }

    // Buscar informações do livro
    const { data: livro } = await supabase
      .from('BIBLIOTECA-CLASSICOS')
      .select('livro, autor')
      .eq('id', tema.livro_id)
      .single();

    const tituloLivro = livro?.livro || 'Livro Clássico';
    const autorLivro = livro?.autor || '';

    // Atualizar status para "gerando"
    await supabase
      .from('biblioteca_classicos_temas')
      .update({ status: 'gerando' })
      .eq('id', temaId);

    // Buscar páginas do tema
    const { data: paginas, error: paginasError } = await supabase
      .from('biblioteca_classicos_paginas')
      .select('pagina, conteudo')
      .eq('livro_id', tema.livro_id)
      .gte('pagina', tema.pagina_inicial)
      .lte('pagina', tema.pagina_final)
      .order('pagina');

    if (paginasError || !paginas?.length) {
      throw new Error(`Páginas não encontradas: ${paginasError?.message}`);
    }

    console.log(`Páginas ${tema.pagina_inicial}-${tema.pagina_final} carregadas (${paginas.length} páginas)`);

    // Concatenar conteúdo das páginas
    const conteudoCompleto = paginas.map(p => p.conteudo).join('\n\n');
    console.log(`[Background] Conteúdo total: ${conteudoCompleto.length} caracteres`);

    // ============ PROMPT DE ANÁLISE DO LIVRO CLÁSSICO (COM CARDS ESPECIAIS) ============
    const promptConteudo = `Você é um professor de Direito e Filosofia Jurídica especializado em análise de obras clássicas.

## LIVRO: "${tituloLivro}"${autorLivro ? ` de ${autorLivro}` : ''}
## CAPÍTULO EM ANÁLISE: "${tema.titulo}"

## CONTEÚDO ORIGINAL DO CAPÍTULO (FONTE PRIMÁRIA):
${conteudoCompleto.substring(0, 40000)}

---

## SUA TAREFA:
Crie uma ANÁLISE COMPLETA e APROFUNDADA deste capítulo do livro clássico "${tituloLivro}".

## REGRA CRÍTICA - TÍTULO:
- NUNCA comece o conteúdo com um título que repita o nome do capítulo. O título já será exibido na interface.
- A PRIMEIRA seção do conteúdo DEVE ser "## Contexto e Introdução" (exatamente assim)

## ESTRUTURA OBRIGATÓRIA:

## Contexto e Introdução
[Situação deste capítulo no contexto da obra completa. O que veio antes e o que virá depois?]

## Síntese do Conteúdo
[Resumo claro e didático do que o autor discute neste capítulo - 3-4 parágrafos]

## Análise Crítica
[Análise profunda dos argumentos do autor. Pontos fortes e fracos. Comparação com outros pensadores.]
[Cite pelo menos 3 juristas/filósofos diferentes: Kelsen, Hart, Dworkin, Alexy, Radbruch, Bobbio, etc.]

## Conceitos-Chave
[Liste e explique os principais conceitos jurídicos/filosóficos apresentados]

## Relevância Atual
[Como os temas discutidos se aplicam ao Direito contemporâneo brasileiro?]

## Reflexões e Questionamentos
[3-5 perguntas reflexivas para o leitor pensar sobre o tema]

## Síntese Final
[Conclusão resumindo os pontos essenciais do capítulo]

---

## FORMATAÇÃO ESPECIAL OBRIGATÓRIA (USE ESTES BLOCOS):

### 1. CARDS DE ATENÇÃO (para pontos críticos - use PELO MENOS 2):
> ⚠️ **ATENÇÃO:** Texto do alerta importante aqui.

### 2. CARDS DE DICA (para memorização - use PELO MENOS 2):
> 💡 **DICA:** Texto da dica de estudo aqui.

### 3. CITAÇÕES DE DOUTRINA (use PELO MENOS 3 autores DIFERENTES):
> **Nome do Autor (ano):** "Texto exato da citação do doutrinador."

### 4. CITAÇÕES DO TEXTO ORIGINAL:
> "Trecho importante do próprio livro em análise"

---

## REGRAS ADICIONAIS:
- Texto com 1800-2500 palavras
- Linguagem clara e didática
- Priorize o conteúdo original do livro
- NÃO repita o mesmo autor em citações consecutivas
- Use variedade: Kelsen, Hart, Dworkin, Alexy, Radbruch, Bobbio, Reale, Ferrajoli, etc.
- Use ## para títulos principais e ### para subtítulos
- Use > para citações (elas serão renderizadas como cards elegantes)
- Use **negrito** para termos importantes`;

    console.log(`[Background] Gerando análise...`);
    const conteudo = await chamarGemini(promptConteudo, 20000);

    // ============ PROMPT DE EXEMPLOS PRÁTICOS ============
    const promptExemplos = `Você é um professor de Direito analisando o livro clássico "${tituloLivro}".

Para o capítulo "${tema.titulo}", crie 3 EXEMPLOS PRÁTICOS que ilustrem como os conceitos discutidos se aplicam no Direito brasileiro atual.

Responda em JSON válido:
[
  {
    "titulo": "Título do caso/exemplo",
    "situacao": "Descrição da situação prática contemporânea",
    "conexao_livro": "Como isso se relaciona com o que o autor discute no capítulo",
    "reflexao": "O que podemos aprender aplicando os conceitos do livro"
  }
]

Apenas o JSON, sem texto adicional.`;

    console.log(`[Background] Gerando exemplos...`);
    const exemplosRaw = await chamarGemini(promptExemplos);
    let exemplos = [];
    try {
      const jsonMatch = exemplosRaw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        exemplos = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Erro ao parsear exemplos:", e);
    }

    // ============ PROMPT DE TERMOS IMPORTANTES ============
    const promptTermos = `Para o capítulo "${tema.titulo}" do livro "${tituloLivro}", liste os 8-10 TERMOS mais importantes com suas definições.

Responda em JSON válido:
[
  {
    "termo": "Nome do termo/conceito",
    "definicao": "Definição clara considerando o contexto do livro",
    "relevancia": "Por que este termo é importante na obra"
  }
]

Apenas o JSON, sem texto adicional.`;

    console.log(`[Background] Gerando termos...`);
    const termosRaw = await chamarGemini(promptTermos);
    let termos = [];
    try {
      const jsonMatch = termosRaw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        termos = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Erro ao parsear termos:", e);
    }

    // ============ PROMPT DE FLASHCARDS ============
    const promptFlashcards = `Para o capítulo "${tema.titulo}" do livro "${tituloLivro}", crie EXATAMENTE 15 FLASHCARDS para revisão.

Responda em JSON válido:
[
  {
    "frente": "Pergunta sobre o conteúdo do capítulo",
    "verso": "Resposta baseada no texto do autor",
    "exemplo": "Exemplo prático ou citação relevante"
  }
]

Os flashcards devem cobrir:
- Ideias principais do autor (4-5 cards)
- Conceitos e definições (3-4 cards)
- Argumentos e justificativas (3-4 cards)
- Aplicações e reflexões (3-4 cards)

Apenas o JSON, sem texto adicional.`;

    console.log(`[Background] Gerando flashcards...`);
    const flashcardsRaw = await chamarGemini(promptFlashcards, 12000);
    let flashcards = [];
    try {
      const jsonMatch = flashcardsRaw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Erro ao parsear flashcards:", e);
    }

    // ============ PROMPT DE QUESTÕES ============
    const promptQuestoes = `Para o capítulo "${tema.titulo}" do livro "${tituloLivro}", crie 10 QUESTÕES DE MÚLTIPLA ESCOLHA.

Responda em JSON válido:
[
  {
    "enunciado": "Questão sobre o conteúdo do capítulo",
    "opcoes": ["A) Opção 1", "B) Opção 2", "C) Opção 3", "D) Opção 4"],
    "correta": 0,
    "explicacao": "Explicação detalhada da resposta correta e por que as outras estão erradas",
    "dificuldade": "facil|medio|dificil"
  }
]

REGRAS:
- O campo "correta" é o índice da opção correta (0=A, 1=B, 2=C, 3=D)
- As questões devem testar compreensão, não memorização

Apenas o JSON, sem texto adicional.`;

    console.log(`[Background] Gerando questões...`);
    const questoesRaw = await chamarGemini(promptQuestoes, 15000);
    let questoes = [];
    try {
      let cleanedQuestoes = questoesRaw
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      const jsonMatch = cleanedQuestoes.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const fixedJson = jsonMatch[0]
          .replace(/,\s*]/g, ']')
          .replace(/,\s*}/g, '}');
        questoes = JSON.parse(fixedJson);
        console.log(`[Questões] Parseadas ${questoes.length} questões com sucesso`);
      }
    } catch (e) {
      console.error("Erro ao parsear questões:", e);
    }

    // ============ PROMPT DE CORRESPONDÊNCIAS (JOGO) ============
    const promptCorrespondencias = `Para o capítulo "${tema.titulo}" do livro "${tituloLivro}", crie 6 PARES de conceito-definição para um jogo de correspondência.

Responda em JSON válido:
[
  {
    "conceito": "Nome curto do conceito (2-4 palavras)",
    "definicao": "Definição resumida em 1 frase (máximo 15 palavras)"
  }
]

REGRAS:
- Os conceitos devem ser extraídos diretamente do capítulo
- As definições devem ser claras e concisas
- Evite definições muito longas (máximo 15 palavras)

Apenas o JSON, sem texto adicional.`;

    console.log(`[Background] Gerando correspondências...`);
    const correspondenciasRaw = await chamarGemini(promptCorrespondencias);
    let correspondencias = [];
    try {
      const jsonMatch = correspondenciasRaw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        correspondencias = JSON.parse(jsonMatch[0]);
        console.log(`[Correspondências] Parseadas ${correspondencias.length} correspondências`);
      }
    } catch (e) {
      console.error("Erro ao parsear correspondências:", e);
    }

    // Atualizar tema com conteúdo gerado
    console.log(`[Background] Salvando conteúdo do tema ${temaId}...`);
    const { error: updateError } = await supabase
      .from('biblioteca_classicos_temas')
      .update({
        conteudo_markdown: conteudo,
        exemplos: JSON.stringify(exemplos),
        termos,
        flashcards,
        questoes,
        correspondencias,
        status: 'concluido',
        updated_at: new Date().toISOString()
      })
      .eq('id', temaId);

    if (updateError) {
      throw new Error(`Erro ao salvar conteúdo: ${updateError.message}`);
    }

    console.log(`[Background] Conteúdo do tema ${temaId} salvo com sucesso!`);
    console.log(`   - Exemplos: ${exemplos.length}`);
    console.log(`   - Termos: ${termos.length}`);
    console.log(`   - Flashcards: ${flashcards.length}`);
    console.log(`   - Questões: ${questoes.length}`);
    console.log(`   - Correspondências: ${correspondencias.length}`);

    // Gerar capa do tema
    try {
      console.log(`[Capa] Iniciando geração de capa para tema ${temaId}...`);
      
      const capaResponse = await fetch(
        `${supabaseUrl}/functions/v1/gerar-capa-classicos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ 
            temaId,
            tituloLivro,
            tituloTema: tema.titulo
          })
        }
      );
      
      if (capaResponse.ok) {
        const capaResult = await capaResponse.json();
        console.log("[Capa] Capa gerada com sucesso:", capaResult);
      } else {
        console.error("[Capa] Erro ao gerar capa:", await capaResponse.text());
      }
    } catch (capaError) {
      console.error("[Capa] Erro ao iniciar geração de capa:", capaError);
    }

    console.log(`[Background] ✅ Geração completa do tema ${temaId} finalizada!`);

  } catch (error) {
    console.error("[Background] Erro no processamento:", error);
    
    // Marcar como erro
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await supabase.from('biblioteca_classicos_temas').update({ status: 'erro' }).eq('id', temaId);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { temaId } = await req.json();
    
    if (!temaId) {
      throw new Error("ID do tema não fornecido");
    }

    console.log(`[gerar-conteudo-classicos] Recebida requisição para tema ${temaId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se o tema existe
    const { data: tema, error: temaError } = await supabase
      .from('biblioteca_classicos_temas')
      .select('id, titulo, status')
      .eq('id', temaId)
      .single();

    if (temaError || !tema) {
      throw new Error(`Tema não encontrado: ${temaError?.message}`);
    }

    // Se já está gerando, retornar status
    if (tema.status === 'gerando') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Conteúdo já está sendo gerado em segundo plano",
          status: 'gerando'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Marcar como gerando imediatamente
    await supabase
      .from('biblioteca_classicos_temas')
      .update({ status: 'gerando' })
      .eq('id', temaId);

    // Iniciar processamento em background
    EdgeRuntime.waitUntil(processarConteudoBackground(temaId));

    // Retornar resposta imediata
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Geração de análise iniciada em segundo plano. O conteúdo será exibido automaticamente quando estiver pronto.",
        status: 'gerando'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("[gerar-conteudo-classicos] Erro:", error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
