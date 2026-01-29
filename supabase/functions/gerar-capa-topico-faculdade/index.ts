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

// Contexto visual por área jurídica (para Faculdade)
const contextoVisualPorArea: Record<string, string> = {
  'Direito Penal': 'prisão, grades, algemas, cela, polícia, delegacia, crime, investigação criminal, tribunal do júri',
  'Direito Civil': 'família, casamento, casa, contratos, herança, propriedade, vida cotidiana, acordos',
  'Direito Constitucional': 'Congresso Nacional, Brasília, democracia, direitos fundamentais, cidadania, povo brasileiro',
  'Filosofia e Teoria Geral do Direito': 'pensadores, filósofos gregos, estátuas clássicas, livros antigos, reflexão, sabedoria, justiça',
  'Direito do Estado': 'prédios públicos, governo, burocracia, administração pública, instituições',
  'Direito Econômico e Financeiro': 'economia, mercado financeiro, bolsa de valores, dinheiro, bancos, investimentos',
  'Direito Empresarial': 'empresários, corporações, negócios, startups, contratos comerciais',
  'Direito do Trabalho': 'trabalhadores, operários, fábrica, escritório, carteira de trabalho, sindicato',
  'Direito Processual': 'tribunal, audiência, processo judicial, advogados, petições, julgamento',
  'Direito Internacional': 'bandeiras de países, ONU, diplomacia, tratados, fronteiras, globalização',
  'default': 'livros jurídicos, biblioteca, estudo, conhecimento jurídico, educação, aprendizado'
};

// Paleta de cores por área
const paletasPorArea: Record<string, string> = {
  'Direito Penal': 'deep crimson red, dark shadows, golden accents',
  'Direito Civil': 'navy blue, clean white, silver tones',
  'Direito Constitucional': 'deep green, golden yellow, patriotic blue',
  'Filosofia e Teoria Geral do Direito': 'deep indigo, gold, cream, classical tones',
  'Direito do Estado': 'royal purple, institutional gray, white',
  'Direito Econômico e Financeiro': 'forest green, gold, bronze money tones',
  'Direito Empresarial': 'corporate blue, gold, charcoal',
  'Direito do Trabalho': 'burnt orange, industrial blue, earthy brown',
  'Direito Processual': 'steel blue, white, silver',
  'Direito Internacional': 'royal blue, white, gold diplomatic',
  'default': 'navy blue, gold, white'
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

// Gerar imagem com Gemini usando fallback entre chaves
async function gerarImagemComGemini(prompt: string): Promise<string> {
  const keys = getGeminiKeys();
  
  if (keys.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada');
  }
  
  // Modelo correto para geração de imagens
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

// Criar prompt de imagem - ILUSTRATIVO E ESPECÍFICO AO TEMA
function criarPromptImagem(titulo: string, disciplina: string, departamento: string): string {
  const contexto = contextoVisualPorArea[departamento] || contextoVisualPorArea['default'];
  const paleta = paletasPorArea[departamento] || paletasPorArea['default'];
  
  return `Create a THUMBNAIL-STYLE cover image for a legal/academic topic. 16:9 HORIZONTAL aspect ratio, optimized for mobile thumbnails.

TOPIC: "${titulo}" 
FIELD: ${disciplina} (${departamento})

🎯 CRITICAL REQUIREMENT: The image MUST contain a SPECIFIC, ICONIC VISUAL SYMBOL that directly represents THIS exact topic. DO NOT create generic legal images.

EXAMPLES OF SPECIFIC ILLUSTRATIONS:
- "Lei das XII Tábuas" → 12 ancient stone tablets arranged in rows, Roman style, with carved inscriptions
- "Emancipação" → Young person breaking free from chains, or a key unlocking handcuffs
- "Capacidade Civil" → Scale balancing a child figure vs adult figure
- "Pessoa Natural" → Newborn baby's hand holding an adult finger
- "Pessoa Jurídica" → Corporate building with human silhouettes forming the facade
- "Fontes do Direito" → Water fountain with streams labeled as books, customs, laws
- "Fato Jurídico" → Domino effect with legal symbols
- "Direito Subjetivo" → Person holding shield/sword representing their rights
- "Norma Jurídica" → Gavel striking with radiating light waves

FOR "${titulo}": Think creatively about what SPECIFIC, LITERAL or METAPHORICAL visual would INSTANTLY communicate this concept.

VISUAL STYLE:
- PHOTOREALISTIC, cinematic quality
- Dramatic lighting with rich shadows
- 16:9 HORIZONTAL thumbnail format
- High contrast, vibrant colors from palette: ${paleta}
- Professional editorial/magazine cover quality
- Moody, atmospheric, engaging

CONTEXT ELEMENTS (subtle background): ${contexto}

ABSOLUTELY FORBIDDEN:
- ANY text, letters, words, numbers, typography
- Generic handshakes, gavels, scales without creative twist
- Boring stock photo compositions
- Cartoonish or illustrated style
- Watermarks or logos

Create a MEMORABLE, ICONIC thumbnail that someone would recognize as "${titulo}" even without reading the title.`;
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

    // Buscar tópico com disciplina
    const { data: topico, error: topicoError } = await supabase
      .from('faculdade_topicos')
      .select(`
        *,
        disciplina:faculdade_disciplinas(*)
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

    console.log(`[Capa Tópico] Gerando para: ${topico.titulo} (ID: ${topico_id})`);

    const disciplina = topico.disciplina;
    const prompt = criarPromptImagem(
      topico.titulo,
      disciplina?.nome || 'Direito',
      disciplina?.departamento || 'default'
    );

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
    const fileName = `topico-faculdade-${topico_id}-${Date.now()}.webp`;
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
      .from('faculdade_topicos')
      .update({ capa_url: capaUrl })
      .eq('id', topico_id);

    if (updateError) {
      console.error('[Capa Tópico] Erro ao atualizar tópico:', updateError);
    }

    console.log(`[Capa Tópico] ✅ Capa gerada: ${capaUrl}`);

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
    console.error('[Capa Tópico] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
