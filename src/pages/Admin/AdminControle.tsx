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
import {
  useNovosUsuarios,
  usePaginasPopulares,
  useTermosPesquisados,
  useEstatisticasGerais,
  useDistribuicaoDispositivos,
  useDistribuicaoIntencoes,
  useMetricasPremium,
  useOnlineAgoraRealtime,
  useListaAssinantesPremium,
  useCadastrosPorDia,
  useOnlineDetails,
  useAtivosDetalhes,
  useNovosDetalhes,
  type UsuarioDetalhe,
} from '@/hooks/useAdminControleStats';
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
type DialogType = 'online' | 'novos' | 'ativos' | 'total' | null;

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

  const { data: novosUsuarios, isLoading: loadingUsuarios, refetch: refetchUsuarios } = useNovosUsuarios(diasParaQuery);
  const { data: paginasPopulares, isLoading: loadingPaginas, refetch: refetchPaginas } = usePaginasPopulares(diasParaQuery);
  const { data: termosPesquisados, isLoading: loadingTermos, refetch: refetchTermos } = useTermosPesquisados();
  const { data: estatisticas, isLoading: loadingStats, refetch: refetchStats } = useEstatisticasGerais(diasFiltro);
  const { data: dispositivos, refetch: refetchDispositivos } = useDistribuicaoDispositivos();
  const { data: intencoes, refetch: refetchIntencoes } = useDistribuicaoIntencoes();
  const { data: metricasPremium, refetch: refetchPremium } = useMetricasPremium(diasFiltro);
  const { onlineAgora, isLoading: loadingOnline, refetch: refetchOnline } = useOnlineAgoraRealtime();
  const { data: listaAssinantes, isLoading: loadingAssinantes, refetch: refetchAssinantes } = useListaAssinantesPremium();
  const { data: cadastrosDia } = useCadastrosPorDia(diasParaQuery);

  // Detail hooks for dialogs
  const { data: onlineDetails } = useOnlineDetails();
  const { data: ativosDetails } = useAtivosDetalhes(diasParaQuery);
  const { data: novosDetails } = useNovosDetalhes(diasFiltro);

  const handleRefreshAll = () => {
    refetchUsuarios();
    refetchPaginas();
    refetchTermos();
    refetchStats();
    refetchDispositivos();
    refetchIntencoes();
    refetchPremium();
    refetchOnline();
    refetchAssinantes();
  };

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
      case 'online': return 'Usuários Online Agora';
      case 'novos': return `Novos Usuários (${periodoLabel})`;
      case 'ativos': return `Usuários Ativos (${periodoLabel})`;
      case 'total': return 'Todos os Usuários';
      default: return '';
    }
  };

  const getDialogUsers = (): UsuarioDetalhe[] => {
    switch (openDialog) {
      case 'online': return onlineDetails || [];
      case 'novos': return novosDetails || [];
      case 'ativos': return ativosDetails || [];
      case 'total': return ativosDetails || []; // reuse ativos with large period
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
      {/* Header */}
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
                  Monitoramento em tempo real do aplicativo
                </p>
              </div>
            </div>
            <Button onClick={handleRefreshAll} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
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
        {/* Cards de Estatísticas - Clicáveis */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:border-emerald-500/50 transition-colors"
            onClick={() => setOpenDialog('online')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Online Agora</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {loadingOnline ? '...' : onlineAgora}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Toque para detalhes</p>
                </div>
                <div className="relative">
                  <Clock className="h-6 w-6 text-emerald-500 opacity-50" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-sky-500/50 transition-colors"
            onClick={() => setOpenDialog('novos')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Novos ({periodoLabel})</p>
                  <p className="text-2xl font-bold text-sky-500">
                    {loadingStats ? '...' : estatisticas?.novosNoPeriodo || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Toque para detalhes</p>
                </div>
                <UserPlus className="h-6 w-6 text-sky-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-violet-500/50 transition-colors"
            onClick={() => setOpenDialog('ativos')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ativos ({periodoLabel})</p>
                  <p className="text-2xl font-bold text-violet-500">
                    {loadingStats ? '...' : estatisticas?.ativosNoPeriodo || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Toque para detalhes</p>
                </div>
                <Activity className="h-6 w-6 text-violet-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setOpenDialog('total')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Usuários</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? '...' : estatisticas?.totalUsuarios?.toLocaleString('pt-BR') || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Toque para detalhes</p>
                </div>
                <Users className="h-6 w-6 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog de detalhes */}
        <Dialog open={openDialog !== null} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{getDialogTitle()}</DialogTitle>
              <DialogDescription>
                {openDialog === 'online' && 'Sessões ativas nos últimos 5 minutos'}
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
                      showPagePath={openDialog === 'online'}
                      showViews={openDialog === 'ativos' || openDialog === 'total'}
                      showCreatedAt={openDialog === 'novos'}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Page views + média */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Page Views ({periodoLabel})</p>
                  <p className="text-3xl font-bold">
                    {loadingStats ? '...' : estatisticas?.totalPageViews?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

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
        </div>

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

        {/* Cards de Premium + Receita */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card 
            className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:border-amber-500/60 transition-colors"
            onClick={() => {
              const el = document.getElementById('assinantes-premium-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total Premium</p>
              <p className="text-2xl font-bold text-amber-500">{metricasPremium?.totalPremium || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Taxa Conversão</p>
              <p className="text-2xl font-bold text-amber-500">{metricasPremium?.taxaConversao?.toFixed(2) || 0}%</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Novos Premium ({periodoLabel})</p>
              <p className="text-2xl font-bold text-amber-500">{metricasPremium?.novosPremiumPeriodo || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Receita Total</p>
              <p className="text-xl font-bold text-emerald-500">
                R$ {(metricasPremium?.receitaTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Receita Mensal</p>
              <p className="text-lg font-bold text-emerald-500">
                R$ {(metricasPremium?.receitaMensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Anual: R$ {(metricasPremium?.receitaAnual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Receita Vitalício</p>
              <p className="text-lg font-bold text-emerald-500">
                R$ {(metricasPremium?.receitaVitalicio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Média até Premium: {metricasPremium?.mediaDiasAtePremium != null ? `${metricasPremium.mediaDiasAtePremium}d` : '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Assinantes Premium - Responsiva */}
        <Card className="border-amber-500/30" id="assinantes-premium-section">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Assinantes Premium
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

        {/* Tabs de Análise */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
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
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Termos Mais Pesquisados
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
                            <Badge variant="secondary">{termo.count.toLocaleString('pt-BR')}</Badge>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                    {(!termosPesquisados || termosPesquisados.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">Nenhuma busca registrada ainda</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Dispositivos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Dispositivos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dispositivos && totalDispositivos > 0 ? (
                    <>
                      {[
                        { label: '🍎 iOS', value: dispositivos.iOS },
                        { label: '🤖 Android', value: dispositivos.Android },
                        { label: '💻 Desktop', value: dispositivos.Desktop },
                        ...(dispositivos.Outro > 0 ? [{ label: '📱 Outro', value: dispositivos.Outro }] : []),
                      ].map(d => (
                        <div key={d.label} className="space-y-2">
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
                    Intenções
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {intencoes && totalIntencoes > 0 ? (
                    <>
                      {[
                        { label: '🎓 Universitário', value: intencoes.Universitario },
                        { label: '🎯 Concurseiro', value: intencoes.Concurseiro },
                        { label: '⚖️ OAB', value: intencoes.OAB },
                        { label: '👔 Advogado', value: intencoes.Advogado },
                        ...(intencoes.Outro > 0 ? [{ label: '❓ Outro', value: intencoes.Outro }] : []),
                      ].map(d => (
                        <div key={d.label} className="space-y-2">
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminControle;
