import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { getStaleTimeForQuery, CACHE_STALE_TIMES } from '@/config/cacheConfig';

/**
 * Hook Universal de Cache - Camada Unificada
 * 
 * Estratégia de 3 camadas:
 * 1. Memória (Map) - Acesso instantâneo < 1ms
 * 2. LocalStorage - Dados pequenos < 100KB, persistente
 * 3. IndexedDB - Dados grandes, persistente
 * 
 * Características:
 * - NUNCA mostra loading se tem cache (mesmo stale)
 * - Stale-while-revalidate automático
 * - Sincroniza com React Query
 * - Preload de imagens opcional
 */

interface UniversalCacheDB extends DBSchema {
  cache: {
    key: string;
    value: {
      cacheKey: string;
      data: any;
      timestamp: number;
      size: number;
    };
  };
}

const DB_NAME = 'universal-cache-v1';
const DB_VERSION = 1;
const LOCALSTORAGE_SIZE_LIMIT = 100 * 1024; // 100KB

// Memory cache global (instantâneo)
const memoryCache = new Map<string, { data: any; timestamp: number }>();

// Singleton da conexão IndexedDB
let dbPromise: Promise<IDBPDatabase<UniversalCacheDB>> | null = null;

const getDB = async (): Promise<IDBPDatabase<UniversalCacheDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<UniversalCacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'cacheKey' });
        }
      },
    });
  }
  return dbPromise;
};

// Calcula tamanho aproximado do objeto em bytes
function getObjectSize(obj: any): number {
  try {
    return new Blob([JSON.stringify(obj)]).size;
  } catch {
    return Infinity;
  }
}

// =========== FUNÇÕES DE CACHE GLOBAL ===========

/**
 * Obtém dados do cache unificado (memória → localStorage → IndexedDB)
 */
export async function getFromUniversalCache<T>(
  cacheKey: string,
  staleTime?: number
): Promise<{ data: T; isStale: boolean } | null> {
  const now = Date.now();
  const effectiveStaleTime = staleTime ?? getStaleTimeForQuery(cacheKey);

  // 1. Memória (instantâneo)
  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    const isStale = now - cached.timestamp > effectiveStaleTime;
    return { data: cached.data as T, isStale };
  }

  // 2. LocalStorage (rápido)
  try {
    const localKey = `ucache_${cacheKey}`;
    const localData = localStorage.getItem(localKey);
    if (localData) {
      const parsed = JSON.parse(localData);
      const isStale = now - parsed.timestamp > effectiveStaleTime;
      
      // Sincroniza com memória
      memoryCache.set(cacheKey, { data: parsed.data, timestamp: parsed.timestamp });
      
      return { data: parsed.data as T, isStale };
    }
  } catch {
    // Silent fail
  }

  // 3. IndexedDB (mais lento, mas persistente)
  try {
    const db = await getDB();
    const cached = await db.get('cache', cacheKey);
    
    if (cached) {
      const isStale = now - cached.timestamp > effectiveStaleTime;
      
      // Sincroniza com memória
      memoryCache.set(cacheKey, { data: cached.data, timestamp: cached.timestamp });
      
      return { data: cached.data as T, isStale };
    }
  } catch {
    // Silent fail
  }

  return null;
}

/**
 * Salva dados no cache unificado
 * Automaticamente escolhe localStorage ou IndexedDB baseado no tamanho
 */
export async function saveToUniversalCache(cacheKey: string, data: any): Promise<void> {
  const timestamp = Date.now();
  const size = getObjectSize(data);

  // 1. Sempre salva em memória
  memoryCache.set(cacheKey, { data, timestamp });

  // 2. Dados pequenos → localStorage (mais rápido)
  if (size < LOCALSTORAGE_SIZE_LIMIT) {
    try {
      const localKey = `ucache_${cacheKey}`;
      localStorage.setItem(localKey, JSON.stringify({ data, timestamp }));
      return; // Não precisa IndexedDB
    } catch {
      // LocalStorage cheio, usa IndexedDB
    }
  }

  // 3. Dados grandes → IndexedDB
  try {
    const db = await getDB();
    await db.put('cache', { cacheKey, data, timestamp, size });
  } catch {
    // Silent fail
  }
}

/**
 * Verifica se dados estão em memória (acesso instantâneo)
 */
export function isInMemory(cacheKey: string): boolean {
  return memoryCache.has(cacheKey);
}

/**
 * Obtém dados diretamente da memória (síncrono)
 */
export function getFromMemory<T>(cacheKey: string): T | null {
  return memoryCache.get(cacheKey)?.data ?? null;
}

/**
 * Limpa cache específico
 */
