import { useState, useEffect } from 'react';

export interface EvolucaoGastosData {
  mes: string; // "Jan/24", "Fev/24"
  mesNumero: number;
  ano: number;
  valor: number;
}

interface UseEvolucaoGastosResult {
  dados: EvolucaoGastosData[];
  isLoading: boolean;
  totalPeriodo: number;
  mediaMensal: number;
}

const SUPABASE_URL = "https://uxnibmtmjpyqhzzxtvhw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bmlibXRtanB5cWh6enh0dmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NTg4NjUsImV4cCI6MjA1MDEzNDg2NX0.b3xP0IpNB5WNobXoRYNVFhPpfU99LDQcnUqxYRwbaRw";

export function useEvolucaoGastos(
  politicoId: number | string,
  tipo: 'deputado' | 'senador' = 'deputado'
): UseEvolucaoGastosResult {
  const [dados, setDados] = useState<EvolucaoGastosData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const carregarEvolucao = async () => {
      setIsLoading(true);
      
      try {
        const tabela = tipo === 'deputado' ? 'ranking_despesas' : 'ranking_despesas_senado';
        const campoId = tipo === 'deputado' ? 'deputado_id' : 'senador_id';

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/${tabela}?${campoId}=eq.${politicoId}&select=mes,ano,total_gasto&order=ano.asc,mes.asc`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            }
          }
        );

        if (!response.ok) throw new Error('Erro ao buscar dados');
        const data = await response.json();

        const mesesNome = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        const evolucao: EvolucaoGastosData[] = (data || []).map((item: any) => ({
          mes: `${mesesNome[item.mes - 1]}/${String(item.ano).slice(-2)}`,
          mesNumero: item.mes,
          ano: item.ano,
          valor: item.total_gasto || 0,
        }));

        // Ordenar e pegar últimos 12 meses
        const ultimos12 = evolucao.slice(-12);
        setDados(ultimos12);
      } catch (error) {
        console.error('Erro ao carregar evolução de gastos:', error);
        setDados([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (politicoId) {
      carregarEvolucao();
    }
  }, [politicoId, tipo]);

  const totalPeriodo = dados.reduce((sum, d) => sum + d.valor, 0);
  const mediaMensal = dados.length > 0 ? totalPeriodo / dados.length : 0;

  return { dados, isLoading, totalPeriodo, mediaMensal };
}
