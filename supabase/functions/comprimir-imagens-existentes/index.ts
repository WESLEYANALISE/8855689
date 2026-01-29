import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprimir imagem e converter para WebP usando TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[TinyPNG] Comprimindo ${imageBytes.length} bytes e convertendo para WebP...`);
  
  // Passo 1: Comprimir a imagem
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa('api:' + apiKey),
      'Content-Type': 'application/octet-stream',
    },
    body: imageBytes as unknown as BodyInit,
  });

  if (!shrinkResponse.ok) {
    throw new Error(`TinyPNG shrink error: ${shrinkResponse.status}`);
  }

  const shrinkResult = await shrinkResponse.json();
  const outputUrl = shrinkResult.output?.url;
  
  if (!outputUrl) {
    throw new Error('TinyPNG não retornou URL de output');
  }

  // Passo 2: Converter para WebP
  const convertResponse = await fetch(outputUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa('api:' + apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      convert: { type: 'image/webp' }
    }),
  });

  if (!convertResponse.ok) {
    // Fallback: baixar sem conversão se WebP falhar
    console.log('[TinyPNG] Conversão WebP falhou, baixando PNG comprimido...');
    const fallbackResponse = await fetch(outputUrl);
    return new Uint8Array(await fallbackResponse.arrayBuffer());
  }

  const webpBytes = new Uint8Array(await convertResponse.arrayBuffer());
  
  const reducao = Math.round((1 - webpBytes.length / imageBytes.length) * 100);
  console.log(`[TinyPNG] Convertido para WebP: ${imageBytes.length} → ${webpBytes.length} bytes (${reducao}% redução)`);
  
  return webpBytes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bucket, prefix, limit = 10 } = await req.json();

    if (!bucket) {
      throw new Error('bucket é obrigatório');
    }

    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');
    if (!TINYPNG_API_KEY) {
      throw new Error('TINYPNG_API_KEY não configurada');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list(prefix || '', { limit, sortBy: { column: 'created_at', order: 'asc' } });

    if (listError) throw listError;

    const resultados: { name: string; sucesso: boolean; tamanhoOriginal?: number; tamanhoFinal?: number; reducao?: string; novoNome?: string }[] = [];

    for (const file of files || []) {
      if (!file.name.match(/\.(png|jpg|jpeg|webp)$/i)) continue;

      const filePath = prefix ? `${prefix}/${file.name}` : file.name;
      
      try {
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(filePath);

        if (downloadError || !downloadData) {
          resultados.push({ name: file.name, sucesso: false });
          continue;
        }

        const originalBytes = new Uint8Array(await downloadData.arrayBuffer());
        const webpBytes = await comprimirParaWebP(originalBytes, TINYPNG_API_KEY);

        const reducao = Math.round((1 - webpBytes.length / originalBytes.length) * 100);

        // Criar novo nome com extensão .webp
        const novoNome = file.name.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        const novoPath = prefix ? `${prefix}/${novoNome}` : novoNome;

        // Upload do arquivo WebP
        if (reducao > 5) {
          await supabase.storage.from(bucket).upload(novoPath, webpBytes, {
            contentType: 'image/webp',
            upsert: true
          });

          // Se o nome mudou, deletar o arquivo original
          if (novoNome !== file.name) {
            await supabase.storage.from(bucket).remove([filePath]);
            console.log(`✅ ${file.name} → ${novoNome}: ${originalBytes.length} → ${webpBytes.length} (${reducao}%)`);
          } else {
            console.log(`✅ ${file.name}: ${originalBytes.length} → ${webpBytes.length} (${reducao}%)`);
          }
        }

        resultados.push({
          name: file.name,
          sucesso: true,
          tamanhoOriginal: originalBytes.length,
          tamanhoFinal: webpBytes.length,
          reducao: `${reducao}%`,
          novoNome: novoNome !== file.name ? novoNome : undefined
        });

      } catch (err) {
        console.error(`❌ Erro em ${file.name}:`, err);
        resultados.push({ name: file.name, sucesso: false });
      }
    }

    return new Response(
      JSON.stringify({ bucket, prefix, processados: resultados.length, resultados }),
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
