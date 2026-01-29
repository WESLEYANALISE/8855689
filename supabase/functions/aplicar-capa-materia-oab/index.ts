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
    const { materia_id, capa_url } = await req.json();

    if (!materia_id || !capa_url) {
      return new Response(
        JSON.stringify({ error: "materia_id e capa_url são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Aplicar a capa a TODOS os tópicos da matéria
    const { data, error } = await supabase
      .from("oab_trilhas_topicos")
      .update({ capa_url: capa_url })
      .eq("materia_id", materia_id)
      .select("id");

    if (error) {
      throw new Error(`Erro ao atualizar: ${error.message}`);
    }

    console.log(`[Aplicar Capa] ✅ Capa aplicada a ${data?.length || 0} tópicos da matéria ${materia_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        topicos_atualizados: data?.length || 0,
        capa_url 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Aplicar Capa] Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
