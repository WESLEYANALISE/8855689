import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

// Converter PCM para WAV
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;
  
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, fileSize - 8, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  
  // fmt chunk
  view.setUint32(12, 0x666D7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  
  // data chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true);
  
  new Uint8Array(buffer, headerSize).set(pcmData);
  
  return new Uint8Array(buffer);
}

// Dividir texto em partes menores
function dividirTexto(texto: string, maxChars: number = 2500): string[] {
  const partes: string[] = [];
  let textoRestante = texto;
  
  while (textoRestante.length > 0) {
    if (textoRestante.length <= maxChars) {
      partes.push(textoRestante);
      break;
    }
    
    // Encontrar ponto de quebra natural (final de frase)
    let pontoCorte = maxChars;
    const ultimoPonto = textoRestante.lastIndexOf('.', maxChars);
    const ultimaExclamacao = textoRestante.lastIndexOf('!', maxChars);
    const ultimaInterrogacao = textoRestante.lastIndexOf('?', maxChars);
    
    const melhorPonto = Math.max(ultimoPonto, ultimaExclamacao, ultimaInterrogacao);
    if (melhorPonto > maxChars * 0.5) {
      pontoCorte = melhorPonto + 1;
    }
    
    partes.push(textoRestante.substring(0, pontoCorte).trim());
    textoRestante = textoRestante.substring(pontoCorte).trim();
  }
  
  return partes;
}

// Gerar áudio com Gemini TTS para uma parte
async function gerarAudioParte(texto: string): Promise<Uint8Array> {
  // Tentar cada chave com delay entre tentativas
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      console.log(`Tentando key ${i + 1} para gerar áudio...`);
      
      // Delay antes de tentar (exceto primeira)
      if (i > 0) {
        await new Promise(r => setTimeout(r, 3000));
      }
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_KEYS[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: texto }]
            }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Kore"
                  }
                }
              }
            }
          })
        }
      );

      if (response.status === 429) {
        console.log(`Key ${i + 1} rate limited, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro key ${i + 1} (${response.status}):`, errorText);
        continue;
      }

      const data = await response.json();
      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (audioData) {
        console.log(`Áudio gerado com sucesso usando key ${i + 1}`);
        const pcmBytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
        return pcmBytes;
      }
    } catch (error) {
      console.error(`Erro key ${i + 1}:`, error);
    }
  }

  throw new Error('Falha ao gerar áudio - todas as chaves falharam. Tente novamente em alguns minutos.');
}

// Combinar múltiplos arrays de PCM em um só
function combinarPCM(partes: Uint8Array[]): Uint8Array {
  const totalLength = partes.reduce((acc, part) => acc + part.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const parte of partes) {
    combined.set(parte, offset);
    offset += parte.length;
  }
  
  return combined;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ordem } = await req.json();

    if (!ordem) {
      return new Response(
        JSON.stringify({ error: 'Ordem é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar artigo
    const { data: artigo, error: fetchError } = await supabase
      .from('oab_carreira_blog')
      .select('*')
      .eq('ordem', ordem)
      .single();

    if (fetchError || !artigo) {
      return new Response(
        JSON.stringify({ error: 'Artigo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar cache
    if (artigo.url_audio) {
      return new Response(
        JSON.stringify({ url_audio: artigo.url_audio, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!artigo.conteudo_gerado) {
      return new Response(
        JSON.stringify({ error: 'Artigo ainda não foi gerado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Gerando narração para: ${artigo.titulo}`);

    // Preparar texto para narração - limitar tamanho total
    let textoCompleto = `${artigo.titulo}. ${artigo.conteudo_gerado}`;
    
    // Limitar a 10000 caracteres para evitar problemas
    if (textoCompleto.length > 10000) {
      textoCompleto = textoCompleto.substring(0, 10000) + '...';
    }
    
    // Dividir texto em partes menores
    const partes = dividirTexto(textoCompleto, 2500);
    console.log(`Texto dividido em ${partes.length} parte(s)`);

    // Gerar áudio para cada parte
    const audioPartes: Uint8Array[] = [];

    for (let i = 0; i < partes.length; i++) {
      console.log(`Gerando parte ${i + 1}/${partes.length}...`);
      
      // Delay maior entre partes para evitar rate limit
      if (i > 0) {
        console.log(`Aguardando 5s antes da próxima parte...`);
        await new Promise(r => setTimeout(r, 5000));
      }
      
      const audioData = await gerarAudioParte(partes[i]);
      audioPartes.push(audioData);
    }

    // Combinar todas as partes em um único PCM e converter para WAV
    const pcmCombinado = combinarPCM(audioPartes);
    const audioWav = pcmToWav(pcmCombinado);

    console.log(`Áudio final: ${audioWav.length} bytes`);

    // Upload para Storage
    const fileName = `carreira-oab/narracao-${ordem}-${Date.now()}.wav`;
    
    const { error: uploadError } = await supabase.storage
      .from('gerador-imagens')
      .upload(fileName, audioWav, {
        contentType: 'audio/wav',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('gerador-imagens')
      .getPublicUrl(fileName);

    const audioUrl = urlData.publicUrl;

    // Salvar URL no banco
    await supabase
      .from('oab_carreira_blog')
      .update({ url_audio: audioUrl })
      .eq('ordem', ordem);

    console.log(`Narração salva: ${audioUrl}`);

    return new Response(
      JSON.stringify({ url_audio: audioUrl, fromCache: false, partes: partes.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
