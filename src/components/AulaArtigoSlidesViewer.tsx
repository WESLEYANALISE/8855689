import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, GraduationCap, ChevronRight, BookOpen, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConceitosSlidesViewer } from "@/components/conceitos/slides/ConceitosSlidesViewer";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { QuizViewerEnhanced } from "@/components/QuizViewerEnhanced";
import type { ConceitoSecao } from "@/components/conceitos/slides/types";

interface AulaArtigoSlidesViewerProps {
  isOpen: boolean;
  onClose: () => void;
  codigoTabela: string;
  codigoNome: string;
  numeroArtigo: string;
  conteudoArtigo: string;
}

type EtapaAula = 'loading' | 'slides' | 'flashcards' | 'quiz' | 'resultado';

interface SlidesData {
  versao: number;
  titulo: string;
  tempoEstimado: string;
  area: string;
  objetivos: string[];
  secoes: ConceitoSecao[];
  flashcards: Array<{ frente: string; verso: string; exemplo?: string }>;
  questoes: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explicacao: string;
  }>;
  aulaId?: string;
  cached?: boolean;
}

const loadingMessages = [
  "Analisando o artigo em profundidade...",
  "Criando slides interativos...",
  "Preparando exemplos práticos...",
  "Gerando flashcards de revisão...",
  "Montando questões de prática...",
  "Finalizando sua aula personalizada..."
];

export const AulaArtigoSlidesViewer = ({
  isOpen,
  onClose,
  codigoTabela,
  codigoNome,
  numeroArtigo,
  conteudoArtigo
}: AulaArtigoSlidesViewerProps) => {
  const [slidesData, setSlidesData] = useState<SlidesData | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<EtapaAula>('loading');
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [slidesProgress, setSlidesProgress] = useState(0);
  const [quizAcertos, setQuizAcertos] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    if (etapaAtual === 'loading') {
      const interval = setInterval(() => {
        setLoadingIndex(prev => {
          const next = (prev + 1) % loadingMessages.length;
          setLoadingMessage(loadingMessages[next]);
          return next;
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [etapaAtual]);

  // Fetch or generate slides when modal opens
  useEffect(() => {
    if (isOpen && !slidesData) {
      fetchOrGenerateSlides();
    }
  }, [isOpen]);

  const fetchOrGenerateSlides = async () => {
    try {
      setEtapaAtual('loading');
      
      const response = await supabase.functions.invoke('gerar-slides-artigo', {
        body: {
          codigoTabela,
          numeroArtigo,
          conteudoArtigo,
          codigoNome
        }
      });

      if (response.error) throw response.error;

      const data = response.data as SlidesData;
      setSlidesData(data);

      if (data.cached) {
        toast.success("Aula carregada!");
      } else {
        toast.success("Aula criada com sucesso!");
      }

      setEtapaAtual('slides');
    } catch (error: any) {
      console.error('Erro ao gerar slides:', error);
      toast.error("Erro ao gerar aula. Tente novamente.");
      onClose();
    }
  };

  const handleSlidesComplete = useCallback(() => {
    setEtapaAtual('flashcards');
  }, []);

  const handleFlashcardsComplete = useCallback(() => {
    setEtapaAtual('quiz');
  }, []);

  const handleQuizComplete = useCallback((acertos: number, total: number) => {
    setQuizAcertos(acertos);
    setEtapaAtual('resultado');
  }, []);

  const handleRefazer = () => {
    setSlidesProgress(0);
    setQuizAcertos(0);
    setEtapaAtual('slides');
  };

  const handleSair = () => {
    setSlidesData(null);
    setEtapaAtual('loading');
    setSlidesProgress(0);
    setQuizAcertos(0);
    onClose();
  };

  if (!isOpen) return null;

  // Slides viewer (full screen)
  if (etapaAtual === 'slides' && slidesData) {
    return (
      <ConceitosSlidesViewer
        secoes={slidesData.secoes}
        titulo={slidesData.titulo}
        materiaName={slidesData.area}
        onClose={handleSair}
        onComplete={handleSlidesComplete}
        onProgressChange={setSlidesProgress}
        initialProgress={slidesProgress}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-[60] overflow-hidden flex flex-col">
      {/* Header (for non-slides stages) */}
      {etapaAtual !== 'loading' && (
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleSair}>
                <X className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-foreground text-sm">Art. {numeroArtigo}</h1>
                <p className="text-xs text-muted-foreground">{codigoNome}</p>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 py-3 bg-secondary/30">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              etapaAtual === 'flashcards' ? 'bg-purple-500/20 text-purple-400' : 'bg-muted text-muted-foreground'
            }`}>
              <BookOpen className="w-3 h-3" />
              Flashcards
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              etapaAtual === 'quiz' || etapaAtual === 'resultado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'
            }`}>
              <HelpCircle className="w-3 h-3" />
              Quiz
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Loading State */}
          {etapaAtual === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center px-6 max-w-md">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="mb-8"
                >
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-2xl shadow-primary/30">
                    <GraduationCap className="w-12 h-12 text-primary-foreground" />
                  </div>
                </motion.div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Art. {numeroArtigo}
                </h2>
                <p className="text-muted-foreground mb-8">{codigoNome}</p>

                <div className="flex items-center justify-center gap-3 mb-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <motion.span
                    key={loadingIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-muted-foreground"
                  >
                    {loadingMessage}
                  </motion.span>
                </div>

                <div className="flex justify-center gap-2">
                  {loadingMessages.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        i <= loadingIndex ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  ))}
                </div>

                <Button variant="ghost" onClick={handleSair} className="mt-8 text-muted-foreground">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Flashcards */}
          {etapaAtual === 'flashcards' && slidesData && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 max-w-4xl mx-auto"
            >
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-foreground">
                    Flashcards de Revisão
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Revise os conceitos principais do artigo
                </p>
                
                <FlashcardViewer
                  flashcards={slidesData.flashcards.map(f => ({
                    front: f.frente,
                    back: f.verso,
                    example: f.exemplo
                  }))}
                  tema={`Art. ${numeroArtigo}`}
                />
                
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleFlashcardsComplete}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 rounded-xl"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Ir para Quiz
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quiz */}
          {etapaAtual === 'quiz' && slidesData && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 max-w-4xl mx-auto pb-32"
            >
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-foreground">
                    Quiz de Fixação
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Teste seus conhecimentos sobre o artigo
                </p>
                
                <QuizViewerEnhanced questions={slidesData.questoes} />
                
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => handleQuizComplete(0, slidesData.questoes.length)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 rounded-xl"
                  >
                    Concluir Aula
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Resultado */}
          {etapaAtual === 'resultado' && slidesData && (
            <motion.div
              key="resultado"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex items-center justify-center p-4"
            >
              <div className="text-center max-w-md">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
                >
                  <GraduationCap className="w-12 h-12 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Aula Concluída! 🎉
                </h2>
                <p className="text-muted-foreground mb-8">
                  Você estudou o Art. {numeroArtigo} com sucesso!
                </p>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleRefazer}
                    variant="outline"
                    className="w-full rounded-xl"
                  >
                    Refazer Aula
                  </Button>
                  <Button
                    onClick={handleSair}
                    className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                  >
                    Voltar ao Artigo
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AulaArtigoSlidesViewer;