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

    const anoConsulta = ano || new Date().getFullYear();
    console.log('Buscando discursos do senador:', codigo, 'ano:', anoConsulta);

    // API do Senado Federal - Discursos do parlamentar
    const url = `https://legis.senado.leg.br/dadosabertos/senador/${codigo}/discursos.json?ano=${anoConsulta}`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Nenhum discurso encontrado');
        return new Response(
          JSON.stringify({ discursos: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    const discursosData = data.DiscursosParlamentar?.Parlamentar?.Pronunciamentos?.Pronunciamento || [];
    
    // Garantir que discursos seja um array
    const discursos = Array.isArray(discursosData) ? discursosData : [discursosData];

    const discursosFormatados = discursos.map((d: any) => ({
      codigo: d.CodigoPronunciamento,
      data: d.DataPronunciamento,
      hora: d.HoraInicioPronunciamento,
      resumo: d.TextoResumoPronunciamento,
      integra: d.UrlTextoPronunciamento,
      fase: d.FaseSessaoPlenaria?.DescricaoFaseSessaoPlenaria,
      tipoSessao: d.SessaoPlenaria?.DescricaoTipoSessao,
      dataSessao: d.SessaoPlenaria?.DataSessao,
      indexacao: d.IndexacaoPronunciamento,
      sumario: d.SumarioPronunciamento,
    }));

    console.log(`${discursosFormatados.length} discursos encontrados`);

    return new Response(
      JSON.stringify({ discursos: discursosFormatados }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar discursos:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
