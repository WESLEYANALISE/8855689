import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Lightbulb, 
  AlertTriangle, 
  Briefcase,
  CheckCircle2,
  XCircle,
  BookOpen,
  Scale,
  Table2,
  Clock,
  Sparkles,
  LayoutList,
  ChevronRight,
  ChevronLeft,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideCollapsible } from "./SlideCollapsible";
import { SlideLinhaTempo } from "@/components/aula-v2/SlideLinhaTempo";
import { SlideTabela } from "@/components/aula-v2/SlideTabela";
import { SlideResumoVisual } from "@/components/aula-v2/SlideResumoVisual";
import { SlideDicaEstudo } from "@/components/aula-v2/SlideDicaEstudo";
import { UniversalImage } from "@/components/ui/universal-image";
import confetti from "canvas-confetti";
import type { ConceitoSlide } from "./types";

interface ConceitoSlideCardProps {
  slide: ConceitoSlide;
  slideIndex: number;
  totalSlides: number;
  onNext: () => void;
  onPrevious: () => void;
  canGoBack: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  introducao: Sparkles,
  texto: FileText,
  termos: BookOpen,
  explicacao: Lightbulb,
  collapsible: List,
  linha_tempo: Clock,
  tabela: Table2,
  atencao: AlertTriangle,
  dica: Sparkles,
  caso: Briefcase,
  resumo: LayoutList,
  quickcheck: CheckCircle2
};

const colorMap: Record<string, string> = {
  introducao: "from-purple-500 to-pink-500",
  texto: "from-blue-500 to-blue-600",
  termos: "from-indigo-500 to-purple-500",
  explicacao: "from-amber-500 to-orange-500",
  collapsible: "from-indigo-500 to-violet-500",
  linha_tempo: "from-blue-500 to-indigo-500",
  tabela: "from-cyan-500 to-teal-500",
  atencao: "from-red-500 to-rose-500",
  dica: "from-violet-500 to-fuchsia-500",
  caso: "from-emerald-500 to-green-500",
  resumo: "from-amber-500 to-yellow-500",
  quickcheck: "from-violet-500 to-purple-500"
};

const bgColorMap: Record<string, string> = {
  introducao: "bg-purple-500/10 border-purple-500/20",
  texto: "bg-blue-500/10 border-blue-500/20",
  termos: "bg-indigo-500/10 border-indigo-500/20",
  explicacao: "bg-amber-500/10 border-amber-500/20",
  collapsible: "bg-indigo-500/10 border-indigo-500/20",
  linha_tempo: "bg-blue-500/10 border-blue-500/20",
  tabela: "bg-cyan-500/10 border-cyan-500/20",
  atencao: "bg-red-500/10 border-red-500/20",
  dica: "bg-violet-500/10 border-violet-500/20",
  caso: "bg-emerald-500/10 border-emerald-500/20",
  resumo: "bg-amber-500/10 border-amber-500/20",
  quickcheck: "bg-violet-500/10 border-violet-500/20"
};

const getSlideLabel = (tipo: string): string => {
  switch (tipo) {
    case 'introducao': return 'Introdução';
    case 'texto': return 'Conteúdo';
    case 'termos': return 'Termos importantes';
    case 'explicacao': return 'Isso significa';
    case 'collapsible': return 'Explore os conceitos';
    case 'linha_tempo': return 'Passo a passo';
    case 'tabela': return 'Quadro comparativo';
    case 'atencao': return 'Atenção!';
    case 'dica': return 'Dica de memorização';
    case 'caso': return 'Caso prático';
    case 'resumo': return 'Resumo';
    case 'quickcheck': return 'Verificação rápida';
    default: return 'Conteúdo';
  }
};

