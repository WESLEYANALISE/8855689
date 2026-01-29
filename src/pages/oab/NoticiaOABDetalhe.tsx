import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Share2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import oabNoticiasCover from "@/assets/oab-noticias-cover.webp";

interface NoticiaOAB {
  id: number;
  titulo: string;
  descricao: string | null;
  link: string;
  data_publicacao: string | null;
  hora_publicacao: string | null;
  categoria: string | null;
  conteudo_completo: string | null;
}

const NoticiaOABDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [noticia, setNoticia] = useState<NoticiaOAB | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNoticia = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("noticias_oab_cache")
          .select("*")
          .eq("id", parseInt(id))
          .single();

        if (error) throw error;
        
        if (data) {
          setNoticia({
            id: data.id,
            titulo: data.titulo,
            descricao: data.descricao,
            link: data.link,
            data_publicacao: data.data_publicacao,
            hora_publicacao: data.hora_publicacao,
            categoria: data.categoria,
            conteudo_completo: data.conteudo_completo
          });
        }
      } catch (error) {
        console.error("Erro ao buscar notícia:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNoticia();
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return null;
    }
  };

  const handleShare = async () => {
    if (!noticia) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: noticia.titulo,
          text: noticia.descricao || '',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
        <div className="flex-1 px-3 md:px-6 py-4 space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!noticia) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
        <div className="flex-1 px-3 md:px-6 py-4">
          <button 
            onClick={() => navigate('/oab/noticias')} 
            className="p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700/80 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">Notícia não encontrada</h3>
            <p className="text-sm text-muted-foreground">
              A notícia que você procura não existe ou foi removida.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = formatDate(noticia.data_publicacao);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-3 md:px-6 py-4 space-y-4 max-w-3xl mx-auto w-full">
        {/* Header compacto */}
        <div className="flex items-center justify-between gap-3">
          <button 
            onClick={() => navigate('/oab/noticias')} 
            className="p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
        </div>

        {/* Cover - estilo lista como notícias jurídicas */}
        <div className="h-32 md:h-40 rounded-xl relative overflow-hidden">
          <img 
            src={oabNoticiasCover} 
            alt="OAB Notícias"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {noticia.categoria && (
            <div className="absolute bottom-3 left-3">
              <span className="inline-block px-2.5 py-0.5 bg-primary/90 rounded-full text-xs text-white font-medium">
                {noticia.categoria}
              </span>
            </div>
          )}
        </div>

        {/* Title & Meta */}
        <div className="space-y-3">
          <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
            {noticia.titulo}
          </h1>
          
          {(formattedDate || noticia.hora_publicacao) && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {formattedDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formattedDate}</span>
                </div>
              )}
              {noticia.hora_publicacao && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{noticia.hora_publicacao}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {noticia.conteudo_completo ? (
          <article className="prose prose-invert prose-sm md:prose-base max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline underline-offset-2"
                  >
                    {children}
                  </a>
                ),
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold text-foreground mt-6 mb-3">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-bold text-foreground mt-5 mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold text-foreground mt-4 mb-2">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground leading-relaxed mb-3 text-sm md:text-base">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside text-muted-foreground space-y-1.5 mb-3 text-sm md:text-base">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1.5 mb-3 text-sm md:text-base">{children}</ol>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4 text-sm">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
              }}
            >
              {noticia.conteudo_completo}
            </ReactMarkdown>
          </article>
        ) : (
          <div className="bg-muted/50 rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Conteúdo sendo processado...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticiaOABDetalhe;
