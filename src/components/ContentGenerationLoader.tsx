import { Loader2 } from "lucide-react";

interface ContentGenerationLoaderProps {
  message?: string;
  progress?: number;
}

export const ContentGenerationLoader = ({ 
  message = "Gerando conteúdo...",
  progress 
}: ContentGenerationLoaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="relative w-24 h-24 mb-6">
        {progress !== undefined ? (
          // Progress circle
          <>
            <svg className="w-24 h-24 -rotate-90">
              <circle 
                cx="48" 
                cy="48" 
                r="44" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
                className="text-secondary" 
              />
              <circle 
                cx="48" 
                cy="48" 
                r="44" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
                strokeDasharray={276.46} 
                strokeDashoffset={276.46 * (1 - progress / 100)} 
                className="text-accent transition-all duration-300" 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-accent">{progress}%</span>
            </div>
          </>
        ) : (
          // Spinner
          <Loader2 className="w-24 h-24 animate-spin text-accent" />
        )}
      </div>
      <p className="text-base font-semibold mb-1 text-center">{message}</p>
      <p className="text-xs text-muted-foreground text-center">Isso pode levar alguns instantes</p>
    </div>
  );
};
