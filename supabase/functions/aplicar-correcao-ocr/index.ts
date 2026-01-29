import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { verificacaoId, livroId, aplicarTodas } = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    let verificacoes;

    if (aplicarTodas && livroId) {
      const { data, error } = await supabase
        .from('ocr_verificacao')
        .select('*')
        .eq('livro_id', livroId)
        .eq('status', 'verificado');
      
      if (error) throw error;
      verificacoes = data;
    } else if (verificacaoId) {
      const { data, error } = await supabase
        .from('ocr_verificacao')
        .select('*')
        .eq('id', verificacaoId)
        .single();
      
      if (error) throw error;
      verificacoes = [data];
    } else {
      return new Response(
        JSON.stringify({ error: 'verificacaoId ou (livroId + aplicarTodas) é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!verificacoes || verificacoes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma verificação encontrada para aplicar' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resultados: Array<{pagina: number, status: string, erro?: string}> = [];

    for (const verificacao of verificacoes) {
      try {
        const searchPattern = `%${verificacao.livro_titulo.split(' ').slice(0, 3).join('%')}%`;
        
        const { data: original } = await supabase
          .from('BIBLIOTECA-LEITURA-DINAMICA')
          .select('id')
          .ilike('Titulo da Obra', searchPattern)
          .eq('Pagina', verificacao.pagina)
          .single();

        if (original) {
          const { error: updateError } = await supabase
            .from('BIBLIOTECA-LEITURA-DINAMICA')
            .update({ 'Conteúdo': verificacao.texto_novo_ocr })
            .eq('id', original.id);

          if (updateError) {
            resultados.push({ pagina: verificacao.pagina, status: 'erro', erro: updateError.message });
            continue;
          }
        } else {
          const { error: insertError } = await supabase
            .from('BIBLIOTECA-LEITURA-DINAMICA')
            .insert({
              'Titulo da Obra': verificacao.livro_titulo,
              'Pagina': verificacao.pagina,
              'Conteúdo': verificacao.texto_novo_ocr
            });

          if (insertError) {
            resultados.push({ pagina: verificacao.pagina, status: 'erro', erro: insertError.message });
            continue;
          }
        }

        await supabase
          .from('ocr_verificacao')
          .update({ status: 'corrigido' })
          .eq('id', verificacao.id);

        await supabase
          .from('leitura_paginas_formatadas')
          .delete()
          .ilike('livro_titulo', searchPattern)
          .eq('pagina', verificacao.pagina);

        resultados.push({ pagina: verificacao.pagina, status: 'corrigido' });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        resultados.push({ pagina: verificacao.pagina, status: 'erro', erro: errorMessage });
      }
    }

    const totalCorrigidas = resultados.filter(r => r.status === 'corrigido').length;
    const totalErros = resultados.filter(r => r.status === 'erro').length;

    return new Response(
      JSON.stringify({
        success: true,
        totalProcessadas: verificacoes.length,
        totalCorrigidas,
        totalErros,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
