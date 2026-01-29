import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { openDB, IDBPDatabase } from 'idb';

type RankingTipo = 'despesas' | 'proposicoes' | 'presenca' | 'comissoes' | 'discursos' | 'frentes' | 'menos-despesas' | 'mandato';

interface RankingItem {
  id: string;
  deputado_id: number;
  nome: string;
  partido: string | null;
  uf: string | null;
  foto_url: string | null;
  valor: number;
  posicao: number;
  posicao_anterior: number | null;
  atualizado_em: string;
}

interface RankingFilters {
  ano?: number;
  mes?: number;
}

interface UseRankingCacheResult {
  ranking: RankingItem[];
  isLoading: boolean;
  isStale: boolean;
  isPopulating: boolean;
  ultimaAtualizacao: string | null;
  forcarAtualizacao: () => Promise<void>;
  mesSelecionado: number;
  anoSelecionado: number;
  setMesSelecionado: (mes: number) => void;
  setAnoSelecionado: (ano: number) => void;
}

const DB_NAME = 'ranking-cache-db';
const DB_VERSION = 3; // Incrementado para nova estrutura com posicao_anterior
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hora

const getDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('rankings')) {
        db.createObjectStore('rankings', { keyPath: 'cacheKey' });
      }
    },
  });
};

const TABLE_MAP: Record<RankingTipo, string> = {
  despesas: 'ranking_despesas',
  proposicoes: 'ranking_proposicoes',
  presenca: 'ranking_presenca',
  comissoes: 'ranking_comissoes',
  discursos: 'ranking_discursos',
  frentes: 'ranking_frentes',
  'menos-despesas': 'ranking_despesas',
  'mandato': 'ranking_despesas_mandato',
};

const VALUE_FIELD_MAP: Record<RankingTipo, string> = {
  despesas: 'total_gasto',
  proposicoes: 'total_proposicoes',
  presenca: 'total_eventos',
  comissoes: 'total_orgaos',
  discursos: 'total_discursos',
  frentes: 'total_frentes',
  'menos-despesas': 'total_gasto',
  'mandato': 'total_gasto',
};

const ORDER_DIRECTION: Record<RankingTipo, boolean> = {
  despesas: false, // DESC (mais gastos primeiro)
  proposicoes: false,
  presenca: false,
  comissoes: false,
  discursos: false,
  frentes: false,
  'menos-despesas': true, // ASC (menos gastos primeiro)
  'mandato': false,
};

// Tipos que suportam filtro por mês
const TIPOS_COM_MES = ['despesas', 'menos-despesas'];

