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
  List,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideLinhaTempo } from "@/components/aula-v2/SlideLinhaTempo";
import { SlideTabela } from "@/components/aula-v2/SlideTabela";
import { UniversalImage } from "@/components/ui/universal-image";
import EnrichedMarkdownRenderer from "@/components/EnrichedMarkdownRenderer";
import confetti from "canvas-confetti";
import type { ConceitoSlide, CollapsibleItem } from "./types";

interface ConceitoSlideCardProps {
  slide: ConceitoSlide;
  paginaIndex: number;
  totalPaginas: number;
  onNext: () => void;
  onPrevious: () => void;
  canGoBack: boolean;
  fontSize?: number;
  direction?: 'next' | 'prev';
}

const iconMap: Record<string, React.ElementType> = {
  introducao: Sparkles,
  texto: FileText,
  termos: BookOpen,
  explicacao: Lightbulb,
  linha_tempo: Clock,
  tabela: Table2,
  atencao: AlertTriangle,
  dica: Sparkles,
  caso: Briefcase,
  resumo: LayoutList,
  quickcheck: CheckCircle2
};

const getPaginaLabel = (tipo: string): string => {
  switch (tipo) {
    case 'introducao': return 'Introdução';
    case 'texto': return 'Conteúdo';
    case 'termos': return 'Termos importantes';
    case 'explicacao': return 'Isso significa';
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

// Converte collapsible items para formato Markdown (legado)
const convertCollapsibleToMarkdown = (items: CollapsibleItem[]): string => {
  if (!items || items.length === 0) return '';
  return items.map(item => {
    return `### ${item.titulo}\n\n${item.conteudo}`;
  }).join('\n\n');
};

// Variantes de animação para transição de slide - opacity mínima para evitar flash branco
const slideVariants = {
  enter: (direction: 'next' | 'prev') => ({
    x: direction === 'next' ? 300 : -300,
    opacity: 0.3
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: 'next' | 'prev') => ({
    x: direction === 'next' ? -300 : 300,
    opacity: 0.3
  })
};

export const ConceitoSlideCard = ({
  slide,
  paginaIndex,
  totalPaginas,
  onNext,
  onPrevious,
  canGoBack,
  fontSize = 16,
  direction = 'next'
}: ConceitoSlideCardProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const Icon = iconMap[slide.tipo] || FileText;

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paginaIndex]);

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
  const hasImage = slide.imagemUrl || slide.imagemPrompt;

  // Render specialized content based on page type - collapsible agora vira texto
  const renderContent = () => {
    // Para slides legados do tipo collapsible, converte para texto
    if ((slide as any).tipo === 'collapsible' || (slide.collapsibleItems && slide.collapsibleItems.length > 0)) {
      const collapsibleMarkdown = slide.collapsibleItems && slide.collapsibleItems.length > 0
        ? convertCollapsibleToMarkdown(slide.collapsibleItems)
        : slide.conteudo;
      
      return (
        <EnrichedMarkdownRenderer 
          content={collapsibleMarkdown || ''}
          fontSize={fontSize}
          theme="classicos"
        />
      );
    }

    switch (slide.tipo) {

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
          // Converte pontos para markdown ao invés de usar componente
          const resumoMarkdown = slide.pontos.map((ponto, idx) => 
            `**${idx + 1}.** ${ponto}`
          ).join('\n\n');
          
          return (
            <EnrichedMarkdownRenderer 
              content={resumoMarkdown}
              fontSize={fontSize}
              theme="classicos"
            />
          );
        }
        break;

      case 'dica':
        // Dica como texto com destaque
        const dicaMarkdown = `> 💡 **DICA DE MEMORIZAÇÃO:**\n\n${slide.conteudo}`;
        return (
          <EnrichedMarkdownRenderer 
            content={dicaMarkdown}
            fontSize={fontSize}
            theme="classicos"
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
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <Scale className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase text-sm tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {item.termo}
                      </h4>
                      <p className="text-gray-300 text-sm mt-1 leading-relaxed">
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
            <p className="text-white font-medium text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              {slide.pergunta}
            </p>
            
            <div className="space-y-3 mt-6">
              {slide.opcoes?.map((opcao, index) => {
                const isSelected = selectedOption === index;
                const isCorrectOption = index === slide.resposta;
                
                let optionStyle = "bg-white/5 border-white/10 hover:border-red-500/50 hover:bg-red-500/5";
                
                if (showFeedback) {
                  if (isCorrectOption) {
                    optionStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = "bg-red-500/20 border-red-500 text-red-400";
                  } else {
                    optionStyle = "bg-white/5 border-white/10 opacity-50";
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
                            : 'border-white/30'
                      }`}>
                        {showFeedback && isCorrectOption && (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        )}
                        {showFeedback && isSelected && !isCorrectOption && (
                          <XCircle className="w-5 h-5 text-white" />
                        )}
                        {!showFeedback && (
                          <span className="text-sm font-medium text-white/70">
                            {String.fromCharCode(65 + index)}
                          </span>
                        )}
                      </div>
                      <span className="flex-1 text-white/90">{opcao}</span>
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
                        <p className="text-gray-400 text-sm mt-1">
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

    // Default: render text content with EnrichedMarkdownRenderer
    return (
      <EnrichedMarkdownRenderer 
        content={slide.conteudo}
        fontSize={fontSize}
        theme="classicos"
      />
    );
  };

  return (
    <motion.div
      ref={containerRef}
      key={paginaIndex}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ 
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }}
      className="min-h-[calc(100vh-8rem)] flex flex-col p-4 pb-4 max-w-2xl mx-auto"
    >
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-6">
        {Array.from({ length: Math.min(totalPaginas, 20) }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === paginaIndex 
                ? 'w-6 bg-red-500' 
                : i < paginaIndex 
                  ? 'w-1.5 bg-red-500/50' 
                  : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
        {totalPaginas > 20 && (
          <span className="text-xs text-gray-500 ml-1">
            +{totalPaginas - 20}
          </span>
        )}
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col">
        {/* Imagem SEM título overlay - apenas imagem ilustrativa */}
        {hasImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mb-4 rounded-2xl overflow-hidden"
          >
            {slide.imagemUrl ? (
              <UniversalImage
                src={slide.imagemUrl}
                alt={slide.titulo || "Ilustração"}
                aspectRatio="16/9"
                blurCategory="juridico"
                containerClassName="w-full"
              />
            ) : (
              // Loading state for image being generated
              <div className="aspect-video bg-[#1a1a2e] flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Gerando ilustração...</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Decorative element - linha vermelha estilo reader */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-red-400">✦</span>
          <div className="h-px flex-1 bg-gradient-to-r from-red-500/50 to-transparent" />
        </div>

        {/* Main content card com título DENTRO */}
        <div className="bg-[#12121a] rounded-2xl border border-white/10 p-5 md:p-6 flex-1 overflow-y-auto">
          {/* Label e título - agora no card de conteúdo */}
          <div className="mb-4">
            <p className="text-xs text-red-400 uppercase tracking-widest font-medium mb-1">
              {getPaginaLabel(slide.tipo)}
            </p>
            {slide.titulo && (
              <h2 
                className="text-xl md:text-2xl font-bold text-white leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {slide.titulo}
              </h2>
            )}
          </div>

          {/* Linha decorativa abaixo do título */}
          <div className="h-px w-full bg-gradient-to-r from-red-500/30 via-orange-500/20 to-transparent mb-5" />

          {/* Conteúdo */}
          {renderContent()}
        </div>
      </div>

      {/* Navigation buttons removed - now in ConceitosSlidesFooter */}
    </motion.div>
  );
};

export default ConceitoSlideCard;
