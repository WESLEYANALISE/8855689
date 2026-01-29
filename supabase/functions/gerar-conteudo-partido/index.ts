import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gemini API keys com fallback
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean);

async function callGeminiWithFallback(prompt: string): Promise<string> {
  for (const apiKey of GEMINI_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
          }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      if (response.status === 429 || response.status === 503) continue;
    } catch (error) {
      console.error('Gemini API error:', error);
    }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

async function buscarWikipedia(termo: string): Promise<{ conteudo: string; imagem?: string }> {
  try {
    // Buscar na Wikipedia em português
    const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&utf8=1`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.query?.search?.length) {
      return { conteudo: '' };
    }
    
    const pageTitle = searchData.query.search[0].title;
    
    // Buscar conteúdo da página
    const contentUrl = `https://pt.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=extracts|pageimages&exintro=false&explaintext=true&pithumbsize=500&format=json&utf8=1`;
    const contentResponse = await fetch(contentUrl);
    const contentData = await contentResponse.json();
    
    const pages = contentData.query?.pages;
    const page = pages ? Object.values(pages)[0] as any : null;
    
    return {
      conteudo: page?.extract || '',
      imagem: page?.thumbnail?.source
    };
  } catch (error) {
    console.error('Erro ao buscar Wikipedia:', error);
    return { conteudo: '' };
  }
}

async function gerarNarracao(texto: string): Promise<string | null> {
  try {
    const googleTtsApiKey = Deno.env.get('GOOGLE_TTS_API_KEY');
    if (!googleTtsApiKey) return null;

    // Limitar texto para narração
    const textoLimitado = texto.substring(0, 4000);
    
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTtsApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: textoLimitado },
          voice: {
            languageCode: 'pt-BR',
            name: 'pt-BR-Wavenet-B',
            ssmlGender: 'FEMALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0
          }
        })
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.audioContent) return null;

    // Upload para Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const audioBuffer = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));
    const fileName = `partidos/narracao_${Date.now()}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from('audios')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Erro upload áudio:', uploadError);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('audios')
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Erro ao gerar narração:', error);
    return null;
  }
}

async function gerarCapa(sigla: string, nome: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const tinypngKey = Deno.env.get('TINYPNG_API_KEY');

    // Usar Gemini para gerar a imagem
    const apiKey = GEMINI_KEYS[0];
    if (!apiKey) return null;

    const prompt = `Create a professional, modern political party banner image for "${nome}" (${sigla}) Brazilian political party. 
    The image should be symbolic and representative of politics in Brazil, featuring:
    - Abstract patriotic Brazilian colors (green, yellow, blue) in a subtle way
    - Professional and institutional aesthetic
    - NO TEXT, NO LETTERS, NO WORDS on the image
    - Clean, modern design suitable for a political article header
    - 16:9 aspect ratio composition
    Ultra high resolution.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        })
      }
    );

    if (!response.ok) {
      console.error('Erro Gemini image:', await response.text());
      return null;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
    
    if (!imagePart?.inlineData?.data) return null;

    let imageBuffer = Uint8Array.from(atob(imagePart.inlineData.data), c => c.charCodeAt(0));

    // Comprimir com TinyPNG
    if (tinypngKey) {
      try {
        const compressResponse = await fetch('https://api.tinify.com/shrink', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`api:${tinypngKey}`)}`,
            'Content-Type': 'image/png'
          },
          body: imageBuffer
        });

        if (compressResponse.ok) {
          const compressData = await compressResponse.json();
          const convertResponse = await fetch(compressData.output.url, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`api:${tinypngKey}`)}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ convert: { type: 'image/webp' } })
          });
          
          if (convertResponse.ok) {
            imageBuffer = new Uint8Array(await convertResponse.arrayBuffer());
          }
        }
      } catch (e) {
        console.error('Erro TinyPNG:', e);
      }
    }

    const fileName = `partidos/capa_${sigla.toLowerCase()}_${Date.now()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from('CAPAS')
      .upload(fileName, imageBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error('Erro upload capa:', uploadError);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('CAPAS')
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Erro ao gerar capa:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partidoId, sigla, nome } = await req.json();

    if (!sigla || !nome) {
      throw new Error('Sigla e nome são obrigatórios');
    }

    console.log(`Gerando conteúdo para ${sigla} - ${nome}`);

    // 1. Buscar na Wikipedia
    const termosBusca = [`${nome} partido político`, `${sigla} partido Brasil`];
    let wikipediaContent = '';
    let wikipediaImage: string | undefined;

    for (const termo of termosBusca) {
      const wiki = await buscarWikipedia(termo);
      if (wiki.conteudo && wiki.conteudo.length > wikipediaContent.length) {
        wikipediaContent = wiki.conteudo;
        wikipediaImage = wiki.imagem;
      }
    }

    console.log(`Wikipedia encontrado: ${wikipediaContent.length} caracteres`);

    // 2. Reformular com Gemini
    const promptReformulacao = `
Você é um jornalista político especializado em partidos brasileiros.

Com base nas informações abaixo sobre o partido ${sigla} (${nome}), crie um artigo completo, informativo e acessível em português brasileiro.

INFORMAÇÕES DA WIKIPEDIA:
${wikipediaContent || 'Informações não encontradas na Wikipedia. Crie conteúdo baseado em conhecimento geral sobre partidos políticos brasileiros.'}

ESTRUTURA DO ARTIGO:
## Sobre o ${sigla}
(Introdução geral sobre o partido)

## História e Fundação
(Quando foi fundado, contexto histórico, fundadores importantes)

## Ideologia e Posicionamento
(Espectro político, principais bandeiras, posicionamento em questões-chave)

## Principais Lideranças
(Figuras importantes do partido ao longo da história)

## Representação no Congresso
(Presença histórica e atual na Câmara e Senado)

## Fatos Relevantes
(Momentos marcantes, conquistas, participação em governos)

REGRAS:
- Linguagem clara e acessível
- Seja objetivo e imparcial
- Cite fatos históricos relevantes
- Mantenha um tom jornalístico profissional
- Não invente informações - se não souber, omita
- Use formatação Markdown
`;

    const conteudo = await callGeminiWithFallback(promptReformulacao);
    console.log(`Conteúdo gerado: ${conteudo.length} caracteres`);

    // 3. Gerar capa
    console.log('Gerando capa...');
    const urlCapa = await gerarCapa(sigla, nome);
    console.log(`Capa: ${urlCapa ? 'gerada' : 'não gerada'}`);

    // 4. Gerar narração
    console.log('Gerando narração...');
    const textoNarracao = conteudo
      .replace(/##/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .substring(0, 4000);
    
    const urlAudio = await gerarNarracao(textoNarracao);
    console.log(`Áudio: ${urlAudio ? 'gerado' : 'não gerado'}`);

    return new Response(
      JSON.stringify({
        conteudo,
        url_capa: urlCapa || wikipediaImage,
        url_audio: urlAudio,
        fonte: wikipediaContent ? 'wikipedia' : 'gemini'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
