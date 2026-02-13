import { useState } from 'react';
import {
  Activity, 
  Users, 
  Clock, 
  TrendingUp, 
  Smartphone,
  Target,
  Search,
  FileText,
  RefreshCw,
  ArrowLeft,
  Crown,
  Percent,
  CalendarClock,
  Eye,
  BarChart3,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Monitor,
  X,
  UserPlus,
  Trophy,
  Timer,
  Flame,
  Heart,
  Zap,
  Brain,
  Clock3,
  Sparkles,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import {
  useNovosUsuarios,
  usePaginasPopulares,
  useTermosPesquisados,
  useEstatisticasGerais,
  useDistribuicaoDispositivos,
  useDistribuicaoIntencoes,
  useMetricasPremium,
  useOnlineAgoraRealtime,
  useOnline30MinRealtime,
  useListaAssinantesPremium,
  useCadastrosPorDia,
  useOnlineDetails,
  useOnline30MinDetails,
  useAtivosDetalhes,
  useNovosDetalhes,
  useDailyFeedback,
  type UsuarioDetalhe,
} from '@/hooks/useAdminControleStats';
import {
  useRankingTempoTela,
  useRankingAreasAcessadas,
  useRankingFuncoesUtilizadas,
  useRankingFidelidade,
  useRankingAulas,
  useRankingUsuarioAulas,
  useRankingTodosUsuarios,
} from '@/hooks/useAdminRankings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type PeriodoFiltro = 'hoje' | '7dias' | '30dias' | '90dias';
type DialogType = 'online' | 'online30' | 'novos' | 'ativos' | 'total' | 'receita' | 'pageviews' | null;

const PERIODOS: { value: PeriodoFiltro; label: string; dias: number }[] = [
  { value: 'hoje', label: 'Hoje', dias: 0 },
  { value: '7dias', label: '7 dias', dias: 7 },
  { value: '30dias', label: '30 dias', dias: 30 },
  { value: '90dias', label: '90 dias', dias: 90 },
];

const getDiasFromPeriodo = (periodo: PeriodoFiltro): number => {
  return PERIODOS.find(p => p.value === periodo)?.dias ?? 7;
};

// Componente para lista de usuários no dialog
const UsuarioItem = ({ user, showPagePath, showViews, showCreatedAt }: { 
  user: UsuarioDetalhe; 
  showPagePath?: boolean;
  showViews?: boolean;
  showCreatedAt?: boolean;
}) => (
  <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
    <div className="flex items-center justify-between">
      <span className="font-medium text-sm truncate">{user.nome || 'Sem nome'}</span>
      {user.dispositivo && (
        <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
          {user.dispositivo}
        </Badge>
      )}
    </div>
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Mail className="h-3 w-3 shrink-0" />
      <span className="truncate">{user.email || '—'}</span>
    </div>
    {user.telefone && (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Phone className="h-3 w-3 shrink-0" />
        <span>{user.telefone}</span>
      </div>
    )}
    {showPagePath && user.page_path && (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="h-3 w-3 shrink-0" />
        <span className="truncate">{user.page_path}</span>
      </div>
    )}
    {showViews && user.total_views != null && (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Eye className="h-3 w-3 shrink-0" />
        <span>{user.total_views} page views</span>
      </div>
    )}
    {showCreatedAt && user.created_at && (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3 shrink-0" />
        <span>{formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ptBR })}</span>
      </div>
    )}
    {user.last_seen && (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3 shrink-0" />
        <span>Visto {formatDistanceToNow(new Date(user.last_seen), { addSuffix: true, locale: ptBR })}</span>
      </div>
    )}
  </div>
);

