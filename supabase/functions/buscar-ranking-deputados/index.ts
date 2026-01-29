import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const TABLE_MAP: Record<string, string> = {
  despesas: 'ranking_despesas',
  gastos: 'ranking_despesas',
  proposicoes: 'ranking_proposicoes',
  presenca: 'ranking_presenca',
  eventos: 'ranking_presenca',
  comissoes: 'ranking_comissoes',
  orgaos: 'ranking_comissoes',
};

const VALUE_FIELD_MAP: Record<string, string> = {
  despesas: 'total_gasto',
  gastos: 'total_gasto',
  proposicoes: 'total_proposicoes',
  presenca: 'total_eventos',
  eventos: 'total_eventos',
  comissoes: 'total_orgaos',
  orgaos: 'total_orgaos',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, ano, mes, forcarAtualizacao = false } = await req.json();
    
    console.log('Buscando ranking de deputados:', { tipo, ano, mes, forcarAtualizacao });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const tableName = TABLE_MAP[tipo] || TABLE_MAP['despesas'];
    const valueField = VALUE_FIELD_MAP[tipo] || VALUE_FIELD_MAP['despesas'];

    const dataAtual = new Date();
    const anoAtual = ano || dataAtual.getFullYear();
    const mesAtual = mes || (dataAtual.getMonth() + 1);

    // 1. Verificar se já existe cache válido no Supabase (menos de 1 hora)
    if (!forcarAtualizacao) {
      let query = supabase
        .from(tableName)
        .select('*')
        .order(valueField, { ascending: false });

      // Aplicar filtros se for despesas
      if (tipo === 'despesas' || tipo === 'gastos') {
        query = query.eq('ano', anoAtual).eq('mes', mesAtual);
      }

      const { data: cachedData, error: cacheError } = await query;

      if (!cacheError && cachedData && cachedData.length > 0) {
        const primeiroItem = cachedData[0];
        const atualizadoEm = new Date(primeiroItem.atualizado_em);
        const agora = new Date();
        const diffHoras = (agora.getTime() - atualizadoEm.getTime()) / (1000 * 60 * 60);

        if (diffHoras < 1) {
          console.log(`✅ Retornando ${cachedData.length} deputados do cache Supabase (${diffHoras.toFixed(2)}h atrás)`);
          return new Response(JSON.stringify({ 
            ranking: cachedData.map(item => ({
              id: item.deputado_id,
              nome: item.nome,
              siglaPartido: item.partido,
              siglaUf: item.uf,
              urlFoto: item.foto_url,
              [valueField === 'total_gasto' ? 'totalGasto' : 
               valueField === 'total_proposicoes' ? 'totalProposicoes' :
               valueField === 'total_eventos' ? 'totalEventos' : 'totalOrgaos']: item[valueField],
            })),
            periodo: { ano: anoAtual, mes: mesAtual },
            fromCache: true,
            total: cachedData.length
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // 2. Buscar dados frescos da API - TODOS os deputados
    const deputadosUrl = 'https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=600';
    const deputadosResponse = await fetch(deputadosUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!deputadosResponse.ok) {
      throw new Error(`Erro ao buscar deputados: ${deputadosResponse.status}`);
    }

    const deputadosData = await deputadosResponse.json();
    const deputados = deputadosData.dados || [];

    console.log(`Total de deputados encontrados: ${deputados.length}`);

    let rankingData = [];

    if (tipo === 'despesas' || tipo === 'gastos') {
      console.log(`Buscando despesas de ${anoAtual}/${mesAtual} para TODOS os deputados`);
      
      // Processar TODOS os deputados em batches de 50
      const allResults = [];
      for (let i = 0; i < deputados.length; i += 50) {
        const batch = deputados.slice(i, i + 50);
        const batchResults = await Promise.all(
          batch.map(async (deputado: any) => {
            try {
              const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${deputado.id}/despesas?ano=${anoAtual}&mes=${mesAtual}&itens=100&ordem=DESC&ordenarPor=valorDocumento`;
              const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
              });
              
              if (response.ok) {
                const data = await response.json();
                const despesas = data.dados || [];
                const totalGasto = despesas.reduce((sum: number, d: any) => sum + (d.valorDocumento || 0), 0);
                
                return {
                  ...deputado,
                  totalGasto: Math.round(totalGasto * 100) / 100,
                  quantidadeDespesas: despesas.length,
                };
              }
              return { ...deputado, totalGasto: 0, quantidadeDespesas: 0 };
            } catch (error) {
              console.error(`Erro ao buscar despesas do deputado ${deputado.id}:`, error);
              return { ...deputado, totalGasto: 0, quantidadeDespesas: 0 };
            }
          })
        );
        allResults.push(...batchResults);
        console.log(`Processados ${Math.min(i + 50, deputados.length)}/${deputados.length} deputados`);
      }

      rankingData = allResults
        .filter(d => d.totalGasto > 0)
        .sort((a, b) => b.totalGasto - a.totalGasto);

    } else if (tipo === 'proposicoes') {
      console.log(`Buscando proposições de ${anoAtual}`);
      
      const allResults = [];
      for (let i = 0; i < deputados.length; i += 50) {
        const batch = deputados.slice(i, i + 50);
        const batchResults = await Promise.all(
          batch.map(async (deputado: any) => {
            try {
              const url = `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${deputado.id}&ano=${anoAtual}&itens=100&ordem=DESC`;
              const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
              });
              
              if (response.ok) {
                const data = await response.json();
                return {
                  ...deputado,
                  totalProposicoes: data.dados?.length || 0,
                };
              }
              return { ...deputado, totalProposicoes: 0 };
            } catch (error) {
              console.error(`Erro ao buscar proposições do deputado ${deputado.id}:`, error);
              return { ...deputado, totalProposicoes: 0 };
            }
          })
        );
        allResults.push(...batchResults);
      }

      rankingData = allResults
        .filter(d => d.totalProposicoes > 0)
        .sort((a, b) => b.totalProposicoes - a.totalProposicoes);

    } else if (tipo === 'presenca' || tipo === 'eventos') {
      console.log('Buscando eventos dos últimos 30 dias');
      
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 30);
      const dataInicioStr = dataInicio.toISOString().split('T')[0];
      const dataFimStr = dataAtual.toISOString().split('T')[0];
      
      const allResults = [];
      for (let i = 0; i < deputados.length; i += 50) {
        const batch = deputados.slice(i, i + 50);
        const batchResults = await Promise.all(
          batch.map(async (deputado: any) => {
            try {
              const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${deputado.id}/eventos?dataInicio=${dataInicioStr}&dataFim=${dataFimStr}&itens=100`;
              const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
              });
              
              if (response.ok) {
                const data = await response.json();
                return {
                  ...deputado,
                  totalEventos: data.dados?.length || 0,
                };
              }
              return { ...deputado, totalEventos: 0 };
            } catch (error) {
              console.error(`Erro ao buscar eventos do deputado ${deputado.id}:`, error);
              return { ...deputado, totalEventos: 0 };
            }
          })
        );
        allResults.push(...batchResults);
      }

      rankingData = allResults
        .filter(d => d.totalEventos > 0)
        .sort((a, b) => b.totalEventos - a.totalEventos);

    } else if (tipo === 'orgaos' || tipo === 'comissoes') {
      const allResults = [];
      for (let i = 0; i < deputados.length; i += 50) {
        const batch = deputados.slice(i, i + 50);
        const batchResults = await Promise.all(
          batch.map(async (deputado: any) => {
            try {
              const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${deputado.id}/orgaos`;
              const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
              });
              
              if (response.ok) {
                const data = await response.json();
                return {
                  ...deputado,
                  totalOrgaos: data.dados?.length || 0,
                };
              }
              return { ...deputado, totalOrgaos: 0 };
            } catch (error) {
              console.error(`Erro ao buscar órgãos do deputado ${deputado.id}:`, error);
              return { ...deputado, totalOrgaos: 0 };
            }
          })
        );
        allResults.push(...batchResults);
      }

      rankingData = allResults
        .filter(d => d.totalOrgaos > 0)
        .sort((a, b) => b.totalOrgaos - a.totalOrgaos);

    } else {
      rankingData = deputados;
    }

    console.log(`✅ Ranking final: ${rankingData.length} deputados`);

    // 3. Salvar no Supabase para cache (TODOS os deputados)
    if (rankingData.length > 0) {
      const agora = new Date().toISOString();
      const dataToSave = rankingData.map((d: any, index: number) => ({
        deputado_id: d.id,
        nome: d.nome,
        partido: d.siglaPartido,
        uf: d.siglaUf,
        foto_url: d.urlFoto,
        [valueField]: d.totalGasto ?? d.totalProposicoes ?? d.totalEventos ?? d.totalOrgaos ?? 0,
        posicao: index + 1,
        atualizado_em: agora,
        ...(tipo === 'despesas' || tipo === 'gastos' ? { ano: anoAtual, mes: mesAtual } : {}),
      }));

      // Limpar dados antigos para este período
      if (tipo === 'despesas' || tipo === 'gastos') {
        await supabase.from(tableName).delete().eq('ano', anoAtual).eq('mes', mesAtual);
      } else {
        await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      
      // Inserir em batches de 100
      for (let i = 0; i < dataToSave.length; i += 100) {
        const batch = dataToSave.slice(i, i + 100);
        const { error: insertError } = await supabase.from(tableName).insert(batch);
        
        if (insertError) {
          console.error('Erro ao salvar cache batch:', insertError);
        }
      }
      
      console.log(`✅ Cache salvo: ${dataToSave.length} deputados em ${tableName}`);
    }

    return new Response(JSON.stringify({ 
      ranking: rankingData,
      periodo: { ano: anoAtual, mes: mesAtual },
      fromCache: false,
      total: rankingData.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro ao buscar ranking:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
