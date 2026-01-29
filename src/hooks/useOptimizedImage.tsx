import { useState, useEffect, useRef, useCallback } from 'react';

interface UseOptimizedImageOptions {
  src: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

interface UseOptimizedImageReturn {
  imageSrc: string;
  isLoading: boolean;
  isInView: boolean;
  imageRef: React.RefObject<HTMLImageElement>;
}

/**
 * Hook para lazy loading otimizado de imagens
 * Usa Intersection Observer para carregar imagens apenas quando visíveis
 */
export const useOptimizedImage = ({
  src,
  placeholder = '',
  threshold = 0.1,
  rootMargin = '50px'
}: UseOptimizedImageOptions): UseOptimizedImageReturn => {
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(placeholder);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const element = imageRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setIsLoading(false);
    };
  }, [isInView, src]);

  return { imageSrc, isLoading, isInView, imageRef };
};

/**
 * Componente de imagem otimizada com lazy loading nativo
 */
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  placeholderSrc,
  priority = false,
  className = '',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  return (
    <img
      src={error ? placeholderSrc || '/placeholder.svg' : src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      onLoad={handleLoad}
      onError={handleError}
      className={`${className} ${!loaded && !error ? 'animate-pulse bg-muted' : ''}`}
      {...props}
    />
  );
};

export default useOptimizedImage;
