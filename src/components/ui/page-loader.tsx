import { cn } from "@/lib/utils";

interface PageLoaderProps {
  className?: string;
}

export const PageLoader = ({ className }: PageLoaderProps) => {
  return (
    <div className={cn(
      "min-h-[60vh] flex flex-col items-center justify-center gap-4",
      className
    )}>
      <div className="relative">
        {/* Outer ring */}
        <div className="w-12 h-12 rounded-full border-2 border-muted animate-pulse" />
        
        {/* Inner spinning arc */}
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
      
      <p className="text-sm text-muted-foreground animate-pulse">
        Carregando...
      </p>
    </div>
  );
};

export default PageLoader;
