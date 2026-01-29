import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chaves Gemini com fallback (mesmas do chat-professora)
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY')
].filter(Boolean) as string[];

// Prompts específicos por categoria
const PROMPTS_CATEGORIA: Record<string, string> = {
  'iniciando': 'A photorealistic 8K cinematic image of a young law student opening a large ancient law book for the first time in a grand library, golden sunlight streaming through tall windows, dust particles floating in the air, warm tones, inspiring atmosphere of beginning a legal journey',
  
  'carreiras': 'A photorealistic 8K cinematic image showing diverse legal professionals - a judge with gavel, lawyer in suit, police officer - standing together in a modern courthouse atrium, dramatic lighting, professional and aspirational atmosphere',
  
  'termos': 'A photorealistic 8K cinematic image of an ornate legal dictionary open on a mahogany desk, magnifying glass over Latin terms, quill pen and ink, old legal documents in background, warm candlelight ambiance, scholarly aesthetic',
  
  'curiosidades': 'A photorealistic 8K cinematic image of a mysterious legal curiosity cabinet - ancient scales of justice, unusual legal artifacts, old court wigs, fascinating legal oddities, dramatic spotlight lighting, intriguing and mysterious mood',
  
  'areas': 'A photorealistic 8K cinematic image of a modern law firm with multiple practice areas visualized - criminal, civil, tax, labor law symbols elegantly displayed, glass and marble interior, professional blue and gold tones',
  
  'principios': 'A photorealistic 8K cinematic image of Lady Justice statue in a temple-like setting, blindfolded, holding perfect balanced scales and sword, marble columns, ethereal golden light, symbolizing fundamental legal principles'
};

async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  console.log(`Tentando gerar imagem com ${API_KEYS.length} chaves disponíveis`);
  
  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      console.log(`Tentando chave ${i + 1}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEYS[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"]
            }
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Chave ${i + 1} falhou (${response.status}): ${errorText}`);
        continue;
      }
      
      const data = await response.json();
      
      for (const part of data.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          console.log(`Sucesso com chave ${i + 1}`);
          return part.inlineData.data;
        }
      }
      
      console.log(`Chave ${i + 1} não retornou imagem`);
    } catch (err) {
      console.log(`Chave ${i + 1} erro:`, err);
      continue;
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categoria, titulo } = await req.json();
    
    if (!categoria) {
      return new Response(JSON.stringify({ error: "Categoria é obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Gerando capa para categoria: ${categoria}`);
    
    // Usar prompt específico ou gerar um genérico
    let prompt = PROMPTS_CATEGORIA[categoria];
    
    if (!prompt && titulo) {
      prompt = `A photorealistic 8K cinematic image representing the legal concept of "${titulo}" in Brazilian law, dramatic lighting, professional atmosphere, warm golden and blue tones, highly detailed, inspiring`;
    } else if (!prompt) {
      prompt = `A photorealistic 8K cinematic image of a professional legal concept related to "${categoria}", Brazilian law theme, dramatic courthouse lighting, golden hour, inspiring atmosphere`;
    }

    const base64Image = await gerarImagemComGemini(prompt);
    
    if (!base64Image) {
      return new Response(JSON.stringify({ 
        error: "Falha ao gerar imagem",
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fazer upload para Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = `categoria-${categoria}-${Date.now()}.webp`;
    const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('gerador-imagens')
      .upload(fileName, imageBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error('Erro upload:', uploadError);
      // Retornar como data URL se upload falhar
      return new Response(JSON.stringify({ 
        success: true,
        imageUrl: `data:image/webp;base64,${base64Image}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('gerador-imagens')
      .getPublicUrl(fileName);

    return new Response(JSON.stringify({ 
      success: true,
      imageUrl: publicUrlData.publicUrl
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
