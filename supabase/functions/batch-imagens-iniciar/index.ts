import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BatchItem {
  id: string | number;
  prompt: string;
  slideId?: string;
}

interface BatchRequest {
  tipo: "capas_topicos" | "imagens_slides";
  items: BatchItem[];
  materia_id?: number;
  topico_id?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tipo, items, materia_id, topico_id }: BatchRequest = await req.json();

    if (!tipo || !items || items.length === 0) {
      throw new Error("tipo e items são obrigatórios");
    }

    console.log(`[batch-imagens-iniciar] Iniciando batch ${tipo} com ${items.length} items`);

    // Criar JSONL para o batch
    // Formato: cada linha é um objeto com "key" e "request"
    const jsonlLines = items.map((item, index) => {
      const request = {
        contents: [
          {
            parts: [
              {
                text: `Generate a high-quality educational illustration for a law/legal course slide. 
                
Style: Professional, modern, minimalist with subtle legal themes (scales of justice, books, gavels can appear subtly).
Color palette: Deep blues, warm golds, elegant whites.
Mood: Authoritative yet approachable, suitable for academic content.

Subject: ${item.prompt}

Create a 16:9 landscape image that would work as a slide header or hero image.`
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ["image", "text"],
          imageSizeOptions: {
            aspectRatio: "ASPECT_RATIO_16_9"
          }
        }
      };

      return JSON.stringify({
        key: item.slideId || `${item.id}-${index}`,
        request
      });
    }).join("\n");

    // Gerar nome único para o job
    const timestamp = Date.now();
    const jobName = `batch-${tipo}-${timestamp}`;

    // Criar o batch job via Gemini Batch API
    // Nota: A API de Batch do Gemini requer upload para Cloud Storage primeiro
    // Por enquanto, vamos simular com processamento sequencial otimizado
    
    // Alternativa: Usar o endpoint de batch prediction
    // POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:batchGenerateContent
    
    // Salvar job no banco com items para processamento posterior
    const { data: job, error: jobError } = await supabase
      .from("conceitos_batch_jobs")
      .insert({
        job_name: jobName,
        tipo,
        status: "pending",
        total_items: items.length,
        completed_items: 0,
        materia_id,
        topico_id,
        items_data: items,
        results_data: []
      })
      .select()
      .single();

    if (jobError) {
      console.error("[batch-imagens-iniciar] Erro ao criar job:", jobError);
      throw new Error(`Erro ao criar job: ${jobError.message}`);
    }

    console.log(`[batch-imagens-iniciar] Job criado: ${job.id}`);

    // Iniciar processamento em background
    // O processamento real será feito por batch-imagens-processar
    // que pode ser chamado via cron ou polling
    
    // Atualizar status para running
    await supabase
      .from("conceitos_batch_jobs")
      .update({ status: "running" })
      .eq("id", job.id);

    // Disparar o processamento assíncrono chamando a função de processamento
    // Não esperamos a resposta para retornar rápido ao cliente
    const processUrl = `${supabaseUrl}/functions/v1/batch-imagens-processar`;
    
    fetch(processUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ job_id: job.id })
    }).catch(err => {
      console.error("[batch-imagens-iniciar] Erro ao disparar processamento:", err);
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        job_name: jobName,
        total_items: items.length,
        message: "Batch iniciado. Use batch-imagens-status para monitorar."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[batch-imagens-iniciar] Erro:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
