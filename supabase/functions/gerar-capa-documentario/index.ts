import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chaves Gemini com fallback
const API_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

// Compress and convert to WebP using TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array): Promise<Uint8Array> {
  const TINYPNG_KEY = Deno.env.get("TINYPNG_API_KEY");
  if (!TINYPNG_KEY) {
    console.log("TinyPNG não configurado, retornando imagem original");
    return imageBytes;
  }

  try {
    const arrayBuffer = imageBytes.buffer.slice(imageBytes.byteOffset, imageBytes.byteOffset + imageBytes.byteLength);
    
    const uploadResp = await fetch("https://api.tinify.com/shrink", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${TINYPNG_KEY}`)}`,
        "Content-Type": "application/octet-stream",
      },
      body: arrayBuffer as ArrayBuffer,
    });

    if (!uploadResp.ok) {
      console.error("TinyPNG upload failed:", await uploadResp.text());
      return imageBytes;
    }

    const uploadData = await uploadResp.json();
    const compressedUrl = uploadData.output.url;

    const convertResp = await fetch(compressedUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${TINYPNG_KEY}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ convert: { type: ["image/webp"] } }),
    });

    if (!convertResp.ok) {
      console.error("WebP conversion failed");
      return imageBytes;
    }

    return new Uint8Array(await convertResp.arrayBuffer());
  } catch (e) {
    console.error("Compression error:", e);
    return imageBytes;
  }
}

// Gerar imagem com Gemini Image Generation API (fallback entre chaves)
async function gerarImagemGemini(prompt: string): Promise<Uint8Array> {
  if (API_KEYS.length === 0) {
    throw new Error("Nenhuma chave Gemini configurada");
  }

  let lastError: Error | null = null;

  for (const apiKey of API_KEYS) {
    try {
      console.log("Tentando gerar imagem com Gemini...");
      
      // Usar gemini-2.0-flash-exp-image-generation
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"]
            }
          })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Gemini error (${response.status}):`, errText);
        
        if (response.status === 403 || response.status === 429 || response.status === 404) {
          console.log("Tentando próxima chave...");
          continue;
        }
        
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extrair imagem base64 da resposta
      const parts = data.candidates?.[0]?.content?.parts || [];
      let imageBase64: string | null = null;
      
      for (const part of parts) {
        if (part.inlineData?.data) {
          imageBase64 = part.inlineData.data;
          break;
        }
      }
      
      if (!imageBase64) {
        console.error("Resposta sem imagem:", JSON.stringify(data).substring(0, 500));
        throw new Error("Nenhuma imagem na resposta");
      }

      // Converter base64 para Uint8Array
      const binaryString = atob(imageBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log("✅ Imagem gerada com sucesso");
      return bytes;
      
    } catch (error) {
      console.error("Erro com chave:", error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  throw lastError || new Error("Todas as chaves Gemini falharam");
}

// Gerar prompt cinematográfico com Gemini (fallback)
async function gerarPromptCinematografico(
  titulo: string,
  descricao: string | null
): Promise<string> {
  if (API_KEYS.length === 0) {
    return gerarPromptFallback(titulo, descricao);
  }

  // Extrair tema principal do título (remover prefixo "Audiodescrição |")
  const temaLimpo = titulo.replace(/^Audiodescrição\s*\|\s*📹?\s*Documentário\s*-?\s*/i, '').trim();
  
  for (const apiKey of API_KEYS) {
    try {
      console.log("Gerando prompt cinematográfico para:", temaLimpo);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a world-class cinematic designer for Netflix/HBO documentaries. Create a DETAILED image generation prompt for a documentary cover.

DOCUMENTARY TITLE: "${temaLimpo}"
${descricao ? `DESCRIPTION: "${descricao.substring(0, 800)}"` : ''}

REQUIREMENTS FOR THE PROMPT:
1. Create a PHOTOREALISTIC, CINEMATIC scene that captures the essence of this documentary theme
2. Style: Netflix/HBO documentary poster - dramatic, impactful, emotionally powerful
3. Lighting: Dramatic chiaroscuro, golden hour, or moody atmospheric lighting
4. Colors: Rich, cinematic color grading (dark blues, warm golds, deep shadows)
5. Composition: Rule of thirds, depth of field, leading lines
6. Include SPECIFIC visual elements that represent the documentary's theme
7. NO TEXT, NO WORDS, NO LETTERS in the image
8. 16:9 aspect ratio, ultra high resolution quality
9. Make it ATTENTION-GRABBING and emotionally evocative

Output ONLY the English prompt for image generation, nothing else. Be extremely detailed and specific about the visual elements.`
              }]
            }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 500
            }
          })
        }
      );

      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          console.log("Tentando próxima chave para prompt...");
          continue;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const prompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      if (prompt) {
        console.log("Prompt gerado:", prompt.substring(0, 150) + "...");
        return prompt;
      }
    } catch (error) {
      console.error("Erro gerando prompt:", error);
      continue;
    }
  }

  return gerarPromptFallback(titulo, descricao);
}

// Fallback de prompt baseado no tema
function gerarPromptFallback(titulo: string, descricao: string | null): string {
  const temaLimpo = titulo.replace(/^Audiodescrição\s*\|\s*📹?\s*Documentário\s*-?\s*/i, '').trim();
  
  return `Ultra photorealistic Netflix documentary cover, 16:9 cinematic aspect ratio, ${temaLimpo} theme, dramatic moody lighting with deep shadows and golden highlights, professional photography style, emotionally powerful scene capturing the essence of the topic, dark blue and warm gold color grading, sophisticated atmospheric composition with depth of field, rule of thirds framing, HBO documentary quality, hyper detailed, no text no words no letters, 8K ultra high resolution, ${descricao ? descricao.substring(0, 200) : 'impactful visual storytelling'}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentarioId } = await req.json();
    
    if (!documentarioId) {
      return new Response(
        JSON.stringify({ error: "documentarioId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: doc, error: fetchError } = await supabase
      .from("documentarios_juridicos")
      .select("titulo, descricao, transcricao_texto, video_id")
      .eq("id", documentarioId)
      .single();

    if (fetchError || !doc) {
      return new Response(
        JSON.stringify({ error: "Documentário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🎬 Gerando capa para: ${doc.titulo}`);

    const promptCinematografico = await gerarPromptCinematografico(
      doc.titulo, doc.descricao
    );
    console.log("Prompt:", promptCinematografico);

    const imagemBytes = await gerarImagemGemini(promptCinematografico);
    console.log(`Imagem: ${imagemBytes.byteLength} bytes`);

    const webpBytes = await comprimirParaWebP(imagemBytes);
    const isWebP = webpBytes !== imagemBytes;
    console.log(`Final: ${webpBytes.byteLength} bytes (WebP: ${isWebP})`);

    const ext = isWebP ? "webp" : "png";
    const fileName = `capas-documentarios/${doc.video_id}_${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("imagens")
      .upload(fileName, webpBytes, {
        contentType: isWebP ? "image/webp" : "image/png",
        upsert: true
      });

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("imagens").getPublicUrl(fileName);
    const capaUrl = urlData.publicUrl;

    // Atualizar capa_webp E thumbnail com a imagem comprimida
    await supabase
      .from("documentarios_juridicos")
      .update({ 
        capa_webp: capaUrl,
        thumbnail: capaUrl  // Substitui thumbnail pela capa comprimida
      })
      .eq("id", documentarioId);

    console.log("✅ Capa e thumbnail salvas:", capaUrl);

    return new Response(
      JSON.stringify({ success: true, capa_webp: capaUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
