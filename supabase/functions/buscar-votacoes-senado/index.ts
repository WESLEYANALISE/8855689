import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, forceRefresh } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Usar data fornecida ou data atual
    const dataConsulta = data || new Date().toISOString().split('T')[0];
    
    console.log('Buscando votações do Senado:', { data: dataConsulta, forceRefresh });

    // 1. Verificar cache se não forçar refresh
    if (!forceRefresh) {
      const { data: cached, error: cacheError } = await supabase
        .from('senado_votacoes')
        .select('*')
        .eq('data_sessao', dataConsulta)
        .order('codigo_votacao', { ascending: false });
      
      if (!cacheError && cached && cached.length > 0) {
        console.log(`Retornando ${cached.length} votações do cache para ${dataConsulta}`);
        
        const votacoesFormatadas = cached.map(v => ({
          codigoVotacao: v.codigo_votacao,
          codigoSessao: v.codigo_sessao,
          dataSessao: v.data_sessao,
          descricaoVotacao: v.descricao_votacao,
          descricaoSessao: v.descricao_sessao,
          resultado: v.resultado,
          totalSim: v.total_sim,
          totalNao: v.total_nao,
          totalAbstencao: v.total_abstencao,
          materia: {
            codigo: v.materia_codigo,
            sigla: v.materia_sigla,
            numero: v.materia_numero,
            ano: v.materia_ano,
          },
          votos: v.votos,
        }));
        
        return new Response(
          JSON.stringify({ votacoes: votacoesFormatadas, fromCache: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Buscar da API do Senado
    const dataFormatada = dataConsulta.replace(/-/g, '');
    const url = `https://legis.senado.leg.br/dadosabertos/plenario/votacao/${dataFormatada}.json`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Nenhuma votação encontrada para a data');
        return new Response(
          JSON.stringify({ votacoes: [], fromCache: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`API retornou status ${response.status}`);
    }

    const data_resp = await response.json();
    const votacoesData = data_resp.VotacaoPlenario?.Sessoes?.Sessao || [];
    
    const sessoes = Array.isArray(votacoesData) ? votacoesData : [votacoesData];

    const votacoesFormatadas: any[] = [];
    const votacoesParaCache: any[] = [];

    sessoes.forEach((sessao: any) => {
      const votacoesSessao = sessao.Votacoes?.Votacao || [];
      const votacoesArray = Array.isArray(votacoesSessao) ? votacoesSessao : [votacoesSessao];
      
      votacoesArray.forEach((v: any) => {
        const votacao = {
          codigoSessao: sessao.CodigoSessao,
          dataSessao: sessao.DataSessao,
          descricaoSessao: sessao.TipoSessao,
          codigoVotacao: v.CodigoVotacao,
          descricaoVotacao: v.DescricaoVotacao,
          resultado: v.DescricaoResultado,
          totalSim: v.TotalVotosSim,
          totalNao: v.TotalVotosNao,
          totalAbstencao: v.TotalVotosAbstencao,
          materia: {
            codigo: v.IdentificacaoMateria?.CodigoMateria,
            sigla: v.IdentificacaoMateria?.SiglaMateria,
            numero: v.IdentificacaoMateria?.NumeroMateria,
            ano: v.IdentificacaoMateria?.AnoMateria,
          },
          votos: (v.Votos?.Voto || []).map((voto: any) => ({
            codigoSenador: voto.CodigoParlamentar,
            nomeSenador: voto.NomeParlamentar,
            partido: voto.SiglaPartido,
            uf: voto.SiglaUF,
            voto: voto.Voto,
          })),
        };
        
        votacoesFormatadas.push(votacao);
        
        // Preparar para cache
        votacoesParaCache.push({
          codigo_votacao: v.CodigoVotacao,
          codigo_sessao: sessao.CodigoSessao,
          data_sessao: dataConsulta,
          descricao_votacao: v.DescricaoVotacao,
          descricao_sessao: sessao.TipoSessao,
          resultado: v.DescricaoResultado,
          total_sim: parseInt(v.TotalVotosSim) || 0,
          total_nao: parseInt(v.TotalVotosNao) || 0,
          total_abstencao: parseInt(v.TotalVotosAbstencao) || 0,
          materia_codigo: v.IdentificacaoMateria?.CodigoMateria,
          materia_sigla: v.IdentificacaoMateria?.SiglaMateria,
          materia_numero: v.IdentificacaoMateria?.NumeroMateria,
          materia_ano: v.IdentificacaoMateria?.AnoMateria,
          votos: votacao.votos,
        });
      });
    });

    // 3. Salvar no cache
    if (votacoesParaCache.length > 0) {
      for (const votacao of votacoesParaCache) {
        await supabase
          .from('senado_votacoes')
          .upsert(votacao, { onConflict: 'codigo_votacao,codigo_sessao' });
      }
      console.log(`Cache atualizado com ${votacoesParaCache.length} votações`);
    }

    console.log(`${votacoesFormatadas.length} votações encontradas`);

    return new Response(
      JSON.stringify({ votacoes: votacoesFormatadas, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar votações:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
