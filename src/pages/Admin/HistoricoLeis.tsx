import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, ExternalLink, Bell, CheckCircle, Clock, Search, Loader2, ChevronDown, ChevronUp, Trash2, Link, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { URLS_PLANALTO, getUrlPlanalto } from "@/lib/urlsPlanalto";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PainelRaspagemLei } from "@/components/admin/PainelRaspagemLei";

// Lista de tabelas de leis no Supabase
const TABELAS_LEIS = Object.keys(URLS_PLANALTO);

interface Alteracao {
  id: number;
  numero_artigo: string;
  tipo_alteracao: string;
  lei_alteradora: string | null;
  ano_alteracao: number | null;
  texto_completo: string;
  elemento_tipo: string | null;
  elemento_numero: string | null;
  elemento_texto: string | null;
  url_lei_alteradora: string | null;
}

const HistoricoLeis = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [deletingLei, setDeletingLei] = useState<string | null>(null);
  const [popularingLei, setPopularingLei] = useState<string | null>(null);
  const [expandedLei, setExpandedLei] = useState<string | null>(null);
  
  // Estado para o painel de raspagem
  const [painelRaspagem, setPainelRaspagem] = useState<{
    open: boolean;
    tabela: string;
    urlPlanalto: string;
  }>({ open: false, tabela: '', urlPlanalto: '' });

  // Buscar detalhes das alterações quando expandir
  const { data: alteracoesDetalhes, isLoading: isLoadingDetalhes } = useQuery({
    queryKey: ['historico-alteracoes-detalhes', expandedLei],
    queryFn: async () => {
      if (!expandedLei) return [];
      const { data, error } = await supabase
        .from('historico_alteracoes')
        .select('*')
        .eq('tabela_lei', expandedLei)
        .order('numero_artigo');
      
      if (error) throw error;
      return (data || []) as Alteracao[];
    },
    enabled: !!expandedLei
  });

  // Agrupar alterações por artigo
  const alteracoesAgrupadas = useMemo(() => {
    if (!alteracoesDetalhes) return {};
    
    const agrupado: Record<string, Alteracao[]> = {};
    for (const alt of alteracoesDetalhes) {
      if (!agrupado[alt.numero_artigo]) {
        agrupado[alt.numero_artigo] = [];
      }
      agrupado[alt.numero_artigo].push(alt);
    }
    return agrupado;
  }, [alteracoesDetalhes]);

  // Buscar contagem de alterações por tabela
  const { data: alteracoesCount, isLoading: isLoadingAlteracoes } = useQuery({
    queryKey: ['historico-alteracoes-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_alteracoes')
        .select('tabela_lei, updated_at')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Agrupar por tabela
      const countMap: Record<string, { count: number; lastUpdate: string }> = {};
      (data as any[])?.forEach((item: any) => {
        if (!countMap[item.tabela_lei]) {
          countMap[item.tabela_lei] = { count: 0, lastUpdate: item.updated_at };
        }
        countMap[item.tabela_lei].count++;
      });
      
      return countMap;
    }
  });

  // Montar lista de leis com status
  const leisComStatus = useMemo(() => {
    return TABELAS_LEIS.map(tabela => ({
      tabela,
      urlPlanalto: getUrlPlanalto(tabela),
      totalAlteracoes: alteracoesCount?.[tabela]?.count || 0,
      ultimaExtracao: alteracoesCount?.[tabela]?.lastUpdate || null
    }));
  }, [alteracoesCount]);

  // Filtrar leis
  const leisFiltradas = useMemo(() => {
    if (!searchQuery.trim()) return leisComStatus;
    const query = searchQuery.toLowerCase();
    return leisComStatus.filter(lei => 
      lei.tabela.toLowerCase().includes(query)
    );
  }, [leisComStatus, searchQuery]);


  const deletarMutation = useMutation({
    mutationFn: async (tabela: string) => {
      setDeletingLei(tabela);
      
      const { data, error } = await supabase.functions.invoke('extrair-alteracoes-lei', {
        body: { tableName: tabela, action: 'delete' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, tabela) => {
      toast.success(`Histórico de ${tabela} apagado`);
      queryClient.invalidateQueries({ queryKey: ['historico-alteracoes-count'] });
      queryClient.invalidateQueries({ queryKey: ['historico-alteracoes-detalhes', tabela] });
      setExpandedLei(null);
      setDeletingLei(null);
    },
    onError: (error: any) => {
      toast.error(`Erro ao apagar: ${error.message}`);
      setDeletingLei(null);
    }
  });

  // Mutation para popular novidades
  const popularMutation = useMutation({
    mutationFn: async (tabela: string) => {
      setPopularingLei(tabela);
      
      // Buscar total de alterações
      const { count } = await supabase
        .from('historico_alteracoes')
        .select('*', { count: 'exact', head: true })
        .eq('tabela_lei', tabela);
      
      // Inserir na tabela NOVIDADES
      const { error } = await supabase
        .from('NOVIDADES')
        .insert({
          'Área': 'VadeMecum',
          Dia: new Date().toISOString().split('T')[0],
          'Atualização': `Adicionado histórico de ${count || 0} alterações para ${tabela}`
        });
      
      if (error) throw error;
      return { tabela, count };
    },
    onSuccess: (data) => {
      toast.success(`Novidade adicionada para ${data.tabela}`);
      setPopularingLei(null);
    },
    onError: (error: any) => {
      toast.error(`Erro ao popular novidades: ${error.message}`);
      setPopularingLei(null);
    }
  });

  // Função para abrir link da lei alteradora
  const abrirLeiAlteradora = (alt: Alteracao) => {
    if (alt.url_lei_alteradora) {
      window.open(alt.url_lei_alteradora, '_blank');
    } else if (alt.lei_alteradora) {
      // Buscar no Google como fallback
      window.open(`https://www.google.com/search?q=${encodeURIComponent(alt.lei_alteradora + ' site:planalto.gov.br')}`, '_blank');
    }
  };

  // Cor do badge baseada no tipo de alteração
  const getCorBadge = (tipo: string) => {
    switch (tipo) {
      case 'Revogação':
      case 'Supressão':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Inclusão':
      case 'Acréscimo':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Vetado':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Redação':
      case 'Alteração':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Ícone do tipo de elemento
  const getIconeElemento = (tipo: string | null) => {
    switch (tipo) {
      case 'inciso':
        return 'I';
      case 'alínea':
        return 'a)';
      case 'parágrafo':
        return '§';
      case 'caput':
        return '⊕';
      default:
        return '•';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-amber-500" />
              Histórico de Leis
            </h1>
            <p className="text-xs text-muted-foreground">
              Extrair e gerenciar alterações das leis
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lei..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{TABELAS_LEIS.length}</div>
            <div className="text-xs text-muted-foreground">Total de Leis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-emerald-500">
              {leisComStatus.filter(l => l.totalAlteracoes > 0).length}
            </div>
            <div className="text-xs text-muted-foreground">Com Histórico</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-amber-500">
              {Object.values(alteracoesCount || {}).reduce((acc, v) => acc + v.count, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Alterações</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Leis */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-20">
          {isLoadingAlteracoes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            leisFiltradas.map((lei) => (
              <Collapsible
                key={lei.tabela}
                open={expandedLei === lei.tabela}
                onOpenChange={(open) => setExpandedLei(open ? lei.tabela : null)}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{lei.tabela}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {lei.totalAlteracoes > 0 ? (
                            <CollapsibleTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> 
                                Extraído ({lei.totalAlteracoes})
                                {expandedLei === lei.tabela ? (
                                  <ChevronUp className="w-3 h-3 ml-1" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 ml-1" />
                                )}
                              </Badge>
                            </CollapsibleTrigger>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" /> Pendente
                            </Badge>
                          )}
                          {lei.ultimaExtracao && (
                            <span className="text-xs text-muted-foreground">
                              Atualizado: {new Date(lei.ultimaExtracao).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Link Planalto */}
                        {lei.urlPlanalto && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(lei.urlPlanalto!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Apagar Histórico */}
                        {lei.totalAlteracoes > 0 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Apagar histórico?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Isso irá apagar todo o histórico de alterações de <strong>{lei.tabela}</strong>. 
                                  Você precisará extrair novamente para ver as alterações.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => deletarMutation.mutate(lei.tabela)}
                                >
                                  {deletingLei === lei.tabela ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Apagar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        {/* Botão Raspar IA - fluxo principal */}
                        
                        {/* Raspar com IA - só se tiver URL do Planalto */}
                        {lei.urlPlanalto && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            disabled={painelRaspagem.open}
                            onClick={() => setPainelRaspagem({
                              open: true,
                              tabela: lei.tabela,
                              urlPlanalto: lei.urlPlanalto!
                            })}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Raspar IA
                          </Button>
                        )}
                        
                        {/* Popular Novidades */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={lei.totalAlteracoes === 0 || popularingLei === lei.tabela}
                          onClick={() => popularMutation.mutate(lei.tabela)}
                        >
                          {popularingLei === lei.tabela ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Bell className="h-3 w-3 mr-1" />
                          )}
                          Novidades
                        </Button>
                      </div>
                    </div>
                    
                    {/* Lista de alterações expandida - Agrupada por artigo */}
                    <CollapsibleContent>
                      <div className="mt-4 pt-4 border-t border-border">
                        {isLoadingDetalhes && expandedLei === lei.tabela ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {Object.entries(alteracoesAgrupadas).map(([artigo, alteracoes]) => (
                              <div key={artigo} className="space-y-2">
                                {/* Cabeçalho do artigo */}
                                <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <span className="font-semibold text-sm">Art. {artigo}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {alteracoes.length} alteraç{alteracoes.length === 1 ? 'ão' : 'ões'}
                                  </Badge>
                                </div>
                                
                                {/* Alterações do artigo */}
                                <div className="ml-4 pl-4 border-l-2 border-border space-y-2">
                                  {alteracoes.map((alt) => (
                                    <div 
                                      key={alt.id} 
                                      className={`p-3 rounded-lg border ${
                                        alt.tipo_alteracao === 'Revogação' || alt.tipo_alteracao === 'Supressão'
                                          ? 'bg-red-500/5 border-red-500/20'
                                          : alt.tipo_alteracao === 'Inclusão' || alt.tipo_alteracao === 'Acréscimo'
                                          ? 'bg-green-500/5 border-green-500/20'
                                          : alt.tipo_alteracao === 'Vetado'
                                          ? 'bg-orange-500/5 border-orange-500/20'
                                          : 'bg-blue-500/5 border-blue-500/20'
                                      }`}
                                    >
                                      {/* Tipo de elemento e número */}
                                      <div className="flex items-start gap-2 mb-2">
                                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                          {getIconeElemento(alt.elemento_tipo)}
                                          {alt.elemento_numero && ` ${alt.elemento_numero}`}
                                        </span>
                                        <Badge variant="outline" className={`text-xs ${getCorBadge(alt.tipo_alteracao)}`}>
                                          {alt.tipo_alteracao}
                                        </Badge>
                                      </div>
                                      
                                      {/* Texto do elemento */}
                                      {alt.elemento_texto && (
                                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                          "{alt.elemento_texto}"
                                        </p>
                                      )}
                                      
                                      {/* Lei alteradora clicável */}
                                      {alt.lei_alteradora && (
                                        <button
                                          onClick={() => abrirLeiAlteradora(alt)}
                                          className={`text-xs flex items-center gap-1 hover:underline ${
                                            alt.tipo_alteracao === 'Revogação' || alt.tipo_alteracao === 'Supressão'
                                              ? 'text-red-600'
                                              : alt.tipo_alteracao === 'Inclusão' || alt.tipo_alteracao === 'Acréscimo'
                                              ? 'text-green-600'
                                              : alt.tipo_alteracao === 'Vetado'
                                              ? 'text-orange-600'
                                              : 'text-blue-600'
                                          }`}
                                        >
                                          <Link className="h-3 w-3" />
                                          {alt.lei_alteradora}
                                          {alt.ano_alteracao && `, de ${alt.ano_alteracao}`}
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            
                            {Object.keys(alteracoesAgrupadas).length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhuma alteração encontrada
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Painel de Raspagem com IA */}
      <PainelRaspagemLei
        open={painelRaspagem.open}
        onClose={() => setPainelRaspagem({ open: false, tabela: '', urlPlanalto: '' })}
        tabela={painelRaspagem.tabela}
        urlPlanalto={painelRaspagem.urlPlanalto}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['historico-alteracoes-count'] });
          queryClient.invalidateQueries({ queryKey: ['historico-alteracoes-detalhes', painelRaspagem.tabela] });
          toast.success(`Raspagem de ${painelRaspagem.tabela} concluída!`);
        }}
      />
    </div>
  );
};

export default HistoricoLeis;
