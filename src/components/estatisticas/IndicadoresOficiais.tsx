import { motion } from "framer-motion";
import { 
  Scale, 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BarChart3
} from "lucide-react";

interface IndicadoresOficiaisProps {
  data: {
    totalProcessos: number;
    processosNovos: number;
    processosBaixados: number;
    processosPendentes: number;
    taxaCongestionamento: number;
    tempoMedioTramitacao: number;
    magistrados: number;
    servidores: number;
    despesaTotal: number;
    custoProcesso: number;
    indiceAtendimentoDemanda: number;
  };
}

export function IndicadoresOficiais({ data }: IndicadoresOficiaisProps) {
  const formatarNumero = (num: number): string => {
    if (num >= 1000000000) return `R$ ${(num / 1000000000).toFixed(0)} bi`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString("pt-BR");
  };

  const indicadores = [
    {
      titulo: 'Taxa de Congestionamento',
      valor: `${data.taxaCongestionamento}%`,
      descricao: 'Processos não baixados',
      icone: AlertCircle,
      cor: data.taxaCongestionamento > 70 ? 'text-red-500' : 'text-yellow-500',
      bgCor: data.taxaCongestionamento > 70 ? 'bg-red-500/10' : 'bg-yellow-500/10',
    },
    {
      titulo: 'Índice de Atendimento',
      valor: `${data.indiceAtendimentoDemanda}%`,
      descricao: 'Baixados/Novos',
      icone: CheckCircle2,
      cor: data.indiceAtendimentoDemanda > 100 ? 'text-green-500' : 'text-yellow-500',
      bgCor: data.indiceAtendimentoDemanda > 100 ? 'bg-green-500/10' : 'bg-yellow-500/10',
    },
    {
      titulo: 'Tempo Médio',
      valor: `${data.tempoMedioTramitacao} anos`,
      descricao: 'De tramitação',
      icone: Clock,
      cor: 'text-blue-500',
      bgCor: 'bg-blue-500/10',
    },
    {
      titulo: 'Custo por Processo',
      valor: `R$ ${data.custoProcesso}`,
      descricao: 'Média nacional',
      icone: DollarSign,
      cor: 'text-purple-500',
      bgCor: 'bg-purple-500/10',
    },
    {
      titulo: 'Magistrados',
      valor: formatarNumero(data.magistrados),
      descricao: 'Em atividade',
      icone: Scale,
      cor: 'text-primary',
      bgCor: 'bg-primary/10',
    },
    {
      titulo: 'Servidores',
      valor: formatarNumero(data.servidores),
      descricao: 'Do Judiciário',
      icone: Users,
      cor: 'text-cyan-500',
      bgCor: 'bg-cyan-500/10',
    },
    {
      titulo: 'Despesa Total',
      valor: formatarNumero(data.despesaTotal),
      descricao: 'Orçamento anual',
      icone: BarChart3,
      cor: 'text-orange-500',
      bgCor: 'bg-orange-500/10',
    },
    {
      titulo: 'Processos/Magistrado',
      valor: formatarNumero(Math.round(data.processosPendentes / data.magistrados)),
      descricao: 'Carga de trabalho',
      icone: TrendingUp,
      cor: 'text-rose-500',
      bgCor: 'bg-rose-500/10',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold text-foreground">Indicadores Oficiais</h3>
          <p className="text-xs text-muted-foreground">Justiça em Números 2025 (ano-base 2024)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {indicadores.map((indicador, index) => (
          <motion.div
            key={indicador.titulo}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors"
          >
            <div className={`w-8 h-8 rounded-lg ${indicador.bgCor} flex items-center justify-center mb-2`}>
              <indicador.icone className={`w-4 h-4 ${indicador.cor}`} />
            </div>
            <p className="text-lg font-bold text-foreground">{indicador.valor}</p>
            <p className="text-xs text-muted-foreground">{indicador.titulo}</p>
            <p className="text-[10px] text-muted-foreground/70">{indicador.descricao}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
        <span>Fonte: CNJ - Justiça em Números 2025</span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          Dados oficiais
        </span>
      </div>
    </motion.div>
  );
}
