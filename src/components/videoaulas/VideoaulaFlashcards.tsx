import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactCardFlip from "react-card-flip";

interface Flashcard {
  id: number;
  frente: string;
  verso: string;
  exemplo?: string;
}

interface VideoaulaFlashcardsProps {
  flashcards: Flashcard[];
}

const VideoaulaFlashcards = ({ flashcards }: VideoaulaFlashcardsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = flashcards[currentIndex];

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

  return (
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
          className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <div className="py-4">
        <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
          {/* Front */}
          <button
            onClick={handleFlip}
            className="w-full min-h-[200px] bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-red-500/50 transition-colors"
          >
            <p className="text-xs text-red-400 mb-3 font-medium">PERGUNTA</p>
            <p className="text-lg font-medium text-foreground leading-relaxed">
              {currentCard.frente}
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
              {currentCard.verso}
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
      <div className="flex items-center justify-between gap-3">
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
  );
};

export default VideoaulaFlashcards;
