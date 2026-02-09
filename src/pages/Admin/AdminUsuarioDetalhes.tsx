import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  Clock, 
  FileText, 
  Flame, 
  Timer,
  Crown,
  Calendar,
  Smartphone,
  Target,
  RefreshCw,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUsuarioDetalhes } from '@/hooks/useUsuarioDetalhes';

const AdminUsuarioDetalhes = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const { data, isLoading, refetch } = useUsuarioDetalhes(userId || '');
  
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Usuário não encontrado</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }
  
  const { profile, metricas } = data;
  
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
                  <User className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold">Detalhes do Usuário</h1>
                </div>
              </div>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Card de Perfil */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.nome || 'Usuário'} />
                <AvatarFallback className="text-2xl">
                  {profile.nome?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{profile.nome || 'Sem nome'}</h2>
                  {metricas.isPremium ? (
                    <Badge className="bg-yellow-500 text-black">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Gratuito</Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground">{profile.email}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {getDeviceIcon(profile.dispositivo)}
                    {parseDeviceInfo(profile.device_info) || profile.dispositivo || 'Dispositivo não identificado'}
                  </span>
                  {profile.intencao && (
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {profile.intencao}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Membro desde {format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                
                {metricas.isPremium && metricas.diasAtePremium !== null && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    <Crown className="h-4 w-4 inline mr-1" />
                    Converteu para Premium em {metricas.diasAtePremium} dias
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Acessos</p>
                  <p className="text-3xl font-bold text-primary">
                    {metricas.totalAcessos.toLocaleString('pt-BR')}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Páginas Únicas</p>
                  <p className="text-3xl font-bold text-blue-500">
                    {metricas.paginasUnicas}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dias Seguidos</p>
                  <p className="text-3xl font-bold text-orange-500">
                    {metricas.diasConsecutivos}
                  </p>
                </div>
                <Flame className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio</p>
                  <p className="text-3xl font-bold text-green-500">
                    {metricas.tempoMedioOnline}
                  </p>
                </div>
                <Timer className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sequência de Acesso */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="h-6 w-6 text-orange-500" />
                <div>
                  <p className="font-medium">
                    {metricas.diasConsecutivos > 0 
                      ? `${metricas.diasConsecutivos} ${metricas.diasConsecutivos === 1 ? 'dia consecutivo' : 'dias consecutivos'} de acesso`
                      : 'Sem sequência ativa'}
                  </p>
                  {metricas.ultimaVisita && (
                    <p className="text-sm text-muted-foreground">
                      Última atividade: {formatDistanceToNow(metricas.ultimaVisita, { addSuffix: true, locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Páginas Mais Acessadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Páginas Mais Acessadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {metricas.paginasAcessadas.length > 0 ? (
                metricas.paginasAcessadas.map((pagina, index) => {
                  const maxCount = metricas.paginasAcessadas[0]?.count || 1;
                  const percentage = (pagina.count / maxCount) * 100;
                  
                  return (
                    <div key={pagina.page_path} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-6">
                            #{index + 1}
                          </span>
                          <span className="font-medium truncate max-w-[200px]">
                            {pagina.page_title || pagina.page_path}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {pagina.count}
                        </Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma navegação registrada
                </p>
              )}
            </CardContent>
          </Card>

          {/* Áreas Preferidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Áreas Preferidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {metricas.areasPreferidas.length > 0 ? (
                metricas.areasPreferidas.map((area) => (
                  <div key={area.area} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{area.area}</span>
                      <span className="text-muted-foreground">
                        {area.percentual}%
                      </span>
                    </div>
                    <Progress value={area.percentual} className="h-2" />
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma área identificada
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Navegação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Navegação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {metricas.historicoNavegacao.length > 0 ? (
                metricas.historicoNavegacao.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 py-2 border-b border-border last:border-0"
                  >
                    <span className="text-xs text-muted-foreground min-w-[120px]">
                      {format(new Date(item.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                    </span>
                    <span className="text-sm truncate">
                      {item.page_title || item.page_path}
                    </span>
                    <span className="text-xs text-muted-foreground truncate ml-auto max-w-[200px]">
                      {item.page_path}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma navegação registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsuarioDetalhes;
