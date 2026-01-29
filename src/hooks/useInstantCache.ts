import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * Hook Universal de Cache-First com Zero Loading
 * 
 * Características:
 * - Cache instantâneo via memória + IndexedDB
 * - Zero loading quando dados em cache existem
 * - Stale-while-revalidate automático
 * - Preload de imagens opcional
 * - Integração com React Query
 */

interface InstantCacheDB extends DBSchema {
  cache: {
    key: string;
    value: {
      cacheKey: string;
      data: any;
      timestamp: number;
    };
  };
}

const DB_NAME = 'instant-cache-db';
const DB_VERSION = 1;
const DEFAULT_CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 horas

// Cache em memória para acesso instantâneo
const memoryCache = new Map<string, { data: any; timestamp: number }>();

// Singleton da conexão do banco
let dbPromise: Promise<IDBPDatabase<InstantCacheDB>> | null = null;

const getDB = async (): Promise<IDBPDatabase<InstantCacheDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<InstantCacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache');
        }
      },
    });
  }
  return dbPromise;
};

// Funções de cache global (exportadas para uso externo)
export async function getFromInstantCache<T>(cacheKey: string, cacheDuration: number = DEFAULT_CACHE_DURATION): Promise<{ data: T; isStale: boolean } | null> {
  const now = Date.now();
  
  // 1. Verifica memória primeiro (instantâneo)
  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    const isStale = now - cached.timestamp > cacheDuration;
    return { data: cached.data as T, isStale };
  }

  // 2. Verifica IndexedDB
  try {
    const db = await getDB();
    const cached = await db.get('cache', cacheKey);
    
    if (cached) {
      // Salva em memória para próximo acesso
      memoryCache.set(cacheKey, { data: cached.data, timestamp: cached.timestamp });
      const isStale = now - cached.timestamp > cacheDuration;
      return { data: cached.data as T, isStale };
    }
  } catch (error) {
    console.warn(`[InstantCache] Erro ao ler ${cacheKey}:`, error);
  }

  return null;
}

export async function saveToInstantCache(cacheKey: string, data: any): Promise<void> {
  const timestamp = Date.now();
  
  // Salva em memória (instantâneo)
  memoryCache.set(cacheKey, { data, timestamp });

  // Salva em IndexedDB (async)
  try {
    const db = await getDB();
    await db.put('cache', { cacheKey, data, timestamp }, cacheKey);
  } catch (error) {
    console.warn(`[InstantCache] Erro ao salvar ${cacheKey}:`, error);
  }
}

export function getFromMemoryCache<T>(cacheKey: string): T | null {
  return memoryCache.get(cacheKey)?.data ?? null;
}

export function isInMemoryCache(cacheKey: string): boolean {
  return memoryCache.has(cacheKey);
}

// Preload de imagens - cache global unificado
const imageCache = new Set<string>();

// Verificação robusta de cache do browser usando Performance API
function checkBrowserCache(url: string): boolean {
  if (!url) return false;
  
  // 1. Verifica no nosso cache em memória primeiro
  if (imageCache.has(url)) return true;
  
  // 2. Usa Performance API para verificar se já foi carregada
  if (typeof performance !== 'undefined' && performance.getEntriesByName) {
    const entries = performance.getEntriesByName(url, 'resource');
    if (entries.length > 0) {
      imageCache.add(url); // Sincroniza com nosso cache
      return true;
    }
  }
  
  // 3. Fallback: verifica se a imagem está complete no DOM
  const img = new Image();
  img.src = url;
  if (img.complete && img.naturalWidth > 0) {
    imageCache.add(url);
    return true;
  }
  
  return false;
}

// Marca uma imagem como carregada no cache global
export function markImageLoaded(url: string): void {
  if (url) {
    imageCache.add(url);
  }
}

export function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls
    .filter(url => url && !imageCache.has(url))
    .map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          imageCache.add(url);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      });
    });
  
  return Promise.all(promises);
}

export function isImagePreloaded(url: string): boolean {
  // Verifica cache em memória E cache do browser
  return imageCache.has(url) || checkBrowserCache(url);
}

