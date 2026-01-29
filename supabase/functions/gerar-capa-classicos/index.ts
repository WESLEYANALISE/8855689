import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprimir e converter para WebP usando TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[TinyPNG] Comprimindo ${imageBytes.length} bytes e convertendo para WebP...`);
  
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa('api:' + apiKey),
      'Content-Type': 'application/octet-stream',
    },
    body: imageBytes as unknown as BodyInit,
  });

  if (!shrinkResponse.ok) {
    throw new Error(`TinyPNG error: ${shrinkResponse.status}`);
  }

  const result = await shrinkResponse.json();
  const outputUrl = result.output?.url;
  if (!outputUrl) throw new Error('TinyPNG não retornou URL');

  const convertResponse = await fetch(outputUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa('api:' + apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ convert: { type: 'image/webp' } }),
  });

  if (!convertResponse.ok) {
    const fallbackResponse = await fetch(outputUrl);
    return new Uint8Array(await fallbackResponse.arrayBuffer());
  }

  const webpBytes = new Uint8Array(await convertResponse.arrayBuffer());
  const reducao = Math.round((1 - webpBytes.length / imageBytes.length) * 100);
  console.log(`[TinyPNG] WebP: ${imageBytes.length} → ${webpBytes.length} bytes (${reducao}% redução)`);
  
  return webpBytes;
}

// Obter chaves Gemini disponíveis
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const key1 = Deno.env.get('GEMINI_KEY_1');
  const key2 = Deno.env.get('GEMINI_KEY_2');
  const key3 = Deno.env.get('GEMINI_KEY_3');
  
  if (key1) keys.push(key1);
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);
  
  return keys;
}

// Gerar imagem com Gemini usando fallback entre chaves
async function gerarImagemComGemini(prompt: string): Promise<string> {
  const keys = getGeminiKeys();
  
  if (keys.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada');
  }
  
  const modelName = "gemini-2.5-flash-image";
  let lastError: Error | null = null;
  
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      console.log(`[Gemini Imagem] Tentando chave ${i + 1}/${keys.length} com ${modelName}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              role: 'user', 
              parts: [{ text: prompt }] 
            }]
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[Gemini Imagem] Chave ${i + 1} com rate limit, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini Imagem] Erro na chave ${i + 1}:`, response.status, errorText.substring(0, 200));
        continue;
      }

      const data = await response.json();
      
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          console.log(`[Gemini Imagem] Sucesso com chave ${i + 1}`);
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
      
      console.log(`[Gemini Imagem] Chave ${i + 1} não retornou imagem, tentando próxima...`);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Gemini Imagem] Erro na chave ${i + 1}:`, lastError.message);
    }
  }
  
  throw lastError || new Error('Todas as chaves Gemini falharam para geração de imagem');
}

// Criar prompt de imagem baseado no livro clássico
function criarPromptImagemClassicos(tituloLivro: string, tituloTema: string): string {
  // Mapear livros conhecidos para contextos visuais específicos
  const contextoLivro = getContextoVisual(tituloLivro);
  
  return `Create a PHOTOREALISTIC cover image for a chapter of the classic legal/philosophical book.

BOOK TITLE: "${tituloLivro}"
CHAPTER: "${tituloTema}"

🎯 CRITICAL REQUIREMENT: The image MUST visually represent the SPECIFIC CONTENT and THEME of this book. DO NOT create generic legal images.

${contextoLivro}

VISUAL STYLE:
- PHOTOREALISTIC, cinematic quality
- Dramatic lighting with rich shadows
- 16:9 HORIZONTAL format
- High contrast, atmospheric
- Moody, thought-provoking, artistic
- Editorial/magazine cover quality

ABSOLUTELY FORBIDDEN:
- ANY text, letters, words, numbers, typography
- Generic gavels, scales, handshakes
- Cartoonish or illustrated style
- Watermarks or logos
- Generic stock photo compositions

Create a MEMORABLE, ARTISTIC image that captures the ESSENCE and ATMOSPHERE of "${tituloLivro}" and specifically this chapter "${tituloTema}".`;
}

