import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Newspaper, Calendar, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import oabNoticiasCover from "@/assets/oab-noticias-cover.webp";

interface NoticiaOAB {
  id: number;
  titulo: string;
  descricao: string | null;
  link: string;
  data_publicacao: string | null;
  hora_publicacao: string | null;
  categoria: string | null;
  processado: boolean;
}

const NoticiasOAB = () => {
  const navigate = useNavigate();
  const [noticias, setNoticias] = useState<NoticiaOAB[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNoticias = async () => {
    try {
      const { data, error } = await supabase
        .from("noticias_oab_cache")
        .select("*")
        .eq("processado", true)
        .order("data_publicacao", { ascending: false })
        .limit(100);

      if (error) throw error;
      setNoticias((data as NoticiaOAB[]) || []);
    } catch (error) {
      console.error("Erro ao buscar notícias:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNoticias();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-3 md:px-6 py-4 space-y-4">
        {/* Header compacto */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/oab/primeira-fase')} 
            className="p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Notícias da OAB</h1>
            <p className="text-xs text-muted-foreground">Atualizações do Exame de Ordem</p>
          </div>
        </div>

        {/* News List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : noticias.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">Nenhuma notícia disponível</h3>
            <p className="text-sm text-muted-foreground">
              As notícias são atualizadas automaticamente
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Contador de notícias */}
            <p className="text-xs text-muted-foreground">
              {noticias.length} {noticias.length === 1 ? 'notícia encontrada' : 'notícias encontradas'}
            </p>
            
            {noticias.map((noticia) => {
              const formattedDate = formatDate(noticia.data_publicacao);
              
              return (
                <article
                  key={noticia.id}
                  onClick={() => navigate(`/oab/noticias/${noticia.id}`)}
                  className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  {/* Layout horizontal: imagem à esquerda, conteúdo à direita */}
                  <div className="flex flex-row">
                    {/* Imagem de capa - quadrada e compacta */}
                    <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0 overflow-hidden bg-muted">
                      <img 
                        src={oabNoticiasCover} 
                        alt="OAB Notícias"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Badge de categoria sobreposto */}
                      {noticia.categoria && (
                        <Badge className="absolute top-1 left-1 bg-primary/90 text-white text-[8px] px-1.5 py-0.5 shadow-md">
                          {noticia.categoria}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Conteúdo à direita */}
                    <div className="p-2.5 flex flex-col justify-between flex-1 min-w-0">
                      {/* Título */}
                      <h3 className="font-semibold text-xs text-foreground line-clamp-3 group-hover:text-primary transition-colors leading-snug text-left">
                        {noticia.titulo}
                      </h3>

                      {/* Portal e Data */}
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground gap-1 mt-1">
                        <div className="flex items-center gap-0.5 min-w-0 flex-1">
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">examedeordem.oab.org.br</span>
                        </div>
                        {formattedDate && (
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <Calendar className="w-2.5 h-2.5" />
                            <span className="whitespace-nowrap">{formattedDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticiasOAB;