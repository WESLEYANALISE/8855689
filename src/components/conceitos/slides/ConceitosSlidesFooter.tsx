import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  List, 
  Volume2, 
  VolumeX, 
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
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
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
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
  canGoForward,
  fontSize = 16,
  onFontSizeChange
}: ConceitosSlidesFooterProps) => {
  const [showIndex, setShowIndex] = useState(false);
  const [showFontControls, setShowFontControls] = useState(false);
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

  // Toggle ruído marrom com feedback visual
  const handleToggleBrownNoise = () => {
    const newState = !brownNoiseEnabled;
    setBrownNoiseEnabled(newState);
    
    toast({
      title: newState ? "🎧 Ruído marrom ativado" : "🔇 Ruído marrom desativado",
      description: newState 
        ? "Som ambiente para concentração" 
        : "Som ambiente pausado",
      duration: 2000,
    });
  };

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
      {/* Botão flutuante de controle de fonte - canto inferior direito */}
      {onFontSizeChange && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
          {/* Controles expandidos com tamanho da fonte */}
          <AnimatePresence>
            {showFontControls && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="flex flex-col items-center gap-1"
              >
                <button
                  onClick={() => onFontSizeChange(fontSize + 2)}
                  disabled={fontSize >= 24}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                    fontSize >= 24
                      ? 'bg-white/5 text-gray-600 border-white/10'
                      : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30'
                  }`}
                  title="Aumentar fonte"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-[#1a1a2e] border border-white/20 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{fontSize}</span>
                </div>
                
                <button
                  onClick={() => onFontSizeChange(fontSize - 2)}
                  disabled={fontSize <= 12}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                    fontSize <= 12
                      ? 'bg-white/5 text-gray-600 border-white/10'
                      : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30'
                  }`}
                  title="Diminuir fonte"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botão principal para abrir/fechar controles */}
          <button
            onClick={() => setShowFontControls(!showFontControls)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border shadow-lg ${
              showFontControls
                ? 'bg-orange-500 text-white border-orange-500 shadow-orange-500/30'
                : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30'
            }`}
            title="Tamanho da fonte"
          >
            <span className="text-sm font-bold">A</span>
          </button>
        </div>
      )}

      {/* Footer fixo - Estilo modo leitura com botões laranja */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-sm border-t border-white/10 safe-area-pb">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            {/* Botão Anterior - Laranja */}
            <button
              onClick={onPrevious}
              disabled={!canGoBack}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                canGoBack 
                  ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30' 
                  : 'bg-white/5 text-gray-600 border border-white/10'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Botão Índice - Laranja */}
            <button
              onClick={() => setShowIndex(true)}
              className="w-11 h-11 rounded-full bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 flex items-center justify-center transition-all"
            >
              <List className="w-5 h-5" />
            </button>

            {/* Botão Ruído Marrom */}
            <button
              onClick={handleToggleBrownNoise}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border ${
                brownNoiseEnabled 
                  ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                  : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'
              }`}
              title={brownNoiseEnabled ? "Desativar ruído marrom" : "Ativar ruído marrom"}
            >
              {brownNoiseEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            {/* Contador de páginas */}
            <div className="flex items-center gap-1 px-3 text-gray-400">
              <span className="text-sm font-medium">{currentIndex + 1}/{totalPaginas}</span>
            </div>

            {/* Botão Próximo - Laranja (destaque) */}
            <button
              onClick={onNext}
              disabled={!canGoForward}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                canGoForward 
                  ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20' 
                  : 'bg-white/5 text-gray-600 border border-white/10'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
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
