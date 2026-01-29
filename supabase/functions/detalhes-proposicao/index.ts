import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idProposicao } = await req.json();
    
    console.log('Buscando detalhes da proposição:', idProposicao);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Dynamic import to avoid "createClient is not defined" error
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.75.1');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Primeiro, tentar buscar do cache (últimas 7 dias)
    const { data: cacheData, error: cacheError } = await supabase
      .from('cache_proposicoes_recentes')
      .select('*')
      .eq('id_proposicao', idProposicao)
      .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (!cacheError && cacheData && cacheData.votacoes && cacheData.votacoes.length >= 0) {
      console.log('✅ Retornando do cache:', idProposicao);
      
      // Buscar autores da API (leve e rápido)
      const autoresUrl = `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${idProposicao}/autores`;
      const autoresResponse = await fetch(autoresUrl, {
        headers: { 'Accept': 'application/json' },
      });
      const autoresData = await autoresResponse.json();

      return new Response(JSON.stringify({ 
        proposicao: {
          id: cacheData.id_proposicao,
          siglaTipo: cacheData.sigla_tipo,
          numero: cacheData.numero,
          ano: cacheData.ano,
          ementa: cacheData.ementa,
          dataApresentacao: cacheData.data_apresentacao,
          urlInteiroTeor: cacheData.url_inteiro_teor,
        },
        autores: autoresData.dados || [],
        votacoes: cacheData.votacoes || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Cache não encontrado ou desatualizado, buscando da API...');

    const url = `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${idProposicao}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    console.log('Detalhes da proposição carregados:', data.dados?.siglaTipo, data.dados?.numero);

    // Buscar autores
    const autoresUrl = `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${idProposicao}/autores`;
    const autoresResponse = await fetch(autoresUrl, {
      headers: { 'Accept': 'application/json' },
    });
    const autoresData = await autoresResponse.json();

    // Buscar votações relacionadas
    let votacoes = [];
    try {
      const votacoesUrl = `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${idProposicao}/votacoes`;
      const votacoesResponse = await fetch(votacoesUrl, {
        headers: { 'Accept': 'application/json' },
      });
      
      if (votacoesResponse.ok) {
        const votacoesData = await votacoesResponse.json();
        votacoes = votacoesData.dados || [];
        console.log('Votações encontradas:', votacoes.length);
        
        // Para cada votação, buscar os votos detalhados
        for (let i = 0; i < Math.min(votacoes.length, 5); i++) { // Limitar a 5 votações
          try {
            const votosUrl = `https://dadosabertos.camara.leg.br/api/v2/votacoes/${votacoes[i].id}/votos`;
            const votosResponse = await fetch(votosUrl, {
              headers: { 'Accept': 'application/json' },
            });
            
            if (votosResponse.ok) {
              const votosData = await votosResponse.json();
              const votos = votosData.dados || [];
              
              // Contar votos
              const sim = votos.filter((v: any) => v.tipoVoto === "Sim").length;
              const nao = votos.filter((v: any) => v.tipoVoto === "Não").length;
              const abstencao = votos.filter((v: any) => v.tipoVoto === "Abstenção").length;
              const obstrucao = votos.filter((v: any) => v.tipoVoto === "Obstrução").length;
              
              votacoes[i].stats = { sim, nao, abstencao, obstrucao, total: votos.length };
            }
          } catch (votosError) {
            console.error('Erro ao buscar votos da votação:', votosError);
            votacoes[i].stats = { sim: 0, nao: 0, abstencao: 0, obstrucao: 0, total: 0 };
          }
        }
      }
    } catch (votacoesError) {
      console.error('Erro ao buscar votações:', votacoesError);
    }

    // Salvar no cache
    const cacheRecord = {
      id_proposicao: data.dados.id,
      sigla_tipo: data.dados.siglaTipo,
      numero: data.dados.numero,
      ano: data.dados.ano,
      ementa: data.dados.ementa,
      data_apresentacao: data.dados.dataApresentacao,
      url_inteiro_teor: data.dados.urlInteiroTeor,
      votacoes: votacoes,
      updated_at: new Date().toISOString()
    };

    await supabase
      .from('cache_proposicoes_recentes')
      .upsert(cacheRecord, { onConflict: 'id_proposicao' });

    console.log('✅ Proposição salva no cache');

    return new Response(JSON.stringify({ 
      proposicao: data.dados || {},
      autores: autoresData.dados || [],
      votacoes: votacoes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da proposição:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
