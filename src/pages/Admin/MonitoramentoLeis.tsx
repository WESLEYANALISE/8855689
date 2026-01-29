import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Loader2, RefreshCw, Play, CheckCircle, AlertTriangle, XCircle, Clock, FileText, History, Zap, Scale, BookOpen, Landmark, ScrollText, Calendar, FileImage, X, ArrowDownUp, Table2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Alteracao {
  tipo: string;
  lei: string | null;
  contexto: string;
  artigo: string | null;
  data: string | null;
}

interface LinhaTabela {
  numero: string;
  texto: string;
  alteracao?: 'revogado' | 'incluido' | 'redacao' | 'vetado' | 'renumerado' | 'vigencia' | null;
}

// Configuração de cores para tipos de alteração (inspirado em normas.leg.br)
const alteracaoConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  revogado: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-l-red-500', label: 'Revogado' },
  incluido: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-l-green-500', label: 'Incluído' },
  redacao: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-l-blue-500', label: 'Redação dada' },
  vetado: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-l-orange-500', label: 'Vetado' },
  renumerado: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-l-purple-500', label: 'Renumerado' },
  vigencia: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-l-cyan-500', label: 'Vigência' },
};

// Configuração especial para cabeçalho institucional (cor dourada)
const cabecalhoConfig = { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-l-amber-500' };

interface ResultadoOcr {
  leiNome: string;
  caracteres: number;
  alteracoes: Alteracao[];
  tempoMs: number;
  textoPreview: string;
  textoCompleto?: string;
}

interface MonitoramentoLei {
  id: number;
  tabela_lei: string;
  url_planalto: string;
  nome_amigavel: string | null;
  ultima_verificacao: string | null;
  ultimo_hash: string | null;
  ultimo_total_artigos: number;
  status: string;
  erro_detalhes: string | null;
  alteracoes_detectadas: number;
  ultima_alteracao_detectada: string | null;
  ativo: boolean;
  prioridade: number;
  categoria: string | null;
  data_modificacao_planalto: string | null;
}

interface Execucao {
  id: string;
  inicio: string;
  fim: string | null;
  status: string;
  leis_verificadas: number;
  alteracoes_encontradas: number;
  erros: number;
  detalhes: any;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  'pendente': { icon: <Clock className="w-4 h-4" />, color: 'bg-muted', label: 'Pendente' },
  'verificando': { icon: <Loader2 className="w-4 h-4 animate-spin" />, color: 'bg-blue-500/20 text-blue-500', label: 'Verificando' },
  'atualizado': { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500/20 text-green-500', label: 'Atualizado' },
  'com_alteracoes': { icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-amber-500/20 text-amber-500', label: 'Com Alterações' },
  'erro': { icon: <XCircle className="w-4 h-4" />, color: 'bg-destructive/20 text-destructive', label: 'Erro' },
};

const categoriaConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  'constituicao': { icon: <Landmark className="w-4 h-4" />, label: 'Constituição', color: 'text-amber-500' },
  'codigo': { icon: <Scale className="w-4 h-4" />, label: 'Códigos', color: 'text-blue-500' },
  'estatuto': { icon: <BookOpen className="w-4 h-4" />, label: 'Estatutos', color: 'text-purple-500' },
  'lei': { icon: <ScrollText className="w-4 h-4" />, label: 'Leis', color: 'text-green-500' },
};

export default function MonitoramentoLeis() {
  const [verificandoTodas, setVerificandoTodas] = useState(false);
  const [leiVerificando, setLeiVerificando] = useState<string | null>(null);
  const [leiOcrProcessando, setLeiOcrProcessando] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todas');
  const [resultadoOcr, setResultadoOcr] = useState<ResultadoOcr | null>(null);
  const [modalOcrAberto, setModalOcrAberto] = useState(false);
  const [ordenacaoAlteracoes, setOrdenacaoAlteracoes] = useState<'tipo' | 'data'>('tipo');
  const [previewMode, setPreviewMode] = useState<'texto' | 'tabela'>('texto');
  const [tabelaEstruturada, setTabelaEstruturada] = useState<LinhaTabela[] | null>(null);
  const [gerandoTabela, setGerandoTabela] = useState(false);

  // Buscar leis monitoradas
  const { data: leis, isLoading: loadingLeis, refetch: refetchLeis } = useQuery({
    queryKey: ['monitoramento-leis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monitoramento_leis')
        .select('*')
        .order('prioridade')
        .order('nome_amigavel');
      
      if (error) throw error;
      return data as MonitoramentoLei[];
    }
  });

  // Buscar últimas execuções
  const { data: execucoes, refetch: refetchExecucoes } = useQuery({
    queryKey: ['monitoramento-execucoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monitoramento_execucoes')
        .select('*')
        .order('inicio', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as Execucao[];
    }
  });

  // Verificar todas as leis
  const verificarTodas = async () => {
    setVerificandoTodas(true);
    toast.info('Iniciando verificação de todas as leis...');

    try {
      const { data, error } = await supabase.functions.invoke('monitorar-alteracoes-leis', {
        body: { modo: 'completo' }
      });

      if (error) throw error;

      toast.success(`Verificação concluída! ${data.verificadas} leis verificadas, ${data.comAlteracoes} com alterações.`);
      refetchLeis();
      refetchExecucoes();
    } catch (error: any) {
      toast.error('Erro ao verificar leis: ' + error.message);
    } finally {
      setVerificandoTodas(false);
    }
  };

  // Verificar lei específica
  const verificarLei = async (tabelaLei: string, forcarComparacaoCompleta = false) => {
    setLeiVerificando(tabelaLei);
    toast.info(`Verificando ${tabelaLei}...${forcarComparacaoCompleta ? ' (comparação completa)' : ''}`);

    try {
      const { data, error } = await supabase.functions.invoke('monitorar-alteracoes-leis', {
        body: { 
          modo: 'unica', 
          tabelaEspecifica: tabelaLei,
          forcarComparacaoCompleta 
        }
      });

      if (error) throw error;

      if (data.comAlteracoes > 0) {
        toast.warning(`Alterações detectadas em ${tabelaLei}!`, {
          description: `Verifique os detalhes na lista abaixo.`
        });
      } else {
        toast.success(`${tabelaLei} está atualizado.`);
      }
      refetchLeis();
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    } finally {
      setLeiVerificando(null);
    }
  };

  // Raspar com PDF + OCR (Browserless + Gemini Vision)
  const rasparComPdfOcr = async (lei: MonitoramentoLei) => {
    setLeiOcrProcessando(lei.tabela_lei);
    toast.info(`Raspando ${lei.nome_amigavel || lei.tabela_lei} via PDF+OCR...`, {
      description: 'Isso pode levar alguns segundos'
    });

    try {
      const { data, error } = await supabase.functions.invoke('raspar-planalto-pdf-ocr', {
        body: { urlPlanalto: lei.url_planalto }
      });

      if (error) throw error;

      if (data.success) {
        // Abrir modal com resultados
        setResultadoOcr({
          leiNome: lei.nome_amigavel || lei.tabela_lei,
          caracteres: data.caracteres,
          alteracoes: data.alteracoes || [],
          tempoMs: data.estatisticas?.tempoTotalMs || 0,
          textoPreview: data.textoExtraido?.substring(0, 3000) || '',
          textoCompleto: data.textoExtraido || ''
        });
        setTabelaEstruturada(null); // Reset tabela
        setPreviewMode('texto'); // Reset para texto
        setModalOcrAberto(true);
        
        toast.success(`OCR concluído! ${data.totalAlteracoes || 0} alterações encontradas.`);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      toast.error('Erro no PDF+OCR: ' + error.message);
      console.error('Erro PDF+OCR:', error);
    } finally {
      setLeiOcrProcessando(null);
    }
  };

  // Gerar tabela estruturada via Gemini
  const gerarTabelaEstruturada = async () => {
    if (!resultadoOcr?.textoCompleto) {
      toast.error('Texto não disponível para estruturar');
      return;
    }

    setGerandoTabela(true);
    toast.info('Estruturando lei em tabela via Gemini...');

    try {
      const { data, error } = await supabase.functions.invoke('estruturar-lei-tabela', {
        body: { textoLei: resultadoOcr.textoCompleto }
      });

      if (error) throw error;

      if (data.success) {
        setTabelaEstruturada(data.tabela);
        toast.success(`Tabela gerada com ${data.totalLinhas} linhas!`);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      toast.error('Erro ao gerar tabela: ' + error.message);
      console.error('Erro tabela:', error);
    } finally {
      setGerandoTabela(false);
    }
  };

  // Alternar ativo/inativo
  const toggleAtivo = async (id: number, ativo: boolean) => {
    const { error } = await supabase
      .from('monitoramento_leis')
      .update({ ativo: !ativo })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar');
    } else {
      refetchLeis();
    }
  };

  // Filtrar leis por categoria
  const leisFiltradas = leis?.filter(lei => {
    if (categoriaAtiva === 'todas') return true;
    return lei.categoria === categoriaAtiva;
  }) || [];

  const leisComAlteracoes = leis?.filter(l => l.status === 'com_alteracoes') || [];
  const leisComErro = leis?.filter(l => l.status === 'erro') || [];
  const leisAtualizadas = leis?.filter(l => l.status === 'atualizado') || [];

  // Contagem por categoria
  const contagemPorCategoria = {
    todas: leis?.length || 0,
    constituicao: leis?.filter(l => l.categoria === 'constituicao').length || 0,
    codigo: leis?.filter(l => l.categoria === 'codigo').length || 0,
    estatuto: leis?.filter(l => l.categoria === 'estatuto').length || 0,
    lei: leis?.filter(l => l.categoria === 'lei').length || 0,
  };

  const renderLeiCard = (lei: MonitoramentoLei) => {
    const config = statusConfig[lei.status] || statusConfig.pendente;
    const isVerificando = leiVerificando === lei.tabela_lei;
    const isOcrProcessando = leiOcrProcessando === lei.tabela_lei;
    const catConfig = categoriaConfig[lei.categoria || 'lei'];
    
    return (
      <div 
        key={lei.id} 
        className={`p-4 rounded-lg border ${!lei.ativo ? 'opacity-50' : ''} ${
          lei.status === 'com_alteracoes' ? 'border-amber-500/50 bg-amber-500/5' : 
          lei.status === 'erro' ? 'border-destructive/50 bg-destructive/5' : 
          'bg-card'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">
                {lei.nome_amigavel || lei.tabela_lei}
              </span>
              <Badge className={config.color} variant="outline">
                {config.icon}
                <span className="ml-1">{config.label}</span>
              </Badge>
              {lei.prioridade <= 2 && (
                <Badge variant="outline" className="bg-primary/10">
                  <Zap className="w-3 h-3 mr-1" />
                  Alta Prioridade
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground truncate mt-1">
              {lei.tabela_lei}
            </p>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              {lei.ultima_verificacao && (
                <span>
                  Verificado: {formatDistanceToNow(new Date(lei.ultima_verificacao), { 
                    locale: ptBR, 
                    addSuffix: true 
                  })}
                </span>
              )}
              {lei.ultimo_total_artigos > 0 && (
                <span>{lei.ultimo_total_artigos} artigos</span>
              )}
              {lei.alteracoes_detectadas > 0 && (
                <span className="text-amber-500">
                  {lei.alteracoes_detectadas} alterações
                </span>
              )}
            </div>

            {/* Data de modificação do Planalto */}
            {lei.data_modificacao_planalto && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                <Calendar className="w-3 h-3 text-primary" />
                <span className="text-primary font-medium">
                  Última modificação no Planalto: {format(new Date(lei.data_modificacao_planalto), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
            
            {lei.erro_detalhes && (
              <p className="text-xs text-destructive mt-1 truncate">
                Erro: {lei.erro_detalhes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch 
              checked={lei.ativo} 
              onCheckedChange={() => toggleAtivo(lei.id, lei.ativo)}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => verificarLei(lei.tabela_lei, false)}
              disabled={isVerificando || verificandoTodas}
              title="Verificação rápida (compara hash)"
            >
              {isVerificando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => verificarLei(lei.tabela_lei, true)}
              disabled={isVerificando || verificandoTodas}
              title="Forçar comparação artigo por artigo"
              className="text-xs"
            >
              {isVerificando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => rasparComPdfOcr(lei)}
              disabled={isOcrProcessando || verificandoTodas}
              title="Raspar via PDF + OCR (Browserless + Gemini Vision)"
              className="text-xs"
            >
              {isOcrProcessando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileImage className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            Monitoramento de Alterações Legislativas
          </h1>
          <p className="text-muted-foreground">
            Sistema automático de verificação de atualizações nas leis do Planalto
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => { refetchLeis(); refetchExecucoes(); }}
            disabled={loadingLeis}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingLeis ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={verificarTodas}
            disabled={verificandoTodas}
          >
            {verificandoTodas ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Verificar Todas
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-primary">{leis?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Leis Monitoradas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-green-500">{leisAtualizadas.length}</div>
            <div className="text-sm text-muted-foreground">Atualizadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-amber-500">{leisComAlteracoes.length}</div>
            <div className="text-sm text-muted-foreground">Com Alterações</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-destructive">{leisComErro.length}</div>
            <div className="text-sm text-muted-foreground">Com Erro</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de alterações */}
      {leisComAlteracoes.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Alterações Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {leisComAlteracoes.map(lei => (
                <Badge key={lei.id} variant="outline" className="bg-amber-500/10">
                  {lei.nome_amigavel || lei.tabela_lei}
                  {lei.alteracoes_detectadas > 0 && (
                    <span className="ml-1 text-amber-500">({lei.alteracoes_detectadas})</span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Lista de Leis com Tabs */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Leis Monitoradas
              </CardTitle>
              <CardDescription>
                {leis?.filter(l => l.ativo).length} ativas de {leis?.length} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={categoriaAtiva} onValueChange={setCategoriaAtiva} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-4">
                  <TabsTrigger value="todas" className="text-xs">
                    Todas ({contagemPorCategoria.todas})
                  </TabsTrigger>
                  <TabsTrigger value="constituicao" className="text-xs">
                    <Landmark className="w-3 h-3 mr-1 hidden sm:inline" />
                    CF ({contagemPorCategoria.constituicao})
                  </TabsTrigger>
                  <TabsTrigger value="codigo" className="text-xs">
                    <Scale className="w-3 h-3 mr-1 hidden sm:inline" />
                    Códigos ({contagemPorCategoria.codigo})
                  </TabsTrigger>
                  <TabsTrigger value="estatuto" className="text-xs">
                    <BookOpen className="w-3 h-3 mr-1 hidden sm:inline" />
                    Estatutos ({contagemPorCategoria.estatuto})
                  </TabsTrigger>
                  <TabsTrigger value="lei" className="text-xs">
                    <ScrollText className="w-3 h-3 mr-1 hidden sm:inline" />
                    Leis ({contagemPorCategoria.lei})
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {loadingLeis ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : leisFiltradas.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma lei encontrada nesta categoria
                      </div>
                    ) : (
                      leisFiltradas.map(renderLeiCard)
                    )}
                  </div>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Execuções */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Últimas Execuções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {execucoes?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma execução registrada
                    </p>
                  ) : execucoes?.map(exec => (
                    <div key={exec.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={exec.status === 'concluido' ? 'default' : 
                               exec.status === 'erro' ? 'destructive' : 'secondary'}>
                          {exec.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(exec.inicio), "dd/MM HH:mm")}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <div className="font-medium">{exec.leis_verificadas}</div>
                          <div className="text-xs text-muted-foreground">verificadas</div>
                        </div>
                        <div>
                          <div className="font-medium text-amber-500">{exec.alteracoes_encontradas}</div>
                          <div className="text-xs text-muted-foreground">alterações</div>
                        </div>
                        <div>
                          <div className="font-medium text-destructive">{exec.erros}</div>
                          <div className="text-xs text-muted-foreground">erros</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Resultado OCR */}
      <Dialog open={modalOcrAberto} onOpenChange={setModalOcrAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-primary" />
              Resultado do OCR: {resultadoOcr?.leiNome}
            </DialogTitle>
            <DialogDescription>
              {resultadoOcr?.caracteres.toLocaleString()} caracteres extraídos em {((resultadoOcr?.tempoMs || 0) / 1000).toFixed(1)}s
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="alteracoes" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="alteracoes" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Alterações ({resultadoOcr?.alteracoes.length || 0})
              </TabsTrigger>
              <TabsTrigger value="texto" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Preview do Texto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alteracoes" className="flex-1 overflow-hidden mt-4">
              {/* Toggle de ordenação */}
              <div className="flex items-center justify-end gap-2 mb-3">
                <span className="text-xs text-muted-foreground">Ordenar:</span>
                <ToggleGroup 
                  type="single" 
                  value={ordenacaoAlteracoes}
                  onValueChange={(v) => v && setOrdenacaoAlteracoes(v as 'tipo' | 'data')}
                  size="sm"
                >
                  <ToggleGroupItem value="tipo" className="text-xs h-7 px-2">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Por tipo
                  </ToggleGroupItem>
                  <ToggleGroupItem value="data" className="text-xs h-7 px-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    Por data
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              <ScrollArea className="h-[370px] pr-4">
                {resultadoOcr?.alteracoes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma alteração legislativa encontrada.</p>
                    <p className="text-sm">O texto pode não conter anotações de alteração ou o OCR não as detectou.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...(resultadoOcr?.alteracoes || [])]
                      .sort((a, b) => {
                        if (ordenacaoAlteracoes === 'data') {
                          // Ordenar por data (mais recente primeiro)
                          const dataA = a.data || '0000-01-01';
                          const dataB = b.data || '0000-01-01';
                          return dataB.localeCompare(dataA);
                        }
                        // Por tipo (ordem padrão)
                        return 0;
                      })
                      .map((alt, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg border ${
                          alt.tipo === 'Revogado' ? 'bg-red-500/10 border-red-500/30' :
                          alt.tipo === 'Incluído' ? 'bg-green-500/10 border-green-500/30' :
                          alt.tipo === 'Redação alterada' ? 'bg-blue-500/10 border-blue-500/30' :
                          alt.tipo === 'Vetado' ? 'bg-orange-500/10 border-orange-500/30' :
                          'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={
                              alt.tipo === 'Revogado' ? 'bg-red-500/20 text-red-500' :
                              alt.tipo === 'Incluído' ? 'bg-green-500/20 text-green-500' :
                              alt.tipo === 'Redação alterada' ? 'bg-blue-500/20 text-blue-500' :
                              alt.tipo === 'Vetado' ? 'bg-orange-500/20 text-orange-500' :
                              ''
                            }
                          >
                            {alt.tipo}
                          </Badge>
                          {alt.artigo && (
                            <Badge variant="secondary" className="font-mono text-xs">
                              {alt.artigo}
                            </Badge>
                          )}
                          {alt.lei && (
                            <span className="text-xs text-muted-foreground">{alt.lei}</span>
                          )}
                          {alt.data && (
                            <Badge variant="outline" className="text-xs ml-auto">
                              <Calendar className="w-3 h-3 mr-1" />
                              {alt.data.split('-')[0]}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{alt.contexto}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="texto" className="flex-1 overflow-hidden mt-4">
              {/* Toggle entre Texto e Tabela */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <ToggleGroup 
                  type="single" 
                  value={previewMode}
                  onValueChange={(v) => {
                    if (v) {
                      setPreviewMode(v as 'texto' | 'tabela');
                      // Gerar tabela automaticamente quando selecionar tabela
                      if (v === 'tabela' && !tabelaEstruturada && !gerandoTabela) {
                        gerarTabelaEstruturada();
                      }
                    }
                  }}
                  size="sm"
                >
                  <ToggleGroupItem value="texto" className="text-xs h-7 px-3">
                    <FileText className="w-3 h-3 mr-1" />
                    Preview Texto
                  </ToggleGroupItem>
                  <ToggleGroupItem value="tabela" className="text-xs h-7 px-3">
                    <Table2 className="w-3 h-3 mr-1" />
                    Preview Tabela
                  </ToggleGroupItem>
                </ToggleGroup>

                {previewMode === 'tabela' && tabelaEstruturada && (
                  <Badge variant="secondary" className="text-xs">
                    {tabelaEstruturada.length} linhas
                  </Badge>
                )}
              </div>

              <ScrollArea className="h-[370px]">
                {previewMode === 'texto' ? (
                  <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-4 rounded-lg">
                    {resultadoOcr?.textoPreview}
                    {resultadoOcr?.textoPreview && resultadoOcr.caracteres > 3000 && (
                      <span className="text-muted-foreground">
                        {'\n\n'}[... {(resultadoOcr.caracteres - 3000).toLocaleString()} caracteres restantes ...]
                      </span>
                    )}
                  </pre>
                ) : gerandoTabela ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                    <p>Estruturando lei em tabela via Gemini...</p>
                    <p className="text-sm">Isso pode levar alguns segundos</p>
                  </div>
                ) : tabelaEstruturada ? (
                  <div className="rounded-lg border overflow-hidden">
                    {/* Legenda de cores */}
                    <div className="flex flex-wrap gap-2 p-2 bg-muted/30 border-b">
                      <span className="text-xs text-muted-foreground">Legenda:</span>
                      {Object.entries(alteracaoConfig).map(([key, config]) => (
                        <Badge key={key} variant="outline" className={`text-xs ${config.text} ${config.bg}`}>
                          {config.label}
                        </Badge>
                      ))}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[120px] font-semibold">Número</TableHead>
                          <TableHead className="font-semibold">Texto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tabelaEstruturada.map((linha, i) => {
                          const alterConfig = linha.alteracao ? alteracaoConfig[linha.alteracao] : null;
                          const isCabecalho = linha.numero === 'CABEÇALHO';
                          const config = isCabecalho ? cabecalhoConfig : alterConfig;
                          
                          return (
                            <TableRow 
                              key={i} 
                              className={`hover:bg-muted/30 ${config ? `${config.bg} border-l-4 ${config.border}` : ''}`}
                            >
                              <TableCell className={`font-mono text-xs align-top font-medium ${config ? config.text : 'text-primary'}`}>
                                <div className="flex flex-col gap-1">
                                  {linha.numero}
                                  {alterConfig && (
                                    <Badge variant="outline" className={`text-[10px] w-fit ${alterConfig.text} ${alterConfig.bg}`}>
                                      {alterConfig.label}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className={`text-sm whitespace-pre-wrap ${config?.text || ''}`}>
                                {linha.texto.split('\\n\\n').map((paragrafo, j) => (
                                  <p key={j} className={j > 0 ? 'mt-2' : ''}>
                                    {paragrafo}
                                  </p>
                                ))}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Table2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Clique em "Preview Tabela" para estruturar</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setModalOcrAberto(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
