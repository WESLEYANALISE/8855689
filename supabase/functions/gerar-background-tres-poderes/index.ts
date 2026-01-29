import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chaves Gemini - mesma configuração das outras funções
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

// Configurações de tamanhos de tela
const SCREEN_SIZES = {
  mobile: { aspectRatio: "9:16", suffix: "mobile" },
  tablet: { aspectRatio: "9:16", suffix: "tablet" },
  desktop: { aspectRatio: "16:9", suffix: "desktop" }
};

async function gerarImagemComGemini(prompt: string, aspectRatio: string): Promise<string | null> {
  // Tentar com gemini-2.0-flash-exp (multimodal com geração de imagem)
  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    console.log(`Tentando gerar imagem com Gemini 2.0 Flash, chave ${i + 1}, aspectRatio: ${aspectRatio}...`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ text: `Generate an image with aspect ratio ${aspectRatio}: ${prompt}` }] 
            }],
            generationConfig: {
              responseModalities: ["image", "text"]
            }
          })
        }
      );

      if (response.status === 429) {
        console.log(`Chave ${i + 1} com rate limit, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro Gemini Flash com chave ${i + 1}:`, response.status, errorText);
        continue;
      }

      const data = await response.json();
      console.log('Resposta Gemini Flash recebida');

      // Extrair imagem da resposta
      const parts = data.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            return part.inlineData.data; // Retorna apenas o base64
          }
        }
      }

      console.log('Nenhuma imagem encontrada na resposta');
    } catch (error) {
      console.error(`Erro com chave ${i + 1}:`, error);
      continue;
    }
  }

  return null;
}

// Função para decodificar base64
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave GEMINI configurada');
    }

    const { pageKey } = await req.json();
    
    // Prompts específicos para cada página/seção - agora sem especificar aspect ratio fixo
    const prompts: Record<string, string> = {
      'main': `Ultra realistic photograph of the Brazilian National Congress building (Congresso Nacional) in Brasília at golden hour sunrise. 
        The iconic twin towers and dome architecture are silhouetted against a dramatic orange and gold sky. 
        The Brazilian flag waves majestically. Rays of light pierce through clouds creating a divine atmosphere.
        Constitutional scales of justice subtly visible in the golden clouds. 
        Ultra high resolution, photorealistic, cinematic lighting.`,
      
      'executivo': `Ultra realistic photograph of the Palácio do Planalto (Brazilian Presidential Palace) in Brasília at sunset.
        The modernist architecture designed by Oscar Niemeyer gleams in warm golden light.
        Brazilian presidential sash colors (green and gold) reflected in the sky.
        Executive power symbols subtly integrated. Majestic and powerful atmosphere.
        Ultra high resolution, photorealistic.`,
      
      'legislativo': `Ultra realistic photograph of the Brazilian National Congress interior, showing the famous ramps and the Chamber of Deputies.
        Golden sunlight streaming through large windows, illuminating the marble floors.
        Deputies' seats visible in the background, creating a sense of democracy and deliberation.
        Green tones predominant, symbolizing the legislative branch.
        Ultra high resolution, photorealistic.`,
      
      'judiciario': `Ultra realistic photograph of the Supreme Federal Court (STF) building in Brasília.
        The distinctive modernist architecture with its curved colonnade.
        Scales of justice prominently featured. Deep purple and crimson sky at twilight.
        Solemnity and justice atmosphere. Statue of Justice (A Justiça) by Alfredo Ceschiatti visible.
        Ultra high resolution, photorealistic.`,
      
      'politica': `Cinematic 8K photorealistic image of an intense political debate scene. 
        Two silhouetted figures facing each other in confrontation stance, like a rivalry showdown.
        LEFT SIDE: Deep red gradient background, symbolizing the political left wing.
        RIGHT SIDE: Deep blue gradient background, symbolizing the political right wing.
        The gradients dramatically MERGE in the CENTER where the figures confront each other.
        Sparks or energy clash where red meets blue, creating visual tension.
        Dark, dramatic atmosphere with cinematic lighting from both sides.
        NO text, NO logos, NO specific politicians faces - only anonymous silhouettes.
        Professional congress/debate stage setting with microphones visible.
        Ultra high resolution, photorealistic, dramatic political debate atmosphere.`
    };

    const prompt = prompts[pageKey] || prompts['main'];

    console.log(`Gerando backgrounds para ${pageKey} em 3 tamanhos...`);

    // Supabase setup
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar URLs antigas para deletar do Storage
    const { data: oldConfig } = await supabase
      .from('tres_poderes_config')
      .select('background_url, background_mobile, background_tablet, background_desktop')
      .eq('page_key', pageKey)
      .single();

    // Deletar imagens antigas do Storage
    if (oldConfig) {
      const oldUrls = [
        oldConfig.background_mobile,
        oldConfig.background_tablet,
        oldConfig.background_desktop,
        oldConfig.background_url
      ].filter(Boolean);

      for (const url of oldUrls) {
        try {
          // Extrair o path do arquivo da URL
          const urlObj = new URL(url);
          const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/backgrounds\/(.+)/);
          if (pathMatch && pathMatch[1]) {
            const filePath = decodeURIComponent(pathMatch[1]);
            console.log(`Deletando imagem antiga: ${filePath}`);
            
            const { error: deleteError } = await supabase.storage
              .from('backgrounds')
              .remove([filePath]);
            
            if (deleteError) {
              console.error(`Erro ao deletar ${filePath}:`, deleteError);
            } else {
              console.log(`Imagem antiga deletada: ${filePath}`);
            }
          }
        } catch (e) {
          console.error('Erro ao processar URL para deleção:', e);
        }
      }
    }

    const timestamp = Date.now();
    const results: Record<string, string> = {};

    // Gerar imagens para cada tamanho de tela
    for (const [screenType, config] of Object.entries(SCREEN_SIZES)) {
      console.log(`Gerando imagem para ${screenType}...`);
      
      const imageBase64 = await gerarImagemComGemini(prompt, config.aspectRatio);
      
      if (!imageBase64) {
        console.error(`Falha ao gerar imagem para ${screenType}`);
        continue;
      }

      // Converter para bytes
      const binaryData = base64ToBytes(imageBase64);

      const fileName = `tres-poderes/${pageKey}-${config.suffix}-${timestamp}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('backgrounds')
        .upload(fileName, binaryData.buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error(`Erro no upload ${screenType}:`, uploadError);
        // Salvar como base64 fallback
        results[screenType] = `data:image/png;base64,${imageBase64}`;
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('backgrounds')
        .getPublicUrl(fileName);

      results[screenType] = publicUrlData.publicUrl;
      console.log(`${screenType} salvo: ${publicUrlData.publicUrl}`);
    }

    // Verificar se pelo menos uma imagem foi gerada
    if (Object.keys(results).length === 0) {
      throw new Error('Falha ao gerar todas as imagens');
    }

    // Save to config table com todas as URLs
    await supabase
      .from('tres_poderes_config')
      .upsert({
        page_key: pageKey,
        background_url: results.mobile || results.tablet || results.desktop,
        background_mobile: results.mobile || null,
        background_tablet: results.tablet || null,
        background_desktop: results.desktop || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'page_key' });

    console.log(`Backgrounds salvos para ${pageKey}:`, results);

    return new Response(JSON.stringify({ 
      success: true, 
      images: results,
      // Compatibilidade com código anterior
      imageUrl: results.mobile || results.tablet || results.desktop
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao gerar background:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
