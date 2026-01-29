import { useEffect, useRef } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Cache Unificado Global v2 - Otimizado para performance
 * - Batch loading com Promise.all
 * - Stale-while-revalidate pattern
 * - Memory-first with IndexedDB fallback
 */

interface UnifiedCacheDB extends DBSchema {
  data: {
    key: string;
    value: {
      cacheKey: string;
      data: any;
      timestamp: number;
    };
  };
}

const DB_NAME = 'unified-cache-v2';
const DB_VERSION = 1;
const CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 horas (reduzido para dados mais frescos)
const STALE_DURATION = 1000 * 60 * 60 * 24; // 24 horas - dados stale ainda usáveis

let dbPromise: Promise<IDBPDatabase<UnifiedCacheDB>> | null = null;
let isPreloading = false;
let hasPreloaded = false;

// Dados críticos para preload (ordenados por prioridade de uso)
// COLUNAS VERIFICADAS NO SCHEMA REAL - 26/12/2024
const CRITICAL_TABLES = [
  // Prioridade 1: Dados da home
  { key: 'cursos', table: 'CURSOS-APP', select: 'id,tema,ordem,"capa-aula","descricao-aula"', order: 'ordem', limit: 30 },
  { key: 'noticias_juridicas', table: 'noticias_juridicas_cache', select: 'id,titulo,data_publicacao,fonte,imagem,descricao', order: 'data_publicacao', ascending: false, limit: 30 },
  { key: 'blogger_juridico', table: 'BLOGGER_JURIDICO', select: 'id,titulo,categoria,url_capa,descricao_curta,ordem', order: 'ordem', limit: 20 },
  { key: 'audioaulas', table: 'AUDIO-AULA', select: 'id,titulo,area,tema,sequencia,imagem_miniatura', order: 'sequencia', limit: 30 },
  
  // Prioridade 2: Capas das bibliotecas (CRÍTICO para carregamento instantâneo)
  { key: 'capas_biblioteca', table: 'CAPA-BIBILIOTECA', select: 'id,Biblioteca,capa', order: 'id', limit: 10 },
  
  // Prioridade 3: Bibliotecas (capas para carrossel)
  { key: 'biblioteca_estudos', table: 'BIBLIOTECA-ESTUDOS', select: 'id,Tema,"Capa-livro",Área,url_capa_gerada', order: 'id', limit: 50 },
  { key: 'biblioteca_classicos', table: 'BIBLIOTECA-CLASSICOS', select: 'id,livro,imagem,area,autor', order: 'id', limit: 30 },
  { key: 'biblioteca_oab', table: 'BIBILIOTECA-OAB', select: 'id,Tema,"Capa-livro",Área', order: 'id', limit: 30 },
  
  // Prioridade 3: Conteúdo político
  { key: 'blogger_politico', table: 'blogger_politico', select: 'id,titulo,categoria,url_capa,descricao_curta', order: 'id', limit: 20 },
  
  // Prioridade 4: Aulas interativas
  { key: 'aulas_interativas', table: 'aulas_interativas', select: 'id,titulo,area,tema,descricao', order: 'created_at', limit: 20 },
] as const;

// Memory cache otimizado com LRU-like behavior
const memoryCache = new Map<string, { data: any; timestamp: number; accessCount: number }>();
const MAX_MEMORY_ENTRIES = 50;

const getDB = async (): Promise<IDBPDatabase<UnifiedCacheDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<UnifiedCacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'cacheKey' });
        }
      },
    });
  }
  return dbPromise;
};

// Limpa entradas antigas do memory cache se exceder limite
const pruneMemoryCache = () => {
  if (memoryCache.size <= MAX_MEMORY_ENTRIES) return;
  
  const entries = Array.from(memoryCache.entries())
    .sort((a, b) => a[1].accessCount - b[1].accessCount);
  
  const toRemove = entries.slice(0, memoryCache.size - MAX_MEMORY_ENTRIES);
  toRemove.forEach(([key]) => memoryCache.delete(key));
};

/**
 * Obtém dados do cache com stale-while-revalidate
 */
export async function getFromUnifiedCache<T>(cacheKey: string): Promise<{ data: T; isStale: boolean } | null> {
  // 1. Memory cache (instantâneo)
  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    cached.accessCount++;
    const age = Date.now() - cached.timestamp;
    
    if (age < STALE_DURATION) {
      return { data: cached.data as T, isStale: age > CACHE_DURATION };
    }
  }

  // 2. IndexedDB
  try {
    const db = await getDB();
    const cached = await db.get('data', cacheKey);
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < STALE_DURATION) {
        memoryCache.set(cacheKey, { data: cached.data, timestamp: cached.timestamp, accessCount: 1 });
        pruneMemoryCache();
        return { data: cached.data as T, isStale: age > CACHE_DURATION };
      }
    }
  } catch (error) {
    // Silent fail
  }

  return null;
}

