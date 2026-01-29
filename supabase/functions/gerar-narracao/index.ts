import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sanitizar string para uso em path de storage (remove acentos e caracteres especiais)
function sanitizarPathStorage(texto: string): string {
  return texto
    // Normaliza e remove acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove caracteres especiais exceto underscore e hífen
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    // Remove underscores múltiplos
    .replace(/_+/g, '_')
    // Remove underscore do início e fim
    .replace(/^_|_$/g, '')
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

// Remove APENAS parênteses no FINAL do texto (referências legislativas)
// Mantém parênteses no meio do texto para serem narrados
function removerParentesesFinais(texto: string): string {
  return texto
    // Remove parênteses contendo termos de referência legislativa no final de linhas
    .replace(/\s*\((?:[^)]*(?:Redação|Incluído|Revogado|Alterado|Acrescentado|Suprimido|Vide|NR|Lei\s*n[ºo°]|EC\s*n[ºo°]|Decreto|Emenda)[^)]*)\)\s*(?=\n|$|\.(?:\s|$))/gi, '')
    // Remove parênteses longos (>50 chars) no final absoluto do texto (provavelmente referências)
    .replace(/\s*\([^)]{50,}\)\s*$/g, '')
    // Remove "(Revogado)" ou similares sozinhos no final
    .replace(/\s*\((Revogado|Vetado|Suprimido)\)\s*$/gi, '');
}

// Normalizar texto para TTS - expande abreviações jurídicas
function normalizarTextoParaTTS(texto: string): string {
  let t = removerParentesesFinais(texto)
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/>\s?/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[-*+]\s/g, '. ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')

  // Expandir abreviações e corrigir pronúncias
  const abreviacoes: [RegExp, string][] = [
    // Pronúncias corretas de nomes próprios
    [/\bMontesquieu\b/gi, 'Montesquiê'],
    // Abreviações jurídicas
    [/\bArt\.\s*/gi, 'Artigo '],
    [/§\s*(\d+)/g, 'parágrafo $1'],
    [/§§\s*/g, 'parágrafos '],
    [/§\s*único/gi, 'parágrafo único'],
    [/\bCF\/88\b/gi, 'Constituição Federal de 1988'],
    [/\bCF\b/g, 'Constituição Federal'],
    [/\bCC\b/g, 'Código Civil'],
    [/\bCP\b/g, 'Código Penal'],
    [/\bCPC\b/g, 'Código de Processo Civil'],
    [/\bCPP\b/g, 'Código de Processo Penal'],
    [/\bCLT\b/g, 'Consolidação das Leis do Trabalho'],
    [/\bCTN\b/g, 'Código Tributário Nacional'],
    [/\bCDC\b/g, 'Código de Defesa do Consumidor'],
    [/\bSTF\b/g, 'Supremo Tribunal Federal'],
    [/\bSTJ\b/g, 'Superior Tribunal de Justiça'],
    [/\bTST\b/g, 'Tribunal Superior do Trabalho'],
    [/\bMP\b/g, 'Ministério Público'],
    [/\bOAB\b/g, 'Ordem dos Advogados do Brasil'],
  ]

  for (const [regex, sub] of abreviacoes) {
    t = t.replace(regex, sub)
  }

  return t.trim()
}

// Dividir texto em chunks (4000 chars - limite do Google TTS)
function dividirTextoEmChunks(texto: string, maxChars: number = 4000): string[] {
  const chunks: string[] = []
  let restante = texto

  while (restante.length > 0) {
    if (restante.length <= maxChars) {
      chunks.push(restante)
      break
    }

    let corte = maxChars
    const ultimoPonto = restante.lastIndexOf('. ', maxChars)
    if (ultimoPonto > maxChars * 0.5) {
      corte = ultimoPonto + 2
    }

    chunks.push(restante.substring(0, corte).trim())
    restante = restante.substring(corte).trim()
  }

  return chunks.filter(c => c.length > 0)
}

