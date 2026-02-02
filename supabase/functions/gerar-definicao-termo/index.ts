import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pool de chaves Gemini para fallback (mesmas do gerar conteúdo)
const getGeminiKeys = (): string[] => {
  return [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
  ].filter(Boolean) as string[];
};

// Normaliza termo para busca no cache
function normalizarTermo(termo: string): string {
  return termo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Gera definição e exemplo prático usando Gemini
async function gerarDefinicaoComGemini(termo: string): Promise<{ definicao: string; exemploPratico: string }> {
  const keys = getGeminiKeys();
  if (keys.length === 0) {
    throw new Error("Nenhuma chave Gemini configurada");
  }

  const prompt = `Você é um professor de Direito brasileiro. Para o termo jurídico "${termo}", forneça:

1. DEFINIÇÃO: Uma explicação concisa (máximo 3 frases) do significado jurídico do termo.
2. EXEMPLO PRÁTICO: Um exemplo curto (1-2 frases) de aplicação prática do termo no dia a dia jurídico.

REGRAS:
- Seja didático e claro
- Use linguagem acessível para estudantes de Direito
- Foque no significado jurídico do termo
- Não use formatação markdown
- Responda EXATAMENTE no formato JSON abaixo, sem texto adicional

Formato de resposta:
{"definicao": "...", "exemploPratico": "..."}

Termo: ${termo}`;

  let lastError: Error | null = null;

  for (const apiKey of keys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 300,
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Chave falhou: ${errorText.substring(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (resposta && resposta.trim().length > 10) {
        // Tentar parsear como JSON
        try {
          // Limpar resposta de possíveis caracteres extras
          const jsonMatch = resposta.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.definicao) {
              return {
                definicao: parsed.definicao.trim(),
                exemploPratico: parsed.exemploPratico?.trim() || ""
              };
            }
          }
        } catch (parseError) {
          // Se não for JSON, usar como definição simples
          console.log("Resposta não é JSON, usando como texto simples");
        }
        
        // Fallback: usar resposta como definição simples
        return { definicao: resposta.trim(), exemploPratico: "" };
      }
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Erro com chave: ${lastError.message}`);
    }
  }

  throw lastError || new Error("Falha ao gerar definição com todas as chaves");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termo } = await req.json();
    
    if (!termo || typeof termo !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: "Termo não fornecido" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const termoNormalizado = normalizarTermo(termo);
    console.log(`Buscando definição para: "${termo}" (normalizado: "${termoNormalizado}")`);

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Verificar cache
    const { data: cached, error: cacheError } = await supabase
      .from('cache_definicoes_termos')
      .select('definicao')
      .eq('termo_normalizado', termoNormalizado)
      .maybeSingle();

    if (cached?.definicao) {
      console.log(`Cache hit para: "${termo}"`);
      return new Response(
        JSON.stringify({ success: true, definicao: cached.definicao, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Gerar com IA
    console.log(`Gerando definição com IA para: "${termo}"`);
    const resultado = await gerarDefinicaoComGemini(termo);

    // 3. Salvar no cache (apenas definição, exemplo pode variar)
    const { error: insertError } = await supabase
      .from('cache_definicoes_termos')
      .upsert({
        termo: termo,
        termo_normalizado: termoNormalizado,
        definicao: resultado.definicao,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'termo_normalizado'
      });

    if (insertError) {
      console.error('Erro ao salvar cache:', insertError);
    } else {
      console.log(`Definição salva no cache para: "${termo}"`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        definicao: resultado.definicao, 
        exemploPratico: resultado.exemploPratico,
        fromCache: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erro:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});