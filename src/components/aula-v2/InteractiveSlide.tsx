import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Lightbulb, 
  AlertTriangle, 
  Briefcase,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Scale,
  BookHeart,
  Table2,
  Clock,
  Network,
  Sparkles,
  LayoutList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideContent } from "./types";
import { SlideStorytelling } from "./SlideStorytelling";
import { SlideExemploComImagem } from "./SlideExemploComImagem";
import { SlideTabela } from "./SlideTabela";
import { SlideLinhaTempo } from "./SlideLinhaTempo";
import { SlideMapaMental } from "./SlideMapaMental";
import { SlideDicaEstudo } from "./SlideDicaEstudo";
import { SlideResumoVisual } from "./SlideResumoVisual";
import { SlideAudioButton } from "./SlideAudioButton";
import confetti from "canvas-confetti";

interface InteractiveSlideProps {
  slide: SlideContent;
  slideIndex: number;
  totalSlides: number;
  onNext: () => void;
  onPrevious: () => void;
  canGoBack: boolean;
  // Props for image generation
  numeroArtigo?: string;
  codigoTabela?: string;
  secaoId?: number;
  aulaId?: string;
  audioUrl?: string;
  onImageGenerated?: (slideIndex: number, url: string) => void;
  onAudioGenerated?: (slideIndex: number, url: string) => void;
}

const iconMap: Record<string, any> = {
  texto: FileText,
  termos: BookOpen,
  explicacao: Lightbulb,
  atencao: AlertTriangle,
  exemplo: Briefcase,
  quickcheck: CheckCircle2,
  storytelling: BookHeart,
  tabela: Table2,
  linha_tempo: Clock,
  mapa_mental: Network,
  dica_estudo: Sparkles,
  resumo_visual: LayoutList
};

const colorMap: Record<string, string> = {
  texto: "from-blue-500 to-blue-600",
  termos: "from-indigo-500 to-purple-500",
  explicacao: "from-amber-500 to-orange-500",
  atencao: "from-red-500 to-rose-500",
  exemplo: "from-emerald-500 to-green-500",
  quickcheck: "from-violet-500 to-purple-500",
  storytelling: "from-purple-500 to-pink-500",
  tabela: "from-cyan-500 to-teal-500",
  linha_tempo: "from-blue-500 to-indigo-500",
  mapa_mental: "from-green-500 to-emerald-500",
  dica_estudo: "from-violet-500 to-fuchsia-500",
  resumo_visual: "from-amber-500 to-yellow-500"
};

const bgColorMap: Record<string, string> = {
  texto: "bg-blue-500/10 border-blue-500/20",
  termos: "bg-indigo-500/10 border-indigo-500/20",
  explicacao: "bg-amber-500/10 border-amber-500/20",
  atencao: "bg-red-500/10 border-red-500/20",
  exemplo: "bg-emerald-500/10 border-emerald-500/20",
  quickcheck: "bg-violet-500/10 border-violet-500/20",
  storytelling: "bg-purple-500/10 border-purple-500/20",
  tabela: "bg-cyan-500/10 border-cyan-500/20",
  linha_tempo: "bg-blue-500/10 border-blue-500/20",
  mapa_mental: "bg-green-500/10 border-green-500/20",
  dica_estudo: "bg-violet-500/10 border-violet-500/20",
  resumo_visual: "bg-amber-500/10 border-amber-500/20"
};

