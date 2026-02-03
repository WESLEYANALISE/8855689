import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Sparkles, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Flashcard {
  pergunta: string;
  resposta: string;
  exemplo?: string;
}

interface FlashcardStackProps {
  flashcards: Flashcard[];
  titulo?: string;
  onGoToQuestions?: () => void;
  onComplete?: () => void; // Chamado automaticamente ao ver o último card
}

const FlashcardStack = ({ flashcards, titulo, onGoToQuestions, onComplete }: FlashcardStackProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const hasCalledComplete = useRef(false);
  
  const isLastCard = currentIndex === flashcards.length - 1;

  // Chamar onComplete automaticamente quando chegar no último card
  useEffect(() => {
    if (isLastCard && !hasCalledComplete.current && onComplete) {
      hasCalledComplete.current = true;
      onComplete();
    }
  }, [isLastCard, onComplete]);

  if (!flashcards || flashcards.length === 0) return null;

  const currentCard = flashcards[currentIndex];
  const totalCards = flashcards.length;

  const goToNext = () => {
    if (currentIndex < totalCards - 1) {
      setIsFlipped(false);
      setDirection('left');
      setTimeout(() => setCurrentIndex(prev => prev + 1), 100);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setDirection('right');
      setTimeout(() => setCurrentIndex(prev => prev - 1), 100);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="my-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Flashcards</h4>
          {titulo && <p className="text-xs text-gray-400">{titulo}</p>}
        </div>
        <div className="ml-auto text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">
          {currentIndex + 1} / {totalCards}
        </div>
      </div>

      {/* Card Container */}
      <div className="relative perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: direction === 'left' ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'left' ? -50 : 50 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {/* Flashcard */}
            <div
              className="relative w-full min-h-[200px] cursor-pointer preserve-3d"
              onClick={handleFlip}
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px'
              }}
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="w-full min-h-[200px] relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front - Pergunta */}
                <div
                  className="absolute inset-0 w-full h-full rounded-xl p-6 flex flex-col backface-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    boxShadow: '0 10px 40px -10px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  <div className="text-xs text-violet-300 uppercase tracking-wider mb-3">
                    Pergunta
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-white text-lg text-center leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                      {currentCard.pergunta}
                    </p>
                  </div>
                  <div className="text-center mt-4">
                    <span className="text-xs text-violet-300/60 inline-flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      Toque para virar
                    </span>
                  </div>
                </div>

                {/* Back - Resposta */}
                <div
                  className="absolute inset-0 w-full h-full rounded-xl p-6 flex flex-col backface-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <div className="text-xs text-emerald-300 uppercase tracking-wider mb-3">
                    Resposta
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-white text-base text-center leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                      {currentCard.resposta}
                    </p>
                  </div>
                  <div className="text-center mt-4">
                    <span className="text-xs text-emerald-300/60 inline-flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      Toque para virar
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Exemplo prático - só aparece quando virado e se tiver exemplo */}
        {isFlipped && currentCard.exemplo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-amber-500">Exemplo Prático</p>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              {currentCard.exemplo}
            </p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="text-gray-400 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {flashcards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsFlipped(false);
                setDirection(idx > currentIndex ? 'left' : 'right');
                setTimeout(() => setCurrentIndex(idx), 100);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-violet-500 w-4'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          disabled={currentIndex === totalCards - 1}
          className="text-gray-400 hover:text-white disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Botão de navegação para Questões no último flashcard */}
      {isLastCard && onGoToQuestions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 pt-4 border-t border-white/10"
        >
          <div className="text-center mb-3">
            <p className="text-sm text-gray-400">
              Você revisou todos os flashcards! 🎉
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Agora é hora de praticar com questões
            </p>
          </div>
          <Button
            onClick={onGoToQuestions}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/20"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Ir para Questões
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default FlashcardStack;
