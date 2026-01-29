import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');

// Chaves Gemini com fallback (igual chat professora)
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[];

// Modelos de imagem disponíveis (ordem de prioridade - igual biblioteca)
const MODELOS_IMAGEM = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-preview-image-generation'
];

// Função para gerar imagem com Gemini - suporta múltiplos modelos
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
    console.error(`Erro na API Gemini (${modelo}): ${response.status}`, errorText.substring(0, 200));
    throw new Error(`GEMINI_ERROR_${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return part.inlineData.data;
    }
  }
  
  throw new Error('Imagem não gerada pela IA');
}

// Função com fallback multi-modelo e multi-chave (igual biblioteca)
async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  if (API_KEYS.length === 0) {
    console.error('Nenhuma chave Gemini configurada');
    return null;
  }

  console.log(`${API_KEYS.length} chaves, ${MODELOS_IMAGEM.length} modelos disponíveis`);
  
  for (const modelo of MODELOS_IMAGEM) {
    console.log(`🎨 Tentando modelo: ${modelo}`);
    let modeloFalhouPor404 = false;
    
    for (let i = 0; i < API_KEYS.length; i++) {
      try {
        console.log(`Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
        const result = await gerarImagemComModelo(prompt, API_KEYS[i], modelo);
        console.log(`✅ Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ GEMINI_KEY_${i + 1} falhou: ${errorMessage.substring(0, 150)}`);
        
        // Se modelo não existe (404), pular para próximo modelo
        if (errorMessage.includes('404')) {
          console.log(`Modelo ${modelo} não disponível, tentando próximo...`);
          modeloFalhouPor404 = true;
          break;
        }
        
        // Se erro de quota (429) ou chave inválida (400), tentar próxima chave
        if (errorMessage.includes('429') || errorMessage.includes('400')) {
          continue;
        }
      }
    }
    
    if (!modeloFalhouPor404) {
      console.log(`⚠️ Todas as chaves falharam no modelo ${modelo}, tentando próximo modelo...`);
    }
  }
  
  console.error('Todas as chaves e modelos falharam');
  return null;
}

async function comprimirImagemTinyPNG(base64Data: string): Promise<{ data: Uint8Array; contentType: string } | null> {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  if (!TINYPNG_API_KEY) {
    console.log('TinyPNG API key não configurada, retornando imagem original');
    return { data: bytes, contentType: 'image/png' };
  }

  try {
    console.log('Comprimindo imagem com TinyPNG...');

    const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`,
        'Content-Type': 'image/png'
      },
      body: bytes
    });

    if (!shrinkResponse.ok) {
      console.error('Erro ao comprimir:', await shrinkResponse.text());
      return { data: bytes, contentType: 'image/png' };
    }

    const shrinkData = await shrinkResponse.json();
    console.log('Imagem comprimida, convertendo para WebP...');

    // Converter para WebP
    const convertResponse = await fetch(shrinkData.output.url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ convert: { type: "image/webp" } })
    });

    if (!convertResponse.ok) {
      console.log('Falha na conversão WebP, usando PNG comprimido');
      const pngResponse = await fetch(shrinkData.output.url);
      const pngData = await pngResponse.arrayBuffer();
      return { data: new Uint8Array(pngData), contentType: 'image/png' };
    }

    const webpData = await convertResponse.arrayBuffer();
    console.log('Conversão para WebP concluída!');
    return { data: new Uint8Array(webpData), contentType: 'image/webp' };
  } catch (error) {
    console.error('Erro no TinyPNG:', error);
    return { data: bytes, contentType: 'image/png' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artigoId, titulo } = await req.json();
    
    if (!artigoId || !titulo) {
      return new Response(
        JSON.stringify({ error: 'artigoId e titulo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Gerando capa para artigo ${artigoId}: ${titulo}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe capa
    const { data: artigo } = await supabase
      .from('advogado_blog')
      .select('url_capa')
      .eq('id', artigoId)
      .single();

    if (artigo?.url_capa) {
      console.log('Artigo já possui capa, retornando existente');
      return new Response(
        JSON.stringify({ imagem_url: artigo.url_capa, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prompt para imagem fotorrealista de advocacia
    const prompt = `Generate a photorealistic 16:9 cinematic photograph for a legal blog article titled: "${titulo}"

VISUAL ELEMENTS (choose appropriate ones):
- Professional law office with rich wooden furniture
- Courthouse interior with marble columns
- Lawyer silhouette in formal suit (NOT showing face)
- Legal documents, contracts, briefcase on desk
- Gavel, scales of justice, thick legal books
- Modern meeting room with city view
- Courtroom with judge's bench

PHOTOGRAPHY STYLE:
- Editorial quality like Forbes or American Lawyer magazine
- Dramatic lighting with natural window light
- Shallow depth of field for cinematic look
- Ultra high resolution 8K quality
- Rich color palette: navy blue, dark mahogany, gold accents, cream paper

DO NOT include: text, watermarks, logos, identifiable faces, cartoon elements.

Create a sophisticated, professional legal atmosphere.`;

    const base64Image = await gerarImagemComGemini(prompt);
    
    if (!base64Image) {
      console.error('Falha ao gerar imagem - nenhuma imagem retornada');
      return new Response(
        JSON.stringify({ error: 'Falha ao gerar imagem. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Imagem gerada, processando...');

    // Comprimir e converter para WebP
    const processedImage = await comprimirImagemTinyPNG(base64Image);
    
    if (!processedImage) {
      return new Response(
        JSON.stringify({ error: 'Falha ao processar imagem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload para Supabase Storage
    const extension = processedImage.contentType === 'image/webp' ? 'webp' : 'png';
    const fileName = `advogado-blog/capa-${artigoId}-${Date.now()}.${extension}`;
    
    console.log('Fazendo upload para:', fileName);
    
    const { error: uploadError } = await supabase.storage
      .from('gerador-imagens')
      .upload(fileName, processedImage.data, {
        contentType: processedImage.contentType,
        upsert: true
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Falha ao salvar imagem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('gerador-imagens')
      .getPublicUrl(fileName);

    const imagemUrl = urlData.publicUrl;
    console.log('Imagem salva com sucesso:', imagemUrl);

    // Atualizar banco com URL da capa
    const { error: updateError } = await supabase
      .from('advogado_blog')
      .update({ url_capa: imagemUrl })
      .eq('id', artigoId);

    if (updateError) {
      console.error('Erro ao atualizar banco:', updateError);
    }

    return new Response(
      JSON.stringify({ imagem_url: imagemUrl, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
