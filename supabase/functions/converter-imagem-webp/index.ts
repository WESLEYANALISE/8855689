import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Comprimir e converter para WebP usando TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[TinyPNG] Comprimindo ${imageBytes.length} bytes...`);
  
  const buffer = imageBytes.buffer.slice(
    imageBytes.byteOffset, 
    imageBytes.byteOffset + imageBytes.byteLength
  ) as ArrayBuffer;
  
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      'Content-Type': 'application/octet-stream'
    },
    body: buffer
  });

  if (!shrinkResponse.ok) {
    throw new Error(`TinyPNG shrink error: ${shrinkResponse.status}`);
  }

  const result = await shrinkResponse.json();
  const outputUrl = result.output?.url;
  if (!outputUrl) throw new Error('TinyPNG não retornou URL');

  // Converter para WebP
  const convertResponse = await fetch(outputUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ convert: { type: 'image/webp' } })
  });

  if (!convertResponse.ok) {
    // Fallback: retornar PNG comprimido se WebP falhar
    console.log('[TinyPNG] WebP falhou, usando PNG comprimido');
    const pngResponse = await fetch(outputUrl);
    return new Uint8Array(await pngResponse.arrayBuffer());
  }

  const webpBytes = new Uint8Array(await convertResponse.arrayBuffer());
  const reducao = Math.round((1 - webpBytes.length / imageBytes.length) * 100);
  console.log(`[TinyPNG] ${imageBytes.length} → ${webpBytes.length} bytes (${reducao}% redução)`);
  
  return webpBytes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()
    
    if (!imageUrl) {
      throw new Error('imageUrl é obrigatório')
    }

    console.log('[converter-imagem-webp] Processando:', imageUrl);

    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY')
    if (!TINYPNG_API_KEY) {
      throw new Error('TINYPNG_API_KEY não configurada')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Verificar cache primeiro
    const { data: cached } = await supabase
      .from('cache_imagens_webp')
      .select('url_webp')
      .eq('url_original', imageUrl)
      .single();

    if (cached?.url_webp) {
      console.log('[converter-imagem-webp] Cache hit!');
      return new Response(
        JSON.stringify({ success: true, url: cached.url_webp, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Baixar imagem original
    console.log('[converter-imagem-webp] Baixando imagem...');
    let imageResponse;
    try {
      imageResponse = await fetch(imageUrl, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        }
      });
    } catch (fetchError) {
      console.error('[converter-imagem-webp] Erro ao fazer fetch:', fetchError);
      throw new Error(`Não foi possível acessar a URL: ${imageUrl}`);
    }
    
    if (!imageResponse.ok) {
      throw new Error(`Erro ao baixar imagem: ${imageResponse.status} ${imageResponse.statusText}`)
    }
    
    const imageBytes = new Uint8Array(await imageResponse.arrayBuffer())
    const tamanhoOriginal = imageBytes.length;
    console.log('[converter-imagem-webp] Tamanho original:', tamanhoOriginal, 'bytes');

    // Validar se a imagem foi baixada corretamente
    if (tamanhoOriginal < 100) {
      console.error('[converter-imagem-webp] Imagem muito pequena ou vazia:', tamanhoOriginal, 'bytes');
      throw new Error(`Imagem inválida ou inacessível (${tamanhoOriginal} bytes)`);
    }

    // 3. Converter para WebP
    const webpBytes = await comprimirParaWebP(imageBytes, TINYPNG_API_KEY)
    const tamanhoWebP = webpBytes.length;

    // 4. Fazer upload para Storage
    const timestamp = Date.now();
    const hash = imageUrl.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'img';
    const fileName = `noticias/${hash}-${timestamp}.webp`;
    
    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(fileName, webpBytes, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`)
    }

    // 5. Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('imagens')
      .getPublicUrl(fileName);

    const urlWebP = publicUrlData.publicUrl;
    console.log('[converter-imagem-webp] Upload concluído:', urlWebP);

    // 6. Salvar no cache
    await supabase
      .from('cache_imagens_webp')
      .insert({
        url_original: imageUrl,
        url_webp: urlWebP,
        tamanho_original: tamanhoOriginal,
        tamanho_webp: tamanhoWebP
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        url: urlWebP,
        cached: false,
        tamanhoOriginal,
        tamanhoWebP,
        reducao: Math.round((1 - tamanhoWebP / tamanhoOriginal) * 100)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[converter-imagem-webp] Erro:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
