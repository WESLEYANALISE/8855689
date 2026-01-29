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
    const { idVotacao } = await req.json();
    
    console.log('Buscando detalhes da votação:', idVotacao);

    const url = `https://dadosabertos.camara.leg.br/api/v2/votacoes/${idVotacao}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    console.log('Detalhes da votação carregados');

    // Buscar votos individuais
    const votosUrl = `https://dadosabertos.camara.leg.br/api/v2/votacoes/${idVotacao}/votos`;
    const votosResponse = await fetch(votosUrl, {
      headers: { 'Accept': 'application/json' },
    });
    const votosData = await votosResponse.json();
    
    console.log('Total de votos recebidos:', votosData.dados?.length);
    if (votosData.dados && votosData.dados.length > 0) {
      console.log('Estrutura do primeiro voto:', JSON.stringify(votosData.dados[0], null, 2));
    }

    return new Response(JSON.stringify({ 
      votacao: data.dados || {},
      votos: votosData.dados || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da votação:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
