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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar todas as matérias ativas
    const { data: materias, error: materiasError } = await supabase
      .from("oab_trilhas_materias")
      .select("id, nome")
      .eq("ativo", true)
      .order("ordem");

    if (materiasError) throw materiasError;

    console.log(`Encontradas ${materias.length} matérias ativas`);

    const resultados: Record<string, { inseridos: number; temas: string[] }> = {};

    for (const materia of materias) {
      // Mapear nome da matéria para área no RESUMO
      // Alguns nomes precisam de ajuste
      let areaResumo = materia.nome;
      
      // Mapeamentos especiais (caso o nome na tabela RESUMO seja diferente)
      const mapeamentos: Record<string, string> = {
        "Ética Profissional": "Revisão Oab", // Pode não existir no RESUMO
        "Direito Previdenciário": "Direito Previndenciario",
        "Direito Tributário": "Direito Tributario",
        "Filosofia do Direito": "Teoria e Filosofia do Direito",
      };
      
      if (mapeamentos[materia.nome]) {
        areaResumo = mapeamentos[materia.nome];
      }

      // Buscar temas distintos do RESUMO para esta área
      const { data: temas, error: temasError } = await supabase
        .from("RESUMO")
        .select("tema, \"ordem Tema\"")
        .eq("area", areaResumo)
        .not("tema", "is", null)
        .order("\"ordem Tema\"", { ascending: true });

      if (temasError) {
        console.error(`Erro ao buscar temas para ${materia.nome}:`, temasError);
        continue;
      }

      // Também tentar buscar diretamente pelo nome da matéria
      if (!temas || temas.length === 0) {
        const { data: temasAlt, error: temasAltError } = await supabase
          .from("RESUMO")
          .select("tema, \"ordem Tema\"")
          .eq("area", materia.nome)
          .not("tema", "is", null)
          .order("\"ordem Tema\"", { ascending: true });
        
        if (!temasAltError && temasAlt && temasAlt.length > 0) {
          temas?.push(...temasAlt);
        }
      }

      // Remover duplicados e ordenar
      const temasUnicos = Array.from(
        new Map(temas?.map(t => [t.tema, t]) || []).values()
      ).sort((a, b) => {
        const ordemA = parseInt(a["ordem Tema"]) || 999;
        const ordemB = parseInt(b["ordem Tema"]) || 999;
        return ordemA - ordemB;
      });

      console.log(`${materia.nome}: ${temasUnicos.length} temas encontrados`);

      // Verificar tópicos já existentes para esta matéria
      const { data: topicosExistentes } = await supabase
        .from("oab_trilhas_topicos")
        .select("titulo")
        .eq("materia_id", materia.id);

      const titulosExistentes = new Set(
        topicosExistentes?.map(t => t.titulo.toLowerCase()) || []
      );

      // Inserir novos tópicos
      const novosTopicos = temasUnicos
        .filter(t => !titulosExistentes.has(t.tema.toLowerCase()))
        .map((tema, index) => ({
          materia_id: materia.id,
          ordem: parseInt(tema["ordem Tema"]) || (index + 1),
          titulo: tema.tema,
          status: "pendente",
        }));

      if (novosTopicos.length > 0) {
        const { error: insertError } = await supabase
          .from("oab_trilhas_topicos")
          .insert(novosTopicos);

        if (insertError) {
          console.error(`Erro ao inserir tópicos para ${materia.nome}:`, insertError);
        }
      }

      resultados[materia.nome] = {
        inseridos: novosTopicos.length,
        temas: temasUnicos.map(t => t.tema),
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tópicos populados com sucesso",
        resultados,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
