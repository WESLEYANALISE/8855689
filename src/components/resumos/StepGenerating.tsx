import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/ProgressBar";

type ResumoLevel = "detalhado" | "resumido" | "super_resumido";

interface StepGeneratingProps {
  nivel: ResumoLevel;
  onComplete?: () => void;
}

const generatingSteps = [
  { progress: 20, message: "Iniciando síntese...", duration: 1000 },
  { progress: 50, message: "Identificando pontos-chave...", duration: 1500 },
  { progress: 80, message: "Estruturando o resumo...", duration: 1200 },
];

export const StepGenerating = ({ nivel, onComplete }: StepGeneratingProps) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Iniciando síntese...");

  const getNivelText = () => {
    switch (nivel) {
      case "super_resumido": return "super resumido";
      case "resumido": return "resumido";
      case "detalhado": return "detalhado";
      default: return "resumo";
    }
  };

  useEffect(() => {
    let currentStep = 0;
    let timeoutId: NodeJS.Timeout;

    const runStep = () => {
      if (currentStep < generatingSteps.length) {
        const step = generatingSteps[currentStep];
        setProgress(step.progress);
        setMessage(step.message);
        
        timeoutId = setTimeout(() => {
          currentStep++;
          runStep();
        }, step.duration);
      }
    };

    runStep();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4 animate-pulse">
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">
            Gerando resumo {getNivelText()}
          </h2>
        </div>
        <ProgressBar
          progress={progress}
          message={message}
          subMessage="A IA está criando seu resumo jurídico..."
        />
      </div>
    </div>
  );
};
