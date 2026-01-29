import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

// Abreviações jurídicas para expandir
const ABREVIACOES_JURIDICAS: Record<string, string> = {
  "Art.": "Artigo", "art.": "artigo", "Arts.": "Artigos", "arts.": "artigos",
  "CF": "Constituição Federal", "CF/88": "Constituição Federal de 1988",
  "CC": "Código Civil", "CC/02": "Código Civil de 2002",
  "CP": "Código Penal", "CPC": "Código de Processo Civil", "CPP": "Código de Processo Penal",
  "CLT": "Consolidação das Leis do Trabalho", "CDC": "Código de Defesa do Consumidor",
  "CTN": "Código Tributário Nacional", "ECA": "Estatuto da Criança e do Adolescente",
  "STF": "Supremo Tribunal Federal", "STJ": "Superior Tribunal de Justiça",
  "TST": "Tribunal Superior do Trabalho", "TSE": "Tribunal Superior Eleitoral",
  "TJ": "Tribunal de Justiça", "TRF": "Tribunal Regional Federal",
  "Min.": "Ministro", "Rel.": "Relator", "Des.": "Desembargador",
  "nº": "número", "n.": "número", "§": "parágrafo", "§§": "parágrafos",
  "inc.": "inciso", "al.": "alínea", "p.": "página", "pp.": "páginas",
  "LINDB": "Lei de Introdução às Normas do Direito Brasileiro",
  "LC": "Lei Complementar", "EC": "Emenda Constitucional", "MP": "Medida Provisória",
  "OAB": "Ordem dos Advogados do Brasil", "CRFB": "Constituição da República Federativa do Brasil",
};

// Mapas para conversão
const ROMANOS_PARA_ORDINAIS: Record<string, string> = {
  "I": "primeiro", "II": "segundo", "III": "terceiro", "IV": "quarto", "V": "quinto",
  "VI": "sexto", "VII": "sétimo", "VIII": "oitavo", "IX": "nono", "X": "décimo",
  "XI": "décimo primeiro", "XII": "décimo segundo", "XIII": "décimo terceiro", 
  "XIV": "décimo quarto", "XV": "décimo quinto", "XVI": "décimo sexto", 
  "XVII": "décimo sétimo", "XVIII": "décimo oitavo", "XIX": "décimo nono", 
  "XX": "vigésimo"
};

const NUMEROS_ORDINAIS: Record<string, string> = {
  "1": "primeiro", "2": "segundo", "3": "terceiro", "4": "quarto", "5": "quinto",
  "6": "sexto", "7": "sétimo", "8": "oitavo", "9": "nono", "10": "décimo"
};

// Normaliza texto para TTS
function normalizarTextoParaTTS(texto: string): string {
  let resultado = texto;
  
  // Remover markdown
  resultado = resultado
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`{3}[\s\S]*?`{3}/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/>\s?/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .replace(/[-*+]\s/g, "")
    .replace(/\d+\.\s/g, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/\\\n/g, " ")
    .replace(/\\([^\\])/g, "$1")
    .replace(/^\\$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/⚠️|💡|✦|🔗|📚|⚖️|🎯|📖|📌|✅|❌|⭐|🔴|🟡|🟢|🔵|⚪|💬|📝|🏛️|⚔️|🔑|🎓|📋/g, "")
    .replace(/---+/g, "")
    .replace(/\|[^|]+\|/g, "")
    .replace(/^\s*\|.*$/gm, "");
  
  // Parágrafos
  resultado = resultado.replace(/§\s*único/gi, "parágrafo único");
  resultado = resultado.replace(/§\s*(\d+)[º°]?/g, (_, num) => {
    const ordinal = NUMEROS_ORDINAIS[num] || num;
    return `parágrafo ${ordinal}`;
  });
  
  // Incisos
  resultado = resultado.replace(/\b(I{1,3}|IV|V|VI{0,3}|IX|X{1,3}|XI{0,3}|XIV|XV|XVI{0,3}|XIX|XX{0,3})\s*[-–—]/g, (match, romano) => {
    const ordinal = ROMANOS_PARA_ORDINAIS[romano] || romano;
    return `inciso ${ordinal}, `;
  });
  
  // Alíneas
  resultado = resultado.replace(/\b([a-z])\)\s*/g, (_, letra) => `alínea ${letra}, `);
  resultado = resultado.replace(/[º°]/g, "");
  
  // Expandir abreviações
  const abreviacoesOrdenadas = Object.entries(ABREVIACOES_JURIDICAS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [abrev, expansao] of abreviacoesOrdenadas) {
    const abrevEscapada = abrev.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    resultado = resultado.replace(new RegExp(`\\b${abrevEscapada}\\b`, "g"), expansao);
  }
  
  // Limpar espaços
  resultado = resultado
    .replace(/\s+/g, " ")
    .replace(/\s*\.\s*/g, ". ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
  
  return resultado;
}

