import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Chaves Gemini (mesma rotação do Vade Mecum)
const API_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
  Deno.env.get("DIREITO_PREMIUM_API_KEY"),
].filter(Boolean) as string[];

const VOICE_NAME = "Kore"; // Mesma voz do Vade Mecum

// Gerar áudio com Gemini TTS
async function gerarAudioTTS(texto: string): Promise<Uint8Array> {
  for (const apiKey of API_KEYS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: texto }] }],
            generationConfig: {
              response_modalities: ["AUDIO"],
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: { voice_name: VOICE_NAME },
                },
              },
            },
          }),
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Gemini TTS erro ${response.status}`);
        continue;
      }

      const data = await response.json();
      const audioBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (audioBase64) {
        const binaryString = atob(audioBase64);
        const pcmBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          pcmBytes[i] = binaryString.charCodeAt(i);
        }
        return pcmBytes;
      }
    } catch (error) {
      console.error(`Erro TTS:`, error);
    }
  }
  throw new Error("Todas as chaves Gemini falharam");
}

// PCM to WAV
function pcmToWav(pcmData: Uint8Array, sampleRate = 24000): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const wavSize = 44 + dataSize;

  const buffer = new ArrayBuffer(wavSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, wavSize - 8, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmData, 44);
  return wavBytes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slideIndex, forceRegenerate } = await req.json();

    if (slideIndex === undefined || slideIndex < 0 || slideIndex > 5) {
      throw new Error("slideIndex inválido (0-5)");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if already cached
    const { data: existing } = await supabase
      .from("intro_carousel_narrations")
      .select("audio_url, texto_narracao")
      .eq("slide_index", slideIndex)
      .single();

    if (existing?.audio_url && !forceRegenerate) {
      console.log(`Slide ${slideIndex}: retornando áudio cacheado`);
      return new Response(
        JSON.stringify({ audio_url: existing.audio_url, fromCache: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!existing?.texto_narracao) {
      throw new Error(`Slide ${slideIndex}: sem texto de narração configurado`);
    }

    console.log(`Slide ${slideIndex}: gerando narração TTS...`);
    const pcmBytes = await gerarAudioTTS(existing.texto_narracao);
    const wavBytes = pcmToWav(pcmBytes);

    // Upload to storage
    const fileName = `slide-${slideIndex}.wav`;
    const { error: uploadError } = await supabase.storage
      .from("intro-carousel-audio")
      .upload(fileName, wavBytes, {
        contentType: "audio/wav",
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);

    const { data: urlData } = supabase.storage
      .from("intro-carousel-audio")
      .getPublicUrl(fileName);

    const audioUrl = urlData.publicUrl;

    // Cache the URL
    await supabase
      .from("intro_carousel_narrations")
      .update({ audio_url: audioUrl, updated_at: new Date().toISOString() })
      .eq("slide_index", slideIndex);

    console.log(`Slide ${slideIndex}: ✅ narração gerada e cacheada`);

    return new Response(
      JSON.stringify({ audio_url: audioUrl, fromCache: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[gerar-narracao-intro] Erro:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
