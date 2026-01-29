import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  index: number;
  corArea: string;
}

export const TemaCardSkeleton = ({ index, corArea }: Props) => {
  return (
    <div 
      className="relative pl-8 animate-fade-in-up" 
      style={{
        animationDelay: `${index * 0.12}s`,
        animationFillMode: 'backwards'
      }}
    >
      {/* Marcador colorido */}
      <div 
        className={`absolute left-0 top-4 w-7 h-7 rounded-full ${corArea} border-4 border-background flex items-center justify-center shadow-xl`}
      >
        <span className="text-xs font-bold text-white">{index + 1}</span>
      </div>
      
      {/* Card skeleton */}
      <div className="w-full border-2 border-border/50 rounded-lg overflow-hidden">
        {/* Skeleton da imagem */}
        <Skeleton className="h-40 w-full" />
        
        {/* Skeleton do conteúdo */}
        <div className="p-5 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3 ml-auto" />
        </div>
      </div>
    </div>
  );
};
