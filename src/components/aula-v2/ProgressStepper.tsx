import { motion } from "framer-motion";
import { Check, BookOpen, Gamepad2, Brain, FileQuestion, Trophy } from "lucide-react";

interface ProgressStepperProps {
  currentSecao: number;
  totalSecoes: number;
  currentPhase: 'secao' | 'matching' | 'flashcards' | 'quiz' | 'provaFinal' | 'resultado';
  onSecaoClick?: (secao: number) => void;
}

const phaseIcons = {
  secao: BookOpen,
  matching: Gamepad2,
  flashcards: Brain,
  quiz: FileQuestion,
  provaFinal: Trophy,
  resultado: Check
};

export const ProgressStepper = ({
  currentSecao,
  totalSecoes,
  currentPhase,
  onSecaoClick
}: ProgressStepperProps) => {
  const phases = ['secao', 'matching', 'flashcards', 'quiz', 'provaFinal'] as const;
  const currentPhaseIndex = phases.indexOf(currentPhase as any);
  
  // Calculate overall progress
  const secaoProgress = currentPhase === 'secao' ? (currentSecao / totalSecoes) * 100 : 100;
  const phaseProgress = currentPhase === 'resultado' ? 100 : (currentPhaseIndex / phases.length) * 100;
  const totalProgress = currentPhase === 'secao' 
    ? (secaoProgress * 0.5) 
    : 50 + (phaseProgress * 0.5);

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3">
      <div className="max-w-4xl mx-auto">
        {/* Progress bar */}
        <div className="relative h-2 bg-secondary rounded-full overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
          />
        </div>

        {/* Phase indicators - mobile friendly horizontal scroll */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {/* Seções indicator */}
          <div className="flex items-center gap-1.5 min-w-fit">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              currentPhase === 'secao' 
                ? 'bg-primary text-primary-foreground' 
                : currentPhaseIndex > 0 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-secondary text-muted-foreground'
            }`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-foreground">Conteúdo</p>
              <p className="text-[10px] text-muted-foreground">
                {currentPhase === 'secao' ? `${currentSecao}/${totalSecoes}` : 'Concluído'}
              </p>
            </div>
          </div>

          <div className="h-0.5 w-4 bg-border flex-shrink-0" />

          {/* Matching */}
          <div className="flex items-center gap-1.5 min-w-fit">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              currentPhase === 'matching' 
                ? 'bg-primary text-primary-foreground' 
                : currentPhaseIndex > 1 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-secondary text-muted-foreground'
            }`}>
              <Gamepad2 className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline text-xs text-muted-foreground">Matching</span>
          </div>

          <div className="h-0.5 w-4 bg-border flex-shrink-0" />

          {/* Flashcards */}
          <div className="flex items-center gap-1.5 min-w-fit">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              currentPhase === 'flashcards' 
                ? 'bg-primary text-primary-foreground' 
                : currentPhaseIndex > 2 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-secondary text-muted-foreground'
            }`}>
              <Brain className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline text-xs text-muted-foreground">Flashcards</span>
          </div>

          <div className="h-0.5 w-4 bg-border flex-shrink-0" />

          {/* Quiz */}
          <div className="flex items-center gap-1.5 min-w-fit">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              currentPhase === 'quiz' 
                ? 'bg-primary text-primary-foreground' 
                : currentPhaseIndex > 3 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-secondary text-muted-foreground'
            }`}>
              <FileQuestion className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline text-xs text-muted-foreground">Quiz</span>
          </div>

          <div className="h-0.5 w-4 bg-border flex-shrink-0" />

          {/* Prova Final */}
          <div className="flex items-center gap-1.5 min-w-fit">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              currentPhase === 'provaFinal' || currentPhase === 'resultado'
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-muted-foreground'
            }`}>
              <Trophy className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline text-xs text-muted-foreground">Prova</span>
          </div>
        </div>
      </div>
    </div>
  );
};
