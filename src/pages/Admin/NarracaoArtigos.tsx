import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Mic, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Trash2, 
  Play, 
  Pause,
  AlertTriangle,
  Loader2,
  ChevronUp,
  Sparkles,
  ArrowUpDown,
  Square,
  CheckSquare,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { narracaoApi, EstatisticasGerais, ArtigoNarracao, Anomalia } from "@/lib/api/narracaoApi";
import { supabase } from "@/integrations/supabase/client";

// Interface para artigo com prioridade
interface ArtigoComPrioridade extends ArtigoNarracao {
  prioridade?: 'alta' | 'media' | 'baixa';
}

const NarracaoArtigos = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Estados principais
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais | null>(null);
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [loading, setLoading] = useState(true);
  const [leiSelecionada, setLeiSelecionada] = useState<string | null>(null);
  const [artigos, setArtigos] = useState<ArtigoComPrioridade[]>([]);
  const [artigosOrdenados, setArtigosOrdenados] = useState<ArtigoComPrioridade[]>([]);
  const [loadingArtigos, setLoadingArtigos] = useState(false);
  const [modoOrdenacao, setModoOrdenacao] = useState<'numerica' | 'prioridade'>('numerica');
  
  // Estados de ação
  const [artigoExpandido, setArtigoExpandido] = useState<number | null>(null);
  const [audioTocando, setAudioTocando] = useState<number | null>(null);
  const [processando, setProcessando] = useState<number | null>(null);
  const [progressoNarracao, setProgressoNarracao] = useState<number>(0);
  
  // Estado para velocidade
  const [velocidadeSelecionada, setVelocidadeSelecionada] = useState<string>("padrao");
  const [velocidadeManual, setVelocidadeManual] = useState<string>("1.0");
  
  // Estado para sugestão IA
  const [loadingSugestao, setLoadingSugestao] = useState(false);
  
  // Estados para seleção em lote
  const [artigosSelecionados, setArtigosSelecionados] = useState<Set<number>>(new Set());
  const [modoSelecao, setModoSelecao] = useState(false);
  
  // Estados para job em lote
  const [jobAtivo, setJobAtivo] = useState<{
    id: string;
    status: string;
    artigos_total: number;
    artigos_processados: number;
    artigo_atual: number | null;
  } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Diálogos de confirmação
  const [dialogoConfirmacao, setDialogoConfirmacao] = useState<{
    tipo: 'narrar' | 'regenerar' | 'apagar';
    artigo: ArtigoNarracao;
  } | null>(null);
  
  // Diálogo de velocidade para lote
  const [dialogoVelocidadeLote, setDialogoVelocidadeLote] = useState(false);

  // Carregar estatísticas ao montar
  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    setLoading(true);
    try {
      const [stats, anomaliasData] = await Promise.all([
        narracaoApi.buscarEstatisticasGerais(),
        narracaoApi.detectarAnomalias(),
      ]);
      setEstatisticas(stats);
      setAnomalias(anomaliasData);
    } catch (e) {
      console.error('Erro ao carregar estatísticas:', e);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const carregarArtigosDaLei = async (tableName: string) => {
    setLoadingArtigos(true);
    setLeiSelecionada(tableName);
    setArtigosSelecionados(new Set());
    setModoSelecao(false);
    try {
      const data = await narracaoApi.buscarArtigosDaLei(tableName);
      
      // Carregar prioridades salvas do banco
      const artigosComPrioridades = await carregarPrioridadesSalvas(tableName, data);
      setArtigos(artigosComPrioridades);
      
      // Se há prioridades salvas, ativar modo de ordenação por prioridade
      const temPrioridades = artigosComPrioridades.some(a => a.prioridade);
      if (temPrioridades) {
        setModoOrdenacao('prioridade');
      }
      
      // Verificar se há job ativo para esta lei
      await verificarJobAtivo(tableName);
    } catch (e) {
      console.error('Erro ao carregar artigos:', e);
      toast.error('Erro ao carregar artigos');
    } finally {
      setLoadingArtigos(false);
    }
  };
  
  // Verificar job ativo
  const verificarJobAtivo = async (tableName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('narrar-lote', {
        body: { action: 'buscar-ativo', tabelaLei: tableName },
      });
      
      if (data?.job) {
        setJobAtivo(data.job);
        iniciarPolling(data.job.id);
      } else {
        setJobAtivo(null);
        pararPolling();
      }
    } catch (e) {
      console.error('Erro ao verificar job:', e);
    }
  };
  
  // Polling para atualizar status do job
  const iniciarPolling = (jobId: string) => {
    pararPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('narrar-lote', {
          body: { action: 'status', jobId },
        });
        
        if (data?.job) {
          setJobAtivo(data.job);
          
          // Se job terminou, recarregar artigos
          if (['concluido', 'cancelado', 'erro'].includes(data.job.status)) {
            pararPolling();
            if (leiSelecionada) {
              const artigosAtualizados = await narracaoApi.buscarArtigosDaLei(leiSelecionada);
              setArtigos(artigosAtualizados);
            }
            if (data.job.status === 'concluido') {
              toast.success('Narração em lote concluída!');
            }
          }
        }
      } catch (e) {
        console.error('Erro no polling:', e);
      }
    }, 2000);
  };
  
  const pararPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };
  
  // Limpar polling ao desmontar
  useEffect(() => {
    return () => pararPolling();
  }, []);

  const voltarParaLista = () => {
    setLeiSelecionada(null);
    setArtigos([]);
    setArtigoExpandido(null);
    setArtigosSelecionados(new Set());
    setModoSelecao(false);
    pararAudio();
    pararPolling();
  };

  // Controle de áudio
  const tocarAudio = (artigo: ArtigoNarracao) => {
    if (audioTocando === artigo.id) {
      pararAudio();
      return;
    }

    if (artigo.urlNarracao) {
      pararAudio();
      audioRef.current = new Audio(artigo.urlNarracao);
      audioRef.current.play();
      audioRef.current.onended = () => setAudioTocando(null);
      setAudioTocando(artigo.id);
    }
  };

  const pararAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioTocando(null);
  };

  // Obter velocidade baseada na seleção
  const getVelocidade = (): number => {
    switch (velocidadeSelecionada) {
      case "padrao":
        return 1.0;
      case "lento":
        return 0.85;
      case "rapido":
        return 1.15;
      case "manual":
        const val = parseFloat(velocidadeManual);
        return isNaN(val) ? 1.0 : Math.min(4.0, Math.max(0.25, val));
      default:
        return 1.0;
    }
  };

  // Ações com confirmação
  const executarAcao = async () => {
    if (!dialogoConfirmacao || !leiSelecionada) return;

    const { tipo, artigo } = dialogoConfirmacao;
    setDialogoConfirmacao(null);
    setProcessando(artigo.id);
    setProgressoNarracao(0);

    // Simular progresso durante a geração
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    if (tipo === 'narrar' || tipo === 'regenerar') {
      progressInterval = setInterval(() => {
        setProgressoNarracao(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);
    }

    try {
      if (tipo === 'apagar') {
        const result = await narracaoApi.apagarNarracao(leiSelecionada, artigo.id);
        if (result.success) {
          toast.success('Narração apagada com sucesso');
          await carregarArtigosDaLei(leiSelecionada);
        } else {
          toast.error(result.error || 'Erro ao apagar narração');
        }
      } else if (tipo === 'narrar' || tipo === 'regenerar') {
        const nomeAmigavel = estatisticas?.porLei.find(l => l.nome === leiSelecionada)?.nomeAmigavel || leiSelecionada;
        const velocidade = getVelocidade();
        
        const result = await narracaoApi.gerarNarracao(
          leiSelecionada,
          artigo.id,
          artigo.artigo,
          nomeAmigavel,
          velocidade
        );
        
        setProgressoNarracao(100);
        
        if (result.success) {
          toast.success(tipo === 'regenerar' ? 'Narração regenerada com sucesso' : 'Narração gerada com sucesso');
          await carregarArtigosDaLei(leiSelecionada);
        } else {
          toast.error(result.error || 'Não foi possível narrar o áudio');
        }
      }
    } catch (e) {
      toast.error('Erro ao executar ação');
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setProcessando(null);
      setProgressoNarracao(0);
    }
  };

  // Carregar prioridades salvas do banco
  const carregarPrioridadesSalvas = async (tableName: string, artigosData: ArtigoComPrioridade[]) => {
    try {
      const { data: prioridades, error } = await supabase
        .from('narracao_prioridades')
        .select('numero_artigo, prioridade')
        .eq('tabela_lei', tableName);
      
      if (error) {
        console.error('Erro ao carregar prioridades:', error);
        return artigosData;
      }
      
      if (prioridades && prioridades.length > 0) {
        const prioridadesMap = new Map<string, 'alta' | 'media' | 'baixa'>();
        prioridades.forEach((p) => {
          prioridadesMap.set(p.numero_artigo, p.prioridade as 'alta' | 'media' | 'baixa');
        });
        
        return artigosData.map(a => ({
          ...a,
          prioridade: prioridadesMap.get(a.numeroArtigo),
        }));
      }
      
      return artigosData;
    } catch (e) {
      console.error('Erro ao carregar prioridades:', e);
      return artigosData;
    }
  };

  // Salvar prioridades no banco
  const salvarPrioridades = async (tableName: string, sugestoes: { numero: string; prioridade: 'alta' | 'media' | 'baixa'; motivo?: string }[]) => {
    try {
      // Deletar prioridades existentes desta lei
      await supabase
        .from('narracao_prioridades')
        .delete()
        .eq('tabela_lei', tableName);
      
      // Inserir novas prioridades
      const registros = sugestoes.map(s => ({
        tabela_lei: tableName,
        numero_artigo: s.numero,
        prioridade: s.prioridade,
        motivo: s.motivo || null,
      }));
      
      const { error } = await supabase
        .from('narracao_prioridades')
        .insert(registros);
      
      if (error) {
        console.error('Erro ao salvar prioridades:', error);
        toast.error('Erro ao salvar prioridades');
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Erro ao salvar prioridades:', e);
      return false;
    }
  };

  // Sugestão de artigos por IA
  const buscarSugestaoIA = async () => {
    if (!leiSelecionada) return;
    
    setLoadingSugestao(true);
    try {
      const leiInfo = estatisticas?.porLei.find(l => l.nome === leiSelecionada);
      const artigosNaoNarrados = artigos.filter(a => !a.temNarracao);
      
      if (artigosNaoNarrados.length === 0) {
        toast.info('Todos os artigos já foram narrados!');
        return;
      }
      
      // Preparar lista de artigos para a IA analisar
      const listaArtigos = artigosNaoNarrados.slice(0, 50).map(a => ({
        numero: a.numeroArtigo,
        resumo: a.artigo.substring(0, 200),
      }));
      
      const { data, error } = await supabase.functions.invoke('sugerir-artigos-narracao', {
        body: {
          nomeLei: leiInfo?.nomeAmigavel || leiSelecionada,
          artigos: listaArtigos,
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.sugestoes) {
        // Salvar prioridades no banco
        const salvo = await salvarPrioridades(leiSelecionada, data.sugestoes);
        
        if (salvo) {
          // Atualizar artigos com prioridades
          const prioridadesMap = new Map<string, 'alta' | 'media' | 'baixa'>();
          data.sugestoes.forEach((s: { numero: string; prioridade: 'alta' | 'media' | 'baixa' }) => {
            prioridadesMap.set(s.numero, s.prioridade);
          });
          
          const artigosComPrioridade = artigos.map(a => ({
            ...a,
            prioridade: prioridadesMap.get(a.numeroArtigo),
          }));
          
          setArtigos(artigosComPrioridade);
          setModoOrdenacao('prioridade');
          toast.success('Artigos priorizados e salvos com sucesso!');
        }
      }
    } catch (e) {
      console.error('Erro ao buscar sugestão:', e);
      toast.error('Erro ao buscar sugestão da IA');
    } finally {
      setLoadingSugestao(false);
    }
  };

  // Funções de seleção em lote
  const toggleSelecionarArtigo = (id: number) => {
    const novoSet = new Set(artigosSelecionados);
    if (novoSet.has(id)) {
      novoSet.delete(id);
    } else {
      novoSet.add(id);
    }
    setArtigosSelecionados(novoSet);
  };
  
  const selecionarTodosNaoNarrados = () => {
    const idsNaoNarrados = artigos.filter(a => !a.temNarracao).map(a => a.id);
    setArtigosSelecionados(new Set(idsNaoNarrados));
  };
  
  const limparSelecao = () => {
    setArtigosSelecionados(new Set());
    setModoSelecao(false);
  };
  
  // Iniciar narração em lote
  const iniciarNarracaoLote = async () => {
    if (!leiSelecionada || artigosSelecionados.size === 0) return;
    
    setDialogoVelocidadeLote(false);
    
    const velocidade = getVelocidade();
    const idsArray = Array.from(artigosSelecionados);
    
    try {
      const { data, error } = await supabase.functions.invoke('narrar-lote', {
        body: {
          action: 'iniciar',
          tabelaLei: leiSelecionada,
          artigosIds: idsArray,
          velocidade,
        },
      });
      
      if (error) throw new Error(error.message);
      
      if (data?.jobId) {
        toast.success(`Iniciando narração de ${idsArray.length} artigos...`);
        setJobAtivo({
          id: data.jobId,
          status: 'processando',
          artigos_total: idsArray.length,
          artigos_processados: 0,
          artigo_atual: null,
        });
        iniciarPolling(data.jobId);
        limparSelecao();
      }
    } catch (e) {
      console.error('Erro ao iniciar lote:', e);
      toast.error('Erro ao iniciar narração em lote');
    }
  };
  
  // Pausar job
  const pausarJob = async () => {
    if (!jobAtivo) return;
    
    try {
      await supabase.functions.invoke('narrar-lote', {
        body: { action: 'pausar', jobId: jobAtivo.id },
      });
      toast.info('Narração pausada');
    } catch (e) {
      toast.error('Erro ao pausar');
    }
  };
  
  // Retomar job
  const retomarJob = async () => {
    if (!jobAtivo) return;
    
    try {
      await supabase.functions.invoke('narrar-lote', {
        body: { action: 'retomar', jobId: jobAtivo.id },
      });
      toast.success('Narração retomada');
    } catch (e) {
      toast.error('Erro ao retomar');
    }
  };
  
  // Cancelar job
  const cancelarJob = async () => {
    if (!jobAtivo) return;
    
    try {
      await supabase.functions.invoke('narrar-lote', {
        body: { action: 'cancelar', jobId: jobAtivo.id },
      });
      toast.info('Narração cancelada');
      pararPolling();
      setJobAtivo(null);
    } catch (e) {
      toast.error('Erro ao cancelar');
    }
  };

  // Cor baseada no percentual
  const getCorPercentual = (percentual: number) => {
    if (percentual >= 80) return 'hsl(var(--chart-2))';
    if (percentual >= 50) return 'hsl(var(--chart-4))';
    return 'hsl(var(--chart-1))';
  };

  // Badge de prioridade com novas cores
  const renderBadgePrioridade = (prioridade?: 'alta' | 'media' | 'baixa') => {
    if (!prioridade) return null;
    
    const cores = {
      alta: 'bg-green-500/20 text-green-500 border-green-500/50',
      media: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
      baixa: 'bg-white/20 text-muted-foreground border-border',
    };
    
    const labels = {
      alta: 'Alta',
      media: 'Média',
      baixa: 'Baixa',
    };
    
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cores[prioridade]}`}>
        {labels[prioridade]}
      </span>
    );
  };

  // Ordenar artigos baseado no modo
  const getArtigosOrdenados = () => {
    if (modoOrdenacao === 'prioridade') {
      const temPrioridade = artigos.some(a => a.prioridade);
      if (temPrioridade) {
        return [...artigos].sort((a, b) => {
          const ordemPrioridade = { alta: 0, media: 1, baixa: 2, undefined: 3 };
          const pA = ordemPrioridade[a.prioridade as keyof typeof ordemPrioridade] ?? 3;
          const pB = ordemPrioridade[b.prioridade as keyof typeof ordemPrioridade] ?? 3;
          return pA - pB;
        });
      }
    }
    return artigos;
  };

  // Renderizar estatísticas gerais
  const renderEstatisticasGerais = () => {
    if (!estatisticas) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Artigos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalArtigos.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Artigos Narrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{estatisticas.totalNarrados.toLocaleString()}</div>
            <Progress value={estatisticas.percentualGeral} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faltam Narrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {(estatisticas.totalArtigos - estatisticas.totalNarrados).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticas.percentualGeral}% concluído
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar anomalias
  const renderAnomalias = () => {
    if (anomalias.length === 0) return null;

    return (
      <Card className="mb-6 border-orange-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-orange-500">
            <AlertTriangle className="h-4 w-4" />
            Anomalias Detectadas ({anomalias.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {anomalias.map((anomalia, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <VolumeX className="h-3 w-3 text-orange-500" />
                <span><strong>{anomalia.lei}:</strong> {anomalia.descricao}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar lista de leis
  const renderListaLeis = () => {
    if (!estatisticas) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {estatisticas.porLei.map((lei) => (
          <button
            key={lei.nome}
            onClick={() => carregarArtigosDaLei(lei.nome)}
            className="bg-card border border-border rounded-xl p-4 text-left transition-all hover:bg-muted/50 hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{lei.nomeAmigavel}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                lei.percentual >= 80 ? 'bg-green-500/20 text-green-500' :
                lei.percentual >= 50 ? 'bg-yellow-500/20 text-yellow-500' :
                'bg-red-500/20 text-red-500'
              }`}>
                {lei.percentual}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              {lei.narrados > 0 ? (
                <Volume2 className="h-3 w-3 text-green-500" />
              ) : (
                <VolumeX className="h-3 w-3 text-muted-foreground" />
              )}
              <span>{lei.narrados}/{lei.total} artigos narrados</span>
            </div>
            <Progress value={lei.percentual} className="h-1.5" />
          </button>
        ))}
      </div>
    );
  };

  // Renderizar lista de artigos
  const renderListaArtigos = () => {
    if (!leiSelecionada) return null;

    const leiInfo = estatisticas?.porLei.find(l => l.nome === leiSelecionada);

    return (
      <div className="space-y-4">
        {/* Header da lei */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold">{leiInfo?.nomeAmigavel || leiSelecionada}</h2>
            <p className="text-sm text-muted-foreground">
              {leiInfo?.narrados || 0}/{leiInfo?.total || 0} artigos narrados ({leiInfo?.percentual || 0}%)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão de modo seleção */}
            {!jobAtivo && (
              <Button 
                variant={modoSelecao ? 'default' : 'outline'}
                size="sm" 
                onClick={() => setModoSelecao(!modoSelecao)}
              >
                {modoSelecao ? (
                  <CheckSquare className="h-4 w-4 mr-1" />
                ) : (
                  <Square className="h-4 w-4 mr-1" />
                )}
                Selecionar
              </Button>
            )}
            
            {/* Menu de alternância de ordenação */}
            {artigos.some(a => a.prioridade) && (
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                <Button 
                  variant={modoOrdenacao === 'numerica' ? 'default' : 'ghost'}
                  size="sm" 
                  className="h-7 px-3 text-xs"
                  onClick={() => setModoOrdenacao('numerica')}
                >
                  Numérica
                </Button>
                <Button 
                  variant={modoOrdenacao === 'prioridade' ? 'default' : 'ghost'}
                  size="sm" 
                  className="h-7 px-3 text-xs"
                  onClick={() => setModoOrdenacao('prioridade')}
                >
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  Prioridade
                </Button>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={buscarSugestaoIA}
              disabled={loadingSugestao}
            >
              {loadingSugestao ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              Sugestão
            </Button>
            <Button variant="outline" size="sm" onClick={voltarParaLista}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          </div>
        </div>

        <Progress value={leiInfo?.percentual || 0} className="h-2" />
        
        {/* Barra de job ativo */}
        {jobAtivo && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {jobAtivo.status === 'processando' && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {jobAtivo.status === 'pausado' && (
                    <Pause className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="font-medium text-sm">
                    {jobAtivo.status === 'processando' ? 'Narrando em lote...' : 
                     jobAtivo.status === 'pausado' ? 'Pausado' : 
                     jobAtivo.status === 'concluido' ? 'Concluído!' : 'Processando...'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {jobAtivo.artigos_processados}/{jobAtivo.artigos_total} artigos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {jobAtivo.status === 'processando' && (
                    <Button variant="outline" size="sm" onClick={pausarJob}>
                      <Pause className="h-3 w-3 mr-1" />
                      Pausar
                    </Button>
                  )}
                  {jobAtivo.status === 'pausado' && (
                    <Button variant="default" size="sm" onClick={retomarJob}>
                      <Play className="h-3 w-3 mr-1" />
                      Retomar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={cancelarJob}>
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
              <Progress 
                value={(jobAtivo.artigos_processados / jobAtivo.artigos_total) * 100} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {Math.round((jobAtivo.artigos_processados / jobAtivo.artigos_total) * 100)}% concluído
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Barra de seleção */}
        {modoSelecao && artigosSelecionados.size > 0 && (
          <Card className="border-blue-500/50 bg-blue-500/5">
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm">
                  {artigosSelecionados.size} artigo(s) selecionado(s)
                </span>
                <Button variant="link" size="sm" className="h-auto p-0" onClick={selecionarTodosNaoNarrados}>
                  Selecionar todos sem narração
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="default" size="sm" onClick={() => setDialogoVelocidadeLote(true)}>
                  <Mic className="h-4 w-4 mr-1" />
                  Narrar todos
                </Button>
                <Button variant="ghost" size="sm" onClick={limparSelecao}>
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de artigos */}
        {loadingArtigos ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-2 pr-4">
              {getArtigosOrdenados().map((artigo) => (
                <Collapsible
                  key={artigo.id}
                  open={artigoExpandido === artigo.id}
                  onOpenChange={(open) => setArtigoExpandido(open ? artigo.id : null)}
                >
                  <div className={`bg-card border rounded-lg p-3 ${
                    artigosSelecionados.has(artigo.id) ? 'border-primary bg-primary/5' : 'border-border'
                  } ${jobAtivo?.artigo_atual === artigo.id ? 'ring-2 ring-primary' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Checkbox de seleção */}
                        {modoSelecao && !artigo.temNarracao && (
                          <button 
                            onClick={() => toggleSelecionarArtigo(artigo.id)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            {artigosSelecionados.has(artigo.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        )}
                        
                        {artigo.temNarracao ? (
                          <Volume2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <VolumeX className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">{artigo.numeroArtigo}</span>
                        {renderBadgePrioridade(artigo.prioridade)}
                        
                        {/* Indicador de processamento atual do lote */}
                        {jobAtivo?.artigo_atual === artigo.id && (
                          <div className="flex items-center gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            <span className="text-xs text-primary font-medium">Narrando...</span>
                          </div>
                        )}
                        
                        {processando === artigo.id && (
                          <div className="flex items-center gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            <span className="text-xs text-primary font-medium">
                              {Math.round(progressoNarracao)}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Botão Visualizar */}
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            {artigoExpandido === artigo.id ? (
                              <ChevronUp className="h-3 w-3 mr-1" />
                            ) : null}
                            Visualizar
                          </Button>
                        </CollapsibleTrigger>

                        {/* Botão Ouvir */}
                        {artigo.temNarracao && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => tocarAudio(artigo)}
                          >
                            {audioTocando === artigo.id ? (
                              <Pause className="h-3 w-3 text-green-500" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                        )}

                        {/* Botão Narrar/Regenerar */}
                        {artigo.temNarracao ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={processando === artigo.id}
                            onClick={() => setDialogoConfirmacao({
                              tipo: 'regenerar',
                              artigo,
                            })}
                          >
                            <RefreshCw className="h-3 w-3 text-blue-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            disabled={processando === artigo.id}
                            onClick={() => setDialogoConfirmacao({
                              tipo: 'narrar',
                              artigo,
                            })}
                          >
                            Narrar
                          </Button>
                        )}

                        {/* Botão Apagar */}
                        {artigo.temNarracao && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={processando === artigo.id}
                            onClick={() => setDialogoConfirmacao({
                              tipo: 'apagar',
                              artigo,
                            })}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Conteúdo expandido */}
                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {artigo.artigo || 'Texto não disponível'}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="container mx-auto px-3 py-4 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Narração de Artigos</h1>
            <p className="text-xs text-muted-foreground">
              Gerenciar áudios de narração do Vade Mecum
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={carregarEstatisticas} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : leiSelecionada ? (
          renderListaArtigos()
        ) : (
          <>
            {renderEstatisticasGerais()}
            {renderAnomalias()}
            <h2 className="text-base font-semibold mb-3">Leis Disponíveis</h2>
            {renderListaLeis()}
          </>
        )}
      </div>

      {/* Diálogo de Confirmação com escolha de velocidade */}
      <Dialog open={!!dialogoConfirmacao} onOpenChange={() => setDialogoConfirmacao(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogoConfirmacao?.tipo === 'apagar' && <Trash2 className="h-5 w-5 text-red-500" />}
              {dialogoConfirmacao?.tipo === 'narrar' && <Mic className="h-5 w-5 text-primary" />}
              {dialogoConfirmacao?.tipo === 'regenerar' && <RefreshCw className="h-5 w-5 text-blue-500" />}
              Confirmar Ação
            </DialogTitle>
            <DialogDescription>
              {dialogoConfirmacao?.tipo === 'apagar' && (
                <>Tem certeza que deseja <strong>APAGAR</strong> a narração do <strong>{dialogoConfirmacao?.artigo?.numeroArtigo}</strong>?</>
              )}
              {dialogoConfirmacao?.tipo === 'narrar' && (
                <>Deseja <strong>NARRAR</strong> o <strong>{dialogoConfirmacao?.artigo?.numeroArtigo}</strong>?</>
              )}
              {dialogoConfirmacao?.tipo === 'regenerar' && (
                <>Deseja <strong>RENARRAR</strong> o <strong>{dialogoConfirmacao?.artigo?.numeroArtigo}</strong>? A narração anterior será substituída.</>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Seleção de velocidade para narrar/regenerar */}
          {(dialogoConfirmacao?.tipo === 'narrar' || dialogoConfirmacao?.tipo === 'regenerar') && (
            <div className="space-y-4 py-4">
              <Label className="text-sm font-medium">Velocidade da narração:</Label>
              <RadioGroup 
                value={velocidadeSelecionada} 
                onValueChange={setVelocidadeSelecionada}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="padrao" id="padrao" />
                  <Label htmlFor="padrao" className="font-normal cursor-pointer">
                    Padrão (1.0x)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lento" id="lento" />
                  <Label htmlFor="lento" className="font-normal cursor-pointer">
                    Mais lento (0.85x)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rapido" id="rapido" />
                  <Label htmlFor="rapido" className="font-normal cursor-pointer">
                    Mais rápido (1.15x)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="font-normal cursor-pointer">
                    Definir manualmente
                  </Label>
                </div>
              </RadioGroup>
              
              {velocidadeSelecionada === 'manual' && (
                <div className="flex items-center gap-2 pl-6">
                  <Input
                    type="number"
                    step="0.05"
                    min="0.25"
                    max="4.0"
                    value={velocidadeManual}
                    onChange={(e) => setVelocidadeManual(e.target.value)}
                    className="w-24 h-8"
                    placeholder="1.0"
                  />
                  <span className="text-sm text-muted-foreground">(0.25 a 4.0)</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogoConfirmacao(null)}>
              Cancelar
            </Button>
            <Button 
              variant={dialogoConfirmacao?.tipo === 'apagar' ? 'destructive' : 'default'}
              onClick={executarAcao}
            >
              {dialogoConfirmacao?.tipo === 'apagar' && 'Sim, Apagar'}
              {dialogoConfirmacao?.tipo === 'narrar' && 'Sim, Narrar'}
              {dialogoConfirmacao?.tipo === 'regenerar' && 'Sim, Renarrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de velocidade para lote */}
      <Dialog open={dialogoVelocidadeLote} onOpenChange={setDialogoVelocidadeLote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Narrar {artigosSelecionados.size} artigos</DialogTitle>
            <DialogDescription>
              Escolha a velocidade de narração para todos os artigos selecionados.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3">
            <RadioGroup value={velocidadeSelecionada} onValueChange={setVelocidadeSelecionada}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="padrao" id="lote-padrao" />
                <Label htmlFor="lote-padrao" className="font-normal cursor-pointer">Padrão (1.0x)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lento" id="lote-lento" />
                <Label htmlFor="lote-lento" className="font-normal cursor-pointer">Mais lento (0.85x)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rapido" id="lote-rapido" />
                <Label htmlFor="lote-rapido" className="font-normal cursor-pointer">Mais rápido (1.15x)</Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoVelocidadeLote(false)}>Cancelar</Button>
            <Button onClick={iniciarNarracaoLote}>
              <Mic className="h-4 w-4 mr-1" />
              Iniciar Narração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NarracaoArtigos;
