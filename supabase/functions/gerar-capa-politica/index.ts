import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Modelos de imagem disponíveis (ordem de prioridade)
const MODELOS_IMAGEM = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-preview-image-generation'
];

// Comprimir e converter para WebP usando TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[compressao] Comprimindo ${imageBytes.length} bytes e convertendo para WebP...`)
  
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      'Content-Type': 'application/octet-stream'
    },
    body: new Blob([new Uint8Array(imageBytes)])
  })

  if (!shrinkResponse.ok) {
    console.error('[compressao] TinyPNG falhou')
    return imageBytes
  }

  const result = await shrinkResponse.json()
  if (!result.output?.url) {
    return imageBytes
  }

  const convertResponse = await fetch(result.output.url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ convert: { type: 'image/webp' } })
  })

  if (!convertResponse.ok) {
    const fallbackResponse = await fetch(result.output.url)
    return new Uint8Array(await fallbackResponse.arrayBuffer())
  }

  const webpBytes = new Uint8Array(await convertResponse.arrayBuffer())
  console.log(`[compressao] WebP: ${imageBytes.length} -> ${webpBytes.length} bytes (${Math.round((1 - webpBytes.length / imageBytes.length) * 100)}% menor)`)
  return webpBytes
}

// Upload para Supabase Storage
async function uploadParaSupabase(
  supabase: any, 
  bytes: Uint8Array, 
  bucket: string, 
  path: string, 
  contentType: string
): Promise<string> {
  console.log(`[upload] Enviando para Supabase Storage: ${bucket}/${path}`)
  
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType, upsert: true })
  
  if (error) {
    console.error('[upload] Erro:', error)
    throw new Error(`Erro no upload: ${error.message}`)
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  console.log(`[upload] URL pública: ${data.publicUrl}`)
  return data.publicUrl
}

