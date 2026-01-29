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
      throw new Error('Código da matéria é obrigatório');
    }

    console.log('Buscando detalhes da matéria:', codigo);

    // API do Senado Federal - Detalhes da matéria
    const url = `https://legis.senado.leg.br/dadosabertos/materia/${codigo}.json`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    const materiaData = data.DetalheMateria?.Materia;
    
    if (!materiaData) {
      throw new Error('Matéria não encontrada');
    }

    // Buscar também a tramitação
    const urlTramitacao = `https://legis.senado.leg.br/dadosabertos/materia/movimentacoes/${codigo}.json`;
    let tramitacoes = [];
    
    try {
      const respTramitacao = await fetch(urlTramitacao, {
        headers: { 'Accept': 'application/json' },
      });
      if (respTramitacao.ok) {
        const dataTramitacao = await respTramitacao.json();
        const movimentacoesData = dataTramitacao.MovimentacaoMateria?.Materia?.Movimentacoes?.Movimentacao || [];
        tramitacoes = Array.isArray(movimentacoesData) ? movimentacoesData : [movimentacoesData];
      }
    } catch (e) {
      console.log('Não foi possível buscar tramitação');
    }

    // Formatar dados
    const materia = {
      codigo: materiaData.IdentificacaoMateria?.CodigoMateria,
      sigla: materiaData.IdentificacaoMateria?.SiglaMateria,
      numero: materiaData.IdentificacaoMateria?.NumeroMateria,
      ano: materiaData.IdentificacaoMateria?.AnoMateria,
      descricao: materiaData.IdentificacaoMateria?.DescricaoIdentificacao,
      ementa: materiaData.DadosBasicosMateria?.EmentaMateria,
      explicacao: materiaData.DadosBasicosMateria?.ExplicacaoEmentaMateria,
      indexacao: materiaData.DadosBasicosMateria?.IndexacaoMateria,
      dataApresentacao: materiaData.DadosBasicosMateria?.DataApresentacao,
      casa: materiaData.CasaIniciadora?.NomeCasaIniciadora,
      situacao: materiaData.SituacaoAtual?.Autuacoes?.Autuacao?.[0]?.Situacao?.DescricaoSituacao,
      autor: materiaData.Autoria?.Autor?.map((a: any) => ({
        nome: a.NomeAutor,
        tipo: a.TipoAutor,
        codigo: a.CodigoAutor,
      })) || [],
      relator: materiaData.Relatorias?.Relatoria?.map((r: any) => ({
        nome: r.NomeRelator,
        codigo: r.CodigoRelator,
        comissao: r.SiglaComissao,
      })) || [],
      tramitacoes: tramitacoes.slice(0, 20).map((t: any) => ({
        data: t.DataMovimento,
        descricao: t.DescricaoMovimentacao,
        local: t.IdentificacaoLocal?.NomeLocal,
        situacao: t.Situacao?.DescricaoSituacao,
      })),
    };

    console.log('Detalhes da matéria carregados:', materia.sigla, materia.numero);

    return new Response(
      JSON.stringify({ materia }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar detalhes da matéria:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