// Divide texto em chunks
function dividirTextoEmChunks(texto: string, limiteBytesMax: number = 4500): string[] {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  const sentencas = texto.split(/(?<=[.!?])\s+/);
  let chunkAtual = "";
  
  for (const sentenca of sentencas) {
    const bytesAtuais = encoder.encode(chunkAtual).length;
    const bytesSentenca = encoder.encode(sentenca).length;
    
    if (bytesAtuais + bytesSentenca + 1 <= limiteBytesMax) {
      chunkAtual = chunkAtual ? `${chunkAtual} ${sentenca}` : sentenca;
    } else {
      if (chunkAtual) chunks.push(chunkAtual.trim());
      
      if (bytesSentenca > limiteBytesMax) {
        const palavras = sentenca.split(/\s+/);
        let subChunk = "";
        
        for (const palavra of palavras) {
          const bytesSubChunk = encoder.encode(subChunk).length;
          const bytesPalavra = encoder.encode(palavra).length;
          
          if (bytesSubChunk + bytesPalavra + 1 <= limiteBytesMax) {
            subChunk = subChunk ? `${subChunk} ${palavra}` : palavra;
          } else {
            if (subChunk) chunks.push(subChunk.trim());
            subChunk = palavra;
          }
        }
        chunkAtual = subChunk;
      } else {
        chunkAtual = sentenca;
      }
    }
  }
  
  if (chunkAtual.trim()) chunks.push(chunkAtual.trim());
  return chunks;
}

// Gera áudio com Chirp 3 HD
async function gerarAudioChunkChirp3HD(texto: string, tentativaInicial: number = 0): Promise<Uint8Array> {
  for (let attempt = tentativaInicial; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const keyIndex = attempt % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIndex];

    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text: texto },
            voice: { languageCode: "pt-BR", name: "pt-BR-Chirp3-HD-Aoede" },
            audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000, speakingRate: 1.0, pitch: 0 }
          }),
        }
      );

      if (response.status === 429) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const audioContent = data.audioContent;

      if (!audioContent) throw new Error("Resposta sem dados de áudio");

      const binaryString = atob(audioContent);
      const audioBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioBytes[i] = binaryString.charCodeAt(i);
      }

      return audioBytes;
    } catch (error) {
      if (attempt >= GEMINI_KEYS.length * 2 - 1) throw error;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  throw new Error("Todas as tentativas de TTS falharam");
}

function extrairPCMdeWav(wavBytes: Uint8Array): Uint8Array {
  if (wavBytes[0] === 0x52 && wavBytes[1] === 0x49 && wavBytes[2] === 0x46 && wavBytes[3] === 0x46) {
    return wavBytes.slice(44);
  }
  return wavBytes;
}

