import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

// ============================================
// SKELETON VARIANTS FOR IMAGES
// ============================================

export type ImageSkeletonVariant = 'pulse' | 'shimmer' | 'wave';

interface ImageSkeletonProps {
  /** Aspect ratio (ex: "16/9", "4/3", "1/1", "3/4") */
  aspectRatio?: string;
  /** Classes adicionais */
  className?: string;
  /** Variante de animação */
  variant?: ImageSkeletonVariant;
  /** Cor de fundo customizada (hex) */
  backgroundColor?: string;
}

/**
 * Skeleton otimizado para imagens com diferentes variantes de animação
 */
function ImageSkeleton({ 
  aspectRatio = "16/9", 
  className,
  variant = 'shimmer',
  backgroundColor,
}: ImageSkeletonProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg",
        variant === 'shimmer' && 'skeleton-shimmer',
        variant === 'wave' && 'skeleton-wave',
        variant === 'pulse' && 'animate-pulse bg-muted',
        className
      )}
      style={{ 
        aspectRatio,
        backgroundColor: backgroundColor || undefined,
      }}
    />
  );
}

/**
 * Skeleton para cards de conteúdo (imagem + texto)
 */
interface CardSkeletonProps {
  /** Classes adicionais */
  className?: string;
  /** Variante de animação */
  variant?: ImageSkeletonVariant;
  /** Mostra linhas de texto */
  showText?: boolean;
  /** Aspect ratio da imagem */
  imageAspectRatio?: string;
}

function CardSkeleton({
  className,
  variant = 'shimmer',
  showText = true,
  imageAspectRatio = '16/9',
}: CardSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-xl overflow-hidden", className)}>
      <ImageSkeleton 
        aspectRatio={imageAspectRatio} 
        variant={variant}
        className="rounded-t-xl"
      />
      {showText && (
        <div className="p-2 space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      )}
    </div>
  );
}

export { Skeleton, ImageSkeleton, CardSkeleton };
