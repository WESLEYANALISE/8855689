import { useState } from "react";
import { HelpCircle, CheckCircle2, XCircle, ChevronRight, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Questao {
  id: string;
  pergunta: string;
  alternativas: string[];
  respostaCorreta: number;
  explicacao: string;
}

interface QuestoesDocumentarioProps {
  questoes: Questao[] | null;
  onGenerate: () => void;
  isLoading: boolean;
  hasTranscricao: boolean;
}

const QuestoesDocumentario = ({ questoes, onGenerate, isLoading, hasTranscricao }: QuestoesDocumentarioProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ corretas: 0, total: 0 });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">
          Gerando questões...
        </p>
      </div>
    );
  }

  if (!questoes || questoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <HelpCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-3">
          {hasTranscricao 
            ? "Gere questões sobre o documentário"
            : "É necessário ter a transcrição para gerar questões"}
        </p>
        {hasTranscricao && (
          <Button onClick={onGenerate} disabled={isLoading} size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar Questões
          </Button>
        )}
      </div>
    );
  }

  const currentQuestion = questoes[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion.respostaCorreta;
  const isAnswered = selectedAnswer !== null;

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(index);
    setShowExplanation(true);
    setScore(prev => ({
      corretas: prev.corretas + (index === currentQuestion.respostaCorreta ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const handleNext = () => {
    if (currentIndex < questoes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore({ corretas: 0, total: 0 });
  };

  return (
    <div className="space-y-4">
      {/* Header com progresso */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Questão {currentIndex + 1} de {questoes.length}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-500">{score.corretas} ✓</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{score.total}</span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questoes.length) * 100}%` }}
        />
      </div>

      {/* Card da questão */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <p className="text-sm font-medium text-foreground leading-relaxed">
          {currentQuestion.pergunta}
        </p>

        {/* Alternativas */}
        <div className="space-y-2">
          {currentQuestion.alternativas.map((alt, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === currentQuestion.respostaCorreta;
            
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={isAnswered}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all text-sm",
                  !isAnswered && "hover:bg-muted/50 hover:border-primary/50",
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

        {/* Explicação */}
        {showExplanation && (
          <div className={cn(
            "p-3 rounded-lg text-sm",
            isCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-amber-500/10 border border-amber-500/30"
          )}>
            <p className="font-medium mb-1">
              {isCorrect ? "✅ Correto!" : "❌ Incorreto"}
            </p>
            <p className="text-muted-foreground">
              {currentQuestion.explicacao}
            </p>
          </div>
        )}
      </div>

      {/* Botões de navegação */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reiniciar
        </Button>

        {isAnswered && currentIndex < questoes.length - 1 && (
          <Button onClick={handleNext} size="sm" className="gap-2">
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {isAnswered && currentIndex === questoes.length - 1 && (
          <div className="text-sm text-muted-foreground">
            Fim das questões! {score.corretas}/{questoes.length} acertos
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestoesDocumentario;
