import { motion } from "framer-motion";
import { Heart, TrendingUp, DollarSign, Pill, Stethoscope, AlertTriangle } from "lucide-react";

// Dados oficiais de Judicialização da Saúde
const DADOS_SAUDE = {
  totalProcessos: 2500000,
  crescimentoAnual: 15,
  custoEstimado: 8000000000, // R$ 8 bilhões
  percentualTotal: 3.0,
  tiposDemandas: [
    { tipo: "Medicamentos", quantidade: 1000000, percentual: 40 },
    { tipo: "Procedimentos/Cirurgias", quantidade: 625000, percentual: 25 },
    { tipo: "Leitos/Internação", quantidade: 500000, percentual: 20 },
    { tipo: "Exames", quantidade: 250000, percentual: 10 },
    { tipo: "Outros", quantidade: 125000, percentual: 5 },
  ],
  principaisRequeridos: [
    { nome: "Estados", percentual: 45 },
    { nome: "Municípios", percentual: 30 },
    { nome: "União (SUS)", percentual: 15 },
    { nome: "Planos de Saúde", percentual: 10 },
  ],
};

export function PainelSaude() {
  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `R$ ${(num / 1000000000).toFixed(0)} bi`;
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
        <Heart className="w-5 h-5 text-rose-500" />
        <div>
          <h3 className="font-semibold text-foreground">Judicialização da Saúde</h3>
          <p className="text-xs text-muted-foreground">Demandas de saúde no Judiciário</p>
        </div>
      </div>

      {/* Alerta de crescimento */}
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-rose-500" />
          <div>
            <div className="text-2xl font-bold text-foreground">+{DADOS_SAUDE.crescimentoAnual}% ao ano</div>
            <p className="text-xs text-muted-foreground">Crescimento acelerado das demandas de saúde</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Stethoscope className="w-5 h-5 text-rose-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-foreground">{formatNumber(DADOS_SAUDE.totalProcessos)}</div>
          <div className="text-xs text-muted-foreground">Processos ativos</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-foreground">{formatNumber(DADOS_SAUDE.custoEstimado)}</div>
          <div className="text-xs text-muted-foreground">Custo/ano</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Pill className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-foreground">{DADOS_SAUDE.percentualTotal}%</div>
          <div className="text-xs text-muted-foreground">Do total</div>
        </div>
      </div>

      {/* Tipos de demandas */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Tipos de demandas</h4>
        {DADOS_SAUDE.tiposDemandas.map((item, index) => (
          <motion.div
            key={item.tipo}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-1"
          >
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.tipo}</span>
              <span className="font-medium text-foreground">{item.percentual}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percentual}%` }}
                transition={{ duration: 0.8, delay: index * 0.05 }}
                className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Requeridos */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Principais requeridos</h4>
        <div className="flex flex-wrap gap-2">
          {DADOS_SAUDE.principaisRequeridos.map((item, index) => (
            <motion.div
              key={item.nome}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-muted rounded-full px-3 py-1 text-xs"
            >
              <span className="text-foreground font-medium">{item.nome}</span>
              <span className="text-muted-foreground ml-1">({item.percentual}%)</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Medicamentos representam 40% das demandas. O custo da judicialização da saúde 
          cresceu 130% nos últimos 5 anos.
        </p>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Fonte: CNJ - Painel de Direito à Saúde
      </div>
    </motion.div>
  );
}
