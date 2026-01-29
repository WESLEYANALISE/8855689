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

const VOICE_NAME = "Kore"; // Voz feminina para narração
const LIMITE_CHARS = 3500;
const SAMPLE_RATE = 24000;

// Delay entre chamadas para evitar rate limit
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Normalizar texto para TTS
function normalizarTextoParaTTS(texto: string): string {
  let normalizado = texto
    // Remover HTML
    .replace(/<[^>]+>/g, ' ')
    // Remover marcadores markdown
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    // Expandir abreviações comuns
    .replace(/\bArt\./gi, 'Artigo')
    .replace(/\barts\./gi, 'artigos')
    .replace(/\bDr\./gi, 'Doutor')
    .replace(/\bDra\./gi, 'Doutora')
    .replace(/\bProf\./gi, 'Professor')
    .replace(/\bSr\./gi, 'Senhor')
    .replace(/\bSra\./gi, 'Senhora')
    .replace(/\bp\./gi, 'página')
    .replace(/\bpp\./gi, 'páginas')
    .replace(/\bcf\./gi, 'conforme')
    .replace(/\bex\./gi, 'exemplo')
    .replace(/\betc\./gi, 'et cetera')
    .replace(/\bi\.e\./gi, 'isto é')
    .replace(/\be\.g\./gi, 'por exemplo')
    // Números romanos para falados
    .replace(/\bI\b(?=[^a-zA-Z])/g, 'primeiro')
    .replace(/\bII\b/g, 'segundo')
    .replace(/\bIII\b/g, 'terceiro')
    .replace(/\bIV\b/g, 'quarto')
    .replace(/\bV\b(?=[^a-zA-Z])/g, 'quinto')
    // Limpar espaços e quebras excessivas
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();

  return normalizado;
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

// Dividir texto em partes de até LIMITE_CHARS
function dividirEmPartes(texto: string): string[] {
  const partes: string[] = [];
  let textoRestante = texto;
  
  while (textoRestante.length > LIMITE_CHARS) {
    // Encontrar ponto de corte em final de frase
    let pontoCorte = LIMITE_CHARS;
    
    // Procurar último ponto, interrogação ou exclamação antes do limite
    for (let i = LIMITE_CHARS; i > LIMITE_CHARS * 0.7; i--) {
      if (['.', '!', '?', '\n'].includes(textoRestante[i])) {
        pontoCorte = i + 1;
        break;
      }
    }
    
    partes.push(textoRestante.substring(0, pontoCorte).trim());
    textoRestante = textoRestante.substring(pontoCorte).trim();
  }
  
  if (textoRestante.length > 0) {
    partes.push(textoRestante);
  }
  
  return partes;
}

// Gerar áudio para uma parte do texto
async function gerarAudioParte(texto: string, tentativa = 0): Promise<Uint8Array> {
  const textoNormalizado = normalizarTextoParaTTS(texto);
  
  if (textoNormalizado.length < 10) {
    throw new Error("Texto muito curto para narração");
  }

  for (let i = tentativa; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    
    try {
      console.log(`Tentando gerar áudio com chave ${i + 1}...`);
      
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
                  prebuilt_voice_config: { voice_name: VOICE_NAME },
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
          console.log(`Rate limit/indisponível, tentando próxima chave...`);
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
      
      console.log(`Áudio gerado com sucesso (${bytes.length} bytes)`);
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
  
  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');
  
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Audio data
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
    const { livroTitulo, capituloNumero } = await req.json();
    
    if (!livroTitulo) {
      throw new Error("livroTitulo é obrigatório");
    }

    console.log(`\n=== Gerando narração para: ${livroTitulo} ===`);
    if (capituloNumero) {
      console.log(`Capítulo específico: ${capituloNumero}`);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar índice de capítulos
    const { data: indiceData } = await supabase
      .from("leitura_livros_indice")
      .select("indice_capitulos")
      .ilike("livro_titulo", `%${livroTitulo}%`)
      .single();

    const indiceCapitulos = indiceData?.indice_capitulos as { numero: number; titulo: string; pagina_inicio: number }[] || [];
    
    if (indiceCapitulos.length === 0) {
      throw new Error("Índice de capítulos não encontrado. Formate o livro primeiro.");
    }

    console.log(`Índice encontrado: ${indiceCapitulos.length} capítulos`);

    // Buscar páginas formatadas
    let query = supabase
      .from("leitura_paginas_formatadas")
      .select("numero_pagina, html_formatado, capitulo_titulo, is_chapter_start")
      .ilike("livro_titulo", `%${livroTitulo}%`)
      .order("numero_pagina", { ascending: true });

    const { data: paginas, error: paginasError } = await query;

    if (paginasError || !paginas?.length) {
      throw new Error("Páginas formatadas não encontradas");
    }

    console.log(`${paginas.length} páginas encontradas`);

    // Determinar quais capítulos processar
    const capitulosParaProcessar = capituloNumero 
      ? indiceCapitulos.filter(c => c.numero === capituloNumero)
      : indiceCapitulos;

    const resultados: { capitulo: number; titulo: string; audioUrl: string }[] = [];

    for (const capitulo of capitulosParaProcessar) {
      console.log(`\n--- Processando Capítulo ${capitulo.numero}: ${capitulo.titulo} ---`);
      
      // Encontrar páginas do capítulo
      const capAtual = capitulo;
      const proxCap = indiceCapitulos.find(c => c.numero === capitulo.numero + 1);
      
      const paginasDoCapitulo = paginas.filter(p => {
        const numPag = p.numero_pagina;
        if (proxCap) {
          return numPag >= capAtual.pagina_inicio && numPag < proxCap.pagina_inicio;
        }
        return numPag >= capAtual.pagina_inicio;
      });

      if (paginasDoCapitulo.length === 0) {
        console.log(`Nenhuma página encontrada para capítulo ${capitulo.numero}`);
        continue;
      }

      console.log(`${paginasDoCapitulo.length} páginas no capítulo`);

      // Concatenar texto do capítulo
      const textoCapitulo = paginasDoCapitulo
        .map(p => limparHTML(p.html_formatado || ""))
        .join("\n\n");

      console.log(`Texto concatenado: ${textoCapitulo.length} caracteres`);

      // Dividir em partes de 3500 chars
      const partes = dividirEmPartes(textoCapitulo);
      console.log(`Dividido em ${partes.length} partes`);

      // Gerar áudio para cada parte
      const audiosPCM: Uint8Array[] = [];
      
      for (let i = 0; i < partes.length; i++) {
        console.log(`Gerando parte ${i + 1}/${partes.length} (${partes[i].length} chars)...`);
        
        const audioPCM = await gerarAudioParte(partes[i]);
        audiosPCM.push(audioPCM);
        
        // Delay entre chamadas
        if (i < partes.length - 1) {
          await delay(2000);
        }
      }

      // Concatenar PCMs e converter para WAV
      const pcmCompleto = concatenarPCM(audiosPCM);
      const wavBytes = pcmToWav(pcmCompleto);
      
      console.log(`WAV gerado: ${wavBytes.length} bytes`);

      // Upload para Supabase Storage
      const nomeArquivo = `${sanitizarNome(livroTitulo)}/capitulo-${capitulo.numero}.wav`;
      
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

      // Atualizar banco com URL do áudio para todas as páginas do capítulo
      const { error: updateError } = await supabase
        .from("leitura_paginas_formatadas")
        .update({ url_audio_capitulo: audioUrl })
        .ilike("livro_titulo", `%${livroTitulo}%`)
        .gte("numero_pagina", capAtual.pagina_inicio)
        .lt("numero_pagina", proxCap?.pagina_inicio || 99999);

      if (updateError) {
        console.error("Erro ao atualizar banco:", updateError);
      } else {
        console.log(`Banco atualizado para páginas ${capAtual.pagina_inicio}-${proxCap?.pagina_inicio || 'fim'}`);
      }

      resultados.push({
        capitulo: capitulo.numero,
        titulo: capitulo.titulo,
        audioUrl
      });

      // Delay entre capítulos
      if (capitulosParaProcessar.indexOf(capitulo) < capitulosParaProcessar.length - 1) {
        await delay(3000);
      }
    }

    console.log(`\n=== Concluído! ${resultados.length} capítulos narrados ===`);

    return new Response(
      JSON.stringify({
        success: true,
        livro: livroTitulo,
        capitulosNarrados: resultados.length,
        resultados
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