export const ConceitoSlideCard = ({
  slide,
  slideIndex,
  totalSlides,
  onNext,
  onPrevious,
  canGoBack
}: ConceitoSlideCardProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const Icon = iconMap[slide.tipo] || FileText;
  const gradientColor = colorMap[slide.tipo] || colorMap.texto;
  const bgColor = bgColorMap[slide.tipo] || bgColorMap.texto;

  // Scroll to top when slide changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slideIndex]);

  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;
    
    setSelectedOption(index);
    setShowFeedback(true);
    
    if (index === slide.resposta) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const handleContinue = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    onNext();
  };

  const isQuickCheck = slide.tipo === 'quickcheck';
  const isCorrect = selectedOption === slide.resposta;

  // Render specialized content based on slide type
  const renderContent = () => {
    switch (slide.tipo) {
      case 'collapsible':
        if (slide.collapsibleItems && slide.collapsibleItems.length > 0) {
          return (
            <SlideCollapsible 
              items={slide.collapsibleItems}
              conteudo={slide.conteudo}
            />
          );
        }
        break;

      case 'linha_tempo':
        if (slide.etapas && slide.etapas.length > 0) {
          return (
            <SlideLinhaTempo 
              etapas={slide.etapas}
              titulo={slide.titulo}
              conteudo={slide.conteudo}
            />
          );
        }
        break;

      case 'tabela':
        if (slide.tabela) {
          return (
            <SlideTabela 
              tabela={slide.tabela}
              titulo={slide.titulo}
              conteudo={slide.conteudo}
            />
          );
        }
        break;

      case 'resumo':
        if (slide.pontos && slide.pontos.length > 0) {
          return (
            <SlideResumoVisual 
              pontos={slide.pontos}
              conteudo={slide.conteudo}
              titulo={slide.titulo}
            />
          );
        }
        break;

      case 'dica':
        return (
          <SlideDicaEstudo 
            tecnica={undefined}
            dica={undefined}
            conteudo={slide.conteudo}
            titulo={slide.titulo}
          />
        );

      case 'termos':
        if (slide.termos && slide.termos.length > 0) {
          return (
            <div className="space-y-4">
              {slide.termos.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-card/60 rounded-xl p-4 border border-border/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Scale className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground uppercase text-sm tracking-wide">
                        {item.termo}
                      </h4>
                      <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                        {item.definicao}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          );
        }
        break;

      case 'quickcheck':
        return (
          <div className="space-y-4">
            <p className="text-foreground font-medium text-lg">
              {slide.pergunta}
            </p>
            
            <div className="space-y-3 mt-6">
              {slide.opcoes?.map((opcao, index) => {
                const isSelected = selectedOption === index;
                const isCorrectOption = index === slide.resposta;
                
                let optionStyle = "bg-card border-border hover:border-primary/50 hover:bg-primary/5";
                
                if (showFeedback) {
                  if (isCorrectOption) {
                    optionStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = "bg-red-500/20 border-red-500 text-red-400";
                  } else {
                    optionStyle = "bg-card/50 border-border/50 opacity-50";
                  }
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    disabled={showFeedback}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        showFeedback && isCorrectOption 
                          ? 'border-emerald-500 bg-emerald-500' 
                          : showFeedback && isSelected 
                            ? 'border-red-500 bg-red-500' 
                            : 'border-current'
                      }`}>
                        {showFeedback && isCorrectOption && (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        )}
                        {showFeedback && isSelected && !isCorrectOption && (
                          <XCircle className="w-5 h-5 text-white" />
                        )}
                        {!showFeedback && (
                          <span className="text-sm font-medium">
                            {String.fromCharCode(65 + index)}
                          </span>
                        )}
                      </div>
                      <span className="flex-1">{opcao}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Feedback */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mt-6 p-4 rounded-xl ${
                    isCorrect 
                      ? 'bg-emerald-500/10 border border-emerald-500/20' 
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-semibold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isCorrect ? 'Correto!' : 'Incorreto'}
                      </p>
                      {slide.feedback && (
                        <p className="text-muted-foreground text-sm mt-1">
                          {slide.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
    }

    // Default: render text content
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <p className="text-foreground leading-relaxed whitespace-pre-line">
          {slide.conteudo}
        </p>
      </div>
    );
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="min-h-[calc(100vh-8rem)] flex flex-col p-4 pb-24 md:pb-4 max-w-2xl mx-auto"
    >
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-6">
        {Array.from({ length: Math.min(totalSlides, 20) }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === slideIndex 
                ? 'w-6 bg-primary' 
                : i < slideIndex 
                  ? 'w-1.5 bg-primary/50' 
                  : 'w-1.5 bg-border'
            }`}
          />
        ))}
        {totalSlides > 20 && (
          <span className="text-xs text-muted-foreground ml-1">
            +{totalSlides - 20}
          </span>
        )}
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col">
        {/* Slide image if available */}
        {slide.imagemUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-2xl overflow-hidden"
          >
            <UniversalImage
              src={slide.imagemUrl}
              alt={slide.titulo || "Ilustração"}
              aspectRatio="16/9"
              blurCategory="juridico"
              containerClassName="w-full"
            />
          </motion.div>
        )}

        {/* Header with icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {getSlideLabel(slide.tipo)}
            </p>
            {slide.titulo && (
              <h2 className="text-lg font-semibold text-foreground">{slide.titulo}</h2>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className={`rounded-2xl border p-5 md:p-6 ${bgColor} flex-1 overflow-y-auto`}>
          {renderContent()}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent md:relative md:bg-none md:p-0 md:mt-6">
        <div className="flex gap-3 max-w-2xl mx-auto">
          {canGoBack && (
            <Button
              variant="outline"
              onClick={onPrevious}
              className="flex-1 md:flex-none"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
          )}
          
          {isQuickCheck && !showFeedback ? (
            <Button
              disabled
              className="flex-1 opacity-50"
            >
              Selecione uma opção
            </Button>
          ) : (
            <Button
              onClick={isQuickCheck && showFeedback ? handleContinue : onNext}
              className="flex-1"
            >
              {slideIndex === totalSlides - 1 ? 'Concluir' : 'Próximo'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ConceitoSlideCard;
