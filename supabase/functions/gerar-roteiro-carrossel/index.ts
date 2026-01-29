import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artigo, leiNome, textoArtigo } = await req.json();
    
    console.log('Gerando roteiro para:', { artigo, leiNome });

    if (API_KEYS.length === 0) {
      throw new Error("Nenhuma chave GEMINI_KEY configurada");
    }

    const systemPrompt = `Você é um especialista em criar conteúdo educacional jurídico para Instagram.
Sua tarefa é criar um roteiro de carrossel para explicar um artigo de lei de forma didática e visualmente atraente.

REGRAS:
1. Crie entre 4 a 6 slides (dependendo da complexidade do artigo)
2. Use linguagem simples e acessível
3. Cada slide deve ter:
   - Um título curto e impactante
   - Um texto explicativo (máximo 100 caracteres)
   - Uma sugestão de elemento visual (emoji ou descrição de ícone)
4. Estrutura sugerida:
   - Slide 1: Chamada + número do artigo
   - Slides 2-4: Explicação em partes
   - Slide 5: Exemplo prático
   - Slide 6: CTA ("Salve para não esquecer!")

RETORNE APENAS um JSON válido no formato:
{
  "slides": [
    {
      "numero": 1,
      "titulo": "Título do slide",
      "texto": "Texto explicativo curto",
      "elemento_visual": "⚖️",
      "destaque": "Frase de destaque opcional"
    }
  ],
  "hashtags": ["#direito", "#concurso"],
  "resumo": "Resumo em uma frase do artigo"
}`;

    const userPrompt = `Crie um roteiro de carrossel para Instagram sobre:

LEI: ${leiNome}
ARTIGO: ${artigo}
TEXTO DO ARTIGO: ${textoArtigo}

Retorne APENAS o JSON, sem explicações adicionais.`;

    let lastError: Error | null = null;
    
    for (const apiKey of API_KEYS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
              }
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro com chave API:", response.status, errorText);
          lastError = new Error(`Erro API: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
          lastError = new Error("Resposta vazia da API");
          continue;
        }

        // Extrair JSON da resposta
        let roteiro;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            roteiro = JSON.parse(jsonMatch[0]);
          } else {
            roteiro = JSON.parse(content);
          }
        } catch (parseError) {
          console.error("Erro ao parsear JSON:", parseError, content);
          lastError = new Error("Formato de resposta inválido");
          continue;
        }

        console.log('Roteiro gerado com sucesso:', roteiro.slides?.length, 'slides');

        return new Response(JSON.stringify({
          success: true,
          roteiro
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Erro com chave:', error);
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    throw lastError || new Error("Todas as chaves API falharam");

  } catch (error) {
    console.error('Erro ao gerar roteiro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
