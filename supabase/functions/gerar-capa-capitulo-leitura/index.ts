import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');

// Gerar imagem com chaves diretas do Google (fallback rotativo)
async function gerarImagemGemini(prompt: string): Promise<string | null> {
  const API_KEYS = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
    Deno.env.get('DIREITO_PREMIUM_API_KEY')
  ].filter(Boolean);

  console.log(`[gerar-capa-capitulo] Tentando ${API_KEYS.length} chaves Gemini disponíveis`);

  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      console.log(`[gerar-capa-capitulo] Tentando chave ${i + 1}...`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${API_KEYS[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"]
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`[gerar-capa-capitulo] Chave ${i + 1} falhou: ${response.status} - ${errorText.substring(0, 200)}`);
        continue;
      }

      const data = await response.json();

      for (const part of data.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          console.log(`[gerar-capa-capitulo] ✅ Sucesso com chave ${i + 1}`);
          return part.inlineData.data;
        }
      }

      console.log(`[gerar-capa-capitulo] Chave ${i + 1}: resposta sem imagem`);
    } catch (err) {
      console.log(`[gerar-capa-capitulo] Chave ${i + 1} erro:`, err);
      continue;
    }
  }

  console.error('[gerar-capa-capitulo] Todas as chaves falharam');
  return null;
}

