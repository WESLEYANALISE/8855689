import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Timeout para operações de mídia (10 segundos)
const MEDIA_TIMEOUT = 10000
const CAPITULOS_POR_LOTE = 5

// Função para criar timeout
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]).catch(() => fallback)
}

// Compressão com TinyPNG
async function comprimirComTinyPNG(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[compressao] Enviando ${imageBytes.length} bytes para TinyPNG...`)
  
  const response = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      'Content-Type': 'application/octet-stream'
    },
    body: new Blob([new Uint8Array(imageBytes)])
  })

  if (!response.ok) {
    console.error('[compressao] TinyPNG falhou, usando original')
    return imageBytes
  }

  const result = await response.json()
  if (!result.output?.url) {
    return imageBytes
  }

  const compressedResponse = await fetch(result.output.url)
  const compressedBuffer = await compressedResponse.arrayBuffer()
  const compressed = new Uint8Array(compressedBuffer)
  
  console.log(`[compressao] Compressão: ${imageBytes.length} -> ${compressed.length} bytes (${Math.round((1 - compressed.length / imageBytes.length) * 100)}% menor)`)
  return compressed
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

// Gerar imagem com Gemini - com fallback para Lovable AI
async function gerarImagemComGemini(prompt: string, apiKey: string): Promise<string> {
  const apiKeys = [
    { key: apiKey, name: 'DIREITO_PREMIUM' },
    { key: Deno.env.get('RESERVA_API_KEY'), name: 'RESERVA' },
    { key: Deno.env.get('GOOGLE_API_KEY'), name: 'GOOGLE' }
  ].filter(k => k.key)

  for (const { key, name } of apiKeys) {
    try {
      console.log(`[imagem] Tentando com ${name}...`)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${key}`,
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

      if (response.status === 429) {
        console.log(`[imagem] ${name} retornou 429, tentando próxima chave...`)
        continue
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[imagem] Erro ${name}:`, errorText)
        continue
      }

      const data = await response.json()
      const parts = data.candidates?.[0]?.content?.parts || []
      
      for (const part of parts) {
        if (part.inlineData?.data) {
          console.log(`[imagem] Sucesso com ${name}`)
          return part.inlineData.data
        }
      }
    } catch (e) {
      console.error(`[imagem] Erro ${name}:`, e)
    }
  }

  // Fallback para Lovable AI Gateway
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (LOVABLE_API_KEY) {
    try {
      console.log('[imagem] Tentando Lovable AI Gateway como fallback final...')
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [{ role: 'user', content: prompt }],
          modalities: ['image', 'text']
        })
      })

      if (response.ok) {
        const data = await response.json()
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
        if (imageUrl && imageUrl.startsWith('data:image')) {
          const base64 = imageUrl.split(',')[1]
          console.log('[imagem] Sucesso com Lovable AI Gateway!')
          return base64
        }
      }
    } catch (e) {
      console.error('[imagem] Erro Lovable AI:', e)
    }
  }

  throw new Error('Nenhuma chave API conseguiu gerar a imagem')
}

// Gerar narração com Google TTS - inclui título
async function gerarNarracao(supabase: any, titulo: string, texto: string, apiKey: string, livroId: number, suffix: string): Promise<string> {
  console.log('Gerando narração com Google TTS...')
  
  // Incluir título na narração
  const textoCompleto = `${titulo}. ${texto}`.substring(0, 4000)
  
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: textoCompleto },
        voice: {
          languageCode: 'pt-BR',
          name: 'pt-BR-Chirp3-HD-Fenrir'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0,
          speakingRate: 1.0
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Erro TTS:', errorText)
    throw new Error(`Erro ao gerar narração: ${response.status}`)
  }

  const data = await response.json()
  const audioBase64 = data.audioContent
  
  // Converter base64 para Uint8Array
  const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
  
  // Upload para Supabase Storage
  const timestamp = Date.now()
  const path = `livros/narracao_${livroId}_${suffix}_${timestamp}.mp3`
  const url = await uploadParaSupabase(supabase, audioBytes, 'audios', path, 'audio/mpeg')
  
  console.log('Upload áudio sucesso:', url)
  return url
}

// Processar imagem de um capítulo - prompt baseado no tema e época do livro
async function processarImagem(
  supabase: any,
  tituloLivro: string,
  tituloCapitulo: string,
  textoCapitulo: string,
  autor: string,
  apiKey: string,
  tinypngKey: string | undefined,
  livroId: number,
  prefix: string,
  epocaLivro?: string
): Promise<string | null> {
  try {
    // Determinar época/período baseado no autor e livro
    const epochInfo = epocaLivro || determinarEpocaLivro(tituloLivro, autor)
    
    const prompt = `Create a professional FLAT 2D editorial illustration for the book "${tituloLivro}" by ${autor}.

CHAPTER: "${tituloCapitulo}"
SCENE CONTEXT: ${textoCapitulo.substring(0, 600)}

HISTORICAL/THEMATIC CONTEXT:
- This illustration must reflect the ${epochInfo} period and themes of the book
- Use period-appropriate clothing, architecture, and visual elements
- The mood and atmosphere should match the book's tone (philosophical, dramatic, legal, etc.)

MANDATORY STYLE SPECIFICATIONS:
- Style: Professional FLAT 2D editorial illustration (like The Economist, Harvard Business Review, New Yorker magazine)
- Format: WIDE 16:9 horizontal landscape aspect ratio
- Colors: Period-appropriate palette - use tones that reflect the ${epochInfo} era (sepia tones for historical, muted for philosophical, warm for narrative)
- Lighting: Atmospheric lighting that reflects the mood of the chapter

ANTI-DISTORTION RULES (CRITICAL):
- Human anatomy: CORRECT proportions only - normal head-to-body ratio (1:7 or 1:8 for adults)
- Hands: EXACTLY 5 fingers per hand, natural positions
- Faces: SYMMETRICAL features, proportional, natural expressions
- NO duplicate or merged body parts, NO warped elements

CHARACTER GUIDELINES:
- Characters should wear ${epochInfo}-appropriate clothing
- Period-accurate hairstyles and accessories
- Natural expressions that match the scene's emotional tone
- Clear, distinct individuals

TEXT RULES:
- STRONGLY PREFERRED: NO text in the image
- IF text necessary: BRAZILIAN PORTUGUESE UPPERCASE ONLY

COMPOSITION:
- Clear focal point reflecting the chapter's main concept
- Background appropriate to the ${epochInfo} setting
- Professional, clean layout

OUTPUT: High-quality 16:9 professional illustration reflecting the book's era and themes.`

    const imagemBase64 = await gerarImagemComGemini(prompt, apiKey)
    let imagemBytes = Uint8Array.from(atob(imagemBase64), c => c.charCodeAt(0))
    
    if (tinypngKey) {
      imagemBytes = new Uint8Array(await comprimirComTinyPNG(imagemBytes, tinypngKey))
    }
    
    const timestamp = Date.now()
    const path = `livros/${prefix}_${livroId}_${timestamp}.png`
    return await uploadParaSupabase(supabase, imagemBytes, 'imagens', path, 'image/png')
  } catch (e) {
    console.error(`Erro ao processar imagem ${prefix}:`, e)
    return null
  }
}

