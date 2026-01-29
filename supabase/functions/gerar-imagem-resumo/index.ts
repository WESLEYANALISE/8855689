import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

// Função para gerar imagem com Gemini - aceita modelo como parâmetro
async function gerarImagemComGemini(prompt: string, apiKey: string, modelo: string = 'gemini-2.0-flash-exp-image-generation'): Promise<string> {
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
    console.error(`[gerar-imagem-resumo] Erro na API Gemini Image (${modelo}): ${response.status}`, errorText);
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

// Fallback OpenAI DALL-E/GPT-Image
async function gerarImagemComOpenAI(prompt: string): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  console.log('[gerar-imagem-resumo] 🎨 Tentando OpenAI gpt-image-1...');
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[gerar-imagem-resumo] Erro OpenAI:', response.status, errorText);
    throw new Error(`OpenAI erro: ${response.status}`);
  }

  const data = await response.json();
  const base64 = data.data?.[0]?.b64_json;
  
  if (!base64) {
    throw new Error('OpenAI não retornou imagem');
  }

  console.log('[gerar-imagem-resumo] ✅ Imagem gerada com OpenAI');
  return base64;
}

// Sistema de fallback com 3 chaves Gemini + 2 modelos + OpenAI
async function gerarImagemComFallback(prompt: string): Promise<string> {
  const chavesGemini = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
  ].filter(Boolean) as string[];

  // Modelos Gemini em ordem de preferência
  const modelos = [
    'gemini-2.0-flash-exp-image-generation',
    'gemini-2.5-flash-image'
  ];

  console.log(`[gerar-imagem-resumo] ${chavesGemini.length} chaves Gemini disponíveis, ${modelos.length} modelos`);

  let ultimoErro = '';

  // Tentar Gemini primeiro
  if (chavesGemini.length > 0) {
    for (const modelo of modelos) {
      console.log(`[gerar-imagem-resumo] 🎨 Tentando modelo: ${modelo}`);
      
      for (let i = 0; i < chavesGemini.length; i++) {
        try {
          console.log(`[gerar-imagem-resumo] Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
          const result = await gerarImagemComGemini(prompt, chavesGemini[i], modelo);
          console.log(`[gerar-imagem-resumo] ✅ Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
          return result;
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          ultimoErro = msg;
          console.log(`[gerar-imagem-resumo] ❌ GEMINI_KEY_${i + 1} falhou: ${msg.substring(0, 150)}`);
          continue;
        }
      }
      
      console.log(`[gerar-imagem-resumo] ⚠️ Todas as chaves falharam no modelo ${modelo}`);
    }
  }
  
  // Fallback para OpenAI se Gemini falhar
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) {
    try {
      console.log('[gerar-imagem-resumo] 🔄 Tentando fallback OpenAI...');
      return await gerarImagemComOpenAI(prompt);
    } catch (openaiError) {
      const msg = openaiError instanceof Error ? openaiError.message : String(openaiError);
      console.error('[gerar-imagem-resumo] ❌ OpenAI também falhou:', msg);
      ultimoErro = msg;
    }
  } else {
    console.log('[gerar-imagem-resumo] ⚠️ OPENAI_API_KEY não configurada para fallback');
  }
  
  throw new Error(`Todas as APIs falharam. Último erro: ${ultimoErro}`);
}

