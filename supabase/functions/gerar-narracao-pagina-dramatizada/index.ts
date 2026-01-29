import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chaves Gemini com fallback
const API_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

// Vozes disponíveis no Gemini TTS
const VOZES = {
  narradora: "Kore",      // Feminina - narradora principal
  narrador: "Orus",       // Masculino - narrador alternativo
  femininas: ["Aoede", "Callirrhoe", "Leda", "Despina", "Erinome"],
  masculinas: ["Charon", "Fenrir", "Enceladus", "Iapetus", "Puck"],
};

const SAMPLE_RATE = 24000;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cache de personagens para manter consistência de vozes no livro
const cacheVozesPersonagens: Record<string, string> = {};
let indexFeminino = 0;
let indexMasculino = 0;

interface SegmentoDialogo {
  tipo: "narracao" | "fala";
  texto: string;
  personagem?: string;
  genero?: "masculino" | "feminino" | "neutro";
}

// Obter voz para um personagem (mantendo consistência)
function obterVozPersonagem(personagem: string, genero: string): string {
  const chave = personagem.toLowerCase().trim();
  
  if (cacheVozesPersonagens[chave]) {
    return cacheVozesPersonagens[chave];
  }
  
  let voz: string;
  if (genero === "feminino") {
    voz = VOZES.femininas[indexFeminino % VOZES.femininas.length];
    indexFeminino++;
  } else {
    voz = VOZES.masculinas[indexMasculino % VOZES.masculinas.length];
    indexMasculino++;
  }
  
  cacheVozesPersonagens[chave] = voz;
  return voz;
}

// Limpar HTML para texto puro
function limparHTML(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalizar texto para TTS
function normalizarTextoParaTTS(texto: string): string {
  return texto
    .replace(/<[^>]+>/g, ' ')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    .replace(/\bArt\./gi, 'Artigo')
    .replace(/\bDr\./gi, 'Doutor')
    .replace(/\bDra\./gi, 'Doutora')
    .replace(/\bProf\./gi, 'Professor')
    .replace(/\bSr\./gi, 'Senhor')
    .replace(/\bSra\./gi, 'Senhora')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
}

// Analisar diálogos usando Gemini
async function analisarDialogos(texto: string, apiKey: string): Promise<SegmentoDialogo[]> {
  const textoLimpo = limparHTML(texto);
  
  // Se o texto é curto, não vale a pena analisar
  if (textoLimpo.length < 100) {
    return [{ tipo: "narracao", texto: textoLimpo }];
  }

  const prompt = `Analise o texto abaixo e identifique trechos de narração e falas de personagens.

REGRAS:
1. Falas são trechos entre aspas, travessões (—) ou dois pontos seguidos de fala
2. Identifique o personagem que fala (se possível) e seu gênero provável
3. Tudo que não é fala é narração
4. Mantenha a ordem original do texto
5. Retorne APENAS o JSON, sem explicações

TEXTO:
${textoLimpo.substring(0, 3000)}

Retorne um JSON neste formato exato:
{
  "segmentos": [
    {"tipo": "narracao", "texto": "texto da narração"},
    {"tipo": "fala", "texto": "texto da fala", "personagem": "Nome", "genero": "masculino"},
    {"tipo": "narracao", "texto": "mais narração"}
  ]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Erro na análise de diálogos:", response.status);
      return [{ tipo: "narracao", texto: textoLimpo }];
    }

    const data = await response.json();
    const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Extrair JSON da resposta
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("Nenhum JSON encontrado na resposta, usando narração simples");
      return [{ tipo: "narracao", texto: textoLimpo }];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.segmentos && Array.isArray(parsed.segmentos)) {
      console.log(`Análise: ${parsed.segmentos.length} segmentos identificados`);
      return parsed.segmentos;
    }
    
    return [{ tipo: "narracao", texto: textoLimpo }];
  } catch (error) {
    console.error("Erro ao analisar diálogos:", error);
    return [{ tipo: "narracao", texto: textoLimpo }];
  }
}

// Gerar áudio para um segmento com voz específica
async function gerarAudioSegmento(texto: string, voz: string, tentativa = 0): Promise<Uint8Array> {
  const textoNormalizado = normalizarTextoParaTTS(texto);
  
  if (textoNormalizado.length < 5) {
    throw new Error("Texto muito curto");
  }

  for (let i = tentativa; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    
    try {
      console.log(`Gerando áudio com voz ${voz} (chave ${i + 1})...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: textoNormalizado }] }],
            generationConfig: {
              response_modalities: ["AUDIO"],
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: { voice_name: voz },
                },
              },
            },
          }),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro com chave ${i + 1}:`, response.status, errorText);
        
        if (response.status === 429 || response.status === 503) {
          continue;
        }
        throw new Error(`Erro API: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
        throw new Error("Resposta sem dados de áudio");
      }
      
      const base64Audio = data.candidates[0].content.parts[0].inlineData.data;
      const bytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      
      console.log(`Áudio gerado: ${bytes.length} bytes`);
      return bytes;
      
    } catch (error) {
      console.error(`Falha com chave ${i + 1}:`, error);
      if (i === API_KEYS.length - 1) {
        throw new Error("Todas as chaves API falharam");
      }
    }
  }
  
  throw new Error("Nenhuma chave API disponível");
}

