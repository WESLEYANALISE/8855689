import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface GraficoVotacaoProps {
  sim: number;
  nao: number;
  abstencao: number;
  obstrucao?: number;
}

export const GraficoVotacao = ({ sim, nao, abstencao, obstrucao = 0 }: GraficoVotacaoProps) => {
  const data = [
    { name: 'Sim', value: sim, color: '#10b981' },
    { name: 'Não', value: nao, color: '#ef4444' },
    { name: 'Abstenção', value: abstencao, color: '#6b7280' },
  ];

  if (obstrucao > 0) {
    data.push({ name: 'Obstrução', value: obstrucao, color: '#f59e0b' });
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [`${value} votos`, '']}
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: '1px solid #374151',
            borderRadius: '8px'
          }}
        />
        <Legend 
          wrapperStyle={{ color: '#fff' }}
          formatter={(value) => <span style={{ color: '#fff' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
