import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { preCacheImages, getFromMemoryCache, isInMemoryCache, getImageFromCache, isImageBlobCached } from "@/hooks/useImageBlobCache";
import { saveToUnifiedCache } from "@/hooks/useUnifiedCache";

export interface FeaturedNews {
  id: string;
  titulo: string;
  descricao: string;
  link: string;
  imagem?: string;
  imagem_webp?: string;
  imagemCached?: string;
  data: string;
  analise?: string;
  fonte?: string;
  categoria_tipo?: string;
}

const CACHE_KEY = 'featured_news';
const LOCAL_STORAGE_KEY = 'featured_news_instant';

// Notícias padrão para exibição instantânea (nunca mostra loading)
// Usa URLs de imagens reais do banco como fallback visual temporário
const DEFAULT_NEWS: FeaturedNews[] = [
  {
    id: 'default-1',
    titulo: 'Atualizações do mundo jurídico',
    descricao: 'Acompanhe as principais notícias do Direito brasileiro',
    link: '/noticias-juridicas',
    imagem: 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/noticias/arnaldogodoy1png-1766360395185.webp',
    data: new Date().toISOString(),
    categoria_tipo: 'Direito'
  },
  {
    id: 'default-2',
    titulo: 'Concursos públicos em destaque',
    descricao: 'Novas oportunidades na área jurídica',
    link: '/noticias-juridicas',
    imagem: 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/noticias/httpsimgmigalhascombrSLgfbaseSLempresasSLMIGASLimagensSL2025SL11SL16SLcroppedr5jw1c4mqesjpegPROCCP75CCH31622400jpeg-1767817848258.webp',
    data: new Date().toISOString(),
    categoria_tipo: 'Concurso Público'
  },
  {
    id: 'default-3',
    titulo: 'Política e legislação',
    descricao: 'Acompanhe os bastidores do poder',
    link: '/politica',
    imagem: 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/noticias/httpsimgmigalhascombrSLgfbaseSLempresasSLMIGASLimagensSL2025SL07SL28SLcroppedugywx10snqejpgPROCCP75CCH31622400jpg-1767817889765.webp',
    data: new Date().toISOString(),
    categoria_tipo: 'Política'
  },
  {
    id: 'default-4',
    titulo: 'Jurisprudência atualizada',
    descricao: 'Decisões recentes dos tribunais',
    link: '/noticias-juridicas',
    imagem: 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/noticias/arnaldogodoy1png-1766360395185.webp',
    data: new Date().toISOString(),
    categoria_tipo: 'Direito'
  },
  {
    id: 'default-5',
    titulo: 'Editais abertos',
    descricao: 'Oportunidades para carreiras jurídicas',
    link: '/noticias-juridicas',
    imagem: 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/noticias/httpsimgmigalhascombrSLgfbaseSLempresasSLMIGASLimagensSL2025SL11SL16SLcroppedr5jw1c4mqesjpegPROCCP75CCH31622400jpeg-1767817848258.webp',
    data: new Date().toISOString(),
    categoria_tipo: 'Concurso Público'
  },
  {
    id: 'default-6',
    titulo: 'Análise política',
    descricao: 'Entenda o cenário político atual',
    link: '/politica',
    imagem: 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/noticias/httpsimgmigalhascombrSLgfbaseSLempresasSLMIGASLimagensSL2025SL07SL28SLcroppedugywx10snqejpgPROCCP75CCH31622400jpg-1767817889765.webp',
    data: new Date().toISOString(),
    categoria_tipo: 'Política'
  }
];

// Carrega do localStorage SINCRONAMENTE para exibição instantânea
function getInstantCache(): FeaturedNews[] {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
        // Cache válido por 2 horas para exibição instantânea, dados frescos sempre buscados em background
        const age = Date.now() - (parsed.timestamp || 0);
        if (age < 1000 * 60 * 120) {
          return parsed.data;
        }
      }
    }
  } catch {
    // Silently fail
  }
  return [];
}

