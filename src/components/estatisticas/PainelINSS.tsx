import { motion } from "framer-motion";
import { FileText, Clock, TrendingUp, Users, AlertCircle } from "lucide-react";

// Dados oficiais de processos INSS
const DADOS_INSS = {
  totalProcessos: 4200000,
  percentualTotal: 12.5,
  tempoMedio: 4.2, // anos
  processosNovos: 850000,
  processosBaixados: 780000,
  taxaCongestionamento: 78,
  beneficiosMaisComuns: [
    { nome: "Aposentadoria por Tempo de Contribuição", quantidade: 1200000, percentual: 28.6 },
    { nome: "Auxílio-Doença", quantidade: 950000, percentual: 22.6 },
    { nome: "Aposentadoria por Invalidez", quantidade: 780000, percentual: 18.6 },
    { nome: "BPC/LOAS", quantidade: 650000, percentual: 15.5 },
    { nome: "Pensão por Morte", quantidade: 420000, percentual: 10.0 },
    { nome: "Outros", quantidade: 200000, percentual: 4.7 },
  ],
};

export function PainelINSS() {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString("pt-BR");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 shadow-lg space-y-4"
    >
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-cyan-500" />
        <div>
          <h3 className="font-semibold text-foreground">Processos INSS</h3>
          <p className="text-xs text-muted-foreground">Demandas previdenciárias no Judiciário</p>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/30">
          <FileText className="w-5 h-5 text-cyan-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{formatNumber(DADOS_INSS.totalProcessos)}</div>
          <div className="text-sm text-foreground">Total de Processos</div>
          <div className="text-xs text-muted-foreground">{DADOS_INSS.percentualTotal}% do total nacional</div>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
          <Clock className="w-5 h-5 text-blue-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{DADOS_INSS.tempoMedio} anos</div>
          <div className="text-sm text-foreground">Tempo Médio</div>
          <div className="text-xs text-muted-foreground">Para julgamento</div>
        </div>
        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{formatNumber(DADOS_INSS.processosNovos)}</div>
          <div className="text-sm text-foreground">Novos/Ano</div>
          <div className="text-xs text-muted-foreground">Distribuídos</div>
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
          <AlertCircle className="w-5 h-5 text-yellow-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{DADOS_INSS.taxaCongestionamento}%</div>
          <div className="text-sm text-foreground">Congestionamento</div>
          <div className="text-xs text-muted-foreground">Taxa atual</div>
        </div>
      </div>

      {/* Tipos de benefícios */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Benefícios mais demandados</h4>
        {DADOS_INSS.beneficiosMaisComuns.map((beneficio, index) => (
          <motion.div
            key={beneficio.nome}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-1"
          >
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground truncate max-w-[200px]">{beneficio.nome}</span>
              <span className="font-medium text-foreground">{formatNumber(beneficio.quantidade)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${beneficio.percentual}%` }}
                transition={{ duration: 0.8, delay: index * 0.05 }}
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground text-center pt-2">
        Fonte: CNJ - Painel de Demandas Repetitivas e INSS
      </div>
    </motion.div>
  );
}
