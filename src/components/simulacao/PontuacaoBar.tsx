interface PontuacaoBarProps {
  pontuacao: number;
  pontuacaoMaxima: number;
}

export const PontuacaoBar = ({ pontuacao, pontuacaoMaxima }: PontuacaoBarProps) => {
  const percentual = Math.min((pontuacao / pontuacaoMaxima) * 100, 100);
  
  const getColor = () => {
    if (pontuacao >= 86) return 'bg-green-600';
    if (pontuacao >= 61) return 'bg-green-500';
    if (pontuacao >= 31) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getFaixa = () => {
    if (pontuacao >= 86) return 'Excelente - Deferimento Certo';
    if (pontuacao >= 61) return 'Bom - Deferimento Provável';
    if (pontuacao >= 31) return 'Regular - Deferimento Parcial';
    return 'Insuficiente - Indeferimento Provável';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">Pontuação</span>
        <span className="text-lg font-bold text-amber-500">
          {pontuacao} / {pontuacaoMaxima}
        </span>
      </div>
      
      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500 ease-out`}
          style={{ width: `${percentual}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-400 mt-1 text-center">{getFaixa()}</p>
    </div>
  );
};
