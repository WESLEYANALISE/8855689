import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REVISION = "v1.0.0-jornada-juridica";
const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`📍 Function: gerar-aula-jornada@${REVISION}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, resumoId, tema, conteudoOriginal, resumoMarkdown, exemplos, termos } = await req.json();
    
    if (!area || !resumoId || !tema) {
      throw new Error('Área, resumoId e tema são obrigatórios');
    }

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Verificando cache para:', area, tema);

    // Check cache first
    const { data: existingAula, error: fetchError } = await supabase
      .from('jornada_aulas_cache')
      .select('*')
      .eq('area', area)
      .eq('resumo_id', resumoId)
      .single();

    if (existingAula && !fetchError) {
      console.log('✅ Aula encontrada no cache');
      
      await supabase
        .from('jornada_aulas_cache')
        .update({ visualizacoes: (existingAula.visualizacoes || 0) + 1 })
        .eq('id', existingAula.id);

      return new Response(JSON.stringify({
        ...existingAula.estrutura_completa,
        cached: true,
        aulaId: existingAula.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 Gerando aula interativa para jornada jurídica...');

    // Parse termos if string
    let termosArray = [];
    if (termos) {
      try {
        termosArray = typeof termos === 'string' ? JSON.parse(termos) : termos;
      } catch {
        termosArray = [];
      }
    }

    const prompt = `Você é um PROFESSOR JURÍDICO PREMIADO. Crie uma AULA INTERATIVA COMPLETA sobre este tema de direito.

MATÉRIA: ${area}
TEMA: ${tema}

RESUMO DO CONTEÚDO:
${resumoMarkdown || conteudoOriginal || 'Conteúdo não fornecido'}

EXEMPLOS PRÁTICOS:
${exemplos || 'Exemplos não fornecidos'}

TERMOS IMPORTANTES:
${termosArray.length > 0 ? JSON.stringify(termosArray, null, 2) : 'Termos não fornecidos'}

═══════════════════════════════════════════════════════════════════
                    DIRETRIZES FUNDAMENTAIS
═══════════════════════════════════════════════════════════════════

🎯 STORYTELLING OBRIGATÓRIO:
- Crie personagens: Maria (advogada), João (empresário), Pedro (cidadão), Ana (juíza)
- Cada seção começa com história envolvente que ilustra o problema
- Histórias realistas do cotidiano brasileiro
- NUNCA invente jurisprudência específica

📚 PROFUNDIDADE:
- Explique cada conceito como se fosse a primeira vez
- Use analogias do dia-a-dia
- Conecte com outros conceitos do Direito
- Mostre consequências práticas

📊 ELEMENTOS VISUAIS:
- Tabelas comparativas quando aplicável
- Linha do tempo para procedimentos
- Mapa mental com conexões
- Resumo visual dos pontos principais

💡 DICAS DE ESTUDO:
- Mnemônicos para memorização
- Pegadinhas de concursos

═══════════════════════════════════════════════════════════════════
                    ESTRUTURA POR SEÇÃO (10-15 slides)
═══════════════════════════════════════════════════════════════════

1. storytelling - História com personagem
2. texto - Conteúdo principal destacado
3. termos - 3-5 termos com definições
4. explicacao - Explicação com 3-4 tópicos
5. tabela - Quadro comparativo (quando aplicável)
6. linha_tempo - Etapas (quando aplicável)
7. exemplo (cotidiano)
8. exemplo (profissional)
9. mapa_mental - Conexões com outros conceitos
10. atencao - Pegadinhas e cuidados
11. dica_estudo - Técnica de memorização
12. resumo_visual - 4-6 pontos principais
13. quickcheck - Verificação de aprendizado

═══════════════════════════════════════════════════════════════════
                    ESTRUTURA JSON
═══════════════════════════════════════════════════════════════════

