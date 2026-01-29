import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Presets de tamanho otimizados para cada contexto
const PRESETS: Record<string, { width: number; height: number }> = {
  // Miniaturas e carrosséis (super pequenos)
  'thumb': { width: 100, height: 56 },        // Miniaturas 16:9
  'carousel-sm': { width: 144, height: 81 },  // Carrossel pequeno (boletins)
  'carousel': { width: 200, height: 113 },    // Carrossel padrão
  'sidebar': { width: 200, height: 100 },     // Sidebar 2:1
  
  // Cards
  'card-xs': { width: 200, height: 113 },     // Card extra pequeno
  'card-sm': { width: 240, height: 135 },     // Card pequeno (notícias carrossel)
  'card': { width: 300, height: 169 },        // Card médio
  'card-lg': { width: 400, height: 225 },     // Card grande
  
  // Telas
  'mobile': { width: 480, height: 270 },      // Mobile (reduzido)
  'tablet': { width: 640, height: 360 },      // Tablet
  'desktop': { width: 848, height: 477 },     // Desktop
  
  // Logos
  'logo-sm': { width: 64, height: 64 },
  'logo-md': { width: 128, height: 128 },
  'logo-lg': { width: 256, height: 256 },
};

async function comprimirRedimensionarWebP(
  imageBytes: Uint8Array,
  apiKey: string,
  width: number,
  height: number
): Promise<{ webpBytes: Uint8Array; tamanhoOriginal: number; tamanhoFinal: number }> {
  const tamanhoOriginal = imageBytes.length;
  
  // Passo 1: Shrink (comprimir)
  console.log(`[TinyPNG] Comprimindo imagem de ${tamanhoOriginal} bytes...`);
  
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa('api:' + apiKey)}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBytes as unknown as BodyInit,
  });

  if (!shrinkResponse.ok) {
    const errorText = await shrinkResponse.text();
    throw new Error(`TinyPNG shrink falhou: ${shrinkResponse.status} - ${errorText}`);
  }

  const shrinkResult = await shrinkResponse.json();
  const outputUrl = shrinkResult.output.url;
  console.log(`[TinyPNG] Comprimido para ${shrinkResult.output.size} bytes`);

  // Passo 2: Resize + Convert para WebP
  console.log(`[TinyPNG] Redimensionando para ${width}x${height} e convertendo para WebP...`);
  
  const resizeResponse = await fetch(outputUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa('api:' + apiKey)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resize: {
        method: 'cover',
        width: width,
        height: height,
      },
      convert: {
        type: ['image/webp'],
      },
    }),
  });

  if (!resizeResponse.ok) {
    // Fallback: tentar só resize sem convert
    console.log('[TinyPNG] WebP falhou, tentando só resize...');
    const fallbackResponse = await fetch(outputUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa('api:' + apiKey)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resize: {
          method: 'cover',
          width: width,
          height: height,
        },
      }),
    });
    
    if (!fallbackResponse.ok) {
      throw new Error(`TinyPNG resize falhou: ${fallbackResponse.status}`);
    }
    
    const webpBytes = new Uint8Array(await fallbackResponse.arrayBuffer());
    return { webpBytes, tamanhoOriginal, tamanhoFinal: webpBytes.length };
  }

  const webpBytes = new Uint8Array(await resizeResponse.arrayBuffer());
  console.log(`[TinyPNG] Resultado final: ${webpBytes.length} bytes`);
  
  return { webpBytes, tamanhoOriginal, tamanhoFinal: webpBytes.length };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, preset, width, height, forceReprocess } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'imageUrl é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determinar dimensões
    let targetWidth: number;
    let targetHeight: number;
    let presetUsado: string;

    if (preset && PRESETS[preset]) {
      targetWidth = PRESETS[preset].width;
      targetHeight = PRESETS[preset].height;
      presetUsado = preset;
    } else if (width && height) {
      targetWidth = width;
      targetHeight = height;
      presetUsado = 'custom';
    } else {
      // Default: mobile
      targetWidth = PRESETS['mobile'].width;
      targetHeight = PRESETS['mobile'].height;
      presetUsado = 'mobile';
    }

    console.log(`[Otimizar] URL: ${imageUrl}`);
    console.log(`[Otimizar] Preset: ${presetUsado}, Dimensões: ${targetWidth}x${targetHeight}`);

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar cache (considerando preset)
    if (!forceReprocess) {
      const { data: cached } = await supabase
        .from('cache_imagens_webp')
        .select('url_webp, tamanho_original, tamanho_webp')
        .eq('url_original', imageUrl)
        .eq('preset', presetUsado)
        .single();

      if (cached) {
        console.log(`[Otimizar] Cache hit! Retornando: ${cached.url_webp}`);
        return new Response(
          JSON.stringify({
            success: true,
            urlWebp: cached.url_webp,
            fromCache: true,
            tamanhoOriginal: cached.tamanho_original,
            tamanhoFinal: cached.tamanho_webp,
            preset: presetUsado,
            largura: targetWidth,
            altura: targetHeight,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Obter API Key TinyPNG
    const tinyPngKey = Deno.env.get('TINYPNG_API_KEY');
    if (!tinyPngKey) {
      throw new Error('TINYPNG_API_KEY não configurada');
    }

    // Baixar imagem original
    console.log('[Otimizar] Baixando imagem original...');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Falha ao baixar imagem: ${imageResponse.status}`);
    }
    const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
    console.log(`[Otimizar] Imagem baixada: ${imageBytes.length} bytes`);

    // Processar com TinyPNG
    const { webpBytes, tamanhoOriginal, tamanhoFinal } = await comprimirRedimensionarWebP(
      imageBytes,
      tinyPngKey,
      targetWidth,
      targetHeight
    );

    // Gerar nome único para o arquivo
    const hash = crypto.randomUUID().substring(0, 8);
    const fileName = `${presetUsado}/${hash}.webp`;

    // Upload para Supabase Storage
    console.log(`[Otimizar] Fazendo upload: ${fileName}`);
    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(fileName, webpBytes, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('imagens')
      .getPublicUrl(fileName);

    const urlWebp = publicUrlData.publicUrl;
    console.log(`[Otimizar] URL pública: ${urlWebp}`);

    // Salvar no cache
    const { error: cacheError } = await supabase
      .from('cache_imagens_webp')
      .upsert({
        url_original: imageUrl,
        url_webp: urlWebp,
        tamanho_original: tamanhoOriginal,
        tamanho_webp: tamanhoFinal,
        preset: presetUsado,
        largura: targetWidth,
        altura: targetHeight,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'url_original',
      });

    if (cacheError) {
      console.warn(`[Otimizar] Erro ao salvar cache: ${cacheError.message}`);
    }

    const economia = ((1 - tamanhoFinal / tamanhoOriginal) * 100).toFixed(1);
    console.log(`[Otimizar] ✅ Concluído! Economia: ${economia}%`);

    return new Response(
      JSON.stringify({
        success: true,
        urlWebp,
        fromCache: false,
        tamanhoOriginal,
        tamanhoFinal,
        economia: parseFloat(economia),
        preset: presetUsado,
        largura: targetWidth,
        altura: targetHeight,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Otimizar] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
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
