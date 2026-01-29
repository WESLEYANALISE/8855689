import { Badge } from "@/components/ui/badge";
import { Film, Star, TrendingUp } from "lucide-react";
import { JuriFlixTituloEnriquecido } from "@/types/juriflix.types";

interface JuriFlixCardProps {
  titulo: JuriFlixTituloEnriquecido;
  onClick: () => void;
}

export const JuriFlixCard = ({ titulo, onClick }: JuriFlixCardProps) => {
  const imageUrl = titulo.poster_path || titulo.capa;
  const rating = titulo.popularidade ? Math.min(titulo.popularidade / 10, 10).toFixed(1) : titulo.nota;
  const hasEnrichedData = !!titulo.tmdb_id;

  return (
    <div
      className="w-[180px] md:w-[220px] shrink-0 cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary mb-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={titulo.nome}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Overlay com informações */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center gap-1 text-xs text-white mb-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{rating}</span>
              {hasEnrichedData && titulo.votos_count && (
                <span className="text-white/70 ml-1">({titulo.votos_count})</span>
              )}
            </div>
            <p className="text-xs text-white/90 line-clamp-2">{titulo.sinopse}</p>
          </div>
        </div>

        {/* Badge de tipo */}
        <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
          {titulo.tipo}
        </Badge>

        {/* Badge de popularidade (se disponível) */}
        {hasEnrichedData && titulo.popularidade && titulo.popularidade > 50 && (
          <Badge className="absolute top-2 right-2 text-xs gap-1 bg-accent" variant="default">
            <TrendingUp className="w-3 h-3" />
            Popular
          </Badge>
        )}

        {/* Indicador de dados enriquecidos */}
        {hasEnrichedData && (
          <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-green-500" title="Dados do TMDB" />
        )}
      </div>

      <h3 className="font-medium text-sm line-clamp-2">{titulo.nome}</h3>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{titulo.ano}</span>
        {titulo.duracao && (
          <span>{titulo.duracao} min</span>
        )}
      </div>
    </div>
  );
};