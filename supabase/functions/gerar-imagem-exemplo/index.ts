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
    console.error(`[gerar-imagem-exemplo] Erro na API Gemini (${modelo}): ${response.status}`, errorText.substring(0, 200));
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
async function gerarImagemComFallback(prompt: string, chavesGemini: string[]): Promise<string> {
  console.log(`[gerar-imagem-exemplo] ${chavesGemini.length} chaves, ${MODELOS_IMAGEM.length} modelos disponíveis`);

  let ultimoErro = '';

  for (const modelo of MODELOS_IMAGEM) {
    console.log(`[gerar-imagem-exemplo] 🎨 Tentando modelo: ${modelo}`);
    let modeloFalhouPor404 = false;
    
    for (let i = 0; i < chavesGemini.length; i++) {
      try {
        console.log(`[gerar-imagem-exemplo] Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
        const result = await gerarImagemComGemini(prompt, chavesGemini[i], modelo);
        console.log(`[gerar-imagem-exemplo] ✅ Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        ultimoErro = msg;
        console.log(`[gerar-imagem-exemplo] ❌ GEMINI_KEY_${i + 1} falhou: ${msg.substring(0, 150)}`);
        
        // Se modelo não existe (404), pular para próximo modelo
        if (msg.includes('404')) {
          console.log(`[gerar-imagem-exemplo] Modelo ${modelo} não disponível, tentando próximo...`);
          modeloFalhouPor404 = true;
          break;
        }
        
        // Se for erro de cota/rate limit (429) ou recurso esgotado, tentar próxima chave
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
          continue;
        }
        
        // Outros erros, tentar próxima chave
        continue;
      }
    }
    
    if (!modeloFalhouPor404) {
      console.log(`[gerar-imagem-exemplo] ⚠️ Todas as chaves falharam no modelo ${modelo}, tentando próximo modelo...`);
    }
  }

  throw new Error(`Todas as ${chavesGemini.length} chaves falharam em todos os ${MODELOS_IMAGEM.length} modelos. Último erro: ${ultimoErro}`);
}

// Função para gerar prompt contextualizado com IA - Estilo GTA 5 (igual aos flashcards)
async function gerarPromptComIA(exemploTexto: string, area: string, tema: string, apiKey: string): Promise<string> {
  const textoLimitado = exemploTexto.substring(0, 2000)
  
  const promptParaGerarPrompt = `Você é um especialista em criar descrições visuais cinematográficas para ilustrar situações jurídicas do cotidiano brasileiro.

CONTEXTO JURÍDICO:
- Área do Direito: ${area}
- Tema específico: ${tema}

SITUAÇÃO A ILUSTRAR:
${textoLimitado}

MISSÃO:
Analise cuidadosamente a situação jurídica descrita e crie uma descrição visual DETALHADA de uma cena que capture o MOMENTO PRINCIPAL dessa situação.

FORMATO DA RESPOSTA (120-150 palavras):

1. PERSONAGENS (30 palavras):
   - Descreva os personagens principais com detalhes visuais (idade aproximada, vestimenta, expressão facial, postura corporal)
   - Exemplo: "Um homem de cerca de 40 anos, vestindo terno cinza, expressão preocupada, segurando documentos"

2. CENÁRIO/LOCAL (40 palavras):
   - Descreva o ambiente com riqueza de detalhes (tipo de local, iluminação, objetos relevantes, atmosfera)
   - Exemplo: "Escritório de advocacia moderno, mesa de madeira escura, estantes com livros jurídicos, luz natural entrando pela janela"

3. AÇÃO PRINCIPAL (50 palavras):
   - Descreva a ação central que ilustra o conceito jurídico (o que está acontecendo, interação entre personagens)
   - Foque no momento mais representativo da situação legal

4. ELEMENTOS CONTEXTUAIS (30 palavras):
   - Adicione detalhes que reforcem o contexto brasileiro e jurídico (objetos, documentos em branco, símbolos)

REGRAS OBRIGATÓRIAS:
- Contexto 100% BRASILEIRO (pessoas, cenários, vestimentas brasileiras)
- Cena DINÂMICA mostrando ação ou interação entre personagens
- NUNCA mencione texto, palavras, números ou escrita na imagem
- Documentos e papéis devem aparecer EM BRANCO (sem texto visível)
- Evite termos jurídicos técnicos - descreva visualmente o que acontece
- A cena deve ser cinematográfica, com ângulo interessante e composição impactante
- Responda APENAS com a descrição visual, sem explicações ou comentários`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptParaGerarPrompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 500 }
    })
  })

  if (!response.ok) throw new Error(`Erro ao gerar prompt: ${response.status}`)
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

// Gerar prompt genérico de fallback (quando todas as chaves falharem)
function gerarPromptGenerico(area: string, tema: string): string {
  return `Uma cena cinematográfica do cotidiano brasileiro ilustrando um conceito de ${area} relacionado a ${tema}. 

PERSONAGENS: Dois ou mais adultos brasileiros em trajes profissionais, com expressões engajadas, interagindo ativamente.

CENÁRIO: Ambiente profissional brasileiro bem iluminado - pode ser um escritório moderno, sala de reuniões, cartório ou tribunal. Mesa com documentos em branco, cadeiras confortáveis, elementos decorativos sutis.

AÇÃO: Os personagens estão em momento de discussão, análise de documentos ou negociação. Gestos expressivos, postura corporal que transmite o contexto da situação jurídica.

ELEMENTOS CONTEXTUAIS: Estantes com livros jurídicos ao fundo, janelas com luz natural, objetos de escritório como canetas e pastas. Documentos e papéis sempre em branco, sem texto visível.

Estilo cinematográfico com composição dinâmica, ângulo levemente elevado, profundidade de campo que destaca os personagens principais.`;
}

