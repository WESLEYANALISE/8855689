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
    console.log("Iniciando atualização mensal de obras e curiosidades...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Registrar início do cron
    const { data: logEntry } = await supabase
      .from("aprofundamento_atualizacoes_log")
      .insert({
        tipo: "cron_mensal",
        status: "iniciado",
        detalhes: { inicio: new Date().toISOString() }
      })
      .select()
      .single();

    const logId = logEntry?.id;
    let registrosProcessados = 0;
    let registrosAtualizados = 0;
    const erros: string[] = [];

    // ========== PARTE 1: Atualizar obras dos ministros do STF ==========
    console.log("Atualizando obras dos ministros do STF...");
    
    const { data: ministros } = await supabase
      .from("tres_poderes_ministros_stf")
      .select("id, nome, biblioteca_slug")
      .eq("ativo", true);

    for (const ministro of ministros || []) {
      try {
        registrosProcessados++;
        
        if (!ministro.biblioteca_slug) {
          console.log(`Ministro ${ministro.nome} sem biblioteca_slug, pulando...`);
          continue;
        }

        // Chamar função de buscar obras do STF
        const { error } = await supabase.functions.invoke("buscar-obras-ministro-stf", {
          body: { membro_id: ministro.id }
        });

        if (error) {
          console.error(`Erro ao buscar obras de ${ministro.nome}:`, error);
          erros.push(`STF ${ministro.nome}: ${error.message}`);
        } else {
          registrosAtualizados++;
          console.log(`Obras de ${ministro.nome} atualizadas`);
        }

        // Delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Erro desconhecido";
        console.error(`Erro processando ministro ${ministro.nome}:`, e);
        erros.push(`STF ${ministro.nome}: ${errorMsg}`);
      }
    }

    // ========== PARTE 2: Atualizar curiosidades dos ministros do STF ==========
    console.log("Atualizando curiosidades dos ministros do STF...");
    
    for (const ministro of ministros || []) {
      try {
        // Verificar se precisa atualizar (mais de 30 dias)
        const { data: minData } = await supabase
          .from("tres_poderes_ministros_stf")
          .select("curiosidades_atualizadas_em")
          .eq("id", ministro.id)
          .single();

        const lastUpdate = minData?.curiosidades_atualizadas_em 
          ? new Date(minData.curiosidades_atualizadas_em) 
          : null;
        
        const needsUpdate = !lastUpdate || 
          (Date.now() - lastUpdate.getTime()) > (30 * 24 * 60 * 60 * 1000);

        if (!needsUpdate) {
          console.log(`Curiosidades de ${ministro.nome} ainda válidas`);
          continue;
        }

        // Chamar função de buscar curiosidades
        const { error } = await supabase.functions.invoke("buscar-curiosidades-ministro", {
          body: { membro_id: ministro.id }
        });

        if (error) {
          console.error(`Erro ao buscar curiosidades de ${ministro.nome}:`, error);
          erros.push(`Curiosidades ${ministro.nome}: ${error.message}`);
        } else {
          console.log(`Curiosidades de ${ministro.nome} atualizadas`);
        }

        // Delay
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Erro desconhecido";
        console.error(`Erro processando curiosidades de ${ministro.nome}:`, e);
        erros.push(`Curiosidades ${ministro.nome}: ${errorMsg}`);
      }
    }

    // ========== PARTE 3: Atualizar obras de deputados/senadores com Lattes ==========
    console.log("Atualizando obras de deputados e senadores com Lattes...");
    
    const { data: lattesCache } = await supabase
      .from("aprofundamento_lattes_cache")
      .select("*")
      .not("lattes_url", "is", null);

    for (const cache of lattesCache || []) {
      try {
        registrosProcessados++;

        // Verificar se precisa atualizar (mais de 30 dias)
        const lastUpdate = cache.ultima_atualizacao 
          ? new Date(cache.ultima_atualizacao) 
          : null;
        
        const needsUpdate = !lastUpdate || 
          (Date.now() - lastUpdate.getTime()) > (30 * 24 * 60 * 60 * 1000);

        if (!needsUpdate) {
          console.log(`Cache Lattes de ${cache.membro_nome} ainda válido`);
          continue;
        }

        // Chamar função de buscar obras do Lattes
        const { error } = await supabase.functions.invoke("buscar-obras-lattes", {
          body: { 
            nome: cache.membro_nome,
            tipo: cache.membro_tipo,
            membro_id: cache.membro_id
          }
        });

        if (error) {
          console.error(`Erro ao atualizar Lattes de ${cache.membro_nome}:`, error);
          erros.push(`Lattes ${cache.membro_nome}: ${error.message}`);
        } else {
          registrosAtualizados++;
          console.log(`Lattes de ${cache.membro_nome} atualizado`);
        }

        // Delay maior para Lattes (mais lento)
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Erro desconhecido";
        console.error(`Erro processando Lattes de ${cache.membro_nome}:`, e);
        erros.push(`Lattes ${cache.membro_nome}: ${errorMsg}`);
      }
    }

    // Atualizar log com resultado final
    const status = erros.length > 0 ? "concluido" : "concluido";
    
    await supabase
      .from("aprofundamento_atualizacoes_log")
      .update({
        status,
        registros_processados: registrosProcessados,
        registros_atualizados: registrosAtualizados,
        detalhes: { 
          erros: erros.slice(0, 20), // Limitar erros salvos
          total_erros: erros.length,
          fim: new Date().toISOString()
        },
        erro_mensagem: erros.length > 0 ? `${erros.length} erros encontrados` : null,
        concluido_at: new Date().toISOString()
      })
      .eq("id", logId);

    console.log(`Cron finalizado. Processados: ${registrosProcessados}, Atualizados: ${registrosAtualizados}, Erros: ${erros.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        registros_processados: registrosProcessados,
        registros_atualizados: registrosAtualizados,
        erros: erros.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro no cron de atualização:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
