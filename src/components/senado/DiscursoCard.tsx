import { Card, CardContent } from "@/components/ui/card";
import { Mic, Calendar, Clock, ExternalLink } from "lucide-react";

interface DiscursoCardProps {
  discurso: {
    codigo?: string;
    data?: string;
    hora?: string;
    resumo?: string;
    integra?: string;
    fase?: string;
    tipoSessao?: string;
    indexacao?: string;
    sumario?: string;
  };
  index?: number;
  onClick?: () => void;
}

export const DiscursoCard = ({ discurso, onClick }: DiscursoCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <Card 
      className="bg-card border-border hover:border-amber-500/50 transition-all cursor-pointer hover:shadow-lg animate-fade-in"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Mic className="w-5 h-5 text-amber-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {discurso.fase && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                  {discurso.fase}
                </span>
              )}
              {discurso.tipoSessao && (
                <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                  {discurso.tipoSessao}
                </span>
              )}
            </div>
            
            <p className="text-sm text-foreground mt-2 line-clamp-3">
              {discurso.resumo || discurso.sumario || 'Pronunciamento em plenário'}
            </p>
            
            {discurso.indexacao && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                {discurso.indexacao}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {discurso.data && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(discurso.data)}</span>
                  </div>
                )}
                {discurso.hora && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{discurso.hora}</span>
                  </div>
                )}
              </div>
              
              {discurso.integra && (
                <a
                  href={discurso.integra}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Íntegra</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
