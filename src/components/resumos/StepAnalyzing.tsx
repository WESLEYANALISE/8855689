import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/ProgressBar";

const analysisSteps = [
  { progress: 20, message: "Iniciando análise...", duration: 800 },
  { progress: 45, message: "Lendo documento...", duration: 1000 },
  { progress: 70, message: "Extraindo conteúdo...", duration: 1200 },
  { progress: 95, message: "Organizando informações...", duration: 800 },
];

interface StepAnalyzingProps {
  onComplete?: () => void;
}

export const StepAnalyzing = ({ onComplete }: StepAnalyzingProps) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Iniciando análise...");

  useEffect(() => {
    let currentStep = 0;
    let timeoutId: NodeJS.Timeout;

    const runStep = () => {
      if (currentStep < analysisSteps.length) {
        const step = analysisSteps[currentStep];
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
        <ProgressBar
          progress={progress}
          message={message}
          subMessage="Isso pode levar alguns segundos..."
        />
      </div>
    </div>
  );
};
