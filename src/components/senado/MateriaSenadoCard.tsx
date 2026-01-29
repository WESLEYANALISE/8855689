import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MateriaSenadoCardProps {
  materia: {
    codigo?: string;
    sigla?: string;
    numero?: string | number;
    ano?: string | number;
    ementa?: string;
    autor?: string;
    data?: string;
    situacao?: string;
    tramitando?: boolean;
  };
  index?: number;
}

export const MateriaSenadoCard = ({ materia }: MateriaSenadoCardProps) => {
  const navigate = useNavigate();

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
      onClick={() => materia.codigo && navigate(`/senado/materia/${materia.codigo}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-bold">
                {materia.sigla} {materia.numero}/{materia.ano}
              </span>
              {materia.situacao && (
                <span className={`px-2 py-0.5 rounded text-xs ${
                  materia.tramitando 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {materia.situacao}
                </span>
              )}
            </div>
            
            <p className="text-sm text-foreground mt-2 line-clamp-2">
              {materia.ementa}
            </p>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {materia.autor && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-32">{materia.autor}</span>
                </div>
              )}
              {materia.data && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(materia.data)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