/**
 * Salva dados no cache unificado
 */
export async function saveToUnifiedCache(cacheKey: string, data: any): Promise<void> {
  const timestamp = Date.now();
  
  memoryCache.set(cacheKey, { data, timestamp, accessCount: 1 });
  pruneMemoryCache();

  // IndexedDB async (não bloqueia)
  try {
    const db = await getDB();
    await db.put('data', { cacheKey, data, timestamp });
  } catch (error) {
    // Silent fail
  }
}

/**
 * Preload de dados críticos - otimizado com batch loading
 */
export async function preloadCriticalData(queryClient?: any): Promise<void> {
  if (isPreloading || hasPreloaded) return;
  isPreloading = true;

  const startTime = performance.now();

  try {
    // Carregar todos os caches locais primeiro (batch)
    const cachedResults = await Promise.all(
      CRITICAL_TABLES.map(async ({ key }) => {
        const cached = await getFromUnifiedCache(key);
        return { key, cached };
      })
    );

    // Identificar o que precisa ser buscado
    const needsFetch: typeof CRITICAL_TABLES[number][] = [];
    
    for (const result of cachedResults) {
      const config = CRITICAL_TABLES.find(t => t.key === result.key)!;
      
      if (result.cached) {
        // Usa cache, popula React Query
        if (queryClient) {
          queryClient.setQueryData([result.key], result.cached.data);
        }
        
        // Se stale, agenda revalidação
        if (result.cached.isStale) {
          needsFetch.push(config);
        }
      } else {
        needsFetch.push(config);
      }
    }

    // Buscar dados que faltam/são stale em paralelo
    if (needsFetch.length > 0) {
      await Promise.all(
        needsFetch.map(async (config) => {
          const { key, table, select, order, limit } = config;
          const isAscending = 'ascending' in config ? (config as any).ascending : (order === 'ordem' || order === 'sequencia');
          try {
            const { data, error } = await supabase
              .from(table as any)
              .select(select)
              .order(order as any, { ascending: isAscending })
              .limit(limit);

            if (!error && data) {
              await saveToUnifiedCache(key, data);
              if (queryClient) {
                queryClient.setQueryData([key], data);
              }
            }
          } catch (e) {
            // Silent fail
          }
        })
      );
    }

    const elapsed = Math.round(performance.now() - startTime);
    console.log(`✅ UnifiedCache: ${CRITICAL_TABLES.length} tabelas em ${elapsed}ms`);

    hasPreloaded = true;
  } catch (error) {
    console.error('UnifiedCache: Erro no preload', error);
  } finally {
    isPreloading = false;
  }
}

/**
 * Revalidação em background (stale-while-revalidate)
 */
export function scheduleBackgroundRevalidation(queryClient?: any): void {
  // Revalidar após 10 minutos se a página estiver visível
  setTimeout(() => {
    if (document.hidden) return;
    
    CRITICAL_TABLES.forEach(async (config) => {
      const { key, table, select, order, limit } = config;
      const isAscending = 'ascending' in config ? (config as any).ascending : (order === 'ordem' || order === 'sequencia');
      try {
        const { data, error } = await supabase
          .from(table as any)
          .select(select)
          .order(order as any, { ascending: isAscending })
          .limit(limit);

        if (!error && data) {
          await saveToUnifiedCache(key, data);
          if (queryClient) {
            queryClient.setQueryData([key], data);
          }
        }
      } catch (e) {
        // Silent fail
      }
    });
  }, 10 * 60 * 1000);
}

/**
 * Limpa todo o cache
 */
export async function clearUnifiedCache(): Promise<void> {
  memoryCache.clear();
  try {
    const db = await getDB();
    await db.clear('data');
  } catch (error) {
    // Silent fail
  }
}

/**
 * Acesso síncrono ao memory cache
 */
export function isInUnifiedMemoryCache(key: string): boolean {
  return memoryCache.has(key);
}

export function getFromUnifiedMemoryCache<T>(key: string): T | undefined {
  const cached = memoryCache.get(key);
  if (cached) {
    cached.accessCount++;
    return cached.data as T;
  }
  return undefined;
}

/**
 * Hook para usar o cache unificado
 */
export function useUnifiedCache() {
  const queryClient = useQueryClient();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
    
    idleCallback(() => {
      preloadCriticalData(queryClient);
      scheduleBackgroundRevalidation(queryClient);
    });
  }, [queryClient]);

  return {
    getFromCache: getFromUnifiedCache,
    saveToCache: saveToUnifiedCache,
    clearCache: clearUnifiedCache,
    isInMemory: isInUnifiedMemoryCache,
    getFromMemory: getFromUnifiedMemoryCache,
  };
}

export default useUnifiedCache;
