import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { dividirMarkdownEmSlides, ConceitoSlide } from "@/lib/markdown-to-slides";
import ConceitoSlideCard from "./ConceitoSlideCard";
import { cn } from "@/lib/utils";

interface ConceitosSlidesViewerProps {
  paginas: Array<{ titulo: string; markdown: string; tipo?: string }>;
  titulo: string;
  onComplete: () => void;
  onExit: () => void;
  fontSize?: number;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const ConceitosSlidesViewer = ({
  paginas,
  titulo,
  onComplete,
  onExit,
  fontSize = 16
}: ConceitosSlidesViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  
  // Converter páginas em slides
  const slides = useMemo(() => {
    return dividirMarkdownEmSlides(paginas);
  }, [paginas]);
  
  const totalSlides = slides.length;
  const currentSlide = slides[currentIndex];
  const progress = ((currentIndex + 1) / totalSlides) * 100;
  
  // Identificar seções únicas para os dots de progresso
  const secoes = useMemo(() => {
    const secoesMap = new Map<number, { inicio: number; fim: number }>();
    slides.forEach((slide, idx) => {
      if (!secoesMap.has(slide.secaoIndex)) {
        secoesMap.set(slide.secaoIndex, { inicio: idx, fim: idx });
      } else {
        const secao = secoesMap.get(slide.secaoIndex)!;
        secao.fim = idx;
      }
    });
    return Array.from(secoesMap.values());
  }, [slides]);
  
  const secaoAtual = currentSlide?.secaoIndex ?? 0;
  
  const goToNext = useCallback(() => {
    if (currentIndex < totalSlides - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentIndex, totalSlides, onComplete]);
  
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);
  
  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, onExit]);
  
  // Scroll to top on slide change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipe = swipePower(info.offset.x, info.velocity.x);
    
    if (swipe < -swipeConfidenceThreshold) {
      goToNext();
    } else if (swipe > swipeConfidenceThreshold) {
      goToPrevious();
    }
  };
  
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };
  
  const isLastSlide = currentIndex === totalSlides - 1;
  
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={onExit}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground font-medium truncate max-w-[200px]">
              {titulo}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground tabular-nums">
            {currentIndex + 1}/{totalSlides}
          </div>
        </div>
        
        {/* Barra de progresso */}
        <Progress value={progress} className="h-1" />
        
        {/* Dots de seções */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {secoes.map((secao, idx) => {
            const isActive = idx === secaoAtual;
            const isCompleted = idx < secaoAtual;
            
            return (
              <div
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  isActive 
                    ? 'w-6 bg-primary' 
                    : isCompleted 
                      ? 'w-1.5 bg-primary/50' 
                      : 'w-1.5 bg-border'
                )}
              />
            );
          })}
        </div>
      </div>
      
      {/* Conteúdo do slide */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col cursor-grab active:cursor-grabbing"
          >
            {currentSlide && (
              <ConceitoSlideCard 
                slide={currentSlide} 
                fontSize={fontSize}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Footer de navegação */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          
          <Button
            variant={isLastSlide ? "default" : "outline"}
            size="lg"
            onClick={goToNext}
            className="flex-1"
          >
            {isLastSlide ? 'Ir para Flashcards' : 'Próximo'}
            {!isLastSlide && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConceitosSlidesViewer;
