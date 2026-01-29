import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chaves Gemini para fallback (incluindo DIREITO_PREMIUM_API_KEY como backup extra)
const API_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
  Deno.env.get("DIREITO_PREMIUM_API_KEY"),
].filter(Boolean) as string[];

// Vozes: Kore (feminina) para técnico, Orus (masculina) para descomplicado
const VOICE_MAP = {
  tecnico: "Kore",      // Voz feminina
  descomplicado: "Orus" // Voz masculina
};

// Normalizar texto para TTS
function normalizarTextoParaTTS(texto: string): string {
  let resultado = texto
    // Remove markdown
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[-*+]\s/g, "")
    .replace(/\d+\.\s/g, "")
    // Expande abreviações jurídicas
    .replace(/\bart\.\s?(\d+)/gi, "artigo $1")
    .replace(/\barts\.\s?/gi, "artigos ")
    .replace(/\b§\s?(\d+)/g, "parágrafo $1")
    .replace(/\b§§\s?/g, "parágrafos ")
    .replace(/\binc\.\s?/gi, "inciso ")
    .replace(/\bal\.\s?/gi, "alínea ")
    .replace(/\bCF\b/g, "Constituição Federal")
    .replace(/\bCC\b/g, "Código Civil")
    .replace(/\bCP\b/g, "Código Penal")
    .replace(/\bCPC\b/g, "Código de Processo Civil")
    .replace(/\bCPP\b/g, "Código de Processo Penal")
    .replace(/\bCLT\b/g, "Consolidação das Leis do Trabalho")
    .replace(/\bCTN\b/g, "Código Tributário Nacional")
    .replace(/\bCDC\b/g, "Código de Defesa do Consumidor")
    .replace(/\bLINDB\b/g, "Lei de Introdução às Normas do Direito Brasileiro")
    .replace(/\bSTF\b/g, "Supremo Tribunal Federal")
    .replace(/\bSTJ\b/g, "Superior Tribunal de Justiça")
    .replace(/\bTST\b/g, "Tribunal Superior do Trabalho")
    .replace(/\bOAB\b/g, "Ordem dos Advogados do Brasil")
    .replace(/\bPEC\b/g, "Proposta de Emenda Constitucional")
    .replace(/\bDOU\b/g, "Diário Oficial da União")
    // Remove caracteres especiais
    .replace(/[<>{}|\\^~[\]]/g, "")
    .trim();

  return resultado;
}

// Limite de caracteres por chamada TTS
const LIMITE_CHARS_POR_PARTE = 600;
// Limite total de texto - removido limite para narrar conteúdo completo
const LIMITE_TEXTO_TOTAL = 15000; // Aumentado para permitir narrações completas

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Gerar áudio de um segmento com Gemini TTS
async function gerarAudioSegmento(texto: string, voiceName: string, chavesDisponiveis: string[]): Promise<Uint8Array> {
  for (let keyIdx = 0; keyIdx < chavesDisponiveis.length; keyIdx++) {
    const apiKey = chavesDisponiveis[keyIdx];
    try {
      console.log(`Tentando chave ${keyIdx + 1}/${chavesDisponiveis.length} para ${texto.length} chars`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 min timeout por segmento
      
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
                  prebuilt_voice_config: { voice_name: voiceName },
                },
              },
            },
          }),
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini TTS erro ${response.status}: ${errorText.substring(0, 200)}`);
        
        // Se quota excedida (429), aguardar antes de tentar próxima chave
        if (response.status === 429) {
          console.log(`⚠️ Quota excedida na chave ${keyIdx + 1}, aguardando 2s antes de tentar próxima...`);
          await delay(2000);
        }
        continue;
      }

      const data = await response.json();
      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (audioData) {
        console.log(`✅ Segmento gerado (${audioData.length} chars base64)`);
        const binaryString = atob(audioData);
        const pcmBytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          pcmBytes[j] = binaryString.charCodeAt(j);
        }
        return pcmBytes;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Erro com chave ${keyIdx + 1}: ${errorMsg}`);
      if (errorMsg.includes('abort')) {
        // Se timeout, aguardar um pouco antes de tentar próxima
        await delay(1000);
        continue;
      }
    }
  }
  throw new Error(`Todas as chaves falharam para o segmento - quotas podem estar esgotadas`);
}

// Dividir texto em múltiplas partes no ponto mais natural (fim de frase)
function dividirTexto(texto: string, limite: number): string[] {
  if (texto.length <= limite) {
    return [texto];
  }
  
  const partes: string[] = [];
  let textoRestante = texto;
  
  while (textoRestante.length > 0) {
    if (textoRestante.length <= limite) {
      partes.push(textoRestante.trim());
      break;
    }
    
    // Procurar fim de frase próximo ao limite
    let pontoCorte = limite;
    const fimFrase = /[.!?]\s/g;
    let match;
    let melhorCorte = -1;
    
    while ((match = fimFrase.exec(textoRestante)) !== null) {
      if (match.index + 1 <= limite && match.index + 1 > melhorCorte) {
        melhorCorte = match.index + 1;
      }
    }
    
    // Se encontrou fim de frase antes do limite, usa ele
    if (melhorCorte > limite * 0.5) {
      pontoCorte = melhorCorte;
    }
    
    const parte = textoRestante.substring(0, pontoCorte).trim();
    partes.push(parte);
    textoRestante = textoRestante.substring(pontoCorte).trim();
    
    console.log(`Parte ${partes.length} extraída: ${parte.length} chars`);
  }
  
  console.log(`Texto dividido em ${partes.length} partes`);
  return partes;
}