// Salva no localStorage para próximo acesso instantâneo
function saveInstantCache(news: FeaturedNews[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      data: news,
      timestamp: Date.now()
    }));
  } catch {
    // Silently fail (quota exceeded etc)
  }
}

// NOVA FUNÇÃO: Garante que imagens do cache estejam em memória ANTES de exibir
async function ensureImagesInMemory(news: FeaturedNews[]): Promise<FeaturedNews[]> {
  const imageUrls = news.map(n => n.imagem).filter((url): url is string => !!url);
  
  // Carrega imagens do IndexedDB para memória se não estiverem
  const loadPromises = imageUrls.map(async (url) => {
    if (!isInMemoryCache(url)) {
      // Tenta carregar do IndexedDB
      const cached = await isImageBlobCached(url);
      if (cached) {
        await getImageFromCache(url);
      }
    }
  });
  
  await Promise.all(loadPromises);
  
  // Retorna news com URLs cacheadas aplicadas
  return news.map(n => ({
    ...n,
    imagemCached: n.imagem && isInMemoryCache(n.imagem) ? getFromMemoryCache(n.imagem) : undefined
  }));
}

// Preload IMEDIATO das 3 primeiras imagens ao carregar o módulo
function preloadFirstImages() {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.data && Array.isArray(parsed.data)) {
        // Preload das 3 primeiras imagens com alta prioridade
        parsed.data.slice(0, 3).forEach((n: FeaturedNews) => {
          const url = n.imagem;
          if (url) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            link.setAttribute('fetchpriority', 'high');
            document.head.appendChild(link);
          }
        });
      }
    }
  } catch {
    // Silently fail
  }
}

// Executar preload IMEDIATAMENTE ao carregar o módulo
preloadFirstImages();

async function fetchWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

