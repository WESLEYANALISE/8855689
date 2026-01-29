import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalizar texto para TTS
function normalizarTextoParaTTS(texto: string): string {
  let normalizado = texto
    .replace(/Art\.\s*(\d+)/gi, 'Artigo $1')
    .replace(/Arts\.\s*(\d+)/gi, 'Artigos $1')
    .replace(/§\s*(\d+)º/g, 'parágrafo $1')
    .replace(/§§/g, 'parágrafos')
    .replace(/§\s*único/gi, 'parágrafo único')
    .replace(/inciso\s+([IVXLCDM]+)/gi, (match, roman) => `inciso ${romanToOrdinal(roman)}`)
    .replace(/alínea\s+"?([a-z])"?/gi, (match, letter) => `alínea ${letter}`)
    .replace(/\bCF\b/g, 'Constituição Federal')
    .replace(/\bCC\b/g, 'Código Civil')
    .replace(/\bCP\b/g, 'Código Penal')
    .replace(/\bCPC\b/g, 'Código de Processo Civil')
    .replace(/\bCPP\b/g, 'Código de Processo Penal')
    .replace(/\bCLT\b/g, 'Consolidação das Leis do Trabalho')
    .replace(/\bCDC\b/g, 'Código de Defesa do Consumidor')
    .replace(/\bCTN\b/g, 'Código Tributário Nacional')
    .replace(/\bSTF\b/g, 'Supremo Tribunal Federal')
    .replace(/\bSTJ\b/g, 'Superior Tribunal de Justiça')
    .replace(/\bTST\b/g, 'Tribunal Superior do Trabalho')
    .replace(/\bTJ\b/g, 'Tribunal de Justiça')
    .replace(/\bMP\b/g, 'Ministério Público')
    .replace(/\bOAB\b/g, 'Ordem dos Advogados do Brasil')
    .replace(/(\d+)º/g, '$1º')
    .replace(/(\d+)ª/g, '$1ª')
    .replace(/;/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalizado;
}

// Converter números romanos para texto
function romanToOrdinal(roman: string): string {
  const romanNumerals: { [key: string]: string } = {
    'I': 'primeiro', 'II': 'segundo', 'III': 'terceiro', 'IV': 'quarto',
    'V': 'quinto', 'VI': 'sexto', 'VII': 'sétimo', 'VIII': 'oitavo',
    'IX': 'nono', 'X': 'décimo', 'XI': 'décimo primeiro', 'XII': 'décimo segundo',
    'XIII': 'décimo terceiro', 'XIV': 'décimo quarto', 'XV': 'décimo quinto'
  };
  return romanNumerals[roman.toUpperCase()] || roman;
}

// Função para upload no Supabase Storage
async function uploadParaSupabase(
  supabase: any,
  bytes: Uint8Array,
  bucket: string,
  path: string,
  contentType: string
): Promise<string> {
  console.log(`[upload] Enviando para Supabase Storage: ${bucket}/${path}`)
  
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType,
      upsert: true
    })

  if (uploadError) {
    console.error('[upload] Erro:', uploadError)
    throw new Error(`Erro no upload: ${uploadError.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  console.log(`[upload] URL pública: ${publicUrl}`)
  return publicUrl
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questaoId, enunciado, alternativas, resposta_correta, area } = await req.json();

    if (!questaoId || !enunciado) {
      throw new Error('questaoId e enunciado são obrigatórios');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe comentário completo
    const { data: existingData } = await supabase
      .from('SIMULADO-OAB')
      .select('comentario, url_audio_comentario')
      .eq('id', questaoId)
      .single();

    if (existingData?.comentario && existingData?.url_audio_comentario) {
      console.log(`[gerar-comentario-oab] Comentário já existe para questão ${questaoId}`);
      return new Response(JSON.stringify({
        comentario: existingData.comentario,
        url_audio: existingData.url_audio_comentario,
        cached: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Gerar comentário com IA
    const GEMINI_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    console.log(`[gerar-comentario-oab] Gerando comentário para questão ${questaoId}...`);

    const prompt = `Você é um professor de Direito especializado em preparação para o Exame da OAB.

Analise esta questão e forneça um comentário MUITO BREVE seguindo este formato exato:

**QUESTÃO:**
${enunciado}

**ALTERNATIVAS:**
${alternativas?.map((a: any) => `${a.letra}) ${a.texto}`).join('\n') || ''}

**RESPOSTA CORRETA:** ${resposta_correta}
**ÁREA:** ${area || 'Não especificada'}

**FORMATO OBRIGATÓRIO (siga exatamente):**
**LETRA ${resposta_correta} CORRETA.**

**FUNDAMENTO:** [Mencione o artigo/lei principal em 1 frase curta]

[1-2 frases explicando por que está correta - máximo 50 palavras]

**REGRAS:**
- Máximo 80 palavras no total
- Seja extremamente objetivo e direto
- Não repita o enunciado ou alternativas
- Use negrito apenas para "LETRA X CORRETA" e "FUNDAMENTO"`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[gerar-comentario-oab] Erro Gemini:', errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Muitas requisições. Aguarde alguns segundos e tente novamente.',
          errorCode: 'RATE_LIMITED'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`Erro na API Gemini: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const comentario = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!comentario) {
      throw new Error('IA não retornou comentário');
    }

    console.log(`[gerar-comentario-oab] Comentário gerado com sucesso!`);

    // Gerar áudio do comentário
    console.log(`[gerar-comentario-oab] Gerando áudio...`);
    const TTS_API_KEY = Deno.env.get('GER');
    if (!TTS_API_KEY) {
      throw new Error('GER (TTS API Key) não configurada');
    }

    // Normalizar texto para TTS (remover markdown)
    const textoParaTTS = normalizarTextoParaTTS(
      comentario
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s*/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    );

    const ttsResponse = await fetch(`https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${TTS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: textoParaTTS },
        voice: {
          languageCode: 'pt-BR',
          name: 'pt-BR-Chirp3-HD-Fenrir'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0
        }
      })
    });

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error('[gerar-comentario-oab] Erro TTS:', errText);
      throw new Error(`Erro no TTS: ${ttsResponse.status}`);
    }

    const ttsData = await ttsResponse.json();
    const audioBase64 = ttsData.audioContent;

    // Upload áudio para Supabase Storage
    const audioBlob = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    
    let audioUrl = '';
    try {
      console.log('[gerar-comentario-oab] Enviando áudio para Supabase Storage...');
      const filePath = `oab/${questaoId}_${Date.now()}.mp3`
      audioUrl = await uploadParaSupabase(supabase, audioBlob, 'audios', filePath, 'audio/mpeg')
      console.log(`[gerar-comentario-oab] Áudio enviado: ${audioUrl}`);
    } catch (uploadError) {
      console.error('[gerar-comentario-oab] Erro no upload do áudio:', uploadError);
    }

    // Salvar no banco
    const { error: updateError } = await supabase
      .from('SIMULADO-OAB')
      .update({
        comentario: comentario,
        url_audio_comentario: audioUrl || null
      })
      .eq('id', questaoId);

    if (updateError) {
      console.error('[gerar-comentario-oab] Erro ao salvar:', updateError);
    }

    return new Response(JSON.stringify({
      comentario,
      url_audio: audioUrl || null,
      cached: false
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[gerar-comentario-oab] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
