import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UsePaginatedArticlesOptions {
  tableName: string;
  pageSize?: number;
  enableCache?: boolean;
}

export const usePaginatedArticles = <T = any>({
  tableName,
  pageSize = 50,
  enableCache = true
}: UsePaginatedArticlesOptions) => {
  const [allArticles, setAllArticles] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['articles', tableName, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .order('id', { ascending: true })
        .range(from, to);

      if (error) throw error;

      const articles = (data || []) as T[];
      
      // Se retornou menos que pageSize, não há mais páginas
      if (articles.length < pageSize) {
        setHasMore(false);
      }

      // Adiciona novos artigos à lista existente
      setAllArticles(prev => {
        if (currentPage === 1) return articles;
        return [...prev, ...articles];
      });

      return articles;
    },
    staleTime: enableCache ? Infinity : 0,
    gcTime: enableCache ? 1000 * 60 * 60 * 24 : 0, // 24h no cache
  });

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, isLoading]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setAllArticles([]);
    setHasMore(true);
    refetch();
  }, [refetch]);

  return {
    articles: allArticles,
    currentBatch: data || [],
    isLoading,
    error,
    hasMore,
    loadMore,
    reset,
    currentPage
  };
};
