import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PoliticoBase {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto_url: string;
}

interface RankingData {
  politico_id: number;
  tipo: 'deputado' | 'senador';
  nome: string;
  partido: string | null;
  uf: string | null;
  foto_url: string | null;
  nota_votacoes: number;
  nota_gastos: number;
  nota_presenca: number;
  nota_proposicoes: number;
  nota_processos: number;
  nota_outros: number;
  nota_final: number;
  posicao?: number;
  posicao_anterior?: number;
  variacao_posicao?: number;
}

// Fórmula baseada no politicos.org.br: [(V x 3) + (G / 2)] / 4 + P + OT
// Adaptada: (nota_votacoes * 0.3 + nota_gastos * 0.2 + nota_presenca * 0.2 + nota_proposicoes * 0.2 + nota_processos * 0.1)
function calcularNotaFinal(data: Partial<RankingData>): number {
  const v = data.nota_votacoes || 0;
  const g = data.nota_gastos || 0;
  const pr = data.nota_presenca || 0;
  const prop = data.nota_proposicoes || 0;
  const proc = data.nota_processos || 10; // Começa em 10, subtrai por processos
  
  // Pesos balanceados
  const nota = (v * 0.25) + (g * 0.25) + (pr * 0.20) + (prop * 0.20) + (proc * 0.10);
  
  return Math.min(10, Math.max(0, Number(nota.toFixed(2))));
}

// Normaliza um valor para escala 0-10 (quanto menor melhor - para gastos)
function normalizarInverso(valor: number, min: number, max: number): number {
  if (max === min) return 5;
  const normalizado = 10 - ((valor - min) / (max - min)) * 10;
  return Math.min(10, Math.max(0, Number(normalizado.toFixed(2))));
}

