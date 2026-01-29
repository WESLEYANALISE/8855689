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

const TINYPNG_KEY = Deno.env.get('TINYPNG_API_KEY');

async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  for (const apiKey of GEMINI_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"]
            }
          })
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`API key rate limited, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        console.error(`Erro Gemini: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          return part.inlineData.data;
        }
      }
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
    }
  }
  return null;
}

async function comprimirImagemTinyPNG(base64Data: string): Promise<{ data: Uint8Array; contentType: string } | null> {
  if (!TINYPNG_KEY) {
    console.log('TinyPNG não configurado, usando imagem original');
    return null;
  }

  try {
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const response = await fetch('https://api.tinify.com/shrink', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${TINYPNG_KEY}`)}`,
        'Content-Type': 'image/png'
      },
      body: binaryData
    });

    if (!response.ok) {
      console.error('Erro TinyPNG:', response.status);
      return null;
    }

    const result = await response.json();
    
    // Converter para WebP
    const convertResponse = await fetch(result.output.url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${TINYPNG_KEY}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ convert: { type: ['image/webp'] } })
    });

    if (convertResponse.ok) {
      const webpData = new Uint8Array(await convertResponse.arrayBuffer());
      return { data: webpData, contentType: 'image/webp' };
    }

    // Fallback para PNG comprimido
    const pngResponse = await fetch(result.output.url);
    const pngData = new Uint8Array(await pngResponse.arrayBuffer());
    return { data: pngData, contentType: 'image/png' };
  } catch (error) {
    console.error('Erro ao comprimir imagem:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { carreira, nome } = await req.json();
    
    if (!carreira || !nome) {
      throw new Error('Parâmetros carreira e nome são obrigatórios');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe capa
    const { data: existente } = await supabase
      .from('carreiras_capas')
      .select('url_capa')
      .eq('carreira', carreira)
      .single();

    if (existente?.url_capa) {
      return new Response(
        JSON.stringify({ url_capa: existente.url_capa }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prompts específicos para cada carreira - capas impactantes sem texto
    const prompts: Record<string, string> = {
      advogado: 'Cinematic dramatic book cover image. A majestic golden scale of justice in spotlight against dark marble background. Rich burgundy velvet and antique gold accents. Dramatic chiaroscuro lighting. Luxurious legal atmosphere. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS. Ultra high resolution photorealistic. Portrait 2:3 ratio.',
      juiz: 'Cinematic dramatic book cover image. Powerful wooden judges gavel striking down with dramatic lighting. Blindfolded Lady Justice statue in background. Deep navy blue and silver tones. Majestic courthouse atmosphere with dramatic shadows. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS. Ultra high resolution photorealistic. Portrait 2:3 ratio.',
      delegado: 'Cinematic dramatic book cover image. Police detective badge gleaming under spotlight. Crime investigation scene with magnifying glass, case files, fingerprints. Dark noir atmosphere with bronze and charcoal tones. Mystery and authority. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS. Ultra high resolution photorealistic. Portrait 2:3 ratio.',
      promotor: 'Cinematic dramatic book cover image. Scales of justice protecting symbolic citizens. Brazilian Ministério Público shield imagery. Deep emerald green and gold colors. Noble guardian atmosphere with dramatic lighting. Courthouse columns in background. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS. Ultra high resolution photorealistic. Portrait 2:3 ratio.',
    };

    const prompt = prompts[carreira] || `Cinematic dramatic book cover for ${nome} career. Professional legal imagery with dramatic lighting. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS. Ultra high resolution photorealistic. Portrait 2:3 ratio.`;

    console.log(`Gerando capa para carreira: ${nome}`);
    
    const base64Image = await gerarImagemComGemini(prompt);
    
    if (!base64Image) {
      throw new Error('Falha ao gerar imagem com Gemini');
    }

    // Comprimir e converter para WebP
    const compressed = await comprimirImagemTinyPNG(base64Image);
    
    let imageData: Uint8Array;
    let contentType: string;
    let fileExt: string;
    
    if (compressed) {
      imageData = compressed.data;
      contentType = compressed.contentType;
      fileExt = contentType === 'image/webp' ? 'webp' : 'png';
    } else {
      imageData = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
      contentType = 'image/png';
      fileExt = 'png';
    }

    // Upload para Storage
    const fileName = `carreiras/${carreira}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('CAPAS')
      .upload(fileName, imageData, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('CAPAS')
      .getPublicUrl(fileName);

    // Salvar no banco
    const { error: insertError } = await supabase
      .from('carreiras_capas')
      .upsert({
        carreira,
        url_capa: publicUrl,
        updated_at: new Date().toISOString()
      }, { onConflict: 'carreira' });

    if (insertError) {
      console.error('Erro ao salvar capa:', insertError);
    }

    return new Response(
      JSON.stringify({ url_capa: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
