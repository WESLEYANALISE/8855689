import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getFromInstantCache, saveToInstantCache } from './useInstantCache';

interface Documentario {
  id: string;
  video_id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  capa_webp: string | null;
  duracao: string | null;
  publicado_em: string | null;
  canal_nome: string | null;
  transcricao: any[] | null;
  transcricao_texto: string | null;
  visualizacoes: number;
  categoria: string | null;
}

interface UseProgressiveDocumentariosOptions {
  initialChunk?: number;        // Primeiros N documentários (default: 10)
  backgroundChunk?: number;     // Quantos carregar por vez em background (default: 10)
  delayBetweenChunks?: number;  // Delay entre chunks em ms (default: 150)
  enabled?: boolean;
}

interface UseProgressiveDocumentariosReturn {
  documentarios: Documentario[];
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  progress: number;
  totalLoaded: number;
  isComplete: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'documentarios-juridicos-progressive';

/**
 * Hook de carregamento progressivo para documentários jurídicos
 * 
 * Estratégia:
 * 1. Verificar cache IndexedDB primeiro
 * 2. Se tem cache, mostrar instantaneamente
 * 3. Se não tem cache, carregar primeiros 10 documentários rapidamente
 * 4. Em background, carregar o resto automaticamente (10 por vez)
 * 5. Salvar tudo no cache para próxima visita ser instantânea
 */
export const useProgressiveDocumentaries = ({
  initialChunk = 10,
  backgroundChunk = 10,
  delayBetweenChunks = 150,
  enabled = true
}: UseProgressiveDocumentariosOptions = {}): UseProgressiveDocumentariosReturn => {
  const [documentarios, setDocumentarios] = useState<Documentario[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const hasInitialized = useRef(false);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const totalCountRef = useRef<number>(0);

  // Normalizar dados do documentário
  const normalizeDoc = (doc: any): Documentario => ({
    ...doc,
    transcricao: Array.isArray(doc.transcricao) ? doc.transcricao : [],
    categoria: doc.categoria || 'destaque'
  });

  // Buscar chunk de documentários
  const fetchChunk = useCallback(async (offset: number, limit: number): Promise<Documentario[]> => {
    const { data, error } = await supabase
      .from('documentarios_juridicos')
      .select('*')
      .order('publicado_em', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return (data || []).map(normalizeDoc);
  }, []);

  // Buscar total de documentários
  const fetchTotalCount = useCallback(async (): Promise<number> => {
    const { count, error } = await supabase
      .from('documentarios_juridicos')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  }, []);

  // Carregamento progressivo em background
  const loadProgressively = useCallback(async (startOffset: number = 0) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    abortControllerRef.current = new AbortController();
    
    try {
      let offset = startOffset;
      let hasMore = true;
      
      while (hasMore) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        const chunk = await fetchChunk(offset, backgroundChunk);
        
        if (chunk.length === 0) {
          hasMore = false;
          break;
        }
        
        // Adicionar novos documentários
        setDocumentarios(prev => {
          const existingIds = new Set(prev.map(d => d.id));
          const newDocs = chunk.filter(d => !existingIds.has(d.id));
          
          if (newDocs.length === 0) {
            return prev;
          }
          
          return [...prev, ...newDocs];
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
      
      // Salvar cache com todos os documentários
      setDocumentarios(current => {
        if (current.length > 0) {
          saveToInstantCache(CACHE_KEY, current);
          console.log(`💾 [Documentários] Cache salvo: ${current.length} itens`);
        }
        return current;
      });
      
    } catch (err) {
      console.error('[Documentários] Erro no carregamento progressivo:', err);
      setError(err as Error);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [backgroundChunk, delayBetweenChunks, fetchChunk]);

  // Carregamento inicial
  const loadInitial = useCallback(async () => {
    if (!enabled || hasInitialized.current) return;
    hasInitialized.current = true;
    
    try {
      // 1. INSTANTÂNEO: Se tem cache, mostrar imediatamente
      const cached = await getFromInstantCache<Documentario[]>(CACHE_KEY);
      
      if (cached?.data && cached.data.length > 0) {
        setDocumentarios(cached.data);
        setIsLoadingInitial(false);
        setIsComplete(true);
        console.log(`📦 [Documentários] Cache carregado: ${cached.data.length} itens`);
        
        // Background: verificar se há atualizações
        setTimeout(async () => {
          try {
            const count = await fetchTotalCount();
            if (count !== cached.data.length) {
              console.log(`🔄 [Documentários] Detectada mudança: ${cached.data.length} → ${count}`);
              // Recarregar silenciosamente
              const freshData = await fetchChunk(0, count);
              setDocumentarios(freshData);
              saveToInstantCache(CACHE_KEY, freshData);
            }
          } catch (err) {
            console.warn('[Documentários] Erro ao verificar atualizações:', err);
          }
        }, 2000);
        return;
      }
      
      // Buscar total para calcular progresso
      totalCountRef.current = await fetchTotalCount();
      
      // 2. RÁPIDO: Carregar primeiros 10 documentários
      console.log(`⚡ [Documentários] Carregando primeiros ${initialChunk}...`);
      const initialData = await fetchChunk(0, initialChunk);
      
      if (initialData.length > 0) {
        setDocumentarios(initialData);
        setIsLoadingInitial(false);
        console.log(`✅ [Documentários] Primeiros ${initialData.length} carregados`);
        
        // 3. BACKGROUND: Carregar o resto automaticamente
        if (initialData.length === initialChunk && totalCountRef.current > initialChunk) {
          setIsLoadingMore(true);
          setTimeout(() => {
            loadProgressively(initialChunk);
          }, 100);
        } else {
          setIsComplete(true);
          saveToInstantCache(CACHE_KEY, initialData);
        }
      } else {
        setIsLoadingInitial(false);
        setIsComplete(true);
      }
      
    } catch (err) {
      console.error('[Documentários] Erro no carregamento inicial:', err);
      setError(err as Error);
      setIsLoadingInitial(false);
    }
  }, [enabled, initialChunk, fetchChunk, fetchTotalCount, loadProgressively]);

  // Disparar carregamento inicial
  useEffect(() => {
    if (!enabled) return;
    
    loadInitial();
    
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [enabled, loadInitial]);

  // Função para forçar refresh
  const refresh = useCallback(async () => {
    abortControllerRef.current?.abort();
    hasInitialized.current = false;
    isLoadingRef.current = false;
    setDocumentarios([]);
    setIsLoadingInitial(true);
    setIsLoadingMore(false);
    setIsComplete(false);
    setError(null);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    await loadInitial();
  }, [loadInitial]);

  // Calcular progresso
  const progress = isComplete ? 100 : 
    documentarios.length > 0 && totalCountRef.current > 0
      ? Math.min(99, Math.round((documentarios.length / totalCountRef.current) * 100))
      : 0;

  return {
    documentarios,
    isLoadingInitial,
    isLoadingMore,
    progress,
    totalLoaded: documentarios.length,
    isComplete,
    error,
    refresh
  };
};
