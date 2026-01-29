import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEvolucaoGastos } from "@/hooks/useEvolucaoGastos";

interface GraficoEvolucaoGastosProps {
  politicoId: number | string;
  tipo?: 'deputado' | 'senador';
  titulo?: string;
}

export function GraficoEvolucaoGastos({ 
  politicoId, 
  tipo = 'deputado',
  titulo = "Evolução de Gastos"
}: GraficoEvolucaoGastosProps) {
  const { dados, isLoading, totalPeriodo, mediaMensal } = useEvolucaoGastos(politicoId, tipo);

  const formatarValor = (valor: number) => {
    if (valor >= 1000000) return `R$ ${(valor / 1000000).toFixed(1)}M`;
    if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(0)}K`;
    return `R$ ${valor.toFixed(0)}`;
  };

  const formatarValorCompleto = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Calcular tendência
  const getTendencia = () => {
    if (dados.length < 2) return null;
    const metade = Math.floor(dados.length / 2);
    const mediaInicio = dados.slice(0, metade).reduce((s, d) => s + d.valor, 0) / metade;
    const mediaFim = dados.slice(metade).reduce((s, d) => s + d.valor, 0) / (dados.length - metade);
    const diff = ((mediaFim - mediaInicio) / mediaInicio) * 100;
    
    if (diff > 5) return { icon: TrendingUp, color: 'text-red-400', texto: `+${diff.toFixed(0)}%` };
    if (diff < -5) return { icon: TrendingDown, color: 'text-green-400', texto: `${diff.toFixed(0)}%` };
    return { icon: Minus, color: 'text-muted-foreground', texto: 'Estável' };
  };

  const tendencia = getTendencia();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`font-bold ${tipo === 'deputado' ? 'text-amber-400' : 'text-blue-400'}`}>
            {formatarValorCompleto(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm font-semibold ${tipo === 'deputado' ? 'text-amber-400' : 'text-blue-400'}`}>
            {titulo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            Nenhum dado de gastos disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  const corGradiente = tipo === 'deputado' ? '#f59e0b' : '#3b82f6';

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-sm font-semibold ${tipo === 'deputado' ? 'text-amber-400' : 'text-blue-400'}`}>
            {titulo}
          </CardTitle>
          {tendencia && (
            <div className={`flex items-center gap-1 ${tendencia.color}`}>
              <tendencia.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{tendencia.texto}</span>
            </div>
          )}
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Total: <span className="font-medium text-foreground">{formatarValorCompleto(totalPeriodo)}</span></span>
          <span>Média: <span className="font-medium text-foreground">{formatarValorCompleto(mediaMensal)}/mês</span></span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${tipo}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={corGradiente} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={corGradiente} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="mes" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={formatarValor}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="valor"
                stroke={corGradiente}
                strokeWidth={2}
                fill={`url(#gradient-${tipo})`}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
