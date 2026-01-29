import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ResultadoItem } from "@/hooks/useBuscaGlobal";

interface ResultadoPreviewProps {
  item: ResultadoItem;
  iconColor?: string;
  showFullInfo?: boolean;
}

export const ResultadoPreview = ({ item, iconColor, showFullInfo = false }: ResultadoPreviewProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(item.route)}
      className="w-full p-3 flex items-start gap-3 hover:bg-accent/5 transition-colors text-left group"
    >
      {item.imagem && (
        <img 
          src={item.imagem} 
          alt={item.titulo}
          className="w-12 h-12 object-cover rounded-lg flex-shrink-0 bg-secondary"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      
      <div className="flex-1 min-w-0">
        {item.extra && (
          <span className={cn("text-xs font-medium", iconColor || "text-primary")}>
            {item.extra}
          </span>
        )}
        <h4 className={cn(
          "font-medium text-foreground",
          showFullInfo ? "text-sm" : "text-sm line-clamp-1"
        )}>
          {item.titulo}
        </h4>
        {item.subtitulo && (
          <p className={cn(
            "text-xs text-muted-foreground mt-0.5",
            showFullInfo ? "" : "line-clamp-1"
          )}>
            {item.subtitulo}
          </p>
        )}
      </div>
      
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
    </button>
  );
};

export default ResultadoPreview;