function getContextoVisual(tituloLivro: string): string {
  const titulo = tituloLivro.toLowerCase();
  
  if (titulo.includes('explorador') && titulo.includes('caverna')) {
    return `VISUAL CONTEXT: Dark cave interior, dramatic shadows, survival atmosphere, explorers silhouettes, underground setting, torchlight or lamp glow, rocky textures, claustrophobic mood, moral dilemma atmosphere.`;
  }
  
  if (titulo.includes('processo') || titulo.includes('kafka')) {
    return `VISUAL CONTEXT: Surreal bureaucratic corridors, endless hallways, oppressive architecture, labyrinthine buildings, dark wood panels, overwhelming paperwork, Kafkaesque atmosphere, sense of helplessness.`;
  }
  
  if (titulo.includes('mercador') && titulo.includes('veneza')) {
    return `VISUAL CONTEXT: Venice canals at twilight, Renaissance architecture, merchant ships, golden light reflecting on water, ornate Venetian buildings, dramatic courtroom scene, scales of justice with flesh imagery.`;
  }
  
  if (titulo.includes('príncipe') || titulo.includes('maquiavel')) {
    return `VISUAL CONTEXT: Renaissance palace, throne room, political intrigue, chess pieces as metaphor, crown and dagger, Italian Renaissance architecture, power and strategy symbols, Florentine atmosphere.`;
  }
  
  if (titulo.includes('república') || titulo.includes('platão')) {
    return `VISUAL CONTEXT: Ancient Greek agora, classical columns, philosophical discussion, cave with shadows (allegory), sunlight breaking through, Mediterranean architecture, wisdom and knowledge symbols.`;
  }
  
  if (titulo.includes('leviatã') || titulo.includes('hobbes')) {
    return `VISUAL CONTEXT: Massive sea monster emerging from waters, crown and sword symbolism, social contract imagery, stormy seas, powerful state imagery, baroque atmosphere.`;
  }
  
  if (titulo.includes('espírito') && titulo.includes('leis')) {
    return `VISUAL CONTEXT: Enlightenment era library, French classical architecture, globe and maps, quill and parchment, balance of powers symbolism, 18th century atmosphere.`;
  }
  
  // Default para livros jurídicos clássicos
  return `VISUAL CONTEXT: Classic library setting, antique legal texts, atmospheric lighting, scholarly atmosphere, vintage legal documents, philosophical contemplation, timeless knowledge imagery.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { temaId, tituloLivro, tituloTema } = await req.json();

    if (!temaId) {
      return new Response(
        JSON.stringify({ error: 'temaId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar tema se não recebemos os títulos
    let livroTitulo = tituloLivro;
    let temaTitulo = tituloTema;
    
    if (!livroTitulo || !temaTitulo) {
      const { data: tema, error: temaError } = await supabase
        .from('biblioteca_classicos_temas')
        .select('*, livro_id')
        .eq('id', temaId)
        .single();

      if (temaError || !tema) {
        return new Response(
          JSON.stringify({ error: 'Tema não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      temaTitulo = tema.titulo;

      // Se já tem capa, retornar sem gerar
      if (tema.capa_url) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Capa já existe',
            temaId,
            capa_url: tema.capa_url
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar título do livro
      const { data: livro } = await supabase
        .from('BIBLIOTECA-CLASSICOS')
        .select('livro')
        .eq('id', tema.livro_id)
        .single();

      livroTitulo = livro?.livro || 'Livro Clássico';
    }

    console.log(`[Capa Clássicos] Gerando para: ${livroTitulo} - ${temaTitulo} (ID: ${temaId})`);

    const prompt = criarPromptImagemClassicos(livroTitulo, temaTitulo);

    // Gerar imagem
    const imageBase64 = await gerarImagemComGemini(prompt);

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const originalBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Comprimir para WebP
    let finalBuffer: Uint8Array = originalBuffer;
    if (TINYPNG_API_KEY) {
      try {
        finalBuffer = await comprimirParaWebP(originalBuffer, TINYPNG_API_KEY);
      } catch (e) {
        console.error('[TinyPNG] Falha na compressão, usando original:', e);
        finalBuffer = originalBuffer;
      }
    }

    // Upload para storage
    const fileName = `classicos-tema-${temaId}-${Date.now()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from('gerador-imagens')
      .upload(fileName, finalBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('gerador-imagens')
      .getPublicUrl(fileName);

    const capaUrl = urlData.publicUrl;

    // Atualizar tema com a URL da capa
    const { error: updateError } = await supabase
      .from('biblioteca_classicos_temas')
      .update({ capa_url: capaUrl })
      .eq('id', temaId);

    if (updateError) {
      console.error('[Capa Clássicos] Erro ao atualizar tema:', updateError);
    }

    console.log(`[Capa Clássicos] ✅ Capa gerada: ${capaUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        temaId,
        capa_url: capaUrl,
        tamanho: finalBuffer.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Capa Clássicos] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
