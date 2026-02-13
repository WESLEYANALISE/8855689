import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIndexedDBCache } from './useIndexedDBCache';
import { sortArticles } from '@/lib/articleSorter';

// Tabelas que têm coluna ordem_artigo
const TABELAS_COM_ORDEM_ARTIGO = new Set([
  'CC - Código Civil',
  'CP - Código Penal', 
  'CPC - Código de Processo Civil',
  'CPP - Código de Processo Penal',
  'CF - Constituição Federal',
  'CLT - Consolidação das Leis do Trabalho',
  'CDC – Código de Defesa do Consumidor',
  'CTN - Código Tributário Nacional',
  'ECA - Estatuto da Criança e do Adolescente',
  'CTB - Código de Trânsito Brasileiro',
  'LEP - Lei de Execução Penal',
  'LIA - Lei de Improbidade Administrativa',
  'LRF - Lei de Responsabilidade Fiscal',
  'LAI - Lei de Acesso à Informação',
  'Maria da Penha',
  'CDC – Código de Defesa do Consumidor',
]);

const getOrderColumn = (tableName: string): string => {
  return TABELAS_COM_ORDEM_ARTIGO.has(tableName) ? 'ordem_artigo' : 'id';
};

interface UseProgressiveArticlesOptions {
  tableName: string;
  initialChunk?: number;      // Primeiros N artigos (default: 50)
  backgroundChunk?: number;   // Quantos carregar por vez em background (default: 100)
  delayBetweenChunks?: number; // Delay entre chunks em ms (default: 200)
  enabled?: boolean;
}

