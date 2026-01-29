import { ThumbsUp, ThumbsDown, MinusCircle } from "lucide-react";

interface GraficoVotacaoSenadoProps {
  totalSim?: number;
  totalNao?: number;
  totalAbstencao?: number;
}

export const GraficoVotacaoSenado = ({ 
  totalSim = 0, 
  totalNao = 0, 
  totalAbstencao = 0 
}: GraficoVotacaoSenadoProps) => {
  const total = totalSim + totalNao + totalAbstencao;
  
  if (total === 0) return null;
  
  const percentSim = (totalSim / total) * 100;
  const percentNao = (totalNao / total) * 100;
  const percentAbstencao = (totalAbstencao / total) * 100;

  return (
    <div className="space-y-4">
      {/* Barra de progresso empilhada */}
      <div className="h-6 rounded-full overflow-hidden flex bg-muted">
        {percentSim > 0 && (
          <div 
            className="bg-green-500 flex items-center justify-center transition-all"
            style={{ width: `${percentSim}%` }}
          >
            {percentSim >= 15 && (
              <span className="text-xs font-bold text-white">
                {Math.round(percentSim)}%
              </span>
            )}
          </div>
        )}
        {percentNao > 0 && (
          <div 
            className="bg-red-500 flex items-center justify-center transition-all"
            style={{ width: `${percentNao}%` }}
          >
            {percentNao >= 15 && (
              <span className="text-xs font-bold text-white">
                {Math.round(percentNao)}%
              </span>
            )}
          </div>
        )}
        {percentAbstencao > 0 && (
          <div 
            className="bg-gray-500 flex items-center justify-center transition-all"
            style={{ width: `${percentAbstencao}%` }}
          >
            {percentAbstencao >= 15 && (
              <span className="text-xs font-bold text-white">
                {Math.round(percentAbstencao)}%
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Legenda */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <ThumbsUp className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-green-400">{totalSim}</p>
            <p className="text-xs text-muted-foreground">Sim</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <ThumbsDown className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-red-400">{totalNao}</p>
            <p className="text-xs text-muted-foreground">Não</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center">
            <MinusCircle className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-400">{totalAbstencao}</p>
            <p className="text-xs text-muted-foreground">Abstenção</p>
          </div>
        </div>
      </div>
    </div>
  );
};
