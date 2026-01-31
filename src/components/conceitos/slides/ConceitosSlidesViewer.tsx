import { useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConceitoSlideCard } from "./ConceitoSlideCard";
import type { ConceitoSecao, ConceitoSlide } from "./types";

interface ConceitosSlidesViewerProps {
  secoes: ConceitoSecao[];
  titulo: string;
  materiaName?: string;
  onClose: () => void;
  onComplete?: () => void;
}

interface FlatPagina {
  slide: ConceitoSlide;
  secaoIndex: number;
  paginaIndex: number;
  globalIndex: number;
}

export const ConceitosSlidesViewer = ({
  secoes,
  titulo,
  materiaName,
  onClose,
  onComplete
}: ConceitosSlidesViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Flatten all pages for easier navigation
  const flatPaginas: FlatPagina[] = useMemo(() => {
    const paginas: FlatPagina[] = [];
    let globalIndex = 0;
    
    secoes.forEach((secao, secaoIndex) => {
      secao.slides.forEach((slide, paginaIndex) => {
        paginas.push({
          slide,
          secaoIndex,
          paginaIndex,
          globalIndex
        });
        globalIndex++;
      });
    });
    
    return paginas;
  }, [secoes]);

  const totalPaginas = flatPaginas.length;
  const currentFlatPagina = flatPaginas[currentIndex];
  const progress = totalPaginas > 0 ? ((currentIndex + 1) / totalPaginas) * 100 : 0;

  // Get current section title
  const currentSectionTitle = secoes[currentFlatPagina?.secaoIndex]?.titulo || titulo;

  const handleNext = useCallback(() => {
    if (currentIndex < totalPaginas - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Completed all pages
      onComplete?.();
    }
  }, [currentIndex, totalPaginas, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  if (!currentFlatPagina) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nenhuma página disponível</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header - aligned with reader design */}
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-400 uppercase tracking-widest truncate">
              {materiaName}
            </p>
            <h1 
              className="text-sm font-semibold text-white truncate"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {currentSectionTitle}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {currentIndex + 1}/{totalPaginas}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress bar with red gradient */}
        <div className="max-w-2xl mx-auto mt-2">
          <Progress value={progress} className="h-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-orange-500" />
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <ConceitoSlideCard
            key={currentIndex}
            slide={currentFlatPagina.slide}
            paginaIndex={currentIndex}
            totalPaginas={totalPaginas}
            onNext={handleNext}
            onPrevious={handlePrevious}
            canGoBack={currentIndex > 0}
          />
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConceitosSlidesViewer;
