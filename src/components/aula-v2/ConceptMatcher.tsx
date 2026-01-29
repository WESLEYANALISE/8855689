import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Shuffle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface Match {
  termo: string;
  definicao: string;
}

interface ConceptMatcherProps {
  matches: Match[];
  onComplete: () => void;
}

export const ConceptMatcher = ({ matches, onComplete }: ConceptMatcherProps) => {
  const [selectedTermo, setSelectedTermo] = useState<number | null>(null);
  const [selectedDef, setSelectedDef] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ termo: number; def: number } | null>(null);
  const [shuffledDefs, setShuffledDefs] = useState<{ original: number; text: string }[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Shuffle definitions on mount
  useEffect(() => {
    const shuffled = matches
      .map((m, i) => ({ original: i, text: m.definicao }))
      .sort(() => Math.random() - 0.5);
    setShuffledDefs(shuffled);
  }, [matches]);

  const handleTermoClick = (index: number) => {
    if (matchedPairs.has(index)) return;
    setSelectedTermo(index);
    setWrongPair(null);
    
    if (selectedDef !== null) {
      checkMatch(index, selectedDef);
    }
  };

  const handleDefClick = (shuffledIndex: number) => {
    const originalIndex = shuffledDefs[shuffledIndex].original;
    if (matchedPairs.has(originalIndex)) return;
    setSelectedDef(shuffledIndex);
    setWrongPair(null);
    
    if (selectedTermo !== null) {
      checkMatch(selectedTermo, shuffledIndex);
    }
  };

  const checkMatch = (termoIndex: number, defShuffledIndex: number) => {
    setAttempts(prev => prev + 1);
    const defOriginalIndex = shuffledDefs[defShuffledIndex].original;
    
    if (termoIndex === defOriginalIndex) {
      // Correct match
      const newMatched = new Set(matchedPairs);
      newMatched.add(termoIndex);
      setMatchedPairs(newMatched);
      setSelectedTermo(null);
      setSelectedDef(null);
      
      if (newMatched.size === matches.length) {
        setIsComplete(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } else {
      // Wrong match
      setWrongPair({ termo: termoIndex, def: defShuffledIndex });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTermo(null);
        setSelectedDef(null);
      }, 800);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...shuffledDefs].sort(() => Math.random() - 0.5);
    setShuffledDefs(shuffled);
    setSelectedTermo(null);
    setSelectedDef(null);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto min-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          Jogo de Associação
        </h2>
        <p className="text-muted-foreground text-sm">
          Conecte os termos às suas definições corretas
        </p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="text-sm text-muted-foreground">
            {matchedPairs.size}/{matches.length} acertos
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            disabled={isComplete}
            className="text-muted-foreground"
          >
            <Shuffle className="w-4 h-4 mr-1" />
            Embaralhar
          </Button>
        </div>
      </div>

      {/* Game grid - responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Termos column */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
            Termos
          </h3>
          {matches.map((match, index) => {
            const isMatched = matchedPairs.has(index);
            const isSelected = selectedTermo === index;
            const isWrong = wrongPair?.termo === index;
            
            return (
              <motion.button
                key={`termo-${index}`}
                onClick={() => handleTermoClick(index)}
                disabled={isMatched}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  isMatched 
                    ? 'bg-emerald-500/20 border-emerald-500/50 cursor-default' 
                    : isWrong
                      ? 'bg-red-500/20 border-red-500 animate-shake'
                      : isSelected 
                        ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' 
                        : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isMatched ? 'bg-emerald-500' : isSelected ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    {isMatched ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-foreground">{index + 1}</span>
                    )}
                  </div>
                  <span className={`font-medium ${isMatched ? 'text-emerald-400' : 'text-foreground'}`}>
                    {match.termo}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Definições column */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
            Definições
          </h3>
          {shuffledDefs.map((def, shuffledIndex) => {
            const originalIndex = def.original;
            const isMatched = matchedPairs.has(originalIndex);
            const isSelected = selectedDef === shuffledIndex;
            const isWrong = wrongPair?.def === shuffledIndex;
            
            return (
              <motion.button
                key={`def-${shuffledIndex}`}
                onClick={() => handleDefClick(shuffledIndex)}
                disabled={isMatched}
                whileTap={{ scale: 0.98 }}
                layout
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  isMatched 
                    ? 'bg-emerald-500/20 border-emerald-500/50 cursor-default' 
                    : isWrong
                      ? 'bg-red-500/20 border-red-500 animate-shake'
                      : isSelected 
                        ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' 
                        : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <p className={`text-sm ${isMatched ? 'text-emerald-400' : 'text-foreground'}`}>
                  {def.text}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Completion state */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-6 mb-6">
              <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-foreground mb-2">Parabéns!</h3>
              <p className="text-muted-foreground">
                Você completou o jogo em {attempts} tentativas!
              </p>
            </div>
            
            <Button
              onClick={onComplete}
              className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
            >
              Continuar
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
