import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommentModal } from "./CommentModal";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  comment?: string;
}

interface QuizViewerEnhancedProps {
  questions: QuizQuestion[];
}

export const QuizViewerEnhanced = ({ questions }: QuizViewerEnhancedProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  const playSound = (type: 'correct' | 'error') => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (err) {}
  };

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
    setShowExplanation(true);

    const correct = index === currentQuestion.correctAnswer;
    
    if (correct) {
      playSound('correct');
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 600);
    } else {
      playSound('error');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentIndex(prev => (prev + 1) % questions.length);
  };

  return (
    <>
      <CommentModal 
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        comment={currentQuestion.comment || currentQuestion.explanation || ''}
      />
      
      <div className={cn(
        "w-full max-w-full mx-auto px-2 sm:px-4 py-4 space-y-6 overflow-hidden min-w-0",
        isShaking && "animate-shake",
        isPulsing && "animate-pulse-success"
      )}>
        <div className="text-center text-sm text-muted-foreground mb-4">
          Questão {currentIndex + 1} de {questions.length}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-6 break-words">
          <h3 className="font-semibold text-base leading-relaxed">{currentQuestion.question}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="font-semibold text-muted-foreground shrink-0">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className={cn(
                        "break-words",
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
              <p className="text-sm text-foreground leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}

          {showExplanation && currentQuestion.comment && (
            <Button 
              onClick={() => setShowCommentModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <span className="mr-2">💬</span>
              Ver Comentário
            </Button>
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
    </>
  );
};
