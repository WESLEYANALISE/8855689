import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface AnalisePartidoVotacaoProps {
  votos: Array<{
    deputado_: {
      siglaPartido?: string;
    };
    tipoVoto?: string;
  }>;
}

export const AnalisePartidoVotacao = ({ votos }: AnalisePartidoVotacaoProps) => {
  // Agregar votos por partido
  const votosPorPartido = votos.reduce((acc, voto) => {
    const partido = voto.deputado_?.siglaPartido || 'Sem Partido';
    if (!acc[partido]) {
      acc[partido] = { sim: 0, nao: 0, abstencao: 0, obstrucao: 0, total: 0 };
    }
    
    acc[partido].total++;
    switch (voto.tipoVoto) {
      case 'Sim':
        acc[partido].sim++;
        break;
      case 'Não':
        acc[partido].nao++;
        break;
      case 'Abstenção':
        acc[partido].abstencao++;
        break;
      case 'Obstrução':
        acc[partido].obstrucao++;
        break;
    }
    
    return acc;
  }, {} as Record<string, { sim: number; nao: number; abstencao: number; obstrucao: number; total: number }>);

  // Converter para array e ordenar por total de votos
  const dadosGrafico = Object.entries(votosPorPartido)
    .map(([partido, dados]) => ({
      partido,
      Sim: dados.sim,
      Não: dados.nao,
      Abstenção: dados.abstencao,
      Obstrução: dados.obstrucao,
      total: dados.total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15); // Top 15 partidos

  const COLORS = {
    Sim: '#22c55e',
    Não: '#ef4444',
    Abstenção: '#9ca3af',
    Obstrução: '#f59e0b',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Análise por Partido</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="partido" 
              className="text-xs"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="Sim" stackId="a" fill={COLORS.Sim} />
            <Bar dataKey="Não" stackId="a" fill={COLORS.Não} />
            <Bar dataKey="Abstenção" stackId="a" fill={COLORS.Abstenção} />
            <Bar dataKey="Obstrução" stackId="a" fill={COLORS.Obstrução} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {dadosGrafico.slice(0, 6).map((item) => (
            <div key={item.partido} className="p-3 bg-muted rounded-lg">
              <p className="font-bold text-sm mb-1">{item.partido}</p>
              <div className="text-xs space-y-0.5">
                <p className="text-green-500">Sim: {item.Sim} ({Math.round(item.Sim / item.total * 100)}%)</p>
                <p className="text-red-500">Não: {item.Não} ({Math.round(item.Não / item.total * 100)}%)</p>
                {item.Abstenção > 0 && (
                  <p className="text-gray-400">Abstenção: {item.Abstenção}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
