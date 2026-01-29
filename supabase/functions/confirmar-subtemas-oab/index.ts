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
    const { topicoId, areaNome, temaNome, subtemas } = await req.json();

    if (!topicoId || !subtemas?.length) {
      throw new Error("topicoId e subtemas são obrigatórios");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar nome da área e tema do banco se não fornecidos
    let finalAreaNome = areaNome;
    let finalTemaNome = temaNome;

    if (!finalAreaNome || !finalTemaNome) {
      const { data: topicoData } = await supabase
        .from('oab_trilhas_topicos')
        .select('titulo, materia_id, oab_trilhas_materias(nome)')
        .eq('id', topicoId)
        .single();

      if (topicoData) {
        finalTemaNome = finalTemaNome || topicoData.titulo || 'Tema Desconhecido';
        finalAreaNome = finalAreaNome || (topicoData.oab_trilhas_materias as any)?.nome || 'Área Desconhecida';
      }
    }

    console.log(`[OAB] Confirmando ${subtemas.length} subtemas para tópico ${topicoId}`);
    console.log(`Área: ${finalAreaNome}, Tema: ${finalTemaNome}`);

    // Deletar subtemas antigos do mesmo tema na tabela RESUMO
    const { error: deleteError } = await supabase
      .from('RESUMO')
      .delete()
      .eq('area', finalAreaNome)
      .eq('tema', finalTemaNome);

    if (deleteError) {
      console.error("Erro ao deletar antigos:", deleteError);
    }

    // =========================================
    // NOVA LÓGICA: Buscar conteúdo da tabela conteudo_oab_revisao
    // =========================================
    console.log("📥 Buscando conteúdo da tabela conteudo_oab_revisao...");

    const { data: conteudosSalvos, error: conteudoError } = await supabase
      .from('conteudo_oab_revisao')
      .select('subtema, conteudo_original')
      .eq('tema', finalTemaNome);

    if (conteudoError) {
      console.error("Erro ao buscar conteúdos salvos:", conteudoError);
    }

    // Criar mapa para acesso rápido
    const conteudoMap = new Map<string, string>();
    conteudosSalvos?.forEach(c => {
      if (c.subtema && c.conteudo_original) {
        conteudoMap.set(c.subtema, c.conteudo_original);
      }
    });

    console.log(`📚 ${conteudoMap.size} subtemas com conteúdo encontrados`);

    // Verificar se há conteúdo disponível
    if (conteudoMap.size === 0) {
      console.warn("⚠️ Nenhum conteúdo encontrado na tabela conteudo_oab_revisao!");
      console.log("Tentando fallback para oab_trilhas_topico_paginas...");
      
      // Fallback: buscar páginas diretamente
      const { data: todasPaginas, error: paginasError } = await supabase
        .from('oab_trilhas_topico_paginas')
        .select('pagina, conteudo')
        .eq('topico_id', topicoId)
        .order('pagina');

      if (!paginasError && todasPaginas?.length) {
        const paginasMap = new Map<number, string>();
        todasPaginas.forEach(p => {
          if (p.conteudo) {
            paginasMap.set(p.pagina, p.conteudo);
          }
        });

        // Popular conteudoMap a partir das páginas
        for (const subtema of subtemas) {
          let conteudoDoSubtema = '';
          const paginaInicial = subtema.pagina_inicial || 1;
          const paginaFinal = subtema.pagina_final || paginaInicial;
          
          for (let pag = paginaInicial; pag <= paginaFinal; pag++) {
            const conteudoPagina = paginasMap.get(pag);
            if (conteudoPagina) {
              conteudoDoSubtema += `\n\n--- PÁGINA ${pag} ---\n\n${conteudoPagina}`;
            }
          }
          
          if (conteudoDoSubtema.trim()) {
            conteudoMap.set(subtema.titulo, conteudoDoSubtema.trim());
          }
        }
        console.log(`📄 Fallback: ${conteudoMap.size} subtemas com conteúdo extraído das páginas`);
      }
    }

    // Inserir novos subtemas na tabela RESUMO COM o conteúdo
    const registros = [];
    
    for (let i = 0; i < subtemas.length; i++) {
      const subtema = subtemas[i];
      
      // Buscar conteúdo do mapa (pode ser de conteudo_oab_revisao ou fallback)
      const conteudoOriginal = conteudoMap.get(subtema.titulo) || null;
      
      if (!conteudoOriginal) {
        console.warn(`⚠️ Subtema "${subtema.titulo}" não tem conteúdo fonte!`);
      } else {
        console.log(`✓ Subtema "${subtema.titulo}": ${conteudoOriginal.length} chars`);
      }
      
      registros.push({
        area: finalAreaNome,
        tema: finalTemaNome,
        subtema: subtema.titulo,
        conteudo: conteudoOriginal,
        'ordem subtema': String(i + 1)
      });
    }

    const { data: insertedData, error: insertError } = await supabase
      .from('RESUMO')
      .insert(registros)
      .select();

    if (insertError) {
      console.error("Erro ao inserir:", insertError);
      throw insertError;
    }

    // Contar quantos subtemas tem conteúdo
    const subtemasComConteudo = registros.filter(r => r.conteudo && r.conteudo.length > 0).length;
    console.log(`✅ ${insertedData?.length || 0} subtemas inseridos (${subtemasComConteudo} com conteúdo do PDF)`);

    // Atualizar status do tópico
    await supabase
      .from('oab_trilhas_topicos')
      .update({ 
        status: 'concluido',
        total_subtemas: subtemas.length
      })
      .eq('id', topicoId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: insertedData?.length || 0,
        comConteudo: subtemasComConteudo,
        message: `${insertedData?.length || 0} subtemas criados (${subtemasComConteudo} com conteúdo do PDF)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro ao confirmar:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : (error && typeof error === 'object' && 'message' in (error as Record<string, unknown>))
          ? String((error as Record<string, unknown>).message)
          : 'Erro desconhecido';

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