interface UseProgressiveArticlesReturn<T> {
  articles: T[];
  isLoadingInitial: boolean;  // True apenas enquanto carrega os primeiros 50
  isLoadingMore: boolean;     // True enquanto carrega em background
  progress: number;           // 0-100
  totalLoaded: number;
  isComplete: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook de carregamento progressivo para artigos de códigos/leis
 * 
 * Estratégia:
 * 1. Verificar cache IndexedDB primeiro
 * 2. Se tem cache, mostrar instantaneamente e verificar atualizações em background
 * 3. Se não tem cache, carregar primeiros 50 artigos rapidamente
 * 4. Em background, carregar o resto automaticamente (sem precisar scroll)
 * 5. Salvar tudo no cache para próxima visita ser instantânea
 */
export const useProgressiveArticles = <T = any>({
  tableName,
  initialChunk = 50,
  backgroundChunk = 100,
  delayBetweenChunks = 200,
  enabled = true
}: UseProgressiveArticlesOptions): UseProgressiveArticlesReturn<T> => {
  const [articles, setArticles] = useState<T[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const hasInitialized = useRef(false);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { cachedData, isLoadingCache, saveToCache, clearCache } = useIndexedDBCache<T>(tableName);
  const skipCacheRef = useRef(false);

  // Função para ordenar artigos se tiver "Número do Artigo"
  const sortIfNeeded = useCallback((data: T[]): T[] => {
    if (data.length > 0 && "Número do Artigo" in (data[0] as any)) {
      return sortArticles(data as any) as T[];
    }
    return data;
  }, []);

  // Função para buscar um chunk de artigos
  const fetchChunk = useCallback(async (offset: number, limit: number): Promise<T[]> => {
    const orderColumn = getOrderColumn(tableName);
    
    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .order(orderColumn, { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return (data || []) as T[];
  }, [tableName]);

  // Carregamento progressivo em background
  const loadProgressively = useCallback(async (startOffset: number = 0) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    // Criar novo abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      let offset = startOffset;
      let hasMore = true;
      
      while (hasMore) {
        // Verificar se foi abortado
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        const chunk = await fetchChunk(offset, backgroundChunk);
        
        if (chunk.length === 0) {
          hasMore = false;
          break;
        }
        
        // Adicionar novos artigos ao estado
        setArticles(prev => {
          // Evitar duplicatas
          const existingIds = new Set(prev.map((a: any) => a.id));
          const newArticles = chunk.filter((a: any) => !existingIds.has(a.id));
          
          if (newArticles.length === 0) {
            return prev;
          }
          
          const combined = [...prev, ...newArticles];
          return sortIfNeeded(combined);
        });
        
        offset += backgroundChunk;
        hasMore = chunk.length === backgroundChunk;
        
        // Pequeno delay para não sobrecarregar
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
        }
      }
      
      // Concluído - salvar cache
      setIsComplete(true);
      setIsLoadingMore(false);
      
      // Salvar cache com todos os artigos
      setArticles(current => {
        if (current.length > 0) {
          saveToCache(current);
        }
        return current;
      });
      
    } catch (err) {
      console.error(`[${tableName}] Erro no carregamento progressivo:`, err);
      setError(err as Error);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [tableName, backgroundChunk, delayBetweenChunks, fetchChunk, saveToCache, sortIfNeeded]);

  // Carregamento inicial
  const loadInitial = useCallback(async () => {
    if (!enabled || hasInitialized.current) return;
    hasInitialized.current = true;
    
    try {
      // 1. INSTANTÂNEO: Se tem cache e não estamos pulando, mostrar imediatamente
      if (!skipCacheRef.current && cachedData && cachedData.length > 0) {
        const sorted = sortIfNeeded(cachedData);
        setArticles(sorted);
        setIsLoadingInitial(false);
        setIsComplete(true);
        console.log(`📦 [${tableName}] Cache carregado: ${sorted.length} artigos`);
        
        // Background: verificar se há atualizações
        setTimeout(() => {
          checkForUpdates(sorted.length);
        }, 2000);
        return;
      }
      
      // 2. RÁPIDO: Carregar primeiros 50 artigos
      console.log(`⚡ [${tableName}] Carregando primeiros ${initialChunk} artigos...`);
      const initialData = await fetchChunk(0, initialChunk);
      
      if (initialData.length > 0) {
        const sorted = sortIfNeeded(initialData);
        setArticles(sorted);
        setIsLoadingInitial(false);
        console.log(`✅ [${tableName}] Primeiros ${sorted.length} artigos carregados`);
        
        // 3. BACKGROUND: Carregar o resto automaticamente
        if (initialData.length === initialChunk) {
          setIsLoadingMore(true);
          // Pequeno delay antes de começar carregamento em background
          setTimeout(() => {
            loadProgressively(initialChunk);
          }, 100);
        } else {
          // Se veio menos que o chunk inicial, já carregou tudo
          setIsComplete(true);
          saveToCache(sorted);
        }
      } else {
        setIsLoadingInitial(false);
        setIsComplete(true);
      }
      
    } catch (err) {
      console.error(`[${tableName}] Erro no carregamento inicial:`, err);
      setError(err as Error);
      setIsLoadingInitial(false);
    }
  }, [enabled, cachedData, tableName, initialChunk, fetchChunk, sortIfNeeded, loadProgressively, saveToCache]);

  // Verificar atualizações em background (quando tem cache)
  const checkForUpdates = useCallback(async (cachedCount: number) => {
    try {
      // Buscar contagem atual da tabela
      const { count } = await supabase
        .from(tableName as any)
        .select('*', { count: 'exact', head: true });
      
      if (count && count !== cachedCount) {
        console.log(`🔄 [${tableName}] Detectada mudança: ${cachedCount} → ${count} artigos. Limpando cache...`);
        // Limpar cache obsoleto e forçar busca do Supabase
        await clearCache();
        skipCacheRef.current = true;
        setIsLoadingMore(true);
        hasInitialized.current = false;
        setArticles([]);
        // Recarregar sem cache
        setTimeout(() => {
          loadInitialRef.current();
        }, 50);
      }
    } catch (err) {
      console.error(`[${tableName}] Erro ao verificar atualizações:`, err);
    }
  }, [tableName, clearCache]);

  // Disparar carregamento inicial quando cache terminar de carregar
  const loadInitialRef = useRef(loadInitial);
  loadInitialRef.current = loadInitial;
  
  useEffect(() => {
    if (!enabled) return;
    if (isLoadingCache) return;
    
    loadInitialRef.current();
    
    return () => {
      // Abortar carregamento em andamento ao desmontar
      abortControllerRef.current?.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isLoadingCache]);

  // Função para forçar refresh
  const refresh = useCallback(() => {
    abortControllerRef.current?.abort();
    hasInitialized.current = false;
    isLoadingRef.current = false;
    setArticles([]);
    setIsLoadingInitial(true);
    setIsLoadingMore(false);
    setIsComplete(false);
    setError(null);
    
    // Pequeno delay para garantir que o estado foi resetado
    setTimeout(() => {
      loadInitial();
    }, 50);
  }, [loadInitial]);

  // Calcular progresso
  const progress = isComplete ? 100 : 
    articles.length > 0 ? Math.min(99, Math.round((articles.length / (articles.length + backgroundChunk)) * 100)) : 0;

  return {
    articles,
    isLoadingInitial: isLoadingInitial && !cachedData?.length,
    isLoadingMore,
    progress,
    totalLoaded: articles.length,
    isComplete,
    error,
    refresh
  };
};
