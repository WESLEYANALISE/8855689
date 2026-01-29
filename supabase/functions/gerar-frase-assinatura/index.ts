import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para converter PCM L16 para WAV
function createWavFromL16(pcmData: Uint8Array, mimeType: string = "audio/L16;codec=pcm;rate=24000"): Uint8Array {
  const rateMatch = mimeType.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
  
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length;
  const fileSize = 36 + dataSize;
  
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  // RIFF header
  view.setUint8(0, 'R'.charCodeAt(0));
  view.setUint8(1, 'I'.charCodeAt(0));
  view.setUint8(2, 'F'.charCodeAt(0));
  view.setUint8(3, 'F'.charCodeAt(0));
  view.setUint32(4, fileSize, true);
  view.setUint8(8, 'W'.charCodeAt(0));
  view.setUint8(9, 'A'.charCodeAt(0));
  view.setUint8(10, 'V'.charCodeAt(0));
  view.setUint8(11, 'E'.charCodeAt(0));
  
  // fmt chunk
  view.setUint8(12, 'f'.charCodeAt(0));
  view.setUint8(13, 'm'.charCodeAt(0));
  view.setUint8(14, 't'.charCodeAt(0));
  view.setUint8(15, ' '.charCodeAt(0));
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  
  // data chunk
  view.setUint8(36, 'd'.charCodeAt(0));
  view.setUint8(37, 'a'.charCodeAt(0));
  view.setUint8(38, 't'.charCodeAt(0));
  view.setUint8(39, 'a'.charCodeAt(0));
  view.setUint32(40, dataSize, true);
  
  const wavFile = new Uint8Array(44 + pcmData.length);
  wavFile.set(new Uint8Array(header), 0);
  wavFile.set(pcmData, 44);
  
  return wavFile;
}

// 10 frases de impacto para narração automática
const FRASES_IMPACTO = [
  "Seu futuro jurídico começa aqui.",
  "O conhecimento é a sua maior arma.",
  "Transforme seu potencial em resultado.",
  "Junte-se à elite do Direito.",
  "Cada artigo estudado é um passo para a vitória.",
  "O sucesso não espera. E você?",
  "Invista em você. O retorno é garantido.",
  "Sua aprovação está mais perto do que imagina.",
  "Construa hoje o advogado de amanhã.",
  "Excelência não é opção. É obrigação."
];

async function gerarAudioComGeminiFlash(texto: string): Promise<string | null> {
  // Chaves de API disponíveis para fallback
  const chavesDisponiveis = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
  ].filter(Boolean) as string[];

  if (chavesDisponiveis.length === 0) {
    console.error("Nenhuma chave GEMINI_KEY_X configurada");
    return null;
  }

  console.log(`Gerando áudio com Gemini 2.5 Flash para: "${texto}" (${chavesDisponiveis.length} chaves disponíveis)`);

  for (let i = 0; i < chavesDisponiveis.length; i++) {
    try {
      console.log(`Tentando chave ${i + 1}/${chavesDisponiveis.length}...`);
      
      // Usar Gemini 2.5 Flash com TTS nativo
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${chavesDisponiveis[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: texto }]
            }],
            generationConfig: {
              response_modalities: ["AUDIO"],
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: {
                    voice_name: "Aoede" // Voz feminina
                  }
                }
              }
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro Gemini Flash TTS chave ${i + 1}: ${response.status} - ${errorText}`);
        
        if (response.status === 429 && i < chavesDisponiveis.length - 1) {
          console.log("Rate limit, tentando próxima chave...");
          continue;
        }
        
        if (i === chavesDisponiveis.length - 1) {
          console.error("Todas as chaves falharam");
          return null;
        }
        continue;
      }

      const data = await response.json();
      
      // Extrair áudio da resposta do Gemini
      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/L16;codec=pcm;rate=24000";
      
      if (audioData) {
        console.log(`Sucesso com chave ${i + 1} - Gemini 2.5 Flash TTS (${mimeType})`);
        
        // Converter PCM L16 para WAV
        try {
          const binaryString = atob(audioData);
          const pcmBytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            pcmBytes[j] = binaryString.charCodeAt(j);
          }
          
          const wavBytes = createWavFromL16(pcmBytes, mimeType);
          
          // Converter para base64 em chunks para evitar stack overflow
          const chunkSize = 32768;
          let wavBase64 = '';
          for (let offset = 0; offset < wavBytes.length; offset += chunkSize) {
            const chunk = wavBytes.subarray(offset, Math.min(offset + chunkSize, wavBytes.length));
            wavBase64 += String.fromCharCode(...chunk);
          }
          wavBase64 = btoa(wavBase64);
          
          console.log(`Conversão PCM→WAV concluída (${pcmBytes.length} → ${wavBytes.length} bytes)`);
          return wavBase64;
        } catch (convErr) {
          console.error(`Erro na conversão PCM→WAV:`, convErr);
          return audioData; // Retorna original se falhar
        }
      }
      
      console.error(`Resposta sem áudio na chave ${i + 1}`);
      continue;
      
    } catch (error) {
      console.error(`Erro na chave ${i + 1}:`, error);
      if (i === chavesDisponiveis.length - 1) {
        return null;
      }
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se foi enviada uma frase específica
    let frase: string;
    try {
      const body = await req.json();
      frase = body.frase || FRASES_IMPACTO[Math.floor(Math.random() * FRASES_IMPACTO.length)];
    } catch {
      frase = FRASES_IMPACTO[Math.floor(Math.random() * FRASES_IMPACTO.length)];
    }

    console.log(`Frase selecionada: "${frase}"`);

    // Gerar áudio com Gemini 2.5 Flash TTS (fallback entre chaves)
    const audioBase64 = await gerarAudioComGeminiFlash(frase);

    if (!audioBase64) {
      console.warn("Não foi possível gerar áudio, retornando apenas a frase");
      return new Response(
        JSON.stringify({ frase, audioBase64: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ frase, audioBase64 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
