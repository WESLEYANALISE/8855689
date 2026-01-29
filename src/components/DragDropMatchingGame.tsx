import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { GripVertical, Check, X, RotateCcw, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchItem {
  conceito: string;
  definicao: string;
}

interface DragDropMatchingGameProps {
  items: MatchItem[];
  onComplete?: (score: number) => void;
}

interface GameItem extends MatchItem {
  id: string;
  isMatched: boolean;
  isWrong: boolean;
  wrongAttemptId?: string | null;
}

const DragDropMatchingGame = ({ items, onComplete }: DragDropMatchingGameProps) => {
  const [gameItems, setGameItems] = useState<GameItem[]>([]);
  const [definicoes, setDefinicoes] = useState<GameItem[]>([]);
  const [selectedConceito, setSelectedConceito] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [wrongDefinicaoId, setWrongDefinicaoId] = useState<string | null>(null);

  // Inicializa o jogo
  const initGame = useCallback(() => {
    const itemsWithId = items.map((item, idx) => ({
      ...item,
      id: `item-${idx}`,
      isMatched: false,
      isWrong: false,
    }));

    // Embaralha as definições
    const shuffledDefinicoes = [...itemsWithId].sort(() => Math.random() - 0.5);

    setGameItems(itemsWithId);
    setDefinicoes(shuffledDefinicoes);
    setSelectedConceito(null);
    setScore(0);
    setAttempts(0);
    setIsComplete(false);
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      initGame();
    }
  }, [items, initGame]);

  // Seleciona um conceito
  const handleSelectConceito = (id: string) => {
    const item = gameItems.find((i) => i.id === id);
    if (item?.isMatched) return;
    setSelectedConceito(id);
  };

  // Seleciona uma definição para fazer o match
  const handleSelectDefinicao = (id: string) => {
    if (!selectedConceito) return;

    const definicaoItem = definicoes.find((d) => d.id === id);
    const conceitoItem = gameItems.find((c) => c.id === selectedConceito);

    if (!definicaoItem || !conceitoItem || definicaoItem.isMatched) return;

    setAttempts((prev) => prev + 1);

    // Verifica se é um match correto
    if (conceitoItem.conceito === definicaoItem.conceito) {
      // Match correto!
      setGameItems((prev) =>
        prev.map((item) =>
          item.id === selectedConceito ? { ...item, isMatched: true } : item
        )
      );
      setDefinicoes((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isMatched: true } : item
        )
      );
      setScore((prev) => prev + 1);

      // Verifica se completou
      const newScore = score + 1;
      if (newScore === items.length) {
        setIsComplete(true);
        onComplete?.(newScore);
      }
    } else {
      // Match errado - feedback visual em AMBOS (conceito e definição)
      setGameItems((prev) =>
        prev.map((item) =>
          item.id === selectedConceito ? { ...item, isWrong: true } : item
        )
      );
      setWrongDefinicaoId(id);

      setTimeout(() => {
        setGameItems((prev) =>
          prev.map((item) =>
            item.id === selectedConceito ? { ...item, isWrong: false } : item
          )
        );
        setWrongDefinicaoId(null);
      }, 800);
    }

    setSelectedConceito(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum item de correspondência disponível</p>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / attempts) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
          <Trophy className="w-10 h-10 text-white" />
        </div>

        <h3
          className="text-2xl font-bold text-white mb-2"
          style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
        >
          Parabéns!
        </h3>

        <p className="text-gray-400 mb-6">
          Você completou o jogo com {score} acertos em {attempts} tentativas
          <br />
          <span className="text-amber-400 font-medium">{percentage}% de aproveitamento</span>
        </p>

        <Button
          onClick={initGame}
          className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Jogar Novamente
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com progresso */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          <span className="text-amber-400 font-medium">{score}</span> de {items.length} acertos
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={initGame}
          className="text-gray-400 hover:text-white"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reiniciar
        </Button>
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${(score / items.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Instrução */}
      <p className="text-center text-sm text-gray-500">
        Selecione um conceito e depois sua definição correspondente
      </p>

      {/* Layout responsivo - vertical no mobile, grid no desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-4">
        {/* Coluna de Conceitos */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-3">
            Conceitos
          </h4>
          <div className="flex flex-wrap gap-2">
            {gameItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleSelectConceito(item.id)}
                disabled={item.isMatched}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  item.isMatched
                    ? "bg-green-950/30 border border-green-500/30 text-green-400"
                    : item.isWrong
                    ? "bg-red-950/30 border border-red-500/50 text-red-400"
                    : selectedConceito === item.id
                    ? "bg-amber-500/20 border-2 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20"
                    : "bg-[#1a1a24] border border-white/10 text-gray-300 hover:border-amber-500/30"
                }`}
                animate={{
                  x: item.isWrong ? [0, -5, 5, -5, 5, 0] : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2">
                  {item.isMatched ? (
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <GripVertical className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  )}
                  <span style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                    {item.conceito}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Coluna de Definições - Cards completos no mobile */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-3">
            Definições
          </h4>
          <div className="space-y-3">
            {definicoes.map((item) => {
              const isWrongAttempt = wrongDefinicaoId === item.id;
              
              return (
                <motion.button
                  key={`def-${item.id}`}
                  onClick={() => handleSelectDefinicao(item.id)}
                  disabled={item.isMatched || !selectedConceito}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    item.isMatched
                      ? "bg-green-950/30 border-2 border-green-500/50 text-green-400"
                      : isWrongAttempt
                      ? "bg-red-950/40 border-2 border-red-500/60 text-red-400"
                      : !selectedConceito
                      ? "bg-[#1a1a24] border border-white/5 text-gray-500 cursor-not-allowed opacity-60"
                      : "bg-[#1a1a24] border border-white/10 text-gray-300 hover:border-amber-500/30 hover:bg-amber-500/5"
                  }`}
                  animate={{
                    x: isWrongAttempt ? [0, -8, 8, -8, 8, 0] : 0,
                    scale: item.isMatched ? [1, 1.02, 1] : 1,
                  }}
                  transition={{ duration: isWrongAttempt ? 0.4 : 0.3 }}
                  whileHover={!item.isMatched && selectedConceito && !isWrongAttempt ? { scale: 1.01 } : {}}
                  whileTap={!item.isMatched && selectedConceito ? { scale: 0.99 } : {}}
                >
                  <div className="flex items-start gap-3">
                    {item.isMatched ? (
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : isWrongAttempt ? (
                      <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className="text-sm leading-relaxed"
                      style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}
                    >
                      {item.definicao}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragDropMatchingGame;
