import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fallback de API keys para resiliência
const getApiKeys = () => {
  const keys = [
    Deno.env.get("GEMINI_KEY_1"),
    Deno.env.get("GEMINI_KEY_2"),
    Deno.env.get("GEMINI_KEY_3"),
    Deno.env.get("DIREITO_PREMIUM_API_KEY"),
  ].filter(Boolean);
  return keys;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conteudo } = await req.json();
    
    if (!conteudo || conteudo.trim().length < 50) {
      throw new Error("Conteúdo insuficiente para gerar questões");
    }

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      throw new Error("Nenhuma API key configurada");
    }

    const systemPrompt = `Você é um professor especializado em criar questões de múltipla escolha sobre direito brasileiro.
Crie questões objetivas, claras e educacionais no estilo de concursos públicos e OAB.

REGRAS:
1. Crie exatamente 3 questões baseadas no conteúdo fornecido
2. Cada questão deve ter 4 alternativas (A, B, C, D)
3. Apenas uma alternativa deve ser correta
4. A explicação deve ser didática e mencionar a base legal quando possível
5. As questões devem testar compreensão, não apenas memorização

Retorne APENAS um JSON válido no seguinte formato:
{
  "questoes": [
    {
      "pergunta": "texto da pergunta",
      "alternativas": ["A) opção A", "B) opção B", "C) opção C", "D) opção D"],
      "resposta_correta": 0,
      "explicacao": "explicação detalhada"
    }
  ]
}`;

    let lastError = null;
    
    for (const apiKey of apiKeys) {
      try {
        console.log('🔄 Tentando gerar questões...');
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${systemPrompt}\n\nConteúdo para criar questões:\n\n${conteudo.substring(0, 4000)}`
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000,
              }
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Erro API (${response.status}):`, errorText.substring(0, 200));
          lastError = new Error(`API error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Extrair JSON da resposta
        let jsonText = text.trim();
        
        // Remover fences de código
        const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (fenceMatch) {
          jsonText = fenceMatch[1].trim();
        }
        
        // Encontrar o início e fim do JSON
        const jsonStart = jsonText.indexOf('{');
        const jsonEnd = jsonText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonText = jsonText.slice(jsonStart, jsonEnd + 1);
        }

        const parsed = JSON.parse(jsonText);
        const questoes = parsed.questoes || [];

        if (!Array.isArray(questoes) || questoes.length === 0) {
          throw new Error("Nenhuma questão gerada");
        }

        console.log(`✅ ${questoes.length} questões geradas com sucesso`);

        return new Response(
          JSON.stringify({ questoes }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } catch (keyError) {
        console.error('❌ Erro com esta key:', keyError);
        lastError = keyError;
        continue;
      }
    }

    throw lastError || new Error("Todas as tentativas falharam");

  } catch (error) {
    console.error("Erro gerar-questoes-chat:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        questoes: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
