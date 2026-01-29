import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, ExternalLink, Sparkles, ChevronRight, RefreshCw, Clock, CheckCircle2, Search, Zap, Home, Download, Terminal, ChevronDown, ChevronUp, XCircle, Play, Pause, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAutomacaoFormatacao } from '@/hooks/useAutomacaoFormatacao';
import { AutomacaoEstatisticas } from '@/components/AutomacaoEstatisticas';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { FiltrosNovasLeis, FontePlanalto } from '@/components/NovasLeisSidebar';

interface LeiPublicada {
  id: string;
  numero_lei: string;
  tipo_ato: string | null;
  ementa: string | null;
  data_publicacao: string | null;
  data_dou: string | null;        // Data de publicação no DOU
  data_ato: string | null;        // Data oficial do ato
  url_planalto: string;
  artigos: any[];
  areas_direito: string[];
  created_at: string;
  status: 'pendente' | 'aprovado' | 'publicado';
  ordem_dou: number | null;
  texto_bruto?: string | null;
}

interface StatusBusca {
  etapa: 'idle' | 'conectando' | 'raspando' | 'processando' | 'finalizado';
  mensagem: string;
  novasLeis?: number;
  horario?: string;
}

interface StatusRaspagem {
  ativo: boolean;
  processadas: number;
  total: number;
  mensagem: string;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export default function NovasLeis() {
  const navigate = useNavigate();
  const [leis, setLeis] = useState<LeiPublicada[]>([]);
  const [leisPopuladas, setLeisPopuladas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusBusca, setStatusBusca] = useState<StatusBusca>({ etapa: 'idle', mensagem: '' });
  const [fonteSelecionada, setFonteSelecionada] = useState<FontePlanalto>('todas');
  const [dialogBuscaAberto, setDialogBuscaAberto] = useState(false);
  const [statusRaspagem, setStatusRaspagem] = useState<StatusRaspagem>({ ativo: false, processadas: 0, total: 0, mensagem: '' });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsAbertos, setLogsAbertos] = useState(false);
  const [logsAutoAbertos, setLogsAutoAbertos] = useState(false);
  
  // Hook de automação
  const automacao = useAutomacaoFormatacao();
  
  // Filtros - ano e mês padrão são os atuais
  const [filtros, setFiltros] = useState<FiltrosNovasLeis>({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1, // Janeiro = 1, Dezembro = 12
    dia: new Date().getDate(), // Dia atual selecionado por padrão
    status: 'todos',
    automacao: false
  });

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Categorias válidas para a API (excluindo 'todas' e 'leis-delegadas')
  const CATEGORIAS_VALIDAS = ['decretos', 'leis-ordinarias', 'leis-complementares', 'medidas-provisorias', 'projetos-lei', 'plp', 'pec'];

