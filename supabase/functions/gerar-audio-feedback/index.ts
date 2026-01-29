import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Textos fixos para feedback de voz
const FEEDBACKS = {
  correta: "Parabéns, você acertou!",
  incorreta: "Ops, você errou."
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { tipo, texto: textoCustom, voz } = await req.json()

    if (!tipo) {
      throw new Error('Tipo é obrigatório')
    }

    // Determinar o texto a ser usado
    let textoFinal: string
    if (textoCustom) {
      // Texto customizado passado diretamente
      textoFinal = textoCustom
    } else if (['correta', 'incorreta'].includes(tipo)) {
      // Tipos padrão de feedback
      textoFinal = FEEDBACKS[tipo as keyof typeof FEEDBACKS]
    } else {
      throw new Error('Para tipos customizados, o parâmetro "texto" é obrigatório')
    }

    // Chaves de API disponíveis para fallback (apenas GEMINI_KEY_1, 2, 3)
    const chavesDisponiveis = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
    ].filter(Boolean) as string[];

    if (chavesDisponiveis.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY_X configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar cache na tabela AUDIO_FEEDBACK_CACHE
    const { data: cached } = await supabase
      .from('AUDIO_FEEDBACK_CACHE')
      .select('url_audio')
      .eq('tipo', tipo)
      .single()

    if (cached?.url_audio) {
      console.log(`[gerar-audio-feedback] Cache encontrado para: ${tipo}`)
      return new Response(
        JSON.stringify({ url_audio: cached.url_audio, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[gerar-audio-feedback] Gerando áudio para: ${tipo} (${chavesDisponiveis.length} chaves disponíveis)`)

    // Determinar a voz (padrão: Aoede)
    const voiceMap: Record<string, string> = {
      'Aoede': 'pt-BR-Chirp3-HD-Aoede',
      'Charon': 'pt-BR-Chirp3-HD-Charon',
      'Kore': 'pt-BR-Chirp3-HD-Kore',
      'Fenrir': 'pt-BR-Chirp3-HD-Fenrir',
      'Puck': 'pt-BR-Chirp3-HD-Puck',
    }
    const voiceName = voiceMap[voz] || 'pt-BR-Chirp3-HD-Aoede'
    
    const requestBody = {
      input: { text: textoFinal },
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
    };

    let ttsData: any = null;

    for (let i = 0; i < chavesDisponiveis.length; i++) {
      try {
        console.log(`[gerar-audio-feedback] Tentando chave ${i + 1}/${chavesDisponiveis.length}...`);
        
        const ttsResponse = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${chavesDisponiveis[i]}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          }
        );

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          console.error(`[gerar-audio-feedback] Erro TTS chave ${i + 1}: ${ttsResponse.status}`);
          
          if (ttsResponse.status === 429 && i < chavesDisponiveis.length - 1) {
            console.log(`[gerar-audio-feedback] Rate limit, tentando próxima chave...`);
            continue;
          }
          
          if (i === chavesDisponiveis.length - 1) {
            throw new Error(`Google TTS erro: ${ttsResponse.status} - ${errorText}`);
          }
          continue;
        }

        ttsData = await ttsResponse.json();
        console.log(`[gerar-audio-feedback] Sucesso com chave ${i + 1}`);
        break;
      } catch (error: any) {
        if (i === chavesDisponiveis.length - 1) {
          throw error;
        }
      }
    }

    if (!ttsData) {
      throw new Error('Falha em todas as chaves de API TTS');
    }
    const audioBase64 = ttsData.audioContent

    // Converter base64 para binário
    const binaryString = atob(audioBase64)
    const uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }

    // Upload para Supabase Storage (v3 = voz feminina com novas mensagens)
    const filePath = `feedback/${tipo}_v3.mp3`
    const audioUrl = await uploadParaSupabase(supabase, uint8Array, 'audios', filePath, 'audio/mpeg')

    console.log(`[gerar-audio-feedback] Áudio gerado: ${audioUrl}`)

    // Salvar no cache
    await supabase
      .from('AUDIO_FEEDBACK_CACHE')
      .upsert({ tipo, url_audio: audioUrl }, { onConflict: 'tipo' })

    return new Response(
      JSON.stringify({ url_audio: audioUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-audio-feedback] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar áudio de feedback', details: error?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
