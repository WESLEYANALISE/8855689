import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  console.log(`[TinyPNG] Comprimindo ${imageBytes.length} bytes e convertendo para WebP...`);
  
  const buffer = imageBytes.buffer.slice(imageBytes.byteOffset, imageBytes.byteOffset + imageBytes.byteLength) as ArrayBuffer;
  
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      'Content-Type': 'image/png',
    },
    body: buffer
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
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
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

// Função para determinar época/período do livro
function determinarEpocaLivro(titulo: string, autor: string): string {
  const tituloLower = titulo.toLowerCase()
  const autorLower = autor.toLowerCase()
  
  if (autorLower.includes('victor hugo') || tituloLower.includes('miseráveis') || tituloLower.includes('último dia')) {
    return "19th century French Romanticism, with dramatic shadows, revolutionary Paris streets, prison cells"
  }
  if (autorLower.includes('dostoievski') || autorLower.includes('dostoevsky')) {
    return "19th century Russian literature, with cold St. Petersburg streets, psychological tension"
  }
  if (autorLower.includes('kafka')) {
    return "early 20th century European expressionism, with surreal bureaucratic offices"
  }
  if (autorLower.includes('maquiavel') || tituloLower.includes('príncipe')) {
    return "Italian Renaissance, with ornate palaces, political intrigue"
  }
  if (autorLower.includes('platão') || tituloLower.includes('república')) {
    return "Ancient Greece, with marble columns, philosophical gatherings"
  }
  if (autorLower.includes('sun tzu') || tituloLower.includes('arte da guerra')) {
    return "Ancient China, with traditional Chinese military camps, bamboo scrolls"
  }
  if (autorLower.includes('montesquieu') || tituloLower.includes('espírito das leis')) {
    return "18th century French Enlightenment, with elegant libraries, classical architecture, philosophical debates"
  }
  
  return "classical literary period appropriate to the book's themes"
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
  )

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GEMINI_ERROR_${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  
  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data
    }
  }
  
  throw new Error('Nenhuma imagem gerada')
}