// Concatenar múltiplos arrays PCM
function concatenarPCM(audios: Uint8Array[]): Uint8Array {
  const totalLength = audios.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const audio of audios) {
    result.set(audio, offset);
    offset += audio.length;
  }
  
  return result;
}

// Converter PCM para WAV
function pcmToWav(pcmData: Uint8Array): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = SAMPLE_RATE * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  const wavData = new Uint8Array(buffer);
  wavData.set(pcmData, headerSize);
  
  return wavData;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Sanitizar nome para arquivo
function sanitizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { livroTitulo, numeroPagina, textoPagina } = await req.json();
    
    if (!livroTitulo || !numeroPagina) {
      throw new Error("livroTitulo e numeroPagina são obrigatórios");
    }

    console.log(`\n=== Gerando narração dramatizada: ${livroTitulo} - Página ${numeroPagina} ===`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar texto da página se não fornecido
    let texto = textoPagina;
    if (!texto) {
      const { data: paginaData } = await supabase
        .from("leitura_paginas_formatadas")
        .select("html_formatado")
        .ilike("livro_titulo", `%${livroTitulo}%`)
        .eq("numero_pagina", numeroPagina)
        .single();
      
      texto = paginaData?.html_formatado || "";
    }

    if (!texto || texto.length < 20) {
      console.log("Página sem conteúdo suficiente para narração");
      return new Response(
        JSON.stringify({ success: false, error: "Página sem conteúdo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const textoLimpo = limparHTML(texto);
    console.log(`Texto da página: ${textoLimpo.length} caracteres`);

    // Analisar diálogos
    const segmentos = await analisarDialogos(textoLimpo, API_KEYS[0]);
    console.log(`${segmentos.length} segmentos identificados`);

    // Gerar áudio para cada segmento
    const audiosPCM: Uint8Array[] = [];
    const vozesUsadas: string[] = [];
    
    for (let i = 0; i < segmentos.length; i++) {
      const seg = segmentos[i];
      
      // Determinar voz
      let voz: string;
      if (seg.tipo === "narracao") {
        voz = VOZES.narradora;
      } else if (seg.personagem) {
        voz = obterVozPersonagem(seg.personagem, seg.genero || "masculino");
      } else {
        voz = seg.genero === "feminino" ? VOZES.femininas[0] : VOZES.masculinas[0];
      }
      
      vozesUsadas.push(voz);
      
      console.log(`Segmento ${i + 1}/${segmentos.length}: ${seg.tipo} (${voz}) - ${seg.texto.substring(0, 50)}...`);
      
      try {
        const audioPCM = await gerarAudioSegmento(seg.texto, voz);
        audiosPCM.push(audioPCM);
        
        // Delay entre segmentos
        if (i < segmentos.length - 1) {
          await delay(1500);
        }
      } catch (error) {
        console.error(`Erro no segmento ${i + 1}:`, error);
        // Continuar com próximo segmento
      }
    }

    if (audiosPCM.length === 0) {
      throw new Error("Nenhum áudio gerado");
    }

    // Concatenar e converter para WAV
    const pcmCompleto = concatenarPCM(audiosPCM);
    const wavBytes = pcmToWav(pcmCompleto);
    console.log(`WAV final: ${wavBytes.length} bytes`);

    // Upload para Storage
    const nomeArquivo = `${sanitizarNome(livroTitulo)}/pagina-${numeroPagina}.wav`;
    
    const { error: uploadError } = await supabase.storage
      .from("audios-biblioteca")
      .upload(nomeArquivo, wavBytes, {
        contentType: "audio/wav",
        upsert: true
      });

    if (uploadError) {
      console.error("Erro no upload:", uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from("audios-biblioteca")
      .getPublicUrl(nomeArquivo);

    const audioUrl = urlData.publicUrl;
    console.log(`Áudio disponível em: ${audioUrl}`);

    // Atualizar banco com URL do áudio da página
    const { error: updateError } = await supabase
      .from("leitura_paginas_formatadas")
      .update({ url_audio_pagina: audioUrl })
      .ilike("livro_titulo", `%${livroTitulo}%`)
      .eq("numero_pagina", numeroPagina);

    if (updateError) {
      console.error("Erro ao atualizar banco:", updateError);
    }

    console.log(`=== Narração da página ${numeroPagina} concluída ===\n`);

    return new Response(
      JSON.stringify({
        success: true,
        livro: livroTitulo,
        pagina: numeroPagina,
        audioUrl,
        segmentos: segmentos.length,
        vozesUsadas: [...new Set(vozesUsadas)]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
