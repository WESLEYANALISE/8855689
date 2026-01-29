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
    const errorText = await response.text()
    console.error('[compressao] Erro TinyPNG:', response.status, errorText)
    throw new Error(`TinyPNG erro: ${response.status}`)
  }

  const result = await response.json()
  const compressedUrl = result.output?.url
  
  if (!compressedUrl) {
    throw new Error('TinyPNG não retornou URL da imagem comprimida')
  }

  console.log(`[compressao] Compressão: ${result.input?.size} -> ${result.output?.size} bytes (${Math.round((1 - result.output?.size / result.input?.size) * 100)}% menor)`)

  const compressedResponse = await fetch(compressedUrl)
  if (!compressedResponse.ok) {
    throw new Error('Falha ao baixar imagem comprimida')
  }

  const compressedBuffer = await compressedResponse.arrayBuffer()
  return new Uint8Array(compressedBuffer)
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
    console.error(`[gerar-imagem-aula-artigo] Erro na API Gemini (${modelo}): ${response.status}`, errorText.substring(0, 200));
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
async function gerarImagemComFallback(prompt: string, apiKeys: string[]): Promise<string> {
  console.log(`[gerar-imagem-aula-artigo] ${apiKeys.length} chaves, ${MODELOS_IMAGEM.length} modelos disponíveis`);
  
  let lastError = '';
  
  for (const modelo of MODELOS_IMAGEM) {
    console.log(`[gerar-imagem-aula-artigo] 🎨 Tentando modelo: ${modelo}`);
    let modeloFalhouPor404 = false;
    
    for (let i = 0; i < apiKeys.length; i++) {
      try {
        console.log(`[gerar-imagem-aula-artigo] Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
        const result = await gerarImagemComGemini(prompt, apiKeys[i], modelo);
        console.log(`[gerar-imagem-aula-artigo] ✅ Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        lastError = errorMessage;
        console.log(`[gerar-imagem-aula-artigo] ❌ GEMINI_KEY_${i + 1} falhou: ${errorMessage.substring(0, 150)}`);
        
        // Se modelo não existe (404), pular para próximo modelo
        if (errorMessage.includes('404')) {
          console.log(`[gerar-imagem-aula-artigo] Modelo ${modelo} não disponível, tentando próximo...`);
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
      console.log(`[gerar-imagem-aula-artigo] ⚠️ Todas as chaves falharam no modelo ${modelo}, tentando próximo modelo...`);
    }
  }
  
  throw new Error(`Todas as ${apiKeys.length} chaves falharam em todos os ${MODELOS_IMAGEM.length} modelos. Último erro: ${lastError}`);
}

// Função para gerar prompt contextualizado com IA
async function gerarPromptComIA(
  conteudo: string, 
  tipo: 'storytelling' | 'exemplo',
  personagem: string | undefined,
  contexto: string | undefined,
  numeroArtigo: string,
  codigoTabela: string,
  apiKey: string
): Promise<string> {
  const textoLimitado = conteudo.substring(0, 2500)
  
  const tipoDescricao = tipo === 'storytelling' 
    ? 'uma HISTÓRIA NARRATIVA com personagens que ilustra um conceito jurídico'
    : 'um EXEMPLO PRÁTICO de aplicação do artigo na vida real'
  
  const promptParaGerarPrompt = `You are an expert visual storyteller who creates detailed prompts for cartoon illustrations that SPECIFICALLY represent legal educational content.

LEGAL CONTEXT:
- Law Code: ${codigoTabela}
- Article Number: ${numeroArtigo}
- Content Type: ${tipoDescricao}
${personagem ? `- Main Character: ${personagem}` : ''}
${contexto ? `- Context: ${contexto}` : ''}

CONTENT TO ILLUSTRATE:
${textoLimitado}

YOUR MISSION:
Analyze this educational content carefully and create an image prompt that TELLS THIS EXACT STORY visually.

MANDATORY STYLE - PROFESSIONAL EDITORIAL FLAT 2D:
- Style: Professional FLAT 2D editorial illustration, similar to The Economist, Wall Street Journal, or serious legal magazines
- FORBIDDEN: 3D style, 3D renders, Pixar 3D, any three-dimensional effects - MUST be FLAT 2D only
- FORBIDDEN: Cute, kawaii, chibi, childish, Duolingo-like cute style
- FORBIDDEN: Large anime-style eyes or oversized heads
- Format: SQUARE 1:1 aspect ratio (important!)
- Characters: ADULT characters with realistic proportions, mature expressions, NORMAL-sized eyes
- Colors: Professional muted palette, FLAT colors without 3D gradients - NOT candy/vibrant colors
- Background: Simple but contextual professional environment, FLAT design without 3D depth
- Mood: Serious, educational, and professional - appropriate for adult legal education

CHARACTER REPRESENTATION:
${personagem === 'Maria' ? '- Maria: Young professional woman, confident, dark hair, wearing modern business casual' : ''}
${personagem === 'João' ? '- João: Middle-aged businessman, slightly stressed, wearing suit or business casual' : ''}
${personagem === 'Pedro' ? '- Pedro: Regular citizen, casual clothing, relatable everyday person' : ''}
${personagem === 'Ana' ? '- Ana: Professional woman with authority, could be a judge or lawyer, formal attire' : ''}
${personagem === 'Carlos' ? '- Carlos: Young law student, eager to learn, casual but neat' : ''}

ABSOLUTE RULES:
1. IF ANY TEXT IS NEEDED IN THE IMAGE, IT MUST BE IN BRAZILIAN PORTUGUESE - WRITE IN UPPERCASE
2. NEVER use English text in the image
3. NO graphic violence or inappropriate content
4. Characters must look like distinct Brazilian individuals
5. Scene must be SPECIFIC to this content

OUTPUT:
Write ONLY the detailed image prompt. No explanations.
Start with: "A professional FLAT 2D editorial illustration (NOT 3D, NOT cute) in SQUARE 1:1 format showing..."`

  console.log('[gerar-imagem-aula-artigo] Gerando prompt para:', tipo, personagem || 'sem personagem')

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
    console.error('[gerar-imagem-aula-artigo] Erro Gemini:', response.status, errorText)
    throw new Error(`Erro ao gerar prompt: ${response.status}`)
  }

  const data = await response.json()
  const promptGerado = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  
  if (!promptGerado) {
    throw new Error('Prompt vazio retornado pela IA')
  }
  
  console.log('[gerar-imagem-aula-artigo] Prompt gerado:', promptGerado.substring(0, 300))
  return promptGerado
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      aulaId,
      secaoId,
      slideIndex,
      conteudo,
      tipo,
      personagem,
      contexto,
      numeroArtigo,
      codigoTabela
    } = await req.json()

    if (!conteudo || !tipo || !numeroArtigo || !codigoTabela) {
      throw new Error('conteudo, tipo, numeroArtigo e codigoTabela são obrigatórios')
    }

    console.log(`[gerar-imagem-aula-artigo] Gerando imagem para Art. ${numeroArtigo} - Tipo: ${tipo}, Seção: ${secaoId}, Slide: ${slideIndex}`)

    // Coletar chaves disponíveis
    const apiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];
    
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY')
    
    if (apiKeys.length === 0) {
      throw new Error('Nenhuma chave API Gemini configurada')
    }

    console.log(`[gerar-imagem-aula-artigo] ${apiKeys.length} chaves disponíveis`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Gerar prompt contextualizado com IA
    console.log('[gerar-imagem-aula-artigo] Etapa 1: Gerando prompt com Gemini...')
    const promptEspecifico = await gerarPromptComIA(
      conteudo,
      tipo as 'storytelling' | 'exemplo',
      personagem,
      contexto,
      numeroArtigo,
      codigoTabela,
      apiKeys[0]
    )

    // 2. Gerar imagem com fallback multi-modelo
    const promptFinal = `${promptEspecifico}

CRITICAL STYLE REQUIREMENTS:
- Professional FLAT 2D editorial illustration
- Style like The Economist, Wall Street Journal, or serious legal magazines
- FORBIDDEN: 3D style, 3D renders, Pixar 3D, any three-dimensional effects
- FORBIDDEN: Cute, kawaii, chibi, childish, Duolingo-like cute style
- FORBIDDEN: Large anime-style eyes or oversized heads
- MUST be FLAT 2D editorial illustration only, serious and professional
- Clean lines, ADULT characters with realistic proportions and mature expressions
- SQUARE 1:1 aspect ratio format (very important!)
- Professional muted FLAT colors, simple backgrounds without 3D depth - NOT candy/vibrant
- Characters should look like Brazilian/Latin American ADULT professionals with NORMAL-sized eyes

CRITICAL LANGUAGE: 
- IF there is ANY text visible in the image, it MUST be in BRAZILIAN PORTUGUESE

High quality professional FLAT 2D editorial illustration. NOT 3D. NOT cute.`

    console.log('[gerar-imagem-aula-artigo] Etapa 2: Gerando imagem com fallback multi-modelo...')

    const base64Data = await gerarImagemComFallback(promptFinal, apiKeys)

    // 3. Converter base64
    const binaryString = atob(base64Data)
    let uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }

    console.log(`[gerar-imagem-aula-artigo] Imagem gerada, tamanho: ${uint8Array.length} bytes`)

    // 4. Comprimir com TinyPNG
    if (TINYPNG_API_KEY) {
      try {
        const compressed = await comprimirComTinyPNG(uint8Array, TINYPNG_API_KEY)
        uint8Array = new Uint8Array(compressed)
      } catch (compressError) {
        console.error('[gerar-imagem-aula-artigo] Erro na compressão (continuando sem):', compressError)
      }
    }

    // 5. Upload para Supabase Storage
    const filePath = `aulas/${numeroArtigo}_${tipo}_${secaoId || 0}_${slideIndex || 0}_${Date.now()}.png`
    const imageUrl = await uploadParaSupabase(supabase, uint8Array, 'imagens', filePath, 'image/png')

    console.log(`[gerar-imagem-aula-artigo] Upload sucesso: ${imageUrl}`)

    return new Response(
      JSON.stringify({ 
        url_imagem: imageUrl, 
        tipo,
        secaoId,
        slideIndex
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-imagem-aula-artigo] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar imagem', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})