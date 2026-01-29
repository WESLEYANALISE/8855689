import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { anos } = await req.json();
    
    // Anos para limpar (padrão: 2020-2025)
    const anosParaLimpar = anos || [2020, 2021, 2022, 2023, 2024, 2025];
    
    console.log('Limpando leis dos anos:', anosParaLimpar);
    
    const resultados: Record<string, number> = {};
    
    for (const ano of anosParaLimpar) {
      const tabela = `leis_push_${ano}`;
      
      // Contar antes de deletar
      const { count: countAntes } = await supabase
        .from(tabela)
        .select('*', { count: 'exact', head: true });
      
      // Deletar todos os registros
      const { error } = await supabase
        .from(tabela)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos
      
      if (error) {
        console.error(`Erro ao limpar ${tabela}:`, error);
        resultados[ano] = -1;
      } else {
        resultados[ano] = countAntes || 0;
        console.log(`Tabela ${tabela}: ${countAntes || 0} registros deletados`);
      }
    }
    
    const totalDeletado = Object.values(resultados).filter(v => v > 0).reduce((a, b) => a + b, 0);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `${totalDeletado} leis deletadas`,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao limpar leis:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