// Gerar áudio com Google Cloud TTS (com fallback de chaves)
async function gerarAudioGoogleTTS(texto: string, chavesDisponiveis: string[]): Promise<Uint8Array> {
  for (let i = 0; i < chavesDisponiveis.length; i++) {
    try {
      console.log(`[gerar-narracao] Tentando GEMINI_KEY_${i + 1}...`);
      
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${chavesDisponiveis[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: texto },
          voice: {
              languageCode: 'pt-BR',
              name: 'pt-BR-Chirp3-HD-Aoede'
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: 1.0,
              pitch: 0
            }
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[gerar-narracao] Erro TTS com GEMINI_KEY_${i + 1}: ${response.status}`)
        
        // Se for rate limit ou quota, tentar próxima chave
        if ((response.status === 429 || errorText.includes('quota')) && i < chavesDisponiveis.length - 1) {
          console.log(`[gerar-narracao] Rate limit na GEMINI_KEY_${i + 1}, tentando próxima...`);
          continue;
        }
        
        if (i === chavesDisponiveis.length - 1) {
          throw new Error(`Todas as ${chavesDisponiveis.length} chaves falharam: ${response.status}`)
        }
        continue;
      }

      const data = await response.json()
      const audioContent = data.audioContent

      if (!audioContent) {
        throw new Error('Google TTS não retornou áudio')
      }

      console.log(`[gerar-narracao] ✅ Sucesso com GEMINI_KEY_${i + 1}`);

      // Converter base64 para bytes
      const binaryString = atob(audioContent)
      const bytes = new Uint8Array(binaryString.length)
      for (let j = 0; j < binaryString.length; j++) {
        bytes[j] = binaryString.charCodeAt(j)
      }

      return bytes
    } catch (error: any) {
      if (i === chavesDisponiveis.length - 1) {
        throw error
      }
    }
  }
  
  throw new Error('Nenhuma chave disponível')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { texto, categoria, ordem } = await req.json()

    if (!texto) {
      throw new Error('texto é obrigatório')
    }

    console.log(`[gerar-narracao] Texto: ${texto.length} chars, cat: ${categoria}, ordem: ${ordem}`)

    // Chaves de API disponíveis para fallback (3 chaves Gemini)
    const chavesDisponiveis = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
    ].filter(Boolean) as string[];

    if (chavesDisponiveis.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY_X configurada')
    }
    
    console.log(`[gerar-narracao] ${chavesDisponiveis.length} chaves GEMINI disponíveis`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Normalizar texto
    const textoNormalizado = normalizarTextoParaTTS(texto)
    const chunks = dividirTextoEmChunks(textoNormalizado, 4000)
    console.log(`[gerar-narracao] ${chunks.length} chunks criados`)

    const audioUrls: string[] = []

    // Processar um chunk por vez
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[gerar-narracao] Gerando ${i + 1}/${chunks.length}...`)

      // Gerar MP3 com Google TTS (com fallback de chaves)
      const audioBytes = await gerarAudioGoogleTTS(chunks[i], chavesDisponiveis)
      console.log(`[gerar-narracao] Áudio ${i + 1} gerado: ${audioBytes.length} bytes`)

      // Upload para Supabase Storage (sanitizar categoria para evitar caracteres especiais)
      const timestamp = Date.now()
      const categoriaSanitizada = sanitizarPathStorage(categoria || 'geral')
      const path = `narracao/${categoriaSanitizada}_${ordem}_p${i + 1}_${timestamp}.mp3`
      const url = await uploadParaSupabase(supabase, audioBytes, 'audios', path, 'audio/mpeg')
      audioUrls.push(url)

      console.log(`[gerar-narracao] ${i + 1}/${chunks.length} OK: ${url}`)
    }

    // Salvar no banco
    if (audioUrls.length > 0 && categoria && ordem !== undefined) {
      const urlParaSalvar = audioUrls.length > 1 ? JSON.stringify(audioUrls) : audioUrls[0]

      const { error } = await supabase
        .from('BLOGGER_JURIDICO')
        .update({ url_audio: urlParaSalvar })
        .eq('categoria', categoria)
        .eq('ordem', ordem)

      if (error) {
        console.error(`[gerar-narracao] Erro DB:`, error.message)
      } else {
        console.log(`[gerar-narracao] Salvo no banco: ${categoria}/${ordem}`)
      }
    }

    return new Response(
      JSON.stringify({ audioUrls, totalPartes: audioUrls.length, audioUrl: audioUrls[0], url_audio: audioUrls[0] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-narracao] ERRO:', error?.message)
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
