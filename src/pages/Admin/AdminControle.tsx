import { useState, useRef } from 'react';
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
  Calendar
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

const PERIODOS: { value: PeriodoFiltro; label: string; dias: number }[] = [
  { value: 'hoje', label: 'Hoje', dias: 0 },
  { value: '7dias', label: '7 dias', dias: 7 },
  { value: '30dias', label: '30 dias', dias: 30 },
  { value: '90dias', label: '90 dias', dias: 90 },
];

const getDiasFromPeriodo = (periodo: PeriodoFiltro): number => {
  return PERIODOS.find(p => p.value === periodo)?.dias ?? 7;
};

const AdminControle = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('7dias');

  const diasFiltro = getDiasFromPeriodo(periodo);
  const diasParaQuery = diasFiltro === 0 ? 1 : diasFiltro; // Para queries que não aceitam 0

  const { data: novosUsuarios, isLoading: loadingUsuarios, refetch: refetchUsuarios } = useNovosUsuarios(diasParaQuery);
  const { data: paginasPopulares, isLoading: loadingPaginas, refetch: refetchPaginas } = usePaginasPopulares(diasParaQuery);
  const { data: termosPesquisados, isLoading: loadingTermos, refetch: refetchTermos } = useTermosPesquisados();
  const { data: estatisticas, isLoading: loadingStats, refetch: refetchStats } = useEstatisticasGerais(diasParaQuery);
  const { data: dispositivos, refetch: refetchDispositivos } = useDistribuicaoDispositivos();
  const { data: intencoes, refetch: refetchIntencoes } = useDistribuicaoIntencoes();
  const { data: metricasPremium, refetch: refetchPremium } = useMetricasPremium();
  const { onlineAgora, isLoading: loadingOnline, refetch: refetchOnline } = useOnlineAgoraRealtime();
  const { data: listaAssinantes, isLoading: loadingAssinantes, refetch: refetchAssinantes } = useListaAssinantesPremium();
  const { data: cadastrosDia } = useCadastrosPorDia(diasParaQuery);

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

  // Format chart data
  const chartData = (cadastrosDia || []).map(item => ({
    dia: format(new Date(item.dia + 'T12:00:00'), 'dd/MM'),
    total: item.total,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
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
        {/* Cards de Estatísticas - Novos por período */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Novos Hoje</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {loadingStats ? '...' : estatisticas?.novosHoje || 0}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-emerald-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Novos 7d</p>
                  <p className="text-2xl font-bold text-sky-500">
                    {loadingStats ? '...' : estatisticas?.novos7d || 0}
                  </p>
                </div>
                <BarChart3 className="h-6 w-6 text-sky-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Novos 30d</p>
                  <p className="text-2xl font-bold text-violet-500">
                    {loadingStats ? '...' : estatisticas?.novos30d || 0}
                  </p>
                </div>
                <BarChart3 className="h-6 w-6 text-violet-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Usuários</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? '...' : estatisticas?.totalUsuarios?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>
                <Users className="h-6 w-6 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ativos ({periodoLabel})</p>
                  <p className="text-2xl font-bold text-sky-500">
                    {loadingStats ? '...' : estatisticas?.ativosNoPeriodo || 0}
                  </p>
                </div>
                <Activity className="h-6 w-6 text-sky-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Online Agora</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {loadingOnline ? '...' : onlineAgora}
                  </p>
                </div>
                <div className="relative">
                  <Clock className="h-6 w-6 text-emerald-500 opacity-50" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                      diasFiltro > 0 && estatisticas?.novos30d
                        ? Math.round(
                            (periodo === '7dias' ? estatisticas.novos7d : 
                             periodo === '30dias' ? estatisticas.novos30d : 
                             periodo === '90dias' ? estatisticas.novos30d :
                             estatisticas.novosHoje) / Math.max(diasFiltro || 1, 1)
                          )
                        : estatisticas?.novosHoje || 0
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

        {/* Cards de Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card 
            className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:border-amber-500/60 transition-colors"
            onClick={() => {
              const el = document.getElementById('assinantes-premium-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Total Premium</p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-500">
                    {metricasPremium?.totalPremium || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Toque para ver detalhes</p>
                </div>
                <Crown className="h-8 w-8 text-amber-500 opacity-50 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-500">
                    {metricasPremium?.taxaConversao?.toFixed(2) || 0}%
                  </p>
                </div>
                <Percent className="h-8 w-8 text-amber-500 opacity-50 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground truncate">Média até Premium</p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-500">
                    {metricasPremium?.mediaDiasAtePremium != null 
                      ? `${metricasPremium.mediaDiasAtePremium}d` 
                      : '-'}
                  </p>
                </div>
                <CalendarClock className="h-8 w-8 text-amber-500 opacity-50 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Assinantes Premium */}
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
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listaAssinantes.map((assinante, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-sm">
                          {assinante.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">
                            {assinante.intencao || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {assinante.plano}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          R$ {assinante.valor?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(assinante.data), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-500/20 text-emerald-500 text-xs">
                            Ativo
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum assinante encontrado
              </p>
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
                              <span className="text-muted-foreground w-6">
                                #{index + 1}
                              </span>
                              <span className="font-medium">
                                {pagina.page_title || pagina.page_path}
                              </span>
                            </div>
                            <Badge variant="secondary">
                              {pagina.count.toLocaleString('pt-BR')}
                            </Badge>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {pagina.page_path}
                          </p>
                        </div>
                      );
                    })}

                    {(!paginasPopulares || paginasPopulares.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum dado de navegação ainda
                      </p>
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
                              <span className="text-muted-foreground w-6">
                                #{index + 1}
                              </span>
                              <span className="font-medium">{termo.termo}</span>
                            </div>
                            <Badge variant="secondary">
                              {termo.count.toLocaleString('pt-BR')}
                            </Badge>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}

                    {(!termosPesquisados || termosPesquisados.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma busca registrada ainda
                      </p>
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
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>🍎 iOS</span>
                          <span>{dispositivos.iOS} ({((dispositivos.iOS / totalDispositivos) * 100).toFixed(1)}%)</span>
                        </div>
                        <Progress value={(dispositivos.iOS / totalDispositivos) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>🤖 Android</span>
                          <span>{dispositivos.Android} ({((dispositivos.Android / totalDispositivos) * 100).toFixed(1)}%)</span>
                        </div>
                        <Progress value={(dispositivos.Android / totalDispositivos) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>💻 Desktop</span>
                          <span>{dispositivos.Desktop} ({((dispositivos.Desktop / totalDispositivos) * 100).toFixed(1)}%)</span>
                        </div>
                        <Progress value={(dispositivos.Desktop / totalDispositivos) * 100} className="h-2" />
                      </div>
                      {dispositivos.Outro > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>📱 Outro</span>
                            <span>{dispositivos.Outro} ({((dispositivos.Outro / totalDispositivos) * 100).toFixed(1)}%)</span>
                          </div>
                          <Progress value={(dispositivos.Outro / totalDispositivos) * 100} className="h-2" />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Carregando dados...
                    </p>
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
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>🎓 Universitário</span>
                          <span>{intencoes.Universitario} ({((intencoes.Universitario / totalIntencoes) * 100).toFixed(1)}%)</span>
                        </div>
                        <Progress value={(intencoes.Universitario / totalIntencoes) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>🎯 Concurseiro</span>
                          <span>{intencoes.Concurseiro} ({((intencoes.Concurseiro / totalIntencoes) * 100).toFixed(1)}%)</span>
                        </div>
                        <Progress value={(intencoes.Concurseiro / totalIntencoes) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>⚖️ OAB</span>
                          <span>{intencoes.OAB} ({((intencoes.OAB / totalIntencoes) * 100).toFixed(1)}%)</span>
                        </div>
                        <Progress value={(intencoes.OAB / totalIntencoes) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>👔 Advogado</span>
                          <span>{intencoes.Advogado} ({((intencoes.Advogado / totalIntencoes) * 100).toFixed(1)}%)</span>
                        </div>
                        <Progress value={(intencoes.Advogado / totalIntencoes) * 100} className="h-2" />
                      </div>
                      {intencoes.Outro > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>❓ Outro</span>
                            <span>{intencoes.Outro} ({((intencoes.Outro / totalIntencoes) * 100).toFixed(1)}%)</span>
                          </div>
                          <Progress value={(intencoes.Outro / totalIntencoes) * 100} className="h-2" />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Carregando dados...
                    </p>
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