async function gerarAudioChirp3HD(texto: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const bytesTotal = encoder.encode(texto).length;
  
  if (bytesTotal <= 4500) {
    return await gerarAudioChunkChirp3HD(texto);
  }
  
  const chunks = dividirTextoEmChunks(texto);
  const audioPartes: Uint8Array[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const audioChunk = await gerarAudioChunkChirp3HD(chunks[i]);
    const pcmData = extrairPCMdeWav(audioChunk);
    audioPartes.push(pcmData);
    
    if (i < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  
  const tamanhoTotal = audioPartes.reduce((acc, arr) => acc + arr.length, 0);
  const pcmConcatenado = new Uint8Array(tamanhoTotal);
  
  let offset = 0;
  for (const parte of audioPartes) {
    pcmConcatenado.set(parte, offset);
    offset += parte.length;
  }
  
  return pcmConcatenado;
}

function criarHeaderWav(pcmData: Uint8Array, sampleRate: number = 24000): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const fileSize = 36 + dataSize;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46);
  view.setUint32(4, fileSize, true);
  view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45);
  view.setUint8(12, 0x66); view.setUint8(13, 0x6D); view.setUint8(14, 0x74); view.setUint8(15, 0x20);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61);
  view.setUint32(40, dataSize, true);

  const wavFile = new Uint8Array(44 + pcmData.length);
  wavFile.set(new Uint8Array(header), 0);
  wavFile.set(pcmData, 44);

  return wavFile;
}

async function uploadParaSupabase(supabase: any, audioBytes: Uint8Array, bucket: string, path: string): Promise<string> {
  const hasWavHeader = audioBytes[0] === 0x52 && audioBytes[1] === 0x49 && audioBytes[2] === 0x46 && audioBytes[3] === 0x46;
  
  const wavBytes = hasWavHeader ? audioBytes : criarHeaderWav(audioBytes);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, wavBytes, { contentType: "audio/wav", upsert: true });

  if (uploadError) {
    throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

async function processarNarracaoBackground(topico_id: number, conteudo: string) {
  console.log(`[Narração Conceitos BG] Iniciando para tópico ${topico_id}`);
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const textoNormalizado = normalizarTextoParaTTS(conteudo);
    console.log(`[Narração Conceitos BG] Texto normalizado: ${textoNormalizado.length} chars`);

    const audioBytes = await gerarAudioChirp3HD(textoNormalizado);

    const timestamp = Date.now();
    const storagePath = `conceitos/${topico_id}_${timestamp}.wav`;
    
    const audioUrl = await uploadParaSupabase(supabase, audioBytes, "audios", storagePath);
    console.log(`[Narração Conceitos BG] Áudio salvo: ${audioUrl}`);

    const { error: updateError } = await supabase
      .from("conceitos_topicos")
      .update({ url_narracao: audioUrl })
      .eq("id", topico_id);

    if (updateError) {
      console.error("[Narração Conceitos BG] Erro ao atualizar:", updateError);
    } else {
      console.log(`[Narração Conceitos BG] ✅ Narração concluída para tópico ${topico_id}`);
    }
  } catch (error) {
    console.error(`[Narração Conceitos BG] ❌ Erro:`, error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topico_id, conteudo, titulo } = await req.json();
    
    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: "topico_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let conteudoFinal = conteudo;
    let tituloFinal = titulo;
    
    if (!conteudoFinal || !tituloFinal) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: topico } = await supabase
        .from("conceitos_topicos")
        .select("conteudo_gerado, titulo")
        .eq("id", topico_id)
        .single();
      
      if (!conteudoFinal) {
        conteudoFinal = topico?.conteudo_gerado;
      }
      if (!tituloFinal) {
        tituloFinal = topico?.titulo;
      }
    }

    if (!conteudoFinal) {
      return new Response(
        JSON.stringify({ error: "Conteúdo não encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Adicionar título no início do conteúdo para narração
    const conteudoComTitulo = tituloFinal 
      ? `${tituloFinal}. ${conteudoFinal}` 
      : conteudoFinal;

    // @ts-ignore - EdgeRuntime é disponível apenas no Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(processarNarracaoBackground(topico_id, conteudoComTitulo));
    } else {
      // Fallback para processamento síncrono se EdgeRuntime não estiver disponível
      await processarNarracaoBackground(topico_id, conteudoComTitulo);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Narração iniciada em background",
        topico_id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Narração Conceitos] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
