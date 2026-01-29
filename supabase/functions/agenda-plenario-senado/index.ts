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
    const { data } = await req.json();
    
    // Usar data fornecida ou data atual
    const dataConsulta = data || new Date().toISOString().split('T')[0];
    
    console.log('Buscando agenda do plenário do Senado:', dataConsulta);

    // API do Senado Federal - Agenda do plenário
    // Formato da data: YYYYMMDD
    const dataFormatada = dataConsulta.replace(/-/g, '');
    const url = `https://legis.senado.leg.br/dadosabertos/plenario/agenda/dia/${dataFormatada}.json`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Nenhuma sessão agendada para a data');
        return new Response(
          JSON.stringify({ agenda: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`API retornou status ${response.status}`);
    }

    const dataResp = await response.json();
    const sessoesData = dataResp.AgendaPlenario?.Sessoes?.Sessao || [];
    
    // Garantir que sessões seja um array
    const sessoes = Array.isArray(sessoesData) ? sessoesData : [sessoesData];

    const agendaFormatada = sessoes.map((s: any) => {
      const materiasData = s.MateriasLegislativas?.Materia || [];
      const materias = Array.isArray(materiasData) ? materiasData : [materiasData];
      
      return {
        codigoSessao: s.CodigoSessao,
        data: s.DataSessao,
        hora: s.HoraInicioSessao,
        tipo: s.TipoSessao,
        legislatura: s.Legislatura,
        materias: materias.map((m: any) => ({
          codigo: m.IdentificacaoMateria?.CodigoMateria,
          sigla: m.IdentificacaoMateria?.SiglaMateria,
          numero: m.IdentificacaoMateria?.NumeroMateria,
          ano: m.IdentificacaoMateria?.AnoMateria,
          ementa: m.EmentaMateria,
          regime: m.DescricaoRegimeTramitacao,
          ordem: m.SequenciaOrdemDia,
        })),
      };
    });

    console.log(`${agendaFormatada.length} sessões na agenda`);

    return new Response(
      JSON.stringify({ agenda: agendaFormatada }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar agenda do plenário:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