export const useFeaturedNews = () => {
  // INICIALIZA COM CACHE LOCAL OU NOTÍCIAS PADRÃO (NUNCA loading!)
  const instantCache = getInstantCache();
  const initialNews = instantCache.length > 0 ? instantCache : DEFAULT_NEWS;
  const [featuredNews, setFeaturedNews] = useState<FeaturedNews[]>(initialNews);
  // SEMPRE false - nunca mostra loading, sempre tem algo para exibir
  const [loading, setLoading] = useState(false);
  const [isFetchingFresh, setIsFetchingFresh] = useState(false);
  const [imagesReady, setImagesReady] = useState(instantCache.length > 0);
  const hasInitialized = useRef(false);
  const hasFetchedFresh = useRef(false);

  // FUNÇÕES PRIMEIRO (para serem usadas nos effects)
  const fetchNews = useCallback(async (): Promise<FeaturedNews[]> => {
    return fetchWithRetry(async () => {
      // Buscar em paralelo: Direito, Concurso e Política
      // IMPORTANTE: Apenas notícias COM imagem_webp são exibidas no carrossel
      const [respostaDireito, respostaConcurso, respostaPolitica] = await Promise.all([
        // Buscar notícia mais recente de Direito - APENAS COM imagem_webp
        supabase
          .from('noticias_juridicas_cache')
          .select('id, titulo, descricao, link, imagem, imagem_webp, data_publicacao, analise_ia, fonte, categoria')
          .eq('categoria', 'Direito')
          .not('imagem_webp', 'is', null)
          .order('data_publicacao', { ascending: false })
          .limit(8),
        
        // Buscar notícia mais recente de Concurso - APENAS COM imagem_webp
        supabase
          .from('noticias_concursos_cache')
          .select('id, titulo, descricao, link, imagem, imagem_webp, data_publicacao, analise_ia, fonte')
          .not('imagem_webp', 'is', null)
          .order('data_publicacao', { ascending: false })
          .limit(8),
        
        // Buscar notícia mais recente de Política - APENAS COM imagem_url_webp
        supabase
          .from('noticias_politicas_cache')
          .select('id, titulo, descricao, url, imagem_url, imagem_url_webp, data_publicacao, resumo_executivo, fonte')
          .eq('processado', true)
          .not('imagem_url_webp', 'is', null)
          .order('data_publicacao', { ascending: false })
          .limit(8)
      ]);

      if (respostaDireito.error) throw respostaDireito.error;
      if (respostaConcurso.error) throw respostaConcurso.error;
      if (respostaPolitica.error) throw respostaPolitica.error;

      // Filtra notícias que TÊM imagem_webp válida (obrigatório para exibição)
      // IMPORTANTE: Rejeita URLs do YouTube e aceita apenas imagens reais
      const filtrarComWebp = (noticias: any[], campoWebp = 'imagem_webp') => 
        (noticias || []).filter((n: any) => {
          const img = n[campoWebp];
          // Verifica se é uma URL válida
          if (!img || typeof img !== 'string' || !img.startsWith('http')) return false;
          
          // Rejeita URLs do YouTube (embeds de vídeo, não são imagens)
          if (img.includes('youtube.com') || img.includes('youtu.be')) return false;
          
          // Aceita apenas URLs que parecem ser imagens reais
          const lowerImg = img.toLowerCase();
          const isImageUrl = lowerImg.includes('.webp') || 
                             lowerImg.includes('.jpg') || 
                             lowerImg.includes('.jpeg') || 
                             lowerImg.includes('.png') ||
                             lowerImg.includes('.gif') ||
                             lowerImg.includes('supabase.co/storage'); // URLs do nosso storage
          
          return isImageUrl;
        });

      const direitoFiltradas = filtrarComWebp(respostaDireito.data, 'imagem_webp').map((n: any) => ({ 
        ...n, 
        categoria: 'Direito',
        _imagem: n.imagem_webp, // Usa apenas WebP
        _link: n.link
      }));
      const concursoFiltradas = filtrarComWebp(respostaConcurso.data, 'imagem_webp').map((n: any) => ({ 
        ...n, 
        categoria: 'Concurso',
        _imagem: n.imagem_webp, // Usa apenas WebP
        _link: n.link
      }));
      const politicaFiltradas = filtrarComWebp(respostaPolitica.data, 'imagem_url_webp').map((n: any) => ({ 
        ...n, 
        categoria: 'Política',
        _imagem: n.imagem_url_webp, // Usa apenas WebP
        _link: n.url
      }));

      // ORDENAÇÃO ALTERNADA: Direito, Concurso, Política, Direito, Concurso, Política...
      const resultado: any[] = [];
      let direitoIdx = 0;
      let concursoIdx = 0;
      let politicaIdx = 0;
      
      // Alterna entre as três categorias até ter 6 notícias
      while (resultado.length < 6) {
        // Direito
        if (direitoIdx < direitoFiltradas.length && resultado.length < 6) {
          resultado.push(direitoFiltradas[direitoIdx++]);
        }
        // Concurso
        if (concursoIdx < concursoFiltradas.length && resultado.length < 6) {
          resultado.push(concursoFiltradas[concursoIdx++]);
        }
        // Política
        if (politicaIdx < politicaFiltradas.length && resultado.length < 6) {
          resultado.push(politicaFiltradas[politicaIdx++]);
        }
        
        // Se não tem mais nenhuma notícia para adicionar, sair do loop
        if (direitoIdx >= direitoFiltradas.length && 
            concursoIdx >= concursoFiltradas.length && 
            politicaIdx >= politicaFiltradas.length) {
          break;
        }
      }

      return resultado.map((noticia: any) => ({
        // Adiciona prefixo correto para identificação da tabela correta
        id: noticia.categoria === 'Concurso' ? `concurso-${noticia.id}` : noticia.id,
        titulo: noticia.titulo,
        descricao: noticia.descricao || noticia.fonte || '',
        link: noticia._link,
        imagem: noticia._imagem,
        imagem_webp: noticia._imagem,
        data: noticia.data_publicacao,
        analise: noticia.analise_ia || noticia.resumo_executivo,
        fonte: noticia.fonte || 'Portal Jurídico',
        categoria_tipo: noticia.categoria || 'Geral'
      }));
    });
  }, []);

  // Pré-carrega imagens e espera TODAS carregarem antes de retornar true
  const waitForImagesToLoad = useCallback(async (imageUrls: string[]): Promise<boolean> => {
    const loadPromises = imageUrls.map(url => 
      new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(true); // Continua mesmo com erro
        img.src = url;
        // Timeout de 3 segundos por imagem
        setTimeout(() => resolve(true), 3000);
      })
    );
    
    await Promise.all(loadPromises);
    return true;
  }, []);

  const loadFreshData = useCallback(async () => {
    setIsFetchingFresh(true);
    
    try {
      const news = await fetchNews();
      
      if (news.length > 0) {
        console.log('[FeaturedNews] ✅ Carregou', news.length, 'notícias do banco');
        
        // Pré-cacheia imagens ANTES de exibir
        const imageUrls = news.map(n => n.imagem).filter((url): url is string => !!url);
        
        if (imageUrls.length > 0) {
          // 1. Pré-cacheia no IndexedDB/memória
          await preCacheImages(imageUrls);
          
          // 2. ESPERA todas as imagens carregarem no DOM antes de trocar
          console.log('[FeaturedNews] Aguardando imagens carregarem...');
          await waitForImagesToLoad(imageUrls);
          console.log('[FeaturedNews] ✅ Todas as imagens prontas, atualizando...');
        }
        
        // Aplica URLs em memória - SÓ TROCA APÓS IMAGENS PRONTAS
        const newsWithCachedUrls = news.map(n => ({
          ...n,
          imagemCached: n.imagem ? getFromMemoryCache(n.imagem) : undefined
        }));
        
        setFeaturedNews(newsWithCachedUrls);
        setLoading(false);
        setImagesReady(true);
        hasInitialized.current = true;
        
        // Salva no cache instantâneo (localStorage) para próximo acesso
        saveInstantCache(news);
        
        // Salva também no cache unificado (IndexedDB)
        await saveToUnifiedCache(CACHE_KEY, news);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar notícias:', error);
      if (featuredNews.length === 0) {
        setLoading(false);
      }
    } finally {
      setIsFetchingFresh(false);
    }
  }, [fetchNews, featuredNews.length, waitForImagesToLoad]);

  // Handler para adicionar nova notícia suavemente
  const handleNewNoticia = useCallback((data: any, categoria: string, imagemUrl: string) => {
    const novaNoticia: FeaturedNews = {
      id: data.id,
      titulo: data.titulo,
      descricao: data.descricao || data.fonte || '',
      link: data.link || data.url || '/noticias-juridicas',
      imagem: imagemUrl,
      imagem_webp: imagemUrl,
      data: data.data_publicacao || new Date().toISOString(),
      fonte: data.fonte,
      categoria_tipo: categoria
    };

    // Pré-cachear a imagem antes de exibir
    preCacheImages([imagemUrl]).then(() => {
      setFeaturedNews(prev => {
        // Remove a notícia mais antiga da mesma categoria e adiciona a nova no início
        const novaLista = [...prev];
        const idxMesmaCategoria = novaLista.findIndex(n => n.categoria_tipo === categoria);
        
        if (idxMesmaCategoria !== -1) {
          // Substitui a primeira da mesma categoria
          novaLista[idxMesmaCategoria] = {
            ...novaNoticia,
            imagemCached: getFromMemoryCache(imagemUrl)
          };
        }
        
        // Salva no cache para próximo acesso
        saveInstantCache(novaLista);
        return novaLista;
      });
    });
  }, []);

  // EFFECTS DEPOIS (usam as funções acima)
  
  // INICIALIZAÇÃO: Carrega imagens do IndexedDB para memória IMEDIATAMENTE
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeWithCachedImages = async () => {
      if (instantCache.length > 0) {
        // Garante que imagens estão em memória ANTES de marcar como ready
        const newsWithCachedImages = await ensureImagesInMemory(instantCache);
        setFeaturedNews(newsWithCachedImages);
        setImagesReady(true);
      }
    };

    initializeWithCachedImages();
  }, []);
  
  // SEMPRE busca dados frescos do banco após inicialização (independente do cache)
  useEffect(() => {
    if (hasFetchedFresh.current) return;
    hasFetchedFresh.current = true;
    
    // Pequeno delay para não bloquear renderização inicial
    const timer = setTimeout(() => {
      console.log('[FeaturedNews] Iniciando busca de notícias frescas...');
      loadFreshData();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [loadFreshData]);
  
  // POLLING: Atualiza notícias da planilha a cada 1 minuto para tempo real
  useEffect(() => {
    const REFRESH_INTERVAL = 60 * 1000; // 1 minuto para atualizações quase em tempo real
    
    const atualizarDaPlanilha = async () => {
      try {
        console.log('[FeaturedNews] Verificando novas notícias na planilha...');
        const { data, error } = await supabase.functions.invoke('atualizar-noticias-juridicas');
        
        if (error) {
          console.error('[FeaturedNews] Erro ao atualizar da planilha:', error);
          return;
        }
        
        const qtd = data?.noticiasAdicionadas || 0;
        if (qtd > 0) {
          console.log(`[FeaturedNews] ✅ ${qtd} novas notícias adicionadas!`);
          // O Realtime já vai capturar as inserções, mas recarrega para garantir
          await loadFreshData();
        } else {
          console.log('[FeaturedNews] Nenhuma notícia nova encontrada');
        }
      } catch (err) {
        console.error('[FeaturedNews] Erro no polling:', err);
      }
    };
    
    // Primeira atualização após 3 segundos (mais rápido)
    const initialTimer = setTimeout(atualizarDaPlanilha, 3000);
    
    // Atualização periódica
    const interval = setInterval(atualizarDaPlanilha, REFRESH_INTERVAL);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [loadFreshData]);

  // Pré-cacheia imagens quando dados mudam
  useEffect(() => {
    if (featuredNews.length > 0 && !imagesReady) {
      const imageUrls = featuredNews
        .map(n => n.imagem)
        .filter((url): url is string => !!url);
      
      preCacheImages(imageUrls).then(() => {
        setFeaturedNews(prev => prev.map(n => ({
          ...n,
          imagemCached: n.imagem ? getFromMemoryCache(n.imagem) : undefined
        })));
        setImagesReady(true);
      });
    }
  }, [featuredNews.length, imagesReady]);

  // Recarrega imagens quando o app volta do segundo plano
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && featuredNews.length > 0) {
        // App voltou ao primeiro plano - verificar e recarregar imagens
        const imageUrls = featuredNews
          .map(n => n.imagem)
          .filter((url): url is string => !!url);
        
        if (imageUrls.length > 0) {
          // Recarregar imagens em background
          preCacheImages(imageUrls).then(() => {
            setFeaturedNews(prev => prev.map(n => ({
              ...n,
              imagemCached: n.imagem ? getFromMemoryCache(n.imagem) : undefined
            })));
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [featuredNews]);

  // REALTIME: Escuta novas notícias inseridas no banco
  useEffect(() => {
    const channel = supabase
      .channel('featured-news-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'noticias_juridicas_cache'
      }, (payload) => {
        const data = payload.new as any;
        if (data.imagem) {
          handleNewNoticia(data, 'Direito', data.imagem);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'noticias_concursos_cache'
      }, (payload) => {
        const data = payload.new as any;
        if (data.imagem) {
          handleNewNoticia(data, 'Concurso Público', data.imagem);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'noticias_politicas_cache'
      }, (payload) => {
        const data = payload.new as any;
        if (data.processado && (data.imagem_url_webp || data.imagem_url)) {
          handleNewNoticia(data, 'Política', data.imagem_url_webp || data.imagem_url);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleNewNoticia]);

  return { 
    featuredNews, 
    // NUNCA mostra loading - sempre tem notícias padrão ou cache
    loading: false, 
    isFetchingFresh,
    imagesReady,
    reload: loadFreshData 
  };
};