const AdminControle = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('7dias');
  const [openDialog, setOpenDialog] = useState<DialogType>(null);

  const diasFiltro = getDiasFromPeriodo(periodo);
  const diasParaQuery = diasFiltro === 0 ? 1 : diasFiltro;

  const { data: novosUsuarios, isLoading: loadingUsuarios } = useNovosUsuarios(diasParaQuery);
  const { data: paginasPopulares, isLoading: loadingPaginas } = usePaginasPopulares(diasParaQuery);
  const { data: termosPesquisados, isLoading: loadingTermos } = useTermosPesquisados();
  const { data: estatisticas, isLoading: loadingStats } = useEstatisticasGerais(diasFiltro);
  const { data: dispositivos } = useDistribuicaoDispositivos();
  const { data: intencoes } = useDistribuicaoIntencoes();
  const { data: metricasPremium } = useMetricasPremium(diasFiltro);
  const { onlineAgora, isLoading: loadingOnline } = useOnlineAgoraRealtime();
  const { online30Min, isLoading: loadingOnline30 } = useOnline30MinRealtime();
  const { data: listaAssinantes, isLoading: loadingAssinantes } = useListaAssinantesPremium();
  const { data: cadastrosDia } = useCadastrosPorDia(diasParaQuery);

  // Detail hooks for dialogs
  const { data: onlineDetails } = useOnlineDetails();
  const { data: online30MinDetails } = useOnline30MinDetails();
  const { data: ativosDetails } = useAtivosDetalhes(diasParaQuery);
  const { data: novosDetails } = useNovosDetalhes(diasFiltro);

  // Daily feedback
  const { feedback, isLoading: loadingFeedback, error: feedbackError, regenerate: regenerateFeedback } = useDailyFeedback();

  // Rankings hooks
  const { data: rankingTempo, isLoading: loadingTempo } = useRankingTempoTela(diasParaQuery);
  const { data: rankingAreas, isLoading: loadingAreas } = useRankingAreasAcessadas(diasParaQuery);
  const { data: rankingFuncoes, isLoading: loadingFuncoes } = useRankingFuncoesUtilizadas(diasParaQuery);
  const { data: rankingFidelidade, isLoading: loadingFidelidade } = useRankingFidelidade(diasParaQuery);
  const { data: rankingAulas, isLoading: loadingAulas } = useRankingAulas(diasParaQuery);
  const { data: rankingUsuarioAulas, isLoading: loadingUsuarioAulas } = useRankingUsuarioAulas(diasParaQuery);
  const { data: todosUsuarios, isLoading: loadingTodos } = useRankingTodosUsuarios(diasParaQuery);

  const totalDispositivos = dispositivos 
    ? dispositivos.iOS + dispositivos.Android + dispositivos.Desktop + dispositivos.Outro 
    : 0;

  const totalIntencoes = intencoes
    ? intencoes.Universitario + intencoes.Concurseiro + intencoes.OAB + intencoes.Advogado + intencoes.Outro
    : 0;

  const getDeviceIcon = (dispositivo: string | null) => {
    if (!dispositivo) return '📱';
    const d = dispositivo.toLowerCase();
    if (d.includes('ios') || d.includes('iphone')) return '🍎';
    if (d.includes('android')) return '🤖';
    if (d.includes('desktop') || d.includes('windows')) return '💻';
    return '📱';
  };

  const parseDeviceInfo = (deviceInfo: any): string => {
    if (!deviceInfo) return '';
    if (typeof deviceInfo === 'string') {
      try {
        deviceInfo = JSON.parse(deviceInfo);
      } catch {
        return deviceInfo;
      }
    }
    const parts = [];
    if (deviceInfo.os) parts.push(deviceInfo.os);
    if (deviceInfo.osVersion) parts.push(deviceInfo.osVersion);
    if (deviceInfo.model) parts.push(`- ${deviceInfo.model}`);
    return parts.join(' ');
  };

  const periodoLabel = PERIODOS.find(p => p.value === periodo)?.label || '';

  const chartData = (cadastrosDia || []).map(item => ({
    dia: format(new Date(item.dia + 'T12:00:00'), 'dd/MM'),
    total: item.total,
  }));

  const getDialogTitle = () => {
    switch (openDialog) {
      case 'online': return 'Usuários Online Agora (5 min)';
      case 'online30': return 'Usuários Online (30 min)';
      case 'novos': return `Novos Usuários (${periodoLabel})`;
      case 'ativos': return `Usuários Ativos (${periodoLabel})`;
      case 'total': return 'Todos os Usuários';
      case 'receita': return 'Detalhamento de Receita';
      case 'pageviews': return `Page Views (${periodoLabel})`;
      default: return '';
    }
  };

  const getDialogUsers = (): UsuarioDetalhe[] => {
    switch (openDialog) {
      case 'online': return onlineDetails || [];
      case 'online30': return online30MinDetails || [];
      case 'novos': return novosDetails || [];
      case 'ativos': return ativosDetails || [];
      case 'total': return ativosDetails || [];
      default: return [];
    }
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return '—';
    const m = method.toLowerCase();
    if (m.includes('pix')) return 'PIX';
    if (m.includes('credit') || m.includes('cartao') || m.includes('card')) return 'Cartão';
    if (m.includes('debit')) return 'Débito';
    if (m.includes('boleto')) return 'Boleto';
    return method;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - sem botão Atualizar */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold">Controle</h1>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  Monitoramento em tempo real
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-1.5" />
              Atualização automática
            </Badge>
          </div>

          {/* Filtro de Período */}
          <div className="flex items-center gap-2 mt-4">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Período:</span>
            <div className="flex gap-1">
              {PERIODOS.map((p) => (
                <Button
                  key={p.value}
                  variant={periodo === p.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriodo(p.value)}
                  className="text-xs h-7 px-3"
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Cards de Estatísticas - 6 cards clicáveis */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Online Agora */}
          <Card 
            className="cursor-pointer hover:border-emerald-500/50 transition-all hover:shadow-md"
            onClick={() => setOpenDialog('online')}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Online Agora</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {loadingOnline ? '...' : onlineAgora}
                  </p>
                  <p className="text-[10px] text-muted-foreground">5 min</p>
                </div>
                <div className="relative">
                  <Clock className="h-5 w-5 text-emerald-500 opacity-50" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Online 30 min */}
          <Card 
            className="cursor-pointer hover:border-teal-500/50 transition-all hover:shadow-md"
            onClick={() => setOpenDialog('online30')}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Online 30min</p>
                  <p className="text-2xl font-bold text-teal-500">
                    {loadingOnline30 ? '...' : online30Min}
                  </p>
                  <p className="text-[10px] text-muted-foreground">30 min</p>
                </div>
                <Clock3 className="h-5 w-5 text-teal-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Novos */}
          <Card 
            className="cursor-pointer hover:border-sky-500/50 transition-all hover:shadow-md"
            onClick={() => setOpenDialog('novos')}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Novos ({periodoLabel})</p>
                  <p className="text-2xl font-bold text-sky-500">
                    {loadingStats ? '...' : estatisticas?.novosNoPeriodo || 0}
                  </p>
                </div>
                <UserPlus className="h-5 w-5 text-sky-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Ativos */}
          <Card 
            className="cursor-pointer hover:border-violet-500/50 transition-all hover:shadow-md"
            onClick={() => setOpenDialog('ativos')}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Ativos ({periodoLabel})</p>
                  <p className="text-2xl font-bold text-violet-500">
                    {loadingStats ? '...' : estatisticas?.ativosNoPeriodo || 0}
                  </p>
                </div>
                <Activity className="h-5 w-5 text-violet-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Total Usuários */}
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
            onClick={() => setOpenDialog('total')}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Total Usuários</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? '...' : estatisticas?.totalUsuarios?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>
                <Users className="h-5 w-5 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Page Views */}
          <Card 
            className="cursor-pointer hover:border-orange-500/50 transition-all hover:shadow-md"
            onClick={() => setOpenDialog('pageviews')}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Page Views</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {loadingStats ? '...' : estatisticas?.totalPageViews?.toLocaleString('pt-BR') || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{periodoLabel}</p>
                </div>
                <Eye className="h-5 w-5 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog de detalhes de usuários */}
        <Dialog open={openDialog !== null && openDialog !== 'receita' && openDialog !== 'pageviews'} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{getDialogTitle()}</DialogTitle>
              <DialogDescription>
                {openDialog === 'online' && 'Sessões ativas nos últimos 5 minutos'}
                {openDialog === 'online30' && 'Usuários únicos nos últimos 30 minutos'}
                {openDialog === 'novos' && `Cadastros no período: ${periodoLabel}`}
                {openDialog === 'ativos' && `Usuários com atividade no período: ${periodoLabel}`}
                {openDialog === 'total' && 'Usuários mais recentes com atividade'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2 pr-4">
                {getDialogUsers().length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
                ) : (
                  getDialogUsers().map((user) => (
                    <UsuarioItem 
                      key={user.user_id} 
                      user={user} 
                      showPagePath={openDialog === 'online' || openDialog === 'online30'}
                      showViews={openDialog === 'ativos' || openDialog === 'total'}
                      showCreatedAt={openDialog === 'novos'}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Dialog de receita */}
        <Dialog open={openDialog === 'receita'} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhamento de Receita</DialogTitle>
              <DialogDescription>Receita por tipo de plano</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                <span className="text-sm font-medium">Mensal</span>
                <span className="text-sm font-bold text-emerald-500">
                  R$ {(metricasPremium?.receitaMensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                <span className="text-sm font-medium">Anual</span>
                <span className="text-sm font-bold text-emerald-500">
                  R$ {(metricasPremium?.receitaAnual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                <span className="text-sm font-medium">Vitalício</span>
                <span className="text-sm font-bold text-emerald-500">
                  R$ {(metricasPremium?.receitaVitalicio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-sm font-bold">Total</span>
                <span className="text-lg font-bold text-emerald-500">
                  R$ {(metricasPremium?.receitaTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Média até Premium: {metricasPremium?.mediaDiasAtePremium != null ? `${metricasPremium.mediaDiasAtePremium} dias` : '—'}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de page views */}
        <Dialog open={openDialog === 'pageviews'} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Páginas Mais Acessadas ({periodoLabel})</DialogTitle>
              <DialogDescription>
                Total: {estatisticas?.totalPageViews?.toLocaleString('pt-BR') || 0} views ·
                Média: {diasFiltro > 0 ? Math.round((estatisticas?.totalPageViews || 0) / diasFiltro) : estatisticas?.totalPageViews || 0}/dia
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-3 pr-4">
                {paginasPopulares?.map((pagina, index) => {
                  const maxCount = paginasPopulares[0]?.count || 1;
                  const percentage = (pagina.count / maxCount) * 100;
                  return (
                    <div key={pagina.page_path} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-6">#{index + 1}</span>
                          <span className="font-medium">{pagina.page_title || pagina.page_path}</span>
                        </div>
                        <Badge variant="secondary">{pagina.count.toLocaleString('pt-BR')}</Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Média cadastros/dia */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média cadastros/dia ({periodoLabel})</p>
                <p className="text-3xl font-bold">
                  {loadingStats ? '...' : (
                    diasFiltro > 0 && estatisticas?.novosNoPeriodo
                      ? Math.round(estatisticas.novosNoPeriodo / Math.max(diasFiltro, 1))
                      : estatisticas?.novosNoPeriodo || 0
                  )}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de cadastros por dia */}
        {chartData.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5" />
                Cadastros por Dia ({periodoLabel})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCadastros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="dia" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Cadastros"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCadastros)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Cards de Premium + Receita - todos clicáveis */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card 
            className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:border-amber-500/60 hover:shadow-md transition-all"
            onClick={() => {
              const el = document.getElementById('assinantes-premium-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] text-muted-foreground">Total Premium</p>
              <p className="text-2xl font-bold text-amber-500">{metricasPremium?.totalPremium || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:border-amber-500/60 hover:shadow-md transition-all"
            onClick={() => {
              const el = document.getElementById('assinantes-premium-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] text-muted-foreground">Taxa Conversão</p>
              <p className="text-2xl font-bold text-amber-500">{metricasPremium?.taxaConversao?.toFixed(2) || 0}%</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:border-amber-500/60 hover:shadow-md transition-all"
            onClick={() => {
              const el = document.getElementById('assinantes-premium-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] text-muted-foreground">Novos Premium ({periodoLabel})</p>
              <p className="text-2xl font-bold text-amber-500">{metricasPremium?.novosPremiumPeriodo || 0}</p>
            </CardContent>
          </Card>

          <Card 
            className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent cursor-pointer hover:border-emerald-500/60 hover:shadow-md transition-all"
            onClick={() => setOpenDialog('receita')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] text-muted-foreground">Receita Total</p>
              <p className="text-xl font-bold text-emerald-500">
                R$ {(metricasPremium?.receitaTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent cursor-pointer hover:border-emerald-500/60 hover:shadow-md transition-all"
            onClick={() => setOpenDialog('receita')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] text-muted-foreground">Receita Mensal</p>
              <p className="text-lg font-bold text-emerald-500">
                R$ {(metricasPremium?.receitaMensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent cursor-pointer hover:border-emerald-500/60 hover:shadow-md transition-all"
            onClick={() => setOpenDialog('receita')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] text-muted-foreground">Receita Vitalício</p>
              <p className="text-lg font-bold text-emerald-500">
                R$ {(metricasPremium?.receitaVitalicio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Assinantes Premium - Responsiva com Realtime */}
        <Card className="border-amber-500/30" id="assinantes-premium-section">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Assinantes Premium
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Tempo real" />
              </div>
              <Badge className="bg-amber-500 text-white">
                {listaAssinantes?.length || 0} únicos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAssinantes ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : listaAssinantes && listaAssinantes.length > 0 ? (
              <>
                {/* Mobile: Cards */}
                <div className="space-y-3 md:hidden max-h-[500px] overflow-y-auto">
                  {listaAssinantes.map((assinante, index) => (
                    <div key={index} className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{assinante.nome || assinante.email}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">Ativo</Badge>
                      </div>
                      {assinante.nome && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{assinante.email}</span>
                        </div>
                      )}
                      {assinante.telefone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{assinante.telefone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{assinante.plano}</Badge>
                          <span className="font-medium">R$ {assinante.valor?.toFixed(2)}</span>
                        </div>
                        <span className="text-muted-foreground">{format(new Date(assinante.data), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {assinante.intencao && (
                          <Badge variant="outline" className="text-[10px] capitalize">{assinante.intencao}</Badge>
                        )}
                        <span className="text-muted-foreground">{formatPaymentMethod(assinante.payment_method)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: Table */}
                <div className="hidden md:block max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listaAssinantes.map((assinante, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-sm">{assinante.nome || '—'}</TableCell>
                          <TableCell className="text-sm">{assinante.email}</TableCell>
                          <TableCell className="text-sm">{assinante.telefone || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{assinante.intencao || '—'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{assinante.plano}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">R$ {assinante.valor?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell className="text-sm">{formatPaymentMethod(assinante.payment_method)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(assinante.data), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-500/20 text-emerald-500 text-xs">Ativo</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum assinante encontrado</p>
            )}
          </CardContent>
        </Card>

        {/* Feedback Diário com IA */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Feedback do Dia
                <Badge variant="outline" className="text-[10px]">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Gemini AI
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateFeedback}
                disabled={loadingFeedback}
                className="text-xs"
              >
                {loadingFeedback ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Regenerar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFeedback ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Gerando análise do dia...</p>
              </div>
            ) : feedbackError ? (
              <div className="text-center py-8">
                <p className="text-sm text-destructive">{feedbackError}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={regenerateFeedback}>
                  Tentar novamente
                </Button>
              </div>
            ) : feedback ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{feedback}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum feedback disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Tabs de Análise */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="paginas" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Páginas</span>
            </TabsTrigger>
            <TabsTrigger value="buscas" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Buscas</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Rankings</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Usuários */}
          <TabsContent value="usuarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Novos Cadastros ({periodoLabel})
                  </div>
                  <Badge variant="secondary">{novosUsuarios?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsuarios ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {novosUsuarios?.map((usuario) => (
                      <Link
                        key={usuario.id}
                        to={`/admin/usuario/${usuario.id}`}
                        className="block p-4 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 hover:border-primary/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                              <span className="font-medium hover:text-primary transition-colors">
                                {usuario.nome || 'Sem nome'}
                              </span>
                              {usuario.intencao && (
                                <Badge variant="outline" className="text-xs">
                                  {usuario.intencao}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {usuario.email}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                {getDeviceIcon(usuario.dispositivo)}
                                {parseDeviceInfo(usuario.device_info) || usuario.dispositivo || 'Dispositivo não identificado'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(usuario.created_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Páginas */}
          <TabsContent value="paginas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Páginas Mais Acessadas ({periodoLabel})
                  </div>
                  <Badge variant="secondary">
                    {estatisticas?.totalPageViews?.toLocaleString('pt-BR') || 0} views
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPaginas ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginasPopulares?.map((pagina, index) => {
                      const maxCount = paginasPopulares[0]?.count || 1;
                      const percentage = (pagina.count / maxCount) * 100;
                      
                      return (
                        <div key={pagina.page_path} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-6">#{index + 1}</span>
                              <span className="font-medium">{pagina.page_title || pagina.page_path}</span>
                            </div>
                            <Badge variant="secondary">{pagina.count.toLocaleString('pt-BR')}</Badge>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground">{pagina.page_path}</p>
                        </div>
                      );
                    })}
                    {(!paginasPopulares || paginasPopulares.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">Nenhum dado de navegação ainda</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Buscas */}
          <TabsContent value="buscas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Termos Mais Pesquisados
                  </div>
                  <Badge variant="secondary">{termosPesquisados?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTermos ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {termosPesquisados?.map((termo, index) => {
                      const maxCount = termosPesquisados[0]?.count || 1;
                      const percentage = (termo.count / maxCount) * 100;
                      
                      return (
                        <div key={termo.termo} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-6">#{index + 1}</span>
                              <span className="font-medium">{termo.termo}</span>
                            </div>
                            <Badge variant="secondary">{termo.count}</Badge>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                    {(!termosPesquisados || termosPesquisados.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">Nenhuma pesquisa registrada ainda</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dispositivos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Dispositivos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {totalDispositivos > 0 ? (
                    <>
                      {[
                        { label: '🍎 iOS', value: dispositivos?.iOS || 0 },
                        { label: '🤖 Android', value: dispositivos?.Android || 0 },
                        { label: '💻 Desktop', value: dispositivos?.Desktop || 0 },
                        { label: '📱 Outro', value: dispositivos?.Outro || 0 },
                      ].map((d) => (
                        <div key={d.label} className="mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>{d.label}</span>
                            <span>{d.value} ({((d.value / totalDispositivos) * 100).toFixed(1)}%)</span>
                          </div>
                          <Progress value={(d.value / totalDispositivos) * 100} className="h-2" />
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Carregando dados...</p>
                  )}
                </CardContent>
              </Card>

              {/* Intenções */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Perfil dos Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {totalIntencoes > 0 ? (
                    <>
                      {[
                        { label: '🎓 Universitário', value: intencoes?.Universitario || 0 },
                        { label: '📝 Concurseiro', value: intencoes?.Concurseiro || 0 },
                        { label: '⚖️ OAB', value: intencoes?.OAB || 0 },
                        { label: '👔 Advogado', value: intencoes?.Advogado || 0 },
                        { label: '🔄 Outro', value: intencoes?.Outro || 0 },
                      ].map((d) => (
                        <div key={d.label} className="mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>{d.label}</span>
                            <span>{d.value} ({((d.value / totalIntencoes) * 100).toFixed(1)}%)</span>
                          </div>
                          <Progress value={(d.value / totalIntencoes) * 100} className="h-2" />
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Carregando dados...</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Rankings */}
          <TabsContent value="rankings" className="space-y-6">
            
            {/* Resumo geral */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Total Usuários Rastreados</p>
                  <p className="text-2xl font-bold">{rankingTempo?.length || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Todos Cadastrados</p>
                  <p className="text-2xl font-bold">{todosUsuarios?.length || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Aulas Acessadas</p>
                  <p className="text-2xl font-bold">{rankingAulas?.length || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Alunos em Aulas</p>
                  <p className="text-2xl font-bold">{rankingUsuarioAulas?.length || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Ranking Tempo de Tela */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    Ranking de Tempo de Tela
                  </div>
                  <Badge variant="secondary">{rankingTempo?.length || 0} usuários</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTempo ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : rankingTempo && rankingTempo.length > 0 ? (
                  <ScrollArea className="h-[70vh]">
                    <div className="space-y-4 pr-4">
                      {rankingTempo.map((item, index) => {
                        const maxTime = rankingTempo[0]?.tempo_total_min || 1;
                        const pct = (item.tempo_total_min / maxTime) * 100;
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                        return (
                          <div key={item.user_id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg w-8 text-right shrink-0">
                                  {medal || `#${index + 1}`}
                                </span>
                                <div className="min-w-0">
                                  <span className="font-medium block truncate">{item.nome}</span>
                                  <span className="text-xs text-muted-foreground truncate block">{item.email}</span>
                                </div>
                              </div>
                              <Badge className="text-sm shrink-0 ml-2">{item.tempo_formatado}</Badge>
                            </div>
                            <Progress value={pct} className="h-2" />
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline">{item.sessoes} sessões</Badge>
                              <Badge variant="outline">{item.page_views} views</Badge>
                              {item.intencao && <Badge variant="outline" className="capitalize">{item.intencao}</Badge>}
                              {item.telefone && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />{item.telefone}
                                </span>
                              )}
                            </div>
                            {item.paginas_mais_vistas && item.paginas_mais_vistas.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Top páginas:</span>{' '}
                                {item.paginas_mais_vistas.join(', ')}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Último acesso: {formatDistanceToNow(new Date(item.ultima_atividade), { addSuffix: true, locale: ptBR })}</span>
                              {item.cadastro && (
                                <span>Cadastro: {format(new Date(item.cadastro), 'dd/MM/yyyy')}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>

            {/* Ranking Aulas Mais Acessadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Aulas Mais Acessadas
                  </div>
                  <Badge variant="secondary">{rankingAulas?.length || 0} aulas</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAulas ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : rankingAulas && rankingAulas.length > 0 ? (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-3 pr-4">
                      {rankingAulas.map((item, index) => {
                        const maxViews = rankingAulas[0]?.total_views || 1;
                        const pct = (item.total_views / maxViews) * 100;
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                        return (
                          <div key={item.page_path} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-8 text-right shrink-0">{medal || `#${index + 1}`}</span>
                                <div className="min-w-0">
                                  <span className="font-medium text-sm block truncate">{item.titulo}</span>
                                  <span className="text-xs text-muted-foreground">{item.tipo}</span>
                                </div>
                              </div>
                              <Badge className="text-xs shrink-0 ml-2">{item.total_views} views</Badge>
                            </div>
                            <Progress value={pct} className="h-2" />
                            <div className="flex gap-2 text-xs">
                              <Badge variant="outline">{item.usuarios_unicos} usuários</Badge>
                              <Badge variant="outline">⏱ {item.tempo_formatado}</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{item.page_path}</p>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
                )}
              </CardContent>
            </Card>

            {/* Ranking Usuários que mais acessam aulas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Usuários Mais Engajados em Aulas
                  </div>
                  <Badge variant="secondary">{rankingUsuarioAulas?.length || 0} alunos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsuarioAulas ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : rankingUsuarioAulas && rankingUsuarioAulas.length > 0 ? (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-3 pr-4">
                      {rankingUsuarioAulas.map((item, index) => {
                        const maxViews = rankingUsuarioAulas[0]?.total_views_aulas || 1;
                        const pct = (item.total_views_aulas / maxViews) * 100;
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                        return (
                          <div key={item.user_id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-lg w-8 text-right shrink-0">{medal || `#${index + 1}`}</span>
                                <div className="min-w-0">
                                  <span className="font-medium block truncate">{item.nome}</span>
                                  <span className="text-xs text-muted-foreground truncate block">{item.email}</span>
                                </div>
                              </div>
                              <Badge className="text-xs shrink-0 ml-2">{item.total_views_aulas} views</Badge>
                            </div>
                            <Progress value={pct} className="h-2" />
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline">{item.total_aulas_acessadas} aulas distintas</Badge>
                              <Badge variant="outline">⏱ {item.tempo_formatado}</Badge>
                            </div>
                            {item.aulas_distintas && item.aulas_distintas.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Aulas:</span>{' '}
                                {item.aulas_distintas.map(a => decodeURIComponent(a)).join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
                )}
              </CardContent>
            </Card>

            {/* Grid: Áreas + Funções */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Áreas Mais Acessadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Áreas Mais Acessadas
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAreas ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : rankingAreas && rankingAreas.length > 0 ? (
                    <div className="space-y-3">
                      {rankingAreas.map((item, index) => {
                        const maxCount = rankingAreas[0]?.count || 1;
                        const pct = (item.count / maxCount) * 100;
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                        return (
                          <div key={item.area} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-6 text-right">{medal || `#${index + 1}`}</span>
                                <span className="font-medium">{item.area}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{item.usuarios_unicos} usuários</span>
                                <span className="text-xs text-muted-foreground">{item.percentual.toFixed(1)}%</span>
                                <Badge variant="secondary">{item.count.toLocaleString('pt-BR')}</Badge>
                              </div>
                            </div>
                            <Progress value={pct} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
                  )}
                </CardContent>
              </Card>

              {/* Funções Mais Utilizadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-primary" />
                      Funções Mais Utilizadas
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingFuncoes ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : rankingFuncoes && rankingFuncoes.length > 0 ? (
                    <div className="space-y-3">
                      {rankingFuncoes.map((item, index) => {
                        const maxCount = rankingFuncoes[0]?.count || 1;
                        const pct = (item.count / maxCount) * 100;
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                        return (
                          <div key={item.funcao} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-6 text-right">{medal || `#${index + 1}`}</span>
                                <span className="font-medium">{item.funcao}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{item.usuarios_unicos} usuários</span>
                                <span className="text-xs text-muted-foreground">{item.percentual.toFixed(1)}%</span>
                                <Badge variant="secondary">{item.count.toLocaleString('pt-BR')}</Badge>
                              </div>
                            </div>
                            <Progress value={pct} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ranking Fidelidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Ranking de Fidelidade
                  </div>
                  <Badge variant="secondary">{rankingFidelidade?.length || 0} usuários</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingFidelidade ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : rankingFidelidade && rankingFidelidade.length > 0 ? (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-3 pr-4">
                      {rankingFidelidade.map((item, index) => {
                        const maxDias = rankingFidelidade[0]?.dias_ativos || 1;
                        const pct = (item.dias_ativos / maxDias) * 100;
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                        return (
                          <div key={item.user_id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-lg w-8 text-right shrink-0">{medal || `#${index + 1}`}</span>
                                <div className="min-w-0">
                                  <span className="font-medium block truncate">{item.nome}</span>
                                  <span className="text-xs text-muted-foreground truncate block">{item.email}</span>
                                </div>
                              </div>
                              <Badge className="text-sm shrink-0 ml-2">{item.dias_ativos}d</Badge>
                            </div>
                            <Progress value={pct} className="h-2" />
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline">{item.total_page_views} views</Badge>
                              <Badge variant="outline">{item.dias_ativos}d ativos</Badge>
                              {item.intencao && <Badge variant="outline" className="capitalize">{item.intencao}</Badge>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
                )}
              </CardContent>
            </Card>

            {/* Lista completa de todos usuários */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Todos os Usuários Cadastrados
                  </div>
                  <Badge variant="secondary">{todosUsuarios?.length || 0} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTodos ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : todosUsuarios && todosUsuarios.length > 0 ? (
                  <ScrollArea className="max-h-[500px]">
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Perfil</TableHead>
                            <TableHead>Dispositivo</TableHead>
                            <TableHead>Cadastro</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {todosUsuarios.map((u, i) => (
                            <TableRow key={u.user_id}>
                              <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="font-medium text-sm">{u.nome || '—'}</TableCell>
                              <TableCell className="text-sm">{u.email || '—'}</TableCell>
                              <TableCell className="text-sm">{u.telefone || '—'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">{u.intencao || '—'}</Badge>
                              </TableCell>
                              <TableCell className="text-xs">{u.dispositivo || '—'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {u.cadastro ? format(new Date(u.cadastro), 'dd/MM/yyyy') : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="md:hidden space-y-3 pr-4">
                      {todosUsuarios.map((u, i) => (
                        <div key={u.user_id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">{u.nome || 'Sem nome'}</span>
                            <span className="text-xs text-muted-foreground">#{i + 1}</span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                          <div className="flex gap-2">
                            {u.intencao && <Badge variant="outline" className="text-[10px] capitalize">{u.intencao}</Badge>}
                            {u.dispositivo && <Badge variant="outline" className="text-[10px]">{u.dispositivo}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum dado</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminControle;
