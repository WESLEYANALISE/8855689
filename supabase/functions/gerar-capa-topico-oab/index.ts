import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Gerar prompt para a imagem
    const imagePrompt = `CINEMATIC 16:9 horizontal illustration, EDGE-TO-EDGE composition with NO white borders or margins. 
Dark rich background covering the entire frame in deep navy and burgundy tones. 
Brazilian legal education scene with subtle scales of justice, law books, and abstract geometric patterns. 
Professional, sophisticated mood representing "${area}" for the OAB bar exam. 
Theme: "${titulo}". 
Modern minimal style with dramatic lighting, no text, no people faces.`;

    // Chamar a edge function de geração de imagem
    const { data: imageData, error: imageError } = await supabase.functions.invoke("gerar-imagem-hf", {
      body: { prompt: imagePrompt }
    });

    if (imageError) {
      console.error("[Capa OAB] Erro ao gerar imagem:", imageError);
      throw imageError;
    }

    if (!imageData?.image) {
      console.log("[Capa OAB] Imagem não retornada, usando fallback da matéria");
      return new Response(
        JSON.stringify({ success: false, message: "Imagem não gerada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Converter base64 para upload no storage
    const base64Data = imageData.image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload para o storage
    const fileName = `oab-trilhas/topicos/${topico_id}-${Date.now()}.webp`;
    
    const { error: uploadError } = await supabase.storage
      .from("imagens")
      .upload(fileName, imageBuffer, {
        contentType: "image/webp",
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
