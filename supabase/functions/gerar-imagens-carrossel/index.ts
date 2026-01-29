import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  for (const apiKey of API_KEYS) {
    try {
      console.log("Gerando imagem com Gemini (chave da professora)...");
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["image", "text"],
              responseMimeType: "text/plain"
            }
          }),
        }
      );

      if (!response.ok) {
        console.error(`Erro com chave API: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          const base64 = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          console.log("Imagem gerada com sucesso!");
          return `data:${mimeType};base64,${base64}`;
        }
      }
      
      console.log("Nenhuma imagem retornada pela API");
      continue;
      
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      continue;
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slides, leiNome, artigo } = await req.json();
    
    console.log('Gerando imagens para', slides.length, 'slides');

    if (API_KEYS.length === 0) {
      throw new Error("Nenhuma chave GEMINI_KEY configurada");
    }

    const imagensGeradas = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      console.log(`Gerando imagem ${i + 1}/${slides.length}:`, slide.titulo);

      const isFirstSlide = i === 0;
      const isLastSlide = i === slides.length - 1;

      const prompt = `Create a stunning, professional Instagram carousel slide image for a Brazilian legal education account.

VISUAL STYLE:
- Aspect ratio: Square (1:1)
- Style: Premium, sleek, modern editorial design with depth and dimension
- Background: Deep charcoal gradient (#0a0a0a to #1a1a1a) with subtle geometric patterns or mesh grid
- Accent color: Vibrant crimson red (#dc2626) for highlights, icons, and key elements
- Secondary accent: Gold (#f59e0b) for premium feel
- Typography style: Bold, impactful, white text with subtle shadows

LAYOUT FOR SLIDE ${i + 1}/${slides.length}:
${isFirstSlide ? `
- COVER SLIDE: Eye-catching hook design
- Large, bold headline in center
- Dramatic lighting effects (subtle glow, lens flare)
- "Swipe" indicator arrow at bottom
- Legal iconography: scales of justice, gavel, or law book silhouette
` : isLastSlide ? `
- CLOSING SLIDE: Call-to-action design
- "Salve para consultar depois" or "Siga para mais"
- Profile mention placeholder
- Social media icons
- Summary of key points
` : `
- CONTENT SLIDE: Educational infographic style
- Clear visual hierarchy
- Icon or illustration representing the concept
- Bullet points or numbered steps if applicable
- Visual metaphors for legal concepts
`}

CONTENT TO DISPLAY:
- Title: "${slide.titulo}"
- Main text: "${slide.texto}"
${slide.destaque ? `- Highlight box: "${slide.destaque}"` : ''}
- Visual element hint: ${slide.elemento_visual}

CONTEXT:
- Law: ${leiNome}
- Article: ${artigo}

DESIGN REQUIREMENTS:
- 3D elements or isometric icons for modern appeal
- Glassmorphism effects on text boxes (frosted glass look)
- Subtle particle effects or floating geometric shapes
- Professional drop shadows and depth
- Text must be LARGE, READABLE, and HIGH CONTRAST
- Include subtle branding watermark area
- Slide counter badge: "${i + 1}/${slides.length}" in corner

QUALITY:
- Photorealistic rendering quality
- 4K ultra-high resolution
- Sharp, crisp edges
- Professional color grading
- Magazine-quality layout

DO NOT include: blurry text, generic clipart, low contrast elements, amateur design choices.`;

      try {
        const imageUrl = await gerarImagemComGemini(prompt);

        if (imageUrl) {
          imagensGeradas.push({
            slideNumero: i + 1,
            url: imageUrl,
            titulo: slide.titulo,
            texto: slide.texto
          });
          console.log(`Imagem ${i + 1} gerada com sucesso`);
        } else {
          console.log(`Imagem ${i + 1} não retornada, usando placeholder`);
          imagensGeradas.push({
            slideNumero: i + 1,
            url: null,
            titulo: slide.titulo,
            texto: slide.texto,
            erro: "Imagem não gerada"
          });
        }

        if (i < slides.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (imageError) {
        console.error(`Erro na imagem ${i + 1}:`, imageError);
        imagensGeradas.push({
          slideNumero: i + 1,
          url: null,
          titulo: slide.titulo,
          erro: imageError instanceof Error ? imageError.message : 'Erro desconhecido'
        });
      }
    }

    const imagensComSucesso = imagensGeradas.filter(img => img.url).length;
    console.log(`Geração concluída: ${imagensComSucesso}/${slides.length} imagens`);

    return new Response(JSON.stringify({
      success: true,
      imagens: imagensGeradas,
      totalGeradas: imagensComSucesso,
      totalSolicitadas: slides.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro ao gerar imagens:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});