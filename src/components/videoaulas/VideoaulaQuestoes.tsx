import { useState } from "react";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Questao {
  id: number;
  pergunta: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
}

interface VideoaulaQuestoesProps {
  questoes: Questao[];
  onReset?: () => void;
}

const VideoaulaQuestoes = ({ questoes, onReset }: VideoaulaQuestoesProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);

  const currentQuestion = questoes[currentIndex];
  const isLastQuestion = currentIndex === questoes.length - 1;
  const isQuizComplete = answeredQuestions.length === questoes.length;

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    setShowExplanation(true);
    setAnsweredQuestions([...answeredQuestions, currentIndex]);
    
    if (index === currentQuestion.resposta_correta) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Quiz complete - handled by render
      return;
    }
    setCurrentIndex(currentIndex + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredQuestions([]);
    onReset?.();
  };

  if (!questoes || questoes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma questão disponível ainda.</p>
      </div>
    );
  }

  // Show final score
  if (isQuizComplete && showExplanation && isLastQuestion) {
    const percentage = Math.round((score / questoes.length) * 100);
    
    return (
      <div className="space-y-6">
        <div className="text-center bg-gradient-to-b from-neutral-800/50 to-neutral-900/50 rounded-xl p-6 border border-white/5">
          <Trophy className={cn(
            "w-16 h-16 mx-auto mb-4",
            percentage >= 70 ? "text-yellow-500" : percentage >= 50 ? "text-orange-500" : "text-red-500"
          )} />
          <h3 className="text-2xl font-bold mb-2">Parabéns!</h3>
          <p className="text-muted-foreground mb-4">Você completou todas as questões</p>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl font-bold text-foreground">{score}</span>
            <span className="text-xl text-muted-foreground">/ {questoes.length}</span>
          </div>
          
          <div className="h-2 bg-neutral-700 rounded-full overflow-hidden mb-2">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                percentage >= 70 ? "bg-green-500" : percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{percentage}% de aproveitamento</p>
        </div>

        <Button onClick={handleReset} className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" />
          Refazer questões
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Questão {currentIndex + 1} de {questoes.length}
        </span>
        <span className="text-muted-foreground">
          Acertos: {score}/{answeredQuestions.length}
        </span>
      </div>

      <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-red-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questoes.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-neutral-900/80 border border-white/5 rounded-xl p-4 space-y-4">
        <h3 className="text-base font-semibold text-foreground leading-relaxed">
          {currentQuestion.pergunta}
        </h3>

        {/* Alternatives */}
        <div className="space-y-2">
          {currentQuestion.alternativas.map((alt, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.resposta_correta;
            const showResult = selectedAnswer !== null;

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  showResult && isCorrect
                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : showResult && isSelected && !isCorrect
                    ? "bg-red-500/20 border-red-500/50 text-red-400"
                    : isSelected
                    ? "bg-primary/20 border-primary/50"
                    : "bg-neutral-800/50 border-white/5 hover:border-white/20 hover:bg-neutral-800",
                  selectedAnswer !== null && "cursor-default"
                )}
              >
                <div className="flex items-start gap-3">
                  {showResult && isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-green-500 mt-0.5" />
                  ) : showResult && isSelected && !isCorrect ? (
                    <XCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  ) : (
                    <span className="w-5 h-5 shrink-0 rounded-full border border-current flex items-center justify-center text-xs font-medium mt-0.5">
                      {String.fromCharCode(65 + index)}
                    </span>
                  )}
                  <span className="text-sm leading-relaxed">{alt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className={cn(
            "p-4 rounded-lg border",
            selectedAnswer === currentQuestion.resposta_correta
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          )}>
            <p className={cn(
              "text-sm font-medium mb-2",
              selectedAnswer === currentQuestion.resposta_correta
                ? "text-green-400"
                : "text-red-400"
            )}>
              {selectedAnswer === currentQuestion.resposta_correta ? "✓ Correto!" : "✗ Incorreto"}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentQuestion.explicacao}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      {showExplanation && (
        <Button onClick={handleNext} className="w-full">
          {isLastQuestion ? (
            <>
              <Trophy className="w-4 h-4 mr-2" />
              Ver resultado
            </>
          ) : (
            <>
              Próxima questão
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default VideoaulaQuestoes;