  // Nomes dos meses
  const MESES_NOMES_BUSCA = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Função helper para adicionar logs
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date();
    const timestamp = `${now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    })}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const abrirDialogoBusca = () => {
    setDialogBuscaAberto(true);
  };

  const executarBusca = async (escopo: 'dia' | 'mes' | 'ano') => {
    setDialogBuscaAberto(false);
    setBuscando(true);
    setLogs([]); // Limpa logs anteriores
    setLogsAbertos(true); // Abre o painel de logs
    const horarioInicio = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const anoSelecionado = filtros.ano || new Date().getFullYear();
    const mesSelecionado = filtros.mes || new Date().getMonth() + 1;
    const diaSelecionado = filtros.dia || new Date().getDate();
    
    const escopoLabel = escopo === 'dia' 
      ? `${diaSelecionado}/${String(mesSelecionado).padStart(2, '0')}/${anoSelecionado}`
      : escopo === 'mes'
        ? `${MESES_NOMES_BUSCA[mesSelecionado]} de ${anoSelecionado}`
        : `Ano ${anoSelecionado}`;
    
    try {
      addLog(`🚀 Iniciando busca: ${escopoLabel}`, 'info');
      setStatusBusca({ etapa: 'conectando', mensagem: `Conectando ao Planalto (${escopoLabel})...`, horario: horarioInicio });
      addLog(`📡 Conectando ao Planalto...`, 'info');
      await delay(500);
      
      setStatusBusca({ etapa: 'raspando', mensagem: `Buscando atos normativos...`, horario: horarioInicio });
      addLog(`🔍 Buscando atos normativos...`, 'info');
      
      let totalNovos = 0;
      let porTipo: Record<string, number> = {};
      const mesesNomesApi = ['', 'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      
      // Se 'todas' está selecionado, usar a resenha diária (traz todos os tipos incluindo LC)
      if (fonteSelecionada === 'todas') {
        // Se escopo é 'ano', buscar todos os meses de janeiro até o mês atual
        if (escopo === 'ano') {
          const mesAtual = new Date().getMonth() + 1;
          const mesLimite = anoSelecionado === new Date().getFullYear() ? mesAtual : 12;
          addLog(`📅 Buscando ${mesLimite} meses do ano ${anoSelecionado}...`, 'info');
          
          for (let mes = 1; mes <= mesLimite; mes++) {
            setStatusBusca({ etapa: 'raspando', mensagem: `Buscando ${mesesNomesApi[mes]}...`, horario: horarioInicio });
            addLog(`📆 Raspando mês: ${mesesNomesApi[mes]}...`, 'info');
            
            const { data, error } = await supabase.functions.invoke('raspar-resenha-diaria', { 
              body: { 
                ano: anoSelecionado,
                mes: mesesNomesApi[mes]
              } 
            });
            
            if (error) {
              addLog(`❌ Erro ao raspar ${mesesNomesApi[mes]}: ${error.message}`, 'error');
            } else if (data) {
              const novosAtos = data?.novos_atos || data?.novasLeis || 0;
              const totalPagina = data?.total_pagina || 0;
              totalNovos += novosAtos;
              
              if (data?.scrape_failed) {
                addLog(`⚠️ ${mesesNomesApi[mes]}: Raspagem falhou, usando dados em cache`, 'warning');
              } else if (novosAtos > 0) {
                addLog(`✅ ${mesesNomesApi[mes]}: ${totalPagina} atos na página, ${novosAtos} novos inseridos`, 'success');
              } else {
                addLog(`ℹ️ ${mesesNomesApi[mes]}: ${totalPagina} atos na página, nenhum novo`, 'info');
              }
              
              const tipoParcial = data?.por_tipo || {};
              Object.entries(tipoParcial).forEach(([tipo, qtd]) => {
                porTipo[tipo] = (porTipo[tipo] || 0) + (qtd as number);
              });
            }
          }
        } else {
          // Buscar apenas o mês selecionado
          addLog(`📆 Raspando resenha diária: ${mesesNomesApi[mesSelecionado]} de ${anoSelecionado}`, 'info');
          
          const startTime = Date.now();
          const { data, error } = await supabase.functions.invoke('raspar-resenha-diaria', { 
            body: { 
              ano: anoSelecionado,
              mes: mesesNomesApi[mesSelecionado]
            } 
          });
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          
          if (error) {
            addLog(`❌ Erro na raspagem: ${error.message}`, 'error');
          } else if (data) {
            totalNovos = data?.novos_atos || data?.novasLeis || 0;
            porTipo = data?.por_tipo || {};
            
            if (data?.scrape_failed) {
              addLog(`⚠️ Raspagem do Planalto falhou: ${data?.error_message || 'timeout'}`, 'warning');
              addLog(`ℹ️ Usando ${data?.total_pagina || 0} registros em cache`, 'info');
            } else {
              addLog(`✅ Raspagem concluída em ${elapsed}s`, 'success');
              addLog(`📊 ${data?.total_pagina || 0} atos encontrados na página`, 'info');
              
              if (data?.atos?.length > 0) {
                addLog(`🆕 Novos atos inseridos:`, 'info');
                data.atos.slice(0, 10).forEach((ato: { tipo: string; numero: string }) => {
                  addLog(`   • ${ato.tipo} ${ato.numero || ''}`.trim(), 'success');
                });
                if (data.atos.length > 10) {
                  addLog(`   ... e mais ${data.atos.length - 10} atos`, 'info');
                }
              }
            }
          }
        }
      } else {
        // Buscar categoria específica
        addLog(`🏷️ Buscando categoria: ${fonteSelecionada}`, 'info');
        
        const { data, error } = await supabase.functions.invoke('raspar-planalto-categoria', { 
          body: { 
            categoria: fonteSelecionada, 
            ano: anoSelecionado,
            mes: escopo === 'mes' || escopo === 'dia' ? mesSelecionado : undefined,
            dia: escopo === 'dia' ? diaSelecionado : undefined
          } 
        });
        
        if (error) {
          addLog(`❌ Erro ao buscar ${fonteSelecionada}: ${error.message}`, 'error');
        } else if (data) {
          totalNovos = data?.novos_atos || data?.novasLeis || 0;
          if (data?.categoria) {
            porTipo[data.categoria] = data?.novos_atos || data?.novasLeis || 0;
          }
          addLog(`✅ Encontrados ${totalNovos} novos atos em ${fonteSelecionada}`, 'success');
        }
      }
      
      setStatusBusca({ etapa: 'processando', mensagem: 'Processando resultados...', novasLeis: totalNovos, horario: horarioInicio });
      addLog(`⏳ Processando e salvando resultados...`, 'info');
      await delay(500);
      
      const horarioFim = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setStatusBusca({ 
        etapa: 'finalizado', 
        mensagem: `Busca concluída às ${horarioFim}`, 
        novasLeis: totalNovos,
        horario: horarioFim
      });
      
      const tiposEncontrados = Object.entries(porTipo).filter(([_, qtd]) => qtd > 0).map(([tipo, qtd]) => `${qtd} ${tipo}`).join(', ');
      
      if (totalNovos > 0) {
        addLog(`🎉 Total: ${totalNovos} novos atos encontrados e salvos!`, 'success');
        if (tiposEncontrados) {
          addLog(`📋 Resumo: ${tiposEncontrados}`, 'info');
        }
      } else {
        addLog(`ℹ️ Nenhum ato novo encontrado (todos já estavam no banco)`, 'info');
      }
      addLog(`✅ Busca finalizada às ${horarioFim}`, 'success');
      
      toast.success(`${totalNovos} novos atos encontrados${tiposEncontrados ? `: ${tiposEncontrados}` : ''}`);
      fetchLeis();
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Erro ao buscar atos:', err);
      addLog(`❌ Erro fatal: ${err instanceof Error ? err.message : 'Erro desconhecido'}`, 'error');
      setStatusBusca({ etapa: 'idle', mensagem: '' });
      toast.error('Erro ao buscar novos atos');
    } finally {
      setBuscando(false);
    }
  };

  // Função para raspar textos em lote
  const rasparTextosLote = async () => {
    // Contar leis sem texto_bruto no período atual
    const leisSemTexto = leisFiltradas.filter(lei => !lei.texto_bruto || lei.texto_bruto.trim() === '');
    
    if (leisSemTexto.length === 0) {
      toast.info('Todos os atos já têm texto raspado!');
      return;
    }
    
    setStatusRaspagem({ 
      ativo: true, 
      processadas: 0, 
      total: leisSemTexto.length, 
      mensagem: `Iniciando raspagem de ${leisSemTexto.length} atos...` 
    });
    
    try {
      const dataFiltro = filtros.dia && filtros.mes && filtros.ano 
        ? `${filtros.ano}-${String(filtros.mes).padStart(2, '0')}-${String(filtros.dia).padStart(2, '0')}`
        : null;
      
      const { data, error } = await supabase.functions.invoke('raspar-textos-lote', { 
        body: { 
          limite: Math.min(leisSemTexto.length, 20), // Processar até 20 por vez
          dataFiltro
        } 
      });
      
      if (error) {
        throw error;
      }
      
      setStatusRaspagem({ 
        ativo: false, 
        processadas: data?.processadas || 0, 
        total: data?.total || 0, 
        mensagem: `Concluído: ${data?.processadas || 0} textos raspados` 
      });
      
      toast.success(`${data?.processadas || 0} textos raspados com sucesso!`);
      
      // Recarregar dados
      fetchLeis();
      
    } catch (err) {
      console.error('Erro ao raspar textos:', err);
      setStatusRaspagem({ ativo: false, processadas: 0, total: 0, mensagem: '' });
      toast.error('Erro ao raspar textos');
    }
  };

  // Auto-selecionar último dia com publicações ao carregar
  useEffect(() => {
    const inicializar = async () => {
      await fetchLeis();
      await fetchLeisPopuladas();
    };
    inicializar();
  }, []);

  // Mantém o filtro padrão como a data atual (já definido no useState inicial)
  // Não sobrescreve para o "último dia com publicações" - sempre mostra a data atual

  // Recarregar leis quando automação processar
  useEffect(() => {
    if (automacao.estado?.leis_processadas && automacao.estado.leis_processadas > 0) {
      fetchLeis();
    }
  }, [automacao.estado?.leis_processadas]);

  const fetchLeisPopuladas = async () => {
    try {
      const { data } = await supabase
        .from('resenha_diaria' as any)
        .select('numero_lei');
      
      if (data) {
        const populadas = new Set(data.map((item: any) => item.numero_lei));
        setLeisPopuladas(populadas);
      }
    } catch (err) {
      console.error('Erro ao buscar leis populadas:', err);
    }
  };

  const fetchLeis = async () => {
    setLoading(true);
    // Buscar todas as leis com paginação para superar o limite de 1000
    let allData: LeiPublicada[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from('leis_push_2025')
        .select('id, numero_lei, tipo_ato, ementa, data_publicacao, data_dou, data_ato, url_planalto, artigos, areas_direito, created_at, status, ordem_dou, texto_bruto')
        .order('data_dou', { ascending: false, nullsFirst: false })
        .order('ordem_dou', { ascending: true, nullsFirst: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error || !data || data.length === 0) {
        hasMore = false;
      } else {
        allData = [...allData, ...data as LeiPublicada[]];
        hasMore = data.length === pageSize;
        page++;
      }
    }
    
    setLeis(allData);
    setLoading(false);
  };

  // Mapeamento de fonte para tipo de ato
  const getTipoAtoPorFonte = (fonte: FontePlanalto): string | null => {
    if (fonte === 'todas') return null;
    
    const mapeamento: Record<Exclude<FontePlanalto, 'todas'>, string> = {
      'decretos': 'Decreto',
      'leis-ordinarias': 'Lei Ordinária',
      'leis-complementares': 'Lei Complementar',
      'medidas-provisorias': 'Medida Provisória',
      'projetos-lei': 'Projeto de Lei',
      'plp': 'Projeto de Lei Complementar',
      'pec': 'Emenda Constitucional',
    };
    return mapeamento[fonte] || null;
  };

  // Aplicar filtros
  const leisFiltradas = useMemo(() => {
    const tipoAtoFonte = getTipoAtoPorFonte(fonteSelecionada);
    
    return leis.filter(lei => {
      // Filtro por tipo de ato (baseado na fonte selecionada)
      if (tipoAtoFonte && lei.tipo_ato !== tipoAtoFonte) {
        return false;
      }
      
      const dataEfetiva = lei.data_dou || lei.data_publicacao || lei.created_at;
      
      if (dataEfetiva) {
        // Extrair ano diretamente da string para evitar problemas de fuso horário
        let anoData: number;
        let mesData: number;
        let diaData: number;
        
        if (typeof dataEfetiva === 'string') {
          // Para datas no formato "YYYY-MM-DD" ou "YYYY-MM-DDTHH:MM:SS"
          const match = dataEfetiva.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (match) {
            anoData = parseInt(match[1]);
            mesData = parseInt(match[2]);
            diaData = parseInt(match[3]);
          } else {
            const data = new Date(dataEfetiva);
            anoData = data.getUTCFullYear();
            mesData = data.getUTCMonth() + 1;
            diaData = data.getUTCDate();
          }
        } else {
          const data = new Date(dataEfetiva);
          anoData = data.getUTCFullYear();
          mesData = data.getUTCMonth() + 1;
          diaData = data.getUTCDate();
        }
        
        // Filtro por ano
        if (filtros.ano !== null && anoData !== filtros.ano) {
          return false;
        }
        
        // Filtro por mês
        if (filtros.mes !== null && mesData !== filtros.mes) {
          return false;
        }
        
        // Filtro por dia
        if (filtros.dia !== null && diaData !== filtros.dia) {
          return false;
        }
      }
      
      // Filtro por status
      if (filtros.status !== 'todos' && lei.status !== filtros.status) {
        return false;
      }
      
      return true;
    });
  }, [leis, filtros, fonteSelecionada]);

  // Removido: busca automática ao mudar de fonte
  // A busca só ocorre manualmente (botão) ou via cron às 20h

  const handleLeiClick = (leiId: string) => {
    // Se automação está ativa, passar via query param
    if (filtros.automacao) {
      navigate(`/novas-leis/${leiId}?auto=true`);
    } else {
      navigate(`/novas-leis/${leiId}`);
    }
  };

  const handleStatusChange = (value: string) => {
    if (value) {
      setFiltros(prev => ({ ...prev, status: value as FiltrosNovasLeis['status'] }));
    }
  };

  const getStatusBadge = (status: LeiPublicada['status']) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="text-xs bg-yellow-400/20 text-yellow-400 border-yellow-400/40">Nova</Badge>;
      case 'aprovado':
        return <Badge variant="outline" className="text-xs bg-blue-400/20 text-blue-400 border-blue-400/40">Formatada</Badge>;
      case 'publicado':
        return <Badge variant="outline" className="text-xs bg-green-400/20 text-green-400 border-green-400/40">Publicada</Badge>;
      default:
        return null;
    }
  };

  const getTipoAtoBadge = (tipoAto: string | null) => {
    const tipo = tipoAto || 'Lei Ordinária';
    const configs: Record<string, { bg: string; text: string; border: string }> = {
      'Lei Ordinária': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
      'Lei Complementar': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
      'Medida Provisória': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40' },
      'Decreto': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
      'Emenda Constitucional': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
      'Decreto Legislativo': { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/40' },
      'Resolução': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40' },
    };
    const config = configs[tipo] || { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/40' };
    
    // Abreviação para mobile
    const abreviacoes: Record<string, string> = {
      'Lei Ordinária': 'Lei',
      'Lei Complementar': 'LC',
      'Medida Provisória': 'MP',
      'Emenda Constitucional': 'EC',
      'Decreto Legislativo': 'DL',
    };
    const label = abreviacoes[tipo] || tipo;
    
    return (
      <Badge variant="outline" className={`text-xs ${config.bg} ${config.text} ${config.border}`}>
        {label}
      </Badge>
    );
  };

  const getEffectiveDate = (lei: LeiPublicada) => {
    // Priorizar data do DOU para exibição
    return lei.data_dou || lei.data_publicacao;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Aguardando publicação';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getRelativeDate = (dateString: string | null) => {
    if (!dateString) return 'Aguardando publicação';
    const date = new Date(dateString + 'T00:00:00'); // Evitar problema de fuso horário
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Comparar apenas as datas
    date.setHours(0, 0, 0, 0);
    
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7 && diffDays > 0) return `${diffDays} dias atrás`;
    if (diffDays < 0) return formatDate(dateString); // Data futura
    return formatDate(dateString);
  };

  // Extrair número da lei para ordenação (ex: "15.278/2025" -> 15278)
  const extrairNumeroLei = (numeroLei: string): number => {
    const match = numeroLei.match(/(\d+[\.\d]*)/);
    if (match) {
      return parseFloat(match[1].replace('.', ''));
    }
    return 0;
  };

  // Anos disponíveis - sempre mostra 2020-2025, com contagem das leis carregadas
  const anosDisponiveis = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    const contagem: Record<number, number> = {};
    
    // Inicializar todos os anos de 2020 até o atual
    for (let ano = anoAtual; ano >= 2020; ano--) {
      contagem[ano] = 0;
    }
    
    // Contar leis por ano
    leis.forEach(lei => {
      const dataEfetiva = lei.data_dou || lei.data_publicacao || lei.created_at;
      if (dataEfetiva && typeof dataEfetiva === 'string') {
        const match = dataEfetiva.match(/^(\d{4})/);
        const ano = match ? parseInt(match[1]) : new Date(dataEfetiva).getUTCFullYear();
        if (contagem[ano] !== undefined) {
          contagem[ano] = (contagem[ano] || 0) + 1;
        }
      }
    });
    
    return Object.entries(contagem)
      .map(([ano, total]) => ({ ano: parseInt(ano), total }))
      .sort((a, b) => b.ano - a.ano);
  }, [leis]);

  // Meses disponíveis (quando ano está selecionado)
  const MESES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const MESES_COMPLETOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const mesesDisponiveis = useMemo(() => {
    if (!filtros.ano) return [];
    
    const contagem: Record<number, number> = {};
    leis.forEach(lei => {
      const dataEfetiva = lei.data_dou || lei.data_publicacao || lei.created_at;
      if (dataEfetiva && typeof dataEfetiva === 'string') {
        const match = dataEfetiva.match(/^(\d{4})-(\d{2})/);
        if (match) {
          const ano = parseInt(match[1]);
          const mes = parseInt(match[2]);
          if (ano === filtros.ano) {
            contagem[mes] = (contagem[mes] || 0) + 1;
          }
        }
      }
    });
    
    return Object.entries(contagem)
      .map(([mes, total]) => ({ mes: parseInt(mes), nome: MESES_NOMES[parseInt(mes) - 1], total }))
      .sort((a, b) => b.mes - a.mes);
  }, [leis, filtros.ano]);

  // Categorias com contagem baseada no ano selecionado
  const CATEGORIAS = [
    { id: 'todas', label: 'Todas', tipoAto: null },
    { id: 'decretos', label: 'Decretos', tipoAto: 'Decreto' },
    { id: 'leis-ordinarias', label: 'Leis Ordinárias', tipoAto: 'Lei Ordinária' },
    { id: 'leis-complementares', label: 'Leis Complementares', tipoAto: 'Lei Complementar' },
    { id: 'medidas-provisorias', label: 'Medidas Provisórias', tipoAto: 'Medida Provisória' },
    { id: 'projetos-lei', label: 'PL', tipoAto: 'Projeto de Lei' },
    { id: 'plp', label: 'PLP', tipoAto: 'Projeto de Lei Complementar' },
    { id: 'pec', label: 'PEC', tipoAto: 'Emenda Constitucional' },
  ] as const;

  const categoriasComContagem = useMemo(() => {
    // Filtrar leis por ano E mês selecionados
    let leisFiltradas = leis;
    
    if (filtros.ano) {
      leisFiltradas = leisFiltradas.filter(lei => {
        const dataEfetiva = lei.data_dou || lei.data_publicacao || lei.created_at;
        if (!dataEfetiva) return false;
        const match = dataEfetiva.match(/^(\d{4})-(\d{2})/);
        if (!match) return false;
        const ano = parseInt(match[1]);
        const mes = parseInt(match[2]);
        
        // Verificar ano
        if (ano !== filtros.ano) return false;
        
        // Verificar mês se selecionado
        if (filtros.mes !== null && mes !== filtros.mes) return false;
        
        return true;
      });
    }

    return CATEGORIAS.map(cat => {
      const count = cat.tipoAto 
        ? leisFiltradas.filter(lei => lei.tipo_ato === cat.tipoAto).length
        : leisFiltradas.length;
      return { ...cat, count };
    });
  }, [leis, filtros.ano, filtros.mes]);

  // Extrair datas disponíveis para o menu de alternância
  const datasDisponiveis = useMemo(() => {
    const datasMap = new Map<string, { dia: number; mes: number; ano: number; label: string; count: number }>();
    
    // Filtrar por ano selecionado
    const leisParaDatas = filtros.ano 
      ? leis.filter(lei => {
          const dataEfetiva = lei.data_dou || lei.data_publicacao || lei.created_at;
          if (!dataEfetiva) return false;
          const match = dataEfetiva.match(/^(\d{4})/);
          const ano = match ? parseInt(match[1]) : new Date(dataEfetiva).getUTCFullYear();
          return ano === filtros.ano;
        })
      : leis;
    
    leisParaDatas.forEach(lei => {
      const dataEfetiva = lei.data_dou || lei.data_publicacao || lei.created_at;
      if (!dataEfetiva) return;
      
      const match = dataEfetiva.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return;
      
      const ano = parseInt(match[1]);
      const mes = parseInt(match[2]);
      const dia = parseInt(match[3]);
      const key = `${ano}-${mes}-${dia}`;
      const label = `${dia}/${mes}`;
      
      if (!datasMap.has(key)) {
        datasMap.set(key, { dia, mes, ano, label, count: 1 });
      } else {
        datasMap.get(key)!.count++;
      }
    });
    
    // Ordenar por data decrescente e pegar as últimas 10
    return Array.from(datasMap.values())
      .sort((a, b) => {
        const dateA = new Date(a.ano, a.mes - 1, a.dia);
        const dateB = new Date(b.ano, b.mes - 1, b.dia);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10);
  }, [leis, filtros.ano]);

  // Agrupar leis por mês usando data efetiva
  const leisPorMes = leisFiltradas.reduce((acc, lei) => {
    const dataEfetiva = getEffectiveDate(lei);
    const mesAno = dataEfetiva 
      ? new Date(dataEfetiva).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : 'Sem data';
    
    if (!acc[mesAno]) acc[mesAno] = [];
    acc[mesAno].push(lei);
    return acc;
  }, {} as Record<string, LeiPublicada[]>);

  // Ordenar leis dentro de cada mês
  // Se "todas" está selecionado, ordenar por ordem_dou (ordem da resenha diária)
  // Caso contrário, ordenar por número da lei (decrescente)
  Object.keys(leisPorMes).forEach(mes => {
    leisPorMes[mes].sort((a, b) => {
      if (fonteSelecionada === 'todas') {
        // Ordenar por ordem_dou (menor primeiro = publicado antes)
        // Se não tiver ordem_dou, usar data + número como fallback
        const ordemA = a.ordem_dou ?? 9999;
        const ordemB = b.ordem_dou ?? 9999;
        if (ordemA !== ordemB) return ordemA - ordemB;
        // Fallback: por data de DOU decrescente, depois número decrescente
        const dataA = a.data_dou || a.data_publicacao || '';
        const dataB = b.data_dou || b.data_publicacao || '';
        if (dataA !== dataB) return dataB.localeCompare(dataA);
      }
      return extrairNumeroLei(b.numero_lei) - extrairNumeroLei(a.numero_lei);
    });
  });

  const getEtapaIcon = (etapa: StatusBusca['etapa']) => {
    switch (etapa) {
      case 'conectando':
        return <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'raspando':
        return <Search className="w-4 h-4 animate-pulse text-blue-500" />;
      case 'processando':
        return <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />;
      case 'finalizado':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Dialog de Escopo de Busca */}
      <Dialog open={dialogBuscaAberto} onOpenChange={setDialogBuscaAberto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Buscar Leis
            </DialogTitle>
            <DialogDescription>
              Selecione o período para buscar no Planalto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 pt-2">
            {/* Opção principal: Buscar do DOU (tempo real) */}
            <Button
              variant="default"
              className="w-full justify-start gap-3 h-14 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
              onClick={async () => {
                setDialogBuscaAberto(false);
                setBuscando(true);
                setLogs([]);
                setLogsAbertos(true);
                
                const diaSelecionado = filtros.dia || new Date().getDate();
                const mesSelecionado = filtros.mes || new Date().getMonth() + 1;
                const anoSelecionado = filtros.ano || new Date().getFullYear();
                const dataFormatada = `${String(diaSelecionado).padStart(2, '0')}-${String(mesSelecionado).padStart(2, '0')}-${anoSelecionado}`;
                
                addLog(`🚀 Buscando do Diário Oficial: ${dataFormatada}`, 'info');
                addLog(`📡 Conectando ao DOU (www.in.gov.br)...`, 'info');
                
                try {
                  const { data, error } = await supabase.functions.invoke('raspar-dou', {
                    body: { data: dataFormatada }
                  });
                  
                  if (error) {
                    addLog(`❌ Erro: ${error.message}`, 'error');
                    toast.error('Erro ao buscar do DOU');
                  } else if (data) {
                    addLog(`✅ Raspagem concluída!`, 'success');
                    addLog(`📊 Total extraídos: ${data.total_extraidos || 0}`, 'info');
                    addLog(`🆕 Novos inseridos: ${data.novos_inseridos || 0}`, 'success');
                    
                    if (data.atos_inseridos?.length > 0) {
                      data.atos_inseridos.forEach((ato: string) => {
                        addLog(`   • ${ato}`, 'success');
                      });
                    }
                    
                    toast.success(`${data.novos_inseridos || 0} novos atos do DOU`);
                    fetchLeis();
                    setRefreshKey(prev => prev + 1);
                  }
                } catch (err) {
                  addLog(`❌ Erro fatal: ${err instanceof Error ? err.message : 'Erro desconhecido'}`, 'error');
                  toast.error('Erro ao buscar do DOU');
                } finally {
                  setBuscando(false);
                }
              }}
            >
              <Zap className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold text-sm">Buscar do DOU (Tempo Real)</p>
                <p className="text-xs opacity-80">
                  {filtros.dia || new Date().getDate()}/{String(filtros.mes || new Date().getMonth() + 1).padStart(2, '0')}/{filtros.ano || new Date().getFullYear()} - Diário Oficial da União
                </p>
              </div>
            </Button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">ou buscar do Planalto</span>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => executarBusca('dia')}
            >
              <Calendar className="w-4 h-4 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Dia Selecionado</p>
                <p className="text-xs text-muted-foreground">
                  {filtros.dia || new Date().getDate()}/{String(filtros.mes || new Date().getMonth() + 1).padStart(2, '0')}/{filtros.ano || new Date().getFullYear()}
                </p>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => executarBusca('mes')}
            >
              <Calendar className="w-4 h-4 text-blue-500" />
              <div className="text-left">
                <p className="font-medium text-sm">Mês Inteiro</p>
                <p className="text-xs text-muted-foreground">
                  {MESES_NOMES_BUSCA[filtros.mes || new Date().getMonth() + 1]} de {filtros.ano || new Date().getFullYear()}
                </p>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => executarBusca('ano')}
            >
              <Calendar className="w-4 h-4 text-orange-500" />
              <div className="text-left">
                <p className="font-medium text-sm">Ano Inteiro</p>
                <p className="text-xs text-muted-foreground">
                  Todos os meses de {filtros.ano || new Date().getFullYear()}
                </p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Header com breadcrumb e título */}
      <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center py-2 sm:py-3 gap-2 sm:gap-4">
            {/* Breadcrumb à esquerda */}
            <div className="flex items-center gap-1 sm:gap-2 text-sm">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Início</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
              <span className="text-foreground font-medium hidden sm:block">novas-leis</span>
            </div>

            {/* Título centralizado */}
            <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h1 className="text-base sm:text-lg font-semibold">Novas Leis</h1>
              {filtros.automacao && (
                <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 gap-1 text-[10px] sm:text-xs">
                  <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Auto
                </Badge>
              )}
            </div>

            {/* Botões à direita */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Toggle Logs */}
              {logs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogsAbertos(!logsAbertos)}
                  className="gap-1 text-xs h-8 px-2 sm:px-3"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logs</span>
                  {logsAbertos ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {buscando && (
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </Button>
              )}
              
              {/* Botão Buscar */}
              <Button
                variant="outline"
                size="sm"
                onClick={abrirDialogoBusca}
                disabled={buscando}
                className="h-8 px-2 sm:px-3"
              >
                <RefreshCw className={`w-4 h-4 ${buscando ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-1.5">{buscando ? 'Buscando...' : 'Buscar'}</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Painel de Logs Colapsável */}
        {logsAbertos && logs.length > 0 && (
          <div className="border-t border-border bg-black/90 text-green-400 font-mono text-xs">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="font-medium">Console de Raspagem</span>
                  {buscando && (
                    <span className="text-green-500 animate-pulse">● Executando...</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{logs.length} logs</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-red-500/20 hover:text-red-400"
                    onClick={() => {
                      setLogs([]);
                      setLogsAbertos(false);
                    }}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[120px] sm:h-[200px] py-2">
                <div className="space-y-0.5">
                  {logs.map((log, i) => (
                    <div 
                      key={i} 
                      className={`flex gap-2 py-0.5 ${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'warning' ? 'text-yellow-400' :
                        log.type === 'success' ? 'text-green-400' :
                        'text-gray-300'
                      }`}
                    >
                      <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Sidebar Esquerda - Filtros com dropdowns */}
        <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar hidden lg:block sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-5">
              {/* Total e Raspagem */}
              <div className="text-center pb-3 border-b border-border space-y-3">
                <div>
                  <p className="text-2xl font-bold text-primary">{leisFiltradas.length}</p>
                  <p className="text-xs text-muted-foreground">leis encontradas</p>
                </div>
                
                {/* Contador de pendentes sem texto */}
                {(() => {
                  const semTexto = leisFiltradas.filter(lei => !lei.texto_bruto || lei.texto_bruto.trim() === '').length;
                  if (semTexto > 0) {
                    return (
                      <div className="space-y-2">
                        <p className="text-xs text-orange-500">
                          {semTexto} sem texto raspado
                        </p>
                        
                        {/* Botão Raspar Textos */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={rasparTextosLote}
                          disabled={statusRaspagem.ativo}
                          className="w-full gap-2 text-xs h-8 border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                        >
                          {statusRaspagem.ativo ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Raspando...
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              Raspar Textos
                            </>
                          )}
                        </Button>
                        
                        {/* Progress da raspagem */}
                        {statusRaspagem.ativo && (
                          <div className="space-y-1">
                            <Progress 
                              value={(statusRaspagem.processadas / Math.max(statusRaspagem.total, 1)) * 100} 
                              className="h-1.5"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              {statusRaspagem.processadas}/{statusRaspagem.total}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Período: Ano + Mês com dropdowns */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Período
                </p>
                
                {/* Dropdown Ano */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Ano</label>
                  <Select
                    value={filtros.ano?.toString() || new Date().getFullYear().toString()}
                    onValueChange={(val) => {
                      setFiltros(prev => ({ ...prev, ano: parseInt(val), dia: null }));
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs bg-background">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border min-w-0">
                      {anosDisponiveis.map(({ ano, total }) => (
                        <SelectItem key={ano} value={ano.toString()} className="text-xs py-1.5">
                          <span className="flex items-center gap-2">
                            {ano}
                            <Badge variant="secondary" className="text-[9px] h-4 px-1">{total}</Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dropdown Mês */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Mês</label>
                  <Select
                    value={filtros.mes?.toString() || 'todos'}
                    onValueChange={(val) => {
                      setFiltros(prev => ({ 
                        ...prev, 
                        mes: val === 'todos' ? null : parseInt(val), 
                        dia: null 
                      }));
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs bg-background">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border min-w-0 max-h-48">
                      {/* Opção Todos os meses */}
                      <SelectItem value="todos" className="text-xs py-1.5">
                        <span className="flex items-center gap-2">
                          Todos
                          <Badge variant="secondary" className="text-[9px] h-4 px-1">
                            {mesesDisponiveis.reduce((acc, m) => acc + m.total, 0)}
                          </Badge>
                        </span>
                      </SelectItem>
                      {/* Meses individuais */}
                      {MESES_COMPLETOS.map((nomeMes, index) => {
                        const mesNum = index + 1;
                        const mesData = mesesDisponiveis.find(m => m.mes === mesNum);
                        return (
                          <SelectItem key={mesNum} value={mesNum.toString()} className="text-xs py-1.5">
                            <span className="flex items-center gap-2">
                              {nomeMes.substring(0, 3)}
                              <Badge variant="secondary" className="text-[9px] h-4 px-1">{mesData?.total || 0}</Badge>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { value: 'todos', label: 'Todas' },
                    { value: 'pendente', label: 'Novas' },
                    { value: 'aprovado', label: 'Formatadas' },
                    { value: 'publicado', label: 'Publicadas' },
                  ].map((status) => (
                    <Button
                      key={status.value}
                      variant={filtros.status === status.value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFiltros(prev => ({ ...prev, status: status.value as FiltrosNovasLeis['status'] }))}
                      className="w-full justify-center h-7 text-xs"
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Limpar Filtros */}
              {(filtros.ano || filtros.mes || filtros.dia || filtros.status !== 'todos' || fonteSelecionada !== 'todas') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltros({ ano: null, mes: null, dia: null, status: 'todos', automacao: false });
                    setFonteSelecionada('todas');
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              )}

              {/* Dashboard de Estatísticas */}
              <div className="pt-4 border-t border-border">
                <AutomacaoEstatisticas />
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 min-h-[calc(100vh-53px)]">
          <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
            {/* Status da busca */}
            {(buscando || statusBusca.etapa === 'finalizado') && (
              <Card className="mb-4 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent animate-in fade-in slide-in-from-top-2 duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {getEtapaIcon(statusBusca.etapa)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{statusBusca.mensagem}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        {statusBusca.horario && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {statusBusca.horario}
                          </span>
                        )}
                        {statusBusca.novasLeis !== undefined && statusBusca.etapa !== 'conectando' && statusBusca.etapa !== 'raspando' && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {statusBusca.novasLeis} leis encontradas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Card + Botão Raspar Mobile */}
            <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-xs sm:text-sm">Atualização Automática</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Monitoradas diariamente às 8h e formatadas com IA.
                    </p>
                  </div>
                </div>
                
                {/* Botão Raspar - versão mobile (lg:hidden) */}
                {(() => {
                  const semTexto = leisFiltradas.filter(lei => !lei.texto_bruto || lei.texto_bruto.trim() === '').length;
                  if (semTexto > 0) {
                    return (
                      <div className="mt-3 pt-3 border-t border-border/50 lg:hidden">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-orange-500">
                            {semTexto} atos sem texto raspado
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={rasparTextosLote}
                            disabled={statusRaspagem.ativo}
                            className="gap-2 text-xs h-7 border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                          >
                            {statusRaspagem.ativo ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                {statusRaspagem.processadas}/{statusRaspagem.total}
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3" />
                                Raspar
                              </>
                            )}
                          </Button>
                        </div>
                        {statusRaspagem.ativo && (
                          <Progress 
                            value={(statusRaspagem.processadas / Math.max(statusRaspagem.total, 1)) * 100} 
                            className="h-1 mt-2"
                          />
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </CardContent>
            </Card>

            {/* Card de Automação em Lote */}
            {!automacao.loading && (
              <Card className={`mb-4 sm:mb-6 border-2 ${
                automacao.estado?.status === 'running' ? 'border-green-500/50 bg-green-500/5' :
                automacao.estado?.status === 'paused' ? 'border-yellow-500/50 bg-yellow-500/5' :
                automacao.estado?.status === 'completed' ? 'border-blue-500/50 bg-blue-500/5' :
                'border-primary/30 bg-muted/30'
              }`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`p-1.5 sm:p-2 rounded-full ${
                      automacao.estado?.status === 'running' ? 'bg-green-500/20' :
                      automacao.estado?.status === 'paused' ? 'bg-yellow-500/20' :
                      'bg-primary/10'
                    }`}>
                      <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        automacao.estado?.status === 'running' ? 'text-green-500 animate-pulse' :
                        automacao.estado?.status === 'paused' ? 'text-yellow-500' :
                        'text-primary'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-xs sm:text-sm">Formatação em Lote</h3>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {automacao.estado?.status === 'running' ? (
                              <>Processando: {automacao.estado.ultima_lei_processada || 'Iniciando...'}</>
                            ) : automacao.estado?.status === 'paused' ? (
                              <>Pausado em: {automacao.estado.ultima_lei_processada || 'Aguardando'}</>
                            ) : automacao.estado?.status === 'completed' ? (
                              <>{automacao.estado.leis_processadas} leis formatadas com sucesso!</>
                            ) : (
                              <>Formatar todas as leis pendentes automaticamente</>
                            )}
                          </p>
                        </div>
                        
                        {/* Botões de Controle */}
                        <div className="flex items-center gap-1.5">
                          {automacao.estado?.status === 'idle' && (
                            <Button
                              size="sm"
                              onClick={automacao.iniciar}
                              className="gap-1.5 h-7 text-xs bg-green-600 hover:bg-green-700"
                            >
                              <Play className="w-3 h-3" />
                              <span className="hidden sm:inline">Iniciar</span>
                            </Button>
                          )}
                          
                          {(automacao.estado?.status === 'running' || automacao.estado?.status === 'paused') && (
                            <>
                              <Button
                                size="sm"
                                onClick={automacao.continuar}
                                className="gap-1.5 h-7 text-xs bg-green-600 hover:bg-green-700"
                              >
                                <Play className="w-3 h-3" />
                                <span className="hidden sm:inline">Continuar</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={automacao.pausar}
                                className="gap-1.5 h-7 text-xs border-yellow-500 text-yellow-600 hover:bg-yellow-500/10"
                              >
                                <Pause className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={automacao.resetar}
                                className="h-7 w-7 p-0"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          
                          {automacao.estado?.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={automacao.resetar}
                              className="gap-1.5 h-7 text-xs"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span className="hidden sm:inline">Reiniciar</span>
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Barra de Progresso */}
                      {(automacao.estado?.status === 'running' || automacao.estado?.status === 'paused') && automacao.estado.leis_total > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <Progress 
                            value={(automacao.estado.leis_processadas / automacao.estado.leis_total) * 100} 
                            className="h-2"
                          />
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>
                              {automacao.estado.leis_processadas}/{automacao.estado.leis_total} leis
                              {automacao.estado.leis_com_erro > 0 && (
                                <span className="text-red-500 ml-2">({automacao.estado.leis_com_erro} erros)</span>
                              )}
                            </span>
                            {automacao.estado.dia_atual && automacao.estado.mes_atual && (
                              <span>
                                Dia {automacao.estado.dia_atual}/{String(automacao.estado.mes_atual).padStart(2, '0')}/{automacao.estado.ano_atual}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Toggle para Logs */}
                      {automacao.logs.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLogsAutoAbertos(!logsAutoAbertos)}
                          className="mt-2 gap-1.5 h-6 text-[10px] px-2"
                        >
                          <Terminal className="w-3 h-3" />
                          {logsAutoAbertos ? 'Ocultar logs' : `Ver logs (${automacao.logs.length})`}
                          {logsAutoAbertos ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Logs da Automação */}
                  {logsAutoAbertos && automacao.logs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <ScrollArea className="h-[150px] bg-black/90 rounded-md p-2">
                        <div className="space-y-0.5 font-mono text-[10px]">
                          {automacao.logs.map((log, i) => (
                            <div 
                              key={i}
                              className={`flex gap-2 ${
                                log.type === 'error' ? 'text-red-400' :
                                log.type === 'warning' ? 'text-yellow-400' :
                                log.type === 'success' ? 'text-green-400' :
                                'text-gray-300'
                              }`}
                            >
                              <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
                              <span>{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="lg:hidden mb-4 space-y-3">
              <ScrollArea className="w-full">
                <div className="flex gap-1 pb-2">
                  <Button
                    variant={filtros.ano === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltros(prev => ({ ...prev, ano: null, mes: null, dia: null }))}
                    className="shrink-0 text-xs px-3"
                  >
                    Todos anos
                  </Button>
                  {anosDisponiveis.slice(0, 4).map(({ ano, total }) => (
                    <Button
                      key={ano}
                      variant={filtros.ano === ano ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFiltros(prev => ({ ...prev, ano: prev.ano === ano ? null : ano, mes: null, dia: null }))}
                      className="shrink-0 text-xs px-3"
                    >
                      {ano}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Menu de Categorias - aparece sempre */}
            <div className="mb-3 -mx-2 sm:mx-0">
              <ScrollArea className="w-full">
                <div className="flex gap-1.5 sm:gap-2 px-2 sm:px-0 pb-2 sm:grid sm:grid-cols-6 lg:grid-cols-8">
                {categoriasComContagem.map((cat) => {
                  // Define abbreviation and subtitle for specific categories
                  let mainLabel: string = cat.label;
                  let subtitle = '';
                  
                  if (cat.label === 'Leis Complementares') {
                    mainLabel = 'LC';
                    subtitle = 'Leis Complementares';
                  } else if (cat.label === 'Medidas Provisórias') {
                    mainLabel = 'MP';
                    subtitle = 'Medidas Provisórias';
                  }
                  
                  const labelParts = mainLabel.split(' ');
                  
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setFonteSelecionada(cat.id as FontePlanalto)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-auto sm:h-auto sm:aspect-square flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg text-center transition-all border ${
                        fonteSelecionada === cat.id 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-slate-800/60 hover:bg-slate-700/70 text-foreground border-slate-700/50'
                      }`}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        {labelParts.map((part, idx) => (
                          <span key={idx} className="text-[9px] sm:text-[11px] font-medium">
                            {part}
                          </span>
                        ))}
                        {subtitle && (
                          <span className="text-[7px] text-muted-foreground mt-0.5">
                            {subtitle}
                          </span>
                        )}
                      </div>
                      {cat.count > 0 && (
                        <Badge variant="secondary" className="mt-0.5 sm:mt-1 text-[7px] sm:text-[8px] h-3.5 sm:h-4 px-1 sm:px-1.5">
                          {cat.count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
                </div>
              </ScrollArea>
            </div>

            {/* Menu de Datas */}
            <div className="mb-4">
              <ScrollArea className="w-full">
                <div className="flex gap-1 pb-2">
                  {datasDisponiveis.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2">Clique em "Buscar" para carregar as datas</p>
                  ) : null}
                  {datasDisponiveis.map((dataInfo, index) => (
                    <Button
                      key={`${dataInfo.ano}-${dataInfo.mes}-${dataInfo.dia}`}
                      variant={filtros.dia === dataInfo.dia && filtros.mes === dataInfo.mes ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFiltros(prev => ({ ...prev, dia: dataInfo.dia, mes: dataInfo.mes, ano: dataInfo.ano }))}
                      className={`shrink-0 text-xs px-3 ${index === 0 ? 'ring-2 ring-primary/30' : ''}`}
                    >
                      {dataInfo.label}
                      {index === 0 && (
                        <Badge className="ml-1 text-[8px] px-1 py-0 h-3.5 bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                          Recente
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Content */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground">Carregando leis...</p>
              </div>
            ) : leisFiltradas.length === 0 ? (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="py-10 text-center">
                  <Calendar className="w-14 h-14 mx-auto mb-4 text-yellow-500/60" />
                  <h3 className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">
                    {filtros.dia 
                      ? 'Sem publicações nesta data'
                      : 'Nenhuma lei encontrada'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {filtros.dia
                      ? `Não houve publicação no DOU em ${filtros.dia}/${String(filtros.mes).padStart(2, '0')}/${filtros.ano}. Isso pode ocorrer em fins de semana, feriados ou recesso.`
                      : filtros.ano || filtros.mes || filtros.status !== 'todos'
                        ? 'Tente ajustar os filtros para ver mais resultados.'
                        : 'Clique em "Buscar" para carregar as leis mais recentes.'}
                  </p>
                  {filtros.dia && datasDisponiveis.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Última publicação disponível:</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const ultima = datasDisponiveis[0];
                          setFiltros(prev => ({ ...prev, dia: ultima.dia, mes: ultima.mes, ano: ultima.ano }));
                        }}
                        className="gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        {datasDisponiveis[0].dia}/{datasDisponiveis[0].mes}/{datasDisponiveis[0].ano}
                        <Badge variant="secondary" className="text-[10px]">
                          {datasDisponiveis[0].count} atos
                        </Badge>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6 pb-12">
                {Object.entries(leisPorMes).map(([mesAno, leisDoMes]) => (
                  <div key={mesAno}>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
                      {mesAno}
                    </h2>
                    <div className="space-y-3">
                      {leisDoMes.map((lei) => (
                        <Card 
                          key={lei.id} 
                          className="hover:shadow-md transition-all cursor-pointer active:scale-[0.99] border-l-4 border-l-primary/50"
                          onClick={() => handleLeiClick(lei.id)}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                                  {getTipoAtoBadge(lei.tipo_ato)}
                                  <span className="font-semibold text-sm sm:text-base text-foreground">{lei.numero_lei}</span>
                                  {getStatusBadge(lei.status)}
                                  <Badge variant="secondary" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                                    {lei.artigos?.length || 0} artigos
                                  </Badge>
                                  {leisPopuladas.has(lei.numero_lei) && (
                                    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/40 text-[10px] sm:text-xs">
                                      Populado
                                    </Badge>
                                  )}
                                  {filtros.automacao && lei.status === 'pendente' && (
                                    <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs gap-1">
                                      <Zap className="w-2 h-2" />
                                      Auto
                                    </Badge>
                                  )}
                                </div>
                                
                                {lei.ementa && (
                                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-1.5 sm:mb-2">
                                    {lei.ementa}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  <span>{getRelativeDate(getEffectiveDate(lei))}</span>
                                </div>
                              </div>
                              
                              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
