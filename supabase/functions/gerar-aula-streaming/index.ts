import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema, area } = await req.json();
    
    if (!tema) {
      throw new Error('Tema é obrigatório');
    }

    const API_KEYS = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: existingAula } = await supabase
      .from('aulas_interativas')
      .select('*')
      .eq('tema', tema)
      .single();

    if (existingAula) {
      console.log('✅ Aula encontrada no cache');
      
      // Increment views
      await supabase
        .from('aulas_interativas')
        .update({ visualizacoes: (existingAula.visualizacoes || 0) + 1 })
        .eq('id', existingAula.id);

      // Return SSE stream with cached data
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send complete data immediately
          const event = `data: ${JSON.stringify({ 
            type: 'complete',
            cached: true,
            aulaId: existingAula.id,
            estrutura: existingAula.estrutura_completa
          })}\n\n`;
          controller.enqueue(encoder.encode(event));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
      });
    }

    console.log('📝 Gerando aula com streaming para:', tema);

    // Create SSE stream with immediate generation
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'status', 
            message: 'Iniciando geração...',
            progress: 0
          })}\n\n`));

          // Generate first section quickly
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'status', 
            message: 'Criando primeira seção...',
            progress: 10
          })}\n\n`));

          const secaoRapida = await gerarSecaoRapida(API_KEYS, tema, area);
          
          if (secaoRapida) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'secao',
              secaoIndex: 0,
              secao: secaoRapida.secao,
              estruturaBasica: secaoRapida.estruturaBasica
            })}\n\n`));
          }

          // Generate remaining content
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'status', 
            message: 'Gerando conteúdo completo...',
            progress: 40
          })}\n\n`));

          const estruturaCompleta = await gerarAulaCompleta(API_KEYS, tema, area);
          
          if (estruturaCompleta) {
            // Save to database
            const { data: aulaSalva, error: saveError } = await supabase
              .from('aulas_interativas')
              .insert({
                area: estruturaCompleta.area || area || 'Direito',
                tema: tema,
                titulo: estruturaCompleta.titulo,
                descricao: estruturaCompleta.descricao || '',
                estrutura_completa: estruturaCompleta
              })
              .select()
              .single();

            if (!saveError && aulaSalva) {
              estruturaCompleta.aulaId = aulaSalva.id;
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'complete',
              aulaId: estruturaCompleta.aulaId,
              estrutura: estruturaCompleta
            })}\n\n`));
          } else {
            throw new Error('Falha ao gerar conteúdo');
          }

          controller.close();
        } catch (err: unknown) {
          console.error('❌ Erro na geração:', err);
          const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar aula';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error',
            message: errorMessage
          })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate first section quickly
async function gerarSecaoRapida(apiKeys: string[], tema: string, area?: string): Promise<any> {
  const prompt = `Você é um professor jurídico. Crie APENAS A PRIMEIRA SEÇÃO de uma aula sobre: ${tema}

Retorne JSON com esta estrutura EXATA:
{
  "estruturaBasica": {
    "titulo": "${tema} - [Título Atraente]",
    "tempoEstimado": "30 min",
    "area": "${area || 'Direito'}",
    "descricao": "[Descrição breve em 1 frase]",
    "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3"]
  },
  "secao": {
    "id": 1,
    "tipo": "caput",
    "trechoOriginal": "[Conceito principal]",
    "titulo": "[Título da seção]",
    "slides": [
      {
        "tipo": "storytelling",
        "titulo": "Uma História Real",
        "conteudo": "[Narrativa envolvente de 2-3 parágrafos]",
        "personagem": "Maria",
        "narrativa": "[A mesma narrativa]"
      },
      {
        "tipo": "texto",
        "titulo": "Entendendo o Conceito",
        "conteudo": "[Explicação clara de 2 parágrafos]"
      },
      {
        "tipo": "termos",
        "titulo": "Vocabulário Jurídico",
        "conteudo": "",
        "termos": [
          {"termo": "TERMO 1", "definicao": "Definição"},
          {"termo": "TERMO 2", "definicao": "Definição"}
        ]
      },
      {
        "tipo": "explicacao",
        "titulo": "Em Profundidade",
        "conteudo": "[Parágrafo introdutório]",
        "topicos": [
          {"titulo": "Natureza Jurídica", "detalhe": "Explicação"},
          {"titulo": "Aplicabilidade", "detalhe": "Explicação"}
        ]
      },
      {
        "tipo": "exemplo",
        "titulo": "Na Vida Real",
        "conteudo": "[Exemplo prático de 2 parágrafos]",
        "contexto": "Situação Cotidiana"
      },
      {
        "tipo": "quickcheck",
        "pergunta": "[Pergunta de verificação]",
        "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
        "resposta": 0,
        "feedback": "[Explicação]",
        "conteudo": ""
      }
    ]
  }
}

