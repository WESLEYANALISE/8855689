import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type RankingTipoSenado = 'despesas' | 'discursos' | 'comissoes' | 'votacoes' | 'materias';

export interface RankingItemSenado {
  id: string;
  senador_codigo: string;
  nome: string;
  partido: string;
  uf: string;
  foto_url: string;
  valor: number;
  posicao: number;
  posicao_anterior: number | null;
  atualizado_em: string;
}

interface RankingFilters {
  ano?: number;
}

const DB_NAME = 'ranking-senado-cache';
const DB_VERSION = 1;
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hora

const TABLE_MAP: Record<RankingTipoSenado, string> = {
  despesas: 'ranking_senadores_despesas',
  discursos: 'ranking_senadores_discursos',
  comissoes: 'ranking_senadores_comissoes',
  votacoes: 'ranking_senadores_votacoes',
  materias: 'ranking_senadores_materias',
};

const VALUE_FIELD_MAP: Record<RankingTipoSenado, string> = {
  despesas: 'total_gasto',
  discursos: 'total_discursos',
  comissoes: 'total_comissoes',
  votacoes: 'total_votacoes',
  materias: 'total_materias',
};

async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('rankings')) {
        db.createObjectStore('rankings');
      }
    };
  });
}

export function useRankingCacheSenado(tipo: RankingTipoSenado, filters?: RankingFilters) {
  const [ranking, setRanking] = useState<RankingItemSenado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [isPopulating, setIsPopulating] = useState(false);
  const [selectedAno, setSelectedAno] = useState<number>(filters?.ano || new Date().getFullYear());
  const jaAcionouAtualizacao = useRef(false);

  const getCacheKey = useCallback(() => {
    return `senado_${tipo}_${selectedAno}`;
  }, [tipo, selectedAno]);

  const normalizeRanking = useCallback((data: any[]): RankingItemSenado[] => {
    const valueField = VALUE_FIELD_MAP[tipo];
    return data.map((item) => ({
      id: item.id,
      senador_codigo: item.senador_codigo,
      nome: item.nome,
      partido: item.partido || '',
      uf: item.uf || '',
      foto_url: item.foto_url || '',
      valor: Number(item[valueField]) || 0,
      posicao: item.posicao,
      posicao_anterior: item.posicao_anterior ?? null,
      atualizado_em: item.atualizado_em,
    }));
  }, [tipo]);

  const loadFromIndexedDB = useCallback(async (): Promise<{ data: RankingItemSenado[]; timestamp: number } | null> => {
    try {
      const db = await getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('rankings', 'readonly');
        const store = tx.objectStore('rankings');
        const request = store.get(getCacheKey());
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }, [getCacheKey]);

  const saveToIndexedDB = useCallback(async (data: RankingItemSenado[]) => {
    try {
      const db = await getDB();
      const tx = db.transaction('rankings', 'readwrite');
      const store = tx.objectStore('rankings');
      store.put({ data, timestamp: Date.now() }, getCacheKey());
    } catch (e) {
      console.error('Erro ao salvar cache:', e);
    }
  }, [getCacheKey]);

  const loadFromSupabase = useCallback(async (): Promise<RankingItemSenado[]> => {
    const tableName = TABLE_MAP[tipo];
    
    try {
      // Usar fetch direto para evitar problemas de tipos com tabelas novas
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      let url = `${supabaseUrl}/rest/v1/${tableName}?select=*&order=posicao.asc`;
      
      if (tipo !== 'comissoes' && selectedAno) {
        url += `&ano=eq.${selectedAno}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });
      
      if (!response.ok) {
        console.error(`Erro ao buscar ${tipo}:`, response.statusText);
        return [];
      }
      
      const data = await response.json();
      return normalizeRanking(data || []);
    } catch (error) {
      console.error(`Erro ao buscar ${tipo}:`, error);
      return [];
    }
  }, [tipo, selectedAno, normalizeRanking]);

  const forcarAtualizacao = useCallback(async () => {
    if (isPopulating) return;
    setIsPopulating(true);
    
    try {
      console.log(`[Senado] Forçando atualização: ${tipo}`);
      const response = await supabase.functions.invoke('atualizar-rankings-senadores', {
        body: { tipo, ano: selectedAno }
      });
      
      if (response.error) {
        console.error('Erro ao atualizar:', response.error);
      } else {
        const freshData = await loadFromSupabase();
        setRanking(freshData);
        await saveToIndexedDB(freshData);
        if (freshData.length > 0) {
          setUltimaAtualizacao(new Date(freshData[0].atualizado_em));
        }
        setIsStale(false);
      }
    } catch (error) {
      console.error('Erro ao forçar atualização:', error);
    } finally {
      setIsPopulating(false);
    }
  }, [tipo, selectedAno, isPopulating, loadFromSupabase, saveToIndexedDB]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);

      // 1. Tentar IndexedDB primeiro
      const cached = await loadFromIndexedDB();
      if (cached?.data?.length && mounted) {
        setRanking(cached.data);
        setIsLoading(false);
        const isStaleCache = Date.now() - cached.timestamp > CACHE_DURATION_MS;
        setIsStale(isStaleCache);
        if (cached.data[0]?.atualizado_em) {
          setUltimaAtualizacao(new Date(cached.data[0].atualizado_em));
        }
        
        if (!isStaleCache) return;
      }

      // 2. Tentar Supabase
      const supabaseData = await loadFromSupabase();
      if (supabaseData.length > 0 && mounted) {
        setRanking(supabaseData);
        await saveToIndexedDB(supabaseData);
        setIsStale(false);
        setIsLoading(false);
        if (supabaseData[0]?.atualizado_em) {
          setUltimaAtualizacao(new Date(supabaseData[0].atualizado_em));
        }
        return;
      }

      // 3. Sem dados - trigger edge function
      if (!jaAcionouAtualizacao.current && mounted) {
        jaAcionouAtualizacao.current = true;
        setIsPopulating(true);
        
        try {
          await supabase.functions.invoke('atualizar-rankings-senadores', {
            body: { tipo, ano: selectedAno }
          });
          
          // Aguardar e tentar novamente
          await new Promise(r => setTimeout(r, 3000));
          const freshData = await loadFromSupabase();
          if (mounted && freshData.length > 0) {
            setRanking(freshData);
            await saveToIndexedDB(freshData);
            if (freshData[0]?.atualizado_em) {
              setUltimaAtualizacao(new Date(freshData[0].atualizado_em));
            }
          }
        } catch (e) {
          console.error('Erro ao popular dados:', e);
        } finally {
          if (mounted) {
            setIsPopulating(false);
            setIsLoading(false);
          }
        }
      } else if (mounted) {
        setIsLoading(false);
      }
    };

    load();

    return () => { mounted = false; };
  }, [tipo, selectedAno, loadFromIndexedDB, loadFromSupabase, saveToIndexedDB]);

  useEffect(() => {
    jaAcionouAtualizacao.current = false;
    setIsPopulating(false);
  }, [tipo, selectedAno]);

  return {
    ranking,
    isLoading,
    isStale,
    isPopulating,
    ultimaAtualizacao,
    forcarAtualizacao,
    selectedAno,
    setSelectedAno,
  };
}

export function useRankingPreviewSenado(tipo: RankingTipoSenado) {
  const { ranking, isLoading, ultimaAtualizacao } = useRankingCacheSenado(tipo);
  
  return {
    top3: ranking.slice(0, 3),
    isLoading,
    ultimaAtualizacao,
  };
}