// Hook principal
interface UseInstantCacheOptions<T> {
  cacheKey: string;
  queryFn: () => Promise<T>;
  cacheDuration?: number;
  enabled?: boolean;
  preloadImages?: boolean;
  imageExtractor?: (data: T) => string[];
  onSuccess?: (data: T) => void;
}

export function useInstantCache<T>({
  cacheKey,
  queryFn,
  cacheDuration = DEFAULT_CACHE_DURATION,
  enabled = true,
  preloadImages: shouldPreloadImages = false,
  imageExtractor,
  onSuccess,
}: UseInstantCacheOptions<T>) {
  const [data, setData] = useState<T | null>(() => getFromMemoryCache<T>(cacheKey));
  const [isLoading, setIsLoading] = useState(!isInMemoryCache(cacheKey));
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const hasInitialized = useRef(false);
  const isFetchingRef = useRef(false);

  // Carregar do cache e buscar dados frescos
  const loadData = useCallback(async () => {
    if (!enabled || isFetchingRef.current) return;

    // 1. Tenta carregar do cache (passando cacheDuration correto)
    const cached = await getFromInstantCache<T>(cacheKey, cacheDuration);
    
    if (cached) {
      setData(cached.data);
      setIsLoading(false);
      hasInitialized.current = true;

      // Preload de imagens se necessário
      if (shouldPreloadImages && imageExtractor) {
        const urls = imageExtractor(cached.data);
        preloadImages(urls);
      }

      // Popula React Query
      queryClient.setQueryData([cacheKey], cached.data);

      // Se não está stale, não precisa buscar
      if (!cached.isStale) {
        return;
      }
    }

    // 2. Busca dados frescos
    isFetchingRef.current = true;
    setIsFetching(true);

    try {
      const freshData = await queryFn();
      
      setData(freshData);
      setIsLoading(false);
      setError(null);
      hasInitialized.current = true;

      // Salva no cache
      await saveToInstantCache(cacheKey, freshData);
      
      // Popula React Query
      queryClient.setQueryData([cacheKey], freshData);

      // Preload de imagens
      if (shouldPreloadImages && imageExtractor) {
        const urls = imageExtractor(freshData);
        preloadImages(urls);
      }

      onSuccess?.(freshData);
    } catch (err) {
      console.error(`[InstantCache] Erro ao buscar ${cacheKey}:`, err);
      setError(err as Error);
      
      // Se não tem cache, marca como não loading
      if (!data && !hasInitialized.current) {
        setIsLoading(false);
      }
    } finally {
      setIsFetching(false);
      isFetchingRef.current = false;
    }
  }, [cacheKey, cacheDuration, enabled, queryFn, shouldPreloadImages, imageExtractor, queryClient, onSuccess]);

  // Efeito principal
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    loadData();
  }, [enabled, cacheKey]);

  // Função para forçar refresh
  const refresh = useCallback(async () => {
    hasInitialized.current = false;
    isFetchingRef.current = false;
    setIsFetching(true);
    
    try {
      const freshData = await queryFn();
      setData(freshData);
      await saveToInstantCache(cacheKey, freshData);
      queryClient.setQueryData([cacheKey], freshData);
      
      if (shouldPreloadImages && imageExtractor) {
        const urls = imageExtractor(freshData);
        preloadImages(urls);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsFetching(false);
    }
  }, [cacheKey, queryFn, shouldPreloadImages, imageExtractor, queryClient]);

  // Limpar cache
  const clearCache = useCallback(async () => {
    memoryCache.delete(cacheKey);
    try {
      const db = await getDB();
      await db.delete('cache', cacheKey);
    } catch (err) {
      console.warn(`[InstantCache] Erro ao limpar ${cacheKey}:`, err);
    }
    setData(null);
  }, [cacheKey]);

  return {
    data,
    isLoading: isLoading && !hasInitialized.current,
    isFetching,
    error,
    refresh,
    clearCache,
  };
}

export default useInstantCache;
