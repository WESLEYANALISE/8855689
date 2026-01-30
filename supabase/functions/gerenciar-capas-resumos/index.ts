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
    const { action, area, capa_url } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "limpar_capas_area") {
      // Limpar todas as capas de uma área específica
      if (!area) {
        return new Response(
          JSON.stringify({ error: "Área é obrigatória" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("RESUMO")
        .update({ url_imagem_resumo: null })
        .eq("area", area)
        .select("id");

      if (error) throw error;

      console.log(`[Gerenciar Capas] ✅ Capas limpas para ${data?.length || 0} resumos da área: ${area}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Capas removidas de ${data?.length || 0} resumos`,
          resumos_atualizados: data?.length || 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "limpar_todas_capas") {
      // Limpar TODAS as capas de TODAS as áreas
      const { data, error } = await supabase
        .from("RESUMO")
        .update({ url_imagem_resumo: null })
        .not("area", "is", null)
        .select("id");

      if (error) throw error;

      console.log(`[Gerenciar Capas] ✅ Todas as capas limpas: ${data?.length || 0} resumos`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Todas as capas removidas de ${data?.length || 0} resumos`,
          resumos_atualizados: data?.length || 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "aplicar_capa_area") {
      // Aplicar uma capa a TODOS os resumos de uma área
      if (!area || !capa_url) {
        return new Response(
          JSON.stringify({ error: "Área e capa_url são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("RESUMO")
        .update({ url_imagem_resumo: capa_url })
        .eq("area", area)
        .select("id");

      if (error) throw error;

      console.log(`[Gerenciar Capas] ✅ Capa aplicada a ${data?.length || 0} resumos da área: ${area}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Capa aplicada a ${data?.length || 0} resumos`,
          resumos_atualizados: data?.length || 0,
          capa_url
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "listar_areas") {
      // Listar todas as áreas com contagem de resumos e status de capa
      const { data, error } = await supabase
        .from("RESUMO")
        .select("area, url_imagem_resumo")
        .not("area", "is", null);

      if (error) throw error;

      const areaMap = new Map<string, { count: number; temCapa: boolean; capaUrl?: string }>();
      data?.forEach((item) => {
        const existing = areaMap.get(item.area);
        if (existing) {
          existing.count++;
          if (!existing.temCapa && item.url_imagem_resumo) {
            existing.temCapa = true;
            existing.capaUrl = item.url_imagem_resumo;
          }
        } else {
          areaMap.set(item.area, { 
            count: 1, 
            temCapa: !!item.url_imagem_resumo,
            capaUrl: item.url_imagem_resumo || undefined
          });
        }
      });

      const areas = Array.from(areaMap.entries())
        .map(([area, data]) => ({ area, ...data }))
        .sort((a, b) => a.area.localeCompare(b.area));

      return new Response(
        JSON.stringify({ success: true, areas }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida. Use: limpar_capas_area, limpar_todas_capas, aplicar_capa_area, listar_areas" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Gerenciar Capas] Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
