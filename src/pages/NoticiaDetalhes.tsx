import { useLocation, useNavigate } from "react-router-dom";
import { ExternalLink, Loader2, FileText, Globe, Sparkles, BookOpen, ArrowLeft, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSubscription } from "@/contexts/SubscriptionContext";

import { supabase } from "@/integrations/supabase/client";

// Formatar data para "07/01/2026 às 12:20"
const formatarDataHora = (dataStr: string | null | undefined): string => {
  if (!dataStr) return '';
  try {
    const data = parseISO(dataStr);
    return format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dataStr;
  }
};
import { toast } from "sonner";

interface Noticia {
  id: string;
  categoria: string;
  portal: string;
  titulo: string;
  capa: string;
  link: string;
  dataHora: string;
  analise_ia?: string;
}

interface Termo {
  termo: string;
  significado: string;
}

interface AnaliseNoticia {
  resumoExecutivo: string;
  resumoFacil: string;
  pontosPrincipais: string[];
  impactoJuridico?: string;
}

type VisualizacaoAtiva = 'formatada' | 'original' | 'analise';
type SubMenuFormatada = 'noticia' | 'termos';
type SubMenuAnalise = 'executivo' | 'facil' | 'termos';

const NoticiaDetalhes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const noticia = location.state?.noticia as Noticia;
  
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState<VisualizacaoAtiva>('formatada');
  const [subMenuFormatada, setSubMenuFormatada] = useState<SubMenuFormatada>('noticia');
  const [subMenuAnalise, setSubMenuAnalise] = useState<SubMenuAnalise>('executivo');
  
  // Estados unificados para dados do cache
  const [conteudoFormatado, setConteudoFormatado] = useState<string>('');
  const [analise, setAnalise] = useState<AnaliseNoticia | null>(null);
  const [termos, setTermos] = useState<Termo[]>([]);
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (!noticia) {
      navigate('/noticias-juridicas');
    }
  }, [noticia, navigate]);

  // Carregar todos os dados do cache de uma vez
  useEffect(() => {
    if (noticia?.link) {
      carregarDadosCompletos();
    }
  }, [noticia?.link]);

  const carregarDadosCompletos = async () => {
    if (!noticia?.link) return;
    
    setLoading(true);
    
    // Timeout de 30 segundos para não ficar travado
    const timeoutId = setTimeout(() => {
      console.warn('Timeout ao processar notícia');
      setLoading(false);
      toast.error('Processamento demorou muito. Tente ver a notícia original.');
    }, 30000);
    
    try {
      // Determinar tabela correta baseado no tipo de notícia
      const isConcurso = noticia.id?.startsWith('concurso-');
      const tabela = isConcurso ? 'noticias_concursos_cache' : 'noticias_juridicas_cache';
      
      // 1. Primeiro, tentar buscar do cache existente
      const { data: cacheData, error: cacheError } = await supabase
        .from(tabela)
        .select('conteudo_formatado, analise_ia, termos_json, conteudo_completo')
        .eq('link', noticia.link)
        .maybeSingle();

      if (cacheData) {
        // Verificar se já tem dados processados
        // Para concursos, termos são opcionais (não exigir)
        const isConcursoNoticia = noticia.id?.startsWith('concurso-');
        const termosArr = Array.isArray(cacheData.termos_json) ? cacheData.termos_json : [];
        const temDadosCompletos = cacheData.conteudo_formatado && 
                                   cacheData.analise_ia && 
                                   (isConcursoNoticia || termosArr.length > 0);

        if (temDadosCompletos) {
          console.log('Usando dados do cache existente');
          processarDadosCache(cacheData);
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }
      }

      // 2. Se não tem dados completos, chamar Edge Function para processar
      console.log('Processando notícia com IA...');
      toast.info('Processando notícia...', { duration: 2000 });
      
      const { data: processedData, error: processError } = await supabase.functions.invoke(
        'processar-noticia-juridica',
        {
          body: { 
            url: noticia.link, 
            titulo: noticia.titulo,
            isConcurso: isConcurso
          }
        }
      );

      clearTimeout(timeoutId);

      if (processError) {
        console.error('Erro ao processar:', processError);
        // Fallback: usar dados parciais do cache se existirem
        if (cacheData) {
          processarDadosCache(cacheData);
        } else {
          toast.error('Não foi possível processar. Veja a notícia original.');
        }
        return;
      }

      if (processedData?.success) {
        // Usar dados processados
        setConteudoFormatado(processedData.conteudo_formatado || '');
        
        // Analise pode vir como objeto ou string JSON
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
      } else {
        // Processamento retornou mas sem sucesso
        toast.error('Falha no processamento. Veja a notícia original.');
      }

    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Erro ao carregar dados:', err);
      toast.error('Erro ao carregar notícia. Tente ver a original.');
    } finally {
      setLoading(false);
    }
  };

  // Função para renderizar conteúdo com separação visual clara entre parágrafos
  const renderizarConteudoFormatado = (texto: string) => {
    if (!texto) return null;
    
    // Dividir por quebras de linha (simples ou duplas)
    const paragrafos = texto
      .split(/\n{1,}/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    if (paragrafos.length === 0) return <p className="text-foreground text-sm">{texto}</p>;
    
    return (
      <>
        {/* Primeiro parágrafo como destaque */}
        <div className="border-l-4 border-primary bg-primary/10 p-4 rounded-r-lg">
          <p className="text-foreground text-sm leading-relaxed font-medium">
            {paragrafos[0]}
          </p>
        </div>
        
        {/* Demais parágrafos com separação visual */}
        {paragrafos.slice(1).map((paragrafo, idx) => (
          <div key={idx}>
            <p className="text-foreground text-sm leading-relaxed">
              {paragrafo}
            </p>
            {/* Adicionar divisor a cada 2 parágrafos */}
            {idx % 2 === 1 && idx < paragrafos.length - 2 && (
              <hr className="border-border my-4" />
            )}
          </div>
        ))}
      </>
    );
  };

  const processarDadosCache = (cacheData: any) => {
    // Conteúdo formatado - agora a renderização é feita diretamente no componente
    const conteudo = cacheData.conteudo_formatado || cacheData.conteudo_completo || '';
    setConteudoFormatado(conteudo);
    
    // Análise IA
    let analiseObj = cacheData.analise_ia;
    if (typeof analiseObj === 'string') {
      try {
        analiseObj = JSON.parse(analiseObj);
      } catch (e) {
        console.error('Erro ao parsear análise do cache:', e);
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
    
    // Termos
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

  const handleIframeError = () => {
    setIframeError(true);
  };

  const abrirExterno = () => {
    if (noticia?.link) {
      window.open(noticia.link, '_blank');
    }
  };

  if (!noticia) {
    return null;
  }

  const renderTermos = (termosLista: Termo[]) => (
    <div className="space-y-2">
      {termosLista.length === 0 ? (
        <p className="text-muted-foreground text-xs sm:text-sm">Nenhum termo identificado.</p>
      ) : (
        termosLista.map((t, idx) => (
          <div key={idx} className="p-2.5 sm:p-3 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-primary text-xs sm:text-sm">{t.termo}</h4>
            <p className="text-foreground text-[11px] sm:text-xs mt-1 leading-relaxed">{t.significado}</p>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header com botão voltar - MAIOR */}
      <div className="px-4 py-3 border-b bg-background/95 backdrop-blur flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/noticias-juridicas')}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center text-destructive-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm sm:text-base font-semibold line-clamp-2 text-foreground leading-snug">
            {noticia.titulo}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{noticia.portal}</p>
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

      {/* Conteúdo baseado na visualização ativa */}
      <div className="flex-1 relative bg-background overflow-hidden">
        {visualizacaoAtiva === 'formatada' && (
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4 pb-24">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Carregando e processando...</p>
                </div>
              ) : (
                <>
                  {/* Sub-menu Formatada */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setSubMenuFormatada('noticia')}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                        subMenuFormatada === 'noticia'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Notícia
                    </button>
                    <button
                      onClick={() => setSubMenuFormatada('termos')}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                        subMenuFormatada === 'termos'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Termos ({termos.length})
                    </button>
                  </div>

                  {subMenuFormatada === 'noticia' ? (
                    <article className="space-y-3">
                      {noticia.capa && (
                        <img 
                          src={noticia.capa} 
                          alt={noticia.titulo}
                          className="w-full rounded-lg object-cover max-h-48 sm:max-h-64"
                        />
                      )}
                      
                      <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                        {noticia.titulo}
                      </h1>
                      
                      <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-xs text-muted-foreground border-b border-border pb-3">
                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded">{noticia.portal}</span>
                        {noticia.dataHora && (
                          <span className="bg-muted px-2 py-0.5 rounded">{formatarDataHora(noticia.dataHora)}</span>
                        )}
                      </div>
                      
                      {conteudoFormatado ? (
                        <div className="space-y-4">
                          {renderizarConteudoFormatado(conteudoFormatado)}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          Conteúdo não disponível. Clique em "Original" para ver a notícia.
                        </p>
                      )}
                    </article>
                  ) : (
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-primary mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                        Termos Jurídicos
                      </h2>
                      {renderTermos(termos)}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        )}

        {visualizacaoAtiva === 'original' && (
          <>
            {!iframeError ? (
              <iframe
                src={noticia.link}
                className="w-full h-full border-0"
                title={noticia.titulo}
                onError={handleIframeError}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <p className="text-muted-foreground mb-4 text-xs sm:text-sm">
                  Não foi possível carregar a página. Clique abaixo para abrir no navegador.
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
            <div className="p-3 sm:p-4 pb-24">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Carregando análise...</p>
                </div>
              ) : analise ? (
                <>
                  {/* Sub-menu Análise */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <button
                      onClick={() => setSubMenuAnalise('executivo')}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                        subMenuAnalise === 'executivo'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Resumo Executivo
                    </button>
                    <button
                      onClick={() => setSubMenuAnalise('facil')}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                        subMenuAnalise === 'facil'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Para Leigos
                    </button>
                    <button
                      onClick={() => setSubMenuAnalise('termos')}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                        subMenuAnalise === 'termos'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Termos ({termos.length})
                    </button>
                  </div>

                  {/* Gate Premium para Análise */}
                  {!isPremium && !loadingSubscription ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-amber-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                          <Crown className="w-5 h-5 text-amber-500" />
                          Análise Premium
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                          A análise jurídica detalhada com IA é exclusiva para assinantes Premium.
                        </p>
                      </div>
                      <Button 
                        onClick={() => navigate('/assinatura')}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white gap-2"
                      >
                        <Crown className="w-4 h-4" />
                        Seja Premium
                      </Button>
                    </div>
                  ) : (
                    <>
                      {subMenuAnalise === 'executivo' && (
                        <div className="space-y-5">
                          <div className="space-y-3">
                            <h2 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                              Resumo Executivo
                            </h2>
                            <div className="text-foreground text-base sm:text-lg leading-relaxed space-y-4">
                              {(analise.resumoExecutivo || 'Resumo não disponível.')
                                .split(/\n\n|\n/)
                                .filter((p: string) => p.trim())
                                .map((paragrafo: string, idx: number) => (
                                  <p key={idx}>{paragrafo.trim()}</p>
                                ))}
                            </div>
                          </div>

                          {analise.pontosPrincipais && analise.pontosPrincipais.length > 0 && (
                            <div className="space-y-3">
                              <h3 className="text-base sm:text-lg font-bold text-primary">Pontos Principais</h3>
                              <ul className="space-y-2">
                                {analise.pontosPrincipais.map((ponto, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-foreground text-base sm:text-lg">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span>{ponto}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {analise.impactoJuridico && (
                            <div className="space-y-3">
                              <h3 className="text-base sm:text-lg font-bold text-primary">Impacto Jurídico</h3>
                              <div className="text-foreground text-base sm:text-lg leading-relaxed bg-muted/50 p-4 rounded-lg space-y-3">
                                {analise.impactoJuridico
                                  .split(/\n\n|\n/)
                                  .filter((p: string) => p.trim())
                                  .map((paragrafo: string, idx: number) => (
                                    <p key={idx}>{paragrafo.trim()}</p>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {subMenuAnalise === 'facil' && (
                        <div className="space-y-4">
                          <h2 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                            Entenda de Forma Simples
                          </h2>
                          <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-4">
                            {(analise.resumoFacil || 'Explicação simplificada não disponível.')
                              .split(/\n\n|\n/)
                              .filter((p: string) => p.trim())
                              .map((paragrafo: string, idx: number) => (
                                <p key={idx} className="text-foreground text-base sm:text-lg leading-relaxed">{paragrafo.trim()}</p>
                              ))}
                          </div>
                        </div>
                      )}

                      {subMenuAnalise === 'termos' && (
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                            Termos Jurídicos
                          </h2>
                          {renderTermos(termos)}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <p className="text-sm text-muted-foreground">Análise não disponível</p>
                  <Button variant="outline" size="sm" onClick={() => setVisualizacaoAtiva('original')}>
                    Ver original
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Menu de Rodapé Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
        <div className="flex justify-around items-center py-2 px-4">
          <button
            onClick={() => setVisualizacaoAtiva('formatada')}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
              visualizacaoAtiva === 'formatada'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-medium">Resumo</span>
          </button>
          
          <button
            onClick={() => setVisualizacaoAtiva('original')}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
              visualizacaoAtiva === 'original'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-medium truncate max-w-[60px]">{noticia.portal}</span>
          </button>
          
          <button
            onClick={() => setVisualizacaoAtiva('analise')}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
              visualizacaoAtiva === 'analise'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-medium">Análise</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticiaDetalhes;