// Função para gerar imagem com Gemini - suporta múltiplos modelos
async function gerarImagemComGemini(prompt: string, apiKey: string, modelo: string): Promise<string> {
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
    console.error(`[gerar-capa-politica] Erro na API Gemini (${modelo}): ${response.status}`, errorText.substring(0, 200));
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

// Função com fallback multi-modelo e multi-chave
async function gerarImagemComFallback(prompt: string, apiKeys: string[]): Promise<string> {
  console.log(`[gerar-capa-politica] ${apiKeys.length} chaves, ${MODELOS_IMAGEM.length} modelos disponíveis`);
  
  let lastError = '';
  
  for (const modelo of MODELOS_IMAGEM) {
    console.log(`[gerar-capa-politica] 🎨 Tentando modelo: ${modelo}`);
    let modeloFalhouPor404 = false;
    
    for (let i = 0; i < apiKeys.length; i++) {
      try {
        console.log(`[gerar-capa-politica] Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
        const result = await gerarImagemComGemini(prompt, apiKeys[i], modelo);
        console.log(`[gerar-capa-politica] ✅ Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        lastError = errorMessage;
        console.log(`[gerar-capa-politica] ❌ GEMINI_KEY_${i + 1} falhou: ${errorMessage.substring(0, 150)}`);
        
        if (errorMessage.includes('404')) {
          console.log(`[gerar-capa-politica] Modelo ${modelo} não disponível, tentando próximo...`);
          modeloFalhouPor404 = true;
          break;
        }
        
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          continue;
        }
      }
    }
    
    if (!modeloFalhouPor404) {
      console.log(`[gerar-capa-politica] ⚠️ Todas as chaves falharam no modelo ${modelo}, tentando próximo modelo...`);
    }
  }
  
  throw new Error(`Todas as ${apiKeys.length} chaves falharam em todos os ${MODELOS_IMAGEM.length} modelos. Último erro: ${lastError}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artigoId, titulo, orientacao } = await req.json();

    if (!artigoId || !titulo || !orientacao) {
      return new Response(
        JSON.stringify({ error: 'artigoId, titulo e orientacao são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Coletar chaves disponíveis
    const apiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];
    
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');
    
    if (apiKeys.length === 0) {
      throw new Error('Nenhuma chave API configurada');
    }

    console.log(`[gerar-capa-politica] ${apiKeys.length} chaves disponíveis`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prompt otimizado para capas POLÍTICAS fotorrealistas
    const promptImagem = `PHOTOREALISTIC 8K CINEMATIC PHOTOGRAPH about POLITICS: "${titulo}"

THIS IS A POLITICAL ARTICLE - THE IMAGE MUST BE EXPLICITLY POLITICAL:
${orientacao === 'esquerda' ? `
- LEFTIST POLITICS theme: workers, protests, unions, social movements, fists raised, red flags, mass gatherings
- Include elements like: crowds demanding rights, factory workers united, social justice imagery
- Think Bernie Sanders rallies, labor movements, social protests, workers solidarity
- Color palette: passionate reds, warm oranges, earth tones` : 
orientacao === 'direita' ? `
- RIGHT-WING POLITICS theme: conservatism, free market, tradition, order, family values, institutions
- Include elements like: government buildings, neoclassical architecture, business districts, churches, traditional families
- Visual style: strong institutional imagery, order, prosperity, traditional values, free enterprise
- Color palette: strong blues, navy, institutional gold, elegant neutrals` : `
- CENTRIST POLITICS theme: balance, dialogue, negotiation, handshakes, congress, debate
- Include elements like: legislative halls, diplomatic meetings, balanced scales, diverse coalitions
- Think bipartisan cooperation, balanced journalism, moderate politics
- Color palette: balanced neutrals, subtle gold, diplomatic grays`}

POLITICAL VISUAL ELEMENTS TO USE:
- Government buildings (capitols, congress, parliaments)
- Political figures in silhouette (NOT identifiable real people)
- Voting, elections, ballots, democracy symbols
- Flags, podiums, political rallies
- Hands voting, protesting, or shaking hands
- Crowds at political events

CRITICAL - THE CONCEPT "${titulo}":
- Interpret this concept through a POLITICAL lens
- Show how this relates to governance, ideology, or civic life
- Make the viewer immediately think of politics and government

ABSOLUTE REQUIREMENTS:
- ZERO text, letters, words, typography, or writing
- NO watermarks, logos, captions
- NO trees, nature, or generic landscapes unless explicitly political
- MUST look like a political magazine cover (Time, The Economist, Foreign Affairs)
- 16:9 aspect ratio, professional editorial quality`;

    console.log('[gerar-capa-politica] Gerando capa para:', titulo, '- Orientação:', orientacao);

    const imageBase64 = await gerarImagemComFallback(promptImagem, apiKeys);

    // Converter base64 para Uint8Array
    const binaryString = atob(imageBase64);
    let bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`[gerar-capa-politica] Imagem gerada: ${bytes.length} bytes`);

    // Comprimir e converter para WebP
    if (TINYPNG_API_KEY) {
      bytes = new Uint8Array(await comprimirParaWebP(bytes, TINYPNG_API_KEY));
    }

    // Upload para Supabase Storage como WebP
    const timestamp = Date.now();
    const path = `politica/${orientacao}_${artigoId}_${timestamp}.webp`;
    const urlCapa = await uploadParaSupabase(supabase, bytes, 'politica-capas', path, 'image/webp');

    console.log('[gerar-capa-politica] Capa WebP gerada:', urlCapa);

    // Salvar no banco de dados
    const { error: updateError } = await supabase
      .from('politica_blog_orientacao')
      .update({ imagem_url: urlCapa })
      .eq('id', artigoId);

    if (updateError) {
      console.error('[gerar-capa-politica] Erro ao salvar URL da capa:', updateError);
    }

    return new Response(
      JSON.stringify({ imagem_url: urlCapa }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-capa-politica] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