export async function clearUniversalCacheKey(cacheKey: string): Promise<void> {
  memoryCache.delete(cacheKey);
  
  try {
    localStorage.removeItem(`ucache_${cacheKey}`);
  } catch {}
  
  try {
    const db = await getDB();
    await db.delete('cache', cacheKey);
  } catch {}
}

/**
 * Limpa todo o cache
 */
export async function clearAllUniversalCache(): Promise<void> {
  memoryCache.clear();
  
  // Limpa localStorage (só nossas chaves)
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('ucache_'));
    keys.forEach(k => localStorage.removeItem(k));
  } catch {}
  
  // Limpa IndexedDB
  try {
    const db = await getDB();
    await db.clear('cache');
  } catch {}
}

// =========== HOOK PRINCIPAL ===========

interface UseUniversalCacheConfig<T> {
  cacheKey: string;
  queryFn: () => Promise<T>;
  staleTime?: number;
  enabled?: boolean;
  preloadImages?: boolean;
  imageExtractor?: (data: T) => string[];
  onSuccess?: (data: T) => void;
}

export function useUniversalCache<T>({
  cacheKey,
  queryFn,
  staleTime,
  enabled = true,
  preloadImages = false,
  imageExtractor,
  onSuccess,
}: UseUniversalCacheConfig<T>) {
  const [data, setData] = useState<T | null>(() => getFromMemory<T>(cacheKey));
  const [isLoading, setIsLoading] = useState(!isInMemory(cacheKey));
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const hasInitialized = useRef(false);
  const isFetchingRef = useRef(false);

  const effectiveStaleTime = staleTime ?? getStaleTimeForQuery(cacheKey);

  // Preload de imagens
  const preloadImageUrls = useCallback((urls: string[]) => {
    if (!urls.length) return;
    
    urls.filter(Boolean).forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  // Carrega dados do cache e busca frescos se necessário
  const loadData = useCallback(async () => {
    if (!enabled || isFetchingRef.current) return;

    // 1. Tenta cache
    const cached = await getFromUniversalCache<T>(cacheKey, effectiveStaleTime);
    
    if (cached) {
      setData(cached.data);
      setIsLoading(false);
      hasInitialized.current = true;

      // Preload de imagens
      if (preloadImages && imageExtractor) {
        preloadImageUrls(imageExtractor(cached.data));
      }

      // Sincroniza com React Query
      queryClient.setQueryData([cacheKey], cached.data);

      // Se não está stale, não precisa buscar
      if (!cached.isStale) {
        return;
      }
    }

    // 2. Busca dados frescos em background
    isFetchingRef.current = true;
    setIsFetching(true);

    try {
      const freshData = await queryFn();
      
      setData(freshData);
      setIsLoading(false);
      setError(null);
      hasInitialized.current = true;

      // Salva no cache
      await saveToUniversalCache(cacheKey, freshData);
      
      // Sincroniza com React Query
      queryClient.setQueryData([cacheKey], freshData);

      // Preload de imagens
      if (preloadImages && imageExtractor) {
        preloadImageUrls(imageExtractor(freshData));
      }

      onSuccess?.(freshData);
    } catch (err) {
      console.error(`[UniversalCache] Erro ao buscar ${cacheKey}:`, err);
      setError(err as Error);
      
      // Se não tem cache, marca como não loading
      if (!data && !hasInitialized.current) {
        setIsLoading(false);
      }
    } finally {
      setIsFetching(false);
      isFetchingRef.current = false;
    }
  }, [cacheKey, effectiveStaleTime, enabled, queryFn, preloadImages, imageExtractor, queryClient, onSuccess, data, preloadImageUrls]);

  // Efeito principal
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    loadData();
  }, [enabled, cacheKey]);

  // Força refresh
  const refresh = useCallback(async () => {
    hasInitialized.current = false;
    isFetchingRef.current = false;
    setIsFetching(true);
    
    try {
      const freshData = await queryFn();
      setData(freshData);
      await saveToUniversalCache(cacheKey, freshData);
      queryClient.setQueryData([cacheKey], freshData);
      
      if (preloadImages && imageExtractor) {
        preloadImageUrls(imageExtractor(freshData));
      }
      
      onSuccess?.(freshData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsFetching(false);
    }
  }, [cacheKey, queryFn, preloadImages, imageExtractor, queryClient, onSuccess, preloadImageUrls]);

  // Limpar cache
  const clearCache = useCallback(async () => {
    await clearUniversalCacheKey(cacheKey);
    setData(null);
  }, [cacheKey]);

  return {
    data,
    isLoading: isLoading && !hasInitialized.current,
    isFetching,
    error,
    refresh,
    clearCache,
    hasCache: hasInitialized.current || isInMemory(cacheKey),
  };
}

export default useUniversalCache;
