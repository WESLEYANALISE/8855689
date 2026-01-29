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

    console.log(`Confirmando ${temas.length} TEMAS para matéria ${materiaId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // PRESERVAÇÃO DE CAPAS: Buscar capas dos tópicos antigos ANTES de deletar
    const { data: topicosAntigos } = await supabase
      .from('conceitos_topicos')
      .select('titulo, capa_url')
      .eq('materia_id', materiaId);

    // Criar mapeamento de título normalizado → capa_url
    const capasAntigas: Record<string, string> = {};
    if (topicosAntigos) {
      for (const topico of topicosAntigos) {
        if (topico.capa_url) {
          // Normalizar título para comparação (lowercase, sem acentos)
          const tituloNormalizado = topico.titulo
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
          capasAntigas[tituloNormalizado] = topico.capa_url;
        }
      }
    }
    console.log(`[Preservação] ${Object.keys(capasAntigas).length} capas encontradas para reutilização`);

    // Buscar capa da matéria para usar como fallback
    const { data: materia } = await supabase
      .from('conceitos_materias')
      .select('capa_url')
      .eq('id', materiaId)
      .single();
    
    const capaMateria = materia?.capa_url || null;
    console.log(`[Preservação] Capa da matéria para fallback: ${capaMateria ? 'encontrada' : 'não encontrada'}`);

    // Deletar tópicos antigos
    await supabase
      .from('conceitos_topicos')
      .delete()
      .eq('materia_id', materiaId);

    console.log("Tópicos antigos deletados");

    // Criar apenas os TEMAS (capítulos principais)
    // Os subtópicos ficam armazenados no campo topicos_indice (JSONB)
    const temasParaInserir: any[] = [];
    let capasReutilizadas = 0;
    let capasFallback = 0;

    for (let i = 0; i < temas.length; i++) {
      const tema = temas[i];
      
      // Tentar encontrar capa existente pelo título
      const tituloNormalizado = tema.titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
      
      let capaUrl: string | null = null;
      
      // 1. Primeiro, tentar reutilizar capa existente
      if (capasAntigas[tituloNormalizado]) {
        capaUrl = capasAntigas[tituloNormalizado];
        capasReutilizadas++;
        console.log(`[Preservação] Reutilizando capa para: ${tema.titulo}`);
      }
      // 2. Se não encontrou, usar capa da matéria como fallback
      else if (capaMateria) {
        capaUrl = capaMateria;
        capasFallback++;
        console.log(`[Preservação] Usando capa da matéria para: ${tema.titulo}`);
      }
      
      temasParaInserir.push({
        materia_id: materiaId,
        titulo: tema.titulo,
        complemento: null, // Não tem complemento, é o tema principal
        ordem: i + 1,
        pagina_inicial: tema.pagina_inicial,
        pagina_final: tema.pagina_final,
        status: 'pendente',
        capa_url: capaUrl, // Preservar capa!
        // Armazenar os subtópicos para uso na geração de conteúdo
        topicos_indice: tema.subtopicos || []
      });
    }

    console.log(`[Preservação] ${capasReutilizadas} capas reutilizadas, ${capasFallback} usando fallback da matéria`);
    console.log(`Inserindo ${temasParaInserir.length} temas (capítulos principais)`);

    const { error: insertError } = await supabase
      .from('conceitos_topicos')
      .insert(temasParaInserir);

    if (insertError) {
      console.error("Erro ao inserir temas:", insertError);
      throw insertError;
    }

    // Atualizar status da matéria
    await supabase
      .from('conceitos_materias')
      .update({ 
        status_processamento: 'pronto',
        temas_identificados: null // Limpar temporário
      })
      .eq('id', materiaId);

    console.log(`✅ ${temasParaInserir.length} temas criados com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalTemas: temasParaInserir.length,
        message: `${temasParaInserir.length} temas criados (cada tema terá Introdução + Tópicos + Síntese na geração de conteúdo)`
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