// Concatenar arrays PCM
function concatenarPCM(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Gerar áudio COMPLETO (divide em partes se necessário)
async function gerarAudioGeminiTTS(texto: string, voiceName: string, chavesDisponiveis: string[]): Promise<Uint8Array> {
  console.log(`Texto total: ${texto.length} caracteres`);
  
  // Se texto cabe em uma chamada, gera direto
  if (texto.length <= LIMITE_CHARS_POR_PARTE) {
    console.log(`Gerando áudio em uma única chamada`);
    return await gerarAudioSegmento(texto, voiceName, chavesDisponiveis);
  }
  
  // Dividir em partes e gerar cada uma
  const partes = dividirTexto(texto, LIMITE_CHARS_POR_PARTE);
  console.log(`Texto dividido em ${partes.length} partes`);
  
  const audioPartes: Uint8Array[] = [];
  
  for (let i = 0; i < partes.length; i++) {
    // Delay entre partes para evitar rate limiting
    if (i > 0) {
      console.log(`Aguardando 1.5s antes da parte ${i + 1}...`);
      await delay(1500);
    }
    
    console.log(`Gerando parte ${i + 1}/${partes.length} (${partes[i].length} chars)...`);
    const audioParte = await gerarAudioSegmento(partes[i], voiceName, chavesDisponiveis);
    audioPartes.push(audioParte);
    console.log(`Parte ${i + 1} gerada: ${audioParte.length} bytes PCM`);
  }
  
  // Concatenar todas as partes
  const audioCompleto = concatenarPCM(audioPartes);
  console.log(`Áudio completo concatenado: ${audioCompleto.length} bytes PCM`);
  
  return audioCompleto;
}

// Converter PCM L16 24kHz mono para WAV
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const wavSize = 44 + dataSize;

  const buffer = new ArrayBuffer(wavSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, wavSize - 8, true);
  writeString(view, 8, "WAVE");

  // fmt subchunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data subchunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // PCM data
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmData, 44);

  return wavBytes;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Upload para Supabase Storage
async function uploadParaSupabase(
  supabase: any,
  bytes: Uint8Array,
  bucket: string,
  path: string,
  contentType: string
): Promise<string> {
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto, ordem, modo = "tecnico" } = await req.json();

    if (!texto || !ordem) {
      return new Response(
        JSON.stringify({ error: "Parâmetros 'texto' e 'ordem' são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Selecionar voz baseada no modo
    const voiceName = VOICE_MAP[modo as keyof typeof VOICE_MAP] || "Kore";
    console.log(`Gerando narração ${modo} (voz: ${voiceName}) para explicação ${ordem}`);

    // Normalizar texto e limitar tamanho
    let textoNormalizado = normalizarTextoParaTTS(texto);
    if (textoNormalizado.length > LIMITE_TEXTO_TOTAL) {
      console.log(`Texto muito grande (${textoNormalizado.length} chars), truncando para ${LIMITE_TEXTO_TOTAL}`);
      // Truncar no fim de uma frase
      const textoTruncado = textoNormalizado.substring(0, LIMITE_TEXTO_TOTAL);
      const ultimoPonto = textoTruncado.lastIndexOf(". ");
      textoNormalizado = ultimoPonto > LIMITE_TEXTO_TOTAL * 0.7 
        ? textoTruncado.substring(0, ultimoPonto + 1)
        : textoTruncado;
    }
    console.log(`Texto normalizado: ${textoNormalizado.length} caracteres`);

    // Gerar áudio COMPLETO de uma vez (sem divisão em segmentos)
    console.log(`Iniciando geração TTS com Gemini (texto inteiro)...`);
    const pcmBytes = await gerarAudioGeminiTTS(textoNormalizado, voiceName, API_KEYS);
    console.log(`TTS gerado com sucesso: ${pcmBytes.length} bytes PCM`);

    // Converter PCM para WAV
    const wavBytes = pcmToWav(pcmBytes);
    console.log(`Áudio convertido: ${pcmBytes.length} bytes PCM -> ${wavBytes.length} bytes WAV`);

    // Upload para storage com extensão .wav
    const fileName = `explicacao_${ordem}_${modo}_${Date.now()}.wav`;
    const filePath = `explicacoes/${fileName}`;
    const audioUrl = await uploadParaSupabase(supabase, wavBytes, "audios", filePath, "audio/wav");

    // Atualizar registro no banco - coluna diferente por modo
    const updateField = modo === "descomplicado" ? "url_audio_descomplicado" : "url_audio";
    const { error: updateError } = await supabase
      .from("lei_seca_explicacoes")
      .update({ [updateField]: audioUrl })
      .eq("ordem", ordem);

    if (updateError) {
      console.error("Erro ao atualizar URL do áudio:", updateError);
    }

    return new Response(
      JSON.stringify({ audioUrl, success: true, modo, voiceName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
