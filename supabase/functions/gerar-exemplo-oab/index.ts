import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para gerar imagem com Gemini
async function gerarImagemComGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["image", "text"],
          responseMimeType: "text/plain"
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[gerar-exemplo-oab] Erro na API Gemini Image: ${response.status}`, errorText);
    throw new Error(`GEMINI_ERROR_${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return part.inlineData.data;
    }
  }
  
  throw new Error('Imagem não gerada pela IA');
}

async function gerarImagemComFallback(prompt: string, primaryKey: string, reservaKey?: string): Promise<string> {
  try {
    console.log('[gerar-exemplo-oab] Tentando gerar imagem com chave primária...');
    const result = await gerarImagemComGemini(prompt, primaryKey);
    console.log('[gerar-exemplo-oab] Sucesso com chave primária');
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('429') && reservaKey) {
      console.log('[gerar-exemplo-oab] Cota excedida! Tentando com chave de reserva...');
      try {
        const result = await gerarImagemComGemini(prompt, reservaKey);
        console.log('[gerar-exemplo-oab] Sucesso com chave de reserva!');
        return result;
      } catch (reservaError) {
        const reservaErrorMsg = reservaError instanceof Error ? reservaError.message : String(reservaError);
        if (reservaErrorMsg.includes('429')) {
          throw new Error('Cota excedida em ambas as chaves. Tente novamente mais tarde.');
        }
        throw reservaError;
      }
    }
    
    throw error;
  }
}

