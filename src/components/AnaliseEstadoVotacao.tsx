import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AnaliseEstadoVotacaoProps {
  votos: Array<{
    deputado_: {
      siglaUf?: string;
    };
    tipoVoto?: string;
  }>;
}

export const AnaliseEstadoVotacao = ({ votos }: AnaliseEstadoVotacaoProps) => {
  // Agregar votos por estado
  const votosPorEstado = votos.reduce((acc, voto) => {
    const estado = voto.deputado_?.siglaUf || 'Sem UF';
    if (!acc[estado]) {
      acc[estado] = { sim: 0, nao: 0, abstencao: 0, obstrucao: 0, total: 0 };
    }
    
    acc[estado].total++;
    switch (voto.tipoVoto) {
      case 'Sim':
        acc[estado].sim++;
        break;
      case 'Não':
        acc[estado].nao++;
        break;
      case 'Abstenção':
        acc[estado].abstencao++;
        break;
      case 'Obstrução':
        acc[estado].obstrucao++;
        break;
    }
    
    return acc;
  }, {} as Record<string, { sim: number; nao: number; abstencao: number; obstrucao: number; total: number }>);

  // Estados com mais SIM
  const estadosMaisSim = Object.entries(votosPorEstado)
    .map(([estado, dados]) => ({
      estado,
      value: dados.sim,
      percentual: Math.round(dados.sim / dados.total * 100),
      total: dados.total,
    }))
    .sort((a, b) => b.percentual - a.percentual)
    .slice(0, 10);

  // Estados com mais NÃO
  const estadosMaisNao = Object.entries(votosPorEstado)
    .map(([estado, dados]) => ({
      estado,
      value: dados.nao,
      percentual: Math.round(dados.nao / dados.total * 100),
      total: dados.total,
    }))
    .sort((a, b) => b.percentual - a.percentual)
    .slice(0, 10);

  const COLORS = ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#0f4f2a', '#0a3e1f', '#063315', '#032710', '#011c0b'];
  const COLORS_NAO = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#6b1a1a', '#571717', '#431414', '#2f1111', '#1b0e0e'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Análise por Estado (UF)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Estados que mais votaram SIM */}
          <div>
            <h3 className="font-semibold mb-3 text-center text-green-500">Estados que mais votaram SIM (%)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={estadosMaisSim}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ estado, percentual }) => `${estado} ${percentual}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {estadosMaisSim.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1">
              {estadosMaisSim.slice(0, 5).map((item, idx) => (
                <div key={item.estado} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{idx + 1}. {item.estado}</span>
                  <span className="font-semibold text-green-500">{item.percentual}% ({item.value}/{item.total})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Estados que mais votaram NÃO */}
          <div>
            <h3 className="font-semibold mb-3 text-center text-red-500">Estados que mais votaram NÃO (%)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={estadosMaisNao}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ estado, percentual }) => `${estado} ${percentual}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {estadosMaisNao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_NAO[index % COLORS_NAO.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1">
              {estadosMaisNao.slice(0, 5).map((item, idx) => (
                <div key={item.estado} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{idx + 1}. {item.estado}</span>
                  <span className="font-semibold text-red-500">{item.percentual}% ({item.value}/{item.total})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
