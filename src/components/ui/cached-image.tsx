/**
 * CachedImage - Wrapper retrocompatível que usa UniversalImage internamente
 * 
 * @deprecated Prefira usar UniversalImage diretamente para novas implementações
 */

import { memo } from 'react';
import { UniversalImage } from './universal-image';
import type { BlurCategory } from '@/lib/blurPlaceholders';

interface CachedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
  /** Categoria de blur para transição suave */
  blurCategory?: BlurCategory;
}

export const CachedImage = memo(({ 
  src, 
  alt, 
  className = '', 
  fallback,
  priority = false,
  blurCategory = 'dark',
}: CachedImageProps) => {
  return (
    <UniversalImage
      src={src}
      alt={alt}
      className={className}
      priority={priority}
      blurCategory={blurCategory}
      fallback={fallback}
      containerClassName="w-full h-full"
    />
  );
});

CachedImage.displayName = 'CachedImage';
