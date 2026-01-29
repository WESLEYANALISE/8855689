import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Modelos de imagem disponíveis (ordem de prioridade)
const MODELOS_IMAGEM = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-preview-image-generation'
];

// Função para comprimir imagem com TinyPNG
async function comprimirComTinyPNG(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[compressao] Enviando ${imageBytes.length} bytes para TinyPNG...`)
  
  const blob = new Blob([new Uint8Array(imageBytes)], { type: 'image/png' })
  const response = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
    },
    body: blob
  })

  if (!response.ok) {
    console.error('[compressao] Erro TinyPNG:', response.status)
    return imageBytes
  }

  const result = await response.json()
  const compressedUrl = result.output?.url
  
  if (!compressedUrl) {
    return imageBytes
  }

  console.log(`[compressao] Compressão: ${result.input?.size} -> ${result.output?.size} bytes`)

  const compressedResponse = await fetch(compressedUrl)
  if (!compressedResponse.ok) {
    return imageBytes
  }

  const compressedBuffer = await compressedResponse.arrayBuffer()
  return new Uint8Array(compressedBuffer)
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

// Gerar imagem com Gemini - suporta múltiplos modelos
async function gerarImagemComGemini(prompt: string, apiKey: string, modelo: string): Promise<{ success: boolean; data?: string; error?: string; isQuotaError?: boolean; isNotFoundError?: boolean }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[gerar-capa-flashcard-area] Erro na API Gemini (${modelo}): ${response.status}`, errorText.substring(0, 200));
      const isQuotaError = response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED');
      const isInvalidKey = response.status === 400 && errorText.includes('API_KEY_INVALID');
      const isNotFoundError = response.status === 404;
      return { 
        success: false, 
        error: `GEMINI_ERROR_${response.status}: ${errorText.substring(0, 200)}`,
        isQuotaError: isQuotaError || isInvalidKey,
        isNotFoundError
      };
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.data);
    
    if (!imagePart?.inlineData?.data) {
      return { success: false, error: 'Imagem não gerada pela IA', isQuotaError: false, isNotFoundError: false };
    }
    
    return { success: true, data: imagePart.inlineData.data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      isQuotaError: false,
      isNotFoundError: false
    };
  }
}

