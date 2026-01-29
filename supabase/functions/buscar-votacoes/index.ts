import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { idProposicao, dataInicio, dataFim } = await req.json();
    
    console.log('Buscando votações com filtros:', { idProposicao, dataInicio, dataFim });

    // Validar formato de datas (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dataInicio && !dateRegex.test(dataInicio)) {
      throw new Error('Data início inválida. Use formato YYYY-MM-DD');
    }
    if (dataFim && !dateRegex.test(dataFim)) {
      throw new Error('Data fim inválida. Use formato YYYY-MM-DD');
    }

    // Verificar cache primeiro (últimas 6 horas para votações)
    const cacheKey = `votacoes_${idProposicao || 'geral'}_${dataInicio}_${dataFim}`;
    const { data: cacheData, error: cacheError } = await supabase
      .from('cache_camara_deputados')
      .select('dados')
      .eq('tipo_cache', 'votacoes')
      .eq('chave_cache', cacheKey)
      .gt('expira_em', new Date().toISOString())
      .single();

    if (!cacheError && cacheData) {
      console.log('✅ Retornando votações do cache');
      return new Response(JSON.stringify({ votacoes: cacheData.dados }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('⚡ Cache não encontrado, buscando da API...');

    // Construir URL com parâmetros - REDUZIR limite para evitar timeout
    const params = new URLSearchParams();
    if (idProposicao) params.append('idProposicao', idProposicao.toString());
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    params.append('ordem', 'DESC');
    params.append('ordenarPor', 'dataHoraRegistro');
    params.append('itens', '50'); // REDUZIDO de 100 para 50 para evitar timeout

    const url = `https://dadosabertos.camara.leg.br/api/v2/votacoes?${params.toString()}`;
    console.log('URL da API:', url);
    
    // Adicionar timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API:', response.status, errorText);
      throw new Error(`API retornou status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const votacoes = data.dados || [];
    console.log(`${votacoes.length} votações encontradas`);

    // Salvar no cache (válido por 6 horas)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6);

    await supabase
      .from('cache_camara_deputados')
      .upsert({
        tipo_cache: 'votacoes',
        chave_cache: cacheKey,
        dados: votacoes,
        expira_em: expiresAt.toISOString(),
      }, {
        onConflict: 'tipo_cache,chave_cache'
      });

    console.log('💾 Votações salvas no cache');

    return new Response(JSON.stringify({ votacoes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar votações:', error);
    
    // Se for timeout, retornar mensagem mais amigável
    const errorMessage = error instanceof Error && error.name === 'AbortError' 
      ? 'A API da Câmara demorou muito para responder. Tente reduzir o período de busca (máximo 15 dias).'
      : error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