// Função para determinar época/período do livro
function determinarEpocaLivro(titulo: string, autor: string): string {
  const tituloLower = titulo.toLowerCase()
  const autorLower = autor.toLowerCase()
  
  // Autores e obras clássicas com seus períodos
  if (autorLower.includes('victor hugo') || tituloLower.includes('miseráveis') || tituloLower.includes('último dia')) {
    return "19th century French Romanticism, with dramatic shadows, revolutionary Paris streets, prison cells, guillotine imagery"
  }
  if (autorLower.includes('dostoievski') || autorLower.includes('dostoevsky') || autorLower.includes('dostoiévski')) {
    return "19th century Russian literature, with cold St. Petersburg streets, Orthodox churches, poverty-stricken neighborhoods, psychological tension"
  }
  if (autorLower.includes('kafka')) {
    return "early 20th century European expressionism, with surreal bureaucratic offices, oppressive architecture, isolated individuals"
  }
  if (autorLower.includes('maquiavel') || tituloLower.includes('príncipe')) {
    return "Italian Renaissance, with ornate palaces, political intrigue, Florentine architecture, courtly diplomacy"
  }
  if (autorLower.includes('platão') || autorLower.includes('plato') || tituloLower.includes('república')) {
    return "Ancient Greece, with marble columns, philosophical gatherings, Athenian agora, Mediterranean settings"
  }
  if (autorLower.includes('aristóteles') || autorLower.includes('aristotle')) {
    return "Classical Greece, with the Lyceum, philosophical discourse, Greek temples, Mediterranean light"
  }
  if (autorLower.includes('sun tzu') || tituloLower.includes('arte da guerra')) {
    return "Ancient China, with traditional Chinese military camps, bamboo scrolls, warrior generals, Eastern landscapes"
  }
  if (autorLower.includes('montesquieu') || tituloLower.includes('espírito das leis')) {
    return "18th century French Enlightenment, with elegant salons, legal documents, classical architecture"
  }
  if (autorLower.includes('rousseau') || tituloLower.includes('contrato social')) {
    return "18th century European Enlightenment, with natural landscapes, revolutionary ideals, philosophical gatherings"
  }
  if (autorLower.includes('hobbes') || tituloLower.includes('leviatã')) {
    return "17th century England, with political tension, royal courts, philosophical debates, sea imagery"
  }
  if (autorLower.includes('shakespeare')) {
    return "Elizabethan England, with theatrical stages, royal courts, dramatic scenes, period costumes"
  }
  if (autorLower.includes('goethe') || tituloLower.includes('fausto')) {
    return "German Romanticism, with dramatic landscapes, scholarly studies, supernatural elements, Sturm und Drang"
  }
  if (autorLower.includes('nietzsche')) {
    return "late 19th century European philosophy, with alpine landscapes, solitary thinkers, dramatic contrasts"
  }
  if (autorLower.includes('freud')) {
    return "early 20th century Vienna, with elegant consulting rooms, psychological imagery, dreams and subconscious"
  }
  if (autorLower.includes('marx') || autorLower.includes('engels')) {
    return "19th century Industrial Revolution, with factories, workers, social movements, urban poverty"
  }
  if (autorLower.includes('orwell') || tituloLower.includes('1984')) {
    return "dystopian 20th century, with surveillance imagery, totalitarian architecture, propaganda"
  }
  if (autorLower.includes('camus') || tituloLower.includes('estrangeiro')) {
    return "mid-20th century French Algeria, with Mediterranean sun, existential solitude, colonial settings"
  }
  if (autorLower.includes('sartre')) {
    return "mid-20th century Paris, with cafés, intellectual gatherings, post-war France, existentialist atmosphere"
  }
  if (autorLower.includes('dante') || tituloLower.includes('divina comédia')) {
    return "Medieval Italy, with religious imagery, allegorical landscapes, infernal and celestial scenes"
  }
  if (autorLower.includes('cervantes') || tituloLower.includes('quixote')) {
    return "Spanish Golden Age, with La Mancha landscapes, windmills, chivalric imagery, rural Spain"
  }
  
  // Fallback genérico para clássicos
  return "classical literary period appropriate to the book's themes, with period-accurate architecture, clothing, and atmosphere"
}

