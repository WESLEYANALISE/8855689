import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { temaId, area, continuar } = await req.json();
    
    if (!temaId || !area) {
      return new Response(
        JSON.stringify({ error: 'temaId e area são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
    ].filter(Boolean);
    
    if (geminiKeys.length === 0) throw new Error('GEMINI_KEY não configurada');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar tema
    const { data: tema, error: temaError } = await supabase
      .from('oab_trilhas_temas')
      .select('*')
      .eq('id', temaId)
      .single();

    if (temaError) throw temaError;

    // Verificar subtópicos já existentes
    const { data: subExistentes } = await supabase
      .from('oab_trilhas_subtopicos')
      .select('ordem')
      .eq('tema_id', temaId);

    const ordensExistentes = new Set((subExistentes || []).map(s => s.ordem));
    console.log(`Subtópicos já existentes: ${ordensExistentes.size}`);

    // Buscar conteúdo das páginas - USAR TODO O CONTEÚDO DISPONÍVEL
    const { data: paginas, error: paginasError } = await supabase
      .from('oab_trilhas_conteudo')
      .select('pagina, conteudo')
      .eq('area', area)
      .order('pagina');

    if (paginasError) throw paginasError;

    // Usar conteúdo completo (até 100k caracteres para geração)
    const conteudoCompleto = paginas?.map(p => p.conteudo).join('\n\n') || '';
    console.log(`Conteúdo total disponível: ${conteudoCompleto.length} caracteres`);

    // Função para chamar Gemini com fallback
    async function callGemini(prompt: string, maxTokens = 4096, keyIndex = 0): Promise<string> {
      if (keyIndex >= geminiKeys.length) {
        throw new Error('Todas as chaves Gemini falharam');
      }

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKeys[keyIndex]}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
            }),
          }
        );

        if (!response.ok) {
          const status = response.status;
          if (status === 429 || status === 503) {
            console.log(`Gemini key ${keyIndex} rate limited, trying next...`);
            return callGemini(prompt, maxTokens, keyIndex + 1);
          }
          throw new Error(`Gemini error: ${status}`);
        }

        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (e) {
        console.log(`Gemini key ${keyIndex} error: ${e}, trying next...`);
        if (keyIndex + 1 < geminiKeys.length) {
          return callGemini(prompt, maxTokens, keyIndex + 1);
        }
        throw e;
      }
    }

    // ETAPA 1: Verificar se existe estrutura PREDEFINIDA
    const { data: estruturaPredefinida } = await supabase
      .from('oab_trilhas_estruturas')
      .select('*')
      .eq('tema_id', temaId)
      .order('ordem');

    let todosSubtopicos: any[] = [];

    if (estruturaPredefinida && estruturaPredefinida.length > 0) {
      // USAR ESTRUTURA PREDEFINIDA (100% do que foi definido)
      console.log(`Usando ESTRUTURA PREDEFINIDA: ${estruturaPredefinida.length} tópicos`);
      todosSubtopicos = estruturaPredefinida.map(e => ({
        ordem: e.ordem,
        titulo: e.titulo,
        pontos_chave: e.subitens || []
      }));
    } else {
      // FALLBACK: Pedir para Gemini identificar (comportamento antigo)
      console.log('Sem estrutura predefinida, usando Gemini para identificar');
      
      const promptEstrutura = `Você é uma SUPER PROFESSORA de Direito para OAB.

Analise o tema "${tema.titulo}" de ${area} e identifique TODOS os subtópicos/seções que existem no conteúdo abaixo.

CONTEÚDO DO MATERIAL:
${conteudoCompleto.substring(0, 50000)}

REGRAS CRÍTICAS:
1. Use numeração SIMPLES e SEQUENCIAL: 1, 2, 3, 4, 5... (NUNCA use 1.1, 1.1.1, 1.1.1.1)
2. Extraia TODOS os subtópicos que aparecem no material, sem limite
3. Cada título deve ser DESCRITIVO e auto-explicativo
4. Busque seções como "1.1. XXX", "1.2. XXX" e converta para numeração simples
5. Exemplos de títulos bons: "Lei Penal no Tempo", "Conflitos de Leis Penais", "Abolitio Criminis"

Retorne JSON:
{
  "subtopicos": [
    { "ordem": 1, "titulo": "Título do primeiro subtópico", "pontos_chave": ["ponto 1", "ponto 2"] },
    { "ordem": 2, "titulo": "Título do segundo subtópico", "pontos_chave": ["ponto 1", "ponto 2"] }
  ]
}

Identifique TODOS os subtópicos que existem. Retorne APENAS JSON válido, sem markdown.`;

      const estruturaText = await callGemini(promptEstrutura, 4096);
      let estrutura;
      try {
        const cleanJson = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        estrutura = JSON.parse(cleanJson);
      } catch (e) {
        console.error('Erro ao parsear estrutura:', e);
        estrutura = {
          subtopicos: [
            { ordem: 1, titulo: tema.titulo, pontos_chave: ["Conceitos fundamentais"] }
          ]
        };
      }

      // Renumerar sequencialmente para garantir (1, 2, 3...)
      todosSubtopicos = (estrutura.subtopicos || []).map((sub: any, idx: number) => ({
        ...sub,
        ordem: idx + 1,
        titulo: sub.titulo.replace(/^\d+(\.\d+)*\.?\s*/, '').trim()
      }));
    }

    const subtopicosParaGerar = todosSubtopicos.filter((sub: any) => !ordensExistentes.has(sub.ordem));

    console.log(`Total subtópicos esperados: ${todosSubtopicos.length}`);
    console.log(`Subtópicos para gerar: ${subtopicosParaGerar.length}`);

    if (subtopicosParaGerar.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          temaId,
          message: 'Todos os subtópicos já foram gerados',
          subtopicosGerados: ordensExistentes.size,
          totalEsperados: todosSubtopicos.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ETAPA 2: Gerar 3 subtópicos por chamada
    const MAX_POR_CHAMADA = 3;
    const subtopicosGerados = [];

    for (const sub of subtopicosParaGerar.slice(0, MAX_POR_CHAMADA)) {
      console.log(`Gerando: ${sub.ordem}. ${sub.titulo}`);
      console.log(`Pontos-chave a cobrir: ${sub.pontos_chave?.join(', ') || 'nenhum definido'}`);

      // Montar lista de pontos obrigatórios se existir estrutura predefinida
      const pontosObrigatorios = sub.pontos_chave?.length > 0
        ? `\n\nPONTOS OBRIGATÓRIOS QUE DEVEM SER COBERTOS EM DETALHES:\n${sub.pontos_chave.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}`
        : '';

      // Gerar conteúdo, flashcards e questões
      const promptCompleto = `Você é uma SUPER PROFESSORA de Direito para OAB.

Crie uma AULA COMPLETA sobre: "${sub.titulo}"
Área: ${area} | Tema: ${tema.titulo}
${pontosObrigatorios}

USE O CONTEÚDO ABAIXO COMO BASE (expanda significativamente cada ponto):
${conteudoCompleto.substring(0, 60000)}

Retorne um JSON com:
{
  "conteudo": "AULA COMPLETA em Markdown com pelo menos 1000 palavras. Estrutura: ## 🎯 Introdução, ## 📚 Conceitos Fundamentais, ## ⚖️ Base Legal (cite artigos específicos), ## 💡 Exemplos Práticos, ## 🎓 Como Cai na OAB/FGV, ## 🧠 Dicas de Memorização. ${sub.pontos_chave?.length ? `OBRIGATÓRIO: Cubra em detalhes TODOS estes pontos: ${sub.pontos_chave.join(', ')}` : ''}",
  "flashcards": [
    {"frente": "pergunta sobre conceito importante", "verso": "resposta completa e didática"}
  ],
  "questoes": [
    {
      "enunciado": "questão estilo FGV/OAB com caso prático",
      "alternativas": ["A) alternativa", "B) alternativa", "C) alternativa", "D) alternativa"],
      "correta": 0,
      "explicacao": "explicação detalhada de por que a alternativa está correta e as outras erradas"
    }
  ]
}

IMPORTANTE:
- Conteúdo deve ter NO MÍNIMO 1000 palavras
- 5 flashcards de alta qualidade
- 3 questões estilo OAB/FGV com casos práticos
- Retorne APENAS JSON válido, sem markdown externo`;

      const resultText = await callGemini(promptCompleto, 8192);
      
      let conteudo = '', flashcards = [], questoes = [];
      try {
        const cleanResult = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanResult);
        conteudo = parsed.conteudo || '';
        flashcards = parsed.flashcards || [];
        questoes = parsed.questoes || [];
      } catch (e) {
        console.error('Erro ao parsear resultado:', e);
        conteudo = resultText;
      }

      // Inserir subtópico
      const { data: subInserido, error: subError } = await supabase
        .from('oab_trilhas_subtopicos')
        .insert({
          tema_id: temaId,
          ordem: sub.ordem,
          titulo: sub.titulo,
          conteudo_expandido: conteudo,
          flashcards,
          questoes,
          status: 'concluido',
        })
        .select()
        .single();

      if (subError) {
        console.error('Erro ao inserir:', subError);
      } else {
        subtopicosGerados.push({
          id: subInserido.id,
          ordem: sub.ordem,
          titulo: sub.titulo,
          flashcards: flashcards.length,
          questoes: questoes.length,
        });
      }
    }

    // Verificar progresso
    const { count } = await supabase
      .from('oab_trilhas_subtopicos')
      .select('*', { count: 'exact', head: true })
      .eq('tema_id', temaId);

    const totalGerados = count || 0;
    const totalEsperados = todosSubtopicos.length;
    const completo = totalGerados >= totalEsperados;

    // Atualizar tema se completo
    if (completo) {
      await supabase
        .from('oab_trilhas_temas')
        .update({ subtopicos_gerados: true })
        .eq('id', temaId);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        temaId,
        subtopicosGerados: subtopicosGerados.length,
        totalGerados,
        totalEsperados,
        completo,
        precisaContinuar: !completo,
        subtopicos: subtopicosGerados,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
