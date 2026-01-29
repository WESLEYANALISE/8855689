import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NoticiaCardProps {
  id: string;
  titulo: string;
  capa: string;
  portal: string;
  categoria: string;
  dataHora: string;
  analise_ia?: string;
  onClick: () => void;
}

const NoticiaCard = ({ titulo, capa, portal, categoria, dataHora, analise_ia, onClick }: NoticiaCardProps) => {
  // Normaliza categorias
  const categoriaNormalizada = categoria === "Concurso Público" || categoria === "Concurso" ? "Concursos" : categoria;
  
  const formatarDataHora = (data: string) => {
    try {
      if (!data) return 'Sem data';
      
      if (data.includes('T')) {
        const date = parseISO(data);
        if (isNaN(date.getTime())) return 'Sem data';
        return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      }
      
      if (data.includes('/') && data.includes(':')) {
        return data;
      }
      
      if (data.includes('-')) {
        const date = parseISO(data);
        if (isNaN(date.getTime())) return 'Sem data';
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      }
      
      if (data.includes('/')) {
        return data;
      }
      
      return data;
    } catch {
      return 'Sem data';
    }
  };

  // Cores por categoria: vermelho para Concursos, amarelo para Direito
  const getCategoryColor = (cat: string) => {
    if (cat === 'Concursos' || cat === 'Concurso' || cat === 'Concurso Público') {
      return 'bg-red-600';
    }
    if (cat === 'Direito') {
      return 'bg-amber-500/60';
    }
    return 'bg-muted-foreground';
  };

  return (
    <Card 
      onClick={onClick}
      className="cursor-pointer hover:scale-[1.01] hover:shadow-lg transition-all border border-border hover:border-primary/50 bg-card group overflow-hidden"
    >
      <CardContent className="p-0">
        {/* Layout horizontal compacto para mobile */}
        <div className="flex flex-row">
          {/* Imagem de capa - quadrada e menor */}
          {capa && (
            <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0 overflow-hidden bg-muted">
              <img
                src={capa}
                alt={titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Badge sobreposto na imagem */}
              <Badge className={`absolute top-1 left-1 ${getCategoryColor(categoriaNormalizada)} text-white text-[8px] px-1.5 py-0.5 shadow-md`}>
                {categoriaNormalizada}
              </Badge>
            </div>
          )}
          
          {/* Conteúdo à direita */}
          <div className="p-2.5 flex flex-col justify-between flex-1 min-w-0">
            {/* Título */}
            <h3 className="font-semibold text-xs text-foreground line-clamp-3 group-hover:text-primary transition-colors leading-snug text-left">
              {titulo}
            </h3>

            {/* Portal e Data/Hora */}
            <div className="flex items-center justify-between text-[9px] text-muted-foreground gap-1 mt-1">
              <div className="flex items-center gap-0.5 min-w-0 flex-1">
                <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{portal}</span>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Calendar className="w-2.5 h-2.5" />
                <span className="whitespace-nowrap">{formatarDataHora(dataHora)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NoticiaCard;
