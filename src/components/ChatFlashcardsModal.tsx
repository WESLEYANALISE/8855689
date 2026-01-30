import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, RotateCcw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactCardFlip from "react-card-flip";

interface ChatFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

interface Flashcard {
  front: string;
  back: string;
  exemplo?: string;
}

const ChatFlashcardsModal = ({ isOpen, onClose, content }: ChatFlashcardsModalProps) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Iniciando...");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { toast } = useToast();

  const gerarFlashcards = async () => {
    if (hasGenerated) return;
    
    setLoading(true);
    setProgress(0);
    setProgressMessage("Iniciando...");
    setFlashcards([]);
    setHasGenerated(true);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    let progressInterval: number | undefined;
    let currentProgress = 0;
    
    const startProgressAnimation = () => {
      progressInterval = window.setInterval(() => {
        if (currentProgress < 90) {
          const increment = currentProgress < 30 ? 3 : currentProgress < 60 ? 5 : 4;
          currentProgress = Math.min(90, currentProgress + increment);
          setProgress(Math.round(currentProgress));
          
          if (currentProgress < 25) {
            setProgressMessage("Analisando conteúdo...");
          } else if (currentProgress < 50) {
            setProgressMessage("Criando flashcards...");
          } else if (currentProgress < 75) {
            setProgressMessage("Elaborando perguntas e respostas...");
          } else {
            setProgressMessage("🎉 Quase pronto!");
          }
        }
      }, 300);
    };
    
    try {
      startProgressAnimation();
      
      const { data, error } = await supabase.functions.invoke("gerar-flashcards", {
        body: {
          content: content,
          tipo: 'chat'
        }
      });

      if (error) throw error;

      if (progressInterval) clearInterval(progressInterval);
      setProgress(95);
      
      if (data.flashcards && Array.isArray(data.flashcards)) {
        setFlashcards(data.flashcards);
        setProgress(100);
        
        toast({
          title: "Sucesso!",
          description: `${data.flashcards.length} flashcards gerados com sucesso`
        });
      } else {
        throw new Error('Formato de resposta inválido');
      }
      
    } catch (error) {
      console.error("Erro ao gerar flashcards:", error);
      if (progressInterval) clearInterval(progressInterval);
      toast({
        title: "Erro",
        description: "Não foi possível gerar os flashcards. Tente novamente.",
        variant: "destructive"
      });
      setHasGenerated(false);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleClose = () => {
    setHasGenerated(false);
    setFlashcards([]);
    setProgress(0);
    setLoading(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    onClose();
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 100);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 100);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReset = () => {
    setIsFlipped(false);
    setCurrentIndex(0);
  };

  useEffect(() => {
    if (isOpen && !hasGenerated && !loading) {
      gerarFlashcards();
    }
  }, [isOpen, hasGenerated, loading]);

  if (!isOpen) return null;

  const currentCard = flashcards[currentIndex];

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-accent">🎴 Flashcards</h2>
            <p className="text-sm text-muted-foreground">Material de estudo</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90">
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="none" className="text-secondary" />
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={276.46} strokeDashoffset={276.46 * (1 - progress / 100)} className="text-accent transition-all duration-300" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-accent">{progress}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold mb-1">Gerando flashcards...</p>
                <p className="text-xs text-muted-foreground">{progressMessage}</p>
              </div>
            </div>
          ) : flashcards.length > 0 && currentCard ? (
            <div className="space-y-4">
              {/* Progress indicator */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Card {currentIndex + 1} de {flashcards.length}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reiniciar
                </Button>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                />
              </div>

              {/* Flashcard */}
              <div className="py-2">
                <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
                  {/* Front */}
                  <button
                    onClick={handleFlip}
                    className="w-full min-h-[200px] bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-500/50 transition-colors"
                  >
                    <p className="text-xs text-amber-400 mb-3 font-medium">PERGUNTA</p>
                    <p className="text-lg font-medium text-foreground leading-relaxed">
                      {currentCard.front}
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Toque para ver a resposta
                    </p>
                  </button>

                  {/* Back */}
                  <button
                    onClick={handleFlip}
                    className="w-full min-h-[200px] bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 transition-colors"
                  >
                    <p className="text-xs text-emerald-400 mb-3 font-medium">RESPOSTA</p>
                    <p className="text-base text-foreground leading-relaxed">
                      {currentCard.back}
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Toque para voltar à pergunta
                    </p>
                  </button>
                </ReactCardFlip>
              </div>

              {/* Exemplo prático - só aparece quando virado e se tiver exemplo */}
              {isFlipped && currentCard.exemplo && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-semibold text-amber-500">Exemplo Prático</p>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {currentCard.exemplo}
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="flex-1 gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentIndex === flashcards.length - 1}
                  className="flex-1 gap-2"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              Nenhum flashcard gerado.
            </div>
          )}
        </div>

        {!loading && flashcards.length > 0 && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
            <Button onClick={handleClose} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatFlashcardsModal;
