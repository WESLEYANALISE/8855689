import { Card, CardContent } from "@/components/ui/card";
import { Users2, Calendar } from "lucide-react";

interface FrenteCardProps {
  frente: {
    id: string;
    titulo?: string;
    urlDocumento?: string;
    keywords?: string;
    dataInicio?: string;
  };
  onClick?: () => void;
}

export const FrenteCard = ({ frente, onClick }: FrenteCardProps) => {
  const dataInicio = frente.dataInicio ? new Date(frente.dataInicio) : null;
  
  return (
    <Card
      className="cursor-pointer hover:scale-105 hover:shadow-xl transition-all border-2 border-transparent hover:border-rose-500/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-lg bg-rose-600/20 flex items-center justify-center flex-shrink-0">
            <Users2 className="w-6 h-6 text-rose-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white mb-2 line-clamp-2">
              {frente.titulo}
            </p>
            
            {frente.keywords && (
              <div className="flex flex-wrap gap-1 mb-2">
                {frente.keywords.split(',').slice(0, 3).map((keyword, idx) => (
                  <span key={idx} className="px-2 py-1 bg-rose-600/20 text-rose-400 rounded text-xs">
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            )}
            
            {dataInicio && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                Desde {dataInicio.toLocaleDateString('pt-BR', { 
                  month: '2-digit', 
                  year: 'numeric'
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};