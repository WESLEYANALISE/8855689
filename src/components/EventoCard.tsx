import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Building } from "lucide-react";

interface EventoCardProps {
  evento: {
    id: string;
    descricaoTipo?: string;
    dataHoraInicio?: string;
    dataHoraFim?: string;
    localExterno?: {
      nome?: string;
    };
    orgaos?: Array<{
      sigla?: string;
      nome?: string;
    }>;
    situacao?: string;
  };
  onClick?: () => void;
  index?: number;
}

export const EventoCard = ({ evento, onClick, index = 0 }: EventoCardProps) => {
  const dataInicio = evento.dataHoraInicio ? new Date(evento.dataHoraInicio) : null;
  const orgao = evento.orgaos?.[0];
  
  return (
    <Card
      className="cursor-pointer hover:scale-105 hover:shadow-xl transition-all border-2 border-transparent hover:border-cyan-500/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95 animate-fade-in"
      onClick={onClick}
      style={{
        animationDelay: `${index * 0.08}s`,
        animationFillMode: 'backwards'
      }}
    >
      <CardContent className="p-4">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-lg bg-cyan-600/20 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-cyan-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded text-xs font-bold">
                {evento.descricaoTipo || "EVENTO"}
              </span>
              {evento.situacao && (
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                  {evento.situacao}
                </span>
              )}
            </div>
            
            {orgao && (
              <p className="text-sm font-semibold text-white mb-2">
                {orgao.sigla} - {orgao.nome}
              </p>
            )}
            
            <div className="space-y-1">
              {dataInicio && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {dataInicio.toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
              
              {evento.localExterno?.nome && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  {evento.localExterno.nome}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};