// Gerar prompt de imagem usando Gemini TEXT - com fallback de 4 chaves + OpenAI
async function gerarPromptComIA(conteudo: string, tipo: string, area: string, tema: string): Promise<string> {
  const textoLimitado = conteudo.substring(0, 2500)
  
  const API_KEYS = [
    { name: 'GEMINI_KEY_1', key: Deno.env.get('GEMINI_KEY_1') },
    { name: 'GEMINI_KEY_2', key: Deno.env.get('GEMINI_KEY_2') },
    { name: 'GEMINI_KEY_3', key: Deno.env.get('GEMINI_KEY_3') },
    { name: 'DIREITO_PREMIUM_API_KEY', key: Deno.env.get('DIREITO_PREMIUM_API_KEY') }
  ].filter(k => k.key);
  
  const promptParaGerarPrompt = `Você é um especialista em criar prompts para ILUSTRAÇÕES CARTOON NARRATIVAS para educação jurídica no Brasil.

CONTEXTO: Área ${area}, Tema ${tema}, Tipo: ${tipo.startsWith('exemplo') ? 'CASO PRÁTICO' : 'RESUMO CONCEITUAL'}

CONTEÚDO: ${textoLimitado}

ESTILO: Cartoon editorial FLAT 2D profissional, diversidade brasileira, fundo azul escuro (#0f172a), destaques dourados.

${tipo.startsWith('exemplo') ? 'Crie cena mostrando a situação prática acontecendo.' : 'Crie metáfora visual do conceito jurídico.'}

Comece com: "FLAT 2D EDITORIAL ILLUSTRATION: A professional flat 2D illustration showing..."
Sem texto na imagem. Apenas o prompt.`
  
  console.log('[gerar-imagem-resumo] Etapa 1: Gerando prompt cartoon robusto...')

  // Tentar chaves Gemini primeiro
  for (const { name, key } of API_KEYS) {
    try {
      console.log(`[gerar-imagem-resumo] Tentando ${name} para prompt...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptParaGerarPrompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 1000 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const promptGerado = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (promptGerado) {
          console.log(`[gerar-imagem-resumo] ✅ Prompt gerado com ${name}`);
          return promptGerado;
        }
      }
      
      const errorText = await response.text();
      if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED')) {
        console.log(`[gerar-imagem-resumo] ⚠️ Quota excedida em ${name}, tentando próxima...`);
        continue;
      }
      console.error(`[gerar-imagem-resumo] Erro ao gerar prompt com ${name}:`, response.status);
      continue;
    } catch (error) {
      console.error(`[gerar-imagem-resumo] Exceção com ${name}:`, error);
      continue;
    }
  }
  
  // Fallback para OpenAI se Gemini falhar
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) {
    try {
      console.log('[gerar-imagem-resumo] 🔄 Tentando OpenAI para gerar prompt...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Você é um especialista em criar prompts para ilustrações.' },
            { role: 'user', content: promptParaGerarPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.85
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const promptGerado = data.choices?.[0]?.message?.content?.trim();
        if (promptGerado) {
          console.log('[gerar-imagem-resumo] ✅ Prompt gerado com OpenAI');
          return promptGerado;
        }
      }
      console.error('[gerar-imagem-resumo] ❌ OpenAI falhou para prompt:', response.status);
    } catch (error) {
      console.error('[gerar-imagem-resumo] ❌ Exceção OpenAI para prompt:', error);
    }
  }
  
  throw new Error('Todas as chaves API falharam para gerar prompt');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { resumoId, tipo, conteudo, area, tema, tabela } = await req.json()

    // Determinar qual tabela usar (default: RESUMO)
    const tabelaDestino = tabela || 'RESUMO'
    console.log(`[gerar-imagem-resumo] Usando tabela: ${tabelaDestino}, resumoId: ${resumoId}`)

    if (!resumoId || !tipo || !conteudo) {
      throw new Error('resumoId, tipo e conteudo são obrigatórios')
    }

    const GEMINI_KEY_1 = Deno.env.get('GEMINI_KEY_1')
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY')
    
    if (!GEMINI_KEY_1) {
      throw new Error('GEMINI_KEY_1 não configurado')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const colunaMap: Record<string, string> = {
      'resumo': 'url_imagem_resumo',
      'exemplo1': 'url_imagem_exemplo_1',
      'exemplo2': 'url_imagem_exemplo_2',
      'exemplo3': 'url_imagem_exemplo_3'
    }
    const coluna = colunaMap[tipo]
    if (!coluna) {
      throw new Error('Tipo inválido. Use: resumo, exemplo1, exemplo2, exemplo3')
    }

    // Verificar cache - usando tabela dinâmica
    const { data: resumoData, error: fetchError } = await supabase
      .from(tabelaDestino)
      .select('url_imagem_resumo, url_imagem_exemplo_1, url_imagem_exemplo_2, url_imagem_exemplo_3')
      .eq('id', resumoId)
      .single()

    if (fetchError) {
      console.error(`[gerar-imagem-resumo] Erro ao buscar resumo na tabela ${tabelaDestino}:`, fetchError)
      throw new Error(`Resumo não encontrado na tabela ${tabelaDestino}`)
    }

    const urlExistente = resumoData?.[coluna as keyof typeof resumoData] as string | null
    if (urlExistente) {
      console.log('[gerar-imagem-resumo] Imagem em cache:', urlExistente)
      return new Response(
        JSON.stringify({ url_imagem: urlExistente, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ETAPA 1: Gerar prompt específico (com fallback de 4 chaves)
    const promptEspecifico = await gerarPromptComIA(
      conteudo, 
      tipo, 
      area || 'Direito', 
      tema || 'Tema jurídico'
    )

    // ETAPA 2: Gerar imagem com fallback - PROMPT FINAL ROBUSTO
    const promptFinal = `${promptEspecifico}

═══════════════════════════════════════════════════════════════
MANDATORY VISUAL STYLE - MUST FOLLOW EXACTLY:
═══════════════════════════════════════════════════════════════

✅ STYLE: FLAT 2D EDITORIAL ILLUSTRATION (PROFESSIONAL/JOURNALISTIC)
- Professional FLAT 2D editorial illustration (NOT 3D, NOT cute)
- Style similar to The Economist, Wall Street Journal, or serious legal magazines
- FORBIDDEN: 3D style, 3D renders, Pixar 3D, any three-dimensional effects
- FORBIDDEN: Cute, kawaii, chibi, childish, or infantile style
- FORBIDDEN: Large anime-style eyes or oversized heads
- Clean FLAT illustration with professional, crisp lines
- Serious editorial illustration suitable for adult legal education

✅ COLORS:
- BACKGROUND: Dark navy blue gradient (#0f172a to #1e3a5a)
- HIGHLIGHTS: Warm gold (#f59e0b) and orange (#ea580c)
- PROFESSIONAL FLAT muted colors, NOT candy/vibrant colors

✅ CHARACTERS:
- Brazilian diverse population (different skin tones)
- ADULT proportions with NORMAL-sized eyes (NOT large anime eyes)
- Professional, mature facial expressions
- Professional or business casual Brazilian clothing
- Serious demeanor appropriate for legal content

✅ CONTEXTUAL EXPRESSIONS - CRITICAL:
- CRIMINALS: suspicious, malicious, greedy, angry expressions (NEVER sad)
- VICTIMS: fearful, surprised, worried expressions
- AUTHORITIES: serious, firm, determined expressions
- Expressions must reflect character's MORAL ROLE in the scene

✅ LEGAL SYMBOLS (include 1-2):
- Golden scales of justice
- Wooden gavel
- White/blue police car
- Courthouse with columns

✅ COMPOSITION:
- 16:9 landscape format
- Three depth layers (foreground, middle, background) but FLAT 2D style
- Main character prominently featured
- Rich environmental details in FLAT 2D style

⛔ ABSOLUTELY FORBIDDEN - DO NOT INCLUDE:
- ANY TEXT, LETTERS, WORDS, NUMBERS, LABELS
- ANY SIGNS, PLAQUES, BANNERS WITH WRITING
- ANY DOCUMENTS WITH VISIBLE TEXT
- ANY LOGOS, BRANDS, NAMES
- 3D style, 3D renders, Pixar 3D, any three-dimensional effects
- Photorealistic style
- White or light backgrounds
- Childish/simplistic style

Generate only the image, no explanations.`

    console.log('[gerar-imagem-resumo] Etapa 2: Gerando imagem com prompt robusto...')

    const base64Data = await gerarImagemComFallback(promptFinal)

    // Converter base64
    const binaryString = atob(base64Data)
    let uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }

    console.log(`[gerar-imagem-resumo] Imagem gerada: ${uint8Array.length} bytes`)

    // ETAPA 3: Comprimir e converter para WebP
    if (TINYPNG_API_KEY) {
      try {
        const compressed = await comprimirParaWebP(uint8Array, TINYPNG_API_KEY)
        uint8Array = new Uint8Array(compressed)
      } catch (compressError) {
        console.error('[gerar-imagem-resumo] Erro na compressão (continuando sem):', compressError)
      }
    }

    // ETAPA 4: Upload para Supabase Storage como WebP
    const filePath = `resumos/${resumoId}_${tipo}_${Date.now()}.webp`
    const imageUrl = await uploadParaSupabase(supabase, uint8Array, 'imagens', filePath, 'image/webp')

    console.log('[gerar-imagem-resumo] Imagem uploaded:', imageUrl)

    // Salvar URL na tabela correta
    const updateData: Record<string, string> = {}
    updateData[coluna] = imageUrl

    const { error: updateError } = await supabase
      .from(tabelaDestino)
      .update(updateData)
      .eq('id', resumoId)

    if (updateError) {
      console.error(`[gerar-imagem-resumo] Erro ao salvar URL na tabela ${tabelaDestino}:`, updateError)
    } else {
      console.log(`[gerar-imagem-resumo] URL salva com sucesso na tabela ${tabelaDestino}`)
    }

    return new Response(
      JSON.stringify({ url_imagem: imageUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-imagem-resumo] Erro ao gerar imagem:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar imagem', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