// Função com fallback de 4 chaves para gerar prompt (+ prompt genérico como último recurso)
async function gerarPromptComIAFallback(
  exemploTexto: string, 
  area: string, 
  tema: string, 
  chavesGemini: string[]
): Promise<string> {
  let ultimoErro = '';
  
  for (let i = 0; i < chavesGemini.length; i++) {
    try {
      console.log(`[gerar-imagem-exemplo] Gerando prompt com chave ${i + 1}/${chavesGemini.length}...`);
      const resultado = await gerarPromptComIA(exemploTexto, area, tema, chavesGemini[i]);
      console.log(`[gerar-imagem-exemplo] ✅ Prompt gerado com chave ${i + 1}`);
      return resultado;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      ultimoErro = msg;
      console.log(`[gerar-imagem-exemplo] ❌ Chave ${i + 1} falhou no prompt: ${msg}`);
      
      // Aguardar 1 segundo antes de tentar próxima chave em caso de rate limit
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      
      // Outros erros também tentam próxima chave
      continue;
    }
  }
  
  // Fallback: usar prompt genérico
  console.log(`[gerar-imagem-exemplo] ⚠️ Todas as ${chavesGemini.length} chaves falharam. Usando prompt genérico.`);
  return gerarPromptGenerico(area, tema);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { questaoId, exemploTexto, area, tema, tabela } = await req.json()

    if (!questaoId || !exemploTexto) {
      throw new Error('questaoId e exemploTexto são obrigatórios')
    }

    // Determinar tabela de destino
    const tabelaDestino = tabela || 'QUESTOES_GERADAS'
    const colunaImagem = 'url_imagem_exemplo'

    // Coletar todas as chaves disponíveis
    const chavesGemini = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];
    
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY')
    
    if (chavesGemini.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY configurada')
    }

    console.log(`[gerar-imagem-exemplo] ${chavesGemini.length} chaves Gemini disponíveis, tabela: ${tabelaDestino}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar cache
    const { data: existingData } = await supabase
      .from(tabelaDestino)
      .select(colunaImagem)
      .eq('id', questaoId)
      .single()

    if (existingData?.[colunaImagem]) {
      return new Response(
        JSON.stringify({ url_imagem: existingData[colunaImagem], url: existingData[colunaImagem], cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[gerar-imagem-exemplo] Processando questão ${questaoId} - Área: ${area}, Tema: ${tema}`)

    // Etapa 1: Gerar prompt otimizado (com fallback de chaves)
    console.log('[gerar-imagem-exemplo] Etapa 1: Gerando prompt otimizado com fallback...')
    const promptEspecifico = await gerarPromptComIAFallback(exemploTexto, area || 'Direito', tema || 'Geral', chavesGemini)
    console.log('[gerar-imagem-exemplo] Prompt gerado:', promptEspecifico.substring(0, 600))

    // Etapa 2: Gerar imagem com estilo GTA 5 (igual aos flashcards) - SEM TEXTO
    const promptGTA5 = `CRITICAL: Generate an image with ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO WRITING OF ANY KIND.

GTA 5 artistic style: bold stylized digital painting, vibrant saturated colors, dramatic black outlines, dynamic action scene.

Scene description: ${promptEspecifico}

STYLE REQUIREMENTS:
- GTA 5 game art style with bold outlines and vibrant colors
- Brazilian context (Brazilian people, Brazilian settings)
- Dynamic, action-focused composition
- Dramatic lighting and cinematic angles
- Professional quality, sharp details
- 16:9 horizontal landscape format

ANATOMICAL ACCURACY:
- All humans have exactly 5 fingers per hand
- Correct body proportions
- Natural poses and expressions
- No distortions or surreal elements

STRICTLY PROHIBITED (VERY IMPORTANT):
- ZERO text, letters, words, numbers, or any typography anywhere in the image
- NO signs, banners, labels, or written content
- All documents, papers, signs, screens must be COMPLETELY BLANK
- Never include any form of writing or characters`

    const promptFinal = promptGTA5
    console.log('[gerar-imagem-exemplo] Etapa 2: Gerando imagem com fallback multi-modelo...')
    
    const base64Data = await gerarImagemComFallback(promptFinal, chavesGemini)

    // Converter base64 para bytes
    const binaryString = atob(base64Data)
    let uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }

    console.log(`[gerar-imagem-exemplo] Imagem gerada: ${uint8Array.length} bytes`)

    // Etapa 3: Comprimir e converter para WebP
    if (TINYPNG_API_KEY) {
      try {
        const compressed = await comprimirParaWebP(uint8Array, TINYPNG_API_KEY)
        uint8Array = new Uint8Array(compressed)
      } catch (compressError) {
        console.error('[gerar-imagem-exemplo] Erro na compressão (continuando sem):', compressError)
      }
    }

    // Etapa 4: Upload para Supabase Storage como WebP
    const filePath = `questoes/exemplo_${questaoId}_${Date.now()}.webp`
    const imageUrl = await uploadParaSupabase(supabase, uint8Array, 'imagens', filePath, 'image/webp')

    console.log(`[gerar-imagem-exemplo] Imagem salva: ${imageUrl}`)

    // Salvar no banco - usa tabela dinâmica
    await supabase.from(tabelaDestino).update({ [colunaImagem]: imageUrl }).eq('id', questaoId)

    return new Response(
      JSON.stringify({ url_imagem: imageUrl, url: imageUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-imagem-exemplo] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar imagem', details: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})