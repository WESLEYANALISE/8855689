import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

async function gerarAudioChirp3HD(texto: string): Promise<ArrayBuffer | null> {
  for (let attempt = 0; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const keyIndex = attempt % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIndex];
    
    try {
      console.log(`[TTS Chirp3 HD] Tentativa ${attempt + 1} com key ${keyIndex + 1}`);
      
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text: texto },
            voice: {
              languageCode: "pt-BR",
              name: "pt-BR-Chirp3-HD-Achernar"
            },
            audioConfig: {
              audioEncoding: "MP3",
              speakingRate: 1.0,
              pitch: 0
            }
          }),
        }
      );

      if (response.status === 429) {
        console.log(`Rate limit na key ${keyIndex + 1}, tentando próxima...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro Chirp3 HD TTS: ${response.status} - ${errorText}`);
        continue;
      }

      const data = await response.json();
      const audioData = data.audioContent;
      
      if (!audioData) {
        console.error("Resposta sem dados de áudio");
        continue;
      }

      // Converter base64 para ArrayBuffer
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return bytes.buffer;
    } catch (error) {
      console.error(`Erro na tentativa ${attempt + 1}:`, error);
      if (attempt === GEMINI_KEYS.length * 2 - 1) {
        throw error;
      }
    }
  }
  
  return null;
}

function limparTextoParaNarracao(texto: string): string {
  return texto
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s?/g, '')
    .replace(/>\s?/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\|/g, ' ')
    .replace(/-{3,}/g, '')
    .replace(/📚|💡|⚠️|🕐|✦/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .substring(0, 8000); // Limitar tamanho para TTS
}

async function processarNarracao(resumo_id: number, conteudo: string, titulo: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log(`[Narracao] Processando narração para resumo ${resumo_id}...`);
    
    // Preparar texto com título no início
    const textoLimpo = limparTextoParaNarracao(conteudo);
    const textoCompleto = `${titulo}. ${textoLimpo}`;
    
    // Gerar áudio
    const audioBuffer = await gerarAudioChirp3HD(textoCompleto);
    
    if (!audioBuffer) {
      throw new Error("Falha ao gerar áudio");
    }

    // Upload para o Supabase Storage
    const fileName = `resumo-${resumo_id}-${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audios")
      .upload(`narracao-resumos/${fileName}`, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from("audios")
      .getPublicUrl(`narracao-resumos/${fileName}`);

    // Atualizar registro
    const { error: updateError } = await supabase
      .from("RESUMO")
      .update({ url_audio_resumo: publicUrl })
      .eq("id", resumo_id);

    if (updateError) {
      throw new Error(`Erro ao atualizar resumo: ${updateError.message}`);
    }

    console.log(`[Narracao] ✅ Narração do resumo ${resumo_id} concluída!`);
  } catch (error) {
    console.error(`[Narracao] ❌ Erro na narração do resumo ${resumo_id}:`, error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumo_id, conteudo, titulo } = await req.json();
    
    if (!resumo_id) {
      return new Response(
        JSON.stringify({ error: "resumo_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados se não fornecidos
    let textoConteudo = conteudo;
    let textoTitulo = titulo;
    
    if (!textoConteudo || !textoTitulo) {
      const { data: resumo, error: resumoError } = await supabase
        .from("RESUMO")
        .select("subtema, conteudo_gerado")
        .eq("id", resumo_id)
        .single();

      if (resumoError || !resumo) {
        return new Response(
          JSON.stringify({ error: "Resumo não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      textoTitulo = textoTitulo || resumo.subtema;
      
      // Extrair conteúdo do conteudo_gerado
      if (!textoConteudo && resumo.conteudo_gerado) {
        const cg = typeof resumo.conteudo_gerado === 'string' 
          ? JSON.parse(resumo.conteudo_gerado) 
          : resumo.conteudo_gerado;
        textoConteudo = cg.resumo || "";
      }
    }

    if (!textoConteudo) {
      return new Response(
        JSON.stringify({ error: "Conteúdo não disponível para narração" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Processar em background
    console.log(`[Main] Iniciando narração em background para resumo ${resumo_id}`);
    EdgeRuntime.waitUntil(processarNarracao(resumo_id, textoConteudo, textoTitulo));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Narração iniciada em segundo plano",
        resumo_id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
