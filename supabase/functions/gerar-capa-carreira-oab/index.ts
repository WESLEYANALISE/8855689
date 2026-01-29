import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[];

const MODELOS_IMAGEM = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-preview-image-generation'
];

async function gerarImagemComModelo(prompt: string, apiKey: string, modelo: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["image", "text"],
          responseMimeType: "text/plain"
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GEMINI_ERROR_${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return part.inlineData.data;
    }
  }
  
  throw new Error('Imagem não gerada');
}

async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  for (const modelo of MODELOS_IMAGEM) {
    for (let i = 0; i < API_KEYS.length; i++) {
      try {
        console.log(`Tentando ${modelo} com key ${i + 1}...`);
        const result = await gerarImagemComModelo(prompt, API_KEYS[i], modelo);
        console.log(`✅ Sucesso`);
        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('404')) break;
        if (msg.includes('429') || msg.includes('400')) continue;
      }
    }
  }
  return null;
}

async function comprimirImagemTinyPNG(base64Data: string): Promise<{ data: Uint8Array; contentType: string }> {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  if (!TINYPNG_API_KEY) {
    return { data: bytes, contentType: 'image/png' };
  }

  try {
    const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`,
        'Content-Type': 'image/png'
      },
      body: bytes
    });

    if (!shrinkResponse.ok) {
      return { data: bytes, contentType: 'image/png' };
    }

    const shrinkData = await shrinkResponse.json();

    const convertResponse = await fetch(shrinkData.output.url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ convert: { type: "image/webp" } })
    });

    if (!convertResponse.ok) {
      const pngResponse = await fetch(shrinkData.output.url);
      const pngData = await pngResponse.arrayBuffer();
      return { data: new Uint8Array(pngData), contentType: 'image/png' };
    }

    const webpData = await convertResponse.arrayBuffer();
    return { data: new Uint8Array(webpData), contentType: 'image/webp' };
  } catch {
    return { data: bytes, contentType: 'image/png' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ordem, titulo } = await req.json();
    
    if (!ordem || !titulo) {
      return new Response(
        JSON.stringify({ error: 'ordem e titulo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar se já existe capa
    const { data: artigo } = await supabase
      .from('oab_carreira_blog')
      .select('url_capa')
      .eq('ordem', ordem)
      .single();

    if (artigo?.url_capa) {
      return new Response(
        JSON.stringify({ imagem_url: artigo.url_capa, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Gerando capa para: ${titulo}`);

    const prompt = `Generate a photorealistic 16:9 cinematic photograph for a legal career article titled: "${titulo}"

VISUAL ELEMENTS:
- Young professional lawyer in modern office
- Briefcase, legal documents, laptop on elegant desk
- Law books on shelves in background
- Modern city skyline through window
- Professional networking event atmosphere
- Graduation or achievement moment

PHOTOGRAPHY STYLE:
- Editorial quality like Harvard Business Review
- Warm lighting with golden hour tones
- Shallow depth of field
- Ultra high resolution 8K
- Colors: navy blue, warm wood tones, gold accents

Focus on career growth, success, and professional development in law.
DO NOT include: text, watermarks, logos, identifiable faces.`;

    const base64Image = await gerarImagemComGemini(prompt);
    
    if (!base64Image) {
      return new Response(
        JSON.stringify({ error: 'Falha ao gerar imagem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processedImage = await comprimirImagemTinyPNG(base64Image);
    
    const extension = processedImage.contentType === 'image/webp' ? 'webp' : 'png';
    const fileName = `carreira-oab/capa-${ordem}-${Date.now()}.${extension}`;
    
    const { error: uploadError } = await supabase.storage
      .from('gerador-imagens')
      .upload(fileName, processedImage.data, {
        contentType: processedImage.contentType,
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('gerador-imagens')
      .getPublicUrl(fileName);

    const imagemUrl = urlData.publicUrl;

    await supabase
      .from('oab_carreira_blog')
      .update({ url_capa: imagemUrl })
      .eq('ordem', ordem);

    return new Response(
      JSON.stringify({ imagem_url: imagemUrl, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
