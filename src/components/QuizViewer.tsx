import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizViewerProps {
  questions: QuizQuestion[];
  onScoreChange?: (correct: number, incorrect: number, answered: number) => void;
}

export const QuizViewer = ({
  questions,
  onScoreChange
}: QuizViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  // Reset state when questions change
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setAnsweredQuestions(new Set());
  }, [questions]);

  // Notify parent of score changes
  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(correctCount, incorrectCount, answeredQuestions.size);
    }
  }, [correctCount, incorrectCount, answeredQuestions.size, onScoreChange]);

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  const handleAnswerSelect = (index: number) => {
    if (answeredQuestions.has(currentIndex)) return;
    
    setSelectedAnswer(index);
    setShowExplanation(true);
    
    const newAnswered = new Set(answeredQuestions);
    newAnswered.add(currentIndex);
    setAnsweredQuestions(newAnswered);
    
    if (index === currentQuestion.correctAnswer) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentIndex(prev => (prev + 1) % questions.length);
  };

  return (
    <div className="w-full max-w-full mx-auto px-1 sm:px-2 py-4 space-y-6 overflow-hidden min-w-0">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <span>Questão {currentIndex + 1} de {questions.length}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-4 h-4" /> {correctCount}
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="w-4 h-4" /> {incorrectCount}
          </span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-6 break-words">
        <h3 className="font-semibold text-base">{currentQuestion.question}</h3>

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
                  <div className="flex items-start gap-3 flex-1">
                    <span className="font-semibold text-muted-foreground shrink-0">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className={cn(
                      showCorrect && "text-green-700 dark:text-green-400 font-medium",
                      showIncorrect && "text-red-700 dark:text-red-400"
                    )}>
                      {option}
                    </span>
                  </div>
                  {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                  {showIncorrect && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        {showExplanation && currentQuestion.explanation && (
          <div className={cn(
            "p-4 rounded-lg border-l-4",
            isCorrect 
              ? "bg-green-500/10 dark:bg-green-500/10 border-green-500 text-foreground" 
              : "bg-blue-500/10 dark:bg-blue-500/10 border-blue-500 text-foreground"
          )}>
            <p className="text-sm font-semibold mb-1 text-foreground">
              {isCorrect ? "✓ Correto!" : "Explicação:"}
            </p>
            <p className="text-sm text-foreground">{currentQuestion.explanation}</p>
          </div>
        )}

        {showExplanation && (
          <Button onClick={handleNext} className="w-full">
            {currentIndex < questions.length - 1 ? (
              <>
                Próxima questão
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              "Reiniciar quiz"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