export const useRankingCache = (tipo: RankingTipo, filters?: RankingFilters): UseRankingCacheResult => {
  const now = new Date();
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState(filters?.mes || (now.getMonth() + 1));
  const [anoSelecionado, setAnoSelecionado] = useState(filters?.ano || now.getFullYear());
  const [jaAcionouAtualizacao, setJaAcionouAtualizacao] = useState(false);

  const getCacheKey = useCallback(() => {
    if (TIPOS_COM_MES.includes(tipo)) {
      return `${tipo}-${anoSelecionado}-${mesSelecionado}`;
    }
    return tipo;
  }, [tipo, anoSelecionado, mesSelecionado]);

  const normalizeRanking = useCallback((data: any[], tipo: RankingTipo): RankingItem[] => {
    const valueField = VALUE_FIELD_MAP[tipo];
    return data.map(item => ({
      id: item.id,
      deputado_id: item.deputado_id,
      nome: item.nome,
      partido: item.partido,
      uf: item.uf,
      foto_url: item.foto_url,
      valor: item[valueField] || 0,
      posicao: item.posicao || 0,
      posicao_anterior: item.posicao_anterior ?? null,
      atualizado_em: item.atualizado_em,
    }));
  }, []);

  const loadFromIndexedDB = useCallback(async (): Promise<{ data: RankingItem[] | null; timestamp: number | null }> => {
    try {
      const db = await getDB();
      const cacheKey = getCacheKey();
      const cached = await db.get('rankings', cacheKey);
      if (cached) {
        return { data: cached.data, timestamp: cached.timestamp };
      }
    } catch (e) {
      console.error('Erro ao carregar IndexedDB:', e);
    }
    return { data: null, timestamp: null };
  }, [getCacheKey]);

  const saveToIndexedDB = useCallback(async (data: RankingItem[]) => {
    try {
      const db = await getDB();
      const cacheKey = getCacheKey();
      await db.put('rankings', {
        cacheKey,
        data,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error('Erro ao salvar IndexedDB:', e);
    }
  }, [getCacheKey]);

  const loadFromSupabase = useCallback(async (): Promise<RankingItem[]> => {
    const tableName = TABLE_MAP[tipo];
    const valueField = VALUE_FIELD_MAP[tipo];
    const ascending = ORDER_DIRECTION[tipo];
    
    // Para menos-despesas, usamos a tabela de despesas com ordenação ascendente
    const actualTable = tipo === 'menos-despesas' ? 'ranking_despesas' : tableName;
    
    let query = supabase
      .from(actualTable as any)
      .select('*')
      .order(valueField, { ascending });

    // Aplicar filtros de mês/ano para tipos que suportam
    if (TIPOS_COM_MES.includes(tipo)) {
      query = query.eq('ano', anoSelecionado).eq('mes', mesSelecionado);
    }

    // SEM LIMITE - buscar TODOS os deputados
    const { data, error } = await query;

    if (error) {
      console.error(`Erro ao carregar ${tableName}:`, error);
      return [];
    }

    return normalizeRanking(data || [], tipo);
  }, [tipo, anoSelecionado, mesSelecionado, normalizeRanking]);

  const forcarAtualizacao = useCallback(async () => {
    setIsLoading(true);
    try {
      // Chamar edge function para atualizar dados
      const tiposSuportados = ['despesas', 'proposicoes', 'presenca', 'comissoes', 'discursos', 'frentes', 'menos-despesas', 'mandato'];
      if (tiposSuportados.includes(tipo)) {
        const tipoAPI = tipo === 'menos-despesas' ? 'despesas' : tipo;
        const { data, error } = await supabase.functions.invoke('atualizar-rankings-politicos', {
          body: { 
            tipo: tipoAPI,
            ano: anoSelecionado,
            mes: mesSelecionado
          }
        });
        if (error) throw error;
      }

      // Recarregar do Supabase
      const freshData = await loadFromSupabase();
      if (freshData.length > 0) {
        setRanking(freshData);
        setUltimaAtualizacao(new Date().toISOString());
        setIsStale(false);
        await saveToIndexedDB(freshData);
      }
    } catch (e) {
      console.error('Erro ao forçar atualização:', e);
    } finally {
      setIsLoading(false);
    }
  }, [tipo, anoSelecionado, mesSelecionado, loadFromSupabase, saveToIndexedDB]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setIsLoading(true);

      // 1. Tentar carregar do IndexedDB primeiro (instantâneo)
      const { data: cachedData, timestamp } = await loadFromIndexedDB();
      
      if (cachedData && cachedData.length > 0) {
        if (isMounted) {
          setRanking(cachedData);
          setIsLoading(false);
          
          const isExpired = timestamp && (Date.now() - timestamp) > CACHE_DURATION_MS;
          setIsStale(!!isExpired);
          
          if (cachedData[0]?.atualizado_em) {
            setUltimaAtualizacao(cachedData[0].atualizado_em);
          }

          // Se cache não expirou, não precisa buscar do Supabase
          if (!isExpired) {
            return;
          }
        }
      }

      // 2. Carregar do Supabase
      const supabaseData = await loadFromSupabase();
      
      if (supabaseData.length > 0 && isMounted) {
        setRanking(supabaseData);
        setIsStale(false);
        if (supabaseData[0]?.atualizado_em) {
          setUltimaAtualizacao(supabaseData[0].atualizado_em);
        }
        await saveToIndexedDB(supabaseData);
        setIsLoading(false);
      } else if ((!cachedData || cachedData.length === 0) && !jaAcionouAtualizacao) {
        // 3. Se não tem dados em lugar nenhum E ainda não tentamos atualizar, acionar Edge Function
        console.log(`[useRankingCache] Tabela vazia para ${tipo} (${anoSelecionado}/${mesSelecionado}), acionando atualização automática...`);
        if (isMounted) {
          setJaAcionouAtualizacao(true);
          setIsPopulating(true);
          
          // Chamar edge function para popular dados
          try {
            const tiposSuportados = ['despesas', 'proposicoes', 'presenca', 'comissoes', 'discursos', 'frentes', 'menos-despesas', 'mandato'];
            if (tiposSuportados.includes(tipo)) {
              const tipoAPI = tipo === 'menos-despesas' ? 'despesas' : tipo;
              console.log(`[useRankingCache] Acionando Edge Function para tipo: ${tipoAPI}`);
              
              // Não aguarda conclusão - apenas dispara e deixa rodar em background
              supabase.functions.invoke('atualizar-rankings-politicos', {
                body: { 
                  tipo: tipoAPI,
                  ano: anoSelecionado,
                  mes: mesSelecionado
                }
              }).then(() => {
                console.log(`[useRankingCache] Edge Function acionada com sucesso para ${tipoAPI}`);
                if (isMounted) setIsPopulating(false);
              }).catch(err => {
                console.warn(`[useRankingCache] Erro ao acionar Edge Function:`, err);
                if (isMounted) setIsPopulating(false);
              });
            }
          } catch (e) {
            console.error('[useRankingCache] Erro ao acionar atualização:', e);
            setIsPopulating(false);
          }
          
          setIsLoading(false);
        }
      } else {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    
    return () => { isMounted = false; };
  }, [tipo, anoSelecionado, mesSelecionado, loadFromIndexedDB, loadFromSupabase, saveToIndexedDB, jaAcionouAtualizacao]);

  // Reset do flag quando mudar tipo/ano/mes
  useEffect(() => {
    setJaAcionouAtualizacao(false);
    setIsPopulating(false);
  }, [tipo, anoSelecionado, mesSelecionado]);

  return {
    ranking,
    isLoading,
    isStale,
    isPopulating,
    ultimaAtualizacao,
    forcarAtualizacao,
    mesSelecionado,
    anoSelecionado,
    setMesSelecionado,
    setAnoSelecionado,
  };
};

// Hook para preview rápido (apenas top 3)
export const useRankingPreview = (tipo: RankingTipo) => {
  const { ranking, isLoading, ultimaAtualizacao } = useRankingCache(tipo);
  return {
    top3: ranking.slice(0, 3),
    isLoading,
    ultimaAtualizacao,
  };
};
