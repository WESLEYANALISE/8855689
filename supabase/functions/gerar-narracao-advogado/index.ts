import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

// Normalizar texto para TTS
function normalizarTextoParaTTS(texto: string): string {
  return texto
    // Remover markdown
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[-*]\s/g, '')
    // Remover parênteses com referências
    .replace(/\s*\((?:[^)]*(?:Redação|Incluído|Revogado|Alterado|Acrescentado|Suprimido|Vide|NR|Lei\s*n[ºo°]|EC\s*n[ºo°]|Decreto|Emenda)[^)]*)\)/gi, '')
    // Expandir abreviações
    .replace(/\bArt\.\s?(\d+)/gi, 'Artigo $1')
    .replace(/\barts\.\s?/gi, 'artigos ')
    .replace(/\bCF\b/g, 'Constituição Federal')
    .replace(/\bCP\b/g, 'Código Penal')
    .replace(/\bCPC\b/g, 'Código de Processo Civil')
    .replace(/\bCPP\b/g, 'Código de Processo Penal')
    .replace(/\bCC\b/g, 'Código Civil')
    .replace(/\bCLT\b/g, 'Consolidação das Leis do Trabalho')
    .replace(/\bSTF\b/g, 'Supremo Tribunal Federal')
    .replace(/\bSTJ\b/g, 'Superior Tribunal de Justiça')
    .replace(/\bTJ\b/g, 'Tribunal de Justiça')
    .replace(/\bOAB\b/g, 'Ordem dos Advogados do Brasil')
    // Limpar espaços extras
    .replace(/\s+/g, ' ')
    .trim();
}

// Gerar áudio com Gemini 2.5 Flash TTS
async function gerarAudioGeminiTTS(texto: string, chavesDisponiveis: string[]): Promise<string> {
  // Limitar texto a 5000 caracteres
  const textoLimitado = texto.slice(0, 5000);
  
  for (const chave of chavesDisponiveis) {
    try {
      console.log('Tentando Gemini 2.5 Flash TTS...');
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${chave}`;
      
      const requestBody = {
        contents: [{
          parts: [{
            text: textoLimitado
          }]
        }],
        generationConfig: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: "Kore" // Voz feminina clara
              }
            }
          }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Erro Gemini TTS:', response.status, errorText);
        continue;
      }

      const data = await response.json();
      const audioBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (audioBase64) {
        console.log('✅ Áudio gerado com sucesso via Gemini 2.5 Flash TTS');
        return audioBase64;
      }
    } catch (error) {
      console.error('Erro com Gemini TTS:', error);
      continue;
    }
  }
  throw new Error('Todas as chaves falharam para TTS');
}

// Upload para Supabase Storage
async function uploadParaSupabase(
  supabase: any,
  bytes: Uint8Array,
  bucket: string,
  path: string,
  contentType: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto, ordem } = await req.json();

    if (!texto || !ordem) {
      return new Response(
        JSON.stringify({ error: 'Texto e ordem são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave API Gemini configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalizar texto e limitar
    const textoNormalizado = normalizarTextoParaTTS(texto);
    const textoLimitado = textoNormalizado.slice(0, 5000);
    console.log(`Processando texto com ${textoLimitado.length} caracteres`);

    const timestamp = Date.now();

    // Gerar áudio com Gemini 2.5 Flash TTS
    const audioBase64 = await gerarAudioGeminiTTS(textoLimitado, API_KEYS);
    
    // Converter base64 para bytes (Gemini retorna WAV)
    const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    
    const path = `audios/advogado/${ordem}_${timestamp}.wav`;
    const publicUrl = await uploadParaSupabase(supabase, audioBytes, 'audios', path, 'audio/wav');
    
    console.log('Áudio salvo:', publicUrl);

    // Salvar URL no banco
    await supabase
      .from('advogado_blog')
      .update({ url_audio: publicUrl })
      .eq('ordem', ordem);

    console.log('Narração gerada com sucesso via Gemini 2.5 Flash TTS');

    return new Response(
      JSON.stringify({ audioUrls: [publicUrl], success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na geração de narração:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