{
  "versao": 2,
  "titulo": "${tema} - ${area}",
  "tempoEstimado": "15 min",
  "area": "${area}",
  "objetivos": [
    "Compreender profundamente [conceito principal]",
    "Aplicar na prática",
    "Identificar elementos essenciais",
    "Evitar erros comuns"
  ],
  "secoes": [
    {
      "id": 1,
      "tipo": "caput",
      "trechoOriginal": "[Trecho do conteúdo]",
      "titulo": "[Título da seção]",
      "slides": [
        {
          "tipo": "storytelling",
          "titulo": "Uma História Real",
          "conteudo": "[Narrativa com 3-4 parágrafos]",
          "personagem": "Maria",
          "narrativa": "[Narrativa formatada]"
        },
        {
          "tipo": "texto",
          "titulo": "O Que Diz o Direito",
          "conteudo": "[Conteúdo principal]"
        },
        {
          "tipo": "termos",
          "titulo": "Vocabulário Jurídico",
          "conteudo": "",
          "termos": [
            {"termo": "TERMO", "definicao": "Definição didática"}
          ]
        },
        {
          "tipo": "explicacao",
          "titulo": "Entendendo em Profundidade",
          "conteudo": "[Introdução]",
          "topicos": [
            {"titulo": "Natureza Jurídica", "detalhe": "Explicação"},
            {"titulo": "Elementos", "detalhe": "Requisitos"},
            {"titulo": "Aplicação", "detalhe": "Na prática"},
            {"titulo": "Consequências", "detalhe": "Resultados"}
          ]
        },
        {
          "tipo": "tabela",
          "titulo": "Quadro Comparativo",
          "conteudo": "Diferenças:",
          "tabela": {
            "cabecalhos": ["Aspecto", "Tipo A", "Tipo B"],
            "linhas": [["Característica", "Valor A", "Valor B"]]
          }
        },
        {
          "tipo": "linha_tempo",
          "titulo": "Passo a Passo",
          "conteudo": "Etapas:",
          "etapas": [
            {"titulo": "Etapa 1", "descricao": "Descrição"}
          ]
        },
        {
          "tipo": "exemplo",
          "titulo": "Na Vida Real",
          "conteudo": "[Situação cotidiana detalhada]",
          "contexto": "Situação Cotidiana"
        },
        {
          "tipo": "exemplo",
          "titulo": "Na Prática Profissional",
          "conteudo": "[Situação profissional]",
          "contexto": "Ambiente Profissional"
        },
        {
          "tipo": "mapa_mental",
          "titulo": "Conexões Jurídicas",
          "conteudo": "Conexões:",
          "conceitos": [
            {"central": "[Conceito]", "relacionados": ["Relacionado 1", "Relacionado 2"]}
          ]
        },
        {
          "tipo": "atencao",
          "titulo": "Cuidado!",
          "conteudo": "[Pegadinhas e erros comuns]"
        },
        {
          "tipo": "dica_estudo",
          "titulo": "Como Memorizar",
          "conteudo": "[Técnica]",
          "tecnica": "Mnemônico",
          "dica": "[Dica específica]"
        },
        {
          "tipo": "resumo_visual",
          "titulo": "Pontos Principais",
          "conteudo": "",
          "pontos": ["Ponto 1", "Ponto 2", "Ponto 3", "Ponto 4"]
        },
        {
          "tipo": "quickcheck",
          "pergunta": "[Pergunta de verificação]",
          "opcoes": ["A", "B", "C", "D"],
          "resposta": 0,
          "feedback": "[Explicação]",
          "conteudo": ""
        }
      ]
    }
  ],
  "atividadesFinais": {
    "matching": [
      {"termo": "Termo 1", "definicao": "Def curta (max 60 chars)"},
      {"termo": "Termo 2", "definicao": "Def curta"},
      {"termo": "Termo 3", "definicao": "Def curta"},
      {"termo": "Termo 4", "definicao": "Def curta"},
      {"termo": "Termo 5", "definicao": "Def curta"},
      {"termo": "Termo 6", "definicao": "Def curta"}
    ],
    "flashcards": [
      {"frente": "Pergunta 1", "verso": "Resposta", "exemplo": "Exemplo"},
      {"frente": "Pergunta 2", "verso": "Resposta", "exemplo": "Exemplo"},
      {"frente": "Pergunta 3", "verso": "Resposta", "exemplo": "Exemplo"},
      {"frente": "Pergunta 4", "verso": "Resposta", "exemplo": "Exemplo"},
      {"frente": "Pergunta 5", "verso": "Resposta", "exemplo": "Exemplo"},
      {"frente": "Pergunta 6", "verso": "Resposta", "exemplo": "Exemplo"}
    ],
    "questoes": [
      {"question": "[Questão CESPE]", "options": ["a)", "b)", "c)", "d)"], "correctAnswer": 0, "explicacao": "[Explicação]", "fonte": "Estilo CESPE"},
      {"question": "[Questão FCC]", "options": ["a)", "b)", "c)", "d)"], "correctAnswer": 1, "explicacao": "[Explicação]", "fonte": "Estilo FCC"},
      {"question": "[Questão OAB]", "options": ["a)", "b)", "c)", "d)"], "correctAnswer": 2, "explicacao": "[Explicação]", "fonte": "Estilo OAB"},
      {"question": "[Questão]", "options": ["a)", "b)", "c)", "d)"], "correctAnswer": 0, "explicacao": "[Explicação]", "fonte": ""},
      {"question": "[Questão]", "options": ["a)", "b)", "c)", "d)"], "correctAnswer": 3, "explicacao": "[Explicação]", "fonte": ""}
    ]
  },
  "provaFinal": [
    {"question": "[Questão final 1]", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 0, "explicacao": "[Explicação]", "tempoLimite": 90},
    {"question": "[Questão final 2]", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 1, "explicacao": "[Explicação]", "tempoLimite": 90},
    {"question": "[Questão final 3]", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 2, "explicacao": "[Explicação]", "tempoLimite": 90},
    {"question": "[Questão final 4]", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 3, "explicacao": "[Explicação]", "tempoLimite": 90},
    {"question": "[Questão final 5]", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 0, "explicacao": "[Explicação]", "tempoLimite": 90},
    {"question": "[Questão final 6]", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 4, "explicacao": "[Explicação]", "tempoLimite": 90}
  ]
}

