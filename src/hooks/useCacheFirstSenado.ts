import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIndexedDBCache } from './useIndexedDBCache';

interface UseCacheFirstSenadoOptions {
  cacheKey: string;
  functionName: string;
  functionBody?: Record<string, any>;
  enabled?: boolean;
  dataExtractor?: (response: any) => any[];
}

/**
 * Hook cache-first para dados do Senado
 * 
 * 1. INSTANTÂNEO: Mostra cache IndexedDB imediatamente
 * 2. OFFLINE-FIRST: Funciona sem internet usando cache local
 * 3. BACKGROUND REVALIDATION: Busca dados frescos silenciosamente
 * 4. SEM LOADING BLOQUEANTE: Nunca mostra "Carregando..." se tem cache
 */
export const useCacheFirstSenado = <T = any>({
  cacheKey,
  functionName,
  functionBody = {},
  enabled = true,
  dataExtractor = (response) => response?.data || response || []
}: UseCacheFirstSenadoOptions) => {
  const [data, setData] = useState<T[]>([]);
  const [isFetchingFresh, setIsFetchingFresh] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isFetching = useRef(false);
  
  const { cachedData, isLoadingCache, saveToCache } = useIndexedDBCache<T>(`senado_${cacheKey}`);

  // 1. INSTANTÂNEO: Carrega cache imediatamente quando disponível
  useEffect(() => {
    if (!enabled) return;
    
    if (!isLoadingCache && cachedData && cachedData.length > 0 && data.length === 0) {
      setData(cachedData);
      console.log(`📦 [Senado:${cacheKey}] Cache carregado: ${cachedData.length} itens`);
    }
  }, [cachedData, isLoadingCache, cacheKey, enabled, data.length]);

  // 2. Busca dados frescos em BACKGROUND (silencioso)
  const fetchFreshData = useCallback(async () => {
    if (!enabled || isFetching.current) return;
    
    isFetching.current = true;
    setIsFetchingFresh(true);
    
    try {
      console.log(`🔄 [Senado:${cacheKey}] Buscando dados frescos...`);
      const { data: response, error: fetchError } = await supabase.functions.invoke(functionName, {
        body: functionBody
      });
      
      if (fetchError) throw fetchError;
      
      const extractedData = dataExtractor(response);
      
      // Atualiza estado e cache
      setData(extractedData);
      saveToCache(extractedData);
      setError(null);
      
      console.log(`✅ [Senado:${cacheKey}] Dados frescos: ${extractedData.length} itens`);
    } catch (err) {
      console.error(`❌ [Senado:${cacheKey}] Erro ao buscar dados:`, err);
      setError(err as Error);
    } finally {
      setIsFetchingFresh(false);
      isFetching.current = false;
    }
  }, [cacheKey, functionName, functionBody, enabled, saveToCache, dataExtractor]);

  // 3. Dispara fetch em background após cache carregar
  useEffect(() => {
    if (!enabled || isLoadingCache) return;
    
    const timeout = setTimeout(() => {
      fetchFreshData();
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [isLoadingCache, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // 4. Função para forçar refresh
  const refresh = useCallback(() => {
    isFetching.current = false;
    fetchFreshData();
  }, [fetchFreshData]);

  // isLoading = true APENAS se não tem cache E está carregando cache OU buscando dados
  const isLoading = data.length === 0 && (isLoadingCache || isFetchingFresh);

  return {
    data,
    isLoading,
    isFetchingFresh,
    totalLoaded: data.length,
    error,
    refresh
  };
};