// Normaliza um valor para escala 0-10 (quanto maior melhor - para proposições/presença)
function normalizarDireto(valor: number, min: number, max: number): number {
  if (max === min) return 5;
  const normalizado = ((valor - min) / (max - min)) * 10;
  return Math.min(10, Math.max(0, Number(normalizado.toFixed(2))));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tipo = 'todos' } = await req.json().catch(() => ({}));
    
    console.log(`[calcular-ranking-unificado] Iniciando cálculo para: ${tipo}`);
    
    const resultados: RankingData[] = [];

    // ==================== DEPUTADOS ====================
    if (tipo === 'todos' || tipo === 'deputado') {
      console.log('[calcular-ranking-unificado] Processando deputados...');
      
      // 1. Buscar deputados base (da tabela de despesas que tem todos)
      const { data: deputados, error: depError } = await supabase
        .from('ranking_despesas')
        .select('deputado_id, nome, partido, uf, foto_url');
      
      if (depError) {
        console.error('Erro ao buscar deputados:', depError);
        throw depError;
      }

      // 2. Buscar dados de despesas
      const { data: despesas } = await supabase
        .from('ranking_despesas')
        .select('deputado_id, total_gasto')
        .order('total_gasto', { ascending: true });

      // 3. Buscar dados de proposições
      const { data: proposicoes } = await supabase
        .from('ranking_proposicoes')
        .select('deputado_id, total_proposicoes')
        .order('total_proposicoes', { ascending: false });

      // 4. Buscar dados de presença
      const { data: presenca } = await supabase
        .from('ranking_presenca')
        .select('deputado_id, total_eventos')
        .order('total_eventos', { ascending: false });

      // 5. Buscar dados de comissões
      const { data: comissoes } = await supabase
        .from('ranking_comissoes')
        .select('deputado_id, total_orgaos')
        .order('total_orgaos', { ascending: false });

      // Calcular min/max para normalização
      const despesasValues = despesas?.map(d => d.total_gasto || 0) || [0];
      const proposicoesValues = proposicoes?.map(p => p.total_proposicoes || 0) || [0];
      const presencaValues = presenca?.map(p => p.total_eventos || 0) || [0];
      const comissoesValues = comissoes?.map(c => c.total_orgaos || 0) || [0];

      const despesasMin = Math.min(...despesasValues);
      const despesasMax = Math.max(...despesasValues);
      const proposicoesMin = Math.min(...proposicoesValues);
      const proposicoesMax = Math.max(...proposicoesValues);
      const presencaMin = Math.min(...presencaValues);
      const presencaMax = Math.max(...presencaValues);
      const comissoesMin = Math.min(...comissoesValues);
      const comissoesMax = Math.max(...comissoesValues);

      // Mapear dados por deputado_id
      const despesasMap = new Map(despesas?.map(d => [d.deputado_id, d.total_gasto]) || []);
      const proposicoesMap = new Map(proposicoes?.map(p => [p.deputado_id, p.total_proposicoes]) || []);
      const presencaMap = new Map(presenca?.map(p => [p.deputado_id, p.total_eventos]) || []);
      const comissoesMap = new Map(comissoes?.map(c => [c.deputado_id, c.total_orgaos]) || []);

      // Criar conjunto único de deputados
      const deputadosUnicos = new Map<number, PoliticoBase>();
      deputados?.forEach(d => {
        if (!deputadosUnicos.has(d.deputado_id)) {
          deputadosUnicos.set(d.deputado_id, {
            id: d.deputado_id,
            nome: d.nome,
            partido: d.partido,
            uf: d.uf,
            foto_url: d.foto_url
          });
        }
      });

      // Calcular nota para cada deputado
      for (const [id, dep] of deputadosUnicos) {
        const desp = despesasMap.get(id) || 0;
        const prop = proposicoesMap.get(id) || 0;
        const pres = presencaMap.get(id) || 0;
        const comi = comissoesMap.get(id) || 0;

        const nota_gastos = normalizarInverso(desp, despesasMin, despesasMax);
        const nota_proposicoes = normalizarDireto(prop, proposicoesMin, proposicoesMax);
        const nota_presenca = normalizarDireto(pres, presencaMin, presencaMax);
        const nota_outros = normalizarDireto(comi, comissoesMin, comissoesMax);

        const rankingData: RankingData = {
          politico_id: id,
          tipo: 'deputado',
          nome: dep.nome,
          partido: dep.partido,
          uf: dep.uf,
          foto_url: dep.foto_url,
          nota_votacoes: 5, // Será implementado quando tivermos análise de votações
          nota_gastos,
          nota_presenca,
          nota_proposicoes,
          nota_processos: 10, // Começa em 10, será ajustado quando tivermos processos
          nota_outros,
          nota_final: 0
        };

        rankingData.nota_final = calcularNotaFinal(rankingData);
        resultados.push(rankingData);
      }
      
      console.log(`[calcular-ranking-unificado] ${deputadosUnicos.size} deputados processados`);
    }

    // ==================== SENADORES ====================
    if (tipo === 'todos' || tipo === 'senador') {
      console.log('[calcular-ranking-unificado] Processando senadores...');
      
      // 1. Buscar senadores base
      const { data: senadores, error: senError } = await supabase
        .from('ranking_senadores_despesas')
        .select('senador_codigo, nome, partido, uf, foto_url');
      
      if (senError) {
        console.error('Erro ao buscar senadores:', senError);
      }

      // 2. Buscar dados de despesas
      const { data: despesasSen } = await supabase
        .from('ranking_senadores_despesas')
        .select('senador_codigo, total_gasto');

      // 3. Buscar dados de discursos
      const { data: discursos } = await supabase
        .from('ranking_senadores_discursos')
        .select('senador_codigo, total_discursos');

      // 4. Buscar dados de votações
      const { data: votacoesSen } = await supabase
        .from('ranking_senadores_votacoes')
        .select('senador_codigo, total_votacoes');

      // 5. Buscar dados de comissões
      const { data: comissoesSen } = await supabase
        .from('ranking_senadores_comissoes')
        .select('senador_codigo, total_comissoes');

      if (senadores && senadores.length > 0) {
        // Calcular min/max para normalização
        const despesasValues = despesasSen?.map(d => d.total_gasto || 0) || [0];
        const discursosValues = discursos?.map(d => d.total_discursos || 0) || [0];
        const votacoesValues = votacoesSen?.map(v => v.total_votacoes || 0) || [0];
        const comissoesValues = comissoesSen?.map(c => c.total_comissoes || 0) || [0];

        const despesasMin = Math.min(...despesasValues);
        const despesasMax = Math.max(...despesasValues);
        const discursosMin = Math.min(...discursosValues);
        const discursosMax = Math.max(...discursosValues);
        const votacoesMin = Math.min(...votacoesValues);
        const votacoesMax = Math.max(...votacoesValues);
        const comissoesMin = Math.min(...comissoesValues);
        const comissoesMax = Math.max(...comissoesValues);

        // Mapear dados
        const despesasMap = new Map(despesasSen?.map(d => [d.senador_codigo, d.total_gasto]) || []);
        const discursosMap = new Map(discursos?.map(d => [d.senador_codigo, d.total_discursos]) || []);
        const votacoesMap = new Map(votacoesSen?.map(v => [v.senador_codigo, v.total_votacoes]) || []);
        const comissoesMap = new Map(comissoesSen?.map(c => [c.senador_codigo, c.total_comissoes]) || []);

        // Criar conjunto único de senadores
        const senadoresUnicos = new Map<number, PoliticoBase>();
        senadores?.forEach(s => {
          if (!senadoresUnicos.has(s.senador_codigo)) {
            senadoresUnicos.set(s.senador_codigo, {
              id: s.senador_codigo,
              nome: s.nome,
              partido: s.partido,
              uf: s.uf,
              foto_url: s.foto_url
            });
          }
        });

        // Calcular nota para cada senador
        for (const [id, sen] of senadoresUnicos) {
          const desp = despesasMap.get(id) || 0;
          const disc = discursosMap.get(id) || 0;
          const vot = votacoesMap.get(id) || 0;
          const comi = comissoesMap.get(id) || 0;

          const nota_gastos = normalizarInverso(desp, despesasMin, despesasMax);
          const nota_proposicoes = normalizarDireto(disc, discursosMin, discursosMax); // Discursos como produtividade
          const nota_presenca = normalizarDireto(vot, votacoesMin, votacoesMax); // Votações como presença
          const nota_outros = normalizarDireto(comi, comissoesMin, comissoesMax);

          const rankingData: RankingData = {
            politico_id: id,
            tipo: 'senador',
            nome: sen.nome,
            partido: sen.partido,
            uf: sen.uf,
            foto_url: sen.foto_url,
            nota_votacoes: 5,
            nota_gastos,
            nota_presenca,
            nota_proposicoes,
            nota_processos: 10,
            nota_outros,
            nota_final: 0
          };

          rankingData.nota_final = calcularNotaFinal(rankingData);
          resultados.push(rankingData);
        }
        
        console.log(`[calcular-ranking-unificado] ${senadoresUnicos.size} senadores processados`);
      }
    }

    // Ordenar por nota final e atribuir posições
    resultados.sort((a, b) => b.nota_final - a.nota_final);
    
    // Separar por tipo para atribuir posições dentro de cada grupo
    const deputadosRanking = resultados.filter(r => r.tipo === 'deputado');
    const senadoresRanking = resultados.filter(r => r.tipo === 'senador');

    // Buscar posições anteriores
    const { data: rankingAnterior } = await supabase
      .from('ranking_nota_final')
      .select('politico_id, tipo, posicao');

    const posicaoAnteriorMap = new Map(
      rankingAnterior?.map(r => [`${r.politico_id}-${r.tipo}`, r.posicao]) || []
    );

    // Inserir/atualizar no banco
    const toUpsert: RankingData[] = [];

    deputadosRanking.forEach((r, idx) => {
      const posicao = idx + 1;
      const posicaoAnterior = posicaoAnteriorMap.get(`${r.politico_id}-${r.tipo}`) || posicao;
      toUpsert.push({
        ...r,
        posicao,
        posicao_anterior: posicaoAnterior,
        variacao_posicao: posicaoAnterior - posicao
      });
    });

    senadoresRanking.forEach((r, idx) => {
      const posicao = idx + 1;
      const posicaoAnterior = posicaoAnteriorMap.get(`${r.politico_id}-${r.tipo}`) || posicao;
      toUpsert.push({
        ...r,
        posicao,
        posicao_anterior: posicaoAnterior,
        variacao_posicao: posicaoAnterior - posicao
      });
    });

    console.log(`[calcular-ranking-unificado] Salvando ${toUpsert.length} registros...`);

    // Upsert em lotes
    const batchSize = 100;
    for (let i = 0; i < toUpsert.length; i += batchSize) {
      const batch = toUpsert.slice(i, i + batchSize);
      const { error: upsertError } = await supabase
        .from('ranking_nota_final')
        .upsert(batch, { onConflict: 'politico_id,tipo' });

      if (upsertError) {
        console.error('Erro ao salvar lote:', upsertError);
        throw upsertError;
      }
    }

    console.log('[calcular-ranking-unificado] Ranking calculado com sucesso!');

    return new Response(JSON.stringify({
      success: true,
      total_processados: toUpsert.length,
      deputados: deputadosRanking.length,
      senadores: senadoresRanking.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('[calcular-ranking-unificado] Erro:', err);
    return new Response(JSON.stringify({ 
      error: err.message,
      stack: err.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
