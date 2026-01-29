import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ResumosCount {
  resumosMateria: number;
  resumosArtigosLei: number;
  total: number;
}

const CACHE_KEY = 'resumos-count-cache-v1';
const REVALIDATE_INTERVAL = 1000 * 60 * 60 * 24; // 24 horas

export const useResumosCount = () => {
  const [counts, setCounts] = useState<ResumosCount | null>(() => {
    // Carregar do localStorage instantaneamente
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
    } catch (e) {
      console.error('Erro ao ler cache de resumos:', e);
    }
    return null;
  });

  const [lastFetchTime, setLastFetchTime] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        return timestamp;
      }
    } catch (e) {
      return null;
    }
    return null;
  });

  const fetchFromSupabase = useCallback(async (): Promise<ResumosCount> => {
    // Buscar total de resumos por matéria (tabela RESUMO)
    const { count: resumosMateria, error: error1 } = await supabase
      .from("RESUMO")
      .select("*", { count: "exact", head: true });

    if (error1) throw error1;

    // Buscar total de resumos de artigos de lei (tabela RESUMOS_ARTIGOS_LEI)
    const { count: resumosArtigosLei, error: error2 } = await supabase
      .from("RESUMOS_ARTIGOS_LEI")
      .select("*", { count: "exact", head: true });

    if (error2) throw error2;

    const materiaCount = resumosMateria || 0;
    const artigosCount = resumosArtigosLei || 0;

    return {
      resumosMateria: materiaCount,
      resumosArtigosLei: artigosCount,
      total: materiaCount + artigosCount,
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const shouldRevalidate = !lastFetchTime || (Date.now() - lastFetchTime > REVALIDATE_INTERVAL);
      
      if (!counts) {
        // Sem cache - carrega normalmente
        try {
          const data = await fetchFromSupabase();
          setCounts(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
          setLastFetchTime(Date.now());
        } catch (error) {
          console.error('Erro ao carregar contagem de resumos:', error);
        }
      } else if (shouldRevalidate) {
        // Com cache - revalida em background sem mostrar loading
        try {
          const data = await fetchFromSupabase();
          setCounts(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
          setLastFetchTime(Date.now());
        } catch (error) {
          console.error('Erro na revalidação em background:', error);
        }
      }
    };

    loadData();
  }, [counts, fetchFromSupabase, lastFetchTime]);

  return {
    data: counts,
    isLoading: false, // Nunca mostrar loading - sempre mostra cache primeiro
    totalResumos: counts?.total || 0,
    resumosMateria: counts?.resumosMateria || 0,
    resumosArtigosLei: counts?.resumosArtigosLei || 0,
  };
};

export const invalidateResumosCache = () => {
  localStorage.removeItem(CACHE_KEY);
};
