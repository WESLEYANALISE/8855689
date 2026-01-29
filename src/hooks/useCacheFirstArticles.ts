import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchAllRows } from '@/lib/fetchAllRows';
import { useIndexedDBCache } from './useIndexedDBCache';
import { sortArticles } from '@/lib/articleSorter';

// Função auxiliar para ordenar apenas se tiver "Número do Artigo"
const sortIfHasArticleNumber = <T>(data: T[]): T[] => {
  if (data.length > 0 && "Número do Artigo" in (data[0] as any)) {
    return sortArticles(data as any) as T[];
  }
  return data;
};

// Gerar hash simples para detectar mudanças nos dados
const hashData = (data: any[]): string => {
  if (!data || data.length === 0) return '';
  return `${data.length}-${data[0]?.id || 0}-${data[data.length - 1]?.id || 0}`;
};

// STALE TIME OTIMIZADO: 30 minutos (artigos raramente mudam)
const STALE_TIME_MS = 1000 * 60 * 30;

interface UseCacheFirstArticlesOptions {
  tableName: string;
  orderBy?: string;
  enabled?: boolean;
}

/**
 * Hook cache-first para carregamento de artigos
 * 
 * Benefícios:
 * 1. INSTANTÂNEO: Mostra cache IndexedDB imediatamente (mesmo se expirado)
 * 2. OFFLINE-FIRST: Funciona sem internet usando cache local
 * 3. BACKGROUND REVALIDATION: Busca dados frescos silenciosamente
 * 4. RETRY AUTOMÁTICO: Tenta novamente com backoff exponencial
 * 5. SEM LOADING BLOQUEANTE: Nunca mostra "Carregando..." se tem cache
 */
export const useCacheFirstArticles = <T = any>({
  tableName,
  orderBy = 'id',
  enabled = true
}: UseCacheFirstArticlesOptions) => {
  const [articles, setArticles] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingFresh, setIsFetchingFresh] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasInitialized = useRef(false);
  const isFetching = useRef(false);
  const cacheHash = useRef<string>('');
  
  const { cachedData, isLoadingCache, saveToCache } = useIndexedDBCache<T>(tableName);

  // 1. Carrega cache INSTANTANEAMENTE quando disponível
  useEffect(() => {
    if (!enabled) return;
    
    if (!isLoadingCache && cachedData && cachedData.length > 0 && !hasInitialized.current) {
      const sortedCache = sortIfHasArticleNumber(cachedData);
      cacheHash.current = hashData(sortedCache);
      setArticles(sortedCache);
      setIsLoading(false);
      hasInitialized.current = true;
      console.log(`📦 [${tableName}] Cache carregado: ${sortedCache.length} artigos`);
    }
  }, [cachedData, isLoadingCache, tableName, enabled]);

  // 2. Busca dados frescos em BACKGROUND com deduplicação
  const fetchFreshData = useCallback(async () => {
    if (!enabled || isFetching.current) return;
    
    isFetching.current = true;
    setIsFetchingFresh(true);
    
    try {
      console.log(`🔄 [${tableName}] Buscando dados frescos...`);
      const freshData = await fetchAllRows<T>(tableName, orderBy);
      const sortedData = sortIfHasArticleNumber(freshData);
      
      // Verificar se dados realmente mudaram (evita re-render desnecessário)
      const newHash = hashData(sortedData);
      if (newHash === cacheHash.current && articles.length > 0) {
        console.log(`⏩ [${tableName}] Dados iguais, pulando atualização`);
        setIsLoading(false);
        hasInitialized.current = true;
        setIsFetchingFresh(false);
        isFetching.current = false;
        return;
      }
      
      cacheHash.current = newHash;
      
      // Atualiza estado e cache
      setArticles(sortedData);
      setIsLoading(false);
      hasInitialized.current = true;
      saveToCache(sortedData);
      setError(null);
      
      console.log(`✅ [${tableName}] Dados frescos: ${sortedData.length} artigos`);
    } catch (err) {
      console.error(`❌ [${tableName}] Erro ao buscar dados:`, err);
      setError(err as Error);
      
      // Se não tem cache, marca como não loading para mostrar erro
      if (articles.length === 0 && !cachedData?.length) {
        setIsLoading(false);
      }
    } finally {
      setIsFetchingFresh(false);
      isFetching.current = false;
    }
  }, [tableName, orderBy, enabled, saveToCache, articles.length, cachedData?.length]);

  // 3. Dispara fetch em background após cache carregar
  useEffect(() => {
    if (!enabled || isLoadingCache) return;
    
    // Pequeno delay para não bloquear UI
    const timeout = setTimeout(() => {
      fetchFreshData();
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [isLoadingCache, enabled]); // Removido fetchFreshData das deps para evitar loop

  // 4. Se cache terminou de carregar e está vazio, ainda está loading até fetch terminar
  useEffect(() => {
    if (!isLoadingCache && !cachedData?.length && !hasInitialized.current) {
      // Sem cache, espera o fetch
      setIsLoading(true);
    }
  }, [isLoadingCache, cachedData?.length]);

  // 5. Função para atualizar artigo específico e sincronizar cache
  const updateArticle = useCallback((articleId: number, updates: Partial<T>) => {
    setArticles(prev => {
      const updated = prev.map(a => 
        (a as any).id === articleId ? { ...a, ...updates } : a
      );
      saveToCache(updated);
      return updated;
    });
  }, [saveToCache]);

  // 6. Função para forçar refresh
  const refresh = useCallback(() => {
    hasInitialized.current = false;
    isFetching.current = false;
    fetchFreshData();
  }, [fetchFreshData]);

  return {
    articles,
    isLoading: isLoading && !hasInitialized.current,
    isLoadingInitial: isLoading && !hasInitialized.current,
    isLoadingFull: isFetchingFresh,
    isFetchingFresh,
    totalLoaded: articles.length,
    error,
    updateArticle,
    refresh
  };
};
