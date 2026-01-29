import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TituloEncontrado {
  texto: string;
  tipo: 'TITULO' | 'CAPITULO' | 'SECAO' | 'SUBSECAO' | 'PARTE';
  artigoId: number;
  posicao: 'inicio' | 'fim';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tableName = "CP - Código Penal", dryRun = true } = await req.json();

    console.log(`Analisando tabela: ${tableName}, dryRun: ${dryRun}`);

    // Buscar todos os artigos
    const { data: artigos, error } = await supabase
      .from(tableName)
      .select('id, "Número do Artigo", "Artigo"')
      .order('id');

    if (error) throw error;

    const titulosEncontrados: TituloEncontrado[] = [];
    const artigosParaAtualizar: { id: number; novoArtigo: string }[] = [];

    // Regex para identificar títulos, capítulos, seções no final do texto
    const regexTituloFim = /\n\s*(TÍTULO\s+[IVXLCDM]+(?:\s*[-–]\s*[A-Z])?(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\s]+)?)\s*$/i;
    const regexCapituloFim = /\n\s*(CAPÍTULO\s+[IVXLCDM]+(?:\s*[-–]\s*[A-Z])?(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\s]+)?)\s*$/i;
    const regexSecaoFim = /\n\s*(SEÇÃO\s+[IVXLCDM]+(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\s]+)?)\s*$/i;
    const regexParteFim = /\n\s*(PARTE\s+(?:GERAL|ESPECIAL)(?:\s*\([^)]+\))?)\s*$/i;

    // Regex para títulos com subtítulo em linha separada
    const regexTituloComSubtitulo = /\n\s*(TÍTULO\s+[IVXLCDM]+)\s*\n+\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\s]+)\s*$/i;
    const regexCapituloComSubtitulo = /\n\s*(CAPÍTULO\s+[IVXLCDM]+)\s*\n+\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\s]+)\s*$/i;

    for (const artigo of artigos) {
      if (!artigo.Artigo) continue;
      
      let texto = artigo.Artigo;
      let modificado = false;

      // Verificar título com subtítulo no fim
      const matchTituloSub = texto.match(regexTituloComSubtitulo);
      if (matchTituloSub) {
        const tituloCompleto = `${matchTituloSub[1]}\n${matchTituloSub[2]}`.trim();
        titulosEncontrados.push({
          texto: tituloCompleto,
          tipo: 'TITULO',
          artigoId: artigo.id,
          posicao: 'fim'
        });
        texto = texto.replace(regexTituloComSubtitulo, '').trim();
        modificado = true;
      }

      // Verificar capítulo com subtítulo no fim
      const matchCapituloSub = texto.match(regexCapituloComSubtitulo);
      if (matchCapituloSub) {
        const capituloCompleto = `${matchCapituloSub[1]}\n${matchCapituloSub[2]}`.trim();
        titulosEncontrados.push({
          texto: capituloCompleto,
          tipo: 'CAPITULO',
          artigoId: artigo.id,
          posicao: 'fim'
        });
        texto = texto.replace(regexCapituloComSubtitulo, '').trim();
        modificado = true;
      }

      // Verificar título simples no fim
      const matchTitulo = texto.match(regexTituloFim);
      if (matchTitulo) {
        titulosEncontrados.push({
          texto: matchTitulo[1].trim(),
          tipo: 'TITULO',
          artigoId: artigo.id,
          posicao: 'fim'
        });
        texto = texto.replace(regexTituloFim, '').trim();
        modificado = true;
      }

      // Verificar capítulo simples no fim
      const matchCapitulo = texto.match(regexCapituloFim);
      if (matchCapitulo) {
        titulosEncontrados.push({
          texto: matchCapitulo[1].trim(),
          tipo: 'CAPITULO',
          artigoId: artigo.id,
          posicao: 'fim'
        });
        texto = texto.replace(regexCapituloFim, '').trim();
        modificado = true;
      }

      // Verificar seção no fim
      const matchSecao = texto.match(regexSecaoFim);
      if (matchSecao) {
        titulosEncontrados.push({
          texto: matchSecao[1].trim(),
          tipo: 'SECAO',
          artigoId: artigo.id,
          posicao: 'fim'
        });
        texto = texto.replace(regexSecaoFim, '').trim();
        modificado = true;
      }

      // Verificar parte no fim
      const matchParte = texto.match(regexParteFim);
      if (matchParte) {
        titulosEncontrados.push({
          texto: matchParte[1].trim(),
          tipo: 'PARTE',
          artigoId: artigo.id,
          posicao: 'fim'
        });
        texto = texto.replace(regexParteFim, '').trim();
        modificado = true;
      }

      if (modificado) {
        artigosParaAtualizar.push({ id: artigo.id, novoArtigo: texto });
      }
    }

    console.log(`Títulos encontrados: ${titulosEncontrados.length}`);
    console.log(`Artigos para atualizar: ${artigosParaAtualizar.length}`);

    if (!dryRun && titulosEncontrados.length > 0) {
      // Atualizar artigos removendo os títulos/capítulos do final
      for (const artigo of artigosParaAtualizar) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ Artigo: artigo.novoArtigo })
          .eq('id', artigo.id);

        if (updateError) {
          console.error(`Erro ao atualizar artigo ${artigo.id}:`, updateError);
        }
      }

      // Inserir novos registros para os títulos/capítulos
      // Obter o maior ID atual para criar novos IDs
      const { data: maxIdData } = await supabase
        .from(tableName)
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      let nextId = (maxIdData?.[0]?.id || 0) + 1;

      for (const titulo of titulosEncontrados) {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({
            id: nextId,
            "Número do Artigo": titulo.tipo,
            "Artigo": titulo.texto
          });

        if (insertError) {
          console.error(`Erro ao inserir título:`, insertError);
        } else {
          nextId++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        titulosEncontrados: titulosEncontrados.length,
        artigosParaAtualizar: artigosParaAtualizar.length,
        detalhes: titulosEncontrados.map(t => ({
          tipo: t.tipo,
          texto: t.texto.substring(0, 100),
          artigoId: t.artigoId
        })),
        artigosModificados: artigosParaAtualizar.map(a => ({
          id: a.id,
          preview: a.novoArtigo.substring(a.novoArtigo.length - 100)
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
