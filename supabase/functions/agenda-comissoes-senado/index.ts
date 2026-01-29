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
    const { data, codigoComissao } = await req.json();
    
    // Usar data fornecida ou data atual
    const dataConsulta = data || new Date().toISOString().split('T')[0];
    
    console.log('Buscando agenda de comissões do Senado:', { data: dataConsulta, codigoComissao });

    // API do Senado Federal - Agenda de reuniões de comissões
    // Formato da data: YYYYMMDD
    const dataFormatada = dataConsulta.replace(/-/g, '');
    let url = `https://legis.senado.leg.br/dadosabertos/comissao/agenda/${dataFormatada}.json`;
    
    if (codigoComissao) {
      url = `https://legis.senado.leg.br/dadosabertos/comissao/${codigoComissao}/agenda/${dataFormatada}.json`;
    }
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Nenhuma reunião agendada para a data');
        return new Response(
          JSON.stringify({ reunioes: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`API retornou status ${response.status}`);
    }

    const dataResp = await response.json();
    const reunioesData = dataResp.AgendaReuniao?.Reunioes?.Reuniao || [];
    
    // Garantir que reuniões seja um array
    const reunioes = Array.isArray(reunioesData) ? reunioesData : [reunioesData];

    const reunioesFormatadas = reunioes.map((r: any) => {
      const pautasData = r.Pautas?.Pauta || [];
      const pautas = Array.isArray(pautasData) ? pautasData : [pautasData];
      
      return {
        codigo: r.CodigoReuniao,
        data: r.DataReuniao,
        hora: r.HoraInicioReuniao,
        tipo: r.TipoReuniao,
        situacao: r.DescricaoSituacao,
        local: r.LocalReuniao,
        comissao: {
          codigo: r.Comissao?.CodigoComissao,
          sigla: r.Comissao?.SiglaComissao,
          nome: r.Comissao?.NomeComissao,
        },
        pautas: pautas.map((p: any) => ({
          codigo: p.CodigoPauta,
          ordem: p.SequenciaOrdem,
          resultado: p.DescricaoResultado,
          materia: p.IdentificacaoMateria ? {
            codigo: p.IdentificacaoMateria.CodigoMateria,
            sigla: p.IdentificacaoMateria.SiglaMateria,
            numero: p.IdentificacaoMateria.NumeroMateria,
            ano: p.IdentificacaoMateria.AnoMateria,
          } : null,
          ementa: p.EmentaMateria,
        })),
      };
    });

    console.log(`${reunioesFormatadas.length} reuniões na agenda`);

    return new Response(
      JSON.stringify({ reunioes: reunioesFormatadas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar agenda de comissões:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