// Função com fallback multi-modelo e multi-chave
async function gerarImagemComFallback(prompt: string, apiKeys: string[]): Promise<string> {
  console.log(`[gerar-imagem-capitulo] ${apiKeys.length} chaves, ${MODELOS_IMAGEM.length} modelos disponíveis`);
  
  let lastError = '';
  
  for (const modelo of MODELOS_IMAGEM) {
    console.log(`[gerar-imagem-capitulo] 🎨 Tentando modelo: ${modelo}`);
    let modeloFalhouPor404 = false;
    
    for (let i = 0; i < apiKeys.length; i++) {
      try {
        console.log(`[gerar-imagem-capitulo] Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
        const result = await gerarImagemComGemini(prompt, apiKeys[i], modelo);
        console.log(`[gerar-imagem-capitulo] ✅ Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
        return result;
      } catch (err: any) {
        lastError = err.message || String(err);
        console.log(`[gerar-imagem-capitulo] ❌ GEMINI_KEY_${i + 1} falhou: ${lastError.substring(0, 150)}`);
        
        // Se modelo não existe (404), pular para próximo modelo
        if (lastError.includes('404')) {
          console.log(`[gerar-imagem-capitulo] Modelo ${modelo} não disponível, tentando próximo...`);
          modeloFalhouPor404 = true;
          break;
        }
        
        // Se for erro 429 (quota), continuar para próxima chave
        if (lastError.includes('429') || lastError.includes('quota') || lastError.includes('RESOURCE_EXHAUSTED')) {
          continue;
        }
      }
    }
    
    if (!modeloFalhouPor404) {
      console.log(`[gerar-imagem-capitulo] ⚠️ Todas as chaves falharam no modelo ${modelo}, tentando próximo modelo...`);
    }
  }
  
  throw new Error(`Todas as ${apiKeys.length} chaves falharam em todos os ${MODELOS_IMAGEM.length} modelos. Último erro: ${lastError}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { livroId, biblioteca, tituloLivro, autorLivro, tituloCapitulo, textoCapitulo, pageIndex } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Coletar chaves disponíveis
    const GEMINI_KEYS = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];
    
    if (GEMINI_KEYS.length === 0) {
      throw new Error('Nenhuma chave API Gemini configurada')
    }

    console.log(`[gerar-imagem-capitulo] Gerando capa para capítulo ${pageIndex} do livro ${livroId}`)
    console.log(`[gerar-imagem-capitulo] ${GEMINI_KEYS.length} chaves disponíveis`)

    const epochInfo = determinarEpocaLivro(tituloLivro, autorLivro || '')
    
    const prompt = `Create a professional FLAT 2D editorial illustration for "${tituloLivro}" by ${autorLivro || 'Unknown'}.

CHAPTER: "${tituloCapitulo}"
SCENE: ${textoCapitulo?.substring(0, 500) || ''}

CONTEXT: ${epochInfo}

STYLE: Professional FLAT 2D editorial illustration, 16:9 format, period-appropriate colors.
NO text in the image. CORRECT human anatomy only.

OUTPUT: High-quality 16:9 professional illustration.`

    // Gerar imagem com fallback multi-modelo
    const imagemBase64 = await gerarImagemComFallback(prompt, GEMINI_KEYS);
    
    let imagemBytes = Uint8Array.from(atob(imagemBase64), c => c.charCodeAt(0))
    console.log(`[gerar-imagem-capitulo] Imagem gerada: ${imagemBytes.length} bytes`)

    // Comprimir e converter para WebP
    let finalBytes: Uint8Array = imagemBytes;
    if (TINYPNG_API_KEY) {
      try {
        finalBytes = await comprimirParaWebP(imagemBytes, TINYPNG_API_KEY)
      } catch (err) {
        console.warn('[gerar-imagem-capitulo] Falha na compressão, usando original:', err)
        finalBytes = imagemBytes;
      }
    } else {
      console.log('[gerar-imagem-capitulo] TinyPNG não configurado, salvando sem compressão')
    }
    
    const timestamp = Date.now()
    const path = `livros/cap_${livroId}_${pageIndex}_${timestamp}.webp`
    
    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(path, finalBytes, { contentType: 'image/webp', upsert: true })
    
    if (uploadError) throw uploadError
    
    const { data: urlData } = supabase.storage.from('imagens').getPublicUrl(path)
    console.log(`[gerar-imagem-capitulo] Imagem salva: ${urlData.publicUrl}`)
    
    // Salvar URL na estrutura_capitulos da leitura_interativa (fonte principal)
    const { data: leituraData } = await supabase
      .from('leitura_interativa')
      .select('estrutura_capitulos')
      .eq('biblioteca_classicos_id', livroId)
      .single()
    
    if (leituraData?.estrutura_capitulos) {
      const estrutura = leituraData.estrutura_capitulos as any
      
      if (estrutura.capitulos) {
        const capIndex = estrutura.capitulos.findIndex((c: any) => c.numero === pageIndex)
        if (capIndex >= 0) {
          estrutura.capitulos[capIndex].url_imagem = urlData.publicUrl
          console.log(`[gerar-imagem-capitulo] Salvando URL no capítulo ${pageIndex} da leitura_interativa`)
          
          await supabase
            .from('leitura_interativa')
            .update({ estrutura_capitulos: estrutura })
            .eq('biblioteca_classicos_id', livroId)
        }
      }
    }
    
    // Também atualizar resumo_capitulos se existir (compatibilidade)
    const tabelaMap: Record<string, string> = {
      'classicos': 'BIBLIOTECA-CLASSICOS',
      'oratoria': 'BIBLIOTECA-ORATORIA',
      'lideranca': 'BIBLIOTECA-LIDERANÇA'
    }
    const tabela = tabelaMap[biblioteca]
    
    if (tabela) {
      const { data: livro } = await supabase.from(tabela).select('resumo_capitulos').eq('id', livroId).single()
      
      if (livro?.resumo_capitulos) {
        const resumo = livro.resumo_capitulos as any
        
        if (pageIndex === 0 && resumo.introducao) {
          resumo.introducao.url_imagem = urlData.publicUrl
        } else if (resumo.capitulos && resumo.capitulos[pageIndex - 1]) {
          resumo.capitulos[pageIndex - 1].url_imagem = urlData.publicUrl
        }
        
        await supabase.from(tabela).update({ resumo_capitulos: resumo }).eq('id', livroId)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      url_imagem: urlData.publicUrl 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Erro:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})