Retorne APENAS o JSON.`;

  for (const apiKey of apiKeys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8000,
              responseMimeType: "application/json",
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        }
      }
    } catch (e) {
      console.error('Erro com chave:', e);
      continue;
    }
  }
  return null;
}

// Generate complete lesson
async function gerarAulaCompleta(apiKeys: string[], tema: string, area?: string): Promise<any> {
  const prompt = `Você é um PROFESSOR JURÍDICO PREMIADO. Crie uma AULA COMPLETA sobre: ${tema}
${area ? `ÁREA: ${area}` : ''}

ESTRUTURA OBRIGATÓRIA - Crie 3 seções, cada uma com 8-10 slides seguindo esta sequência:
1. storytelling - História com personagem
2. texto - Explicação do conceito
3. termos - 3 termos jurídicos
4. explicacao - Explicação profunda com tópicos
5. exemplo (cotidiano) - Situação do dia-a-dia
6. exemplo (profissional) - Caso na advocacia
7. atencao - Pegadinhas importantes
8. resumo_visual - Pontos principais
9. quickcheck - Verificação de aprendizado

Retorne JSON:
{
  "versao": 2,
  "titulo": "${tema} - [Título]",
  "tempoEstimado": "45 min",
  "area": "${area || 'Direito'}",
  "descricao": "[Descrição]",
  "objetivos": ["Obj 1", "Obj 2", "Obj 3", "Obj 4"],
  "secoes": [
    {
      "id": 1,
      "tipo": "caput",
      "trechoOriginal": "[Conceito]",
      "titulo": "[Título seção]",
      "slides": [
        {"tipo": "storytelling", "titulo": "...", "conteudo": "...", "personagem": "Maria", "narrativa": "..."},
        {"tipo": "texto", "titulo": "...", "conteudo": "..."},
        {"tipo": "termos", "titulo": "...", "conteudo": "", "termos": [{"termo": "...", "definicao": "..."}]},
        {"tipo": "explicacao", "titulo": "...", "conteudo": "...", "topicos": [{"titulo": "...", "detalhe": "..."}]},
        {"tipo": "exemplo", "titulo": "...", "conteudo": "...", "contexto": "Situação Cotidiana"},
        {"tipo": "exemplo", "titulo": "...", "conteudo": "...", "contexto": "Ambiente Profissional"},
        {"tipo": "atencao", "titulo": "...", "conteudo": "..."},
        {"tipo": "resumo_visual", "titulo": "...", "conteudo": "", "pontos": ["...", "...", "..."]},
        {"tipo": "quickcheck", "pergunta": "...", "opcoes": ["A", "B", "C", "D"], "resposta": 0, "feedback": "...", "conteudo": ""}
      ]
    }
  ],
  "atividadesFinais": {
    "matching": [{"termo": "...", "definicao": "..."}],
    "flashcards": [{"frente": "...", "verso": "...", "exemplo": "..."}],
    "questoes": [{"question": "...", "options": ["a)...", "b)...", "c)...", "d)..."], "correctAnswer": 0, "explicacao": "...", "fonte": ""}]
  },
  "provaFinal": [{"question": "...", "options": ["a)...", "b)...", "c)...", "d)...", "e)..."], "correctAnswer": 0, "explicacao": "...", "tempoLimite": 90}]
}

Retorne APENAS JSON válido.`;

  for (const apiKey of apiKeys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 50000,
              responseMimeType: "application/json",
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          return JSON.parse(text);
        }
      }
    } catch (e) {
      console.error('Erro com chave:', e);
      continue;
    }
  }
  return null;
}
