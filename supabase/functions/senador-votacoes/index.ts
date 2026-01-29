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
    const { codigo, ano } = await req.json();
    
    if (!codigo) {
      throw new Error('Código do senador é obrigatório');
    }

    const anoAtual = ano || new Date().getFullYear();
    console.log('Buscando votações do senador:', codigo, 'ano:', anoAtual);

    // API do Senado Federal - Votações do parlamentar
    const url = `https://legis.senado.leg.br/dadosabertos/senador/${codigo}/votacoes.json?ano=${anoAtual}`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    const votacoesData = data.VotacaoParlamentar?.Parlamentar?.Votacoes?.Votacao || [];
    
    // Garantir que votações seja um array
    const votacoes = Array.isArray(votacoesData) ? votacoesData : [votacoesData];

    const votacoesFormatadas = votacoes.map((v: any) => ({
      codigoSessao: v.CodigoSessao,
      data: v.DataSessao,
      descricaoVotacao: v.DescricaoVotacao,
      resultado: v.DescricaoResultado,
      voto: v.DescricaoVoto,
      siglaCasa: v.SiglaCasa,
      materia: {
        codigo: v.IdentificacaoMateria?.CodigoMateria,
        sigla: v.IdentificacaoMateria?.SiglaMateria,
        numero: v.IdentificacaoMateria?.NumeroMateria,
        ano: v.IdentificacaoMateria?.AnoMateria,
        descricao: v.IdentificacaoMateria?.DescricaoIdentificacaoMateria,
      }
    }));

    console.log(`${votacoesFormatadas.length} votações encontradas`);

    return new Response(
      JSON.stringify({ votacoes: votacoesFormatadas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar votações do senador:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
