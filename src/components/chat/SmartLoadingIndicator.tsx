import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";

interface SmartLoadingIndicatorProps {
  nome?: string;
  onCancel?: () => void;
}

export const SmartLoadingIndicator = ({ nome = "Professora", onCancel }: SmartLoadingIndicatorProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
      
      // Progresso não-linear mais realista
      if (elapsed < 3) {
        setProgress(15);
      } else if (elapsed < 8) {
        setProgress(35);
      } else if (elapsed < 15) {
        setProgress(60);
      } else if (elapsed < 25) {
        setProgress(80);
      } else {
        setProgress(90);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const getLoadingMessage = () => {
    if (elapsedTime < 1) return `Enviando sua pergunta...`;
    if (elapsedTime < 3) return `Conectando com a ${nome}...`;
    if (elapsedTime < 8) return `${nome} está pensando na melhor resposta...`;
    if (elapsedTime < 15) return `Preparando conteúdo detalhado...`;
    if (elapsedTime < 25) return `Quase pronto, finalizando...`;
    return `${nome} está pesquisando referências legais...`;
  };

  const getLoadingTip = () => {
    if (elapsedTime < 8) return null;
    if (elapsedTime < 15) return "💡 Perguntas complexas podem levar um pouco mais de tempo";
    if (elapsedTime < 25) return "⏱️ Respostas detalhadas estão quase prontas...";
    return "🔍 Buscando as melhores referências para você...";
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg animate-fade-in">
      {/* Estado principal */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0s" }} />
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
        </div>
        <div className="flex-1">
          <p className="text-purple-300 text-sm font-medium">{getLoadingMessage()}</p>
          {getLoadingTip() && (
            <p className="text-purple-300/70 text-xs mt-1">{getLoadingTip()}</p>
          )}
        </div>
        <div className="text-xs text-purple-400 font-mono">{elapsedTime}s</div>
      </div>

      {/* Barra de progresso */}
      <Progress value={progress} className="h-1.5" />

      {/* Botão cancelar após 8 segundos */}
      {elapsedTime >= 8 && onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="self-end text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 gap-2"
        >
          <X className="h-3 w-3" />
          Cancelar
        </Button>
      )}
    </div>
  );
};
