import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, CheckCircle2, XCircle } from "lucide-react";

interface VotacaoCardProps {
  votacao: {
    id: string;
    descricao: string;
    data?: string;
    dataHoraRegistro?: string;
    aprovacao?: number;
    siglaOrgao?: string;
  };
  onClick?: () => void;
}

export const VotacaoCard = ({ votacao, onClick }: VotacaoCardProps) => {
  const aprovado = votacao.aprovacao === 1;
  const dataVotacao = votacao.data || votacao.dataHoraRegistro;
  
  return (
    <Card
      className="cursor-pointer hover:scale-105 hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4 items-start">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
            aprovado 
              ? 'bg-green-600/20' 
              : votacao.aprovacao === 0 
                ? 'bg-red-600/20' 
                : 'bg-gray-600/20'
          }`}>
            {aprovado ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : votacao.aprovacao === 0 ? (
              <XCircle className="w-6 h-6 text-red-400" />
            ) : (
              <ThumbsUp className="w-6 h-6 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {aprovado && (
                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-bold">
                  APROVADO
                </span>
              )}
              {votacao.aprovacao === 0 && (
                <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs font-bold">
                  REJEITADO
                </span>
              )}
              {votacao.siglaOrgao && (
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                  {votacao.siglaOrgao}
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-300 line-clamp-2 mb-2">
              {votacao.descricao}
            </p>
            
            {dataVotacao && (
              <p className="text-xs text-gray-400">
                {new Date(dataVotacao).toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
