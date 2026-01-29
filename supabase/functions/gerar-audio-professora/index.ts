import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || text.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Texto muito curto para gerar áudio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave API Gemini configurada');
    }

    // Limitar texto a 5000 caracteres
    const truncatedText = text.substring(0, 5000);
    
    console.log('Gerando áudio via Gemini TTS API REST...');
    
    let lastError: Error | null = null;
    
    for (const apiKey of API_KEYS) {
      try {
        const audioBase64 = await generateAudioWithTTS(apiKey, truncatedText);
        
        console.log('✅ Áudio gerado com sucesso via TTS API');
        
        return new Response(
          JSON.stringify({ 
            audioBase64,
            mimeType: 'audio/wav'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error(`Erro com chave API:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }
    
    throw lastError || new Error('Todas as chaves API falharam');

  } catch (error) {
    console.error('Erro gerar-audio-professora:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro ao gerar áudio';
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateAudioWithTTS(apiKey: string, text: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
  
  // Usar snake_case conforme documentação oficial da API
  const requestBody = {
    contents: [{
      parts: [{
        text: text // Texto direto, a voz já tem estilo próprio
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

  console.log('Enviando request para TTS API...');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('TTS API error:', response.status, errorText);
    throw new Error(`TTS API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('TTS API response received');

  // Extrair dados de áudio da resposta
  const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!audioData) {
    console.error('Response structure:', JSON.stringify(data, null, 2));
    throw new Error('Nenhum áudio na resposta da API');
  }

  return audioData;
}
