import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SENADO_API_BASE = 'https://legis.senado.leg.br/dadosabertos';
const CODANTE_API_BASE = 'https://apis.codante.io/api/gastos-senadores';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tipo, ano: anoParam } = await req.json().catch(() => ({ tipo: 'todos' }));
    const ano = anoParam || new Date().getFullYear();

    console.log(`[Rankings Senadores] Iniciando: tipo=${tipo}, ano=${ano}`);

    // Buscar lista de senadores em exercício
    const senadoresUrl = `${SENADO_API_BASE}/senador/lista/atual.json`;
    console.log(`[Rankings Senadores] Buscando senadores: ${senadoresUrl}`);
    
    const senadoresResponse = await fetch(senadoresUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!senadoresResponse.ok) {
      throw new Error(`Erro API Senado: ${senadoresResponse.status}`);
    }
    
    const senadoresData = await senadoresResponse.json();
    const parlamentares = senadoresData?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
    
    const senadores = parlamentares.map((p: any) => ({
      codigo: p.IdentificacaoParlamentar?.CodigoParlamentar,
      nome: p.IdentificacaoParlamentar?.NomeParlamentar,
      partido: p.IdentificacaoParlamentar?.SiglaPartidoParlamentar,
      uf: p.IdentificacaoParlamentar?.UfParlamentar,
      foto: p.IdentificacaoParlamentar?.UrlFotoParlamentar
    })).filter((s: any) => s.codigo);

    console.log(`[Rankings Senadores] ${senadores.length} senadores encontrados`);

    const resultados: Record<string, any> = {};

    // Atualizar Despesas via Codante API
    if (tipo === 'todos' || tipo === 'despesas') {
      console.log('[Rankings Senadores] Processando despesas...');
      const despesasMap = new Map<string, { senador: any; total: number }>();

      for (const sen of senadores) {
        try {
          const despesasResp = await fetch(
            `${CODANTE_API_BASE}/senadores/${sen.codigo}/gastos?ano=${ano}`
          );
          if (despesasResp.ok) {
            const despesasData = await despesasResp.json();
            const gastos = despesasData?.data || [];
            const totalGasto = gastos.reduce(
              (sum: number, d: any) => sum + (parseFloat(d.valor_reembolsado) || 0), 0
            );
            despesasMap.set(sen.codigo, { senador: sen, total: totalGasto });
          }
        } catch (e) {
          console.error(`Erro despesas sen ${sen.codigo}:`, e);
        }
      }

      const despesasArray = Array.from(despesasMap.values())
        .filter(d => d.total > 0)
        .sort((a, b) => b.total - a.total);

      await supabase.from('ranking_senadores_despesas').delete().eq('ano', ano);
      
      const despesasInsert = despesasArray.map((d, index) => ({
        senador_codigo: d.senador.codigo,
        nome: d.senador.nome,
        partido: d.senador.partido,
        uf: d.senador.uf,
        foto_url: d.senador.foto,
        total_gasto: d.total,
        ano,
        posicao: index + 1,
        atualizado_em: new Date().toISOString()
      }));

      if (despesasInsert.length > 0) {
        const { error } = await supabase.from('ranking_senadores_despesas').insert(despesasInsert);
        if (error) console.error('Erro inserir despesas:', error);
      }

      resultados.despesas = { total: despesasInsert.length };
      console.log(`[Rankings Senadores] Despesas: ${despesasInsert.length} registros`);
    }

    // Atualizar Discursos
    if (tipo === 'todos' || tipo === 'discursos') {
      console.log('[Rankings Senadores] Processando discursos...');
      const discursosMap = new Map<string, { senador: any; total: number }>();

      for (const sen of senadores) {
        try {
          const discursosResp = await fetch(
            `${SENADO_API_BASE}/senador/${sen.codigo}/discursos.json?ano=${ano}`
          );
          if (discursosResp.ok) {
            const discursosData = await discursosResp.json();
            const discursos = discursosData?.DiscursosParlamentar?.Parlamentar?.Pronunciamentos?.Pronunciamento || [];
            const total = Array.isArray(discursos) ? discursos.length : (discursos ? 1 : 0);
            discursosMap.set(sen.codigo, { senador: sen, total });
          }
        } catch (e) {
          console.error(`Erro discursos sen ${sen.codigo}:`, e);
        }
        await new Promise(r => setTimeout(r, 100));
      }

      const discursosArray = Array.from(discursosMap.values())
        .filter(d => d.total > 0)
        .sort((a, b) => b.total - a.total);

      await supabase.from('ranking_senadores_discursos').delete().eq('ano', ano);
      
      const discursosInsert = discursosArray.map((d, index) => ({
        senador_codigo: d.senador.codigo,
        nome: d.senador.nome,
        partido: d.senador.partido,
        uf: d.senador.uf,
        foto_url: d.senador.foto,
        total_discursos: d.total,
        ano,
        posicao: index + 1,
        atualizado_em: new Date().toISOString()
      }));

      if (discursosInsert.length > 0) {
        const { error } = await supabase.from('ranking_senadores_discursos').insert(discursosInsert);
        if (error) console.error('Erro inserir discursos:', error);
      }

      resultados.discursos = { total: discursosInsert.length };
      console.log(`[Rankings Senadores] Discursos: ${discursosInsert.length} registros`);
    }

    // Atualizar Comissões
    if (tipo === 'todos' || tipo === 'comissoes') {
      console.log('[Rankings Senadores] Processando comissões...');
      const comissoesMap = new Map<string, { senador: any; total: number }>();

      for (const sen of senadores) {
        try {
          const comissoesResp = await fetch(
            `${SENADO_API_BASE}/senador/${sen.codigo}/comissoes.json`
          );
          if (comissoesResp.ok) {
            const comissoesData = await comissoesResp.json();
            const comissoes = comissoesData?.MembroComissaoParlamentar?.Parlamentar?.MembroComissoes?.Comissao || [];
            const total = Array.isArray(comissoes) ? comissoes.length : (comissoes ? 1 : 0);
            comissoesMap.set(sen.codigo, { senador: sen, total });
          }
        } catch (e) {
          console.error(`Erro comissões sen ${sen.codigo}:`, e);
        }
        await new Promise(r => setTimeout(r, 100));
      }

      const comissoesArray = Array.from(comissoesMap.values())
        .filter(c => c.total > 0)
        .sort((a, b) => b.total - a.total);

      await supabase.from('ranking_senadores_comissoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const comissoesInsert = comissoesArray.map((c, index) => ({
        senador_codigo: c.senador.codigo,
        nome: c.senador.nome,
        partido: c.senador.partido,
        uf: c.senador.uf,
        foto_url: c.senador.foto,
        total_comissoes: c.total,
        posicao: index + 1,
        atualizado_em: new Date().toISOString()
      }));

      if (comissoesInsert.length > 0) {
        const { error } = await supabase.from('ranking_senadores_comissoes').insert(comissoesInsert);
        if (error) console.error('Erro inserir comissões:', error);
      }

      resultados.comissoes = { total: comissoesInsert.length };
      console.log(`[Rankings Senadores] Comissões: ${comissoesInsert.length} registros`);
    }

    // Atualizar Votações
    if (tipo === 'todos' || tipo === 'votacoes') {
      console.log('[Rankings Senadores] Processando votações...');
      const votacoesMap = new Map<string, { senador: any; total: number }>();

      for (const sen of senadores) {
        try {
          const votacoesResp = await fetch(
            `${SENADO_API_BASE}/senador/${sen.codigo}/votacoes.json?ano=${ano}`
          );
          if (votacoesResp.ok) {
            const votacoesData = await votacoesResp.json();
            const votacoes = votacoesData?.VotacaoParlamentar?.Parlamentar?.Votacoes?.Votacao || [];
            const total = Array.isArray(votacoes) ? votacoes.length : (votacoes ? 1 : 0);
            votacoesMap.set(sen.codigo, { senador: sen, total });
          }
        } catch (e) {
          console.error(`Erro votações sen ${sen.codigo}:`, e);
        }
        await new Promise(r => setTimeout(r, 100));
      }

      const votacoesArray = Array.from(votacoesMap.values())
        .filter(v => v.total > 0)
        .sort((a, b) => b.total - a.total);

      await supabase.from('ranking_senadores_votacoes').delete().eq('ano', ano);
      
      const votacoesInsert = votacoesArray.map((v, index) => ({
        senador_codigo: v.senador.codigo,
        nome: v.senador.nome,
        partido: v.senador.partido,
        uf: v.senador.uf,
        foto_url: v.senador.foto,
        total_votacoes: v.total,
        ano,
        posicao: index + 1,
        atualizado_em: new Date().toISOString()
      }));

      if (votacoesInsert.length > 0) {
        const { error } = await supabase.from('ranking_senadores_votacoes').insert(votacoesInsert);
        if (error) console.error('Erro inserir votações:', error);
      }

      resultados.votacoes = { total: votacoesInsert.length };
      console.log(`[Rankings Senadores] Votações: ${votacoesInsert.length} registros`);
    }

    // Atualizar Matérias/Proposições
    if (tipo === 'todos' || tipo === 'materias') {
      console.log('[Rankings Senadores] Processando matérias...');
      const materiasMap = new Map<string, { senador: any; total: number }>();

      for (const sen of senadores) {
        try {
          const materiasResp = await fetch(
            `${SENADO_API_BASE}/senador/${sen.codigo}/autorias.json?ano=${ano}`
          );
          if (materiasResp.ok) {
            const materiasData = await materiasResp.json();
            const materias = materiasData?.AutoriasParlamentar?.Parlamentar?.Autorias?.Autoria || [];
            const total = Array.isArray(materias) ? materias.length : (materias ? 1 : 0);
            materiasMap.set(sen.codigo, { senador: sen, total });
          }
        } catch (e) {
          console.error(`Erro matérias sen ${sen.codigo}:`, e);
        }
        await new Promise(r => setTimeout(r, 100));
      }

      const materiasArray = Array.from(materiasMap.values())
        .filter(m => m.total > 0)
        .sort((a, b) => b.total - a.total);

      await supabase.from('ranking_senadores_materias').delete().eq('ano', ano);
      
      const materiasInsert = materiasArray.map((m, index) => ({
        senador_codigo: m.senador.codigo,
        nome: m.senador.nome,
        partido: m.senador.partido,
        uf: m.senador.uf,
        foto_url: m.senador.foto,
        total_materias: m.total,
        ano,
        posicao: index + 1,
        atualizado_em: new Date().toISOString()
      }));

      if (materiasInsert.length > 0) {
        const { error } = await supabase.from('ranking_senadores_materias').insert(materiasInsert);
        if (error) console.error('Erro inserir matérias:', error);
      }

      resultados.materias = { total: materiasInsert.length };
      console.log(`[Rankings Senadores] Matérias: ${materiasInsert.length} registros`);
    }

    console.log('[Rankings Senadores] Atualização concluída:', resultados);

    return new Response(JSON.stringify({
      success: true,
      resultados,
      atualizadoEm: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Rankings Senadores] Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error?.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
