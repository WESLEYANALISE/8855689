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

// Modelos em ordem de prioridade (mais leve/barato primeiro)
const MODELOS_IMAGEM = [
  'gemini-2.0-flash-exp-image-generation', // Modelo principal com geração de imagem
];

async function generateImageWithGemini(prompt: string, keys: string[]): Promise<string | null> {
  console.log(`[Capa OAB] Gerando imagem, ${keys.length} chaves disponíveis`);
  
  for (const modelo of MODELOS_IMAGEM) {
    console.log(`[Capa OAB] Tentando modelo: ${modelo}`);
    
    for (let i = 0; i < keys.length; i++) {
      const apiKey = keys[i];
      console.log(`[Capa OAB] Modelo ${modelo}, chave ${i + 1}/${keys.length}...`);
      
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
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
          console.log(`[Capa OAB] Chave ${i + 1} rate limited (${response.status}), próxima...`);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Capa OAB] Erro chave ${i + 1}: ${response.status} - ${errorText.substring(0, 100)}`);
          continue;
        }

        const data = await response.json();
        
        // Extrair imagem da resposta do Gemini
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            console.log(`[Capa OAB] ✓ Imagem gerada: modelo=${modelo}, chave=${i + 1}`);
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
        
        console.log(`[Capa OAB] Chave ${i + 1} sem imagem, próxima...`);
        continue;
        
      } catch (error) {
        console.error(`[Capa OAB] Exceção chave ${i + 1}:`, error);
        continue;
      }
    }
  }
  
  console.error('[Capa OAB] Todas as tentativas falharam');
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topico_id, titulo, area, materia_id } = await req.json();

    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: "topico_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[Capa OAB] Tópico ${topico_id}: "${titulo}" (${area})`);

    // CACHE: Verificar se outro tópico da mesma matéria já tem capa
    if (materia_id) {
      const { data: siblingWithCover } = await supabase
        .from("oab_trilhas_topicos")
        .select("capa_url")
        .eq("materia_id", materia_id)
        .not("capa_url", "is", null)
        .neq("id", topico_id)
        .limit(1)
        .single();

      if (siblingWithCover?.capa_url) {
        console.log(`[Capa OAB] ✓ Cache: reutilizando capa da matéria ${materia_id}`);
        
        const { error: updateError } = await supabase
          .from("oab_trilhas_topicos")
          .update({ capa_url: siblingWithCover.capa_url })
          .eq("id", topico_id);

        if (updateError) {
          console.error("[Capa OAB] Erro ao atualizar com cache:", updateError);
        }

        return new Response(
          JSON.stringify({ success: true, cached: true, capa_url: siblingWithCover.capa_url }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Verificar chaves disponíveis
    const geminiKeys = getGeminiKeys();
    if (geminiKeys.length === 0) {
      throw new Error("Nenhuma chave Gemini configurada");
    }

    // PROMPT SIMPLIFICADO (70% menor)
    const imagePrompt = `16:9 dark cinematic illustration, Brazilian law theme about "${area}".
Abstract geometric patterns with scales of justice.
Deep navy and burgundy tones, dramatic lighting.
No text, no faces, minimal style.`;

    console.log(`[Capa OAB] Prompt: ${imagePrompt.length} chars`);

    // Gerar imagem usando Gemini
    const imageDataUrl = await generateImageWithGemini(imagePrompt, geminiKeys);

    if (!imageDataUrl) {
      console.log("[Capa OAB] Imagem não gerada, retornando fallback");
      return new Response(
        JSON.stringify({ success: false, message: "Imagem não gerada" }),
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
      console.error("[Capa OAB] Erro upload:", uploadError);
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

    console.log(`[Capa OAB] ✓ Nova capa salva: ${capaUrl}`);

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
