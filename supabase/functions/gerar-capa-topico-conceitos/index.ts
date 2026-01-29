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

// Contexto visual por área jurídica (Conceitos)
const contextoVisualPorArea: Record<string, string> = {
  'Introdução ao Direito': 'balança da justiça, toga, martelo de juiz, livros jurídicos antigos, biblioteca de direito',
  'História do Direito': 'pergaminhos medievais, tribunais antigos, documentos históricos, selos de cera, quill pen',
  'Filosofia do Direito': 'pensadores gregos, estátuas clássicas, Sócrates, Platão, reflexão filosófica, colunas gregas',
  'Direito Romano': 'senadores romanos de toga, Coliseu, fórum romano, águia romana, colunas coríntias',
  'Teoria do Estado': 'capitólios, palácios governamentais, bandeiras, poder estatal, instituições',
  'Sociologia Jurídica': 'sociedade, pessoas interagindo, comunidade, relações sociais, cidade moderna',
  'Hermenêutica Jurídica': 'lupa sobre texto antigo, interpretação, análise de documentos, códigos',
  'Ética Profissional': 'advogado profissional, toga, ética, responsabilidade, decoro',
  'Direitos Humanos': 'mãos unidas de diversas etnias, liberdade, igualdade, dignidade humana, paz mundial',
  'Lógica Jurídica': 'diagramas lógicos, silogismos, raciocínio, argumentação, estrutura mental',
  'default': 'biblioteca jurídica clássica, livros de direito, estudo, conhecimento, educação formal'
};

// Paleta de cores por área
const paletasPorArea: Record<string, string> = {
  'Introdução ao Direito': 'navy blue, gold, cream, classical tones',
  'História do Direito': 'sepia, aged parchment yellow, brown leather, antique gold',
  'Filosofia do Direito': 'deep indigo, marble white, gold accents, classical stone gray',
  'Direito Romano': 'imperial purple, gold, terracotta red, marble white',
  'Teoria do Estado': 'royal blue, patriotic red, institutional gray, white',
  'Sociologia Jurídica': 'urban teal, warm orange, diverse skin tones, modern gray',
  'Hermenêutica Jurídica': 'burgundy, aged paper cream, magnifying glass gold',
  'Ética Profissional': 'black, white, silver, professional navy',
  'Direitos Humanos': 'sky blue, warm earth tones, diverse colors, unity white',
  'Lógica Jurídica': 'clean white, structured blue, geometric gray, accent green',
  'default': 'navy blue, gold, rich mahogany, cream'
};

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

// Gerar imagem com Gemini usando fallback entre chaves - MESMO MÉTODO DA FACULDADE
async function gerarImagemComGemini(prompt: string): Promise<string> {
  const keys = getGeminiKeys();
  
  if (keys.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada');
  }
  
  // Modelo correto para geração de imagens - MESMO DA FACULDADE
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

// Criar prompt de imagem - ESPECÍFICO AO TEMA DE CONCEITOS (SEM TEXTO)
function criarPromptImagem(titulo: string, materia: string): string {
  const contexto = contextoVisualPorArea[materia] || contextoVisualPorArea['default'];
  const paleta = paletasPorArea[materia] || paletasPorArea['default'];
  
  return `Create a STUNNING, PURELY VISUAL cover image for a legal topic. STRICT 16:9 HORIZONTAL aspect ratio.

CONCEPT TO ILLUSTRATE: "${titulo}"
FIELD: ${materia}

🚨 ABSOLUTELY NO TEXT - THIS IS A PURE IMAGE:
- DO NOT include ANY text, letters, words, titles, labels, or typography of any kind
- DO NOT write the topic title on the image
- This is an ILLUSTRATION ONLY - the title will be added separately by the app
- Focus 100% on visual symbolism and imagery

🎨 IMAGE REQUIREMENTS:
- EDGE-TO-EDGE content - fill 100% of the 16:9 frame
- NO white space, NO margins, NO empty areas
- Dark, rich backgrounds that extend to ALL edges
- PHOTOREALISTIC, cinematic quality like a movie poster
- DRAMATIC lighting with deep shadows and rim lighting
- The visual must INSTANTLY communicate the ESSENCE of "${titulo}"

VISUAL APPROACH FOR "${titulo}":
- Choose ONE powerful, iconic symbol or scene that represents this concept
- Add depth with layered elements from: ${contexto}
- Use rich, saturated colors from: ${paleta}
- Think Netflix thumbnail / movie poster aesthetic

STYLE:
- Ultra high resolution, 8K quality
- Atmospheric, moody, epic
- Magazine cover / blockbuster movie quality
- Strong central focus with dramatic composition

FORBIDDEN:
- ANY text, letters, words, numbers, typography, labels, titles
- White or empty areas
- Flat compositions
- Stock photo look
- Cartoonish or illustrated style
- Margins or borders

Generate a PURELY VISUAL, CINEMATIC cover that captures the essence of "${titulo}" without any text.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topico_id } = await req.json();

    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: 'topico_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar tópico com matéria
    const { data: topico, error: topicoError } = await supabase
      .from('conceitos_topicos')
      .select(`
        *,
        materia:conceitos_materias(*)
      `)
      .eq('id', topico_id)
      .single();

    if (topicoError || !topico) {
      return new Response(
        JSON.stringify({ error: 'Tópico não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se já tem capa, retornar sem gerar
    if (topico.capa_url) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Capa já existe',
          topico_id,
          capa_url: topico.capa_url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Capa Tópico Conceitos] Gerando para: ${topico.titulo} (ID: ${topico_id})`);

    const materia = topico.materia;
    const prompt = criarPromptImagem(
      topico.titulo,
      materia?.nome || 'Introdução ao Direito'
    );

    // Gerar imagem com Gemini (chaves diretas)
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
    const fileName = `topico-conceitos-${topico_id}-${Date.now()}.webp`;
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

    // Atualizar tópico com a URL da capa
    const { error: updateError } = await supabase
      .from('conceitos_topicos')
      .update({ capa_url: capaUrl })
      .eq('id', topico_id);

    if (updateError) {
      console.error('[Capa Tópico Conceitos] Erro ao atualizar tópico:', updateError);
    }

    console.log(`[Capa Tópico Conceitos] ✅ Capa gerada: ${capaUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        topico_id,
        capa_url: capaUrl,
        tamanho: finalBuffer.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Capa Tópico Conceitos] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
