import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean);

async function callGeminiWithFallback(prompt: string): Promise<string> {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  
  for (const key of GEMINI_KEYS) {
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        if (response.status === 429 || response.status === 503 || response.status === 400) {
          console.log(`Key/model ${model} falhou com ${response.status}, tentando próximo...`);
          continue;
        }

        if (!response.ok) {
          throw new Error(`Erro Gemini: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (error) {
        console.error(`Erro com modelo ${model}:`, error);
        continue;
      }
    }
  }
  throw new Error('Todas as tentativas de Gemini falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentarioId, tipo } = await req.json();
    
    if (!documentarioId) {
      throw new Error('documentarioId é obrigatório');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar documentário
    const { data: doc, error: docError } = await supabase
      .from('politica_documentarios')
      .select('*')
      .eq('id', documentarioId)
      .single();

    if (docError || !doc) {
      throw new Error('Documentário não encontrado');
    }

    // Verificar se já tem conteúdo gerado
    if (tipo === 'sobre' && doc.sobre_gerado) {
      return new Response(JSON.stringify({ 
        content: doc.sobre_gerado,
        cached: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (tipo === 'analise' && doc.analise_gerada) {
      return new Response(JSON.stringify({ 
        content: doc.analise_gerada,
        cached: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let prompt: string;
    let fieldToUpdate: string;

    if (tipo === 'sobre') {
      prompt = `Você é um especialista em documentários políticos. Com base nas informações abaixo, escreva um texto ORIGINAL de "Sobre o Documentário" com 3-4 parágrafos. NÃO use a descrição original do YouTube. Crie um texto próprio, informativo e envolvente que explique:
- O tema principal e a tese do documentário
- O contexto histórico/político abordado
- Por que é relevante assistir
- A perspectiva/viés ideológico (${doc.orientacao})

Título: ${doc.titulo}
Canal: ${doc.canal}
Orientação: ${doc.orientacao}
Descrição original (use apenas como referência, não copie): ${doc.descricao}

Escreva em português brasileiro, de forma clara e acessível.`;
      fieldToUpdate = 'sobre_gerado';
    } else {
      prompt = `Você é um analista político imparcial. Analise criticamente o documentário abaixo, considerando:

1. **Viés Ideológico**: Identifique a perspectiva (${doc.orientacao}) e como ela influencia a narrativa
2. **Argumentos Principais**: Resuma os pontos centrais defendidos
3. **Contrapontos**: Apresente possíveis críticas ou visões opostas
4. **Contexto**: Situe o documentário no debate político brasileiro atual
5. **Pontos Fortes e Fracos**: Avalie a qualidade argumentativa

Título: ${doc.titulo}
Canal: ${doc.canal}
Orientação: ${doc.orientacao}
Descrição: ${doc.descricao}

Formato: Use markdown com subtítulos (##) para cada seção. Seja equilibrado e educativo.`;
      fieldToUpdate = 'analise_gerada';
    }

    console.log(`Gerando ${tipo} para documentário: ${doc.titulo}`);
    const content = await callGeminiWithFallback(prompt);

    // Salvar no banco
    const updateData: Record<string, string> = {};
    updateData[fieldToUpdate] = content;
    
    await supabase
      .from('politica_documentarios')
      .update(updateData)
      .eq('id', documentarioId);

    return new Response(JSON.stringify({ 
      content,
      cached: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
