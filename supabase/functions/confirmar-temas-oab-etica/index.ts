import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { temas } = await req.json();
    
    console.log("[Ética] Confirmando", temas.length, "temas...");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Deletar tópicos existentes primeiro (dependência)
    const { error: deleteTopicosError } = await supabase
      .from('oab_etica_topicos')
      .delete()
      .gte('id', 0);

    if (deleteTopicosError) {
      console.error("Erro ao deletar tópicos antigos:", deleteTopicosError);
    }

    // Deletar temas existentes
    const { error: deleteError } = await supabase
      .from('oab_etica_temas')
      .delete()
      .gte('id', 0);

    if (deleteError) {
      console.error("Erro ao deletar temas antigos:", deleteError);
    }

    // Inserir novos temas
    const temasParaInserir = temas.map((tema: any, index: number) => ({
      ordem: index + 1,
      titulo: tema.titulo,
      pagina_inicial: tema.pagina_inicial,
      pagina_final: tema.pagina_final,
      subtopicos: tema.subtopicos || [],
      status: 'pendente'
    }));

    const { data: temasInseridos, error: insertError } = await supabase
      .from('oab_etica_temas')
      .insert(temasParaInserir)
      .select();

    if (insertError) {
      console.error("Erro ao inserir temas:", insertError);
      throw insertError;
    }

    console.log(`${temasInseridos?.length} temas criados com sucesso`);

    // ===== CRIAR TÓPICOS PARA CADA TEMA =====
    let totalTopicos = 0;
    
    for (const temaInserido of temasInseridos || []) {
      const subtopicos = temaInserido.subtopicos as Array<{titulo: string; pagina_inicial?: number; pagina_final?: number}> || [];
      
      if (subtopicos.length > 0) {
        const topicosParaInserir = subtopicos.map((sub: any, index: number) => ({
          tema_id: temaInserido.id,
          ordem: index + 1,
          titulo: sub.titulo || sub,
          pagina_inicial: sub.pagina_inicial || temaInserido.pagina_inicial,
          pagina_final: sub.pagina_final || temaInserido.pagina_final,
          status: 'pendente'
        }));

        const { data: topicosInseridos, error: topicosError } = await supabase
          .from('oab_etica_topicos')
          .insert(topicosParaInserir)
          .select();

        if (topicosError) {
          console.error(`Erro ao inserir tópicos do tema ${temaInserido.id}:`, topicosError);
        } else {
          totalTopicos += topicosInseridos?.length || 0;
          console.log(`  → ${topicosInseridos?.length} tópicos criados para tema "${temaInserido.titulo}"`);
        }
      } else {
        // Se não tem subtópicos, criar um tópico com o mesmo título do tema
        const { data: topicoUnico, error: topicoError } = await supabase
          .from('oab_etica_topicos')
          .insert({
            tema_id: temaInserido.id,
            ordem: 1,
            titulo: temaInserido.titulo,
            pagina_inicial: temaInserido.pagina_inicial,
            pagina_final: temaInserido.pagina_final,
            status: 'pendente'
          })
          .select();

        if (topicoError) {
          console.error(`Erro ao inserir tópico único do tema ${temaInserido.id}:`, topicoError);
        } else {
          totalTopicos += 1;
          console.log(`  → 1 tópico criado para tema "${temaInserido.titulo}" (sem subtópicos)`);
        }
      }
    }

    console.log(`✅ Total: ${temasInseridos?.length} temas e ${totalTopicos} tópicos criados`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${temasInseridos?.length} temas e ${totalTopicos} tópicos criados com sucesso`,
        temas: temasInseridos,
        totalTopicos
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Erro na confirmação:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});