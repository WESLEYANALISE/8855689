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

// Comprimir e converter para WebP usando TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[compressao] Comprimindo ${imageBytes.length} bytes e convertendo para WebP...`)
  
  const blob = new Blob([new Uint8Array(imageBytes)], { type: 'image/png' })
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${btoa(`api:${apiKey}`)}` },
    body: blob
  })

  if (!shrinkResponse.ok) {
    throw new Error(`TinyPNG erro: ${shrinkResponse.status}`)
  }

  const result = await shrinkResponse.json()
  if (!result.output?.url) {
    throw new Error('TinyPNG não retornou URL')
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

// Função para upload no Supabase Storage
async function uploadParaSupabase(
  supabase: any,
  bytes: Uint8Array,
  bucket: string,
  path: string,
  contentType: string
): Promise<string> {
  console.log(`[upload] Enviando para Supabase Storage: ${bucket}/${path}`)
  
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType,
      upsert: true
    })

  if (uploadError) {
    console.error('[upload] Erro:', uploadError)
    throw new Error(`Erro no upload: ${uploadError.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  console.log(`[upload] URL pública: ${publicUrl}`)
  return publicUrl
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
          responseModalities: ["TEXT", "IMAGE"]
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[gerar-imagem-resumo-personalizado] Erro na API Gemini (${modelo}): ${response.status}`, errorText.substring(0, 200));
    throw new Error(`GEMINI_ERROR_${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p: any) => p.inlineData?.data);
  
  if (!imagePart?.inlineData?.data) {
    throw new Error('Imagem não gerada pela IA');
  }
  
  return imagePart.inlineData.data;
}

// Função com fallback multi-modelo e multi-chave
async function gerarImagemComFallback(prompt: string, chaves: string[]): Promise<string> {
  const chavesValidas = chaves.filter(Boolean);
  
  if (chavesValidas.length === 0) {
    throw new Error('Nenhuma chave de API de imagem configurada');
  }

  console.log(`[gerar-imagem-resumo-personalizado] ${chavesValidas.length} chaves, ${MODELOS_IMAGEM.length} modelos disponíveis`);

  let ultimoErro = '';

  for (const modelo of MODELOS_IMAGEM) {
    console.log(`[gerar-imagem-resumo-personalizado] 🎨 Tentando modelo: ${modelo}`);
    let modeloFalhouPor404 = false;

    for (let i = 0; i < chavesValidas.length; i++) {
      try {
        console.log(`[gerar-imagem-resumo-personalizado] Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
        const result = await gerarImagemComGemini(prompt, chavesValidas[i], modelo);
        console.log(`[gerar-imagem-resumo-personalizado] ✅ Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        ultimoErro = errorMessage;
        console.log(`[gerar-imagem-resumo-personalizado] ❌ GEMINI_KEY_${i + 1} falhou: ${errorMessage.substring(0, 150)}`);
        
        // Se modelo não existe (404), pular para próximo modelo
        if (errorMessage.includes('404')) {
          console.log(`[gerar-imagem-resumo-personalizado] Modelo ${modelo} não disponível, tentando próximo...`);
          modeloFalhouPor404 = true;
          break;
        }
        
        // Se for erro 429 (quota), continuar para próxima chave
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          continue;
        }
      }
    }
    
    if (!modeloFalhouPor404) {
      console.log(`[gerar-imagem-resumo-personalizado] ⚠️ Todas as chaves falharam no modelo ${modelo}, tentando próximo modelo...`);
    }
  }

  throw new Error(`Todas as ${chavesValidas.length} chaves falharam em todos os ${MODELOS_IMAGEM.length} modelos. Último erro: ${ultimoErro}`);
}

