import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de tipo para coluna no banco - FLASHCARDS_GERADOS
const TIPO_TO_COLUNA_GERADOS: Record<string, string> = {
  'pergunta': 'url_audio_pergunta',
  'resposta': 'url_audio_resposta',
  'exemplo': 'url_audio_exemplo',
}

// Mapeamento de tipo para coluna no banco - FLASHCARDS - ARTIGOS LEI
const TIPO_TO_COLUNA_ARTIGOS: Record<string, string> = {
  'pergunta': 'audio-pergunta',
  'resposta': 'audio-resposta',
  'exemplo': 'url_audio_exemplo',
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

// Normalização de texto para narração
function normalizarTexto(texto: string): string {
  // Remover apenas parênteses no final (referências legislativas), manter os do meio
  let resultado = removerParentesesFinais(texto);
  
  // Remover markdown
  resultado = resultado
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  // Substituir abreviações comuns
  const abreviacoes: Record<string, string> = {
    'art.': 'artigo',
    'Art.': 'Artigo',
    'arts.': 'artigos',
    'Arts.': 'Artigos',
    'inc.': 'inciso',
    'par.': 'parágrafo',
    'nº': 'número',
    'Dr.': 'Doutor',
    'Dra.': 'Doutora',
    'Sr.': 'Senhor',
    'Sra.': 'Senhora',
  };

  for (const [abrev, extenso] of Object.entries(abreviacoes)) {
    resultado = resultado.replace(new RegExp(abrev.replace('.', '\\.'), 'g'), extenso);
  }

  return resultado;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { flashcard_id, tipo, texto, tabela } = await req.json()

    if (!flashcard_id || !tipo || !texto) {
      throw new Error('flashcard_id, tipo e texto são obrigatórios')
    }

    // Determinar qual tabela usar (padrão: FLASHCARDS_GERADOS)
    const isArtigosLei = tabela === 'artigos-lei'
    const tabelaDestino = isArtigosLei ? 'FLASHCARDS - ARTIGOS LEI' : 'FLASHCARDS_GERADOS'
    
    // Usar o mapeamento correto de colunas conforme a tabela
    const colunaMap = isArtigosLei ? TIPO_TO_COLUNA_ARTIGOS : TIPO_TO_COLUNA_GERADOS
    const coluna = colunaMap[tipo]
    
    if (!coluna) {
      throw new Error(`Tipo inválido: ${tipo}. Use: pergunta, resposta, exemplo`)
    }
    
    console.log(`[gerar-audio-flashcard] Gerando áudio ${tipo} para flashcard ${flashcard_id} na tabela ${tabelaDestino} (coluna: ${coluna})`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar se já existe áudio
    const { data: flashcard } = await supabase
      .from(tabelaDestino)
      .select(coluna)
      .eq('id', flashcard_id)
      .single()

    if (flashcard && (flashcard as any)[coluna]) {
      console.log(`[gerar-audio-flashcard] Áudio já existe, retornando cache`)
      return new Response(
        JSON.stringify({ url_audio: (flashcard as any)[coluna], cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalizar texto para narração
    let textoNormalizado = normalizarTexto(texto)
    
    // Para exemplo prático, adicionar prefixo "Exemplo prático:"
    if (tipo === 'exemplo') {
      textoNormalizado = `Exemplo prático: ${textoNormalizado}`
    }
    
    const textoLimitado = textoNormalizado.substring(0, 4900)

    console.log(`[gerar-audio-flashcard] Texto normalizado: ${textoLimitado.substring(0, 100)}...`)

    // Chaves de API disponíveis para fallback (3 chaves Gemini)
    const chavesDisponiveis = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
    ].filter(Boolean) as string[];
    
    if (chavesDisponiveis.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY_X configurada')
    }

    // Duas vozes femininas do mesmo modelo Chirp3-HD para diferenciar pergunta de resposta
    const voiceName = tipo === 'pergunta' ? 'pt-BR-Chirp3-HD-Aoede' : 'pt-BR-Chirp3-HD-Charon';
    
    console.log(`[gerar-audio-flashcard] Usando voz: ${voiceName} (FEMALE)`);

    // Função para tentar gerar áudio com uma chave específica
    async function tentarGerarAudio(apiKey: string, keyIndex: number): Promise<any> {
      console.log(`[gerar-audio-flashcard] Tentando GEMINI_KEY_${keyIndex + 1}...`);
      
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: textoLimitado },
            voice: {
              languageCode: 'pt-BR',
              name: voiceName,
              ssmlGender: 'FEMALE'
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: 1.0,
              pitch: 0
            }
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[gerar-audio-flashcard] Erro TTS com GEMINI_KEY_${keyIndex + 1}: ${response.status}`);
        throw { status: response.status, message: errorText };
      }
      
      return response.json();
    }

    // Tentar com cada chave até uma funcionar
    let ttsData: any = null;
    let lastError: any = null;
    
    for (let i = 0; i < chavesDisponiveis.length; i++) {
      try {
        ttsData = await tentarGerarAudio(chavesDisponiveis[i], i);
        console.log(`[gerar-audio-flashcard] ✅ Sucesso com GEMINI_KEY_${i + 1}`);
        break;
      } catch (error: any) {
        lastError = error;
        // Se for erro 429 (rate limit) ou quota e ainda há chaves, continuar
        if ((error.status === 429 || (error.message && error.message.includes('quota'))) && i < chavesDisponiveis.length - 1) {
          console.log(`[gerar-audio-flashcard] Rate limit na GEMINI_KEY_${i + 1}, tentando próxima...`);
          continue;
        }
        // Se for último erro ou erro diferente de 429, lançar
        if (i === chavesDisponiveis.length - 1) {
          throw new Error(`Todas as ${chavesDisponiveis.length} chaves falharam: ${error.message || error.status}`);
        }
      }
    }

    if (!ttsData) {
      throw new Error(`Falha em todas as ${chavesDisponiveis.length} chaves de API`);
    }
    const audioBase64 = ttsData.audioContent

    if (!audioBase64) {
      throw new Error('Nenhum áudio gerado')
    }

    // Converter base64 para bytes
    const binaryString = atob(audioBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    console.log(`[gerar-audio-flashcard] Áudio gerado, tamanho: ${bytes.length} bytes`)

    // Upload para Supabase Storage
    const prefixo = tabela === 'artigos-lei' ? 'flashcards-lei' : 'flashcards'
    const path = `${prefixo}/${flashcard_id}_${tipo}_${Date.now()}.mp3`
    const audioUrl = await uploadParaSupabase(supabase, bytes, 'audios', path, 'audio/mpeg')

    console.log(`[gerar-audio-flashcard] Upload concluído: ${audioUrl}`)

    // Salvar URL no banco
    const { error: updateError } = await supabase
      .from(tabelaDestino)
      .update({ [coluna]: audioUrl })
      .eq('id', flashcard_id)

    if (updateError) {
      console.error(`[gerar-audio-flashcard] Erro ao salvar URL:`, updateError)
    } else {
      console.log(`[gerar-audio-flashcard] URL salva na coluna ${coluna}`)
    }

    return new Response(
      JSON.stringify({ url_audio: audioUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-audio-flashcard] Erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})