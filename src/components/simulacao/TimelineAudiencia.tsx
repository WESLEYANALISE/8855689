import { Check, Circle, Lock } from "lucide-react";

interface TimelineAudienciaProps {
  totalTurnos: number;
  turnoAtual: number;
}

const TimelineAudiencia = ({ totalTurnos, turnoAtual }: TimelineAudienciaProps) => {
  return (
    <div className="bg-gray-800/50 border border-amber-500/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-semibold text-sm">Progresso da Audiência</h4>
        <span className="text-amber-400 text-xs font-mono">
          {turnoAtual + 1}/{totalTurnos}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalTurnos }).map((_, index) => {
          const isCompleted = index < turnoAtual;
          const isCurrent = index === turnoAtual;
          const isLocked = index > turnoAtual;

          return (
            <div key={index} className="flex items-center flex-1">
              <div
                className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center
                  animate-scale-in transition-all
                  ${isCompleted ? 'bg-green-500/20 border-green-500' : ''}
                  ${isCurrent ? 'bg-amber-500/20 border-amber-500 animate-pulse' : ''}
                  ${isLocked ? 'bg-gray-700/20 border-gray-600' : ''}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {isCompleted && <Check className="w-4 h-4 text-green-400" />}
                {isCurrent && <Circle className="w-4 h-4 text-amber-400 fill-current" />}
                {isLocked && <Lock className="w-3 h-3 text-gray-500" />}
              </div>

              {index < totalTurnos - 1 && (
                <div 
                  className={`
                    flex-1 h-0.5 mx-1
                    ${isCompleted ? 'bg-green-500/40' : 'bg-gray-700/40'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-gray-400">Início</span>
        <span className="text-gray-400">Sentença</span>
      </div>
    </div>
  );
};

export default TimelineAudiencia;