// Função para gerar prompt contextualizado com IA
async function gerarPromptComIA(resumoTexto: string, titulo: string, apiKey: string): Promise<string> {
  const textoLimitado = resumoTexto.substring(0, 2000)
  
  const promptParaGerarPrompt = `You are an expert visual storyteller who creates detailed prompts for cartoon illustrations that SPECIFICALLY represent legal case studies.

LEGAL CONTEXT:
- Topic: ${titulo || 'Conceito Jurídico'}

LEGAL CONTENT TO ILLUSTRATE:
${textoLimitado}

YOUR MISSION:
Analyze this legal content carefully and create an image prompt that TELLS THIS STORY visually.

MANDATORY STYLE - PROFESSIONAL EDITORIAL CARTOON:
- Style: Professional FLAT 2D editorial illustration, similar to The Economist, Wall Street Journal, or serious legal magazines
- FORBIDDEN: Cute, kawaii, chibi, childish, infantile, or Duolingo-like cute style
- FORBIDDEN: Large anime-style eyes or oversized heads
- Format: HORIZONTAL 16:9 landscape
- Characters: ADULT characters with realistic proportions, mature expressions, normal-sized eyes. Characters should look Brazilian/Latin American professionals
- Colors: Professional, muted palette suitable for legal content - NOT candy/vibrant colors
- Background: Simple but contextual professional environment
- Mood: Serious, educational, and professional - appropriate for adult legal education

STORYTELLING REQUIREMENTS:
- Show the EXACT scenario from the content, not a generic scene
- If there are multiple parties, show the dynamic between them
- Include visual elements that represent the specific legal issue
- Use body language and facial expressions to convey the situation

CONTEXTUAL FACIAL EXPRESSIONS - CRITICAL:
- ANALYZE the moral/emotional context of the legal situation
- CRIMINALS/WRONGDOERS (thieves, fraudsters, corrupt people): SUSPICIOUS, MALICIOUS, GREEDY, ANGRY or SCHEMING expressions - sideways glances, malicious smiles, calculating looks
- VICTIMS: FEARFUL, SURPRISED, WORRIED, INDIGNANT or DESPERATE expressions
- AUTHORITIES (judges, police, lawyers): SERIOUS, FIRM, DETERMINED and PROFESSIONAL expressions
- REGULAR CITIZENS in legal situations: CONFUSED, WORRIED or RELIEVED expressions depending on context
- ⛔ NEVER show criminals looking SAD or SYMPATHETIC - they must look SUSPICIOUS/MALICIOUS
- ⛔ Expressions MUST TELL THE STORY and reflect each character's MORAL ROLE in the scene
- Example: In money laundering scenes, criminals should have greedy/malicious expressions, NOT sad

ABSOLUTE RULES:
1. IF ANY TEXT IS NEEDED IN THE IMAGE, IT MUST BE IN PORTUGUESE - WRITE IN UPPERCASE
2. NEVER use English text in the image
3. NO graphic violence or blood
4. NO inappropriate content
5. Characters must look like distinct individuals
6. Scene must be SPECIFIC to this content

OUTPUT:
Write ONLY the detailed image prompt. No explanations.
Start with: "A professional FLAT 2D editorial illustration (NOT cute, NOT 3D) in 16:9 format showing..."`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptParaGerarPrompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 800
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[gerar-imagem-resumo-personalizado] Erro Gemini:', response.status, errorText)
    throw new Error(`Erro ao gerar prompt: ${response.status}`)
  }

  const data = await response.json()
  const promptGerado = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  
  if (!promptGerado) {
    throw new Error('Prompt vazio retornado pela IA')
  }
  
  console.log('[gerar-imagem-resumo-personalizado] Prompt gerado:', promptGerado.substring(0, 400))
  return promptGerado
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { resumoTexto, titulo } = await req.json()

    if (!resumoTexto) {
      throw new Error('resumoTexto é obrigatório')
    }

    console.log(`[gerar-imagem-resumo-personalizado] Processando resumo - Título: ${titulo || 'N/A'}`)

    // Coletar chaves disponíveis
    const chavesImagem = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];
    
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY')
    
    if (chavesImagem.length === 0) {
      throw new Error('Nenhuma chave de API de imagem configurada')
    }

    console.log(`[gerar-imagem-resumo-personalizado] ${chavesImagem.length} chaves de imagem disponíveis`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Gerar prompt contextualizado com IA
    console.log('[gerar-imagem-resumo-personalizado] Etapa 1: Gerando prompt com Gemini...')
    const promptEspecifico = await gerarPromptComIA(resumoTexto, titulo || '', chavesImagem[0])

    // 2. Gerar imagem com fallback multi-modelo
    const promptFinal = `${promptEspecifico}

CRITICAL STYLE: Professional FLAT 2D editorial illustration, clean lines, ADULT characters with realistic proportions, 16:9 horizontal format. Professional muted colors (NOT candy/vibrant), simple backgrounds. Serious journalistic style like The Economist or Wall Street Journal illustrations.
FORBIDDEN: Cute, kawaii, chibi, childish style. Large anime eyes. Oversized heads. Infantile or app-like visuals.
CRITICAL: Characters should look like Brazilian/Latin American ADULT professionals with diverse skin tones, NORMAL-sized eyes, and mature expressions.
CRITICAL LANGUAGE: IF there is ANY text visible in the image, it MUST be in BRAZILIAN PORTUGUESE, written in UPPERCASE.
High quality render.`

    console.log('[gerar-imagem-resumo-personalizado] Etapa 2: Gerando imagem com fallback multi-modelo...')

    const base64Data = await gerarImagemComFallback(promptFinal, chavesImagem)

    // 3. Converter base64
    const binaryString = atob(base64Data)
    let uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }

    console.log(`[gerar-imagem-resumo-personalizado] Imagem gerada, tamanho: ${uint8Array.length} bytes`)

    // 4. Comprimir e converter para WebP
    if (TINYPNG_API_KEY) {
      try {
        const compressed = await comprimirParaWebP(uint8Array, TINYPNG_API_KEY)
        uint8Array = new Uint8Array(compressed)
      } catch (compressError) {
        console.error('[gerar-imagem-resumo-personalizado] Erro na compressão (continuando sem):', compressError)
      }
    }

    // 5. Upload para Supabase Storage como WebP
    const filePath = `resumos-personalizados/${Date.now()}.webp`
    const imageUrl = await uploadParaSupabase(supabase, uint8Array, 'imagens', filePath, 'image/webp')

    console.log(`[gerar-imagem-resumo-personalizado] Upload sucesso: ${imageUrl}`)

    return new Response(
      JSON.stringify({ url_imagem: imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-imagem-resumo-personalizado] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar imagem', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})