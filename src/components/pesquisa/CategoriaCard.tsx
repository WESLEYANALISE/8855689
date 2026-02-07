import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CategoriaResultado } from "@/hooks/useBuscaGlobal";
import { ResultadoPreview } from "./ResultadoPreview";
import { 
  Scale, PlayCircle, GraduationCap, Layers, BookOpen, Newspaper, 
  BookA, Brain, Film, Headphones, Target, Scroll, Gavel, FileText, Trophy 
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<any>> = {
  Scale, PlayCircle, GraduationCap, Layers, BookOpen, Newspaper,
  BookA, Brain, Film, Headphones, Target, Scroll, Gavel, FileText, Trophy
};

interface CategoriaCardProps {
  categoria: CategoriaResultado;
  searchTerm: string;
}

export const CategoriaCard = ({ categoria, searchTerm }: CategoriaCardProps) => {
  const navigate = useNavigate();
  const IconComponent = iconMap[categoria.icon] || Scale;

  const handleVerTodos = () => {
    navigate(`/pesquisar/categoria/${categoria.id}?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-200 group">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-secondary/80", categoria.iconColor)}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{categoria.nome}</h3>
            <p className="text-xs text-muted-foreground">
              {categoria.count} {categoria.count === 1 ? 'resultado' : 'resultados'}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="font-bold text-sm">
          {categoria.count}
        </Badge>
      </div>

      {/* Preview Items */}
      <div className="divide-y divide-border/30">
        {categoria.preview.map((item, index) => (
          <ResultadoPreview key={item.id || index} item={item} iconColor={categoria.iconColor} />
        ))}
      </div>

      {/* Ver Todos Button */}
      {categoria.count > 3 && (
        <button
          onClick={handleVerTodos}
          className="w-full p-3 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors border-t border-border/50"
        >
          Ver todos os {categoria.count} resultados
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default CategoriaCard;
