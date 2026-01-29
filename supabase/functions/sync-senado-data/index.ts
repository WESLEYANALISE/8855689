import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function syncSenadores(supabase: any) {
  console.log('Sincronizando senadores...');
  
  try {
    const response = await fetch('https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json', {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`API senadores retornou ${response.status}`);
      return 0;
    }

    const data = await response.json();
    const senadores = data.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
    
    console.log(`Encontrados ${senadores.length} senadores na API`);
    
    let count = 0;
    for (const s of senadores) {
      const senador = {
        codigo: s.IdentificacaoParlamentar?.CodigoParlamentar,
        nome: s.IdentificacaoParlamentar?.NomeParlamentar,
        nome_completo: s.IdentificacaoParlamentar?.NomeCompletoParlamentar,
        foto: s.IdentificacaoParlamentar?.UrlFotoParlamentar,
        partido: s.IdentificacaoParlamentar?.SiglaPartidoParlamentar,
        uf: s.IdentificacaoParlamentar?.UfParlamentar,
        email: s.IdentificacaoParlamentar?.EmailParlamentar,
        sexo: s.IdentificacaoParlamentar?.SexoParlamentar,
        pagina_web: s.IdentificacaoParlamentar?.UrlPaginaParlamentar,
        bloco: s.IdentificacaoParlamentar?.Bloco?.NomeBloco,
        dados_completos: s,
      };
      
      if (!senador.codigo) continue;
      
      const { error } = await supabase
        .from('senado_senadores')
        .upsert(senador, { onConflict: 'codigo' });
      
      if (error) {
        console.error(`Erro ao salvar senador ${senador.codigo}:`, error.message);
      } else {
        count++;
      }
    }
    
    console.log(`${count} senadores sincronizados com sucesso`);
    return count;
  } catch (error) {
    console.error('Erro ao sincronizar senadores:', error);
    return 0;
  }
}

async function syncVotacoes(supabase: any, dias: number = 30) {
  console.log(`Sincronizando votações dos últimos ${dias} dias...`);
  
  let totalVotacoes = 0;
  const hoje = new Date();
  
  // Senado não tem sessões no final de semana, buscar dias úteis recentes
  for (let i = 0; i < dias; i++) {
    const dataObj = new Date(hoje);
    dataObj.setDate(dataObj.getDate() - i);
    
    // Pular fins de semana
    const diaSemana = dataObj.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue;
    
    const dataStr = dataObj.toISOString().split('T')[0];
    const dataFormatada = dataStr.replace(/-/g, '');
    
    try {
      console.log(`Buscando votações de ${dataStr}...`);
      
      const response = await fetch(
        `https://legis.senado.leg.br/dadosabertos/plenario/votacao/${dataFormatada}.json`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (response.status === 404) {
        console.log(`Nenhuma votação em ${dataStr}`);
        continue;
      }
      
      if (!response.ok) {
        console.error(`Erro ${response.status} ao buscar ${dataStr}`);
        continue;
      }

      const data_resp = await response.json();
      const sessoes = data_resp.VotacaoPlenario?.Sessoes?.Sessao;
      
      if (!sessoes) {
        console.log(`Sem sessões em ${dataStr}`);
        continue;
      }
      
      const sessoesArray = Array.isArray(sessoes) ? sessoes : [sessoes];
      console.log(`${sessoesArray.length} sessões encontradas em ${dataStr}`);

      for (const sessao of sessoesArray) {
        const votacoesSessao = sessao.Votacoes?.Votacao;
        if (!votacoesSessao) continue;
        
        const votacoesArray = Array.isArray(votacoesSessao) ? votacoesSessao : [votacoesSessao];
        
        for (const v of votacoesArray) {
          const codigoVotacao = v.CodigoVotacao || `${sessao.CodigoSessao}_${Date.now()}`;
          
          const votacao = {
            codigo_votacao: codigoVotacao,
            codigo_sessao: sessao.CodigoSessao,
            data_sessao: dataStr,
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
            votos: (v.Votos?.Voto || []).map((voto: any) => ({
              codigoSenador: voto.CodigoParlamentar,
              nomeSenador: voto.NomeParlamentar,
              partido: voto.SiglaPartido,
              uf: voto.SiglaUF,
              voto: voto.Voto,
            })),
          };
          
          const { error } = await supabase
            .from('senado_votacoes')
            .upsert(votacao, { onConflict: 'codigo_votacao,codigo_sessao' });
          
          if (error) {
            console.error(`Erro ao salvar votação:`, error.message);
          } else {
            totalVotacoes++;
          }
        }
      }
    } catch (e) {
      console.error(`Erro ao buscar votações de ${dataStr}:`, e);
    }
    
    // Delay para não sobrecarregar a API
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`${totalVotacoes} votações sincronizadas com sucesso`);
  return totalVotacoes;
}

async function syncComissoes(supabase: any) {
  console.log('Sincronizando comissões...');
  
  try {
    const response = await fetch('https://legis.senado.leg.br/dadosabertos/comissao/lista/colegiados.json', {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`API comissões retornou ${response.status}`);
      return 0;
    }

    const data = await response.json();
    const comissoes = data.ListaColegiados?.Colegiados?.Colegiado || [];
    const comissoesArray = Array.isArray(comissoes) ? comissoes : [comissoes];
    
    console.log(`Encontradas ${comissoesArray.length} comissões na API`);
    
    let count = 0;
    for (const c of comissoesArray) {
      const codigo = c.CodigoColegiado;
      if (!codigo) continue;
      
      const comissao = {
        codigo: codigo,
        sigla: c.SiglaColegiado,
        nome: c.NomeColegiado,
        tipo: c.TipoColegiado,
        casa: c.SiglaCasa,
        data_criacao: c.DataCriacao || null,
        data_extincao: c.DataExtincao || null,
        ativa: !c.DataExtincao,
        participantes: c.Participantes?.Participante?.length || 0,
        dados_completos: c,
      };
      
      const { error } = await supabase
        .from('senado_comissoes')
        .upsert(comissao, { onConflict: 'codigo' });
      
      if (error) {
        console.error(`Erro ao salvar comissão ${codigo}:`, error.message);
      } else {
        count++;
      }
    }
    
    console.log(`${count} comissões sincronizadas com sucesso`);
    return count;
  } catch (error) {
    console.error('Erro ao sincronizar comissões:', error);
    return 0;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { tipo, dias = 30 } = body;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('=== INICIANDO SINCRONIZAÇÃO DO SENADO ===');
    console.log('Parâmetros:', { tipo, dias });
    
    // Registrar início da sincronização
    await supabase
      .from('senado_sync_log')
      .insert({
        tipo: tipo || 'completo',
        status: 'em_andamento',
        iniciado_em: new Date().toISOString(),
      });

    let totalSenadores = 0;
    let totalVotacoes = 0;
    let totalComissoes = 0;

    if (!tipo || tipo === 'senadores' || tipo === 'completo') {
      totalSenadores = await syncSenadores(supabase);
    }
    
    if (!tipo || tipo === 'votacoes' || tipo === 'completo') {
      totalVotacoes = await syncVotacoes(supabase, dias);
    }
    
    if (!tipo || tipo === 'comissoes' || tipo === 'completo') {
      totalComissoes = await syncComissoes(supabase);
    }

    console.log('=== SINCRONIZAÇÃO CONCLUÍDA ===');
    console.log({ totalSenadores, totalVotacoes, totalComissoes });

    return new Response(
      JSON.stringify({
        success: true,
        totalSenadores,
        totalVotacoes,
        totalComissoes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
