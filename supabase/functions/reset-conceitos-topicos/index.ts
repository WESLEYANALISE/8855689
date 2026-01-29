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
    const { materia_id, usar_capa_materia_fallback = true } = await req.json();

    if (!materia_id) {
      return new Response(
        JSON.stringify({ error: "materia_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar capa da matéria para usar como fallback
    let capaMateria: string | null = null;
    if (usar_capa_materia_fallback) {
      const { data: materia } = await supabase
        .from("conceitos_materias")
        .select("capa_url")
        .eq("id", materia_id)
        .single();
      
      capaMateria = materia?.capa_url || null;
      console.log(`[Reset] Capa da matéria para fallback: ${capaMateria ? 'encontrada' : 'não encontrada'}`);
    }

    // Buscar tópicos atuais para verificar quais precisam de capa
    const { data: topicosAtuais } = await supabase
      .from("conceitos_topicos")
      .select("id, titulo, capa_url")
      .eq("materia_id", materia_id);

    // Resetar todos os tópicos da matéria (mantendo capa_url existente)
    const { data, error } = await supabase
      .from("conceitos_topicos")
      .update({
        status: "pendente",
        tentativas: 0,
        progresso: 0,
        posicao_fila: null,
        conteudo_gerado: null,
        updated_at: new Date().toISOString()
      })
      .eq("materia_id", materia_id)
      .select("id, titulo, capa_url");

    if (error) {
      console.error("Erro ao resetar:", error);
      throw error;
    }

    // Aplicar capa da matéria aos tópicos sem capa
    let topicosAtualizadosComCapa = 0;
    if (capaMateria && data) {
      for (const topico of data) {
        if (!topico.capa_url) {
          const { error: updateError } = await supabase
            .from("conceitos_topicos")
            .update({ capa_url: capaMateria })
            .eq("id", topico.id);
          
          if (!updateError) {
            topicosAtualizadosComCapa++;
            console.log(`[Reset] Aplicado capa da matéria ao tópico: ${topico.titulo}`);
          }
        }
      }
    }

    console.log(`[Reset] ${data?.length || 0} tópicos resetados para matéria ${materia_id}`);
    console.log(`[Reset] ${topicosAtualizadosComCapa} tópicos receberam capa da matéria como fallback`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${data?.length || 0} tópicos resetados`,
        topicos_com_fallback: topicosAtualizadosComCapa,
        topicos: data 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
