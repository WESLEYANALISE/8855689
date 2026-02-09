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
  CalendarClock
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
} from '@/hooks/useAdminControleStats';

const AdminControle = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('usuarios');

  const { data: novosUsuarios, isLoading: loadingUsuarios, refetch: refetchUsuarios } = useNovosUsuarios();
  const { data: paginasPopulares, isLoading: loadingPaginas, refetch: refetchPaginas } = usePaginasPopulares();
  const { data: termosPesquisados, isLoading: loadingTermos, refetch: refetchTermos } = useTermosPesquisados();
  const { data: estatisticas, isLoading: loadingStats, refetch: refetchStats } = useEstatisticasGerais();
  const { data: dispositivos, refetch: refetchDispositivos } = useDistribuicaoDispositivos();
  const { data: intencoes, refetch: refetchIntencoes } = useDistribuicaoIntencoes();
  const { data: metricasPremium, refetch: refetchPremium } = useMetricasPremium();
  const { onlineAgora, isLoading: loadingOnline, refetch: refetchOnline } = useOnlineAgoraRealtime();

  const handleRefreshAll = () => {
    refetchUsuarios();
    refetchPaginas();
    refetchTermos();
    refetchStats();
    refetchDispositivos();
    refetchIntencoes();
    refetchPremium();
    refetchOnline();
  };

  // Calcula porcentagens para gráficos
  const totalDispositivos = dispositivos 
    ? dispositivos.iOS + dispositivos.Android + dispositivos.Desktop + dispositivos.Outro 
    : 0;

  const totalIntencoes = intencoes
    ? intencoes.Estudante + intencoes.OAB + intencoes.Advogado + intencoes.Outro
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Novos Hoje</p>
                  <p className="text-3xl font-bold text-primary">
                    {loadingStats ? '...' : estatisticas?.novosHoje || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Usuários</p>
                  <p className="text-3xl font-bold">
                    {loadingStats ? '...' : estatisticas?.totalUsuarios?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos (7 dias)</p>
                  <p className="text-3xl font-bold text-sky-500">
                    {loadingStats ? '...' : estatisticas?.ativosUltimos7Dias || 0}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-sky-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Online Agora</p>
                  <p className="text-3xl font-bold text-emerald-500">
                    {loadingOnline ? '...' : onlineAgora}
                  </p>
                </div>
                <div className="relative">
                  <Clock className="h-8 w-8 text-emerald-500 opacity-50" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Total Premium</p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-500">
                    {metricasPremium?.totalPremium || 0}
                  </p>
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
                    {metricasPremium?.mediaDiasAtePremium !== null 
                      ? `${metricasPremium.mediaDiasAtePremium}d` 
                      : '-'}
                  </p>
                </div>
                <CalendarClock className="h-8 w-8 text-amber-500 opacity-50 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

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
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Novos Cadastros
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
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Páginas Mais Acessadas (7 dias)
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
                          <span>📚 Estudante</span>
                          <span>{intencoes.Estudante} ({((intencoes.Estudante / totalIntencoes) * 100).toFixed(1)}%)</span>
                        </div>
                        <Progress value={(intencoes.Estudante / totalIntencoes) * 100} className="h-2" />
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
