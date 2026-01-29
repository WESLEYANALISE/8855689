import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, ExternalLink, Loader2, FileText, Globe, 
  Sparkles, BookOpen, Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Noticia {
  id: string;
  titulo: string;
  descricao: string | null;
  url: string | null;
  fonte: string | null;
  imagem_url: string | null;
  data_publicacao: string | null;
  conteudo_formatado?: string | null;
  analise_ia?: string | null;
  termos?: Array<{ termo: string; significado: string }> | null;
}

interface AnaliseNoticia {
  resumoExecutivo: string;
  resumoFacil: string;
  pontosPrincipais: string[];
  impactoJuridico?: string;
}

type VisualizacaoAtiva = 'resumo' | 'original' | 'analise';

const SeAprofundeNoticia = () => {
  const { instituicao, noticiaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [noticia, setNoticia] = useState<Noticia | null>(location.state?.noticia || null);
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState<VisualizacaoAtiva>('resumo');
  const [conteudoFormatado, setConteudoFormatado] = useState<string>('');
  const [analise, setAnalise] = useState<AnaliseNoticia | null>(null);
  const [termos, setTermos] = useState<Array<{ termo: string; significado: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (noticia) {
      carregarDadosCompletos();
    } else if (noticiaId) {
      fetchNoticia();
    }
  }, [noticiaId, noticia]);

  const fetchNoticia = async () => {
    try {
      setLoading(true);
      
      // Tentar buscar de aprofundamento_noticias
      let { data, error } = await supabase
        .from("aprofundamento_noticias")
        .select("*")
        .eq("id", noticiaId)
        .single();

      if (error || !data) {
        // Tentar de noticias_juridicas_cache
        const { data: cacheData } = await supabase
          .from("noticias_juridicas_cache")
          .select("*")
          .eq("id", noticiaId)
          .single();

        if (cacheData) {
          const termosArr = Array.isArray(cacheData.termos_json) 
            ? cacheData.termos_json as Array<{ termo: string; significado: string }>
            : [];
          setNoticia({
            id: cacheData.id,
            titulo: cacheData.titulo,
            descricao: cacheData.descricao,
            url: cacheData.link,
            fonte: cacheData.fonte,
            imagem_url: cacheData.imagem_webp || cacheData.imagem,
            data_publicacao: cacheData.data_publicacao,
            conteudo_formatado: cacheData.conteudo_formatado,
            analise_ia: cacheData.analise_ia as string | null,
            termos: termosArr
          });
        }
      } else {
        const termosArr = Array.isArray(data.termos) 
          ? data.termos as Array<{ termo: string; significado: string }>
          : [];
        setNoticia({
          id: data.id,
          titulo: data.titulo,
          descricao: data.descricao,
          url: data.url,
          fonte: data.fonte,
          imagem_url: data.imagem_webp || data.imagem_url,
          data_publicacao: data.data_publicacao,
          conteudo_formatado: data.conteudo_formatado,
          analise_ia: data.analise_ia,
          termos: termosArr
        });
      }
    } catch (error) {
      console.error("Erro ao buscar notícia:", error);
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosCompletos = async () => {
    if (!noticia?.url) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // Verificar se já tem dados no cache
      const { data: cacheData } = await supabase
        .from('noticias_juridicas_cache')
        .select('conteudo_formatado, analise_ia, termos_json')
        .eq('link', noticia.url)
        .single();

      if (cacheData?.conteudo_formatado && cacheData?.analise_ia) {
        processarDadosCache(cacheData);
        setLoading(false);
        return;
      }

      // Se não tem, processar com IA
      toast.info('Processando notícia...', { duration: 2000 });
      
      const { data: processedData, error } = await supabase.functions.invoke(
        'processar-noticia-juridica',
        {
          body: { 
            url: noticia.url, 
            titulo: noticia.titulo 
          }
        }
      );

      if (error) {
        console.error('Erro ao processar:', error);
        if (cacheData) {
          processarDadosCache(cacheData);
        }
        return;
      }

      if (processedData?.success) {
        setConteudoFormatado(processedData.conteudo_formatado || '');
        
        let analiseObj = processedData.analise_ia;
        if (typeof analiseObj === 'string') {
          try {
            analiseObj = JSON.parse(analiseObj);
          } catch (e) {
            console.error('Erro ao parsear análise:', e);
          }
        }
        
        if (analiseObj) {
          setAnalise({
            resumoExecutivo: analiseObj.resumoExecutivo || '',
            resumoFacil: analiseObj.resumoFacil || '',
            pontosPrincipais: analiseObj.pontosPrincipais || [],
            impactoJuridico: analiseObj.impactoJuridico || ''
          });
        }
        
        setTermos(processedData.termos_json || []);
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      toast.error('Erro ao carregar notícia');
    } finally {
      setLoading(false);
    }
  };

  const processarDadosCache = (cacheData: any) => {
    setConteudoFormatado(cacheData.conteudo_formatado || '');
    
    let analiseObj = cacheData.analise_ia;
    if (typeof analiseObj === 'string') {
      try {
        analiseObj = JSON.parse(analiseObj);
      } catch (e) {
        console.error('Erro ao parsear análise:', e);
      }
    }
    
    if (analiseObj && typeof analiseObj === 'object') {
      setAnalise({
        resumoExecutivo: analiseObj.resumoExecutivo || analiseObj.resumo_executivo || '',
        resumoFacil: analiseObj.resumoFacil || analiseObj.resumo_facil || '',
        pontosPrincipais: analiseObj.pontosPrincipais || analiseObj.pontos_principais || [],
        impactoJuridico: analiseObj.impactoJuridico || analiseObj.impacto_juridico || ''
      });
    }
    
    let termosArr = cacheData.termos_json || [];
    if (typeof termosArr === 'string') {
      try {
        termosArr = JSON.parse(termosArr);
      } catch (e) {
        termosArr = [];
      }
    }
    setTermos(Array.isArray(termosArr) ? termosArr : []);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const abrirExterno = () => {
    if (noticia?.url) {
      window.open(noticia.url, '_blank');
    }
  };

  if (loading && !noticia) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!noticia) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Notícia não encontrada</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-background/95 backdrop-blur flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/se-aprofunde/${instituicao}`)}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center text-destructive-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold line-clamp-2 text-foreground leading-snug">
            {noticia.titulo}
          </h1>
          <p className="text-xs text-muted-foreground">{noticia.fonte}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={abrirExterno}>
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 relative bg-background overflow-hidden">
        {visualizacaoAtiva === 'resumo' && (
          <ScrollArea className="h-full">
            <div className="p-4 pb-24">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Processando...</p>
                </div>
              ) : (
                <article className="space-y-4">
                  {noticia.imagem_url && (
                    <img 
                      src={noticia.imagem_url} 
                      alt={noticia.titulo}
                      className="w-full rounded-lg object-cover max-h-48"
                    />
                  )}
                  
                  <h1 className="text-lg font-bold text-foreground leading-tight">
                    {noticia.titulo}
                  </h1>
                  
                  <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground border-b border-border pb-3">
                    {noticia.fonte && (
                      <Badge variant="secondary">{noticia.fonte}</Badge>
                    )}
                    {noticia.data_publicacao && (
                      <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" />
                        {formatDate(noticia.data_publicacao)}
                      </span>
                    )}
                  </div>
                  
                  {conteudoFormatado ? (
                    <div className="space-y-4">
                      {conteudoFormatado.split(/\n{1,}/).map((p, idx) => p.trim() && (
                        <p key={idx} className="text-sm text-foreground leading-relaxed">
                          {p.trim()}
                        </p>
                      ))}
                    </div>
                  ) : noticia.descricao ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {noticia.descricao}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Clique em "Original" para ver a notícia completa.
                    </p>
                  )}

                  {/* Termos jurídicos */}
                  {termos.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <h2 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Termos Jurídicos ({termos.length})
                      </h2>
                      <div className="space-y-2">
                        {termos.map((t, idx) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border">
                            <h4 className="font-semibold text-primary text-xs">{t.termo}</h4>
                            <p className="text-foreground text-xs mt-1 leading-relaxed">{t.significado}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              )}
            </div>
          </ScrollArea>
        )}

        {visualizacaoAtiva === 'original' && (
          <>
            {!iframeError && noticia.url ? (
              <iframe
                src={noticia.url}
                className="w-full h-full border-0"
                title={noticia.titulo}
                onError={() => setIframeError(true)}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <p className="text-muted-foreground mb-4 text-sm">
                  Não foi possível carregar a página.
                </p>
                <Button onClick={abrirExterno} size="sm">
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
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Carregando análise...</p>
                </div>
              ) : analise ? (
                <div className="space-y-6">
                  {/* Resumo Executivo */}
                  <div className="space-y-3">
                    <h2 className="text-base font-bold text-primary flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Resumo Executivo
                    </h2>
                    <p className="text-sm text-foreground leading-relaxed">
                      {analise.resumoExecutivo || 'Não disponível.'}
                    </p>
                  </div>

                  {/* Pontos Principais */}
                  {analise.pontosPrincipais && analise.pontosPrincipais.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-foreground">Pontos Principais</h3>
                      <ul className="space-y-2">
                        {analise.pontosPrincipais.map((ponto, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{ponto}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Para Leigos */}
                  {analise.resumoFacil && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <h3 className="text-sm font-bold text-foreground">Explicação Simples</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analise.resumoFacil}
                      </p>
                    </div>
                  )}

                  {/* Impacto Jurídico */}
                  {analise.impactoJuridico && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-foreground">Impacto Jurídico</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analise.impactoJuridico}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Análise não disponível</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer com navegação */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t">
        <div className="flex justify-center gap-2">
          <Button
            variant={visualizacaoAtiva === 'resumo' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVisualizacaoAtiva('resumo')}
            className="flex-1 max-w-[120px]"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Resumo
          </Button>
          <Button
            variant={visualizacaoAtiva === 'original' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVisualizacaoAtiva('original')}
            className="flex-1 max-w-[120px]"
          >
            <Globe className="w-4 h-4 mr-1.5" />
            Original
          </Button>
          <Button
            variant={visualizacaoAtiva === 'analise' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVisualizacaoAtiva('analise')}
            className="flex-1 max-w-[120px]"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Análise
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeAprofundeNoticia;
