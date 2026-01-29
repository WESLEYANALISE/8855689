import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Buscar imagem do Wikipedia
async function buscarImagemWikipedia(termo: string): Promise<string | null> {
  try {
    // Primeiro, buscar o título exato da página
    const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(termo)}&srlimit=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    const pageTitle = searchData.query?.search?.[0]?.title;
    if (!pageTitle) {
      console.log("Página não encontrada para:", termo);
      return null;
    }

    // Buscar imagem principal da página
    const imageUrl = `https://pt.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=800`;
    const imageRes = await fetch(imageUrl);
    const imageData = await imageRes.json();
    
    const pages = imageData.query?.pages;
    if (!pages) return null;
    
    const page = Object.values(pages)[0] as any;
    const thumbnail = page?.thumbnail?.source;
    
    if (thumbnail) {
      console.log("Imagem encontrada:", thumbnail);
      return thumbnail;
    }

    // Fallback: buscar em Wikimedia Commons
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(termo)}&srnamespace=6&srlimit=1`;
    const commonsRes = await fetch(commonsUrl);
    const commonsData = await commonsRes.json();
    
    const commonsTitle = commonsData.query?.search?.[0]?.title;
    if (commonsTitle) {
      const fileUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(commonsTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=800`;
      const fileRes = await fetch(fileUrl);
      const fileData = await fileRes.json();
      
      const filePages = fileData.query?.pages;
      if (filePages) {
        const filePage = Object.values(filePages)[0] as any;
        return filePage?.imageinfo?.[0]?.thumburl || filePage?.imageinfo?.[0]?.url || null;
      }
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar imagem Wikipedia:", error);
    return null;
  }
}

// Gerar composição artística com Gemini
async function gerarComposicaoArtistica(
  imagemUrl: string,
  titulo: string,
  categoria: string
): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY não configurada");
    return null;
  }

  // Prompt específico por categoria
  const promptsPorCategoria: Record<string, string> = {
    casos: `Transform this image into a dramatic legal documentary cover. Create an artistic composition with:
- Dark, moody courtroom atmosphere in the background
- Dramatic lighting with shadows and golden highlights
- Legal symbols subtly integrated (scales of justice, gavel silhouettes)
- The original photo prominently featured but artistically blended
- Text-free, cinematic quality like a true crime documentary poster
- Brazilian legal aesthetic with dark wood and marble textures
Title context: "${titulo}"`,
    
    filosofos: `Create an artistic philosophical portrait composition:
- Classical library or study background with ancient books
- Warm, renaissance-style lighting
- Greek columns or classical architecture elements
- The philosopher's image artistically integrated
- Scholarly, timeless atmosphere
- Subtle philosophical symbols (owl, scrolls, quill)
Title: "${titulo}"`,
    
    historia: `Create a historical documentary-style composition:
- Aged parchment and sepia tones in background
- Historical Brazilian legal elements
- The image integrated with period-appropriate styling
- Vintage photograph aesthetic
- Dramatic historical lighting
Title: "${titulo}"`,

    default: `Create an artistic legal-themed composition:
- Professional, sophisticated legal atmosphere
- Dark blue and gold color scheme
- Modern courtroom or law office aesthetic
- The image prominently featured with elegant framing
- High-end documentary quality
Title: "${titulo}"`
  };

  const prompt = promptsPorCategoria[categoria] || promptsPorCategoria.default;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imagemUrl
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Erro na API Gemini:", error);
      return null;
    }

    const data = await response.json();
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (generatedImage) {
      console.log("Composição gerada com sucesso");
      return generatedImage;
    }

    return null;
  } catch (error) {
    console.error("Erro ao gerar composição:", error);
    return null;
  }
}

// Upload para Supabase Storage
async function uploadParaStorage(
  supabase: any,
  base64Image: string,
  categoria: string,
  ordem: number
): Promise<string | null> {
  try {
    // Extrair dados do base64
    const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      console.error("Formato base64 inválido");
      return null;
    }

    const format = matches[1];
    const base64Data = matches[2];
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `blog-juridico/${categoria}/${ordem}-capa-real.${format}`;

    // Upload para storage
    const { data, error } = await supabase.storage
      .from("imagens")
      .upload(fileName, buffer, {
        contentType: `image/${format}`,
        upsert: true
      });

    if (error) {
      console.error("Erro no upload:", error);
      return null;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from("imagens")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Erro no upload:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categoria, ordem, titulo, termo_wikipedia } = await req.json();

    console.log(`Gerando capa real para: ${titulo} (${categoria}/${ordem})`);

    // Termo de busca: preferir termo_wikipedia, senão usar título
    const termoBusca = termo_wikipedia || titulo;

    // 1. Buscar imagem real do Wikipedia
    const imagemWikipedia = await buscarImagemWikipedia(termoBusca);
    
    if (!imagemWikipedia) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Imagem não encontrada no Wikipedia",
          fallback: true // Sinaliza para usar fallback (capa gerada por IA pura)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Gerar composição artística com Gemini
    const composicaoBase64 = await gerarComposicaoArtistica(imagemWikipedia, titulo, categoria);
    
    if (!composicaoBase64) {
      // Se Gemini falhar, retornar apenas a imagem do Wikipedia
      return new Response(
        JSON.stringify({ 
          success: true, 
          url_capa: imagemWikipedia,
          tipo: "wikipedia_original",
          imagem_wikipedia: imagemWikipedia
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Upload para Supabase Storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const urlFinal = await uploadParaStorage(supabase, composicaoBase64, categoria, ordem);

    if (urlFinal) {
      // 4. Atualizar banco de dados
      await supabase
        .from("BLOGGER_JURIDICO")
        .update({ 
          url_capa: urlFinal,
          imagem_wikipedia: imagemWikipedia 
        })
        .eq("categoria", categoria)
        .eq("ordem", ordem);

      return new Response(
        JSON.stringify({ 
          success: true, 
          url_capa: urlFinal,
          tipo: "composicao_artistica",
          imagem_wikipedia: imagemWikipedia
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: retornar imagem Wikipedia se upload falhar
    return new Response(
      JSON.stringify({ 
        success: true, 
        url_capa: imagemWikipedia,
        tipo: "wikipedia_original",
        imagem_wikipedia: imagemWikipedia
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro geral:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
