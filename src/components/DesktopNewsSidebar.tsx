import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, ChevronRight, ChevronLeft, Loader2, ExternalLink } from "lucide-react";
import { useFeaturedNews } from "@/hooks/useFeaturedNews";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export const DesktopNewsSidebar = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { featuredNews, loading } = useFeaturedNews();

  const formatarData = (dataString: string) => {
    try {
      if (!dataString) return '';
      if (dataString.includes('T')) {
        const date = new Date(dataString);
        if (isNaN(date.getTime())) return '';
        date.setHours(date.getHours() + 3);
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        });
      }
      if (dataString.includes('-')) {
        const date = new Date(dataString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        });
      }
      return dataString;
    } catch {
      return '';
    }
  };

  const handleNoticiaClick = (noticia: any) => {
    navigate('/noticias-juridicas/:noticiaId', {
      state: {
        noticia: {
          id: noticia.id,
          categoria: noticia.categoria_tipo || 'Geral',
          portal: noticia.fonte || '',
          titulo: noticia.titulo,
          capa: noticia.imagem || '',
          link: noticia.link,
          dataHora: noticia.data,
          analise_ia: noticia.analise
        }
      }
    });
  };

  if (isCollapsed) {
    return (
      <div className="w-12 h-full border-l border-border/50 bg-card/50 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 rounded-lg hover:bg-secondary transition-colors group"
          title="Expandir notícias"
        >
          <Newspaper className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
        <ChevronLeft className="w-4 h-4 text-muted-foreground mt-2" />
      </div>
    );
  }

  return (
    <div className="w-60 h-full border-l border-border/50 bg-card/30 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-2 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-primary/10 rounded">
            <Newspaper className="w-3 h-3 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-[10px] text-foreground">Notícias Jurídicas</h3>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 rounded hover:bg-secondary transition-colors"
          title="Minimizar"
        >
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      {/* Lista de Notícias */}
      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-1.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-[9px] text-muted-foreground mt-1">Carregando...</span>
            </div>
          ) : featuredNews.length > 0 ? (
            featuredNews.slice(0, 8).map((noticia) => (
              <button
                key={noticia.id}
                onClick={() => handleNoticiaClick(noticia)}
                className="w-full group rounded-md overflow-hidden bg-secondary/30 hover:bg-secondary/60 border border-border/30 hover:border-primary/30 transition-all duration-200 text-left"
              >
                {(noticia.imagem_webp || noticia.imagem) && (
                  <div className="aspect-[2/1] relative overflow-hidden">
                    <img 
                      src={noticia.imagem_webp || noticia.imagem} 
                      alt={noticia.titulo}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
                <div className="p-1.5">
                  <h4 className="text-[10px] font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {noticia.titulo}
                  </h4>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] text-muted-foreground">
                      {formatarData(noticia.data)}
                    </span>
                    {noticia.fonte && (
                      <span className="text-[9px] text-primary/70 truncate max-w-[60px]">
                        {noticia.fonte}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground text-[10px]">
              Nenhuma notícia disponível
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-1.5 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/noticias-juridicas')}
          className="w-full text-[9px] gap-1 h-6"
        >
          Ver todas
          <ExternalLink className="w-2.5 h-2.5" />
        </Button>
      </div>
    </div>
  );
};
