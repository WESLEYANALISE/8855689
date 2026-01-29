import { useState, useEffect, useCallback, useRef } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface GenericCacheDB extends DBSchema {
  cache: {
    key: string;
    value: {
      cacheKey: string;
      data: any;
      timestamp: number;
    };
  };
}

const DB_NAME = 'app-generic-cache';
const DB_VERSION = 1;
const DEFAULT_CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 horas

let dbPromise: Promise<IDBPDatabase<GenericCacheDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<GenericCacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache');
        }
      },
    });
  }
  return dbPromise;
};

interface UseGenericCacheOptions<T> {
  cacheKey: string;
  fetchFn: () => Promise<T>;
  cacheDuration?: number;
  enabled?: boolean;
  staleWhileRevalidate?: boolean;
}

/**
 * Hook genérico para cache-first com IndexedDB
 * 
 * Características:
 * - Cache-first: mostra dados do cache instantaneamente
 * - Stale-while-revalidate: mostra dados antigos enquanto busca novos
 * - Zero loading se cache existe
 * - Revalidação em background
 */
export function useGenericCache<T>({
  cacheKey,
  fetchFn,
  cacheDuration = DEFAULT_CACHE_DURATION,
  enabled = true,
  staleWhileRevalidate = true
}: UseGenericCacheOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const hasInitialized = useRef(false);
  const isFetchingRef = useRef(false);

  // Carregar do cache
  const loadFromCache = useCallback(async () => {
    try {
      const db = await getDB();
      const cached = await db.get('cache', cacheKey);
      
      if (cached) {
        const age = Date.now() - cached.timestamp;
        const isExpired = age > cacheDuration;
        
        setData(cached.data as T);
        setIsStale(isExpired);
        setIsLoading(false);
        hasInitialized.current = true;
        
        return { data: cached.data, isExpired };
      }
      return null;
    } catch (err) {
      console.error(`[Cache] Erro ao carregar ${cacheKey}:`, err);
      return null;
    }
  }, [cacheKey, cacheDuration]);

  // Salvar no cache
  const saveToCache = useCallback(async (newData: T) => {
    try {
      const db = await getDB();
      await db.put('cache', {
        cacheKey,
        data: newData,
        timestamp: Date.now(),
      }, cacheKey);
    } catch (err) {
      console.error(`[Cache] Erro ao salvar ${cacheKey}:`, err);
    }
  }, [cacheKey]);

  // Buscar dados frescos
  const fetchFreshData = useCallback(async () => {
    if (!enabled || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setIsFetching(true);
    
    try {
      const freshData = await fetchFn();
      setData(freshData);
      setIsStale(false);
      setIsLoading(false);
      setError(null);
      hasInitialized.current = true;
      await saveToCache(freshData);
    } catch (err) {
      console.error(`[Cache] Erro ao buscar ${cacheKey}:`, err);
      setError(err as Error);
      
      // Se não tem cache, marca como não loading
      if (!data && !hasInitialized.current) {
        setIsLoading(false);
      }
    } finally {
      setIsFetching(false);
      isFetchingRef.current = false;
    }
  }, [enabled, fetchFn, saveToCache, cacheKey, data]);

  // Efeito principal
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      // 1. Tenta carregar do cache primeiro
      const cached = await loadFromCache();
      
      if (cached) {
        // 2. Se cache existe e stale-while-revalidate, busca em background
        if (staleWhileRevalidate || cached.isExpired) {
          setTimeout(() => fetchFreshData(), 100);
        }
      } else {
        // 3. Sem cache, busca diretamente
        fetchFreshData();
      }
    };

    init();
  }, [enabled, cacheKey]); // Removido loadFromCache e fetchFreshData para evitar loops

  // Função para forçar refresh
  const refresh = useCallback(() => {
    hasInitialized.current = false;
    isFetchingRef.current = false;
    setIsStale(true);
    fetchFreshData();
  }, [fetchFreshData]);

  // Função para limpar cache
  const clearCache = useCallback(async () => {
    try {
      const db = await getDB();
      await db.delete('cache', cacheKey);
      setData(null);
      setIsStale(false);
    } catch (err) {
      console.error(`[Cache] Erro ao limpar ${cacheKey}:`, err);
    }
  }, [cacheKey]);

  return {
    data,
    isLoading: isLoading && !hasInitialized.current,
    isFetching,
    isStale,
    error,
    refresh,
    clearCache,
  };
}

/**
 * Hook específico para dados do Supabase com cache
 */
export function useSupabaseCache<T>({
  cacheKey,
  queryFn,
  enabled = true,
}: {
  cacheKey: string;
  queryFn: () => Promise<T>;
  enabled?: boolean;
}) {
  return useGenericCache({
    cacheKey,
    fetchFn: queryFn,
    enabled,
    staleWhileRevalidate: true,
  });
}
