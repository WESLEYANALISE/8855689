import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoNavigationFooterProps {
  currentIndex: number;
  totalVideos: number;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  className?: string;
}

const VideoNavigationFooter = ({
  currentIndex,
  totalVideos,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  className,
}: VideoNavigationFooterProps) => {
  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border",
        className
      )}
    >
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasPrevious}
            onClick={onPrevious}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          
          <span className="text-sm font-medium text-muted-foreground">
            Aula {currentIndex + 1} de {totalVideos}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasNext}
            onClick={onNext}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            Próxima
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoNavigationFooter;
