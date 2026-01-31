import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  List, 
  Volume2, 
  VolumeX, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConceitoSecao } from "./types";

interface ConceitosSlidesFooterProps {
  secoes: ConceitoSecao[];
  currentIndex: number;
  totalPaginas: number;
  onNavigate: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface FlatPageInfo {
  titulo: string;
  secaoTitulo: string;
  globalIndex: number;
  tipo: string;
}

export const ConceitosSlidesFooter = ({
  secoes,
  currentIndex,
  totalPaginas,
  onNavigate,
  onNext,
  onPrevious,
  canGoBack,
  canGoForward
}: ConceitosSlidesFooterProps) => {
  const [showIndex, setShowIndex] = useState(false);
  const [brownNoiseEnabled, setBrownNoiseEnabled] = useState(false);
  const brownNoiseRef = useRef<HTMLAudioElement | null>(null);

  // Flatten pages for index
  const flatPages: FlatPageInfo[] = [];
  let globalIdx = 0;
  secoes.forEach((secao) => {
    secao.slides.forEach((slide) => {
      flatPages.push({
        titulo: slide.titulo || `Página ${globalIdx + 1}`,
        secaoTitulo: secao.titulo,
        globalIndex: globalIdx,
        tipo: slide.tipo
      });
      globalIdx++;
    });
  });

  // Gerenciar áudio do ruído marrom
  useEffect(() => {
    if (!brownNoiseRef.current) {
      brownNoiseRef.current = new Audio('/audio/ruido-marrom.mp3');
      brownNoiseRef.current.loop = true;
      brownNoiseRef.current.volume = 0.5;
    }

    if (brownNoiseEnabled) {
      brownNoiseRef.current.play().catch(console.error);
    } else {
      brownNoiseRef.current.pause();
    }

    return () => {
      if (brownNoiseRef.current) {
        brownNoiseRef.current.pause();
      }
    };
  }, [brownNoiseEnabled]);

  const handlePageSelect = (index: number) => {
    onNavigate(index);
    setShowIndex(false);
  };

  // Group pages by section for index display
  const groupedBySections = secoes.map((secao, secaoIdx) => {
    const startIndex = secoes.slice(0, secaoIdx).reduce((sum, s) => sum + s.slides.length, 0);
    return {
      titulo: secao.titulo,
      slides: secao.slides.map((slide, slideIdx) => ({
        titulo: slide.titulo || `Página ${startIndex + slideIdx + 1}`,
        globalIndex: startIndex + slideIdx,
        tipo: slide.tipo
      }))
    };
  });

  return (
    <>
      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-sm border-t border-white/10 safe-area-pb">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Botão Anterior */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              disabled={!canGoBack}
              className="h-10 w-10 text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {/* Centro: Índice + Ruído */}
            <div className="flex items-center gap-2">
              {/* Botão Índice */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIndex(true)}
                className="h-9 px-3 text-gray-400 hover:text-white hover:bg-white/10"
              >
                <List className="w-4 h-4 mr-2" />
                <span className="text-sm">{currentIndex + 1}/{totalPaginas}</span>
              </Button>

              {/* Botão Ruído Marrom */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBrownNoiseEnabled(!brownNoiseEnabled)}
                className={`h-9 w-9 ${brownNoiseEnabled ? 'text-red-400 bg-red-500/10' : 'text-gray-500 hover:text-white'} hover:bg-white/10`}
              >
                {brownNoiseEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Botão Próximo */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={!canGoForward}
              className="h-10 w-10 text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Drawer de Índice */}
      <AnimatePresence>
        {showIndex && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setShowIndex(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#12121a] rounded-t-3xl max-h-[80vh] flex flex-col border-t border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Índice
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowIndex(false)}
                  className="h-8 w-8 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Lista de seções e páginas */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {groupedBySections.map((secao, secaoIdx) => (
                  <div key={secaoIdx}>
                    {/* Título da seção */}
                    <p className="text-xs text-red-400 uppercase tracking-widest font-medium mb-2">
                      {secao.titulo}
                    </p>
                    
                    {/* Páginas da seção */}
                    <div className="space-y-1">
                      {secao.slides.map((slide) => (
                        <button
                          key={slide.globalIndex}
                          onClick={() => handlePageSelect(slide.globalIndex)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                            slide.globalIndex === currentIndex
                              ? 'bg-red-500/20 text-white border border-red-500/30'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-6">
                              {slide.globalIndex + 1}
                            </span>
                            <span className="text-sm truncate flex-1">
                              {slide.titulo}
                            </span>
                            {slide.globalIndex === currentIndex && (
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ConceitosSlidesFooter;
