import { useEffect, useState, useCallback } from 'react';
import { 
  isImagePreloaded as isInInstantCache, 
  markImageLoaded as markInInstantCache 
} from './useInstantCache';

// Cache global de imagens já carregadas (persiste entre navegações)
const imageCache = new Map<string, boolean>();

// Verificar se imagem está no cache do browser usando Performance API
const checkBrowserCache = (src: string): boolean => {
  if (!src) return false;
  
  // Verifica primeiro no cache do useInstantCache
  if (isInInstantCache(src)) {
    imageCache.set(src, true);
    return true;
  }
  
  // Usa Performance API
  if (typeof performance !== 'undefined' && performance.getEntriesByName) {
    const entries = performance.getEntriesByName(src, 'resource');
    if (entries.length > 0) {
      markInInstantCache(src);
      imageCache.set(src, true);
      return true;
    }
  }
  
  // Fallback
  const img = new Image();
  img.src = src;
  if (img.complete && img.naturalWidth > 0) {
    markInInstantCache(src);
    imageCache.set(src, true);
    return true;
  }
  
  return false;
};

/**
 * Hook para pré-carregar uma lista de imagens
 * Retorna quais imagens já estão carregadas
 */
export function useImagePreload(urls: string[]) {
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(() => {
    // Inicializar com imagens já em cache
    const cached = new Set<string>();
    urls.forEach(url => {
      if (url && (imageCache.has(url) || checkBrowserCache(url))) {
        cached.add(url);
        imageCache.set(url, true);
      }
    });
    return cached;
  });

  useEffect(() => {
    const urlsToLoad = urls.filter(url => url && !imageCache.has(url));
    
    if (urlsToLoad.length === 0) return;

    urlsToLoad.forEach(url => {
      const img = new Image();
      img.onload = () => {
        imageCache.set(url, true);
        setLoadedUrls(prev => new Set([...prev, url]));
      };
      img.onerror = () => {
        imageCache.set(url, false);
      };
      img.src = url;
    });
  }, [urls.join(',')]);

  const isLoaded = useCallback((url: string) => {
    return loadedUrls.has(url) || imageCache.has(url);
  }, [loadedUrls]);

  return { loadedUrls, isLoaded };
}

/**
 * Hook para verificar se uma única imagem está em cache
 */
export function useImageCached(url: string | undefined | null) {
  const [isLoaded, setIsLoaded] = useState(() => {
    if (!url) return true;
    return imageCache.has(url) || checkBrowserCache(url);
  });

  useEffect(() => {
    if (!url) {
      setIsLoaded(true);
      return;
    }

    // Já está em cache
    if (imageCache.has(url)) {
      setIsLoaded(true);
      return;
    }

    // Verificar cache do browser
    if (checkBrowserCache(url)) {
      imageCache.set(url, true);
      setIsLoaded(true);
      return;
    }

    // Carregar a imagem
    const img = new Image();
    img.onload = () => {
      imageCache.set(url, true);
      setIsLoaded(true);
    };
    img.onerror = () => {
      imageCache.set(url, false);
      setIsLoaded(true); // Marcar como "loaded" mesmo em erro para não mostrar skeleton infinito
    };
    img.src = url;
  }, [url]);

  return isLoaded;
}

/**
 * Marcar uma imagem como carregada no cache global (sincroniza ambos os caches)
 */
export function markImageLoaded(url: string) {
  if (url) {
    imageCache.set(url, true);
    markInInstantCache(url); // Sincroniza com o outro cache
  }
}

/**
 * Verificar se uma imagem está no cache
 */
export function isImageCached(url: string): boolean {
  return imageCache.has(url) || checkBrowserCache(url);
}

export default useImagePreload;
