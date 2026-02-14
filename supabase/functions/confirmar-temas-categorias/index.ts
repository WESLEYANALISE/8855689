import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizarTitulo(titulo: string): string {
  return titulo
    .replace(/\s*[-–—]\s*Parte\s+(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)\s*$/gi, '')
    .replace(/\s+Parte\s+(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)\s*$/gi, '')
    .replace(/\s+(I{1,3}|IV|V|VI{1,3}|VII{1,3}|IX|X)(\s+E\s+(I{1,3}|IV|V|VI{1,3}|VII{1,3}|IX|X))*\s*$/gi, '')
    .replace(/\s+\d+(\s+E\s+\d+)*\s*$/gi, '')
    .trim();
}

function agruparTemasSimilares(temas: any[]): any[] {
  const grupos: Map<string, any[]> = new Map();
  const ordemGrupos: string[] = [];
  
  for (const tema of temas) {
    const chave = normalizarTitulo(tema.titulo).toUpperCase();
    if (!grupos.has(chave)) { grupos.set(chave, []); ordemGrupos.push(chave); }
    grupos.get(chave)!.push(tema);
  }
  
  const result: any[] = [];
  let ordem = 1;
  for (const chave of ordemGrupos) {
    const grupo = grupos.get(chave)!;
    grupo.sort((a, b) => (a.pagina_inicial || 0) - (b.pagina_inicial || 0));
    const subtopicos: any[] = [];
    for (const t of grupo) { if (t.subtopicos?.length) subtopicos.push(...t.subtopicos); }
    result.push({
      ordem: ordem++,
      titulo: normalizarTitulo(grupo[0].titulo),
      pagina_inicial: grupo[0].pagina_inicial,
      pagina_final: grupo[grupo.length - 1].pagina_final,
      subtopicos
    });
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materiaId, temas } = await req.json();
    if (!materiaId || !temas || !Array.isArray(temas)) throw new Error("materiaId e temas são obrigatórios");

    console.log(`[Categorias] Confirmando ${temas.length} temas para matéria ${materiaId}`);

    const temasAgrupados = agruparTemasSimilares(temas);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Preservar capas existentes
    const { data: topicosAntigos } = await supabase
      .from('categorias_topicos').select('titulo, capa_url').eq('materia_id', materiaId);

    const capasAntigas: Record<string, string> = {};
    if (topicosAntigos) {
      for (const t of topicosAntigos) {
        if (t.capa_url) capasAntigas[t.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()] = t.capa_url;
      }
    }

    const { data: materia } = await supabase.from('categorias_materias').select('capa_url').eq('id', materiaId).single();
    const capaMateria = materia?.capa_url || null;

    // Buscar páginas para distribuir
    const { data: paginasMateria } = await supabase
      .from('categorias_materia_paginas').select('pagina, conteudo').eq('materia_id', materiaId).order('pagina');
    
    const paginasMap = new Map<number, string>();
    if (paginasMateria) paginasMateria.forEach(p => { if (p.conteudo) paginasMap.set(p.pagina, p.conteudo); });

    // Deletar tópicos antigos
    await supabase.from('categorias_topicos').delete().eq('materia_id', materiaId);

    const topicosParaInserir = temasAgrupados.map((tema, i) => {
      const tituloNorm = tema.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const capaUrl = capasAntigas[tituloNorm] || capaMateria || null;
      
      return {
        materia_id: materiaId,
        titulo: tema.titulo,
        ordem: i + 1,
        pagina_inicial: tema.pagina_inicial,
        pagina_final: tema.pagina_final,
        status: 'pendente',
        capa_url: capaUrl,
        subtopicos: tema.subtopicos || []
      };
    });

    const { data: insertedTopicos, error: insertError } = await supabase
      .from('categorias_topicos').insert(topicosParaInserir).select('id, pagina_inicial, pagina_final');

    if (insertError) throw insertError;

    // Distribuir páginas para tópicos
    if (insertedTopicos && paginasMap.size > 0) {
      for (const topico of insertedTopicos) {
        const paginaInicial = topico.pagina_inicial || 1;
        const paginaFinal = topico.pagina_final || paginaInicial;
        const paginasDoTopico: { topico_id: number; pagina: number; conteudo: string }[] = [];
        
        for (let pag = paginaInicial; pag <= paginaFinal; pag++) {
          const conteudo = paginasMap.get(pag);
          if (conteudo) paginasDoTopico.push({ topico_id: topico.id, pagina: pag, conteudo });
        }
        
        if (paginasDoTopico.length > 0) {
          await supabase.from('categorias_topico_paginas').upsert(paginasDoTopico, { onConflict: 'topico_id,pagina' });
        }
      }
    }

    await supabase.from('categorias_materias')
      .update({ status_processamento: 'pronto', temas_identificados: null })
      .eq('id', materiaId);

    console.log(`✅ ${topicosParaInserir.length} tópicos criados`);

    return new Response(
      JSON.stringify({ success: true, totalTopicos: topicosParaInserir.length, message: `${topicosParaInserir.length} tópicos criados` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
