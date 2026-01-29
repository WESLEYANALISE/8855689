import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Compress image to WebP using TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array): Promise<Uint8Array> {
  const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');
  if (!TINYPNG_API_KEY) {
    console.log('TinyPNG não configurado, usando imagem original');
    return imageBytes;
  }

  try {
    console.log('Comprimindo imagem com TinyPNG...');
    
    const uploadResponse = await fetch('https://api.tinify.com/shrink', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`,
        'Content-Type': 'image/png'
      },
      body: imageBytes as unknown as BodyInit
    });

    if (!uploadResponse.ok) {
      console.error('Erro TinyPNG upload:', uploadResponse.status);
      return imageBytes;
    }

    const uploadResult = await uploadResponse.json();
    console.log('TinyPNG upload ok, convertendo para WebP...');

    const convertResponse = await fetch(uploadResult.output.url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${TINYPNG_API_KEY}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ convert: { type: ['image/webp'] } })
    });

    if (!convertResponse.ok) {
      console.error('Erro TinyPNG convert:', convertResponse.status);
      const fallbackResponse = await fetch(uploadResult.output.url);
      return new Uint8Array(await fallbackResponse.arrayBuffer());
    }

    const webpBytes = new Uint8Array(await convertResponse.arrayBuffer());
    console.log(`Imagem comprimida: ${imageBytes.length} -> ${webpBytes.length} bytes`);
    return webpBytes;

  } catch (error) {
    console.error('Erro na compressão:', error);
    return imageBytes;
  }
}

// Cenários de dispositivos para variar as capas - FOCO: estudo, fones de ouvido, computador, notícias
const cenariosDispositivos = [
  {
    dispositivo: 'fones_estudo',
    descricao: 'young Brazilian law student wearing over-ear headphones, sitting at a modern desk with laptop and coffee, studying legal content with focused and serene expression, cozy study room with warm lighting and law books on shelves'
  },
  {
    dispositivo: 'airpods_podcast',
    descricao: 'young Brazilian professional wearing wireless earbuds/airpods, walking in a modern city environment, listening to a legal news podcast on smartphone, confident and informed expression, urban background with subtle golden hour lighting'
  },
  {
    dispositivo: 'laptop_noite',
    descricao: 'young Brazilian law student late at night studying on laptop with desk lamp, wearing comfortable headphones, immersed in legal news and articles, focused and dedicated expression, cozy home office with warm ambient lighting'
  },
  {
    dispositivo: 'biblioteca',
    descricao: 'young Brazilian law student in a modern library or study space, using laptop with earphones, surrounded by contemporary law books and digital screens showing news, concentrated and professional appearance, soft natural daylight'
  },
  {
    dispositivo: 'cafe_estudo',
    descricao: 'young Brazilian professional in a trendy cafe, using tablet with wireless earphones, reading legal news updates, relaxed but engaged expression, modern coffee shop environment with minimalist decor and natural light'
  },
  {
    dispositivo: 'home_office',
    descricao: 'young Brazilian law professional at home office setup with dual monitors, wearing professional headphones, reviewing legal news and updates, focused and productive expression, clean modern workspace with plants and good lighting'
  }
];

function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const key1 = Deno.env.get('GEMINI_KEY_1');
  const key2 = Deno.env.get('GEMINI_KEY_2');
  const key3 = Deno.env.get('GEMINI_KEY_3');
  const premiumKey = Deno.env.get('DIREITO_PREMIUM_API_KEY');
  
  if (key1) keys.push(key1);
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);
  if (premiumKey) keys.push(premiumKey);
  
  return keys;
}

// Gerar imagem com Gemini usando fallback entre chaves
async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  const keys = getGeminiKeys();
  
  if (keys.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada');
  }
  
  const modelos = [
    'gemini-2.0-flash-exp-image-generation',
    'gemini-2.5-flash-image'
  ];
  
  for (const modelo of modelos) {
    console.log(`Tentando modelo: ${modelo}`);
    
    for (let i = 0; i < keys.length; i++) {
      const apiKey = keys[i];
      try {
        console.log(`Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
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
        
        if (response.status === 429 || response.status === 503) {
          console.log(`GEMINI_KEY_${i + 1} com rate limit, tentando próxima...`);
          continue;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`GEMINI_KEY_${i + 1} falhou (${response.status}): ${errorText.substring(0, 100)}`);
          continue;
        }
        
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData?.data);
        
        if (imagePart?.inlineData?.data) {
          console.log(`Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
          return imagePart.inlineData.data;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Erro com GEMINI_KEY_${i + 1}: ${msg.substring(0, 100)}`);
        continue;
      }
    }
  }
  
  return null;
}

