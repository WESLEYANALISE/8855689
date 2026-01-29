import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const REVISION = "v2.0.0";
const MODEL = "gemini-2.0-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sistema de fallback com 4 chaves API
async function chamarGeminiComFallback(prompt: string): Promise<string> {
  const API_KEYS = [
    { name: 'GEMINI_KEY_1', key: Deno.env.get('GEMINI_KEY_1') },
    { name: 'GEMINI_KEY_2', key: Deno.env.get('GEMINI_KEY_2') },
    { name: 'GEMINI_KEY_3', key: Deno.env.get('GEMINI_KEY_3') },
    { name: 'DIREITO_PREMIUM_API_KEY', key: Deno.env.get('DIREITO_PREMIUM_API_KEY') }
  ].filter(k => k.key);

  if (API_KEYS.length === 0) {
    throw new Error('Nenhuma API key configurada');
  }

  console.log(`🔑 ${API_KEYS.length} chaves API disponíveis`);

  for (const { name, key } of API_KEYS) {
    try {
      console.log(`📝 Tentando ${name}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log(`✅ Sucesso com ${name}`);
        return result;
      }
      
      const errorText = await response.text();
      
      if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')) {
        console.log(`⚠️ Quota excedida em ${name}, tentando próxima...`);
        continue;
      }
      
      console.error(`❌ Erro ${response.status} em ${name}: ${errorText.substring(0, 200)}`);
      continue;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Exceção em ${name}: ${msg}`);
      continue;
    }
  }
  
  throw new Error(`Todas as ${API_KEYS.length} chaves API falharam`);
}

serve(async (req) => {
  console.log(`📍 Function: gerar-exemplo-flashcard@${REVISION} | Model: ${MODEL}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flashcard_id, pergunta, resposta, area, tabela } = await req.json();

    if (!flashcard_id || !pergunta || !resposta) {
      throw new Error("flashcard_id, pergunta e resposta são obrigatórios");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verificar se já existe exemplo em cache
    const tableName = tabela === 'artigos-lei' ? "FLASHCARDS - ARTIGOS LEI" : "FLASHCARDS";
    
    const { data: cached } = await supabase
      .from(tableName)
      .select("exemplo")
      .eq("id", flashcard_id)
      .maybeSingle();

    if (cached?.exemplo) {
      console.log("✅ Retornando exemplo do cache - 0 tokens gastos");
      return new Response(
        JSON.stringify({ exemplo: cached.exemplo, cached: true }),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Function-Revision": REVISION,
            "X-Model": MODEL,
          } 
        }
      );
    }

    // Gerar novo exemplo com Gemini
    const prompt = `Crie um exemplo prático jurídico para este flashcard de ${area || 'Direito'}.

PERGUNTA: ${pergunta}

RESPOSTA: ${resposta}

O exemplo deve:
- Ser uma situação REAL e CONCRETA do dia a dia jurídico brasileiro
- Ter 3-4 frases no máximo
- Mostrar aplicação prática do conceito na vida real
- Usar nomes fictícios para pessoas (ex: João, Maria, empresa X)
- Ser claro, direto e memorável
- Ajudar o estudante a entender como o conceito se aplica na prática

Retorne APENAS o exemplo prático, sem introdução, título ou explicação adicional.`;

    const exemplo = await chamarGeminiComFallback(prompt);

    if (!exemplo) {
      throw new Error("Nenhum exemplo foi gerado pela IA");
    }

    // Salvar exemplo no banco
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        exemplo: exemplo.trim(),
      })
      .eq("id", flashcard_id);

    if (updateError) {
      console.error("❌ Erro ao salvar exemplo no banco:", updateError);
    } else {
      console.log("💾 Exemplo salvo no banco - próximos requests usarão cache");
    }

    return new Response(
      JSON.stringify({ exemplo: exemplo.trim(), cached: false }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Function-Revision": REVISION,
          "X-Model": MODEL,
        } 
      }
    );
  } catch (error) {
    console.error("❌ Erro em gerar-exemplo-flashcard:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        provider: "google",
        model: MODEL,
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Function-Revision": REVISION,
          "X-Model": MODEL,
        },
      }
    );
  }
});
