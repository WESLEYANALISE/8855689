import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Vozes masculinas do Gemini TTS (português BR)
const VOZ_MASCULINA = 'Orus';

// Frases marcantes para escolher aleatoriamente
const FRASES_MARCANTES = [
  "O direito é a arte do bom e do justo.",
  "Aqui, seu sucesso jurídico começa!",
  "Conhecimento transforma carreiras.",
  "Juntos, vamos conquistar grandes vitórias!",
  "Sua jornada jurídica nunca mais será a mesma.",
  "Bem-vindo ao futuro do Direito!",
  "Prepare-se para evoluir como nunca!",
  "Aqui você encontra o caminho para o sucesso!"
];

async function gerarAudioGeminiTTS(
  texto: string, 
  apiKey: string, 
  voiceName: string
): Promise<Uint8Array | null> {
  console.log(`[boas-vindas-tts] Gerando áudio com voz: ${voiceName}...`);
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: texto }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName
                }
              }
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[boas-vindas-tts] Erro: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const audioBase64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioBase64) {
      console.error('[boas-vindas-tts] Resposta não contém áudio');
      return null;
    }
    
    // Converter base64 para bytes
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log(`[boas-vindas-tts] Áudio gerado: ${bytes.length} bytes`);
    return bytes;
  } catch (error) {
    console.error('[boas-vindas-tts] Exceção:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, user_id } = await req.json();

    if (!nome || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Nome e user_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe áudio de boas-vindas
    const { data: profile } = await supabase
      .from('profiles')
      .select('audio_boas_vindas')
      .eq('id', user_id)
      .single();

    if (profile?.audio_boas_vindas) {
      console.log('[boas-vindas] Áudio já existe, retornando URL existente');
      return new Response(
        JSON.stringify({ url_audio: profile.audio_boas_vindas, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Selecionar frase aleatória
    const fraseAleatoria = FRASES_MARCANTES[Math.floor(Math.random() * FRASES_MARCANTES.length)];
    
    // Extrair primeiro nome
    const primeiroNome = nome.split(' ')[0];
    
    // Montar texto de boas-vindas
    const textoBoasVindas = `Seja muito bem-vindo, ${primeiroNome}! ${fraseAleatoria}`;
    
    console.log(`[boas-vindas] Gerando áudio para: "${textoBoasVindas}"`);

    // Chaves API disponíveis
    const chavesDisponiveis = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
    ].filter(Boolean) as string[];

    if (chavesDisponiveis.length === 0) {
      throw new Error('Nenhuma chave Gemini disponível');
    }

    let audioBytes: Uint8Array | null = null;

    // Tentar gerar áudio com fallback de chaves
    for (const chave of chavesDisponiveis) {
      audioBytes = await gerarAudioGeminiTTS(textoBoasVindas, chave, VOZ_MASCULINA);
      if (audioBytes) break;
      console.log('[boas-vindas] Tentando próxima chave...');
    }

    if (!audioBytes) {
      throw new Error('Falha ao gerar áudio com todas as chaves');
    }

    // Upload para Storage
    const path = `audios/boas-vindas/${user_id}.wav`;
    
    const { error: uploadError } = await supabase.storage
      .from('gerador-imagens')
      .upload(path, audioBytes, {
        contentType: 'audio/wav',
        upsert: true
      });

    if (uploadError) {
      console.error('[boas-vindas] Erro no upload:', uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('gerador-imagens')
      .getPublicUrl(path);

    const audioUrl = urlData.publicUrl;
    console.log(`[boas-vindas] Áudio salvo em: ${audioUrl}`);

    // Salvar URL no perfil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ audio_boas_vindas: audioUrl })
      .eq('id', user_id);

    if (updateError) {
      console.error('[boas-vindas] Erro ao atualizar perfil:', updateError);
    }

    return new Response(
      JSON.stringify({ url_audio: audioUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[boas-vindas] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
