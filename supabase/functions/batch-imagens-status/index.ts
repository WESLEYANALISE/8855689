import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { job_id, materia_id } = await req.json();

    // Buscar por job_id específico ou listar jobs de uma matéria
    let query = supabase.from("conceitos_batch_jobs").select("*");

    if (job_id) {
      query = query.eq("id", job_id);
    } else if (materia_id) {
      query = query.eq("materia_id", materia_id).order("created_at", { ascending: false });
    } else {
      // Retornar últimos 10 jobs
      query = query.order("created_at", { ascending: false }).limit(10);
    }

    const { data: jobs, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar jobs: ${error.message}`);
    }

    if (job_id && (!jobs || jobs.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Job não encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Formatar resposta
    const formattedJobs = (jobs || []).map(job => ({
      id: job.id,
      job_name: job.job_name,
      tipo: job.tipo,
      status: job.status,
      progress: {
        total: job.total_items,
        completed: job.completed_items,
        percentage: job.total_items > 0 
          ? Math.round((job.completed_items / job.total_items) * 100) 
          : 0
      },
      results: job.results_data,
      error: job.error_message,
      created_at: job.created_at,
      completed_at: job.completed_at
    }));

    return new Response(
      JSON.stringify({
        success: true,
        job: job_id ? formattedJobs[0] : undefined,
        jobs: job_id ? undefined : formattedJobs
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[batch-imagens-status] Erro:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
