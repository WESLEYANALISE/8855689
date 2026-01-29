import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, FileText } from "lucide-react";

interface AgendaSenadoItemProps {
  item: {
    codigoSessao?: string;
    codigo?: string;
    data?: string;
    hora?: string;
    tipo?: string;
    local?: string;
    situacao?: string;
    comissao?: {
      sigla?: string;
      nome?: string;
    };
    materias?: Array<{
      codigo?: string;
      sigla?: string;
      numero?: string | number;
      ano?: string | number;
      ementa?: string;
    }>;
    pautas?: Array<{
      codigo?: string;
      ordem?: number;
      ementa?: string;
      materia?: {
        sigla?: string;
        numero?: string | number;
        ano?: string | number;
      };
    }>;
  };
  index?: number;
  onClick?: () => void;
}

export const AgendaSenadoItem = ({ item, onClick }: AgendaSenadoItemProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return dateString;
    }
  };

  const totalItens = (item.materias?.length || 0) + (item.pautas?.length || 0);

  return (
    <Card 
      className="bg-card border-border hover:border-amber-500/50 transition-all cursor-pointer hover:shadow-lg animate-fade-in"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex flex-col items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                {item.tipo || 'Sessão'}
              </span>
              {item.comissao?.sigla && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-bold">
                  {item.comissao.sigla}
                </span>
              )}
              {item.situacao && (
                <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                  {item.situacao}
                </span>
              )}
            </div>
            
            {item.comissao?.nome && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {item.comissao.nome}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {item.data && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(item.data)}</span>
                </div>
              )}
              {item.hora && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.hora}</span>
                </div>
              )}
              {item.local && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-24">{item.local}</span>
                </div>
              )}
            </div>
            
            {totalItens > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
                <FileText className="w-3 h-3" />
                <span>{totalItens} {totalItens === 1 ? 'item' : 'itens'} na pauta</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