// Função com fallback multi-modelo e multi-chave
async function gerarImagemComFallback(prompt: string, apiKeys: string[]): Promise<string> {
  const keysValidas = apiKeys.filter(k => k && k.trim().length > 0);
  
  console.log(`[gerar-capa-flashcard-area] ${keysValidas.length} chave(s) Gemini, ${MODELOS_IMAGEM.length} modelos disponíveis`);
  
  let lastError = '';
  
  // Para cada modelo
  for (const modelo of MODELOS_IMAGEM) {
    console.log(`[gerar-capa-flashcard-area] 🎨 Tentando modelo: ${modelo}`);
    let modeloFalhouPor404 = false;
    
    // Para cada chave
    for (let i = 0; i < keysValidas.length; i++) {
      console.log(`[gerar-capa-flashcard-area] Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
      
      const result = await gerarImagemComGemini(prompt, keysValidas[i], modelo);
      
      if (result.success && result.data) {
        console.log(`[gerar-capa-flashcard-area] ✅ Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
        return result.data;
      }
      
      lastError = result.error || 'Erro desconhecido';
      console.log(`[gerar-capa-flashcard-area] ❌ GEMINI_KEY_${i + 1} falhou: ${lastError.substring(0, 150)}`);
      
      // Se modelo não existe (404), pular para próximo modelo
      if (result.isNotFoundError) {
        console.log(`[gerar-capa-flashcard-area] Modelo ${modelo} não disponível, tentando próximo...`);
        modeloFalhouPor404 = true;
        break;
      }
      
      // Se erro de cota, continuar para próxima chave
      if (result.isQuotaError) {
        continue;
      }
    }
    
    if (!modeloFalhouPor404) {
      console.log(`[gerar-capa-flashcard-area] ⚠️ Todas as chaves falharam no modelo ${modelo}, tentando próximo modelo...`);
    }
  }
  
  throw new Error(`Todas as ${keysValidas.length} chaves falharam em todos os ${MODELOS_IMAGEM.length} modelos. Último erro: ${lastError}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { area, forcar_regeneracao } = await req.json()

    if (!area) {
      throw new Error('Área é obrigatória')
    }

    console.log(`[gerar-capa-flashcard-area] Gerando capa para: ${area}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Coletar as chaves GEMINI_KEY disponíveis
    const apiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];

    console.log(`[gerar-capa-flashcard-area] ${apiKeys.length} chaves GEMINI_KEY disponíveis`);

    // Verificar se já existe capa (tabela renomeada para flashcards_areas)
    if (!forcar_regeneracao) {
      const { data: existente } = await supabase
        .from('flashcards_areas')
        .select('url_capa')
        .eq('area', area)
        .single()

      if (existente?.url_capa) {
        console.log(`[gerar-capa-flashcard-area] Capa já existe para ${area}`)
        return new Response(
          JSON.stringify({ url_capa: existente.url_capa, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Contar flashcards da área
    const { count } = await supabase
      .from('FLASHCARDS')
      .select('*', { count: 'exact', head: true })
      .eq('area', area)

    // Prompt de imagem - MINIMALISTA SEM TEXTO
    const prompt = `MINIMALIST ICON: Create a single, clean, minimalist symbolic icon for "${area}" legal field.

MANDATORY STYLE:
- ULTRA MINIMALIST single icon/symbol (like app icons or logo marks)
- Simple flat 2D design with maximum 2-3 colors
- NO TEXT, NO LETTERS, NO WORDS whatsoever
- Dark navy/purple gradient background (#0f172a to #1e1b4b)
- Icon in soft white/cream color (#f5f5f4) with subtle glow
- Clean geometric shapes, professional and elegant
- Similar style to iOS app icons or modern brand marks

ICON IDEAS FOR EACH AREA:
- Direito Civil: Simple house outline or handshake silhouette
- Direito Penal: Minimalist gavel or balance scales
- Direito Constitucional: Simple column/pillar or open book
- Direito do Trabalho: Minimalist handshake or briefcase
- Direito Tributário: Simple coin stack or percentage symbol
- Direito Administrativo: Building silhouette or stamp icon
- Direito Ambiental: Simple leaf or tree silhouette
- Direito Empresarial: Minimalist building or graph icon
- Direito Processual: Document with arrow or folder icon
- Direito Internacional: Globe or flags silhouette
- Default: Scales of justice or book icon

⛔ FORBIDDEN:
- ANY text, letters, words, numbers, labels
- Complex illustrations with many elements
- Detailed scenes or landscapes
- People or faces
- 3D effects or shadows
- Photorealistic elements
- Bright/vibrant colors

Square format (1:1). Generate only the minimalist icon image.`

    console.log(`[gerar-capa-flashcard-area] Gerando imagem com fallback multi-modelo...`)

    // Gerar imagem com fallback
    const imageBase64 = await gerarImagemComFallback(prompt, apiKeys)
    
    // Converter base64 para Uint8Array
    const binaryString = atob(imageBase64)
    let bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    console.log(`[gerar-capa-flashcard-area] Imagem gerada, tamanho: ${bytes.length} bytes`)

    // Comprimir com TinyPNG se disponível
    if (TINYPNG_API_KEY) {
      try {
        const compressedBytes = await comprimirComTinyPNG(bytes, TINYPNG_API_KEY)
        bytes = new Uint8Array(compressedBytes)
      } catch (compressError) {
        console.error('[gerar-capa-flashcard-area] Erro na compressão (usando original):', compressError)
      }
    }

    // Upload para Supabase Storage
    const timestamp = Date.now()
    const areaSlug = area.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const path = `flashcards/areas/${areaSlug}_${timestamp}.png`
    const imageUrl = await uploadParaSupabase(supabase, bytes, 'imagens', path, 'image/png')

    // Salvar no banco (tabela renomeada para flashcards_areas)
    const { error: updateError } = await supabase
      .from('flashcards_areas')
      .upsert({
        area,
        url_capa: imageUrl,
        total_flashcards: count || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'area' })

    if (updateError) {
      console.error('[gerar-capa-flashcard-area] Erro ao salvar:', updateError)
    }

    console.log(`[gerar-capa-flashcard-area] Capa salva com sucesso: ${imageUrl}`)

    return new Response(
      JSON.stringify({ url_capa: imageUrl, cached: false, total_flashcards: count }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-capa-flashcard-area] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar capa', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})