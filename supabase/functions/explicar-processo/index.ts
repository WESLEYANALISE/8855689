import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { numeroProcesso, classeProcessual, assunto, tribunal } = await req.json();

    console.log(`[EXPLICAR PROCESSO] ${numeroProcesso} - ${classeProcessual}`);

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const prompt = `Você é um assistente jurídico educacional. Explique de forma didática e acessível:

**Processo**: ${numeroProcesso}
**Tribunal**: ${tribunal}
**Classe Processual**: ${classeProcessual}
**Assunto**: ${assunto}

Por favor, explique:
1. O que significa esta classe processual (${classeProcessual})
2. Qual é o objetivo deste tipo de processo
3. Como funciona o trâmite deste tipo de ação
4. Quais são as fases principais
5. Possíveis desfechos e desdobramentos

Use linguagem simples, como se estivesse explicando para um estudante de direito iniciante.
Seja didático, objetivo e educativo. Máximo 300 palavras.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GEMINI ERROR]', errorText);
      throw new Error(`Erro na API do Gemini: ${response.status}`);
    }

    const data = await response.json();
    const explicacao = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      'Não foi possível gerar uma explicação';

    console.log('[EXPLICAÇÃO GERADA] Sucesso');

    return new Response(
      JSON.stringify({ explicacao }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERRO] Falha ao explicar processo:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro ao gerar explicação'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
