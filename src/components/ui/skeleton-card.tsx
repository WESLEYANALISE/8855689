import { cn } from "@/lib/utils";
import { CSSProperties } from "react";
import { Skeleton } from "./skeleton";

interface SkeletonCardProps {
  className?: string;
  variant?: "default" | "horizontal" | "article" | "compact" | "carousel" | "video";
  style?: CSSProperties;
}

/**
 * Skeleton card otimizado para diferentes tipos de conteúdo
 * Usa GPU acceleration para animações suaves
 */
export const SkeletonCard = ({ className, variant = "default", style }: SkeletonCardProps) => {
  if (variant === "horizontal") {
    return (
      <div 
        className={cn(
          "flex gap-4 p-4 rounded-xl bg-card/50 will-change-transform",
          className
        )}
        style={style}
      >
        <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    );
  }

  if (variant === "article") {
    return (
      <div 
        className={cn(
          "space-y-3 p-4 rounded-xl bg-card/50 will-change-transform",
          className
        )}
        style={style}
      >
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-3/6" />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg bg-card/50 will-change-transform",
          className
        )}
        style={style}
      >
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      </div>
    );
  }

  if (variant === "carousel") {
    return (
      <div 
        className={cn(
          "flex-shrink-0 w-40 space-y-2 will-change-transform",
          className
        )}
        style={style}
      >
        <Skeleton className="w-full aspect-[4/3] rounded-xl" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    );
  }

  if (variant === "video") {
    return (
      <div 
        className={cn(
          "space-y-3 will-change-transform",
          className
        )}
        style={style}
      >
        <Skeleton className="w-full aspect-video rounded-xl" />
        <div className="flex gap-3">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // Default card skeleton
  return (
    <div 
      className={cn(
        "space-y-4 p-4 rounded-xl bg-card/50 will-change-transform",
        className
      )}
      style={style}
    >
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
};

interface SkeletonListProps {
  count?: number;
  variant?: SkeletonCardProps["variant"];
  className?: string;
}

/**
 * Lista de skeletons com animação staggered
 */
export const SkeletonList = ({ count = 5, variant = "default", className }: SkeletonListProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard 
          key={index} 
          variant={variant}
          style={{ animationDelay: `${index * 50}ms` }}
        />
      ))}
    </div>
  );
};

interface SkeletonGridProps {
  count?: number;
  variant?: SkeletonCardProps["variant"];
  className?: string;
  columns?: 2 | 3 | 4;
}

/**
 * Grid de skeletons responsivo
 */
export const SkeletonGrid = ({ 
  count = 6, 
  variant = "default", 
  className,
  columns = 3 
}: SkeletonGridProps) => {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  };

  return (
    <div className={cn(`grid gap-4 ${gridCols[columns]}`, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard 
          key={index} 
          variant={variant}
          style={{ animationDelay: `${index * 50}ms` }}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton para carrossel horizontal
 */
export const SkeletonCarousel = ({ count = 5, className }: { count?: number; className?: string }) => {
  return (
    <div className={cn("flex gap-4 overflow-hidden", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard 
          key={index} 
          variant="carousel"
          style={{ animationDelay: `${index * 50}ms` }}
        />
      ))}
    </div>
  );
};

export default SkeletonCard;
