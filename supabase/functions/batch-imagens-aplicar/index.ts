import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Esta função aplica as URLs de imagens já geradas (em results_data)
 * aos slides_json do tópico correspondente.
 * 
 * Útil para recuperar jobs que foram interrompidos por timeout.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { topico_id, job_id } = await req.json();

    if (!topico_id && !job_id) {
      throw new Error("topico_id ou job_id é obrigatório");
    }

    console.log(`[batch-imagens-aplicar] Aplicando URLs para tópico: ${topico_id || 'via job ' + job_id}`);

    // Buscar jobs com imagens já geradas
    let query = supabase
      .from("conceitos_batch_jobs")
      .select("*")
      .eq("tipo", "imagens_slides");

    if (job_id) {
      query = query.eq("id", job_id);
    } else {
      query = query.eq("topico_id", topico_id);
    }

    const { data: jobs, error: jobsError } = await query.order("created_at", { ascending: false });

    if (jobsError || !jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhum job encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Usar o job mais recente com resultados
    const job = jobs.find(j => j.results_data && j.results_data.length > 0) || jobs[0];
    
    if (!job.results_data || job.results_data.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Job sem resultados" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const targetTopicoId = topico_id || job.topico_id;

    // Buscar tópico
    const { data: topico, error: topicoError } = await supabase
      .from("conceitos_topicos")
      .select("id, slides_json")
      .eq("id", targetTopicoId)
      .single();

    if (topicoError || !topico?.slides_json) {
      return new Response(
        JSON.stringify({ success: false, error: "Tópico não encontrado ou sem slides" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    let slidesJson = topico.slides_json as any;
    let updatedCount = 0;

    // Aplicar URLs dos resultados
    for (const result of job.results_data) {
      if (result.url && result.slideId) {
        const [secaoId, slideIdx] = result.slideId.split("-").map(Number);
        
        if (slidesJson.secoes?.[secaoId]?.slides?.[slideIdx]) {
          const currentUrl = slidesJson.secoes[secaoId].slides[slideIdx].imagemUrl;
          
          // Só atualizar se não tiver URL ou se for diferente
          if (!currentUrl || currentUrl !== result.url) {
            slidesJson.secoes[secaoId].slides[slideIdx].imagemUrl = result.url;
            updatedCount++;
            console.log(`[batch-imagens-aplicar] Aplicando URL: slide ${result.slideId}`);
          }
        }
      }
    }

    if (updatedCount > 0) {
      await supabase
        .from("conceitos_topicos")
        .update({ slides_json: slidesJson })
        .eq("id", targetTopicoId);
      
      console.log(`[batch-imagens-aplicar] ${updatedCount} URLs aplicadas ao tópico ${targetTopicoId}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        topico_id: targetTopicoId,
        job_id: job.id,
        total_results: job.results_data.length,
        applied: updatedCount,
        message: updatedCount > 0 
          ? `${updatedCount} imagens atualizadas` 
          : "Nenhuma imagem nova para aplicar"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[batch-imagens-aplicar] Erro:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