export const InteractiveSlide = ({
  slide,
  slideIndex,
  totalSlides,
  onNext,
  onPrevious,
  canGoBack,
  numeroArtigo,
  codigoTabela,
  secaoId,
  aulaId,
  audioUrl,
  onImageGenerated,
  onAudioGenerated
}: InteractiveSlideProps) => {
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
  const isTermos = slide.tipo === 'termos';
  const isExplicacao = slide.tipo === 'explicacao';
  const isExemplo = slide.tipo === 'exemplo';
  const isCorrect = selectedOption === slide.resposta;

  const getSlideLabel = () => {
    switch (slide.tipo) {
      case 'texto': return 'O texto diz';
      case 'termos': return 'Termos importantes';
      case 'explicacao': return 'Isso significa';
      case 'atencao': return 'Ponto de atenção';
      case 'exemplo': return slide.contexto || 'Na prática';
      case 'quickcheck': return 'Verificação rápida';
      case 'storytelling': return 'Entenda com uma história';
      case 'tabela': return 'Quadro comparativo';
      case 'linha_tempo': return 'Passo a passo';
      case 'mapa_mental': return 'Conexões';
      case 'dica_estudo': return 'Dica de memorização';
      case 'resumo_visual': return 'Resumo';
      default: return '';
    }
  };

  // Render specialized slide components
  const renderSpecializedContent = () => {
    switch (slide.tipo) {
      case 'storytelling':
        return (
          <SlideStorytelling 
            personagem={slide.personagem}
            narrativa={slide.narrativa}
            conteudo={slide.conteudo}
            titulo={slide.titulo}
            imagemUrl={slide.imagemUrl}
            numeroArtigo={numeroArtigo}
            codigoTabela={codigoTabela}
            secaoId={secaoId}
            slideIndex={slideIndex}
            onImageGenerated={(url) => onImageGenerated?.(slideIndex, url)}
          />
        );
      
      case 'exemplo':
        // Use the new component with image for examples
        return (
          <SlideExemploComImagem
            conteudo={slide.conteudo}
            contexto={slide.contexto}
            titulo={slide.titulo}
            imagemUrl={slide.imagemUrl}
            numeroArtigo={numeroArtigo}
            codigoTabela={codigoTabela}
            secaoId={secaoId}
            slideIndex={slideIndex}
            onImageGenerated={(url) => onImageGenerated?.(slideIndex, url)}
          />
        );
      
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
      
      case 'mapa_mental':
        if (slide.conceitos && slide.conceitos.length > 0) {
          return (
            <SlideMapaMental 
              conceitos={slide.conceitos}
              titulo={slide.titulo}
              conteudo={slide.conteudo}
            />
          );
        }
        break;
      
      case 'dica_estudo':
        return (
          <SlideDicaEstudo 
            tecnica={slide.tecnica}
            dica={slide.dica}
            conteudo={slide.conteudo}
            titulo={slide.titulo}
          />
        );
      
      case 'resumo_visual':
        return (
          <SlideResumoVisual 
            pontos={slide.pontos}
            conteudo={slide.conteudo}
            titulo={slide.titulo}
          />
        );
    }
    
    return null;
  };

  // Helper to render HTML content safely with better Markdown handling
  const renderHtmlContent = (content: string) => {
    if (!content) return null;
    
    // Clean up common Markdown artifacts that might be mixed in
    let cleanedContent = content
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // **bold** -> <strong>
      .replace(/\*([^*]+)\*/g, '<em>$1</em>') // *italic* -> <em>
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>') // `code` -> <code>
      .replace(/^[-•]\s*/gm, '• ') // Normalize bullet points
      .replace(/^(\d+)\.\s*/gm, '$1. '); // Keep numbered lists
    
    // Check if content contains HTML tags
    if (/<[^>]+>/.test(cleanedContent)) {
      return (
        <div 
          className="text-foreground leading-relaxed whitespace-pre-line prose prose-sm max-w-none dark:prose-invert [&_span]:rounded [&_span]:px-1 [&_strong]:font-semibold [&_em]:italic [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm"
          dangerouslySetInnerHTML={{ __html: cleanedContent }}
        />
      );
    }
    
    // Split by paragraphs and render
    const paragraphs = cleanedContent.split(/\n\n+/);
    if (paragraphs.length > 1) {
      return (
        <div className="space-y-4 text-foreground leading-relaxed">
          {paragraphs.map((para, idx) => (
            <p key={idx} className="whitespace-pre-line">{para}</p>
          ))}
        </div>
      );
    }
    
    return (
      <p className="text-foreground leading-relaxed whitespace-pre-line">
        {cleanedContent}
      </p>
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
        {Array.from({ length: totalSlides }).map((_, i) => (
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
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {getSlideLabel()}
              </p>
              {slide.titulo && (
                <h2 className="text-lg font-semibold text-foreground">{slide.titulo}</h2>
              )}
            </div>
          </div>
          
          {/* Audio button for text-based slides */}
          {aulaId && !isQuickCheck && slide.conteudo && (
            <SlideAudioButton
              aulaId={aulaId}
              slideKey={`${secaoId}-${slideIndex}`}
              conteudo={slide.narrativa || slide.conteudo}
              audioUrl={audioUrl}
              onAudioGenerated={(url) => onAudioGenerated?.(slideIndex, url)}
            />
          )}
        </div>

        {/* Main content */}
        <div className={`rounded-2xl border p-5 md:p-6 ${bgColor} flex-1 overflow-y-auto`}>
          {/* Check for specialized slide types first */}
          {renderSpecializedContent() || (
            <>
              {/* Termos slide */}
              {isTermos && slide.termos && slide.termos.length > 0 ? (
                <div className="space-y-4">
                  {slide.termos.map((item, idx) => (
                    <div 
                      key={idx}
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
                    </div>
                  ))}
                </div>
              ) : isExplicacao && slide.topicos && slide.topicos.length > 0 ? (
                /* Explicacao slide with topics */
                <div className="space-y-5">
                  {slide.conteudo && (
                    <p className="text-foreground leading-relaxed">
                      {slide.conteudo}
                    </p>
                  )}
                  <div className="space-y-4 mt-4">
                    {slide.topicos.map((topico, idx) => (
                      <div 
                        key={idx}
                        className="bg-card/60 rounded-xl p-4 border border-amber-500/20"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-amber-400">{idx + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground text-sm">
                              {topico.titulo}
                            </h4>
                            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                              {topico.detalhe}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isExemplo && slide.contexto ? (
                /* Exemplo slide with context badge */
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">{slide.contexto}</span>
                  </div>
                  {renderHtmlContent(slide.conteudo)}
                </div>
              ) : !isQuickCheck ? (
                renderHtmlContent(slide.conteudo)
              ) : (
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
                            <span className="text-foreground">{opcao}</span>
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
                            ? 'bg-emerald-500/20 border border-emerald-500/30' 
                            : 'bg-red-500/20 border border-red-500/30'
                        }`}
                      >
                        <p className={`font-medium mb-1 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isCorrect ? '✓ Correto!' : '✗ Incorreto'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {slide.feedback}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation buttons - fixed on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border md:relative md:bg-transparent md:border-0 md:p-0 md:mt-6 z-10">
        <div className="flex gap-3 max-w-2xl mx-auto">
          {canGoBack && (
            <Button
              variant="outline"
              onClick={onPrevious}
              className="flex-1 h-12 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Voltar
            </Button>
          )}
        
          {(!isQuickCheck || showFeedback) && (
            <Button
              onClick={isQuickCheck ? handleContinue : onNext}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
            >
              Continuar
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
