import { useState, useEffect, useCallback } from 'react';
import { useIndexedDBCache } from './useIndexedDBCache';
import { supabase } from '@/integrations/supabase/client';

interface AreaComContagem {
  area: string;
  totalTemas: number;
  totalQuestoes: number;
}

const CACHE_KEY = 'questoes-areas-contagem';
const REVALIDATE_INTERVAL = 1000 * 60 * 60 * 24; // 24 horas

export const useQuestoesAreasCache = () => {
  const { cachedData, isLoadingCache, saveToCache } = useIndexedDBCache<AreaComContagem>(CACHE_KEY);
  const [areas, setAreas] = useState<AreaComContagem[] | null>(null);
  // Nunca mostrar loading se já tem cache
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // Normalizar nome da área para unificar duplicatas com/sem acentos
  const normalizarArea = (area: string): string => {
    // Mapeamento de nomes sem acento para com acento
    const mapeamento: Record<string, string> = {
      'Portugues': 'Português',
      'portugues': 'Português',
    };
    return mapeamento[area] || area;
  };

  // Fetch otimizado usando RPC (uma única query SQL agregada)
  const fetchFromSupabase = useCallback(async (): Promise<AreaComContagem[]> => {
    const { data, error } = await supabase.rpc('get_questoes_areas_stats');

    if (error) {
      console.error('Erro ao buscar estatísticas de áreas:', error);
      throw error;
    }

    // Agrupar áreas duplicadas (ex: "Portugues" e "Português")
    const areasAgrupadas = new Map<string, AreaComContagem>();
    
    (data || []).forEach((item: { area: string; total_temas: number; total_questoes: number }) => {
      const areaNormalizada = normalizarArea(item.area);
      const existing = areasAgrupadas.get(areaNormalizada);
      
      if (existing) {
        existing.totalTemas += Number(item.total_temas);
        existing.totalQuestoes += Number(item.total_questoes);
      } else {
        areasAgrupadas.set(areaNormalizada, {
          area: areaNormalizada,
          totalTemas: Number(item.total_temas),
          totalQuestoes: Number(item.total_questoes),
        });
      }
    });

    return Array.from(areasAgrupadas.values());
  }, []);

  // Carrega do cache instantaneamente
  useEffect(() => {
    if (!isLoadingCache && cachedData && cachedData.length > 0) {
      setAreas(cachedData);
      setIsLoading(false);
    }
  }, [isLoadingCache, cachedData]);

  // Busca dados do Supabase (em background se já tem cache)
  useEffect(() => {
    const loadData = async () => {
      // Se já tem cache, só revalida em background
      const shouldRevalidate = !lastFetchTime || (Date.now() - lastFetchTime > REVALIDATE_INTERVAL);
      
      if (!cachedData || cachedData.length === 0) {
        // Sem cache - carrega normalmente
        setIsLoading(true);
        try {
          const data = await fetchFromSupabase();
          setAreas(data);
          await saveToCache(data);
          setLastFetchTime(Date.now());
        } catch (error) {
          console.error('Erro ao carregar áreas:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (shouldRevalidate) {
        // Com cache - revalida em background sem mostrar loading
        try {
          const data = await fetchFromSupabase();
          setAreas(data);
          await saveToCache(data);
          setLastFetchTime(Date.now());
        } catch (error) {
          console.error('Erro na revalidação em background:', error);
        }
      }
    };

    if (!isLoadingCache) {
      loadData();
    }
  }, [isLoadingCache, cachedData, fetchFromSupabase, saveToCache, lastFetchTime]);

  const totalQuestoes = areas?.reduce((acc, item) => acc + item.totalQuestoes, 0) || 0;

  return {
    areas,
    isLoading: false, // Nunca mostrar loading - sempre mostra cache primeiro
    totalQuestoes,
  };
};
