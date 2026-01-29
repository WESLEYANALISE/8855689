import { useMemo } from 'react';
import { useInstantCache } from './useInstantCache';
import { supabase } from '@/integrations/supabase/client';

interface Artigo {
  id: number;
  categoria: string;
  ordem: number;
  titulo: string;
  descricao_curta: string | null;
  topicos: string[] | null;
  url_capa: string | null;
  conteudo_gerado: string | null;
  termo_wikipedia: string | null;
  fonte: string | null;
  imagem_wikipedia: string | null;
}

export const useBloggerCache = () => {
  // Usa o mesmo cacheKey do useHomePreloader para compartilhar dados pré-carregados
  const { 
    data: artigos, 
    isLoading: loading, 
    refresh,
    isFetching: isFetchingFresh
  } = useInstantCache<Artigo[]>({
    cacheKey: 'blogger-juridico-home', // Mesmo cache do preloader!
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BLOGGER_JURIDICO')
        .select('id,titulo,categoria,url_capa,imagem_wikipedia,descricao_curta,ordem,topicos,conteudo_gerado,termo_wikipedia,fonte')
        .order('ordem');
      if (error) throw error;
      return data || [];
    },
    cacheDuration: 30 * 60 * 1000, // 30 minutos
    preloadImages: true,
    imageExtractor: (artigos) => (artigos || []).flatMap(a => [a.url_capa, a.imagem_wikipedia].filter(Boolean) as string[]),
  });

  // Garantir array vazio se null
  const artigosArray = artigos || [];

  // Agrupar por categoria
  const artigosPorCategoria = useMemo(() => {
    const agrupado: Record<string, Artigo[]> = {};
    artigosArray.forEach((artigo) => {
      if (!agrupado[artigo.categoria]) {
        agrupado[artigo.categoria] = [];
      }
      agrupado[artigo.categoria].push(artigo);
    });
    return agrupado;
  }, [artigosArray]);

  const getArtigosPorCategoria = (categoria: string): Artigo[] => {
    return artigosPorCategoria[categoria] || [];
  };

  // Extrair todas as URLs de capa para preload
  const getAllCapaUrls = (): string[] => {
    const urls: string[] = [];
    Object.values(artigosPorCategoria).forEach(artigos => {
      artigos.forEach(artigo => {
        if (artigo.url_capa) {
          urls.push(artigo.url_capa);
        }
        if (artigo.imagem_wikipedia) {
          urls.push(artigo.imagem_wikipedia);
        }
      });
    });
    return urls;
  };

  return {
    artigosPorCategoria,
    loading,
    isFromCache: !isFetchingFresh,
    getArtigosPorCategoria,
    getAllCapaUrls,
    invalidateCache: refresh
  };
};
