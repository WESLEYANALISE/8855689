import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getFromUnifiedCache, saveToUnifiedCache } from './useUnifiedCache';

// Mapa de dados para prefetch - COLUNAS VERIFICADAS NO SCHEMA REAL - 24/12/2024
const ROUTE_DATA_PREFETCH: Record<string, { 
  queryKey: string; 
  table: string; 
  select: string; 
  limit: number;
  order?: string;
}> = {
  '/noticias-juridicas': { 
    queryKey: 'noticias_juridicas', 
    table: 'noticias_juridicas_cache', 
    select: 'id,titulo,data_publicacao,fonte,imagem,descricao', 
    limit: 30,
    order: 'data_publicacao'
  },
  '/cursos': { 
    queryKey: 'cursos', 
    table: 'CURSOS-APP', 
    select: 'id,tema,ordem,"capa-aula","descricao-aula"', 
    limit: 30,
    order: 'ordem'
  },
  '/blogger-juridico': { 
    queryKey: 'blogger_juridico', 
    table: 'BLOGGER_JURIDICO', 
    select: 'id,titulo,categoria,url_capa,descricao_curta,ordem', 
    limit: 20,
    order: 'ordem'
  },
  '/audioaulas': { 
    queryKey: 'audioaulas', 
    table: 'AUDIO-AULA', 
    select: 'id,titulo,area,tema,sequencia,imagem_miniatura', 
    limit: 30,
    order: 'sequencia'
  },
  '/politica': { 
    queryKey: 'noticias_politicas', 
    table: 'blogger_politico', 
    select: 'id,titulo,categoria,url_capa,descricao_curta', 
    limit: 30,
    order: 'id'
  },
};

// Mapa de contexto - quais dados prefetch baseado na rota atual
const CONTEXTUAL_DATA_PREFETCH: Record<string, string[]> = {
  '/': ['/noticias-juridicas', '/cursos', '/blogger-juridico', '/politica'],
  '/bibliotecas': ['/cursos'],
  '/cursos': ['/cursos'],
  '/politica': ['/politica'],
};

/**
 * Hook para prefetch de DADOS apenas
 * Com imports diretos, não há mais necessidade de prefetch de chunks
 */
export const useRoutePrefetch = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const prefetchedDataRef = useRef<Set<string>>(new Set());
  const hasPrefetchedInitial = useRef(false);

  // Prefetch de dados da rota
  const prefetchRouteData = useCallback(async (route: string) => {
    if (prefetchedDataRef.current.has(route)) return;
    
    const dataConfig = ROUTE_DATA_PREFETCH[route];
    if (!dataConfig) return;

    prefetchedDataRef.current.add(route);

    try {
      // Primeiro verifica cache unificado
      const cached = await getFromUnifiedCache(dataConfig.queryKey);
      if (cached) {
        queryClient.setQueryData([dataConfig.queryKey], cached);
        return;
      }

      // Se não tem cache, busca do Supabase
      const query = supabase
        .from(dataConfig.table as any)
        .select(dataConfig.select)
        .limit(dataConfig.limit);

      if (dataConfig.order) {
        query.order(dataConfig.order as any, { ascending: dataConfig.order === 'ordem' || dataConfig.order === 'sequencia' });
      }

      const { data, error } = await query;

      if (!error && data) {
        await saveToUnifiedCache(dataConfig.queryKey, data);
        queryClient.setQueryData([dataConfig.queryKey], data);
      }
    } catch (e) {
      // Silent fail
    }
  }, [queryClient]);

  // Prefetch em lote com delay entre cada
  const prefetchBatch = useCallback((routes: string[], delayBetween = 100) => {
    routes.forEach((route, index) => {
      setTimeout(() => {
        prefetchRouteData(route);
      }, index * delayBetween);
    });
  }, [prefetchRouteData]);

  // Prefetch ao hover em links - agora só dados
  const handleLinkHover = useCallback((route: string) => {
    prefetchRouteData(route);
  }, [prefetchRouteData]);

  // No-op para compatibilidade - chunks não são mais lazy
  const prefetchChunk = useCallback((_route: string) => {
    // Com imports diretos, não há chunks para prefetch
  }, []);

  // Prefetch inicial de dados
  useEffect(() => {
    if (hasPrefetchedInitial.current) return;
    hasPrefetchedInitial.current = true;

    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
    
    idleCallback(() => {
      const dataRoutes = Object.keys(ROUTE_DATA_PREFETCH);
      prefetchBatch(dataRoutes, 200);
    });
  }, [prefetchBatch]);

  // Prefetch contextual baseado na rota atual
  useEffect(() => {
    const currentPath = location.pathname;
    
    const contextKey = Object.keys(CONTEXTUAL_DATA_PREFETCH).find(key => 
      currentPath === key || currentPath.startsWith(key + '/')
    );
    
    if (contextKey) {
      const contextualRoutes = CONTEXTUAL_DATA_PREFETCH[contextKey];
      setTimeout(() => {
        prefetchBatch(contextualRoutes, 50);
      }, 500);
    }
  }, [location.pathname, prefetchBatch]);

  return { handleLinkHover, prefetchChunk, prefetchBatch, prefetchRouteData };
};

/**
 * Hook para prefetch on hover em links específicos
 */
export const usePrefetchOnHover = (route: string) => {
  const { handleLinkHover } = useRoutePrefetch();
  
  return {
    onMouseEnter: () => handleLinkHover(route),
    onFocus: () => handleLinkHover(route)
  };
};

export default useRoutePrefetch;
