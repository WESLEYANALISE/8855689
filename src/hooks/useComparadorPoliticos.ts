import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PoliticoComparacao {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto_url: string;
  tipo: 'deputado' | 'senador';
  totalDespesas: number;
  totalProposicoes: number;
  presenca: number;
  comissoes: number;
  evolucaoGastos: { mes: string; valor: number }[];
}

interface UseComparadorPoliticosResult {
  politicosSelecionados: PoliticoComparacao[];
  isLoading: boolean;
  adicionarPolitico: (id: number, tipo: 'deputado' | 'senador') => Promise<void>;
  removerPolitico: (id: number) => void;
  limparTodos: () => void;
  buscarPoliticos: (termo: string, tipo: 'deputado' | 'senador') => Promise<any[]>;
}

export function useComparadorPoliticos(): UseComparadorPoliticosResult {
  const [politicosSelecionados, setPoliticosSelecionados] = useState<PoliticoComparacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const buscarPoliticos = useCallback(async (termo: string, tipo: 'deputado' | 'senador') => {
    if (!termo || termo.length < 2) return [];
    
    try {
      const campoId = tipo === 'deputado' ? 'deputado_id' : 'senador_id';

      let data: any[] = [];
      
      if (tipo === 'deputado') {
        const { data: result, error } = await supabase
          .from('ranking_despesas')
          .select('deputado_id,nome,partido,uf,foto_url')
          .ilike('nome', `%${termo}%`)
          .limit(50);
        if (error) throw error;
        data = result || [];
      } else {
        // Usando any para tabelas do senado que podem não estar no schema
        const { data: result, error } = await (supabase as any)
          .from('ranking_despesas_senado')
          .select('senador_id,nome,partido,uf,foto_url')
          .ilike('nome', `%${termo}%`)
          .limit(50);
        if (error) throw error;
        data = result || [];
      }

      // Remover duplicatas por ID
      const uniqueMap = new Map();
      data.forEach((item: any) => {
        const id = item[campoId];
        if (!uniqueMap.has(id)) {
          uniqueMap.set(id, {
            id,
            nome: item.nome,
            partido: item.partido,
            uf: item.uf,
            foto_url: item.foto_url,
            tipo
          });
        }
      });

      return Array.from(uniqueMap.values());
    } catch (error) {
      console.error('Erro ao buscar políticos:', error);
      return [];
    }
  }, []);

  const adicionarPolitico = useCallback(async (id: number, tipo: 'deputado' | 'senador') => {
    if (politicosSelecionados.length >= 4) return;
    if (politicosSelecionados.find(p => p.id === id && p.tipo === tipo)) return;

    setIsLoading(true);
    try {
      let despesasData: any[] = [];
      let proposicoesData: any = null;
      let presencaData: any = null;
      let comissoesData: any = null;

      if (tipo === 'deputado') {
        // Buscar dados de despesas
        const { data } = await supabase
          .from('ranking_despesas')
          .select('*')
          .eq('deputado_id', id)
          .order('ano', { ascending: true })
          .order('mes', { ascending: true });
        despesasData = data || [];

        // Buscar proposições
        try {
          const { data: propData } = await supabase
            .from('ranking_proposicoes')
            .select('total')
            .eq('deputado_id', id)
            .limit(1);
          proposicoesData = propData?.[0];
        } catch (e) {}

        // Buscar presença
        try {
          const { data: presData } = await supabase
            .from('ranking_presenca')
            .select('total')
            .eq('deputado_id', id)
            .limit(1);
          presencaData = presData?.[0];
        } catch (e) {}

        // Buscar comissões
        try {
          const { data: comData } = await supabase
            .from('ranking_comissoes')
            .select('total')
            .eq('deputado_id', id)
            .limit(1);
          comissoesData = comData?.[0];
        } catch (e) {}
      } else {
        // Buscar dados de despesas - Senador (usando any para tabelas não tipadas)
        const { data } = await (supabase as any)
          .from('ranking_despesas_senado')
          .select('*')
          .eq('senador_id', id)
          .order('ano', { ascending: true })
          .order('mes', { ascending: true });
        despesasData = data || [];

        // Buscar proposições
        try {
          const { data: propData } = await (supabase as any)
            .from('ranking_producao_senado')
            .select('total')
            .eq('senador_id', id)
            .limit(1);
          proposicoesData = propData?.[0];
        } catch (e) {}

        // Buscar atividade em comissões
        try {
          const { data: atividadeData } = await (supabase as any)
            .from('ranking_atividade_comissoes_senado')
            .select('total')
            .eq('senador_id', id)
            .limit(1);
          presencaData = atividadeData?.[0];
          comissoesData = atividadeData?.[0];
        } catch (e) {}
      }

      const mesesNome = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      const primeiroRegistro = despesasData?.[0];
      const totalDespesas = despesasData.reduce((sum: number, d: any) => sum + (d.total_gasto || 0), 0);
      const evolucaoGastos = despesasData.slice(-12).map((d: any) => ({
        mes: `${mesesNome[d.mes - 1]}/${String(d.ano).slice(-2)}`,
        valor: d.total_gasto || 0
      }));

      const novoPolitico: PoliticoComparacao = {
        id,
        nome: primeiroRegistro?.nome || 'N/A',
        partido: primeiroRegistro?.partido || 'N/A',
        uf: primeiroRegistro?.uf || 'N/A',
        foto_url: primeiroRegistro?.foto_url || '',
        tipo,
        totalDespesas,
        totalProposicoes: proposicoesData?.total || 0,
        presenca: presencaData?.total || 0,
        comissoes: comissoesData?.total || 0,
        evolucaoGastos
      };

      setPoliticosSelecionados(prev => [...prev, novoPolitico]);
    } catch (error) {
      console.error('Erro ao adicionar político:', error);
    } finally {
      setIsLoading(false);
    }
  }, [politicosSelecionados]);

  const removerPolitico = useCallback((id: number) => {
    setPoliticosSelecionados(prev => prev.filter(p => p.id !== id));
  }, []);

  const limparTodos = useCallback(() => {
    setPoliticosSelecionados([]);
  }, []);

  return {
    politicosSelecionados,
    isLoading,
    adicionarPolitico,
    removerPolitico,
    limparTodos,
    buscarPoliticos
  };
}
