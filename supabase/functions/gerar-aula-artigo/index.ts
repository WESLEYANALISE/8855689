import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REVISION = "v4.0.0-curso-completo-gemini-2.5";
const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`📍 Function: gerar-aula-artigo@${REVISION}`);
  console.log(`🤖 Usando modelo: ${MODEL}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigoTabela, numeroArtigo, conteudoArtigo } = await req.json();
    
    if (!codigoTabela || !numeroArtigo || !conteudoArtigo) {
      throw new Error('Código da tabela, número do artigo e conteúdo são obrigatórios');
    }

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Verificando se já existe aula para:', codigoTabela, numeroArtigo);

    // Check if lesson already exists
    const { data: existingAula, error: fetchError } = await supabase
      .from('aulas_artigos')
      .select('*')
      .eq('codigo_tabela', codigoTabela)
      .eq('numero_artigo', numeroArtigo)
      .single();

    if (existingAula && !fetchError) {
      console.log('✅ Aula encontrada no cache, retornando...');
      
      await supabase
        .from('aulas_artigos')
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

    console.log('📝 Gerando CURSO COMPLETO V4 para o artigo...');

    const prompt = `Você é um PROFESSOR JURÍDICO PREMIADO, reconhecido nacionalmente pela sua didática excepcional. Sua missão é criar um CURSO COMPLETO e ENVOLVENTE sobre este artigo de lei.

CÓDIGO: ${codigoTabela}
ARTIGO: ${numeroArtigo}
TEXTO COMPLETO DO ARTIGO:
${conteudoArtigo}

═══════════════════════════════════════════════════════════════════
                    DIRETRIZES FUNDAMENTAIS
═══════════════════════════════════════════════════════════════════

🎯 STORYTELLING OBRIGATÓRIO:
- Crie personagens recorrentes: Maria (advogada), João (empresário), Pedro (cidadão comum), Ana (juíza), Carlos (estudante de direito)
- Cada seção DEVE começar com uma história envolvente que ilustre o problema que o artigo resolve
- As histórias devem ser realistas, do cotidiano brasileiro
- NUNCA invente jurisprudência ou decisões judiciais específicas

📚 PROFUNDIDADE DE CONTEÚDO:
- Explique CADA conceito como se o aluno nunca tivesse visto antes
- Use analogias do dia-a-dia para conceitos complexos
- Conecte com outros artigos e princípios do Direito
- Mostre as consequências práticas de cada dispositivo

📊 ELEMENTOS VISUAIS OBRIGATÓRIOS:
- Tabelas comparativas quando houver diferenças (tipos, modalidades, prazos)
- Linha do tempo para procedimentos e etapas
- Mapa mental mostrando conexões com outros institutos
- Resumo visual com os pontos principais

💡 DICAS DE ESTUDO:
- Mnemônicos para memorização
- Associações visuais
- Pegadinhas de concursos sobre o tema

═══════════════════════════════════════════════════════════════════
                    ESTRUTURA OBRIGATÓRIA POR SEÇÃO
═══════════════════════════════════════════════════════════════════

Para CADA parte do artigo (caput, incisos, parágrafos), crie uma seção com 10-15 slides nesta SEQUÊNCIA:

1. storytelling - História com personagem que ilustra o problema
2. texto - O texto exato do artigo destacado
3. termos - 3-5 termos jurídicos com definições detalhadas
4. explicacao - Explicação profunda com 3-4 tópicos
5. tabela - Quadro comparativo (quando aplicável)
6. linha_tempo - Etapas/procedimento (quando aplicável)
7. exemplo (cotidiano) - Situação do dia-a-dia
8. exemplo (profissional) - Caso na advocacia/empresas
9. mapa_mental - Conexões com outros artigos/princípios
10. atencao - Pegadinhas e cuidados importantes
11. dica_estudo - Técnica de memorização
12. resumo_visual - 4-6 pontos principais
13. quickcheck - Verificação de aprendizado

═══════════════════════════════════════════════════════════════════
                    ESTRUTURA JSON A RETORNAR
═══════════════════════════════════════════════════════════════════

{
  "versao": 2,
  "titulo": "Art. ${numeroArtigo} - [Título descritivo atraente]",
  "tempoEstimado": "[X] min",
  "objetivos": [
    "Compreender profundamente [conceito principal]",
    "Aplicar [tema] em situações práticas do cotidiano",
    "Identificar [elementos/requisitos] essenciais",
    "Evitar [erros comuns/pegadinhas] em provas e na prática"
  ],
  "secoes": [
    {
      "id": 1,
      "tipo": "caput",
      "trechoOriginal": "[Texto exato dessa parte do artigo]",
      "titulo": "[Título resumido desta seção]",
      "slides": [
        {
          "tipo": "storytelling",
          "titulo": "Uma História Real",
          "conteudo": "[Narrativa envolvente de 3-4 parágrafos com diálogos]",
          "personagem": "Maria",
          "narrativa": "[A mesma narrativa formatada]"
        },
        {
          "tipo": "texto",
          "titulo": "O Que Diz a Lei",
          "conteudo": "[Texto do artigo com destaques e formatação]"
        },
        {
          "tipo": "termos",
          "titulo": "Vocabulário Jurídico",
          "conteudo": "",
          "termos": [
            {"termo": "TERMO 1", "definicao": "Definição completa e didática do termo, com exemplos quando necessário"},
            {"termo": "TERMO 2", "definicao": "Definição completa e didática"},
            {"termo": "TERMO 3", "definicao": "Definição completa e didática"}
          ]
        },
        {
          "tipo": "explicacao",
          "titulo": "Entendendo em Profundidade",
          "conteudo": "[Parágrafo introdutório explicando a importância]",
          "topicos": [
            {"titulo": "Natureza Jurídica", "detalhe": "Explicação detalhada de 2-3 linhas sobre a natureza jurídica"},
            {"titulo": "Elementos Essenciais", "detalhe": "Quais são os requisitos e elementos necessários para aplicação"},
            {"titulo": "Aplicabilidade", "detalhe": "Quando e como este artigo se aplica na prática forense"},
            {"titulo": "Consequências", "detalhe": "O que acontece quando este artigo é aplicado ou violado"}
          ]
        },
        {
          "tipo": "tabela",
          "titulo": "Quadro Comparativo",
          "conteudo": "Veja as diferenças entre as modalidades/tipos:",
          "tabela": {
            "cabecalhos": ["Aspecto", "Tipo A", "Tipo B", "Tipo C"],
            "linhas": [
              ["Característica 1", "Valor A1", "Valor B1", "Valor C1"],
              ["Característica 2", "Valor A2", "Valor B2", "Valor C2"],
              ["Característica 3", "Valor A3", "Valor B3", "Valor C3"]
            ]
          }
        },
        {
          "tipo": "linha_tempo",
          "titulo": "Passo a Passo",
          "conteudo": "Siga estas etapas para aplicar corretamente:",
          "etapas": [
            {"titulo": "Etapa 1: Verificação Inicial", "descricao": "Descrição do que fazer nesta etapa"},
            {"titulo": "Etapa 2: Análise", "descricao": "Descrição detalhada do processo de análise"},
            {"titulo": "Etapa 3: Aplicação", "descricao": "Como aplicar na prática"},
            {"titulo": "Etapa 4: Conclusão", "descricao": "Finalização e verificação"}
          ]
        },
        {
          "tipo": "exemplo",
          "titulo": "Na Vida Real",
          "conteudo": "[Situação detalhada do cotidiano brasileiro, com nomes e contexto específico, mostrando como o artigo se aplica. Mínimo 3 parágrafos.]",
          "contexto": "Situação Cotidiana"
        },
        {
          "tipo": "exemplo",
          "titulo": "Na Prática Profissional",
          "conteudo": "[Situação detalhada do ambiente profissional/empresarial, com nomes e contexto específico. Mínimo 3 parágrafos.]",
          "contexto": "Ambiente Profissional"
        },
        {
          "tipo": "mapa_mental",
          "titulo": "Conexões Jurídicas",
          "conteudo": "Este artigo se conecta com diversos outros institutos:",
          "conceitos": [
            {
              "central": "[Conceito Central do Artigo]",
              "relacionados": ["Princípio relacionado 1", "Art. XX do mesmo código", "Conceito conexo", "Doutrina relacionada"]
            }
          ]
        },
        {
          "tipo": "atencao",
          "titulo": "Cuidado com Isso!",
          "conteudo": "[Pegadinhas comuns em provas, exceções importantes, erros frequentes de interpretação. Seja específico sobre o que NÃO fazer ou interpretar errado. Mínimo 2 parágrafos.]"
        },
        {
          "tipo": "dica_estudo",
          "titulo": "Como Memorizar",
          "conteudo": "[Técnica específica de memorização, pode incluir mnemônico, associação visual, ou método loci]",
          "tecnica": "Mnemônico",
          "dica": "[A dica específica de memorização]"
        },
        {
          "tipo": "resumo_visual",
          "titulo": "Pontos Principais",
          "conteudo": "",
          "pontos": [
            "[Ponto principal 1 - uma frase clara e objetiva]",
            "[Ponto principal 2 - uma frase clara e objetiva]",
            "[Ponto principal 3 - uma frase clara e objetiva]",
            "[Ponto principal 4 - uma frase clara e objetiva]",
            "[Ponto principal 5 - uma frase clara e objetiva]"
          ]
        },
        {
          "tipo": "quickcheck",
          "pergunta": "[Pergunta de verificação de aprendizado, estilo concurso]",
          "opcoes": ["Alternativa A (uma correta)", "Alternativa B", "Alternativa C", "Alternativa D"],
          "resposta": 0,
          "feedback": "[Explicação detalhada de por que a alternativa correta está certa e as outras erradas]",
          "conteudo": ""
        }
      ]
    }
  ],
  "atividadesFinais": {
    "matching": [
      {"termo": "Termo 1", "definicao": "Def curta 1 (max 60 chars)"},
      {"termo": "Termo 2", "definicao": "Def curta 2"},
      {"termo": "Termo 3", "definicao": "Def curta 3"},
      {"termo": "Termo 4", "definicao": "Def curta 4"},
      {"termo": "Termo 5", "definicao": "Def curta 5"},
      {"termo": "Termo 6", "definicao": "Def curta 6"}
    ],
    "flashcards": [
      {"frente": "Pergunta/Conceito 1", "verso": "Resposta detalhada", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta/Conceito 2", "verso": "Resposta detalhada", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta/Conceito 3", "verso": "Resposta detalhada", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta/Conceito 4", "verso": "Resposta detalhada", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta/Conceito 5", "verso": "Resposta detalhada", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta/Conceito 6", "verso": "Resposta detalhada", "exemplo": "Exemplo prático"}
    ],
    "questoes": [
      {
        "question": "[Questão elaborada estilo CESPE - mais complexa]",
        "options": ["a) Alternativa A", "b) Alternativa B", "c) Alternativa C", "d) Alternativa D"],
        "correctAnswer": 0,
        "explicacao": "[Explicação completa de 3-4 linhas]",
        "fonte": "Estilo CESPE"
      },
      {
        "question": "[Questão estilo FCC - análise de assertivas]",
        "options": ["a) Alternativa", "b) Alternativa", "c) Alternativa", "d) Alternativa"],
        "correctAnswer": 1,
        "explicacao": "[Explicação completa]",
        "fonte": "Estilo FCC"
      },
      {
        "question": "[Questão estilo OAB - caso prático]",
        "options": ["a) Alternativa", "b) Alternativa", "c) Alternativa", "d) Alternativa"],
        "correctAnswer": 2,
        "explicacao": "[Explicação completa]",
        "fonte": "Estilo OAB"
      },
      {
        "question": "[Questão de raciocínio - correlação]",
        "options": ["a) Alternativa", "b) Alternativa", "c) Alternativa", "d) Alternativa"],
        "correctAnswer": 0,
        "explicacao": "[Explicação completa]",
        "fonte": ""
      },
      {
        "question": "[Questão interpretativa]",
        "options": ["a) Alternativa", "b) Alternativa", "c) Alternativa", "d) Alternativa"],
        "correctAnswer": 3,
        "explicacao": "[Explicação completa]",
        "fonte": ""
      }
    ]
  },
  "provaFinal": [
    {
      "question": "[Questão final 1 - integração de conhecimentos]",
      "options": ["a) Alt", "b) Alt", "c) Alt", "d) Alt", "e) Alt"],
      "correctAnswer": 0,
      "explicacao": "[Explicação detalhada]",
      "tempoLimite": 90
    },
    {
      "question": "[Questão final 2 - caso complexo]",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 1,
      "explicacao": "[Explicação]",
      "tempoLimite": 90
    },
    {
      "question": "[Questão final 3 - análise crítica]",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 2,
      "explicacao": "[Explicação]",
      "tempoLimite": 90
    },
    {
      "question": "[Questão final 4 - aplicação prática]",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 3,
      "explicacao": "[Explicação]",
      "tempoLimite": 90
    },
    {
      "question": "[Questão final 5 - pegadinha elaborada]",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 0,
      "explicacao": "[Explicação]",
      "tempoLimite": 90
    },
    {
      "question": "[Questão final 6 - interdisciplinar]",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 4,
      "explicacao": "[Explicação]",
      "tempoLimite": 90
    }
  ]
}

═══════════════════════════════════════════════════════════════════
                    REGRAS CRÍTICAS
═══════════════════════════════════════════════════════════════════

1. NUNCA invente jurisprudência, súmulas ou decisões específicas de tribunais
2. Crie 2-4 seções dependendo da complexidade do artigo
3. CADA seção DEVE ter TODOS os tipos de slides na sequência correta
4. Histórias devem ter personagens com nomes e contexto realista
5. Tabelas só quando houver REALMENTE comparação a fazer (tipos, modalidades, prazos)
6. Linha do tempo só quando houver REALMENTE etapas/procedimento
7. Mapa mental SEMPRE com conexões reais com outros artigos/princípios
8. Textos devem ser didáticos, detalhados e focados em concursos
9. Slides tipo "quickcheck" devem ter exatamente 4 opções
10. O campo "resposta" é o índice (0-3) da opção correta
11. Retorne APENAS o JSON, sem markdown ou código`;

    console.log('🚀 Enviando prompt para Gemini 2.5 Flash...');

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
      console.error('❌ Erro na API Gemini:', response.status, errorText);
      throw new Error('Erro ao gerar estrutura da aula');
    }

    const data = await response.json();
    let estruturaText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!estruturaText) {
      throw new Error('Resposta vazia da IA');
    }
    
    console.log('📝 Resposta recebida, processando JSON...');
    
    estruturaText = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let estrutura;
    try {
      estrutura = JSON.parse(estruturaText);
    } catch (parseError: any) {
      console.error('⚠️ Erro ao parsear JSON, tentando limpeza:', parseError.message);
      
      const startIndex = estruturaText.indexOf('{');
      const endIndex = estruturaText.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        estruturaText = estruturaText.substring(startIndex, endIndex + 1);
      }
      
      estruturaText = estruturaText
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
      
      try {
        estrutura = JSON.parse(estruturaText);
      } catch (secondError: any) {
        console.error('⚠️ Segunda tentativa falhou:', secondError.message);
        
        let inString = false;
        let escaped = false;
        let result = '';
        
        for (let i = 0; i < estruturaText.length; i++) {
          const char = estruturaText[i];
          
          if (escaped) {
            result += char;
            escaped = false;
            continue;
          }
          
          if (char === '\\' && inString) {
            result += char;
            escaped = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            result += char;
            continue;
          }
          
          if (inString) {
            if (char === '\n' || char === '\r' || char === '\t') {
              result += ' ';
            } else {
              result += char;
            }
          } else {
            if (!/\s/.test(char)) {
              result += char;
            }
          }
        }
        
        try {
          estrutura = JSON.parse(result);
        } catch (finalError: any) {
          console.error('❌ Falha definitiva no parsing:', finalError.message);
          throw new Error('A IA gerou uma resposta inválida. Tente novamente.');
        }
      }
    }
    
    // Ensure versao is set
    estrutura.versao = 2;
    
    console.log('✅ Estrutura CURSO COMPLETO V4 gerada com sucesso:', estrutura.titulo);
    console.log(`📊 Seções: ${estrutura.secoes?.length || 0}, Slides por seção: ${estrutura.secoes?.[0]?.slides?.length || 0}`);

    const { data: savedAula, error: saveError } = await supabase
      .from('aulas_artigos')
      .insert({
        codigo_tabela: codigoTabela,
        numero_artigo: numeroArtigo,
        conteudo_artigo: conteudoArtigo,
        estrutura_completa: estrutura,
        visualizacoes: 1
      })
      .select()
      .single();

    if (saveError) {
      console.error('⚠️ Erro ao salvar aula:', saveError);
      return new Response(JSON.stringify({
        ...estrutura,
        cached: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('💾 Aula CURSO COMPLETO V4 salva no banco com ID:', savedAula.id);

    return new Response(JSON.stringify({
      ...estrutura,
      cached: false,
      aulaId: savedAula.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro em gerar-aula-artigo:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar aula do artigo' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