// Upload para Supabase Storage
async function uploadToStorage(supabase: any, bucket: string, path: string, data: Uint8Array, contentType: string): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, data, {
      contentType,
      upsert: true
    });

  if (error) {
    throw new Error(`Erro no upload para Storage: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questaoId, enunciado, comentario, area } = await req.json();

    if (!questaoId || !enunciado) {
      throw new Error('questaoId e enunciado são obrigatórios');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe exemplo
    const { data: existingData } = await supabase
      .from('SIMULADO-OAB')
      .select('exemplo_pratico, url_audio_exemplo, url_imagem_exemplo')
      .eq('id', questaoId)
      .single();

    if (existingData?.exemplo_pratico && existingData?.url_audio_exemplo) {
      console.log(`[gerar-exemplo-oab] Exemplo já existe para questão ${questaoId}`);
      return new Response(JSON.stringify({
        exemplo: existingData.exemplo_pratico,
        url_audio: existingData.url_audio_exemplo,
        url_imagem: existingData.url_imagem_exemplo,
        cached: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    console.log(`[gerar-exemplo-oab] Gerando exemplo prático para questão ${questaoId}...`);

    // Gerar exemplo prático com IA (Gemini direto)
    const promptExemplo = `Você é um professor de Direito especializado em preparação para o Exame da OAB.

Crie um EXEMPLO PRÁTICO que ilustre o conceito jurídico cobrado nesta questão.

QUESTÃO:
${enunciado}

${comentario ? `COMENTÁRIO DA QUESTÃO:\n${comentario}` : ''}

ÁREA: ${area || 'Não especificada'}

Crie um exemplo prático e realista que ajude o estudante a memorizar e entender o conceito. 
Use nomes brasileiros comuns e situações do dia a dia.
O exemplo deve ter no máximo 2 parágrafos e ser fácil de visualizar mentalmente.`;

    const exemploResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptExemplo }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!exemploResponse.ok) {
      const errorText = await exemploResponse.text();
      console.error('[gerar-exemplo-oab] Erro Gemini:', errorText);
      throw new Error(`Erro na API Gemini: ${exemploResponse.status}`);
    }

    const exemploData = await exemploResponse.json();
    const exemplo = exemploData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!exemplo) {
      throw new Error('IA não retornou exemplo');
    }

    console.log(`[gerar-exemplo-oab] Exemplo gerado com sucesso!`);

    // Gerar áudio do exemplo
    console.log(`[gerar-exemplo-oab] Gerando áudio...`);
    const GOOGLE_TTS_API_KEY = Deno.env.get('GER');
    if (!GOOGLE_TTS_API_KEY) {
      throw new Error('GER não configurada');
    }

    const ttsResponse = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: `Exemplo prático. ${exemplo}` },
        voice: {
          languageCode: 'pt-BR',
          name: 'pt-BR-Neural2-A',
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.1,
          pitch: 0.5
        }
      })
    });

    if (!ttsResponse.ok) {
      throw new Error(`Erro no TTS: ${ttsResponse.status}`);
    }

    const ttsData = await ttsResponse.json();
    const audioBase64 = ttsData.audioContent;

    // Upload áudio para Supabase Storage
    const audioBlob = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    const audioPath = `exemplos-oab/audio_${questaoId}_${Date.now()}.mp3`;
    
    let urlAudio = '';
    try {
      urlAudio = await uploadToStorage(supabase, 'pdfs-educacionais', audioPath, audioBlob, 'audio/mp3');
      console.log(`[gerar-exemplo-oab] Áudio enviado para Storage: ${urlAudio}`);
    } catch (uploadError) {
      console.error('[gerar-exemplo-oab] Erro no upload do áudio:', uploadError);
    }

    // Gerar imagem ilustrativa
    let urlImagem = '';
    try {
      console.log(`[gerar-exemplo-oab] Gerando imagem...`);
      const RESERVA_API_KEY = Deno.env.get('RESERVA_API_KEY');

      const promptImagem = `Create a professional FLAT 2D editorial illustration for Brazilian legal education.

SCENE TO ILLUSTRATE:
${exemplo.substring(0, 500)}

LEGAL AREA: ${area || 'Direito'}

=== MANDATORY STYLE SPECIFICATIONS ===
- Style: Professional FLAT 2D editorial illustration (like The Economist, Harvard Business Review, Wall Street Journal)
- Format: WIDE 16:9 horizontal landscape orientation (width approximately 1.78x height)
- Colors: Professional muted palette - navy blue (#1a365d), teal (#0d9488), burgundy (#7f1d1d), gold accents (#d97706), warm neutrals
- Lighting: Soft, even, professional studio lighting with no harsh shadows
- Quality: Ultra high resolution, sharp details, professional finish

=== ANTI-DISTORTION RULES (CRITICAL - MUST FOLLOW) ===
HUMAN ANATOMY - CORRECT PROPORTIONS ONLY:
- Head-to-body ratio: Normal adult proportions (1:7 or 1:8 ratio)
- Hands: EXACTLY 5 fingers per hand, natural finger lengths and positions, NO merged or extra fingers, NO webbed fingers
- Faces: Symmetrical features, proportional eyes/nose/mouth, natural expressions, normal-sized eyes (NOT anime or cartoon oversized)
- Arms: Correct length (fingertips reach mid-thigh when relaxed), proper elbow and wrist joints
- Legs: Proportional length, proper knee joints, feet facing correct direction

FORBIDDEN DISTORTIONS:
- NO duplicate or merged body parts
- NO extra limbs, fingers, or facial features
- NO warped, stretched, or melted-looking elements
- NO surreal or impossible anatomical configurations
- NO floating or disconnected body parts
- NO blurred or unclear faces

=== CHARACTER GUIDELINES ===
- Adult Brazilian professionals with REALISTIC proportions
- Appropriate professional attire for legal/business context (suits, formal wear)
- Natural, contextual facial expressions appropriate to the legal scene
- Clear, distinct individuals - no merged or blurred figures
- Skin tones reflecting Brazilian diversity

=== TEXT RULES (MANDATORY) ===
- STRONGLY PREFERRED: No text in the image at all
- IF text is absolutely necessary: MUST be in BRAZILIAN PORTUGUESE and in UPPERCASE (CAIXA ALTA)
- Acceptable text examples: "CONTRATO", "TRIBUNAL", "JUSTIÇA", "ADVOCACIA", "SENTENÇA"
- Text must be legible, properly spelled, and naturally integrated
- STRICTLY FORBIDDEN: Any English text whatsoever

=== COMPOSITION ===
- Clear focal point with main subject prominently placed
- Professional background appropriate to legal/office/courtroom context
- Clean, uncluttered layout with balanced visual weight
- Proper perspective and spatial relationships

OUTPUT: High-quality professional FLAT 2D editorial illustration suitable for adult legal education in Brazil.`;

      const imageBase64 = await gerarImagemComFallback(promptImagem, DIREITO_PREMIUM_API_KEY, RESERVA_API_KEY);
      
      const binaryString = atob(imageBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const imagePath = `exemplos-oab/img_${questaoId}_${Date.now()}.png`;
      urlImagem = await uploadToStorage(supabase, 'pdfs-educacionais', imagePath, bytes, 'image/png');
      console.log(`[gerar-exemplo-oab] Imagem enviada para Storage: ${urlImagem}`);
    } catch (imgError) {
      console.error('[gerar-exemplo-oab] Erro ao gerar/enviar imagem:', imgError);
    }

    // Salvar no banco
    const { error: updateError } = await supabase
      .from('SIMULADO-OAB')
      .update({
        exemplo_pratico: exemplo,
        url_audio_exemplo: urlAudio || null,
        url_imagem_exemplo: urlImagem || null
      })
      .eq('id', questaoId);

    if (updateError) {
      console.error('[gerar-exemplo-oab] Erro ao salvar:', updateError);
    }

    return new Response(JSON.stringify({
      exemplo,
      url_audio: urlAudio || null,
      url_imagem: urlImagem || null,
      cached: false
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[gerar-exemplo-oab] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
