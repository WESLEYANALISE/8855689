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
    const { codigo } = await req.json();
    
    if (!codigo) {
      throw new Error('Código do senador é obrigatório');
    }

    console.log('Buscando comissões do senador:', codigo);

    // API do Senado Federal - Comissões do parlamentar
    const url = `https://legis.senado.leg.br/dadosabertos/senador/${codigo}/comissoes.json`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    const comissoesData = data.MembroComissaoParlamentar?.Parlamentar?.MembroComissoes?.Comissao || [];
    
    // Garantir que comissões seja um array
    const comissoes = Array.isArray(comissoesData) ? comissoesData : [comissoesData];

    const comissoesFormatadas = comissoes.map((c: any) => ({
      codigo: c.CodigoComissao,
      sigla: c.SiglaComissao,
      nome: c.NomeComissao,
      casa: c.NomeCasaComissao,
      cargo: c.DescricaoParticipacao,
      dataInicio: c.DataInicio,
      dataFim: c.DataFim,
      titular: c.IndicadorTitular === 'S',
    }));

    console.log(`${comissoesFormatadas.length} comissões encontradas`);

    return new Response(
      JSON.stringify({ comissoes: comissoesFormatadas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar comissões do senador:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
