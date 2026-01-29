import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

  if (uploadError) {
    throw new Error(`Erro no upload: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

// Normalizar texto para TTS
function normalizarTextoParaTTS(texto: string): string {
  return texto
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`[^`]+`/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/Art\./g, 'Artigo')
    .replace(/§\s*(\d+)/g, 'parágrafo $1')
    .replace(/Inc\./g, 'Inciso')
    .replace(/CF\/88/g, 'Constituição Federal de 1988')
    .replace(/STF/g, 'Supremo Tribunal Federal')
    .replace(/STJ/g, 'Superior Tribunal de Justiça')
    .replace(/TSE/g, 'Tribunal Superior Eleitoral')
    .replace(/PT/g, 'Partido dos Trabalhadores')
    .replace(/PL/g, 'Partido Liberal')
    .replace(/MDB/g, 'Movimento Democrático Brasileiro')
    .replace(/PSDB/g, 'Partido da Social Democracia Brasileira')
    .replace(/PSD/g, 'Partido Social Democrático')
    .trim();
}

// Gerar áudio com Google Cloud TTS (com fallback de chaves)
async function gerarAudioGoogleTTS(texto: string, chavesDisponiveis: string[]): Promise<Uint8Array> {
  for (let i = 0; i < chavesDisponiveis.length; i++) {
    try {
      console.log(`[gerar-narracao-politica] Tentando GEMINI_KEY_${i + 1}...`);
      
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${chavesDisponiveis[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: texto },
            voice: {
              languageCode: 'pt-BR',
              name: 'pt-BR-Chirp3-HD-Aoede'
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
        console.error(`[gerar-narracao-politica] Erro TTS com GEMINI_KEY_${i + 1}: ${response.status}`);
        
        // Se for rate limit, quota ou billing, tentar próxima chave
        if ((response.status === 429 || response.status === 403 || errorText.includes('quota') || errorText.includes('BILLING')) && i < chavesDisponiveis.length - 1) {
          console.log(`[gerar-narracao-politica] Erro na GEMINI_KEY_${i + 1}, tentando próxima...`);
          continue;
        }
        
        if (i === chavesDisponiveis.length - 1) {
          throw new Error(`Todas as ${chavesDisponiveis.length} chaves falharam: ${response.status}`);
        }
        continue;
      }

      const data = await response.json();
      const audioContent = data.audioContent;

      if (!audioContent) {
        throw new Error('Google TTS não retornou áudio');
      }

      console.log(`[gerar-narracao-politica] ✅ Sucesso com GEMINI_KEY_${i + 1}`);

      // Converter base64 para bytes
      const binaryString = atob(audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        bytes[j] = binaryString.charCodeAt(j);
      }

      return bytes;
    } catch (error: any) {
      if (i === chavesDisponiveis.length - 1) {
        throw error;
      }
    }
  }
  
  throw new Error('Nenhuma chave disponível');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artigoId, texto, orientacao } = await req.json();
    
    if (!artigoId || !texto) {
      throw new Error('artigoId e texto são obrigatórios');
    }

    console.log(`[gerar-narracao-politica] Gerando narração para artigo ${artigoId}`);

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Chaves de API disponíveis para fallback (3 chaves Gemini)
    const chavesDisponiveis = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
    ].filter(Boolean) as string[];

    if (chavesDisponiveis.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY_X configurada');
    }

    console.log(`[gerar-narracao-politica] ${chavesDisponiveis.length} chaves GEMINI disponíveis`);

    // Normalizar e limitar texto (4000 chars para TTS)
    const textoNormalizado = normalizarTextoParaTTS(texto);
    const textoLimitado = textoNormalizado.slice(0, 4000);

    console.log(`[gerar-narracao-politica] Texto normalizado: ${textoLimitado.length} caracteres`);

    // Gerar áudio
    const audioBytes = await gerarAudioGoogleTTS(textoLimitado, chavesDisponiveis);
    console.log(`[gerar-narracao-politica] Áudio gerado: ${audioBytes.length} bytes`);

    // Upload para Storage
    const timestamp = Date.now();
    const orientacaoSlug = (orientacao || 'geral').toLowerCase().replace(/\s+/g, '-');
    const path = `politica/${orientacaoSlug}/${artigoId}_${timestamp}.mp3`;
    
    const audioUrl = await uploadParaSupabase(supabase, audioBytes, 'audios', path, 'audio/mpeg');
    console.log(`[gerar-narracao-politica] Upload concluído: ${audioUrl}`);

    // Salvar URL no banco
    const { error: updateError } = await supabase
      .from('politica_blog_orientacao')
      .update({ narracao_url: audioUrl })
      .eq('id', artigoId);

    if (updateError) {
      console.error('[gerar-narracao-politica] Erro ao atualizar banco:', updateError);
      throw new Error(`Erro ao salvar URL: ${updateError.message}`);
    }

    console.log(`[gerar-narracao-politica] Narração salva com sucesso para artigo ${artigoId}`);

    return new Response(
      JSON.stringify({ success: true, audioUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[gerar-narracao-politica] Erro:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