REGRAS CRÍTICAS:
1. NUNCA invente jurisprudência ou súmulas
2. Crie 1-2 seções conforme complexidade
3. CADA seção deve ter slides na sequência correta
4. SEM campos de imagem (imagemUrl)
5. SEM campos de áudio
6. Retorne APENAS JSON válido`;

    console.log('🚀 Enviando para Gemini...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 65000,
            responseMimeType: "application/json",
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro Gemini:', response.status, errorText);
      throw new Error('Erro ao gerar estrutura da aula');
    }

    const data = await response.json();
    let estruturaText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!estruturaText) {
      throw new Error('Resposta vazia da IA');
    }
    
    console.log('📝 Processando JSON...');
    
    estruturaText = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let estrutura;
    try {
      estrutura = JSON.parse(estruturaText);
    } catch (parseError: any) {
      console.error('⚠️ Erro ao parsear JSON:', parseError.message);
      
      const startIndex = estruturaText.indexOf('{');
      const endIndex = estruturaText.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        estruturaText = estruturaText.substring(startIndex, endIndex + 1);
        estrutura = JSON.parse(estruturaText);
      } else {
        throw new Error('JSON inválido na resposta');
      }
    }

    // Save to cache
    const { data: savedAula, error: saveError } = await supabase
      .from('jornada_aulas_cache')
      .insert({
        area,
        resumo_id: resumoId,
        tema,
        estrutura_completa: estrutura
      })
      .select()
      .single();

    if (saveError) {
      console.error('⚠️ Erro ao salvar cache:', saveError);
    } else {
      console.log('✅ Aula salva no cache:', savedAula.id);
    }

    return new Response(JSON.stringify({
      ...estrutura,
      cached: false,
      aulaId: savedAula?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro ao gerar aula'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
