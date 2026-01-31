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

interface ProcessedResult {
  id: string | number;
  slideId?: string;
  url?: string;
  error?: string;
}

// Gerar imagem usando Gemini 2.5 Flash Image
async function gerarImagemGemini(prompt: string, apiKey: string): Promise<string | null> {
  try {
    // Prompt com resolução EXATA para YouTube Thumbnail (1280x720)
    const optimizedPrompt = `Generate an image with EXACT dimensions: 1280x720 pixels (YouTube thumbnail format, 16:9 aspect ratio).

⚠️ CRITICAL REQUIREMENTS ⚠️
1. RESOLUTION: Exactly 1280 pixels wide by 720 pixels tall
2. BORDERLESS: NO white borders, margins, or empty corners - content must touch ALL FOUR EDGES
3. FULL-BLEED: The artwork fills the ENTIRE 1280x720 canvas with ZERO white space

IMAGE STYLE:
- Cinematic, dramatic, professional illustration
- Color palette: Deep blues (#1a2a4a), warm golds (#d4a853), burgundy (#722f37), amber (#f5a623)
- Background: MUST have solid color, gradient, or pattern - NEVER white
- Atmospheric lighting with depth and rich shadows
- Dark, moody aesthetic

CONTENT RULES:
- NO text, NO words, NO labels, NO captions in any language
- Legal/law themes: subtle scales of justice, columns, books, gavels as background elements

SUBJECT: ${prompt}

OUTPUT: A 1280x720 pixel image that completely fills the canvas edge-to-edge with no visible borders.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: optimizedPrompt }]
          }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"]
          }
        })
      }
    );

    if (!response.ok) {
      console.error(`[Gemini] Erro ${response.status}:`, await response.text());
      return null;
    }

    const data = await response.json();
    
    // Extrair imagem base64 da resposta
    for (const part of data.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data; // base64
      }
    }

    return null;
  } catch (error) {
    console.error("[Gemini] Exceção:", error);
    return null;
  }
}

// Comprimir imagem com TinyPNG
async function comprimirImagem(base64Data: string, tinypngKey: string): Promise<Uint8Array> {
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  try {
    // Primeiro: comprimir
    const shrinkResponse = await fetch("https://api.tinify.com/shrink", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`api:${tinypngKey}`)}`,
        "Content-Type": "application/octet-stream"
      },
      body: binaryData
    });

    if (!shrinkResponse.ok) {
      console.log("[TinyPNG] Falha na compressão, retornando original");
      return binaryData;
    }

    const result = await shrinkResponse.json();
    const outputUrl = result.output?.url;
    if (!outputUrl) return binaryData;

    // Segundo: converter para WebP
    const convertResponse = await fetch(outputUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`api:${tinypngKey}`)}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ convert: { type: "image/webp" } })
    });

    if (!convertResponse.ok) {
      // Fallback para PNG comprimido
      const pngResponse = await fetch(outputUrl);
      return new Uint8Array(await pngResponse.arrayBuffer());
    }

    return new Uint8Array(await convertResponse.arrayBuffer());
  } catch (error) {
    console.error("[TinyPNG] Erro:", error);
    return binaryData;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Usar o mesmo sistema de chaves Gemini do resto do projeto
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
    ].filter(Boolean) as string[];

    if (geminiKeys.length === 0) {
      throw new Error("Nenhuma GEMINI_KEY configurada (GEMINI_KEY_1, GEMINI_KEY_2, GEMINI_KEY_3)");
    }
    
    const TINYPNG_API_KEY = Deno.env.get("TINYPNG_API_KEY");
    
    // Rotacionar entre as chaves disponíveis
    let currentKeyIndex = 0;
    const getNextKey = (): string => {
      const key = geminiKeys[currentKeyIndex];
      currentKeyIndex = (currentKeyIndex + 1) % geminiKeys.length;
      return key;
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { job_id } = await req.json();

    if (!job_id) {
      throw new Error("job_id é obrigatório");
    }

    console.log(`[batch-imagens-processar] Processando job: ${job_id}`);

    // Buscar job
    const { data: job, error: jobError } = await supabase
      .from("conceitos_batch_jobs")
      .select("*")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      throw new Error(`Job não encontrado: ${job_id}`);
    }

    if (job.status === "completed") {
      return new Response(
        JSON.stringify({ success: true, message: "Job já concluído", results: job.results_data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (job.status === "failed") {
      return new Response(
        JSON.stringify({ success: false, error: job.error_message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const items: BatchItem[] = job.items_data || [];
    const results: ProcessedResult[] = job.results_data || [];
    const processedIds = new Set(results.map(r => String(r.id)));

    console.log(`[batch-imagens-processar] ${items.length} items, ${results.length} já processados`);

    // Processar items pendentes
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Pular já processados
      if (processedIds.has(String(item.id))) {
        continue;
      }

      console.log(`[batch-imagens-processar] Processando ${i + 1}/${items.length}: ${item.id}`);

      try {
        // Gerar imagem usando próxima chave do pool
        const base64Image = await gerarImagemGemini(item.prompt, getNextKey());
        
        if (!base64Image) {
          results.push({ id: item.id, slideId: item.slideId, error: "Falha na geração" });
          continue;
        }

        // Comprimir se TinyPNG disponível
        let imageData: Uint8Array;
        let contentType = "image/png";
        
        if (TINYPNG_API_KEY) {
          imageData = await comprimirImagem(base64Image, TINYPNG_API_KEY);
          contentType = "image/webp";
        } else {
          imageData = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
        }

        // Upload para Storage
        const fileName = `conceitos/batch/${job.tipo}/${item.slideId || item.id}-${Date.now()}.${contentType === "image/webp" ? "webp" : "png"}`;
        
        const { error: uploadError } = await supabase.storage
          .from("imagens")
          .upload(fileName, imageData, { contentType, upsert: true });

        if (uploadError) {
          console.error(`[batch-imagens-processar] Upload error:`, uploadError);
          results.push({ id: item.id, slideId: item.slideId, error: uploadError.message });
          continue;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage.from("imagens").getPublicUrl(fileName);
        const imageUrl = urlData.publicUrl;
        
        results.push({
          id: item.id,
          slideId: item.slideId,
          url: imageUrl
        });

        // Atualizar progresso no banco
        await supabase
          .from("conceitos_batch_jobs")
          .update({
            completed_items: results.filter(r => r.url).length,
            results_data: results
          })
          .eq("id", job_id);

        // ATUALIZAR IMEDIATAMENTE no slides_json do tópico (não esperar job terminar)
        if (job.tipo === "imagens_slides" && job.topico_id && item.slideId) {
          try {
            const { data: topico } = await supabase
              .from("conceitos_topicos")
              .select("slides_json")
              .eq("id", job.topico_id)
              .single();

            if (topico?.slides_json) {
              const slidesJson = topico.slides_json as any;
              const [secaoId, slideIdx] = item.slideId.split("-").map(Number);
              
              if (slidesJson.secoes?.[secaoId]?.slides?.[slideIdx]) {
                slidesJson.secoes[secaoId].slides[slideIdx].imagemUrl = imageUrl;
                
                await supabase
                  .from("conceitos_topicos")
                  .update({ slides_json: slidesJson })
                  .eq("id", job.topico_id);
                
                console.log(`[batch-imagens-processar] URL atualizada: slide ${item.slideId}`);
              }
            }
          } catch (updateErr) {
            console.error(`[batch-imagens-processar] Erro ao atualizar slide:`, updateErr);
          }
        }

        // Pequeno delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (itemError) {
        console.error(`[batch-imagens-processar] Erro no item ${item.id}:`, itemError);
        results.push({
          id: item.id,
          slideId: item.slideId,
          error: itemError instanceof Error ? itemError.message : "Erro desconhecido"
        });
      }
    }

    // Finalizar job
    const successCount = results.filter(r => r.url).length;
    const failCount = results.filter(r => r.error).length;
    
    const finalStatus = failCount === items.length ? "failed" : "completed";

    await supabase
      .from("conceitos_batch_jobs")
      .update({
        status: finalStatus,
        completed_items: successCount,
        results_data: results,
        completed_at: new Date().toISOString(),
        error_message: failCount > 0 ? `${failCount} items falharam` : null
      })
      .eq("id", job_id);

    console.log(`[batch-imagens-processar] Job ${job_id} finalizado: ${successCount} sucesso, ${failCount} falhas`);

    // Se for imagens de slides, atualizar o tópico específico com as URLs
    if (job.tipo === "imagens_slides" && job.topico_id) {
      // Buscar tópico específico
      const { data: topico } = await supabase
        .from("conceitos_topicos")
        .select("id, slides_json")
        .eq("id", job.topico_id)
        .single();

      if (topico?.slides_json) {
        let slidesJson = topico.slides_json as any;
        let updated = false;

        // Atualizar URLs nos slides
        for (const result of results) {
          if (result.url && result.slideId) {
            const [secaoId, slideIdx] = result.slideId.split("-").map(Number);
            
            if (slidesJson.secoes?.[secaoId]?.slides?.[slideIdx]) {
              slidesJson.secoes[secaoId].slides[slideIdx].imagemUrl = result.url;
              updated = true;
            }
          }
        }

        if (updated) {
          await supabase
            .from("conceitos_topicos")
            .update({ slides_json: slidesJson })
            .eq("id", topico.id);
          
          console.log(`[batch-imagens-processar] URLs atualizadas no tópico ${job.topico_id}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: finalStatus,
        processed: successCount,
        failed: failCount,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[batch-imagens-processar] Erro:", error);
    
    // Tentar marcar job como failed
    try {
      const { job_id } = await req.json();
      if (job_id) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from("conceitos_batch_jobs")
          .update({ status: "failed", error_message: errorMessage })
          .eq("id", job_id);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
