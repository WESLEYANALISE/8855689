import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
  Deno.env.get("DIREITO_PREMIUM_API_KEY"),
].filter(Boolean);

async function callGeminiWithFallback(prompt: string): Promise<string> {
  for (const apiKey of GEMINI_KEYS) {
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
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      if (response.status === 429 || response.status === 503) {
        console.log(`Key rate limited, trying next...`);
        continue;
      }
    } catch (error) {
      console.error(`Error with key:`, error);
      continue;
    }
  }
  throw new Error("All Gemini keys exhausted");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { funcionalidade_id, titulo, contexto, categoria, rota, icone, ordem } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe no cache
    const { data: existing } = await supabase
      .from("tutoriais_cache")
      .select("*")
      .eq("funcionalidade_id", funcionalidade_id)
      .single();

    if (existing) {
      return new Response(JSON.stringify(existing), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gerar conteúdo com Gemini
    const prompt = `Você é um assistente de um aplicativo jurídico brasileiro chamado "App Direito".
Gere um tutorial detalhado para a funcionalidade "${titulo}".

Contexto da funcionalidade:
${contexto}

Responda APENAS em JSON válido com esta estrutura exata:
{
  "descricao_curta": "Uma frase curta (máximo 80 caracteres) explicando o que a funcionalidade faz",
  "funcionalidades": [
    {
      "nome": "Nome da sub-funcionalidade",
      "descricao": "Explicação clara de como usar (2-3 frases)",
      "exemplo": "Exemplo prático de uso"
    }
  ]
}

Regras:
- Linguagem simples e acessível
- Foque em como o usuário pode usar na prática
- Liste todas as sub-funcionalidades disponíveis
- Exemplos devem ser práticos e relacionados ao direito brasileiro
- Mínimo 3, máximo 8 funcionalidades por item`;

    const geminiResponse = await callGeminiWithFallback(prompt);
    
    // Parse JSON da resposta
    let parsedContent;
    try {
      const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      parsedContent = {
        descricao_curta: `Explore ${titulo} no App Direito`,
        funcionalidades: [
          {
            nome: titulo,
            descricao: contexto || `Funcionalidade ${titulo} do aplicativo`,
            exemplo: "Clique para explorar esta funcionalidade"
          }
        ]
      };
    }

    // Salvar no cache
    const tutorialData = {
      funcionalidade_id,
      titulo,
      categoria,
      rota: rota || "/",
      icone: icone || "HelpCircle",
      ordem: ordem || 0,
      descricao_curta: parsedContent.descricao_curta,
      funcionalidades: parsedContent.funcionalidades,
      steps: [], // Steps serão definidos manualmente depois
    };

    const { data: inserted, error } = await supabase
      .from("tutoriais_cache")
      .insert(tutorialData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      throw error;
    }

    return new Response(JSON.stringify(inserted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
