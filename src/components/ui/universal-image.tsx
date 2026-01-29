import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';
import { isImagePreloaded, markImageLoaded } from '@/hooks/useInstantCache';
import { 
  getBlurPlaceholder, 
  CATEGORY_FALLBACK_COLORS,
  type BlurCategory 
} from '@/lib/blurPlaceholders';

export interface UniversalImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  /** URL da imagem */
  src: string | null | undefined;
  /** Texto alternativo (obrigatório para acessibilidade) */
  alt: string;
  
  // === Prioridade de carregamento ===
  /** 
   * Aplica loading="eager", fetchPriority="high", decoding="sync"
   * Use para imagens above-the-fold críticas
   */
  priority?: boolean;
  
  // === Blur placeholder ===
  /** Categoria para selecionar blur placeholder apropriado */
  blurCategory?: BlurCategory;
  /** Cor hex para gerar blur dinâmico */
  blurColor?: string;
  /** Base64 blur customizado (sobrescreve categoria) */
  blurDataURL?: string;
  /** Desabilita blur placeholder */
  disableBlur?: boolean;
  
  // === Skeleton fallback ===
  /** Mostra skeleton animado se não houver blur (default: true) */
  showSkeleton?: boolean;
  /** Variante do skeleton: 'shimmer' | 'pulse' | 'wave' */
  skeletonVariant?: 'shimmer' | 'pulse' | 'wave';
  
  // === Container ===
  /** Classes do container wrapper */
  containerClassName?: string;
  /** Aspect ratio (ex: "16/9", "4/3", "1/1", "3/4") */
  aspectRatio?: string;
  
  // === Callbacks ===
  onLoadComplete?: () => void;
  onImageError?: () => void;
  
  // === Fallback ===
  /** Componente renderizado se erro ou sem src */
  fallback?: React.ReactNode;
}

type ImageStatus = 'loading' | 'loaded' | 'error';

export const UniversalImage = memo(({
  src,
  alt,
  priority = false,
  blurCategory,
  blurColor,
  blurDataURL,
  disableBlur = false,
  showSkeleton = true,
  skeletonVariant = 'shimmer',
  containerClassName,
  aspectRatio,
  className,
  onLoadComplete,
  onImageError,
  fallback,
  style,
  ...imgProps
}: UniversalImageProps) => {
  // Verifica se já está no cache de preload
  const wasPreloaded = src ? isImagePreloaded(src) : false;
  
  // Estado de carregamento
  const [status, setStatus] = useState<ImageStatus>(
    wasPreloaded ? 'loaded' : 'loading'
  );
  
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Obtém blur placeholder
  const blurPlaceholder = disableBlur ? null : getBlurPlaceholder({
    src,
    category: blurCategory,
    fallbackColor: blurColor,
    customBlur: blurDataURL,
  });
  
  // Cor de fallback para background
  const fallbackBgColor = blurCategory ? CATEGORY_FALLBACK_COLORS[blurCategory] : '#1e1e1e';
  
  // Reset estado quando src muda
  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }
    
    // Verifica novamente se está preloaded
    if (isImagePreloaded(src)) {
      setStatus('loaded');
      return;
    }
    
    // Verifica se imagem já está no cache do navegador
    const img = new Image();
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      setStatus('loaded');
    } else {
      setStatus('loading');
    }
  }, [src]);
  
  // Handlers
  const handleLoad = () => {
    setStatus('loaded');
    // CRÍTICO: Marca no cache global para navegações futuras
    if (src) {
      markImageLoaded(src);
    }
    onLoadComplete?.();
  };
  
  const handleError = () => {
    setStatus('error');
    onImageError?.();
  };
  
  // Sem src ou erro: mostra fallback
  if (!src || status === 'error') {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          containerClassName
        )}
        style={{ aspectRatio, ...style }}
      >
        <span className="text-2xl">📷</span>
      </div>
    );
  }
  
  // Atributos de prioridade
  const priorityProps = priority ? {
    loading: 'eager' as const,
    fetchPriority: 'high' as const,
    decoding: 'sync' as const,
  } : {
    loading: 'lazy' as const,
    decoding: 'async' as const,
  };
  
  const isLoading = status === 'loading';
  const hasBlur = !!blurPlaceholder && !disableBlur;
  
  return (
    <div 
      className={cn(
        'relative overflow-hidden',
        containerClassName
      )}
      style={{ 
        aspectRatio,
        backgroundColor: fallbackBgColor,
        ...style,
      }}
    >
      {/* Skeleton animado (quando não há blur) */}
      {isLoading && showSkeleton && !hasBlur && (
        <div 
          className={cn(
            'absolute inset-0 bg-muted',
            skeletonVariant === 'shimmer' && 'skeleton-shimmer',
            skeletonVariant === 'wave' && 'skeleton-wave',
            skeletonVariant === 'pulse' && 'animate-pulse'
          )}
        />
      )}
      
      {/* Blur placeholder */}
      {hasBlur && (
        <img
          src={blurPlaceholder}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 w-full h-full object-cover',
            'blur-placeholder',
            status === 'loaded' && 'blur-placeholder-hidden'
          )}
        />
      )}
      
      {/* Imagem real */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        {...priorityProps}
        {...imgProps}
        className={cn(
          'w-full h-full object-cover',
          'universal-image',
          status === 'loaded' && 'universal-image-loaded',
          className
        )}
      />
    </div>
  );
});

UniversalImage.displayName = 'UniversalImage';

// Exporta também como default para conveniência
export default UniversalImage;
