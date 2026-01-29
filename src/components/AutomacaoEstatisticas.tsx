import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EstatisticasDia {
  data: string;
  total: number;
  formatadas: number;
  pendentes: number;
}

interface EstatisticasGerais {
  totalLeis: number;
  formatadas: number;
  pendentes: number;
  comErro: number;
  taxaSucesso: number;
}

export function AutomacaoEstatisticas() {
  const [estatisticas, setEstatisticas] = useState<EstatisticasDia[]>([]);
  const [gerais, setGerais] = useState<EstatisticasGerais | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'7' | '30' | '90'>('7');

  useEffect(() => {
    carregarEstatisticas();
  }, [periodo]);

  const carregarEstatisticas = async () => {
    setLoading(true);

    try {
      // Buscar todas as leis do período
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));

      const { data: leis, error } = await supabase
        .from('leis_push_2025')
        .select('id, status, data_dou, updated_at')
        .gte('data_dou', dataLimite.toISOString().split('T')[0])
        .order('data_dou', { ascending: false });

      if (error) throw error;

      // Calcular estatísticas gerais
      const totalLeis = leis?.length || 0;
      const formatadas = leis?.filter(l => l.status === 'aprovado').length || 0;
      const pendentes = leis?.filter(l => l.status === 'pendente').length || 0;
      const comErro = leis?.filter(l => l.status === 'erro').length || 0;
      const taxaSucesso = totalLeis > 0 ? (formatadas / totalLeis) * 100 : 0;

      setGerais({
        totalLeis,
        formatadas,
        pendentes,
        comErro,
        taxaSucesso
      });

      // Agrupar por dia
      const porDia: Record<string, { total: number; formatadas: number; pendentes: number }> = {};

      leis?.forEach(lei => {
        const data = lei.data_dou?.split('T')[0] || 'sem-data';
        if (!porDia[data]) {
          porDia[data] = { total: 0, formatadas: 0, pendentes: 0 };
        }
        porDia[data].total++;
        if (lei.status === 'aprovado') porDia[data].formatadas++;
        if (lei.status === 'pendente') porDia[data].pendentes++;
      });

      const estatisticasArray = Object.entries(porDia)
        .map(([data, stats]) => ({
          data,
          ...stats
        }))
        .sort((a, b) => b.data.localeCompare(a.data))
        .slice(0, 14);

      setEstatisticas(estatisticasArray);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString: string) => {
    if (dataString === 'sem-data') return 'Sem data';
    const data = new Date(dataString + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const maxTotal = useMemo(() => {
    return Math.max(...estatisticas.map(e => e.total), 1);
  }, [estatisticas]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4 h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Estatísticas de Formatação
          </CardTitle>
          <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as '7' | '30' | '90')}>
            <TabsList className="h-8">
              <TabsTrigger value="7" className="text-xs h-7 px-3">7d</TabsTrigger>
              <TabsTrigger value="30" className="text-xs h-7 px-3">30d</TabsTrigger>
              <TabsTrigger value="90" className="text-xs h-7 px-3">90d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        {/* Resumo Geral */}
        {gerais && (
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-2xl font-bold text-foreground">{gerais.totalLeis}</p>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-2xl font-bold text-green-500">{gerais.formatadas}</p>
              <p className="text-xs text-muted-foreground mt-1">Formatadas</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-2xl font-bold text-yellow-500">{gerais.pendentes}</p>
              <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-2xl font-bold text-primary">{gerais.taxaSucesso.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Taxa</p>
            </div>
          </div>
        )}

        {/* Barra de Progresso Geral */}
        {gerais && gerais.totalLeis > 0 && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/30">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progresso geral</span>
              <span className="text-muted-foreground">{gerais.formatadas}/{gerais.totalLeis}</span>
            </div>
            <Progress value={gerais.taxaSucesso} className="h-3" />
          </div>
        )}

        {/* Gráfico por Dia */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Por dia (últimos {periodo} dias)
          </p>
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
            {estatisticas.map((stat) => (
              <div key={stat.data} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                <span className="text-xs text-muted-foreground w-14 shrink-0 font-medium">
                  {formatarData(stat.data)}
                </span>
                <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden relative">
                  {/* Barra de formatadas */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-green-500/80 transition-all"
                    style={{ width: `${(stat.formatadas / maxTotal) * 100}%` }}
                  />
                  {/* Barra de pendentes */}
                  <div 
                    className="absolute inset-y-0 bg-yellow-500/60 transition-all"
                    style={{ 
                      left: `${(stat.formatadas / maxTotal) * 100}%`,
                      width: `${(stat.pendentes / maxTotal) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex items-center gap-1.5 w-20 shrink-0 justify-end">
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-green-500/10 text-green-500 border-green-500/30">
                    {stat.formatadas}
                  </Badge>
                  {stat.pendentes > 0 && (
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                      {stat.pendentes}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-center gap-6 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-xs text-muted-foreground">Formatadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-yellow-500" />
            <span className="text-xs text-muted-foreground">Pendentes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
