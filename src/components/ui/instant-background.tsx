/**
 * InstantBackground - Componente para backgrounds com blur placeholder
 * 
 * Usa UniversalImage internamente para garantir carregamento instantâneo
 * com blur placeholder e cache agressivo
 */

import { memo } from 'react';
import { UniversalImage } from './universal-image';
import { cn } from '@/lib/utils';
import type { BlurCategory } from '@/lib/blurPlaceholders';

interface InstantBackgroundProps {
  /** URL da imagem de fundo */
  src: string;
  /** Texto alternativo para acessibilidade */
  alt?: string;
  /** Categoria de blur para transição suave */
  blurCategory?: BlurCategory;
  /** Classes CSS personalizadas para o container */
  className?: string;
  /** Classes CSS para o overlay de gradiente */
  gradientClassName?: string;
  /** Se deve mostrar gradiente overlay */
  showGradient?: boolean;
  /** Estilo customizado do gradiente (CSS) */
  gradientStyle?: React.CSSProperties;
  /** Se a imagem é fixa (background-attachment: fixed) */
  fixed?: boolean;
  /** Z-index do container */
  zIndex?: number;
  children?: React.ReactNode;
}

export const InstantBackground = memo(({
  src,
  alt = '',
  blurCategory = 'dark',
  className,
  gradientClassName,
  showGradient = true,
  gradientStyle,
  fixed = true,
  zIndex = 0,
  children,
}: InstantBackgroundProps) => {
  return (
    <>
      {/* Container da imagem de fundo */}
      <div 
        className={cn(
          'inset-0 pointer-events-none overflow-hidden',
          fixed ? 'fixed' : 'absolute',
          className
        )}
        style={{ zIndex }}
        aria-hidden="true"
      >
        <UniversalImage
          src={src}
          alt={alt}
          priority={true}
          blurCategory={blurCategory}
          disableBlur={false}
          containerClassName="w-full h-full"
          className="object-cover"
        />
      </div>
      
      {/* Gradient overlay */}
      {showGradient && (
        <div 
          className={cn(
            'inset-0 pointer-events-none',
            fixed ? 'fixed' : 'absolute',
            gradientClassName || 'bg-gradient-to-b from-black/70 via-black/60 to-black/80'
          )}
          style={{ 
            zIndex: zIndex + 1,
            ...gradientStyle 
          }}
        />
      )}
      
      {/* Children com z-index adequado */}
      {children}
    </>
  );
});

InstantBackground.displayName = 'InstantBackground';

export default InstantBackground;
