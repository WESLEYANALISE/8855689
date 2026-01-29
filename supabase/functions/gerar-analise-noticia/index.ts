import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  for (const apiKey of GEMINI_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      
      if (response.status === 429 || response.status === 503) {
        console.log(`API key rate limited, trying next...`);
        continue;
      }
    } catch (error) {
      console.error('Gemini API error:', error);
    }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { titulo, url } = await req.json();

    if (!titulo) {
      throw new Error('Título não fornecido');
    }

    console.log('Gerando análise para:', titulo);

    const prompt = `Você é um analista político brasileiro. Analise a notícia e responda em JSON:

TÍTULO: ${titulo}
URL: ${url || 'não disponível'}

RESPONDA EXATAMENTE NESTE FORMATO JSON:
{
  "resumoExecutivo": "Análise técnica em 3-4 frases SEM Markdown. Contexto político, envolvidos e implicações de forma clara.",
  "resumoFacil": "Explicação em 2-3 frases BEM SIMPLES, sem Markdown. O que aconteceu? Por que eu deveria me importar? Como isso afeta minha vida?",
  "pontosPrincipais": ["ponto 1", "ponto 2", "ponto 3", "ponto 4"],
  "termos": [
    {"termo": "Termo técnico/político", "significado": "Explicação simples do termo"}
  ]
}

IMPORTANTE:
- NÃO use asteriscos (**), hífens (-) ou qualquer formatação Markdown
- resumoFacil deve ser BEM SIMPLES, para leigos, explicando "por que eu deveria me importar com isso?"
- termos deve incluir TODOS os termos políticos, jurídicos ou técnicos da notícia
- Retorne APENAS o JSON, sem texto adicional`;

    const resposta = await callGeminiWithFallback(prompt);
    
    // Extrair JSON da resposta
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    let analiseData = {
      resumoExecutivo: '',
      resumoFacil: '',
      pontosPrincipais: [] as string[],
      termos: [] as Array<{termo: string; significado: string}>
    };
    
    if (jsonMatch) {
      try {
        analiseData = JSON.parse(jsonMatch[0]);
      } catch {
        // Se falhar o parse, usar texto bruto
        analiseData.resumoExecutivo = resposta;
      }
    } else {
      analiseData.resumoExecutivo = resposta;
    }

    console.log('Análise gerada com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        ...analiseData,
        titulo
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Erro ao gerar análise:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
