import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, RefreshCw, Users, MessageSquare, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface MetricaDiaria {
  data: string;
  total_mensagens: number;
  total_usuarios_ativos: number;
  total_novos_usuarios: number;
  mensagens_texto: number;
  mensagens_audio: number;
  mensagens_imagem: number;
  mensagens_documento: number;
  temas_mais_consultados: { tema: string; consultas: number }[];
  horarios_pico: { hora: number; mensagens: number }[];
}

export default function EvelynDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<MetricaDiaria[]>([]);
  const [totais, setTotais] = useState({ usuarios: 0, mensagens: 0, conversas: 0 });

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Buscar métricas dos últimos 7 dias
      const { data: metricasData } = await (supabase as any)
        .from('evelyn_metricas_diarias')
        .select('*')
        .order('data', { ascending: false })
        .limit(7);

      setMetricas((metricasData as MetricaDiaria[]) || []);

      // Buscar totais gerais
      const { count: totalUsuarios } = await supabase
        .from('evelyn_usuarios')
        .select('*', { count: 'exact', head: true });

      const { count: totalMensagens } = await supabase
        .from('evelyn_mensagens')
        .select('*', { count: 'exact', head: true });

      const { count: totalConversas } = await supabase
        .from('evelyn_conversas')
        .select('*', { count: 'exact', head: true });

      setTotais({
        usuarios: totalUsuarios || 0,
        mensagens: totalMensagens || 0,
        conversas: totalConversas || 0
      });

    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  const atualizarMetricas = async () => {
    try {
      toast.info('Calculando métricas...');
      const { error } = await supabase.functions.invoke('evelyn-calcular-metricas');
      if (error) throw error;
      toast.success('Métricas atualizadas!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar métricas');
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const metricaHoje = metricas[0];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Dashboard Evelyn</h1>
              <p className="text-muted-foreground">Métricas e estatísticas da assistente</p>
            </div>
          </div>
          <Button onClick={atualizarMetricas} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Cards de totais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Total Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totais.usuarios}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Total Mensagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totais.mensagens}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{metricaHoje?.total_mensagens || 0}</p>
              <p className="text-xs text-muted-foreground">mensagens</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Ativos Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{metricaHoje?.total_usuarios_ativos || 0}</p>
              <p className="text-xs text-muted-foreground">usuários</p>
            </CardContent>
          </Card>
        </div>

        {/* Tipos de mensagem */}
        {metricaHoje && (
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Mensagem (Hoje)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{metricaHoje.mensagens_texto}</p>
                  <p className="text-sm text-muted-foreground">Texto</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{metricaHoje.mensagens_audio}</p>
                  <p className="text-sm text-muted-foreground">Áudio</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{metricaHoje.mensagens_imagem}</p>
                  <p className="text-sm text-muted-foreground">Imagem</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{metricaHoje.mensagens_documento}</p>
                  <p className="text-sm text-muted-foreground">Documento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Temas mais consultados */}
        {metricaHoje?.temas_mais_consultados?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Temas Mais Consultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metricaHoje.temas_mais_consultados.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="capitalize">{t.tema}</span>
                    <span className="font-bold">{t.consultas}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
