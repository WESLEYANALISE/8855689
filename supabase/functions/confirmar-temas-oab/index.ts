import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normaliza título removendo "Parte I", "Parte II", " - Parte 1", etc.
function normalizarTitulo(titulo: string): string {
  return titulo
    .replace(/\s*-\s*Parte\s+(I{1,4}|V?I{0,3}|IX|X{1,3}|\d+)\s*$/gi, '')
    .replace(/\s+Parte\s+(I{1,4}|V?I{0,3}|IX|X{1,3}|\d+)\s*$/gi, '')
    .replace(/\s+(I{1,3}|IV|V|VI{1,3}|VII{1,3}|IX|X)(\s+E\s+(I{1,3}|IV|V|VI{1,3}|VII{1,3}|IX|X))*\s*$/gi, '')
    .replace(/\s+\d+(\s+E\s+\d+)*\s*$/gi, '')
    .trim();
}

// Agrupa temas com títulos similares (ex: "Injúria - Parte I" + "Injúria - Parte II" = "Injúria")
function agruparTemasSimilares(temas: any[]): any[] {
  const grupos: Map<string, any[]> = new Map();
  const ordemGrupos: string[] = [];
  
  for (const tema of temas) {
    const chave = normalizarTitulo(tema.titulo).toUpperCase();
    if (!grupos.has(chave)) {
      grupos.set(chave, []);
      ordemGrupos.push(chave);
    }
    grupos.get(chave)!.push(tema);
  }
  
  const temasAgrupados: any[] = [];
  let ordem = 1;
  
  for (const chave of ordemGrupos) {
    const temasDoGrupo = grupos.get(chave)!;
    temasDoGrupo.sort((a, b) => (a.pagina_inicial || 0) - (b.pagina_inicial || 0));
    
    // Unificar subtópicos de todos os temas do grupo
    const subtopicosUnificados: any[] = [];
    for (const tema of temasDoGrupo) {
      if (tema.subtopicos?.length) {
        subtopicosUnificados.push(...tema.subtopicos);
      }
    }
    
    const tituloLimpo = normalizarTitulo(temasDoGrupo[0].titulo);
    
    temasAgrupados.push({
      ordem: ordem++,
      titulo: tituloLimpo,
      pagina_inicial: temasDoGrupo[0].pagina_inicial,
      pagina_final: temasDoGrupo[temasDoGrupo.length - 1].pagina_final,
      subtopicos: subtopicosUnificados
    });
  }
  
  console.log(`[Agrupamento] ${temas.length} temas → ${temasAgrupados.length} após merge`);
  return temasAgrupados;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materiaId, temas } = await req.json();

    if (!materiaId || !temas || !Array.isArray(temas)) {
      throw new Error("materiaId e temas são obrigatórios");
    }

    console.log(`[OAB] Recebidos ${temas.length} TEMAS para matéria ${materiaId}`);

    // Agrupar temas similares (Parte I + Parte II = único tema)
    const temasAgrupados = agruparTemasSimilares(temas);

    console.log(`[OAB] Confirmando ${temasAgrupados.length} TEMAS após agrupamento`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Deletar tópicos antigos da matéria
    await supabase
      .from('oab_trilhas_topicos')
      .delete()
      .eq('materia_id', materiaId);

    console.log("Tópicos antigos deletados");

    // Criar os tópicos a partir dos temas agrupados
    const topicosParaInserir: any[] = [];

    for (let i = 0; i < temasAgrupados.length; i++) {
      const tema = temasAgrupados[i];
      
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
