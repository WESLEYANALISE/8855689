import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizFixacaoProps {
  questoes: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explicacao: string;
  }>;
}

export const QuizFixacao = ({ questoes }: QuizFixacaoProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = questoes[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentIndex((prev) => (prev + 1) % questoes.length);
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">Quiz de Fixação</h3>
        <p className="text-sm text-muted-foreground">
          Questão {currentIndex + 1} de {questoes.length}
        </p>
      </div>

      <Card className="p-6 space-y-4 border-2 border-primary/20">
        <h4 className="font-semibold text-lg">{currentQuestion.question}</h4>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === currentQuestion.correctAnswer;
            const showCorrect = showExplanation && isCorrectAnswer;
            const showIncorrect = showExplanation && isSelected && !isCorrect;

            return (
              <button
                key={index}
                onClick={() => !showExplanation && handleAnswerSelect(index)}
                disabled={showExplanation}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all",
                  "hover:border-primary disabled:cursor-not-allowed",
                  !showExplanation && "hover:bg-accent/5",
                  showCorrect && "border-green-500 bg-green-50 dark:bg-green-950/20",
                  showIncorrect && "border-red-500 bg-red-50 dark:bg-red-950/20",
                  !showExplanation && isSelected && "border-primary bg-accent/10",
                  !showExplanation && !isSelected && "border-border"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={cn(
                    showCorrect && "text-green-700 dark:text-green-400 font-medium",
                    showIncorrect && "text-red-700 dark:text-red-400"
                  )}>
                    {option}
                  </span>
                  {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {showIncorrect && <XCircle className="w-5 h-5 text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <Card className={cn(
            "p-4 border-l-4",
            isCorrect 
              ? "bg-green-500/10 border-green-500" 
              : "bg-blue-500/10 border-blue-500"
          )}>
            <p className="text-sm font-semibold mb-1">
              {isCorrect ? "✓ Correto!" : "Explicação:"}
            </p>
            <p className="text-sm leading-relaxed">{currentQuestion.explicacao}</p>
          </Card>
        )}

        {showExplanation && (
          <Button onClick={handleNext} className="w-full">
            {currentIndex < questoes.length - 1 ? "Próxima questão" : "Reiniciar quiz"}
          </Button>
        )}
      </Card>
    </div>
  );
};
