import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, FileText, Globe, Sparkles, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';

interface NoticiaPolitica {
  id: number;
  titulo: string;
  descricao: string | null;
  url: string;
  fonte: string;
  espectro: string | null;
  imagem_url: string | null;
  imagem_url_webp: string | null;
  data_publicacao: string | null;
  // Campos pré-processados
  conteudo_formatado?: string | null;
  resumo_executivo?: string | null;
  resumo_facil?: string | null;
  pontos_principais?: string[] | null;
  termos?: Termo[] | null;
}

interface Termo {
  termo: string;
  significado: string;
}

interface ConteudoFormatado {
  titulo: string;
  subtitulo: string;
  conteudo: string;
  autor: string;
  dataPublicacao: string;
  imagemUrl: string;
  termos: Termo[];
}

interface AnaliseNoticia {
  resumoExecutivo: string;
  resumoFacil: string;
  pontosPrincipais: string[];
  termos: Termo[];
}

type VisualizacaoAtiva = 'formatada' | 'original' | 'analise';
type SubMenuFormatada = 'noticia' | 'termos';
type SubMenuAnalise = 'executivo' | 'facil' | 'termos';

const NoticiaPoliticaDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [noticia, setNoticia] = useState<NoticiaPolitica | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState<VisualizacaoAtiva>('formatada');
  
  // Sub-menus
  const [subMenuFormatada, setSubMenuFormatada] = useState<SubMenuFormatada>('noticia');
  const [subMenuAnalise, setSubMenuAnalise] = useState<SubMenuAnalise>('executivo');
  
  const [conteudoFormatado, setConteudoFormatado] = useState<ConteudoFormatado | null>(null);
  const [loadingFormatado, setLoadingFormatado] = useState(false);
  
  const [analise, setAnalise] = useState<AnaliseNoticia | null>(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);

  useEffect(() => {
    const loadNoticia = async () => {
      // SEMPRE buscar primeiro no banco pelo ID para ter dados completos
      if (id) {
        const { data, error } = await supabase
          .from('noticias_politicas_cache')
          .select('*')
          .eq('id', parseInt(id))
          .single();

        if (!error && data) {
          const termos = Array.isArray(data.termos) ? data.termos as unknown as Termo[] : [];
          setNoticia({
            ...data,
            termos
          } as NoticiaPolitica);
          setIsLoading(false);
          return;
        }
      }

      // Fallback: usar searchParams apenas se não encontrou no banco
      const titulo = searchParams.get('titulo');
      const url = searchParams.get('url');
      
      if (titulo && url) {
        setNoticia({
          id: parseInt(id || '0'),
          titulo: decodeURIComponent(titulo),
          url: decodeURIComponent(url),
          descricao: null,
          fonte: searchParams.get('fonte') || 'Portal',
          espectro: null,
          imagem_url: searchParams.get('imagem') ? decodeURIComponent(searchParams.get('imagem')!) : null,
          imagem_url_webp: null,
          data_publicacao: searchParams.get('data') || null,
        });
      }
      setIsLoading(false);
    };

    loadNoticia();
  }, [id, searchParams]);

  // Carregar dados pré-processados do cache
  useEffect(() => {
    if (noticia) {
      // Usar dados pré-processados se disponíveis
      if (noticia.conteudo_formatado) {
        setConteudoFormatado({
          titulo: noticia.titulo,
          subtitulo: '',
          conteudo: noticia.conteudo_formatado,
          autor: '',
          dataPublicacao: noticia.data_publicacao || '',
          imagemUrl: noticia.imagem_url_webp || noticia.imagem_url || '',
          termos: noticia.termos || []
        });
      }
      
      if (noticia.resumo_executivo) {
        setAnalise({
          resumoExecutivo: noticia.resumo_executivo,
          resumoFacil: noticia.resumo_facil || '',
          pontosPrincipais: noticia.pontos_principais || [],
          termos: noticia.termos || []
        });
      }
    }
  }, [noticia]);

  const carregarConteudoFormatado = async () => {
    if (!noticia?.url || conteudoFormatado) return;
    // Fallback para Edge Function se não tiver dados pré-processados
    setLoadingFormatado(true);
    try {
      const { data, error } = await supabase.functions.invoke('extrair-texto-noticia', {
        body: { url: noticia.url }
      });

      if (!error && data?.success) {
        setConteudoFormatado({
          titulo: data.titulo || noticia.titulo,
          subtitulo: data.subtitulo || '',
          conteudo: data.conteudo || '',
          autor: data.autor || '',
          dataPublicacao: data.dataPublicacao || '',
          imagemUrl: data.imagemUrl || noticia.imagem_url || '',
          termos: data.termos || []
        });
      }
    } catch (err) {
      console.error('Erro ao carregar conteúdo formatado:', err);
    } finally {
      setLoadingFormatado(false);
    }
  };

  const carregarAnalise = async () => {
    if (!noticia?.url || analise) return;
    
    setLoadingAnalise(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-analise-noticia', {
        body: { titulo: noticia.titulo, url: noticia.url }
      });

      if (!error && data?.success !== false) {
        setAnalise({
          resumoExecutivo: data.resumoExecutivo || '',
          resumoFacil: data.resumoFacil || '',
          pontosPrincipais: data.pontosPrincipais || [],
          termos: data.termos || []
        });
      }
    } catch (err) {
      console.error('Erro ao carregar análise:', err);
    } finally {
      setLoadingAnalise(false);
    }
  };

  useEffect(() => {
    if (visualizacaoAtiva === 'analise' && noticia && !analise && !loadingAnalise) {
      carregarAnalise();
    }
  }, [visualizacaoAtiva, noticia]);

  const handleIframeError = () => {
    setIframeError(true);
  };

  const abrirExterno = () => {
    if (noticia?.url) {
      window.open(noticia.url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!noticia) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-muted-foreground mb-4">Notícia não encontrada</p>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  const renderTermos = (termos: Termo[]) => (
    <div className="space-y-3">
      {termos.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum termo identificado.</p>
      ) : (
        termos.map((t, idx) => (
          <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-amber-500 text-sm">{t.termo}</h4>
            <p className="text-foreground text-sm mt-1">{t.significado}</p>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header só aparece no modo Original */}
      {visualizacaoAtiva === 'original' && (
        <div className="px-3 py-2 border-b bg-background/95 backdrop-blur flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium line-clamp-2 text-foreground">
              {noticia.titulo}
            </h1>
            <p className="text-xs text-muted-foreground">{noticia.fonte}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={abrirExterno}
            className="flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Conteúdo baseado na visualização ativa */}
      <div className="flex-1 relative bg-background overflow-hidden">
        {visualizacaoAtiva === 'formatada' && (
          <ScrollArea className="h-full">
            <div className="p-4 pb-24">
              {loadingFormatado ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  <p className="text-sm text-muted-foreground">Formatando notícia...</p>
                </div>
              ) : conteudoFormatado ? (
                <>
                  {/* Sub-menu Formatada */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setSubMenuFormatada('noticia')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        subMenuFormatada === 'noticia'
                          ? 'bg-amber-500 text-white'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Notícia
                    </button>
                    <button
                      onClick={() => setSubMenuFormatada('termos')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        subMenuFormatada === 'termos'
                          ? 'bg-amber-500 text-white'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Termos ({conteudoFormatado.termos.length})
                    </button>
                  </div>

                  {subMenuFormatada === 'noticia' ? (
                    <article className="space-y-4">
                      {conteudoFormatado.imagemUrl && (
                        <img 
                          src={conteudoFormatado.imagemUrl} 
                          alt={conteudoFormatado.titulo}
                          className="w-full rounded-lg object-cover max-h-64"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      
                      <h1 className="text-xl font-bold text-foreground leading-tight">
                        {conteudoFormatado.titulo}
                      </h1>
                      
                      {conteudoFormatado.subtitulo && (
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {conteudoFormatado.subtitulo}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground border-b border-border pb-4">
                        {conteudoFormatado.autor && (
                          <span className="bg-muted px-2 py-1 rounded">{conteudoFormatado.autor}</span>
                        )}
                        {conteudoFormatado.dataPublicacao && (
                          <span className="bg-muted px-2 py-1 rounded">{conteudoFormatado.dataPublicacao}</span>
                        )}
                        <span className="bg-amber-500/20 text-amber-500 px-2 py-1 rounded">{noticia.fonte}</span>
                      </div>
                      
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-6 [&>p]:mb-6 [&>*+p]:mt-6 prose-strong:text-amber-500 prose-blockquote:border-l-amber-500 prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic">
                        <ReactMarkdown>
                          {conteudoFormatado.conteudo}
                        </ReactMarkdown>
                      </div>
                    </article>
                  ) : (
                    <div>
                      <h2 className="text-lg font-bold text-amber-500 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Termos da Notícia
                      </h2>
                      {renderTermos(conteudoFormatado.termos)}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <p className="text-sm text-muted-foreground">Não foi possível formatar a notícia</p>
                  <Button variant="outline" size="sm" onClick={() => setVisualizacaoAtiva('original')}>
                    Ver original
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {visualizacaoAtiva === 'original' && (
          <>
            {!iframeError ? (
              <iframe
                src={noticia.url}
                className="w-full h-full border-0"
                title={noticia.titulo}
                onError={handleIframeError}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Não foi possível carregar a página. Clique abaixo para abrir no navegador.
                </p>
                <Button onClick={abrirExterno}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir no navegador
                </Button>
              </div>
            )}
          </>
        )}

        {visualizacaoAtiva === 'analise' && (
          <ScrollArea className="h-full">
            <div className="p-4 pb-24">
              {loadingAnalise ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  <p className="text-sm text-muted-foreground">Gerando análise...</p>
                </div>
              ) : analise ? (
                <>
                  {/* Sub-menu Análise */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <button
                      onClick={() => setSubMenuAnalise('executivo')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        subMenuAnalise === 'executivo'
                          ? 'bg-amber-500 text-white'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Resumo Executivo
                    </button>
                    <button
                      onClick={() => setSubMenuAnalise('facil')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        subMenuAnalise === 'facil'
                          ? 'bg-amber-500 text-white'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Para Leigos
                    </button>
                    <button
                      onClick={() => setSubMenuAnalise('termos')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        subMenuAnalise === 'termos'
                          ? 'bg-amber-500 text-white'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Termos ({analise.termos.length})
                    </button>
                  </div>

                  {subMenuAnalise === 'executivo' && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Resumo Executivo
                        </h2>
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-foreground prose-p:mb-4 prose-strong:text-amber-500">
                          <ReactMarkdown>{analise.resumoExecutivo}</ReactMarkdown>
                        </div>
                      </div>

                      {analise.pontosPrincipais.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-base font-bold text-amber-500">Pontos Principais</h3>
                          <ul className="space-y-2">
                            {analise.pontosPrincipais.map((ponto, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-foreground">
                                <span className="text-amber-500 mt-1">•</span>
                                <span>{ponto}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {subMenuAnalise === 'facil' && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Entenda de Forma Simples
                      </h2>
                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-foreground prose-p:mb-4 prose-strong:text-amber-500">
                          <ReactMarkdown>{analise.resumoFacil}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {subMenuAnalise === 'termos' && (
                    <div>
                      <h2 className="text-lg font-bold text-amber-500 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Termos da Análise
                      </h2>
                      {renderTermos(analise.termos)}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <p className="text-sm text-muted-foreground">Não foi possível gerar análise</p>
                  <Button variant="outline" size="sm" onClick={carregarAnalise}>
                    Tentar novamente
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Menu de rodapé com 3 opções */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border">
        <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
          <button
            onClick={() => setVisualizacaoAtiva('formatada')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              visualizacaoAtiva === 'formatada' 
                ? 'text-amber-500 bg-amber-500/10' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-xs font-medium">Resumo</span>
          </button>

          <button
            onClick={() => setVisualizacaoAtiva('original')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              visualizacaoAtiva === 'original' 
                ? 'text-amber-500 bg-amber-500/10' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span className="text-xs font-medium">{noticia.fonte}</span>
          </button>

          <button
            onClick={() => setVisualizacaoAtiva('analise')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              visualizacaoAtiva === 'analise' 
                ? 'text-amber-500 bg-amber-500/10' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-medium">Análise</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticiaPoliticaDetalhes;
