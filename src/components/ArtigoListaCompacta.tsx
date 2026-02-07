import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, CheckCircle, BookOpen, List, ChevronDown, History, AlertTriangle, Plus, Edit, Eye, Trash2, Sparkles, X, ArrowRight, Calendar, Music, Flame, Play, Pause, Trophy, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { ArtigosFavoritosList } from "@/components/ArtigosFavoritosList";

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

interface Capitulo {
  id: string;
  titulo: string;
  tipo: 'titulo' | 'capitulo' | 'secao' | 'subsecao' | 'livro' | 'parte';
  artigos: Article[];
  artigoInicio?: string;
  artigoFim?: string;
}

interface AlteracaoHistorica {
  id: number;
  numero_artigo: string;
  elemento_tipo: string;
  elemento_numero: string | null;
  tipo_alteracao: string;
  lei_alteradora: string | null;
  ano_alteracao: number | null;
  mes_alteracao?: number | null;
  dia_alteracao?: number | null;
  texto_completo: string | null;
  texto_anterior?: string | null;
  url_lei_alteradora: string | null;
}

interface RankedArticle {
  id: number;
  "Número do Artigo": string;
  Artigo: string;
  visualizacoes: number;
  ultima_visualizacao: string | null;
}

interface ArtigoListaCompactaProps {
  articles: Article[];
  onArtigoClick?: (article: Article) => void;
  searchQuery?: string;
  onScrollPastArticle7?: (isPast: boolean) => void;
  scrollAreaRef?: React.RefObject<HTMLDivElement>;
  targetArticleNumber?: string | null;
  onScrollComplete?: () => void;
  artigosComNarracao?: Set<number>;
  tabelaLei?: string;
  codigoNome?: string;
}

// Função para highlight de texto
const highlightText = (text: string, query?: string) => {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) => 
    regex.test(part) ? (
      <mark key={i} className="bg-amber-500/20 text-amber-500 font-medium">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

// Função para preview de texto
const getPreviewText = (content: string) => {
  const cleanText = content.replace(/\n/g, ' ').trim();
  return cleanText.length > 120 ? cleanText.substring(0, 120) + '...' : cleanText;
};

// Detectar capítulos a partir dos artigos
// Os capítulos são registros separados com "Número do Artigo" = null
const detectarCapitulos = (articles: Article[]): Capitulo[] => {
  const capitulos: Capitulo[] = [];
  let capituloAtual: Capitulo | null = null;
  
  // Padrões para detectar estruturas hierárquicas
  const padroes = [
    { regex: /^PARTE\s+(GERAL|ESPECIAL|[IVXLCDM]+|\d+)/i, tipo: 'parte' as const },
    { regex: /^LIVRO\s+[IVXLCDM]+/i, tipo: 'livro' as const },
    { regex: /^TÍTULO\s+[IVXLCDM]+/i, tipo: 'titulo' as const },
    { regex: /^CAPÍTULO\s+[IVXLCDM]+/i, tipo: 'capitulo' as const },
    { regex: /^SEÇÃO\s+[IVXLCDM]+/i, tipo: 'secao' as const },
    { regex: /^SUBSEÇÃO\s+[IVXLCDM]+/i, tipo: 'subsecao' as const },
  ];
  
  // Função para verificar se é um registro de cabeçalho (sem número de artigo)
  const ehCabecalhoCapitulo = (article: Article): { titulo: string; tipo: Capitulo['tipo'] } | null => {
    const temNumero = article["Número do Artigo"] && article["Número do Artigo"].trim() !== "";
    if (temNumero) return null; // Artigos numerados não são cabeçalhos
    
    const conteudo = article["Artigo"] || "";
    const linhas = conteudo.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Procurar por estrutura de capítulo nas primeiras linhas
    for (const linha of linhas) {
      for (const padrao of padroes) {
        if (padrao.regex.test(linha)) {
          // Construir título com todas as linhas relevantes
          const tituloLinhas = linhas.filter(l => 
            !l.startsWith('Art.') && 
            !l.startsWith('LEI ') &&
            !l.startsWith('O PRESIDENTE') &&
            !l.startsWith('Código Penal')
          );
          const titulo = tituloLinhas.slice(0, 3).join(' › ').replace(/\s+/g, ' ');
          return { titulo, tipo: padrao.tipo };
        }
      }
    }
    
    return null;
  };
  
  // Ordenar artigos por id para garantir ordem correta
  const artigosOrdenados = [...articles].sort((a, b) => a.id - b.id);
  
  artigosOrdenados.forEach((article) => {
    const temNumero = article["Número do Artigo"] && article["Número do Artigo"].trim() !== "";
    
    // Verificar se é um registro de cabeçalho de capítulo (sem número)
    const cabecalho = ehCabecalhoCapitulo(article);
    
    if (cabecalho) {
      // Salvar capítulo anterior se existir
      if (capituloAtual && capituloAtual.artigos.length > 0) {
        capitulos.push(capituloAtual);
      }
      
      // Criar novo capítulo
      capituloAtual = {
        id: `cap-${capitulos.length + 1}`,
        titulo: cabecalho.titulo,
        tipo: cabecalho.tipo,
        artigos: [],
      };
    } else if (temNumero) {
      // É um artigo numerado - adicionar ao capítulo atual
      if (!capituloAtual) {
        capituloAtual = {
          id: 'cap-inicial',
          titulo: 'Disposições Preliminares',
          tipo: 'capitulo',
          artigos: [],
        };
      }
      capituloAtual.artigos.push(article);
      
      // Atualizar range de artigos
      if (!capituloAtual.artigoInicio) {
        capituloAtual.artigoInicio = article["Número do Artigo"] || undefined;
      }
      capituloAtual.artigoFim = article["Número do Artigo"] || undefined;
    }
  });
  
  // Adicionar último capítulo
  if (capituloAtual && capituloAtual.artigos.length > 0) {
    capitulos.push(capituloAtual);
  }
  
  return capitulos;
};

// Card de artigo individual
const ArtigoCard = ({ 
  article, 
  onArtigoClick, 
  isHighlighted, 
  searchQuery,
  hasNarracao 
}: { 
  article: Article;
  onArtigoClick?: (article: Article) => void;
  isHighlighted?: boolean;
  searchQuery?: string;
  hasNarracao?: boolean;
}) => {
  const numeroArtigo = article["Número do Artigo"] || "S/N";
  const conteudo = article["Artigo"] || "Conteúdo não disponível";
  const preview = getPreviewText(conteudo);

  return (
    <Card
      className={`cursor-pointer hover:bg-muted/50 transition-colors border-l-4 ${
        isHighlighted 
          ? 'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] bg-amber-500/5' 
          : ''
      }`}
      style={{
        borderLeftColor: "hsl(38, 92%, 50%)",
      }}
      onClick={() => onArtigoClick?.(article)}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex-shrink-0">
          <Scale className={`w-5 h-5 ${isHighlighted ? 'text-amber-400' : 'text-amber-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm ${isHighlighted ? 'text-amber-500' : ''}`}>
            {highlightText(`Art. ${numeroArtigo}`, searchQuery)}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {highlightText(preview, searchQuery)}
          </p>
        </div>
        {hasNarracao && (
          <div className="flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-amber-500" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Formatar data completa
const formatarDataCompleta = (dia?: number | null, mes?: number | null, ano?: number | null) => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  if (!ano) return 'S/D';
  if (!mes) return `${ano}`;
  if (!dia) return `${meses[mes - 1]}/${ano}`;
  
  return `${dia.toString().padStart(2, '0')}/${meses[mes - 1]}/${ano}`;
};

// Componente de lista de alterações com responsividade
const AlteracoesLista = ({
  alteracoesPorArtigo,
  getAlteracaoCor,
  getElementoIcon,
}: {
  alteracoesPorArtigo: Record<string, AlteracaoHistorica[]>;
  getAlteracaoCor: (tipo: string) => { bg: string; text: string; border: string };
  getElementoIcon: (tipo: string) => string;
}) => {
  const [explicacaoModal, setExplicacaoModal] = useState<{
    open: boolean;
    alteracao: AlteracaoHistorica | null;
    explicacao: string;
    loading: boolean;
  }>({ open: false, alteracao: null, explicacao: '', loading: false });

  const buscarExplicacao = async (alt: AlteracaoHistorica) => {
    setExplicacaoModal({ open: true, alteracao: alt, explicacao: '', loading: true });
    
    try {
      const { data, error } = await supabase.functions.invoke('explicar-com-gemini', {
        body: {
          contexto: 'alteracao_legislativa',
          dados: JSON.stringify({
            tipo: alt.tipo_alteracao,
            artigo: alt.numero_artigo,
            elemento: alt.elemento_tipo,
            texto_atual: alt.texto_completo,
            texto_anterior: alt.texto_anterior,
            lei_alteradora: alt.lei_alteradora,
            ano: alt.ano_alteracao,
          }),
          linguagemMode: 'simplificado'
        }
      });

      if (error) throw error;
      setExplicacaoModal(prev => ({ ...prev, explicacao: data?.explicacao || 'Explicação não disponível.', loading: false }));
    } catch (err) {
      console.error('Erro ao buscar explicação:', err);
      setExplicacaoModal(prev => ({ 
        ...prev, 
        explicacao: `**O que mudou:**\n\n${alt.tipo_alteracao === 'Revogação' ? 'Este dispositivo foi revogado, ou seja, deixou de fazer parte do ordenamento jurídico.' : alt.tipo_alteracao === 'Inclusão' ? 'Este dispositivo foi incluído na lei, trazendo uma nova regra ou norma.' : alt.tipo_alteracao === 'Redação' ? 'O texto deste dispositivo foi modificado, alterando sua redação original.' : 'Esta alteração modificou o dispositivo legal.'}${alt.texto_anterior ? `\n\n**Texto anterior:**\n${alt.texto_anterior}` : ''}${alt.texto_completo ? `\n\n**Texto atual:**\n${alt.texto_completo}` : ''}${alt.lei_alteradora ? `\n\n**Lei responsável:** ${alt.lei_alteradora}` : ''}`,
        loading: false 
      }));
    }
  };

  return (
    <>
      {/* Modal de Explicação */}
      <Dialog open={explicacaoModal.open} onOpenChange={(open) => !open && setExplicacaoModal(prev => ({ ...prev, open: false }))}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Explicação da Alteração
            </DialogTitle>
          </DialogHeader>
          
          {explicacaoModal.loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Gerando explicação...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {explicacaoModal.alteracao && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getAlteracaoCor(explicacaoModal.alteracao.tipo_alteracao).bg} ${getAlteracaoCor(explicacaoModal.alteracao.tipo_alteracao).text} border-0`}>
                      {explicacaoModal.alteracao.tipo_alteracao}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Art. {explicacaoModal.alteracao.numero_artigo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatarDataCompleta(
                        explicacaoModal.alteracao.dia_alteracao,
                        explicacaoModal.alteracao.mes_alteracao,
                        explicacaoModal.alteracao.ano_alteracao
                      )}
                    </span>
                    {explicacaoModal.alteracao.lei_alteradora && (
                      <span className="ml-2">• {explicacaoModal.alteracao.lei_alteradora}</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {explicacaoModal.explicacao.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('**') ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lista de alterações */}
      <div className="space-y-3">
        {Object.entries(alteracoesPorArtigo)
          .map(([artigo, alts]) => ({
            artigo,
            alts,
            dataMaisRecente: alts.reduce((max, a) => {
              const dataAtual = (a.ano_alteracao || 0) * 10000 + (a.mes_alteracao || 0) * 100 + (a.dia_alteracao || 0);
              return dataAtual > max.valor ? { valor: dataAtual, ano: a.ano_alteracao, mes: a.mes_alteracao, dia: a.dia_alteracao } : max;
            }, { valor: 0, ano: 0, mes: 0, dia: 0 })
          }))
          .sort((a, b) => b.dataMaisRecente.valor - a.dataMaisRecente.valor)
          .map(({ artigo, alts, dataMaisRecente }) => {
            const tiposUnicos = [...new Set(alts.map(a => a.tipo_alteracao))];
            const altsPorData = alts.sort((a, b) => {
              const dataA = (a.ano_alteracao || 0) * 10000 + (a.mes_alteracao || 0) * 100 + (a.dia_alteracao || 0);
              const dataB = (b.ano_alteracao || 0) * 10000 + (b.mes_alteracao || 0) * 100 + (b.dia_alteracao || 0);
              return dataB - dataA;
            });
            
            return (
              <Collapsible key={artigo} className="group">
                <Card className="overflow-hidden hover:shadow-md transition-all">
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-0 cursor-pointer">
                      <div className="flex">
                        {/* Destaque da Data - Responsivo */}
                        <div className="flex-shrink-0 w-16 sm:w-24 bg-gradient-to-b from-amber-500/50 to-orange-600/40 flex flex-col items-center justify-center p-2 sm:p-3 text-white">
                          <span className="text-lg sm:text-2xl font-bold">{dataMaisRecente.ano || '—'}</span>
                          {dataMaisRecente.mes && (
                            <span className="text-[10px] sm:text-xs opacity-90 font-medium">
                              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][dataMaisRecente.mes - 1]}
                            </span>
                          )}
                        </div>
                        
                        {/* Conteúdo - Responsivo */}
                        <div className="flex-1 p-2 sm:p-4 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-lg bg-muted items-center justify-center">
                              <Scale className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm sm:text-base truncate">Art. {artigo}</h3>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">
                                {alts.length} alteração(ões)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <div className="hidden sm:flex flex-wrap justify-end gap-1">
                              {tiposUnicos.slice(0, 2).map(tipo => {
                                const cor = getAlteracaoCor(tipo);
                                return (
                                  <Badge key={tipo} variant="outline" className={`text-[10px] px-2 py-0.5 ${cor.text} ${cor.bg} border-0`}>
                                    {tipo}
                                  </Badge>
                                );
                              })}
                            </div>
                            {/* Badge compacto mobile */}
                            <div className="sm:hidden">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-muted">
                                {tiposUnicos.length}
                              </Badge>
                            </div>
                            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t border-border bg-muted/30">
                      <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
                        {altsPorData.map((alt) => {
                          const cor = getAlteracaoCor(alt.tipo_alteracao);
                          const IconComponent = 
                            alt.tipo_alteracao === 'Revogação' || alt.tipo_alteracao === 'Supressão' ? Trash2 :
                            alt.tipo_alteracao === 'Inclusão' || alt.tipo_alteracao === 'Acréscimo' ? Plus :
                            alt.tipo_alteracao === 'Redação' ? Edit :
                            alt.tipo_alteracao === 'Vide' ? Eye :
                            AlertTriangle;
                          
                          return (
                            <div 
                              key={alt.id}
                              className={`rounded-lg border overflow-hidden ${cor.border}/30`}
                            >
                              {/* Header com data completa em destaque */}
                              <div className={`flex flex-wrap items-center gap-2 p-2 sm:p-3 ${cor.bg}`}>
                                {/* Data completa */}
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 ${cor.text} font-bold text-xs sm:text-sm`}>
                                  <Calendar className="w-3 h-3" />
                                  {formatarDataCompleta(alt.dia_alteracao, alt.mes_alteracao, alt.ano_alteracao)}
                                </div>
                                <Badge className={`${cor.bg} ${cor.text} border-0 font-semibold text-[10px] sm:text-xs`}>
                                  <IconComponent className="w-3 h-3 mr-1" />
                                  {alt.tipo_alteracao}
                                </Badge>
                                {alt.elemento_tipo && alt.elemento_tipo !== 'artigo' && (
                                  <Badge variant="outline" className="text-[9px] sm:text-[10px] bg-background/50">
                                    {getElementoIcon(alt.elemento_tipo)} {alt.elemento_tipo}
                                    {alt.elemento_numero && ` ${alt.elemento_numero}`}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Corpo */}
                              <div className="p-2 sm:p-3 bg-background">
                                {alt.texto_completo && (
                                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed line-clamp-3">
                                    {alt.texto_completo}
                                  </p>
                                )}
                                
                                <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                                  {alt.lei_alteradora ? (
                                    <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                                      <span className="opacity-60 hidden sm:inline">Alterado por:</span>
                                      {alt.url_lei_alteradora ? (
                                        <a 
                                          href={alt.url_lei_alteradora} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline font-medium truncate"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {alt.lei_alteradora}
                                        </a>
                                      ) : (
                                        <span className="font-medium truncate">{alt.lei_alteradora}</span>
                                      )}
                                    </p>
                                  ) : <span />}
                                  
                                  {/* Botão Explicar */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 sm:px-3 text-[10px] sm:text-xs text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      buscarExplicacao(alt);
                                    }}
                                  >
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Explicar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
      </div>
    </>
  );
};

export const ArtigoListaCompacta = ({ 
  articles, 
  onArtigoClick,
  searchQuery,
  onScrollPastArticle7,
  scrollAreaRef: externalScrollRef,
  targetArticleNumber,
  onScrollComplete,
  artigosComNarracao,
  tabelaLei,
  codigoNome = "Código",
}: ArtigoListaCompactaProps) => {
  const [highlightedArticleId, setHighlightedArticleId] = useState<number | null>(null);
  const [modoVisualizacao, setModoVisualizacao] = useState<'artigos' | 'capitulos' | 'alteracoes'>('artigos');
  const [subModoConteudo, setSubModoConteudo] = useState<'lista' | 'playlist' | 'emalta' | 'favoritos'>('lista');
  const [capituloExpandido, setCapituloExpandido] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const articleRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  
  // Audio player context para playlist
  const { playAudio, setPlaylist, currentAudio, isPlaying, togglePlayPause } = useAudioPlayer();

  // Buscar alterações históricas (sempre ativo para pré-carregar)
  const { data: alteracoesHistoricas = [], isLoading: isLoadingAlteracoes } = useQuery({
    queryKey: ['alteracoes-historicas', tabelaLei],
    queryFn: async () => {
      if (!tabelaLei) return [];
      const { data, error } = await supabase
        .from('historico_alteracoes')
        .select('*')
        .eq('tabela_lei', tabelaLei)
        .order('numero_artigo', { ascending: true });
      
      if (error) throw error;
      return (data || []) as AlteracaoHistorica[];
    },
    enabled: !!tabelaLei,
    staleTime: 1000 * 60 * 30, // 30 minutos de cache
    refetchOnWindowFocus: false,
  });

  // Buscar ranking de artigos (Em Alta)
  const { data: rankedArticles = [], isLoading: isLoadingRanking } = useQuery({
    queryKey: ['ranking-artigos-inline', tabelaLei],
    queryFn: async () => {
      if (!tabelaLei) return [];
      try {
        const { data: visualizacoes, error: visError } = await supabase
          .from('artigos_visualizacoes')
          .select('numero_artigo, visualizado_em')
          .eq('tabela_codigo', tabelaLei);

        if (visError) throw visError;
        if (!visualizacoes || visualizacoes.length === 0) return [];

        const contagem = visualizacoes.reduce((acc, vis) => {
          const num = vis.numero_artigo;
          if (!acc[num]) {
            acc[num] = { count: 0, ultimaVis: vis.visualizado_em };
          }
          acc[num].count++;
          if (new Date(vis.visualizado_em) > new Date(acc[num].ultimaVis)) {
            acc[num].ultimaVis = vis.visualizado_em;
          }
          return acc;
        }, {} as Record<string, { count: number; ultimaVis: string }>);

        const artigosOrdenados = Object.entries(contagem)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 20)
          .map(([numero, data]) => ({ numero, ...data }));

        if (artigosOrdenados.length === 0) return [];

        const numerosArtigos = artigosOrdenados.map(a => a.numero);
        const { data: artigos, error: artError } = await supabase
          .from(tabelaLei as any)
          .select('id, "Número do Artigo", Artigo')
          .in('Número do Artigo', numerosArtigos);

        if (artError) throw artError;
        if (!artigos) return [];

        const artigosMap = new Map((artigos as any[]).map(a => [a["Número do Artigo"], a]));
        
        return artigosOrdenados
          .map(item => {
            const artigo = artigosMap.get(item.numero);
            if (!artigo) return null;
            return {
              id: artigo.id,
              "Número do Artigo": artigo["Número do Artigo"],
              Artigo: artigo.Artigo,
              visualizacoes: item.count,
              ultima_visualizacao: item.ultimaVis
            };
          })
          .filter((item): item is RankedArticle => item !== null);
      } catch (error) {
        console.error('Erro na query de ranking:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos de cache
    refetchOnWindowFocus: false,
    enabled: !!tabelaLei,
  });

  // Artigos com áudio para playlist
  const articlesWithAudio = useMemo(() => 
    articles.filter(article => 
      article["Narração"] && 
      article["Narração"].trim() !== "" &&
      article["Número do Artigo"] &&
      article["Número do Artigo"].trim() !== ""
    ), [articles]
  );

  // Preparar playlist quando mudar para modo playlist
  useEffect(() => {
    if (subModoConteudo === 'playlist' && articlesWithAudio.length > 0) {
      const audioItems = articlesWithAudio.map((article) => ({
        id: article.id,
        titulo: `Art. ${article["Número do Artigo"]} - ${codigoNome}`,
        url_audio: article["Narração"] || '',
        imagem_miniatura: "/logo.webp",
        descricao: article["Artigo"] || '',
        area: codigoNome,
        tema: `Artigo ${article["Número do Artigo"]}`
      }));
      setPlaylist(audioItems);
    }
  }, [subModoConteudo, articlesWithAudio, codigoNome, setPlaylist]);

  // Agrupar alterações por artigo
  const alteracoesPorArtigo = useMemo(() => {
    const grouped: Record<string, AlteracaoHistorica[]> = {};
    for (const alt of alteracoesHistoricas) {
      const key = alt.numero_artigo || 'sem-numero';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(alt);
    }
    return grouped;
  }, [alteracoesHistoricas]);

  // Filtrar artigos sem número para exibição na lista de artigos
  const articlesWithNumber = useMemo(() => 
    articles.filter(article => 
      article["Número do Artigo"] && 
      article["Número do Artigo"].trim() !== "" &&
      // Excluir cabeçalhos de estrutura (TITULO, CAPITULO, SECAO, etc.)
      !['TITULO', 'CAPITULO', 'SECAO', 'SUBSECAO', 'PARTE', 'LIVRO'].includes(article["Número do Artigo"].trim().toUpperCase())
    ), [articles]
  );

  // Extrair cabeçalhos (TITULO, CAPITULO, etc.) ordenados por id
  const headersStructure = useMemo(() => {
    const headers = articles
      .filter(article => 
        article["Número do Artigo"] && 
        ['TITULO', 'CAPITULO', 'SECAO', 'SUBSECAO', 'PARTE', 'LIVRO'].includes(article["Número do Artigo"].trim().toUpperCase())
      )
      .sort((a, b) => a.id - b.id);
    return headers;
  }, [articles]);

  // Criar lista intercalada de artigos com seus separadores de estrutura
  const articlesWithHeaders = useMemo(() => {
    const result: Array<{ type: 'article' | 'header'; data: Article }> = [];
    let headerIndex = 0;
    
    // Ordenar todos os artigos por id
    const sortedArticles = [...articlesWithNumber].sort((a, b) => a.id - b.id);
    
    for (const article of sortedArticles) {
      // Adicionar todos os headers que vêm antes deste artigo
      while (headerIndex < headersStructure.length && headersStructure[headerIndex].id < article.id) {
        result.push({ type: 'header', data: headersStructure[headerIndex] });
        headerIndex++;
      }
      result.push({ type: 'article', data: article });
    }
    
    return result;
  }, [articlesWithNumber, headersStructure]);

  // Detectar capítulos
  const capitulos = useMemo(() => detectarCapitulos(articles), [articles]);

  // Scroll para artigo específico com retry robusto
  useEffect(() => {
    if (!targetArticleNumber) return;

    const normalizeNumber = (num: string) => num.replace(/\D/g, '').replace(/^0+/, '');
    const targetNormalized = normalizeNumber(targetArticleNumber);
    
    const targetArticle = articlesWithNumber.find(article => {
      const articleNum = normalizeNumber(article["Número do Artigo"] || "");
      return articleNum === targetNormalized || 
             (article["Número do Artigo"] || "").toLowerCase().includes(targetArticleNumber.toLowerCase());
    });

    if (!targetArticle) {
      onScrollComplete?.();
      return;
    }

    // Destacar artigo imediatamente
    setHighlightedArticleId(targetArticle.id);
    
    // Forçar modo de visualização lista
    setModoVisualizacao('artigos');

    // Função de scroll com retry progressivo
    const scrollToArticle = (retries = 0) => {
      const element = articleRefs.current.get(targetArticle.id);
      
      if (element) {
        // Usar requestAnimationFrame para garantir que o DOM está pronto
        requestAnimationFrame(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          onScrollComplete?.();
        });
      } else if (retries < 15) {
        // Retry com delay progressivo (até ~3 segundos total)
        setTimeout(() => scrollToArticle(retries + 1), 200);
      } else {
        // Fallback: completar mesmo sem scroll
        console.warn('Não foi possível scrollar para artigo:', targetArticleNumber);
        onScrollComplete?.();
      }
    };

    // Iniciar após delay para garantir renderização inicial
    setTimeout(() => scrollToArticle(0), 300);

    // Limpar destaque após 4 segundos
    const highlightTimer = setTimeout(() => {
      setHighlightedArticleId(null);
    }, 4000);

    return () => clearTimeout(highlightTimer);
  }, [targetArticleNumber, articlesWithNumber, onScrollComplete]);

  // Detectar scroll past article 7
  useEffect(() => {
    const handleScroll = () => {
      if (onScrollPastArticle7 && containerRef.current) {
        const scrollTop = window.scrollY;
        const isPast = scrollTop > 500;
        onScrollPastArticle7(isPast);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onScrollPastArticle7]);

  // Scroll para capítulo
  const scrollToCapitulo = (capitulo: Capitulo) => {
    if (capitulo.artigos.length > 0) {
      const primeiroArtigo = capitulo.artigos[0];
      const element = articleRefs.current.get(primeiroArtigo.id);
      if (element) {
        setModoVisualizacao('artigos');
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setHighlightedArticleId(primeiroArtigo.id);
          setTimeout(() => setHighlightedArticleId(null), 3000);
        }, 100);
      }
    }
  };

  if (articlesWithNumber.length === 0) {
    return (
      <div ref={containerRef} className="px-4 py-2 pb-20 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum artigo encontrado</p>
        </div>
      </div>
    );
  }

  // Cores para tipos de alteração
  const getAlteracaoCor = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'revogação': return { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500' };
      case 'inclusão': return { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500' };
      case 'redação': return { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500' };
      case 'acréscimo': return { bg: 'bg-emerald-500/20', text: 'text-emerald-500', border: 'border-emerald-500' };
      case 'vide': return { bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-500' };
      case 'vetado': return { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500' };
      case 'vigência': return { bg: 'bg-cyan-500/20', text: 'text-cyan-500', border: 'border-cyan-500' };
      case 'supressão': return { bg: 'bg-pink-500/20', text: 'text-pink-500', border: 'border-pink-500' };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' };
    }
  };

  // Ícone para tipo de elemento
  const getElementoIcon = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'inciso': return 'I';
      case 'parágrafo': return '§';
      case 'alínea': return 'a)';
      default: return '•';
    }
  };

  return (
    <div ref={containerRef} className="px-4 py-2 pb-20 max-w-4xl mx-auto">
      {/* Toggle Artigos/Capítulos/Alterações */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-3 pt-1 -mx-4 px-4">
        <Tabs 
          value={modoVisualizacao} 
          className="w-full"
        >
          <TabsList className={`w-full grid h-10 bg-muted/50 rounded-lg p-1 ${tabelaLei ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger 
              value="artigos" 
              onClick={() => {
                setModoVisualizacao('artigos');
                setSubModoConteudo('lista');
              }}
              className={`rounded-md flex items-center gap-1.5 text-xs sm:text-sm ${
                modoVisualizacao === 'artigos' && subModoConteudo === 'lista'
                  ? '!bg-amber-500 !text-black font-medium shadow-sm'
                  : 'text-white hover:bg-muted/30'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Artigos</span>
              <span className="sm:hidden">Art.</span>
              <span>({articlesWithNumber.length})</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="capitulos" 
              onClick={() => {
                setModoVisualizacao('capitulos');
                setSubModoConteudo('lista');
              }}
              className={`rounded-md flex items-center gap-1.5 text-xs sm:text-sm ${
                modoVisualizacao === 'capitulos'
                  ? '!bg-amber-500 !text-black font-medium shadow-sm'
                  : 'text-white hover:bg-muted/30'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Capítulos</span>
              <span className="sm:hidden">Cap.</span>
              <span>({capitulos.length})</span>
            </TabsTrigger>

            {tabelaLei && (
              <TabsTrigger 
                value="alteracoes" 
                onClick={() => {
                  setModoVisualizacao('alteracoes');
                  setSubModoConteudo('lista');
                }}
                className={`rounded-md flex items-center gap-1.5 text-xs sm:text-sm ${
                  modoVisualizacao === 'alteracoes'
                    ? '!bg-amber-500 !text-black font-medium shadow-sm'
                    : 'text-white hover:bg-muted/30'
                }`}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Alterações</span>
                <span className="sm:hidden">Alt.</span>
                {alteracoesHistoricas.length > 0 && (
                  <span>({alteracoesHistoricas.length})</span>
                )}
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        
        {/* Menu Em Alta / Playlist / Favoritos - abaixo dos 3 tabs - sempre visível no modo artigos */}
        {modoVisualizacao === 'artigos' && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setSubModoConteudo(subModoConteudo === 'emalta' ? 'lista' : 'emalta')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg transition-all duration-200 ${
                subModoConteudo === 'emalta' 
                  ? 'bg-amber-500 text-black font-medium' 
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Em Alta</span>
            </button>
            <button
              onClick={() => setSubModoConteudo(subModoConteudo === 'playlist' ? 'lista' : 'playlist')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg transition-all duration-200 ${
                subModoConteudo === 'playlist' 
                  ? 'bg-amber-500 text-black font-medium' 
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Playlist</span>
            </button>
            <button
              onClick={() => setSubModoConteudo(subModoConteudo === 'favoritos' ? 'lista' : 'favoritos')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg transition-all duration-200 ${
                subModoConteudo === 'favoritos' 
                  ? 'bg-amber-500 text-black font-medium' 
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Favoritos</span>
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo de Favoritos */}
      {modoVisualizacao === 'artigos' && subModoConteudo === 'favoritos' && codigoNome && (
        <ArtigosFavoritosList 
          tabelaCodigo={codigoNome}
          onArtigoClick={(artigoId, numeroArtigo) => {
            const artigo = articles.find(a => a.id === artigoId);
            if (artigo) {
              onArtigoClick?.(artigo);
            }
          }}
        />
      )}

      {/* Modo Alterações Históricas */}
      {modoVisualizacao === 'alteracoes' && (
        <div className="space-y-3">
          {isLoadingAlteracoes ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p>Carregando alterações históricas...</p>
            </div>
          ) : alteracoesHistoricas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma alteração histórica encontrada.</p>
              <p className="text-sm mt-2">Raspe as alterações na página de Histórico de Leis.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Linha do Tempo Visual */}
              {(() => {
                const anosComAlteracoes = alteracoesHistoricas
                  .map(a => a.ano_alteracao)
                  .filter((a): a is number => a !== null && a > 0);
                const anoInicio = Math.min(...anosComAlteracoes, 1940);
                const anoAtual = new Date().getFullYear();
                const totalAnos = anoAtual - anoInicio;
                
                // Agrupar por tipo
                const porTipo = alteracoesHistoricas.reduce((acc, alt) => {
                  acc[alt.tipo_alteracao] = (acc[alt.tipo_alteracao] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                
                // Agrupar por ano
                const porAno = alteracoesHistoricas.reduce((acc, alt) => {
                  const ano = alt.ano_alteracao || 0;
                  acc[ano] = (acc[ano] || 0) + 1;
                  return acc;
                }, {} as Record<number, number>);
                
                const maxPorAno = Math.max(...Object.values(porAno));
                
                return (
                  <Card className="overflow-hidden border-amber-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <History className="w-5 h-5 text-amber-500" />
                        <h3 className="font-semibold text-sm">Alteração ao longo do tempo</h3>
                      </div>
                      
                      {/* Cards de resumo por tipo */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        {Object.entries(porTipo)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 4)
                          .map(([tipo, count], idx) => {
                            const cor = getAlteracaoCor(tipo);
                            return (
                              <div 
                                key={tipo} 
                                className={`p-3 rounded-lg ${cor.bg} text-center`}
                              >
                                <div className={`text-xl sm:text-2xl font-bold ${cor.text}`}>{count}</div>
                                <div className={`text-[10px] ${cor.text} opacity-80`}>{tipo}</div>
                              </div>
                            );
                          })}
                      </div>
                      
                      {/* Linha do tempo profissional */}
                      <div className="mt-6 space-y-4">
                        {/* Header com anos */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                              <span className="text-amber-500 font-bold text-[10px]">{anoInicio}</span>
                            </div>
                            <span className="text-muted-foreground text-[10px]">Origem</span>
                          </div>
                          <div className="flex-1 mx-4 flex items-center">
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-amber-500/50 via-orange-500/50 to-amber-500/50" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-[10px]">Atual</span>
                            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                              <span className="text-white font-bold text-[10px]">{anoAtual}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Barra principal da linha do tempo */}
                        <div className="relative">
                          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-full"
                              style={{ 
                                width: '100%',
                                animation: 'grow-width 1.5s ease-out forwards'
                              }}
                            />
                          </div>
                          
                          {/* Marcadores de anos com alterações */}
                          {Object.entries(porAno)
                            .filter(([ano]) => Number(ano) > 0)
                            .map(([ano, count]) => {
                              const posicao = Math.max(2, Math.min(98, ((Number(ano) - anoInicio) / totalAnos) * 100));
                              const intensidade = Math.min(count / maxPorAno, 1);
                              return (
                                <div
                                  key={ano}
                                  className="absolute top-1/2 -translate-y-1/2 group cursor-pointer"
                                  style={{ left: `${posicao}%` }}
                                >
                                  <div 
                                    className="w-3 h-3 rounded-full bg-white border-2 border-amber-500 shadow-md transition-transform hover:scale-150 -translate-x-1/2"
                                    style={{ 
                                      boxShadow: `0 0 ${8 * intensidade}px rgba(245, 158, 11, ${0.5 * intensidade})`
                                    }}
                                  />
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    <div className="bg-popover border border-border rounded-lg px-2 py-1 shadow-lg whitespace-nowrap">
                                      <div className="text-xs font-bold text-amber-500">{ano}</div>
                                      <div className="text-[10px] text-muted-foreground">{count} alteração(ões)</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                        
                        {/* Anos mais importantes - scroll horizontal em mobile - com dia/mês */}
                        <div className="overflow-x-auto pb-2 -mx-2 px-2">
                          <div className="flex gap-2 min-w-max">
                            {Object.entries(porAno)
                              .filter(([ano]) => Number(ano) > 0)
                              .sort(([, a], [, b]) => b - a)
                              .slice(0, 6)
                              .sort(([a], [b]) => Number(a) - Number(b))
                              .map(([ano, count]) => {
                                // Encontrar a alteração mais recente desse ano para pegar dia/mês
                                const altDoAno = alteracoesHistoricas
                                  .filter(a => a.ano_alteracao === Number(ano))
                                  .sort((a, b) => {
                                    const dataA = (a.mes_alteracao || 0) * 100 + (a.dia_alteracao || 0);
                                    const dataB = (b.mes_alteracao || 0) * 100 + (b.dia_alteracao || 0);
                                    return dataB - dataA;
                                  })[0];
                                
                                const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                                const temData = altDoAno?.dia_alteracao || altDoAno?.mes_alteracao;
                                const dataFormatada = temData 
                                  ? `${altDoAno.dia_alteracao || ''}${altDoAno.dia_alteracao && altDoAno.mes_alteracao ? '/' : ''}${altDoAno.mes_alteracao ? meses[altDoAno.mes_alteracao - 1] : ''}`
                                  : null;
                                
                                return (
                                  <div
                                    key={ano}
                                    className="flex flex-col items-center px-3 py-2 rounded-lg bg-muted/50 border border-border/50 hover:border-amber-500/50 transition-colors"
                                  >
                                    <span className="text-xs font-bold text-amber-500">{ano}</span>
                                    {dataFormatada && (
                                      <span className="text-[9px] text-muted-foreground">{dataFormatada}</span>
                                    )}
                                    <span className="text-[10px] text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded-full mt-1">
                                      {count} alt.
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                        
                        {/* Estatísticas - incluindo idade da lei */}
                        <div className="flex items-center justify-center gap-4 pt-2 border-t border-border/50">
                          <div className="text-center">
                            <div className="text-lg font-bold text-foreground">{totalAnos}</div>
                            <div className="text-[10px] text-muted-foreground">Anos de Lei</div>
                          </div>
                          <div className="w-px h-8 bg-border/50" />
                          <div className="text-center">
                            <div className="text-lg font-bold text-foreground">{Object.keys(alteracoesPorArtigo).length}</div>
                            <div className="text-[10px] text-muted-foreground">Artigos</div>
                          </div>
                          <div className="w-px h-8 bg-border/50" />
                          <div className="text-center">
                            <div className="text-lg font-bold text-amber-500">{alteracoesHistoricas.length}</div>
                            <div className="text-[10px] text-muted-foreground">Alterações</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Lista ordenada por data (mais recente primeiro) */}
              <AlteracoesLista 
                alteracoesPorArtigo={alteracoesPorArtigo}
                getAlteracaoCor={getAlteracaoCor}
                getElementoIcon={getElementoIcon}
              />
            </div>
          )}
        </div>
      )}
      {/* Modo Capítulos */}
      {modoVisualizacao === 'capitulos' && (
        <div className="space-y-2">
          {capitulos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Estrutura de capítulos não detectada para esta legislação.</p>
              <p className="text-sm mt-2">Use a visualização por artigos.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {capitulos.map((capitulo) => {
                const corCapitulo = 
                  capitulo.tipo === 'parte' ? '#ef4444' :
                  capitulo.tipo === 'livro' ? '#f97316' :
                  capitulo.tipo === 'titulo' ? '#eab308' :
                  capitulo.tipo === 'capitulo' ? '#22c55e' :
                  capitulo.tipo === 'secao' ? '#3b82f6' :
                  '#8b5cf6';
                
                return (
                  <Collapsible key={capitulo.id}>
                    <CollapsibleTrigger asChild>
                      <Card 
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4"
                        style={{ borderLeftColor: corCapitulo }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                {capitulo.tipo}
                              </p>
                              <h3 className="font-semibold text-sm line-clamp-2">
                                {capitulo.titulo}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {capitulo.artigos.length} artigos
                                {capitulo.artigoInicio && capitulo.artigoFim && 
                                  ` (Art. ${capitulo.artigoInicio} - ${capitulo.artigoFim})`
                                }
                              </p>
                            </div>
                            <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 space-y-1 pl-4 animate-fade-in">
                      {capitulo.artigos.map((article) => {
                        const hasNarracao = Boolean(article["Narração"]) || artigosComNarracao?.has(article.id);
                        return (
                          <Card 
                            key={article.id}
                            className="cursor-pointer hover:bg-muted/30 transition-colors border-l-2"
                            style={{ borderLeftColor: corCapitulo }}
                            onClick={() => onArtigoClick?.(article)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="text-xs font-bold px-2 py-0.5 rounded"
                                  style={{ backgroundColor: `${corCapitulo}20`, color: corCapitulo }}
                                >
                                  Art. {article["Número do Artigo"]}
                                </span>
                                {hasNarracao && (
                                  <span className="text-xs text-emerald-500">🎧</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {getPreviewText(article["Artigo"] || "")}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modo Artigos - Todas as listas pré-renderizadas, apenas visibilidade muda */}
      {modoVisualizacao === 'artigos' && (
        <div>
          {/* Sub-modo: Em Alta - sempre renderizado, visibilidade controlada por CSS */}
          <div className={subModoConteudo === 'emalta' ? 'block space-y-3' : 'hidden'}>
            {/* Header explicativo */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-amber-500">Artigos Em Alta</h3>
                <p className="text-xs text-muted-foreground">Os artigos mais acessados pelos usuários</p>
              </div>
            </div>
            
            {isLoadingRanking ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm">Carregando artigos em alta...</p>
              </div>
            ) : rankedArticles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Flame className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum artigo em alta ainda.</p>
                <p className="text-xs mt-1">Navegue pelos artigos para gerar o ranking!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rankedArticles.map((article, index) => {
                  const medalIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                  return (
                    <Card
                      key={article.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4"
                      style={{ borderLeftColor: "hsl(38, 92%, 50%)" }}
                      onClick={() => {
                        const fullArticle = articles.find(a => a.id === article.id);
                        if (fullArticle) onArtigoClick?.(fullArticle);
                      }}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                          {medalIcon ? (
                            <span className="text-lg">{medalIcon}</span>
                          ) : (
                            <span className="text-xs font-bold text-amber-500">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">Art. {article["Número do Artigo"]}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {getPreviewText(article.Artigo || "")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-xs">{article.visualizacoes}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sub-modo: Playlist - sempre renderizado, visibilidade controlada por CSS */}
          <div className={subModoConteudo === 'playlist' ? 'block space-y-3' : 'hidden'}>
            {/* Header explicativo */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Music className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-amber-500">Playlist de Áudio</h3>
                <p className="text-xs text-muted-foreground">Ouça os artigos narrados em sequência</p>
              </div>
            </div>
            
            {articlesWithAudio.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum áudio disponível.</p>
                <p className="text-xs mt-1">Este código ainda não possui artigos com narração.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {articlesWithAudio.map((article) => {
                  const isActive = currentAudio?.id === article.id && isPlaying;
                  const isCurrentTrack = currentAudio?.id === article.id;
                  return (
                    <Card
                      key={article.id}
                      className={`cursor-pointer hover:bg-muted/50 transition-all duration-200 border-l-4 ${
                        isActive ? 'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] bg-amber-500/5' : ''
                      }`}
                      style={{ borderLeftColor: "hsl(38, 92%, 50%)" }}
                      onClick={() => {
                        if (isCurrentTrack) {
                          togglePlayPause();
                        } else {
                          playAudio({
                            id: article.id,
                            titulo: `Art. ${article["Número do Artigo"]} - ${codigoNome}`,
                            url_audio: article["Narração"] || '',
                            imagem_miniatura: "/logo.webp",
                            descricao: article["Artigo"] || '',
                            area: codigoNome,
                            tema: `Artigo ${article["Número do Artigo"]}`
                          });
                        }
                      }}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                          isActive ? 'bg-amber-500 text-black' : 'bg-muted'
                        }`}>
                          {isActive ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-sm ${isActive ? 'text-amber-500' : ''}`}>
                            Art. {article["Número do Artigo"]}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {getPreviewText(article["Artigo"] || "")}
                          </p>
                        </div>
                        <Music className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      </CardContent>
                    </Card>
                  );
                })}
                
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    🎧 {articlesWithAudio.length} artigos com áudio
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sub-modo: Lista normal de artigos - sempre renderizado, visibilidade controlada por CSS */}
          <div className={subModoConteudo === 'lista' ? 'block space-y-2' : 'hidden'}>
            {articlesWithHeaders.map((item, index) => {
              if (item.type === 'header') {
                // Renderizar separador de estrutura (TÍTULO, CAPÍTULO, etc.)
                const headerType = item.data["Número do Artigo"]?.toUpperCase() || 'TITULO';
                const headerColor = 
                  headerType === 'PARTE' ? 'text-red-400 border-red-400' :
                  headerType === 'LIVRO' ? 'text-orange-400 border-orange-400' :
                  headerType === 'TITULO' ? 'text-amber-300 border-amber-300' :
                  headerType === 'CAPITULO' ? 'text-emerald-400 border-emerald-400' :
                  headerType === 'SECAO' ? 'text-sky-400 border-sky-400' :
                  'text-violet-400 border-violet-400';
                
                const headerText = item.data["Artigo"] || '';
                const headerLines = headerText.split('\n').filter(l => l.trim()).slice(0, 3);
                
                return (
                  <div 
                    key={`header-${item.data.id}`}
                    className={`py-3 px-4 mt-4 mb-2 border-l-4 bg-muted/30 rounded-r-lg ${headerColor}`}
                  >
                    <p className="text-xs uppercase tracking-wider opacity-70 mb-1">
                      {headerType}
                    </p>
                    {headerLines.map((line, i) => (
                      <p key={i} className={`font-semibold ${i === 0 ? 'text-sm' : 'text-xs opacity-80'}`}>
                        {line.trim()}
                      </p>
                    ))}
                  </div>
                );
              }
              
              // Renderizar artigo normal
              const article = item.data;
              const isHighlighted = highlightedArticleId === article.id;
              const hasNarracao = Boolean(article["Narração"]) || artigosComNarracao?.has(article.id);
              
              return (
                <div 
                  key={article.id}
                  ref={(el) => {
                    if (el) articleRefs.current.set(article.id, el);
                  }}
                >
                  <ArtigoCard
                    article={article}
                    onArtigoClick={onArtigoClick}
                    isHighlighted={isHighlighted}
                    searchQuery={isHighlighted ? targetArticleNumber || undefined : undefined}
                    hasNarracao={hasNarracao}
                  />
                </div>
              );
            })}
            
            {/* Info de total */}
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                ✓ {articlesWithNumber.length} artigos carregados
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};