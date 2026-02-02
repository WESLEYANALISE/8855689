import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pool de chaves Gemini com fallback
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const key1 = Deno.env.get('GEMINI_KEY_1');
  const key2 = Deno.env.get('GEMINI_KEY_2');
  const key3 = Deno.env.get('GEMINI_KEY_3');
  const keyPremium = Deno.env.get('DIREITO_PREMIUM_API_KEY');
  
  if (key1) keys.push(key1);
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);
  if (keyPremium) keys.push(keyPremium);
  
  return keys;
}

async function generateImageWithGemini(prompt: string, keys: string[]): Promise<string | null> {
  console.log(`[Capa OAB] Gerando imagem com Gemini Flash, ${keys.length} chaves disponíveis`);
  
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    console.log(`[Capa OAB] Tentando chave ${i + 1}/${keys.length}...`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

      if (response.status === 429 || response.status === 503) {
        console.log(`[Capa OAB] Chave ${i + 1} rate limited (${response.status}), tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Capa OAB] Erro na chave ${i + 1}: ${response.status} - ${errorText.substring(0, 200)}`);
        continue;
      }

      const data = await response.json();
      
      // Extrair imagem da resposta do Gemini
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          console.log(`[Capa OAB] ✓ Imagem gerada com sucesso usando chave ${i + 1}`);
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      
      console.log(`[Capa OAB] Chave ${i + 1} não retornou imagem, tentando próxima...`);
      continue;
      
    } catch (error) {
      console.error(`[Capa OAB] Exceção na chave ${i + 1}:`, error);
      continue;
    }
  }
  
  console.error('[Capa OAB] Todas as chaves Gemini falharam');
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topico_id, titulo, area } = await req.json();

    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: "topico_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[Capa OAB] Gerando capa para tópico ${topico_id}: ${titulo}`);

    // Verificar chaves disponíveis
    const geminiKeys = getGeminiKeys();
    if (geminiKeys.length === 0) {
      throw new Error("Nenhuma chave Gemini configurada");
    }

    // Gerar prompt para a imagem
    const imagePrompt = `Generate a CINEMATIC 16:9 horizontal illustration with EDGE-TO-EDGE composition and NO white borders or margins. 
Dark rich background covering the entire frame in deep navy and burgundy tones. 
Brazilian legal education scene with subtle scales of justice, law books, and abstract geometric patterns. 
Professional, sophisticated mood representing "${area}" for the OAB bar exam. 
Theme: "${titulo}". 
Modern minimal style with dramatic lighting, no text, no people faces.
Ultra high resolution, photorealistic quality.`;

    // Gerar imagem usando Gemini Flash
    const imageDataUrl = await generateImageWithGemini(imagePrompt, geminiKeys);

    if (!imageDataUrl) {
      console.log("[Capa OAB] Imagem não gerada, usando fallback da matéria");
      return new Response(
        JSON.stringify({ success: false, message: "Imagem não gerada - todas as chaves falharam" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Converter base64 para upload no storage
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Determinar extensão do arquivo baseado no MIME type
    const mimeMatch = imageDataUrl.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
    const extension = mimeType.split('/')[1] || 'png';

    // Upload para o storage
    const fileName = `oab-trilhas/topicos/${topico_id}-${Date.now()}.${extension}`;
    
    const { error: uploadError } = await supabase.storage
      .from("imagens")
      .upload(fileName, imageBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.error("[Capa OAB] Erro no upload:", uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from("imagens")
      .getPublicUrl(fileName);

    const capaUrl = urlData?.publicUrl;

    // Atualizar o tópico com a URL da capa
    const { error: updateError } = await supabase
      .from("oab_trilhas_topicos")
      .update({ capa_url: capaUrl })
      .eq("id", topico_id);

    if (updateError) {
      console.error("[Capa OAB] Erro ao atualizar tópico:", updateError);
      throw updateError;
    }

    console.log(`[Capa OAB] ✓ Capa gerada e salva: ${capaUrl}`);

    return new Response(
      JSON.stringify({ success: true, capa_url: capaUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[Capa OAB] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
