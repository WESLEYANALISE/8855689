import { useState } from "react";
import { CheckCircle2, XCircle, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuestaoDinamica {
  id: string;
  timestamp: number;
  pergunta: string;
  alternativas: string[];
  respostaCorreta: number;
  explicacao: string;
}

interface QuestaoOverlayProps {
  questao: QuestaoDinamica;
  onAnswer: (questionId: string, isCorrect: boolean) => void;
  onClose: () => void;
  onSkip: () => void;
}

const QuestaoOverlay = ({ questao, onAnswer, onClose, onSkip }: QuestaoOverlayProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const isCorrect = selectedAnswer === questao.respostaCorreta;
  const isAnswered = selectedAnswer !== null;

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    onAnswer(questao.id, index === questao.respostaCorreta);
  };

  const handleContinue = () => {
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full max-h-[90%] overflow-auto shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-sm font-medium text-primary">
            ❓ Questão do Momento
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onSkip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-4">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {questao.pergunta}
          </p>

          {/* Alternativas */}
          <div className="space-y-2">
            {questao.alternativas.map((alt, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === questao.respostaCorreta;
              
              return (
                <button
                  key={index}
                  onClick={() => handleSelect(index)}
                  disabled={isAnswered}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all text-sm",
                    !isAnswered && "hover:bg-muted/50 hover:border-primary/50 active:scale-[0.98]",
                    isAnswered && isCorrectAnswer && "bg-green-500/10 border-green-500",
                    isAnswered && isSelected && !isCorrectAnswer && "bg-red-500/10 border-red-500",
                    !isAnswered && "border-border bg-background"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isAnswered && isCorrectAnswer && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrectAnswer && (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <span className={cn(
                      isAnswered && isCorrectAnswer && "text-green-600 dark:text-green-400 font-medium",
                      isAnswered && isSelected && !isCorrectAnswer && "text-red-600 dark:text-red-400"
                    )}>
                      {alt}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Resultado */}
          {showResult && (
            <div className={cn(
              "p-3 rounded-lg text-sm animate-in fade-in slide-in-from-bottom-2 duration-200",
              isCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-amber-500/10 border border-amber-500/30"
            )}>
              <p className="font-medium mb-1">
                {isCorrect ? "✅ Correto!" : "❌ Incorreto"}
              </p>
              <p className="text-muted-foreground text-xs">
                {questao.explicacao}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="gap-2 text-muted-foreground"
          >
            <SkipForward className="h-4 w-4" />
            Pular
          </Button>

          {showResult && (
            <Button onClick={handleContinue} size="sm" className="gap-2">
              Continuar Vídeo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestaoOverlay;
