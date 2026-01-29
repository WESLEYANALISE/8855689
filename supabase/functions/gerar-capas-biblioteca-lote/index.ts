import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Contexto visual específico por área de direito
const contextoVisualPorArea: Record<string, string> = {
  'Direito Penal': 'prison, handcuffs, police, crime scene, investigation, dark shadows, danger',
  'Direito Civil': 'happy family, home, contracts, property, inheritance, everyday life, agreements',
  'Direito Constitucional': 'Brazilian flag, Congress, Brasília, democracy, voting, citizenship, freedom',
  'Direito Tributário': 'money, coins, taxes, calculator, economy, bank, treasury',
  'Direito do Trabalho': 'workers, factory, office, employees, work card, salary, union',
  'Direito Trabalhista': 'workers, factory, office, employees, work card, salary, union',
  'Direito Administrativo': 'government buildings, public servants, bureaucracy, official documents',
  'Direito Empresarial': 'executives, corporations, modern office, business meetings, investments',
  'Direito Processual Civil': 'courtroom, lawyers, petitions, judicial documents, hearing',
  'Direito Processual Penal': 'jury trial, defendant, prosecutor, criminal judgment',
  'Direito Ambiental': 'nature, forest, rivers, animals, environmental preservation, Amazon',
  'Direito Internacional': 'country flags, UN, diplomacy, treaties, passports, embassies',
  'Direito Eleitoral': 'electronic ballot box, voting, elections, candidates, democracy',
  'Direito Previdenciário': 'elderly couple, retirement, hospital, INSS, pension, social security',
  'Direito Digital': 'computers, internet, cybersecurity, digital data, technology, AI',
  'Filosofia do Direito': 'philosophers, classical statues, ancient books, wisdom, ethics',
  'Ética': 'moral scale, difficult decisions, ethical dilemmas, conscience, values',
  'default': 'law books, library, study, knowledge, education'
};

// Paleta de cores por área
const paletasPorArea: Record<string, string> = {
  'Direito Penal': 'deep crimson red, dark shadows, golden accents',
  'Direito Civil': 'navy blue, clean white, silver tones',
  'Direito Constitucional': 'deep green, golden yellow, patriotic blue',
  'Direito Tributário': 'forest green, gold, bronze money tones',
  'Direito do Trabalho': 'burnt orange, industrial blue, earthy brown',
  'Direito Trabalhista': 'burnt orange, industrial blue, earthy brown',
  'Direito Administrativo': 'royal purple, institutional gray, white',
  'Direito Empresarial': 'corporate blue, gold, charcoal',
  'Direito Processual Civil': 'steel blue, white, silver',
  'Direito Processual Penal': 'burgundy red, dark gray, black',
  'Direito Ambiental': 'forest green, earth brown, sky blue, natural tones',
  'Direito Internacional': 'royal blue, white, gold diplomatic',
  'Direito Eleitoral': 'patriotic blue, red, white',
  'Direito Previdenciário': 'warm orange, cream, brown',
  'Direito Digital': 'electric cyan, deep purple, neon blue',
  'Filosofia do Direito': 'deep indigo, gold, cream',
  'Ética': 'deep purple, gold, white',
  'default': 'navy blue, gold, white'
};

// Gerar imagem usando Lovable AI Gateway (Gemini Flash Image)
async function gerarImagemLovable(prompt: string, apiKey: string): Promise<string | null> {
  try {
    console.log(`[Lovable AI] Gerando imagem...`);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Lovable AI] Erro: ${response.status}`, errorText);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl) {
      console.log(`[Lovable AI] Imagem gerada com sucesso`);
      return imageUrl;
    }
    
    console.log('[Lovable AI] Resposta sem imagem');
    return null;
  } catch (error) {
    console.error('[Lovable AI] Erro:', error);
    return null;
  }
}

// Comprimir e converter para WebP usando TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[TinyPNG] Comprimindo ${imageBytes.length} bytes...`);
  
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
  console.log(`[TinyPNG] WebP: ${webpBytes.length} bytes`);
  
  return webpBytes;
}

