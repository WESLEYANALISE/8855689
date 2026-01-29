import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprimir e converter para WebP usando TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[TinyPNG] Comprimindo ${imageBytes.length} bytes e convertendo para WebP...`);
  
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa('api:' + apiKey),
      'Content-Type': 'application/octet-stream',
    },
    body: imageBytes as unknown as BodyInit,
  });

  if (!shrinkResponse.ok) {
    throw new Error(`TinyPNG error: ${shrinkResponse.status}`);
  }

  const result = await shrinkResponse.json();
  const outputUrl = result.output?.url;
  if (!outputUrl) throw new Error('TinyPNG não retornou URL');

  const convertResponse = await fetch(outputUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa('api:' + apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ convert: { type: 'image/webp' } }),
  });

  if (!convertResponse.ok) {
    const fallbackResponse = await fetch(outputUrl);
    return new Uint8Array(await fallbackResponse.arrayBuffer());
  }

  const webpBytes = new Uint8Array(await convertResponse.arrayBuffer());
  const reducao = Math.round((1 - webpBytes.length / imageBytes.length) * 100);
  console.log(`[TinyPNG] WebP: ${imageBytes.length} → ${webpBytes.length} bytes (${reducao}% redução)`);
  
  return webpBytes;
}

// Obter chaves Gemini disponíveis
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const key1 = Deno.env.get('GEMINI_KEY_1');
  const key2 = Deno.env.get('GEMINI_KEY_2');
  const key3 = Deno.env.get('GEMINI_KEY_3');
  
  if (key1) keys.push(key1);
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);
  
  return keys;
}

// Gerar imagem com Gemini
async function gerarImagemComGemini(prompt: string): Promise<string> {
  const keys = getGeminiKeys();
  
  if (keys.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada');
  }
  
  const modelName = "gemini-2.5-flash-image";
  let lastError: Error | null = null;
  
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      console.log(`[Gemini Imagem Ética] Tentando chave ${i + 1}/${keys.length}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              role: 'user', 
              parts: [{ text: prompt }] 
            }]
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[Gemini Imagem Ética] Chave ${i + 1} com rate limit, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini Imagem Ética] Erro na chave ${i + 1}:`, response.status, errorText.substring(0, 200));
        continue;
      }

      const data = await response.json();
      
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          console.log(`[Gemini Imagem Ética] Sucesso com chave ${i + 1}`);
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
      
      console.log(`[Gemini Imagem Ética] Chave ${i + 1} não retornou imagem, tentando próxima...`);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Gemini Imagem Ética] Erro na chave ${i + 1}:`, lastError.message);
    }
  }
  
  throw lastError || new Error('Todas as chaves Gemini falharam para geração de imagem');
}

// Criar prompt de imagem específico para Ética OAB
function criarPromptImagem(titulo: string): string {
  return `Create a STUNNING, PURELY VISUAL cover image for a legal ethics topic. STRICT 16:9 HORIZONTAL aspect ratio.

CONCEPT TO ILLUSTRATE: "${titulo}"
FIELD: Professional Ethics for Lawyers (OAB - Brazilian Bar Association)

🚨 ABSOLUTELY NO TEXT - THIS IS A PURE IMAGE:
- DO NOT include ANY text, letters, words, titles, labels, or typography of any kind
- DO NOT write the topic title on the image
- This is an ILLUSTRATION ONLY - the title will be added separately by the app
- Focus 100% on visual symbolism and imagery

🎨 IMAGE REQUIREMENTS:
- EDGE-TO-EDGE content - fill 100% of the 16:9 frame
- NO white space, NO margins, NO empty areas
- Dark, rich backgrounds that extend to ALL edges
- PHOTOREALISTIC, cinematic quality like a movie poster
- DRAMATIC lighting with deep shadows and rim lighting
- The visual must INSTANTLY communicate ETHICS and PROFESSIONALISM

VISUAL APPROACH FOR "${titulo}":
- Choose ONE powerful, iconic symbol: scales of justice, lawyer's toga, gavel, OAB symbol, handshake, professional setting
- Professional lawyer in formal attire, law office, courtroom setting
- Rich colors: black, white, silver, professional navy, gold accents
- Think Netflix thumbnail / movie poster aesthetic

STYLE:
- Ultra high resolution, 8K quality
- Atmospheric, moody, epic
- Magazine cover / blockbuster movie quality
- Strong central focus with dramatic composition

FORBIDDEN:
- ANY text, letters, words, numbers, typography, labels, titles
- White or empty areas
- Flat compositions
- Stock photo look
- Cartoonish or illustrated style
- Margins or borders

Generate a PURELY VISUAL, CINEMATIC cover that captures the essence of "${titulo}" without any text.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topico_id } = await req.json();

    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: 'topico_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar tópico
    const { data: topico, error: topicoError } = await supabase
      .from('oab_etica_topicos')
      .select('*')
      .eq('id', topico_id)
      .single();

    if (topicoError || !topico) {
      return new Response(
        JSON.stringify({ error: 'Tópico não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se já tem capa, retornar sem gerar
    if (topico.capa_url) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Capa já existe',
          topico_id,
          capa_url: topico.capa_url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Capa Tópico Ética] Gerando para: ${topico.titulo} (ID: ${topico_id})`);

    const prompt = criarPromptImagem(topico.titulo);

    // Gerar imagem com Gemini
    const imageBase64 = await gerarImagemComGemini(prompt);

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const originalBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Comprimir para WebP
    let finalBuffer: Uint8Array = originalBuffer;
    if (TINYPNG_API_KEY) {
      try {
        finalBuffer = await comprimirParaWebP(originalBuffer, TINYPNG_API_KEY);
      } catch (e) {
        console.error('[TinyPNG] Falha na compressão, usando original:', e);
        finalBuffer = originalBuffer;
      }
    }

    // Upload para storage
    const fileName = `topico-etica-${topico_id}-${Date.now()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from('gerador-imagens')
      .upload(fileName, finalBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('gerador-imagens')
      .getPublicUrl(fileName);

    const capaUrl = urlData.publicUrl;

    // Atualizar tópico com a URL da capa
    const { error: updateError } = await supabase
      .from('oab_etica_topicos')
      .update({ capa_url: capaUrl })
      .eq('id', topico_id);

    if (updateError) {
      console.error('[Capa Tópico Ética] Erro ao atualizar tópico:', updateError);
    }

    console.log(`[Capa Tópico Ética] ✅ Capa gerada: ${capaUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        topico_id,
        capa_url: capaUrl,
        tamanho: finalBuffer.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Capa Tópico Ética] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});