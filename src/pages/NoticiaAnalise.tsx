import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, ExternalLink, Loader2, FileText } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NoticiaAnalise = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const link = searchParams.get("link");
  const [noticia, setNoticia] = useState<any>(null);
  const [analise, setAnalise] = useState<string | null>(null);
  const [conteudoFormatado, setConteudoFormatado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingConteudo, setLoadingConteudo] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'noticia' | 'analise'>('noticia');

  useEffect(() => {
    if (link) {
      buscarDados();
    }
  }, [link]);

  const buscarDados = async () => {
    setLoading(true);
    try {
      const {
        data: noticiaData,
        error
      } = await supabase.from('noticias_juridicas_cache').select('*').eq('link', link).single();
      
      if (error) {
        console.error('Erro ao buscar notícia:', error);
        toast.error('Erro ao carregar notícia');
      } else {
        setNoticia(noticiaData);
        if (noticiaData?.analise_ia) {
          setAnalise(noticiaData.analise_ia);
        }
        
        // Se já tem conteúdo formatado no cache, usar
        if (noticiaData?.conteudo_formatado) {
          setConteudoFormatado(noticiaData.conteudo_formatado);
        } else {
          // Buscar e formatar conteúdo original
          buscarConteudoOriginal(link);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const buscarConteudoOriginal = async (url: string) => {
    setLoadingConteudo(true);
    try {
      const { data, error } = await supabase.functions.invoke('extrair-texto-noticia', {
        body: { url }
      });
      
      if (error) {
        console.error('Erro ao buscar conteúdo:', error);
        return;
      }
      
      if (data?.conteudo) {
        setConteudoFormatado(data.conteudo);
      }
    } catch (err) {
      console.error('Erro ao buscar conteúdo original:', err);
    } finally {
      setLoadingConteudo(false);
    }
  };

  const formatarDataHora = (data: string) => {
    try {
      if (!data) return '';
      const date = new Date(data);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold truncate flex-1">{noticia?.titulo || 'Carregando...'}</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando notícia...</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Capa da notícia */}
          {noticia?.imagem && (
            <div className="aspect-video rounded-xl overflow-hidden mb-6 shadow-lg">
              <img src={noticia.imagem} alt={noticia.titulo} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Título e info */}
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground leading-tight">
              {noticia?.titulo}
            </h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {noticia?.portal && (
                <span className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded">
                  <ExternalLink className="w-3 h-3" />
                  {noticia.portal}
                </span>
              )}
              {noticia?.data && <span>{formatarDataHora(noticia.data)}</span>}
            </div>
          </div>

          {/* Tabs Notícia / Análise */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={abaAtiva === 'noticia' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAbaAtiva('noticia')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Notícia
            </Button>
            {analise && (
              <Button
                variant={abaAtiva === 'analise' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAbaAtiva('analise')}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Análise IA
              </Button>
            )}
          </div>

          {/* Conteúdo da Notícia */}
          {abaAtiva === 'noticia' && (
            <div className="mb-6">
              {loadingConteudo ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  <p className="text-sm text-muted-foreground">Carregando conteúdo...</p>
                </div>
              ) : conteudoFormatado ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-[13px] prose-p:leading-relaxed prose-p:text-muted-foreground prose-headings:text-foreground prose-blockquote:border-l-accent prose-blockquote:bg-accent/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {conteudoFormatado}
                  </ReactMarkdown>
                </div>
              ) : noticia?.descricao ? (
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {noticia.descricao}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Conteúdo não disponível. Clique abaixo para ver o original.
                </p>
              )}
            </div>
          )}

          {/* Análise IA */}
          {abaAtiva === 'analise' && analise && (
            <div className="mb-6">
              <div className="prose prose-base max-w-none dark:prose-invert prose-p:text-[15px] prose-p:leading-relaxed prose-headings:text-foreground prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-li:text-[15px] prose-strong:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analise}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Botão ver original */}
          {link && (
            <div className="pt-6 border-t border-border">
              <Button onClick={() => window.open(link, '_blank')} variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Notícia Original
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NoticiaAnalise;