// Processar imagem do exemplo prático - prompt focado no exemplo com contexto do livro
async function processarImagemExemplo(
  supabase: any,
  tituloLivro: string,
  tituloCapitulo: string,
  exemploDescricao: string,
  autor: string,
  apiKey: string,
  tinypngKey: string | undefined,
  livroId: number,
  capituloNumero: number
): Promise<string | null> {
  try {
    const epochInfo = determinarEpocaLivro(tituloLivro, autor)
    
    const prompt = `Create a professional FLAT 2D editorial illustration for a PRACTICAL EXAMPLE from the book "${tituloLivro}" by ${autor}.

CHAPTER: "${tituloCapitulo}"
PRACTICAL EXAMPLE: ${exemploDescricao.substring(0, 600)}

CONTEXT: This example illustrates concepts from a ${epochInfo} work, but applied to modern or relatable situations.

MANDATORY STYLE:
- Style: Professional FLAT 2D editorial illustration
- Format: WIDE 16:9 horizontal landscape
- Colors: Warm, inviting tones that make the example relatable
- Mood: Educational, practical, easy to understand

ANTI-DISTORTION RULES:
- Human anatomy: CORRECT proportions (1:7 or 1:8 head-to-body ratio)
- Hands: EXACTLY 5 fingers, natural positions
- Faces: SYMMETRICAL, natural expressions
- NO distortions or merged elements

SCENE GUIDELINES:
- Show REAL people in EVERYDAY situations
- Include relevant context (office, home, street, etc.)
- Characters should be relatable Brazilian adults
- Natural body language

TEXT RULES:
- STRONGLY PREFERRED: NO text
- IF necessary: BRAZILIAN PORTUGUESE UPPERCASE ONLY

OUTPUT: Professional 16:9 illustration of a practical, relatable example.`

    const imagemBase64 = await gerarImagemComGemini(prompt, apiKey)
    let imagemBytes = Uint8Array.from(atob(imagemBase64), c => c.charCodeAt(0))
    
    if (tinypngKey) {
      imagemBytes = new Uint8Array(await comprimirComTinyPNG(imagemBytes, tinypngKey))
    }
    
    const timestamp = Date.now()
    const path = `livros/exemplo_${livroId}_cap${capituloNumero}_${timestamp}.png`
    return await uploadParaSupabase(supabase, imagemBytes, 'imagens', path, 'image/png')
  } catch (e) {
    console.error(`Erro ao processar imagem exemplo cap${capituloNumero}:`, e)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    const { livroId, biblioteca, titulo, autor, sobre, lote = 0, totalCapitulosEsperado } = await req.json()
    console.log(`Gerando resumo para: ${titulo} (${biblioteca}), lote: ${lote}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Mapear nome da biblioteca para tabela
    const tabelaMap: Record<string, string> = {
      'classicos': 'BIBLIOTECA-CLASSICOS',
      'oratoria': 'BIBLIOTECA-ORATORIA',
      'lideranca': 'BIBLIOTECA-LIDERANÇA'
    }
    const tabela = tabelaMap[biblioteca]
    if (!tabela) {
      throw new Error('Biblioteca inválida')
    }

    // Buscar dados existentes
    const { data: livroExistente } = await supabase
      .from(tabela)
      .select('resumo_capitulos, questoes_resumo, resumo_gerado_em, capitulos_gerados, total_capitulos')
      .eq('id', livroId)
      .single()

    // Se é lote 0 e já existe resumo completo, retornar cache
    if (lote === 0 && livroExistente?.resumo_capitulos && livroExistente?.questoes_resumo) {
      const totalCaps = livroExistente.total_capitulos || livroExistente.resumo_capitulos?.capitulos?.length || 0
      const capsGerados = livroExistente.capitulos_gerados || totalCaps
      
      // Só retornar cache se todos os capítulos foram gerados
      if (capsGerados >= totalCaps) {
        console.log('Resumo completo já existe, retornando cache')
        return new Response(JSON.stringify({
          success: true,
          cached: true,
          resumo_capitulos: livroExistente.resumo_capitulos,
          questoes_resumo: livroExistente.questoes_resumo,
          capitulos_gerados: capsGerados,
          total_capitulos: totalCaps,
          loteCompleto: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Chaves Gemini com fallback
    const GEMINI_KEYS = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[]
    
    if (GEMINI_KEYS.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada')
    }
    
    // Função auxiliar para chamar Gemini com fallback
    async function chamarGeminiComFallback(prompt: string, keyIndex = 0): Promise<string> {
      if (keyIndex >= GEMINI_KEYS.length) {
        throw new Error('Todas as chaves Gemini falharam')
      }
      
      const currentKey = GEMINI_KEYS[keyIndex]
      console.log(`[Gemini] Tentando key ${keyIndex + 1}/${GEMINI_KEYS.length}...`)
      
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 32000 }
            })
          }
        )
        
        if (response.status === 429 || response.status === 503) {
          console.log(`[Gemini] Key ${keyIndex + 1} com quota excedida, tentando próxima...`)
          return chamarGeminiComFallback(prompt, keyIndex + 1)
        }
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[Gemini] Erro (key ${keyIndex + 1}):`, response.status, errorText)
          return chamarGeminiComFallback(prompt, keyIndex + 1)
        }
        
        const data = await response.json()
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        console.log(`[Gemini] Sucesso com key ${keyIndex + 1}`)
        return result
      } catch (error) {
        console.error(`[Gemini] Exceção com key ${keyIndex + 1}:`, error)
        return chamarGeminiComFallback(prompt, keyIndex + 1)
      }
    }

    // Se é lote 0, precisamos gerar a estrutura completa primeiro
    let conteudo: any
    let resumoExistente = livroExistente?.resumo_capitulos
    
    if (lote === 0 || !resumoExistente) {
      // Prompt que pede à IA para criar capítulos com estrutura detalhada, citações, pontos-chave e exemplos
      const promptConteudo = `Você é um professor especialista em literatura, filosofia e direito. Pesquise sobre o livro "${titulo}" de ${autor} e crie um resumo didático COMPLETO, ESTRUTURADO E DINÂMICO.

IMPORTANTE: Você deve conhecer este livro. Baseie-se na estrutura REAL do livro para criar os capítulos. Se o livro tem 10 capítulos, crie 10. Se tem 30, crie 30. Se tem 5, crie 5. NÃO INVENTE - baseie-se na estrutura real do livro. NÃO HÁ LIMITE DE CAPÍTULOS.

CONTEXTO ADICIONAL DO LIVRO:
${sobre || 'Pesquise sobre o livro para obter mais contexto.'}

ESTRUTURA OBRIGATÓRIA (retorne em JSON):
{
  "introducao": {
    "titulo": "Introdução: ${titulo}",
    "texto": "[Apresentação envolvente do livro em 400-500 palavras, explicando: quem foi o autor, contexto histórico em que foi escrito, por que é importante até hoje, e o que o leitor vai aprender. Use parágrafos bem estruturados com dupla quebra de linha entre eles.]",
    "pontos_chave": ["[3-5 pontos principais que o leitor vai aprender com este livro]"]
  },
  "capitulos": [
    {
      "numero": 1,
      "titulo": "[Título do capítulo/conceito principal do livro real]",
      "texto": "[Resumo detalhado em 400-600 palavras. ESTRUTURE BEM o texto com parágrafos separados por DUPLA QUEBRA DE LINHA. Use formatação clara com introdução, desenvolvimento e conclusão do conceito.]",
      "citacoes": [
        {
          "autor": "[Nome do personagem/autor que disse a frase - ex: 'Juiz Truepenny', 'Raskolnikov', 'Maquiavel']",
          "fala": "[Frase marcante ou argumento importante dito por este personagem/autor no livro. Deve ser uma citação real ou paráfrase fiel do livro.]"
        }
      ],
      "pontos_chave": ["[2-4 conceitos/ideias principais deste capítulo em frases curtas]"],
      "exemplo": {
        "titulo": "Exemplo Prático",
        "descricao": "[Uma situação real e concreta do dia a dia que ilustra perfeitamente o conceito deste capítulo. Deve ser um cenário com personagens, contexto e desfecho que demonstre a aplicação do conceito. 150-250 palavras.]",
        "imagem_descricao": "[Descrição breve da cena para gerar uma imagem ilustrativa - descreva pessoas, ambiente, ações, objetos relevantes. 50-80 palavras em português.]"
      }
    }
  ],
  "conclusao": {
    "titulo": "Conclusão: A Mensagem de ${titulo}",
    "texto": "[Em 500-700 palavras, faça uma análise final com parágrafos bem estruturados (DUPLA QUEBRA DE LINHA) explicando: 1) O que o autor quis transmitir; 2) Os principais argumentos; 3) A importância para estudantes de Direito; 4) Como aplicar os ensinamentos na prática.]",
    "citacoes": [{"autor": "[Autor do livro]", "fala": "[Frase que resume a mensagem central da obra]"}],
    "pontos_chave": ["[3-5 lições finais que o leitor deve levar do livro]"]
  },
  "questoes": [
    {
      "pergunta": "[Pergunta sobre conceitos importantes do livro]",
      "alternativas": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correta": "A",
      "comentario": "[Explicação detalhada da resposta correta, conectando com o conteúdo do livro]"
    }
  ]
}

REGRAS IMPORTANTES DE ESTRUTURAÇÃO:
1. CITAÇÕES: Cada capítulo DEVE ter pelo menos 1-2 citações importantes de personagens ou do autor
2. PONTOS-CHAVE: Cada capítulo DEVE ter 2-4 pontos-chave em formato de lista
3. TEXTO: Use DUPLA QUEBRA DE LINHA (\\n\\n) entre parágrafos para boa legibilidade
4. ESTRUTURA: Organize o texto em seções claras - não escreva blocos de texto corridos

ESTILO DO TEXTO:
- Linguagem clara e acessível, como se explicasse para um amigo interessado
- FOCO EM RESUMIR O QUE O LIVRO QUER PASSAR - qual a mensagem de cada parte
- DESTAQUE citações importantes dos personagens/autor entre aspas
- Storytelling envolvente - conte como se fosse uma história fascinante
- Os exemplos devem ser situações reais e concretas

IMPORTANTE: 
- Baseie os capítulos na estrutura REAL do livro "${titulo}"
- Cada capítulo DEVE ter citações, pontos_chave e exemplo
- A CONCLUSÃO é OBRIGATÓRIA
- A IA deve conhecer este livro clássico

Retorne APENAS o JSON válido, sem markdown ou explicações adicionais.`

      console.log('Gerando conteúdo completo com Gemini...')
      let conteudoTexto = await chamarGeminiComFallback(promptConteudo)
      
      // Limpar markdown se houver
      conteudoTexto = conteudoTexto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      conteudo = JSON.parse(conteudoTexto)
      console.log('Conteúdo gerado:', conteudo.capitulos?.length, 'capítulos,', conteudo.questoes?.length, 'questões')
      
      // Inicializar mídia como null para todos
      conteudo.introducao.url_imagem = null
      conteudo.introducao.url_audio = null
      for (const cap of conteudo.capitulos) {
        cap.url_imagem = null
        cap.url_audio = null
        if (cap.exemplo) {
          cap.exemplo.url_imagem = null
        }
      }
      
      // Inicializar conclusão se existir
      if (conteudo.conclusao) {
        conteudo.conclusao.url_imagem = null
        conteudo.conclusao.url_audio = null
      }
      
      // Salvar estrutura inicial no banco (incluindo conclusão)
      await supabase
        .from(tabela)
        .update({
          resumo_capitulos: { 
            introducao: conteudo.introducao, 
            capitulos: conteudo.capitulos,
            conclusao: conteudo.conclusao || null
          },
          questoes_resumo: conteudo.questoes,
          total_capitulos: conteudo.capitulos.length,
          capitulos_gerados: 0,
          resumo_gerado_em: new Date().toISOString()
        })
        .eq('id', livroId)
        
      resumoExistente = { 
        introducao: conteudo.introducao, 
        capitulos: conteudo.capitulos,
        conclusao: conteudo.conclusao || null
      }
    } else {
      conteudo = {
        introducao: resumoExistente.introducao,
        capitulos: resumoExistente.capitulos,
        conclusao: resumoExistente.conclusao || null,
        questoes: livroExistente?.questoes_resumo
      }
    }

    // Calcular quais capítulos processar neste lote
    const inicioLote = lote * CAPITULOS_POR_LOTE
    const fimLote = Math.min(inicioLote + CAPITULOS_POR_LOTE, conteudo.capitulos.length)
    const capitulosDoLote = conteudo.capitulos.slice(inicioLote, fimLote)
    
    console.log(`Processando lote ${lote}: capítulos ${inicioLote + 1} a ${fimLote}`)

    // Verificar tempo restante
    const tempoDecorrido = Date.now() - startTime
    const tempoRestante = 85000 - tempoDecorrido
    console.log(`Tempo decorrido: ${tempoDecorrido}ms, restante para mídia: ${tempoRestante}ms`)

    const TTS_API_KEY = Deno.env.get('GER')
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY')
    
    if (tempoRestante > 20000 && TTS_API_KEY) {
      console.log('Gerando mídia para o lote...')
      
      // Se é lote 0, processar introdução também
      if (lote === 0 && !conteudo.introducao.url_imagem) {
        const [imagemIntroUrl, audioIntroUrl] = await Promise.all([
          withTimeout(
            processarImagem(supabase, titulo, conteudo.introducao.titulo, conteudo.introducao.texto, autor, GEMINI_KEYS[0], TINYPNG_API_KEY, livroId, 'intro'),
            MEDIA_TIMEOUT * 2,
            null
          ),
          withTimeout(
            gerarNarracao(supabase, conteudo.introducao.titulo, conteudo.introducao.texto, TTS_API_KEY, livroId, 'intro'),
            MEDIA_TIMEOUT * 2,
            null
          ).catch(() => null)
        ])
        
        conteudo.introducao.url_imagem = imagemIntroUrl
        conteudo.introducao.url_audio = audioIntroUrl
      }

      // Processar capítulos do lote
      for (let i = 0; i < capitulosDoLote.length; i++) {
        const cap = capitulosDoLote[i]
        const indexGlobal = inicioLote + i
        const tempoAtual = Date.now() - startTime
        
        if (tempoAtual > 75000) {
          console.log('Tempo limite atingido, parando geração de mídia')
          break
        }

        console.log(`Processando capítulo ${indexGlobal + 1}: ${cap.titulo}`)

        // Gerar mídia do capítulo principal
        const [imagemUrl, audioUrl] = await Promise.all([
          withTimeout(
            processarImagem(supabase, titulo, cap.titulo, cap.texto, autor, GEMINI_KEYS[0], TINYPNG_API_KEY, livroId, `cap${indexGlobal + 1}`),
            MEDIA_TIMEOUT * 2,
            null
          ),
          withTimeout(
            gerarNarracao(supabase, cap.titulo, cap.texto, TTS_API_KEY, livroId, `cap${indexGlobal + 1}`),
            MEDIA_TIMEOUT * 2,
            null
          ).catch(() => null)
        ])

        // Atualizar no array original
        conteudo.capitulos[indexGlobal].url_imagem = imagemUrl
        conteudo.capitulos[indexGlobal].url_audio = audioUrl

        // Gerar imagem do exemplo se existir e houver tempo
        const tempoAposCapitulo = Date.now() - startTime
        if (cap.exemplo?.descricao && tempoAposCapitulo < 70000) {
          console.log(`Gerando imagem do exemplo do capítulo ${indexGlobal + 1}...`)
          const imagemExemploUrl = await withTimeout(
            processarImagemExemplo(
              supabase, 
              titulo, 
              cap.titulo, 
              cap.exemplo.descricao,
              autor,
              GEMINI_KEYS[0], 
              TINYPNG_API_KEY, 
              livroId, 
              indexGlobal + 1
            ),
            MEDIA_TIMEOUT * 2,
            null
          )
          if (imagemExemploUrl) {
            conteudo.capitulos[indexGlobal].exemplo.url_imagem = imagemExemploUrl
          }
        }
      }
    }

    // Salvar no banco (incluindo conclusão)
    const resumoCapitulos = {
      introducao: conteudo.introducao,
      capitulos: conteudo.capitulos,
      conclusao: conteudo.conclusao || null
    }

    const capitulosGeradosTotal = Math.min(fimLote, conteudo.capitulos.length)
    const loteCompleto = fimLote >= conteudo.capitulos.length

    const { error: updateError } = await supabase
      .from(tabela)
      .update({
        resumo_capitulos: resumoCapitulos,
        questoes_resumo: conteudo.questoes,
        capitulos_gerados: capitulosGeradosTotal,
        total_capitulos: conteudo.capitulos.length,
        resumo_gerado_em: new Date().toISOString()
      })
      .eq('id', livroId)

    if (updateError) {
      console.error('Erro ao salvar:', updateError)
      throw updateError
    }

    const tempoTotal = Date.now() - startTime
    console.log(`Lote ${lote} concluído! Capítulos gerados: ${capitulosGeradosTotal}/${conteudo.capitulos.length}. Tempo: ${tempoTotal}ms`)

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      resumo_capitulos: resumoCapitulos,
      questoes_resumo: conteudo.questoes,
      capitulos_gerados: capitulosGeradosTotal,
      total_capitulos: conteudo.capitulos.length,
      lote_atual: lote,
      proximo_lote: loteCompleto ? null : lote + 1,
      loteCompleto,
      tempoProcessamento: tempoTotal
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Erro:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
