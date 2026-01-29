import { FileText, Scale, FileQuestion, Users, BookOpen, Eye, Download, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PeticaoStep {
  id: number;
  nome: string;
  icone: React.ReactNode;
  concluido: boolean;
}

interface PeticaoBottomNavProps {
  currentStep: number;
  steps: PeticaoStep[];
  onStepClick: (step: number) => void;
  disabled?: boolean;
}

export const peticaoSteps: PeticaoStep[] = [
  { id: 1, nome: "Caso", icone: <FileText className="w-4 h-4" />, concluido: false },
  { id: 2, nome: "Área", icone: <Scale className="w-4 h-4" />, concluido: false },
  { id: 3, nome: "Tipo", icone: <FileQuestion className="w-4 h-4" />, concluido: false },
  { id: 4, nome: "Partes", icone: <Users className="w-4 h-4" />, concluido: false },
  { id: 5, nome: "Juris", icone: <BookOpen className="w-4 h-4" />, concluido: false },
  { id: 6, nome: "Preview", icone: <Eye className="w-4 h-4" />, concluido: false },
  { id: 7, nome: "Exportar", icone: <Download className="w-4 h-4" />, concluido: false },
];

export const PeticaoBottomNav = ({ 
  currentStep, 
  steps, 
  onStepClick,
  disabled = false 
}: PeticaoBottomNavProps) => {
  const handleClick = (stepId: number) => {
    if (disabled) return;
    
    // Só permite clicar em passos anteriores (concluídos) ou no atual
    const step = steps.find(s => s.id === stepId);
    if (step?.concluido || stepId === currentStep) {
      onStepClick(stepId);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-pb">
      <div className="max-w-4xl mx-auto px-2 py-2">
        <div className="flex items-center justify-between gap-1">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isConcluido = step.concluido;
            const isClickable = isConcluido || isActive;
            const isFuturo = step.id > currentStep && !isConcluido;

            return (
              <button
                key={step.id}
                onClick={() => handleClick(step.id)}
                disabled={disabled || isFuturo}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg transition-all flex-1 min-w-0",
                  isActive && "bg-primary text-primary-foreground",
                  isConcluido && !isActive && "text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 cursor-pointer",
                  isFuturo && "text-muted-foreground/50 cursor-not-allowed",
                  !isActive && !isConcluido && !isFuturo && "text-muted-foreground",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="relative">
                  {isConcluido && !isActive ? (
                    <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    step.icone
                  )}
                </div>
                <span className="text-[10px] font-medium truncate max-w-full">
                  {step.nome}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