// Comprimir e converter para WebP
async function comprimirImagemTinyPNG(base64Data: string): Promise<{ data: Uint8Array; contentType: string } | null> {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  if (!TINYPNG_API_KEY) {
    console.log('TinyPNG API key não configurada, retornando imagem original');
    return { data: bytes, contentType: 'image/png' };
  }

  try {
    console.log('Comprimindo imagem com TinyPNG...');

    const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`,
        'Content-Type': 'image/png'
      },
      body: bytes
    });

    if (!shrinkResponse.ok) {
      console.error('Erro ao comprimir:', await shrinkResponse.text());
      return { data: bytes, contentType: 'image/png' };
    }

    const shrinkData = await shrinkResponse.json();
    console.log('Imagem comprimida, convertendo para WebP...');

    // Converter para WebP
    const convertResponse = await fetch(shrinkData.output.url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ convert: { type: "image/webp" } })
    });

    if (!convertResponse.ok) {
      console.log('Falha na conversão WebP, usando PNG comprimido');
      const pngResponse = await fetch(shrinkData.output.url);
      const pngData = await pngResponse.arrayBuffer();
      return { data: new Uint8Array(pngData), contentType: 'image/png' };
    }

    const webpData = await convertResponse.arrayBuffer();
    console.log('Conversão para WebP concluída!');
    return { data: new Uint8Array(webpData), contentType: 'image/webp' };
  } catch (error) {
    console.error('Erro no TinyPNG:', error);
    return { data: bytes, contentType: 'image/png' };
  }
}

// Detectar época do livro com base no autor/título
function detectarEpoca(livroTitulo: string, autor?: string): { periodo: string; estilo: string } {
  const titulo = livroTitulo.toLowerCase();
  const nomeAutor = autor?.toLowerCase() || '';
  
  // Autores e obras clássicas
  if (nomeAutor.includes('beccaria') || titulo.includes('delitos') || titulo.includes('penas')) {
    return { 
      periodo: 'Iluminismo italiano do século XVIII (1764)',
      estilo: 'oil painting style, baroque lighting, classical European architecture, candlelit interiors, period-accurate 18th century setting'
    };
  }
  if (nomeAutor.includes('platão') || titulo.includes('república')) {
    return {
      periodo: 'Grécia Antiga (século IV a.C.)',
      estilo: 'ancient Greek marble columns, Mediterranean sunlight, classical antiquity, toga-clad figures in silhouette, olive trees'
    };
  }
  if (nomeAutor.includes('aristóteles') || titulo.includes('ética') || titulo.includes('nicômaco')) {
    return {
      periodo: 'Grécia Antiga (século IV a.C.)',
      estilo: 'Lyceum of Athens atmosphere, ancient scrolls, Mediterranean marble, classical Greek architecture'
    };
  }
  if (nomeAutor.includes('maquiavel') || titulo.includes('príncipe')) {
    return {
      periodo: 'Renascimento italiano (século XVI)',
      estilo: 'Renaissance Florence, Italian palazzos, dramatic chiaroscuro, Medici-era architecture, rich Renaissance colors'
    };
  }
  if (nomeAutor.includes('hobbes') || titulo.includes('leviatã')) {
    return {
      periodo: 'Inglaterra do século XVII (1651)',
      estilo: 'English Civil War era, dramatic stormy skies, baroque oil painting style, 17th century England'
    };
  }
  if (nomeAutor.includes('rousseau') || titulo.includes('contrato social')) {
    return {
      periodo: 'Iluminismo francês (século XVIII)',
      estilo: 'French Enlightenment salons, candlelit philosophical gatherings, pre-revolutionary France, neoclassical interiors'
    };
  }
  if (nomeAutor.includes('sun tzu') || titulo.includes('arte da guerra')) {
    return {
      periodo: 'China Antiga (século V a.C.)',
      estilo: 'ancient Chinese warfare, misty bamboo forests, traditional Chinese ink wash painting style, terracotta warriors'
    };
  }
  if (nomeAutor.includes('marco aurélio') || titulo.includes('meditações')) {
    return {
      periodo: 'Roma Imperial (século II d.C.)',
      estilo: 'Roman Empire grandeur, marble Roman architecture, stoic Roman generals, ancient Rome at dusk'
    };
  }
  if (nomeAutor.includes('dostoiévski') || titulo.includes('crime') && titulo.includes('castigo')) {
    return {
      periodo: 'Rússia Imperial (século XIX)',
      estilo: '19th century St. Petersburg, Russian imperial architecture, snowy winter scenes, Dostoevsky-era atmosphere'
    };
  }
  if (nomeAutor.includes('orwell') || titulo.includes('1984')) {
    return {
      periodo: 'Distopia futurista (1949)',
      estilo: 'dystopian brutalist architecture, oppressive surveillance state, grey industrial atmosphere, totalitarian imagery'
    };
  }
  if (nomeAutor.includes('sandel') || titulo.includes('justiça')) {
    return {
      periodo: 'Filosofia contemporânea (século XXI)',
      estilo: 'modern Harvard lecture halls, contemporary philosophical debate, warm academic lighting, modern university setting'
    };
  }
  if (nomeAutor.includes('fuller') || titulo.includes('exploradores') || titulo.includes('cavernas')) {
    return {
      periodo: 'Filosofia do Direito (1949)',
      estilo: 'dramatic courtroom scenes, American mid-century legal drama, noir lighting, judicial deliberation atmosphere'
    };
  }
  
  // Default para obras não identificadas
  return {
    periodo: 'clássico atemporal',
    estilo: 'classical library setting, leather-bound books, warm ambient lighting, scholarly atmosphere'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { livroTitulo, capituloTitulo, numeroCapitulo, paginaId, autorLivro, forceRegenerate } = await req.json();
    
    if (!livroTitulo || !capituloTitulo) {
      return new Response(
        JSON.stringify({ error: 'livroTitulo e capituloTitulo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[gerar-capa-capitulo] Gerando capa para: "${capituloTitulo}" do livro "${livroTitulo}" (autor: ${autorLivro || 'desconhecido'})`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Se forceRegenerate, apagar capa existente
    if (forceRegenerate) {
      console.log('[gerar-capa-capitulo] Force regenerate ativado - apagando capa existente...');
      
      // Buscar URL atual para deletar do storage
      const { data: existente } = await supabase
        .from('leitura_paginas_formatadas')
        .select('url_capa_capitulo')
        .eq('livro_titulo', livroTitulo)
        .eq('capitulo_titulo', capituloTitulo)
        .eq('is_chapter_start', true)
        .not('url_capa_capitulo', 'is', null)
        .limit(1)
        .single();

      if (existente?.url_capa_capitulo) {
        // Extrair path do storage da URL
        const urlParts = existente.url_capa_capitulo.split('/gerador-imagens/');
        if (urlParts[1]) {
          const filePath = decodeURIComponent(urlParts[1]);
          console.log('[gerar-capa-capitulo] Deletando arquivo:', filePath);
          await supabase.storage.from('gerador-imagens').remove([filePath]);
        }
        
        // Limpar URL no banco
        await supabase
          .from('leitura_paginas_formatadas')
          .update({ url_capa_capitulo: null })
          .eq('livro_titulo', livroTitulo)
          .eq('capitulo_titulo', capituloTitulo)
          .eq('is_chapter_start', true);
      }
    } else {
      // Verificar se já existe capa para este capítulo
      const { data: existente } = await supabase
        .from('leitura_paginas_formatadas')
        .select('url_capa_capitulo')
        .eq('livro_titulo', livroTitulo)
        .eq('capitulo_titulo', capituloTitulo)
        .eq('is_chapter_start', true)
        .not('url_capa_capitulo', 'is', null)
        .limit(1)
        .single();

      if (existente?.url_capa_capitulo) {
        console.log('[gerar-capa-capitulo] Capítulo já possui capa, retornando existente');
        return new Response(
          JSON.stringify({ imagem_url: existente.url_capa_capitulo, fromCache: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Detectar época e estilo visual baseado no livro/autor
    const { periodo, estilo } = detectarEpoca(livroTitulo, autorLivro);
    console.log(`[gerar-capa-capitulo] Período detectado: ${periodo}`);

    // Prompt cinematográfico contextualizado com época do livro
    const prompt = `Generate a photorealistic 16:9 cinematic photograph for the chapter titled "${capituloTitulo}" from the book "${livroTitulo}"${autorLivro ? ` by ${autorLivro}` : ''}.

HISTORICAL CONTEXT: This book is from ${periodo}. The visual MUST reflect this time period accurately.

VISUAL STYLE REQUIREMENTS:
- ${estilo}
- Ultra high resolution 8K cinematic photography
- Dramatic lighting with natural light sources appropriate to the era
- Rich, moody color palette with period-accurate tones
- The image MUST fill the entire frame edge-to-edge (no letterboxing, no black bars)

COMPOSITION FOR CHAPTER "${capituloTitulo}":
- Create a symbolic visual representation of this chapter's theme
- If the chapter mentions a person (author biography, vote, etc.): show a period-accurate silhouette from behind, dramatic backlight
- If about law/justice: period-appropriate courtroom or legal setting
- If philosophical: contemplative scene with books, candles, or scholarly elements
- The atmosphere should match both the chapter topic AND the book's historical period

ABSOLUTELY FORBIDDEN:
- Any text, watermarks, logos, titles, or letters
- Modern elements (unless the book is contemporary)
- Identifiable human faces
- Cartoon, illustration, or digital art style
- Black bars, letterboxing, or any empty space - the image MUST fill the entire frame

Create an evocative, historically-accurate scene that captures the essence of "${capituloTitulo}" in the context of "${livroTitulo}".`;

    const base64Image = await gerarImagemGemini(prompt);
    
    if (!base64Image) {
      return new Response(
        JSON.stringify({ error: 'Falha ao gerar imagem - todas as chaves falharam' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Comprimir e converter
    const processedImage = await comprimirImagemTinyPNG(base64Image);
    
    if (!processedImage) {
      return new Response(
        JSON.stringify({ error: 'Falha ao processar imagem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload para Supabase Storage
    const extension = processedImage.contentType === 'image/webp' ? 'webp' : 'png';
    const safeTitle = livroTitulo.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
    const safeChapter = capituloTitulo.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
    const fileName = `leitura-dinamica/${safeTitle}/cap-${numeroCapitulo || 1}-${safeChapter}-${Date.now()}.${extension}`;
    
    console.log('[gerar-capa-capitulo] Fazendo upload para:', fileName);
    
    const { error: uploadError } = await supabase.storage
      .from('gerador-imagens')
      .upload(fileName, processedImage.data, {
        contentType: processedImage.contentType,
        upsert: true
      });

    if (uploadError) {
      console.error('[gerar-capa-capitulo] Erro no upload:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Falha ao salvar imagem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('gerador-imagens')
      .getPublicUrl(fileName);

    const imagemUrl = urlData.publicUrl;
    console.log('[gerar-capa-capitulo] ✅ Imagem salva:', imagemUrl);

    // Atualizar todas as páginas deste capítulo com a URL da capa
    const { error: updateError } = await supabase
      .from('leitura_paginas_formatadas')
      .update({ url_capa_capitulo: imagemUrl })
      .eq('livro_titulo', livroTitulo)
      .eq('capitulo_titulo', capituloTitulo)
      .eq('is_chapter_start', true);

    if (updateError) {
      console.error('[gerar-capa-capitulo] Erro ao atualizar banco:', updateError);
    }

    return new Response(
      JSON.stringify({ imagem_url: imagemUrl, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-capa-capitulo] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
