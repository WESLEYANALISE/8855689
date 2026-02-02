import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConceitoSlideCard } from "./ConceitoSlideCard";
import { ConceitosSlidesFooter } from "./ConceitosSlidesFooter";
import { markImageLoaded, isImageCached } from "@/hooks/useImagePreload";
import { toast } from "@/hooks/use-toast";
import type { ConceitoSecao, ConceitoSlide } from "./types";
interface ConceitosSlidesViewerProps {
  secoes: ConceitoSecao[];
  titulo: string;
  materiaName?: string;
  onClose: () => void;
  onComplete?: () => void;
  onProgressChange?: (progress: number) => void;
  initialProgress?: number;
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
  onComplete,
  onProgressChange,
  initialProgress = 0
}: ConceitosSlidesViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [questionAnswered, setQuestionAnswered] = useState(true);
  
  // Som de virar página (mesmo da OAB Trilhas)
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    const audio = new Audio('https://files.catbox.moe/g2jrb7.mp3');
    audio.volume = 0.4;
    audio.preload = 'auto';
    pageTurnAudioRef.current = audio;
    
    return () => { pageTurnAudioRef.current = null; };
  }, []);
  
  const playPageFlip = useCallback(() => {
    if (pageTurnAudioRef.current) {
      pageTurnAudioRef.current.currentTime = 0;
      pageTurnAudioRef.current.play().catch(() => {});
    }
  }, []);
  
  // Estado de tamanho de fonte com persistência
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("conceitos-slides-font-size");
    return saved ? parseInt(saved) : 16;
  });
  
  const handleFontSizeChange = useCallback((newSize: number) => {
    const clampedSize = Math.max(12, Math.min(24, newSize));
    setFontSize(clampedSize);
    localStorage.setItem("conceitos-slides-font-size", String(clampedSize));
  }, []);

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

  // Notificar mudança de progresso
  useEffect(() => {
    onProgressChange?.(Math.round(progress));
  }, [progress, onProgressChange]);

  // 🚀 PRELOAD: Pré-carregar imagens dos slides adjacentes (±3 slides)
  useEffect(() => {
    const preloadRange = 3;
    const imagesToPreload: string[] = [];

    for (let offset = -preloadRange; offset <= preloadRange; offset++) {
      const targetIndex = currentIndex + offset;
      if (targetIndex >= 0 && targetIndex < flatPaginas.length) {
        const slide = flatPaginas[targetIndex].slide;
        if (slide.imagemUrl && !isImageCached(slide.imagemUrl)) {
          imagesToPreload.push(slide.imagemUrl);
        }
      }
    }

    // Preload em paralelo
    imagesToPreload.forEach(url => {
      const img = new Image();
      img.onload = () => markImageLoaded(url);
      img.src = url;
    });
  }, [currentIndex, flatPaginas]);

  // Get current section title
  const currentSectionTitle = secoes[currentFlatPagina?.secaoIndex]?.titulo || titulo;

  const handleNext = useCallback(() => {
    // Verificar se é um slide de questão e não foi respondida
    const currentSlide = flatPaginas[currentIndex]?.slide;
    if (currentSlide?.tipo === 'quickcheck' && !questionAnswered) {
      toast({
        title: "⚠️ Responda à questão",
        description: "Você precisa responder à questão antes de continuar.",
        duration: 3000,
      });
      return;
    }
    
    if (currentIndex < totalPaginas - 1) {
      setDirection('next');
      playPageFlip();
      setCurrentIndex(prev => prev + 1);
    } else {
      // Completed all pages
      onComplete?.();
    }
  }, [currentIndex, totalPaginas, onComplete, playPageFlip, questionAnswered, flatPaginas]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('prev');
      playPageFlip();
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, playPageFlip]);

  const handleNavigate = useCallback((index: number) => {
    if (index >= 0 && index < totalPaginas) {
      setDirection(index > currentIndex ? 'next' : 'prev');
      playPageFlip();
      setCurrentIndex(index);
    }
  }, [totalPaginas, currentIndex, playPageFlip]);

  if (!currentFlatPagina) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nenhuma página disponível</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 min-h-screen bg-[#0a0a0f] flex flex-col z-[60]">
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
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Progress bar with red gradient */}
        <div className="max-w-2xl mx-auto mt-2">
          <Progress value={progress} className="h-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-orange-500" />
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 pb-20 overflow-y-auto">
        <AnimatePresence mode="popLayout" custom={direction}>
          <ConceitoSlideCard
            key={currentIndex}
            slide={currentFlatPagina.slide}
            paginaIndex={currentIndex}
            totalPaginas={totalPaginas}
            onNext={handleNext}
            onPrevious={handlePrevious}
            canGoBack={currentIndex > 0}
            fontSize={fontSize}
            direction={direction}
            onQuestionAnswered={setQuestionAnswered}
          />
        </AnimatePresence>
      </div>

      {/* Footer com navegação, índice e ruído marrom */}
      <ConceitosSlidesFooter
        secoes={secoes}
        currentIndex={currentIndex}
        totalPaginas={totalPaginas}
        onNavigate={handleNavigate}
        onNext={handleNext}
        onPrevious={handlePrevious}
        canGoBack={currentIndex > 0}
        canGoForward={currentIndex < totalPaginas - 1}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
      />
    </div>
  );
};

export default ConceitosSlidesViewer;
