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
    const { materia_id, image_base64, file_name } = await req.json();

    if (!materia_id || !image_base64) {
      return new Response(
        JSON.stringify({ error: "materia_id e image_base64 são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Converter base64 para buffer
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const finalFileName = file_name || `materia-${materia_id}-${Date.now()}.webp`;

    // Upload para o Storage
    const { error: uploadError } = await supabase.storage
      .from("gerador-imagens")
      .upload(`capas-materias/${finalFileName}`, bytes.buffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload falhou: ${uploadError.message}`);
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from("gerador-imagens")
      .getPublicUrl(`capas-materias/${finalFileName}`);

    // Aplicar a capa a TODOS os tópicos da matéria
    const { data, error } = await supabase
      .from("oab_trilhas_topicos")
      .update({ capa_url: publicUrl })
      .eq("materia_id", materia_id)
      .select("id");

    if (error) {
      throw new Error(`Erro ao atualizar tópicos: ${error.message}`);
    }

    console.log(`[Upload Capa] ✅ Capa uploaded e aplicada a ${data?.length || 0} tópicos`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        capa_url: publicUrl,
        topicos_atualizados: data?.length || 0
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Upload Capa] Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
