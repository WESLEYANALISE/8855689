import { Card, CardContent } from "@/components/ui/card";
import { Vote, Calendar, ThumbsUp, ThumbsDown, MinusCircle } from "lucide-react";

interface VotacaoSenadoCardProps {
  votacao: {
    codigoVotacao?: string;
    codigoSessao?: string;
    dataSessao?: string;
    descricaoVotacao?: string;
    resultado?: string;
    totalSim?: number | string;
    totalNao?: number | string;
    totalAbstencao?: number | string;
    materia?: {
      codigo?: string;
      sigla?: string;
      numero?: string | number;
      ano?: string | number;
    };
  };
  index?: number;
  onClick?: () => void;
}

export const VotacaoSenadoCard = ({ votacao, index = 0, onClick }: VotacaoSenadoCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const isAprovado = votacao.resultado?.toLowerCase().includes('aprovad');
  const isRejeitado = votacao.resultado?.toLowerCase().includes('rejeitad');

  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <Card 
        className="bg-card border-border hover:border-amber-500/50 transition-all cursor-pointer hover:shadow-lg"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isAprovado ? 'bg-green-500/20' : isRejeitado ? 'bg-red-500/20' : 'bg-amber-500/20'
            }`}>
              <Vote className={`w-5 h-5 ${
                isAprovado ? 'text-green-400' : isRejeitado ? 'text-red-400' : 'text-amber-400'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              {votacao.materia && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-bold">
                  {votacao.materia.sigla} {votacao.materia.numero}/{votacao.materia.ano}
                </span>
              )}
              
              <p className="text-sm text-foreground mt-2 line-clamp-2">
                {votacao.descricaoVotacao}
              </p>
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {votacao.resultado && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    isAprovado ? 'bg-green-500/20 text-green-400' : 
                    isRejeitado ? 'bg-red-500/20 text-red-400' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    {votacao.resultado}
                  </span>
                )}
                
                {votacao.dataSessao && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(votacao.dataSessao)}</span>
                  </div>
                )}
              </div>
              
              {/* Contagem de votos */}
              {(votacao.totalSim || votacao.totalNao || votacao.totalAbstencao) && (
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-green-400">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm font-medium">{votacao.totalSim || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-400">
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-sm font-medium">{votacao.totalNao || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MinusCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{votacao.totalAbstencao || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};