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
    const { materiaId, temas } = await req.json();

    if (!materiaId || !temas || !Array.isArray(temas)) {
      throw new Error("materiaId e temas são obrigatórios");
    }

    console.log(`[OAB] Confirmando ${temas.length} TEMAS para matéria ${materiaId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Deletar tópicos antigos da matéria
    await supabase
      .from('oab_trilhas_topicos')
      .delete()
      .eq('materia_id', materiaId);

    console.log("Tópicos antigos deletados");

    // Criar os tópicos a partir dos temas confirmados
    const topicosParaInserir: any[] = [];

    for (let i = 0; i < temas.length; i++) {
      const tema = temas[i];
      
      topicosParaInserir.push({
        materia_id: materiaId,
        titulo: tema.titulo,
        ordem: i + 1,
        pagina_inicial: tema.pagina_inicial,
        pagina_final: tema.pagina_final,
        status: 'pendente',
        subtopicos: tema.subtopicos || []
      });
    }

    console.log(`Inserindo ${topicosParaInserir.length} tópicos`);

    const { error: insertError } = await supabase
      .from('oab_trilhas_topicos')
      .insert(topicosParaInserir);

    if (insertError) {
      console.error("Erro ao inserir tópicos:", insertError);
      throw insertError;
    }

    // Atualizar status da matéria
    await supabase
      .from('oab_trilhas_materias')
      .update({ 
        status_processamento: 'pronto',
        temas_identificados: null // Limpar temporário
      })
      .eq('id', materiaId);

    console.log(`✅ ${topicosParaInserir.length} tópicos criados com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalTopicos: topicosParaInserir.length,
        message: `${topicosParaInserir.length} tópicos criados com sucesso`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro ao confirmar temas:", error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