// Criar prompt para a capa
function criarPromptCapa(tema: string, area: string): string {
  const contexto = contextoVisualPorArea[area] || contextoVisualPorArea['default'];
  const paleta = paletasPorArea[area] || paletasPorArea['default'];
  
  return `Generate a stunning, professional book cover image for a law book titled "${tema}" in the area of "${area}".

CRITICAL REQUIREMENTS:
- NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS in the image
- REALISTIC photography or photorealistic digital art style
- Professional editorial quality
- Vertical 9:16 aspect ratio (book cover format)
- Ultra high resolution

VISUAL CONTEXT for "${area}":
${contexto}

The image should visually represent the concept of "${tema}" through realistic imagery and symbolism.

COLOR PALETTE: ${paleta}

STYLE:
- Cinematic lighting with dramatic shadows
- Professional stock photo quality
- Rich, saturated colors
- Clear focal point
- Depth and atmosphere

Create an emotionally impactful, beautiful image that captures the essence of "${tema}" without any text.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limite = 5, offset = 0, livroId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resultados: any[] = [];

    // Se recebeu livroId específico, gerar apenas para esse
    if (livroId) {
      const { data: livro, error } = await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .select('id, Tema, "Área"')
        .eq('id', livroId)
        .single();

      if (error || !livro) {
        throw new Error(`Livro não encontrado: ${livroId}`);
      }

      const resultado = await processarLivro(livro, supabase, lovableApiKey, TINYPNG_API_KEY);
      return new Response(
        JSON.stringify({ success: true, resultado }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar livros sem capa
    const { data: livros, error: fetchError } = await supabase
      .from('BIBLIOTECA-ESTUDOS')
      .select('id, Tema, "Área"')
      .is('url_capa_gerada', null)
      .is('Capa-livro', null)
      .order('id')
      .range(offset, offset + limite - 1);

    if (fetchError) {
      throw new Error(`Erro ao buscar livros: ${fetchError.message}`);
    }

    console.log(`[Lote] Encontrados ${livros?.length || 0} livros sem capa`);

    // Processar cada livro
    for (const livro of (livros || [])) {
      try {
        const resultado = await processarLivro(livro, supabase, lovableApiKey, TINYPNG_API_KEY);
        resultados.push(resultado);
        
        // Delay entre gerações para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[Lote] Erro no livro ${livro.id}:`, error);
        resultados.push({ livroId: livro.id, success: false, error: String(error) });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processados: resultados.length,
        resultados 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Lote] Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar', details: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function processarLivro(
  livro: { id: number; Tema: string; Área: string },
  supabase: any,
  lovableApiKey: string,
  tinypngKey: string | undefined
): Promise<any> {
  console.log(`[Lote] Processando: ${livro.Tema} (ID: ${livro.id})`);

  // Gerar prompt e imagem
  const prompt = criarPromptCapa(livro.Tema, livro['Área'] || 'Outros');
  const imageBase64 = await gerarImagemLovable(prompt, lovableApiKey);

  if (!imageBase64) {
    throw new Error('Falha ao gerar imagem');
  }

  // Converter base64 para bytes
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const originalBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  // Comprimir se TinyPNG disponível
  let imageBuffer: Uint8Array = originalBuffer;
  if (tinypngKey) {
    try {
      imageBuffer = await comprimirParaWebP(originalBuffer, tinypngKey);
    } catch (e) {
      console.log('[Lote] TinyPNG falhou, usando original');
      imageBuffer = originalBuffer;
    }
  }

  // Upload para Supabase Storage
  const fileName = `estudos_${livro.id}_${Date.now()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from('CAPAS')
    .upload(`biblioteca-estudos/${fileName}`, imageBuffer, {
      contentType: 'image/webp',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Upload falhou: ${uploadError.message}`);
  }

  // Obter URL pública
  const { data: urlData } = supabase.storage
    .from('CAPAS')
    .getPublicUrl(`biblioteca-estudos/${fileName}`);

  const publicUrl = urlData?.publicUrl;

  // Atualizar banco de dados
  const { error: updateError } = await supabase
    .from('BIBLIOTECA-ESTUDOS')
    .update({ 
      'Capa-livro': publicUrl,
      url_capa_gerada: publicUrl 
    })
    .eq('id', livro.id);

  if (updateError) {
    throw new Error(`Update falhou: ${updateError.message}`);
  }

  console.log(`[Lote] ✓ Capa gerada: ${livro.Tema}`);
  
  return {
    livroId: livro.id,
    tema: livro.Tema,
    success: true,
    capaUrl: publicUrl
  };
}
