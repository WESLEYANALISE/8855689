import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CAMARA_API_BASE = 'https://dadosabertos.camara.leg.br/api/v2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tipo, ano: anoParam, mes: mesParam } = await req.json().catch(() => ({ tipo: 'todos' }));
    const ano = anoParam || new Date().getFullYear();
    const mes = mesParam || (new Date().getMonth() + 1);

    console.log(`[Rankings] Iniciando atualização: tipo=${tipo}, ano=${ano}, mes=${mes}`);

    // Buscar lista de deputados em exercício
    const deputadosUrl = `${CAMARA_API_BASE}/deputados?itens=600`;
    console.log(`[Rankings] Buscando deputados: ${deputadosUrl}`);
    
    const deputadosResponse = await fetch(deputadosUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!deputadosResponse.ok) {
      console.error(`[Rankings] Erro ao buscar deputados: ${deputadosResponse.status} ${deputadosResponse.statusText}`);
      throw new Error(`Erro na API da Câmara: ${deputadosResponse.status}`);
    }
    
    const deputadosData = await deputadosResponse.json();
    const deputados = deputadosData.dados || [];

    console.log(`[Rankings] ${deputados.length} deputados encontrados`);

    const resultados: Record<string, any> = {};

    // Helper para buscar posições anteriores
    const getPosicaoAnteriorMap = async (tableName: string, filtros: Record<string, any> = {}) => {
      let query = supabase.from(tableName).select('deputado_id, posicao');
      for (const [key, value] of Object.entries(filtros)) {
        query = query.eq(key, value);
      }
      const { data } = await query;
      const map = new Map<number, number>();
      (data || []).forEach((item: any) => {
        map.set(item.deputado_id, item.posicao);
      });
      return map;
    };

    // Atualizar Despesas
    if (tipo === 'todos' || tipo === 'despesas') {
      console.log('[Rankings] Processando despesas...');
      
      // Buscar posições anteriores antes de deletar
      const posicaoAnteriorMap = await getPosicaoAnteriorMap('ranking_despesas', { ano, mes });
      
      const despesasMap = new Map<number, { deputado: any; total: number }>();

      // Processar em batches de 50
      for (let i = 0; i < deputados.length; i += 50) {
        const batch = deputados.slice(i, i + 50);
        await Promise.all(batch.map(async (dep: any) => {
          try {
            const despesasResp = await fetch(
              `${CAMARA_API_BASE}/deputados/${dep.id}/despesas?ano=${ano}&mes=${mes}`
            );
            const despesasData = await despesasResp.json();
            const totalGasto = (despesasData.dados || []).reduce(
              (sum: number, d: any) => sum + (parseFloat(d.valorDocumento) || 0), 0
            );
            // INCLUIR TODOS os deputados, mesmo com gasto = 0
            despesasMap.set(dep.id, { deputado: dep, total: totalGasto });
          } catch (e) {
            console.error(`Erro despesas dep ${dep.id}:`, e);
            // Mesmo com erro, incluir com gasto 0
            despesasMap.set(dep.id, { deputado: dep, total: 0 });
          }
        }));
        console.log(`[Rankings] Despesas: processados ${Math.min(i + 50, deputados.length)}/${deputados.length}`);
      }

      // TODOS os deputados, ordenados por gasto (desc)
      const despesasArray = Array.from(despesasMap.values())
        .sort((a, b) => b.total - a.total);

      // Limpar e inserir novos dados para este mês/ano
      await supabase.from('ranking_despesas').delete().eq('ano', ano).eq('mes', mes);
      
      const despesasInsert = despesasArray.map((d, index) => ({
        deputado_id: d.deputado.id,
        nome: d.deputado.nome,
        partido: d.deputado.siglaPartido,
        uf: d.deputado.siglaUf,
        foto_url: d.deputado.urlFoto,
        total_gasto: d.total,
        mes,
        ano,
        posicao: index + 1,
        posicao_anterior: posicaoAnteriorMap.get(d.deputado.id) || null,
        atualizado_em: new Date().toISOString()
      }));

      if (despesasInsert.length > 0) {
        // Inserir em batches de 100
        for (let i = 0; i < despesasInsert.length; i += 100) {
          const batch = despesasInsert.slice(i, i + 100);
          const { error } = await supabase.from('ranking_despesas').insert(batch);
          if (error) console.error('Erro inserir despesas batch:', error);
        }
      }

      resultados.despesas = { total: despesasInsert.length, topGasto: despesasArray[0]?.total };
      console.log(`[Rankings] Despesas: ${despesasInsert.length} registros salvos (TODOS os deputados)`);
    }

    // Atualizar Ranking por Mandato (gastos acumulados desde fevereiro/2023)
    if (tipo === 'todos' || tipo === 'mandato') {
      console.log('[Rankings] Processando ranking por mandato...');
      
      // Buscar posições anteriores
      const posicaoAnteriorMap = await getPosicaoAnteriorMap('ranking_despesas_mandato');
      
      const mandatoMap = new Map<number, { deputado: any; total: number }>();

      // Processar meses desde fevereiro/2023
      const mesesMandato: {ano: number, mes: number}[] = [];
      const dataInicio = new Date(2023, 1, 1); // Fevereiro 2023
      const hoje = new Date();
      
      let dataAtual = new Date(dataInicio);
      while (dataAtual <= hoje) {
        mesesMandato.push({ ano: dataAtual.getFullYear(), mes: dataAtual.getMonth() + 1 });
        dataAtual.setMonth(dataAtual.getMonth() + 1);
      }

      console.log(`[Rankings] Mandato: ${mesesMandato.length} meses a processar`);

      // Para cada deputado, somar gastos de todos os meses do mandato
      for (let i = 0; i < deputados.length; i += 50) {
        const batch = deputados.slice(i, i + 50);
        await Promise.all(batch.map(async (dep: any) => {
          let totalMandato = 0;
          
          // Processar cada mês
          for (const periodo of mesesMandato) {
            try {
              const despesasResp = await fetch(
                `${CAMARA_API_BASE}/deputados/${dep.id}/despesas?ano=${periodo.ano}&mes=${periodo.mes}`
              );
              if (despesasResp.ok) {
                const despesasData = await despesasResp.json();
                const totalMes = (despesasData.dados || []).reduce(
                  (sum: number, d: any) => sum + (parseFloat(d.valorDocumento) || 0), 0
                );
                totalMandato += totalMes;
              }
            } catch (e) {
              // Ignorar erros individuais
            }
          }
          
          mandatoMap.set(dep.id, { deputado: dep, total: totalMandato });
        }));
        console.log(`[Rankings] Mandato: processados ${Math.min(i + 50, deputados.length)}/${deputados.length}`);
      }

      // Ordenar por gasto total (desc)
      const mandatoArray = Array.from(mandatoMap.values())
        .sort((a, b) => b.total - a.total);

      // Limpar e inserir
      await supabase.from('ranking_despesas_mandato').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const mandatoInsert = mandatoArray.map((m, index) => ({
        deputado_id: m.deputado.id,
        nome: m.deputado.nome,
        partido: m.deputado.siglaPartido,
        uf: m.deputado.siglaUf,
        foto_url: m.deputado.urlFoto,
        total_gasto: m.total,
        posicao: index + 1,
        posicao_anterior: posicaoAnteriorMap.get(m.deputado.id) || null,
        atualizado_em: new Date().toISOString()
      }));

      if (mandatoInsert.length > 0) {
        for (let i = 0; i < mandatoInsert.length; i += 100) {
          const batch = mandatoInsert.slice(i, i + 100);
          const { error } = await supabase.from('ranking_despesas_mandato').insert(batch);
          if (error) console.error('Erro inserir mandato batch:', error);
        }
      }

      resultados.mandato = { total: mandatoInsert.length, topGasto: mandatoArray[0]?.total };
      console.log(`[Rankings] Mandato: ${mandatoInsert.length} registros salvos`);
    }

    // Atualizar Proposições
    if (tipo === 'todos' || tipo === 'proposicoes') {
      console.log('[Rankings] Processando proposições...');
      const posicaoAnteriorMap = await getPosicaoAnteriorMap('ranking_proposicoes', { ano });
      const proposicoesMap = new Map<number, { deputado: any; total: number }>();

      for (let i = 0; i < deputados.length; i += 50) {
        const batch = deputados.slice(i, i + 50);
        await Promise.all(batch.map(async (dep: any) => {
          try {
            const propResp = await fetch(
              `${CAMARA_API_BASE}/proposicoes?idDeputadoAutor=${dep.id}&ano=${ano}`
            );
            const propData = await propResp.json();
            proposicoesMap.set(dep.id, { deputado: dep, total: (propData.dados || []).length });
          } catch (e) {
            console.error(`Erro proposições dep ${dep.id}:`, e);
            proposicoesMap.set(dep.id, { deputado: dep, total: 0 });
          }
        }));
        console.log(`[Rankings] Proposições: processados ${Math.min(i + 50, deputados.length)}/${deputados.length}`);
      }

      // TODOS os deputados
      const proposicoesArray = Array.from(proposicoesMap.values())
        .sort((a, b) => b.total - a.total);

      await supabase.from('ranking_proposicoes').delete().eq('ano', ano);
      
      const proposicoesInsert = proposicoesArray.map((p, index) => ({
        deputado_id: p.deputado.id,
        nome: p.deputado.nome,
        partido: p.deputado.siglaPartido,
        uf: p.deputado.siglaUf,
        foto_url: p.deputado.urlFoto,
        total_proposicoes: p.total,
        ano,
        posicao: index + 1,
        posicao_anterior: posicaoAnteriorMap.get(p.deputado.id) || null,
        atualizado_em: new Date().toISOString()
      }));

      if (proposicoesInsert.length > 0) {
        for (let i = 0; i < proposicoesInsert.length; i += 100) {
          const batch = proposicoesInsert.slice(i, i + 100);
          const { error } = await supabase.from('ranking_proposicoes').insert(batch);
          if (error) console.error('Erro inserir proposições batch:', error);
        }
      }

      resultados.proposicoes = { total: proposicoesInsert.length };
      console.log(`[Rankings] Proposições: ${proposicoesInsert.length} registros`);
    }

    // Atualizar Presença
    if (tipo === 'todos' || tipo === 'presenca') {
      console.log('[Rankings] Processando presença...');
      
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 1);
      const periodoInicio = dataInicio.toISOString().split('T')[0];
      const periodoFim = new Date().toISOString().split('T')[0];
      
      const posicaoAnteriorMap = await getPosicaoAnteriorMap('ranking_presenca', { periodo_inicio: periodoInicio, periodo_fim: periodoFim });
      const presencaMap = new Map<number, { deputado: any; total: number }>();

      for (let i = 0; i < deputados.length; i += 50) {
        const batch = deputados.slice(i, i + 50);
        await Promise.all(batch.map(async (dep: any) => {
          try {
            const eventosResp = await fetch(
              `${CAMARA_API_BASE}/deputados/${dep.id}/eventos?dataInicio=${periodoInicio}&dataFim=${periodoFim}`
            );
            const eventosData = await eventosResp.json();
            presencaMap.set(dep.id, { deputado: dep, total: (eventosData.dados || []).length });
          } catch (e) {
            console.error(`Erro presença dep ${dep.id}:`, e);
            presencaMap.set(dep.id, { deputado: dep, total: 0 });
          }
        }));
        console.log(`[Rankings] Presença: processados ${Math.min(i + 50, deputados.length)}/${deputados.length}`);
      }

      // TODOS
      const presencaArray = Array.from(presencaMap.values())
        .sort((a, b) => b.total - a.total);

      await supabase.from('ranking_presenca')
        .delete()
        .eq('periodo_inicio', periodoInicio)
        .eq('periodo_fim', periodoFim);
      
      const presencaInsert = presencaArray.map((p, index) => ({
        deputado_id: p.deputado.id,
        nome: p.deputado.nome,
        partido: p.deputado.siglaPartido,
        uf: p.deputado.siglaUf,
        foto_url: p.deputado.urlFoto,
        total_eventos: p.total,
        periodo_inicio: periodoInicio,
        periodo_fim: periodoFim,
        posicao: index + 1,
        posicao_anterior: posicaoAnteriorMap.get(p.deputado.id) || null,
        atualizado_em: new Date().toISOString()
      }));

      if (presencaInsert.length > 0) {
        for (let i = 0; i < presencaInsert.length; i += 100) {
          const batch = presencaInsert.slice(i, i + 100);
          const { error } = await supabase.from('ranking_presenca').insert(batch);
          if (error) console.error('Erro inserir presença batch:', error);
        }
      }

      resultados.presenca = { total: presencaInsert.length, periodo: { inicio: periodoInicio, fim: periodoFim } };
      console.log(`[Rankings] Presença: ${presencaInsert.length} registros`);
    }

    // Atualizar Comissões
    if (tipo === 'todos' || tipo === 'comissoes') {
      console.log('[Rankings] Processando comissões...');
      const posicaoAnteriorMap = await getPosicaoAnteriorMap('ranking_comissoes');
      const comissoesMap = new Map<number, { deputado: any; total: number }>();

      for (let i = 0; i < deputados.length; i += 50) {
        const batch = deputados.slice(i, i + 50);
        await Promise.all(batch.map(async (dep: any) => {
          try {
            const orgaosResp = await fetch(
              `${CAMARA_API_BASE}/deputados/${dep.id}/orgaos`
            );
            const orgaosData = await orgaosResp.json();
            comissoesMap.set(dep.id, { deputado: dep, total: (orgaosData.dados || []).length });
          } catch (e) {
            console.error(`Erro comissões dep ${dep.id}:`, e);
            comissoesMap.set(dep.id, { deputado: dep, total: 0 });
          }
        }));
        console.log(`[Rankings] Comissões: processados ${Math.min(i + 50, deputados.length)}/${deputados.length}`);
      }

      // TODOS
      const comissoesArray = Array.from(comissoesMap.values())
        .sort((a, b) => b.total - a.total);

      await supabase.from('ranking_comissoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const comissoesInsert = comissoesArray.map((c, index) => ({
        deputado_id: c.deputado.id,
        nome: c.deputado.nome,
        partido: c.deputado.siglaPartido,
        uf: c.deputado.siglaUf,
        foto_url: c.deputado.urlFoto,
        total_orgaos: c.total,
        posicao: index + 1,
        posicao_anterior: posicaoAnteriorMap.get(c.deputado.id) || null,
        atualizado_em: new Date().toISOString()
      }));

      if (comissoesInsert.length > 0) {
        for (let i = 0; i < comissoesInsert.length; i += 100) {
          const batch = comissoesInsert.slice(i, i + 100);
          const { error } = await supabase.from('ranking_comissoes').insert(batch);
          if (error) console.error('Erro inserir comissões batch:', error);
        }
      }

      resultados.comissoes = { total: comissoesInsert.length };
      console.log(`[Rankings] Comissões: ${comissoesInsert.length} registros`);
    }

    // Atualizar Discursos
    if (tipo === 'todos' || tipo === 'discursos') {
      console.log('[Rankings] Processando discursos...');
      const posicaoAnteriorMap = await getPosicaoAnteriorMap('ranking_discursos', { ano });
      const discursosMap = new Map<number, { deputado: any; total: number }>();

      // Processar em batches menores de 20 para evitar rate limiting
      for (let i = 0; i < deputados.length; i += 20) {
        const batch = deputados.slice(i, i + 20);
        await Promise.all(batch.map(async (dep: any) => {
          try {
            const discursosResp = await fetch(
              `${CAMARA_API_BASE}/deputados/${dep.id}/discursos?ano=${ano}&ordenarPor=dataHoraInicio&ordem=DESC`
            );
            if (!discursosResp.ok) {
              console.warn(`Discursos dep ${dep.id}: status ${discursosResp.status}`);
              discursosMap.set(dep.id, { deputado: dep, total: 0 });
              return;
            }
            const contentType = discursosResp.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
              console.warn(`Discursos dep ${dep.id}: resposta não é JSON`);
              discursosMap.set(dep.id, { deputado: dep, total: 0 });
              return;
            }
            const discursosData = await discursosResp.json();
            discursosMap.set(dep.id, { deputado: dep, total: (discursosData.dados || []).length });
          } catch (e) {
            console.error(`Erro discursos dep ${dep.id}:`, e);
            discursosMap.set(dep.id, { deputado: dep, total: 0 });
          }
        }));
        // Pequena pausa entre batches para evitar rate limit
        await new Promise(r => setTimeout(r, 200));
        console.log(`[Rankings] Discursos: processados ${Math.min(i + 20, deputados.length)}/${deputados.length}`);
      }

      // TODOS
      const discursosArray = Array.from(discursosMap.values())
        .sort((a, b) => b.total - a.total);

      await supabase.from('ranking_discursos').delete().eq('ano', ano);
      
      const discursosInsert = discursosArray.map((d, index) => ({
        deputado_id: d.deputado.id,
        nome: d.deputado.nome,
        partido: d.deputado.siglaPartido,
        uf: d.deputado.siglaUf,
        foto_url: d.deputado.urlFoto,
        total_discursos: d.total,
        ano,
        posicao: index + 1,
        posicao_anterior: posicaoAnteriorMap.get(d.deputado.id) || null,
        atualizado_em: new Date().toISOString()
      }));

      if (discursosInsert.length > 0) {
        for (let i = 0; i < discursosInsert.length; i += 100) {
          const batch = discursosInsert.slice(i, i + 100);
          const { error } = await supabase.from('ranking_discursos').insert(batch);
          if (error) console.error('Erro inserir discursos batch:', error);
        }
      }

      resultados.discursos = { total: discursosInsert.length };
      console.log(`[Rankings] Discursos: ${discursosInsert.length} registros`);
    }

    // Atualizar Frentes Parlamentares
    if (tipo === 'todos' || tipo === 'frentes') {
      console.log('[Rankings] Processando frentes parlamentares...');
      const posicaoAnteriorMap = await getPosicaoAnteriorMap('ranking_frentes');
      const frentesMap = new Map<number, { deputado: any; total: number }>();

      // Processar em batches menores de 20 para evitar rate limiting
      for (let i = 0; i < deputados.length; i += 20) {
        const batch = deputados.slice(i, i + 20);
        await Promise.all(batch.map(async (dep: any) => {
          try {
            const frentesResp = await fetch(
              `${CAMARA_API_BASE}/deputados/${dep.id}/frentes`
            );
            if (!frentesResp.ok) {
              console.warn(`Frentes dep ${dep.id}: status ${frentesResp.status}`);
              frentesMap.set(dep.id, { deputado: dep, total: 0 });
              return;
            }
            const contentType = frentesResp.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
              console.warn(`Frentes dep ${dep.id}: resposta não é JSON`);
              frentesMap.set(dep.id, { deputado: dep, total: 0 });
              return;
            }
            const frentesData = await frentesResp.json();
            frentesMap.set(dep.id, { deputado: dep, total: (frentesData.dados || []).length });
          } catch (e) {
            console.error(`Erro frentes dep ${dep.id}:`, e);
            frentesMap.set(dep.id, { deputado: dep, total: 0 });
          }
        }));
        // Pequena pausa entre batches para evitar rate limit
        await new Promise(r => setTimeout(r, 200));
        console.log(`[Rankings] Frentes: processados ${Math.min(i + 20, deputados.length)}/${deputados.length}`);
      }

      // TODOS
      const frentesArray = Array.from(frentesMap.values())
        .sort((a, b) => b.total - a.total);

      await supabase.from('ranking_frentes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const frentesInsert = frentesArray.map((f, index) => ({
        deputado_id: f.deputado.id,
        nome: f.deputado.nome,
        partido: f.deputado.siglaPartido,
        uf: f.deputado.siglaUf,
        foto_url: f.deputado.urlFoto,
        total_frentes: f.total,
        posicao: index + 1,
        posicao_anterior: posicaoAnteriorMap.get(f.deputado.id) || null,
        atualizado_em: new Date().toISOString()
      }));

      if (frentesInsert.length > 0) {
        for (let i = 0; i < frentesInsert.length; i += 100) {
          const batch = frentesInsert.slice(i, i + 100);
          const { error } = await supabase.from('ranking_frentes').insert(batch);
          if (error) console.error('Erro inserir frentes batch:', error);
        }
      }

      resultados.frentes = { total: frentesInsert.length };
      console.log(`[Rankings] Frentes: ${frentesInsert.length} registros`);
    }

    console.log('[Rankings] Atualização concluída:', resultados);

    return new Response(JSON.stringify({
      success: true,
      resultados,
      atualizadoEm: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Rankings] Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error?.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
