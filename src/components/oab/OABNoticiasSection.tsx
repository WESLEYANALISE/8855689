import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, ExternalLink, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Noticia {
  id: string;
  titulo: string;
  descricao: string | null;
  url: string | null;
  data_publicacao: string | null;
  imagem_url: string | null;
}

const OABNoticiasSection = () => {
  const navigate = useNavigate();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const { data, error } = await supabase
          .from("aprofundamento_noticias")
          .select("id, titulo, descricao, url, data_publicacao, imagem_url")
          .or("instituicao.ilike.%OAB%,titulo.ilike.%OAB%,titulo.ilike.%advogado%,titulo.ilike.%advocacia%")
          .order("data_publicacao", { ascending: false })
          .limit(4);

        if (error) throw error;
        setNoticias(data || []);
      } catch (error) {
        console.error("Erro ao buscar notícias:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNoticias();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="space-y-4">
      <div className="bg-neutral-900/90 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        
        <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900/20 rounded-2xl p-3 shadow-lg ring-1 ring-blue-800/30">
              <Newspaper className="w-6 h-6 md:w-5 md:h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl md:text-lg font-bold text-foreground tracking-tight">
                Notícias
              </h3>
              <p className="text-muted-foreground text-xs">Últimas notícias da OAB</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/noticias?filtro=oab')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Ver todas
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : noticias.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma notícia encontrada
          </p>
        ) : (
          <div className="space-y-3 relative z-10">
            {noticias.map((noticia) => (
              <a
                key={noticia.id}
                href={noticia.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-neutral-800/70 hover:bg-neutral-700/80 rounded-xl p-3 flex items-start gap-3 transition-colors border border-white/5 hover:border-white/10"
              >
                {noticia.imagem_url && (
                  <img 
                    src={noticia.imagem_url} 
                    alt="" 
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {noticia.titulo}
                  </h4>
                  {noticia.data_publicacao && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(noticia.data_publicacao)}
                    </p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OABNoticiasSection;
