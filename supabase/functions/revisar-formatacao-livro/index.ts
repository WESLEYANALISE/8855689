import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tituloLivro } = await req.json();

    if (!tituloLivro) {
      return new Response(
        JSON.stringify({ error: 'tituloLivro é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[REVISÃO SIMPLES] Validando formatação para: ${tituloLivro}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar páginas formatadas
    const { data: paginasFormatadas, error: erroFormatado } = await supabase
      .from('leitura_paginas_formatadas')
      .select('*')
      .eq('livro_titulo', tituloLivro)
      .order('numero_pagina', { ascending: true });

    if (erroFormatado || !paginasFormatadas || paginasFormatadas.length === 0) {
      throw new Error('Páginas formatadas não encontradas');
    }

    // Estatísticas
    const totalPaginas = paginasFormatadas.length;
    const totalCaracteres = paginasFormatadas.reduce((sum, p) => sum + (p.html_formatado?.length || 0), 0);
    const mediaPorPagina = Math.round(totalCaracteres / totalPaginas);
    
    // Verificar páginas muito curtas
    const paginasCurtas = paginasFormatadas.filter(p => (p.html_formatado?.length || 0) < 800);
    const paginasLongas = paginasFormatadas.filter(p => (p.html_formatado?.length || 0) > 3000);
    
    // Contar capítulos
    const capitulosUnicos = new Set(paginasFormatadas.map(p => p.numero_capitulo));

    console.log(`[REVISÃO] Estatísticas:`);
    console.log(`  - Total páginas: ${totalPaginas}`);
    console.log(`  - Média por página: ${mediaPorPagina} chars`);
    console.log(`  - Páginas curtas (<800): ${paginasCurtas.length}`);
    console.log(`  - Páginas longas (>3000): ${paginasLongas.length}`);
    console.log(`  - Capítulos: ${capitulosUnicos.size}`);

    return new Response(
      JSON.stringify({
        success: true,
        livroTitulo: tituloLivro,
        estatisticas: {
          totalPaginas,
          totalCaracteres,
          mediaPorPagina,
          paginasCurtas: paginasCurtas.length,
          paginasLongas: paginasLongas.length,
          capitulosUnicos: capitulosUnicos.size,
          qualidade: paginasCurtas.length < totalPaginas * 0.1 ? 'boa' : 'revisar'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[REVISÃO] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