function criarPromptCapa(tipo: string, cenario: typeof cenariosDispositivos[0]): string {
  const tipoLabel = tipo === 'juridico' ? 'legal/law' : 'political';
  const background = tipo === 'juridico' 
    ? 'modern study environment with law books, laptop screens showing news articles, warm ambient lighting, contemporary office or study room aesthetic - NO scales of justice, NO Themis statue, NO classical Greek imagery'
    : 'modern news media environment with screens showing political content, Brazilian flags subtly visible, contemporary journalism aesthetic with warm professional lighting';
  
  return `CRITICAL: Generate a HORIZONTAL 16:9 aspect ratio image. NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS.

Create a professional, photorealistic editorial news cover image in LANDSCAPE/HORIZONTAL format (16:9 ratio like a YouTube thumbnail or banner).

MAIN SUBJECT (center of composition):
${cenario.descricao}

CONTEXT: The person is staying informed about ${tipoLabel} news in Brazil, actively studying and learning.

BACKGROUND:
${background}

STYLE REQUIREMENTS:
- HORIZONTAL 16:9 aspect ratio (wider than tall, like a banner)
- Professional editorial photography style like a magazine cover
- Modern, clean, cinematic lighting with warm tones
- Emphasis on TECHNOLOGY (headphones, laptop, tablet, smartphone)
- Cozy study atmosphere with contemporary decor
- Sharp focus on the person, slightly blurred background (bokeh)
- The person should be the FOCAL POINT, positioned following rule of thirds
- Ultra high resolution quality
- Stock photography quality, natural and authentic

MOOD: Engaged, informed, studious, modern Brazilian young adult immersed in learning

ABSOLUTELY FORBIDDEN:
- Vertical or square format (MUST be horizontal 16:9)
- Any text, letters, numbers, or typography
- Watermarks or logos
- Themis statue or Greek goddess imagery
- Scales of justice or balance imagery
- Classical legal symbols (gavels, wigs, etc.)
- Artificial or staged poses
- Generic or cliché stock photo looks`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, data, slideIndex } = await req.json();
    
    console.log(`Iniciando geração de capa: tipo=${tipo}, data=${data}, slideIndex=${slideIndex}`);
    
    if (!tipo || !['juridico', 'politico'].includes(tipo)) {
      return new Response(
        JSON.stringify({ error: 'Tipo inválido. Use "juridico" ou "politico"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const targetDate = data || new Date().toISOString().split('T')[0];
    console.log(`Data alvo: ${targetDate}`);
    
    // Selecionar cenário baseado no slideIndex ou aleatório
    const cenarioIndex = slideIndex !== undefined 
      ? slideIndex % cenariosDispositivos.length 
      : Math.floor(Math.random() * cenariosDispositivos.length);
    const cenario = cenariosDispositivos[cenarioIndex];
    
    console.log(`Usando cenário: ${cenario.dispositivo}`);
    
    // Generate image
    const prompt = criarPromptCapa(tipo, cenario);
    console.log('Gerando imagem com Gemini...');
    
    let base64Image = await gerarImagemComGemini(prompt);
    
    // Fallback to Hugging Face if Gemini fails
    if (!base64Image) {
      console.log('Gemini falhou, tentando Hugging Face...');
      try {
        const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
        if (HF_TOKEN) {
          const hfResponse = await fetch(
            'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ inputs: prompt })
            }
          );
          
          if (hfResponse.ok) {
            const arrayBuffer = await hfResponse.arrayBuffer();
            base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            console.log('Sucesso com Hugging Face FLUX');
          } else {
            console.log(`Hugging Face falhou: ${hfResponse.status}`);
          }
        }
      } catch (hfErr) {
        console.error('Erro Hugging Face:', hfErr);
      }
    }
    
    if (!base64Image) {
      throw new Error('Não foi possível gerar imagem com nenhuma API');
    }
    
    // Convert base64 to bytes
    const imageBytes = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
    console.log(`Tamanho original: ${imageBytes.length} bytes`);
    
    // Compress to WebP
    const compressedBytes = await comprimirParaWebP(imageBytes);
    
    // Upload to Supabase Storage
    const fileName = `radar_${tipo}_${targetDate}_${cenario.dispositivo}.webp`;
    console.log(`Fazendo upload: radar/${fileName}`);
    
    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(`radar/${fileName}`, compressedBytes, {
        contentType: 'image/webp',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      throw uploadError;
    }
    
    const { data: publicUrl } = supabase.storage
      .from('imagens')
      .getPublicUrl(`radar/${fileName}`);
    
    const urlCapa = publicUrl.publicUrl;
    console.log('Upload concluído:', urlCapa);
    
    // Salvar ou atualizar na tabela radar_capas_diarias
    const capaData = {
      data: targetDate,
      tipo: tipo,
      url_capa: urlCapa,
      titulo_capa: tipo === 'juridico' ? 'Notícias Jurídicas' : 'Política Brasileira',
      subtitulo_capa: tipo === 'juridico' ? 'Resumo das principais notícias jurídicas' : 'Resumo das principais notícias políticas',
      total_noticias: 0
    };
    
    // Verificar se já existe registro para essa data/tipo
    const { data: existente } = await supabase
      .from('radar_capas_diarias')
      .select('id')
      .eq('data', targetDate)
      .eq('tipo', tipo)
      .maybeSingle();
    
    let capaResult;
    if (existente) {
      // Atualizar existente
      const { data: updated, error: updateError } = await supabase
        .from('radar_capas_diarias')
        .update({ url_capa: urlCapa })
        .eq('id', existente.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Erro ao atualizar capa:', updateError);
      }
      capaResult = updated;
    } else {
      // Inserir novo
      const { data: inserted, error: insertError } = await supabase
        .from('radar_capas_diarias')
        .insert(capaData)
        .select()
        .single();
      
      if (insertError) {
        console.error('Erro ao inserir capa:', insertError);
      }
      capaResult = inserted;
    }
    
    console.log('Capa salva no banco:', capaResult?.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        url_capa: urlCapa,
        dispositivo: cenario.dispositivo,
        capa: capaResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro geral:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
