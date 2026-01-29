import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useInstantCache, preloadImages } from '@/hooks/useInstantCache';

interface Termo {
  termo: string;
  significado: string;
}

export interface NoticiaPolitica {
  id: number;
  titulo: string;
  descricao: string | null;
  url: string;
  fonte: string;
  espectro: string | null;
  imagem_url: string | null;
  imagem_url_webp: string | null;
  data_publicacao: string | null;
  created_at: string | null;
  // Campos pré-processados
  conteudo_formatado: string | null;
  resumo_executivo: string | null;
  resumo_facil: string | null;
  pontos_principais: string[] | null;
  termos: Termo[] | null;
  processado: boolean | null;
}

// Helper para converter dados do Supabase
const parseNoticia = (data: any): NoticiaPolitica => ({
  ...data,
  imagem_url_webp: data.imagem_url_webp || null,
  termos: Array.isArray(data.termos) ? data.termos : []
});

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutos para refresh automático

export function useNoticiasPoliticas(limit: number = 30) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Usar o sistema de cache instantâneo unificado
  const { data: rawData, isLoading, isFetching, refresh } = useInstantCache<any[]>({
    cacheKey: 'noticias-politicas-instant',
    queryFn: async () => {
      // Buscar APENAS notícias já processadas E com imagem WebP
      const { data, error } = await supabase
        .from('noticias_politicas_cache')
        .select('*')
        .eq('processado', true)
        .not('imagem_url_webp', 'is', null)
        .order('data_publicacao', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    cacheDuration: 30 * 60 * 1000, // 30 minutos
    preloadImages: true,
    imageExtractor: (noticias) => 
      (noticias || [])
        .map((n: any) => n.imagem_url_webp || n.imagem_url)
        .filter(Boolean),
  });

  // Converter para o formato esperado
  const noticias: NoticiaPolitica[] = (rawData || []).slice(0, limit).map(parseNoticia);

  // Refresh automático em background
  const refreshInBackground = useCallback(async () => {
    console.log('Background refresh de notícias políticas...');
    try {
      await supabase.functions.invoke('buscar-noticias-politicas');
      refresh();
    } catch (e) {
      console.error('Background refresh error:', e);
    }
  }, [refresh]);

  useEffect(() => {
    // Setup intervalo para atualização automática
    intervalRef.current = setInterval(refreshInBackground, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInBackground]);

  return { noticias, isLoading, refresh };
}
