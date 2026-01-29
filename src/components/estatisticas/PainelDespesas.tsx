import { motion } from "framer-motion";
import { DollarSign, TrendingDown, Wallet, Calculator, PiggyBank } from "lucide-react";

// Dados oficiais do Justiça em Números 2025
const DADOS_DESPESAS = {
  despesaTotal: 104000000000, // R$ 104 bilhões
  despesaPorProcesso: 1239,
  despesaPorHabitante: 494,
  percentualPIB: 1.2,
  despesaPessoal: 91000000000, // R$ 91 bi
  percentualPessoal: 87.5,
  receitasArrecadadas: 48000000000, // R$ 48 bi
  taxaRetorno: 46.2,
  custasJudiciais: 15000000000, // R$ 15 bi
};

export function PainelDespesas() {
  const formatMoeda = (valor: number) => {
    if (valor >= 1000000000) return `R$ ${(valor / 1000000000).toFixed(1)} bi`;
    if (valor >= 1000000) return `R$ ${(valor / 1000000).toFixed(1)} mi`;
    return `R$ ${valor.toLocaleString("pt-BR")}`;
  };

  const cards = [
    {
      titulo: "Despesa Total",
      valor: formatMoeda(DADOS_DESPESAS.despesaTotal),
      subtitulo: `${DADOS_DESPESAS.percentualPIB}% do PIB`,
      icone: <DollarSign className="w-5 h-5" />,
      cor: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      titulo: "Por Processo",
      valor: `R$ ${DADOS_DESPESAS.despesaPorProcesso.toLocaleString("pt-BR")}`,
      subtitulo: "Custo médio",
      icone: <Calculator className="w-5 h-5" />,
      cor: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      titulo: "Por Habitante",
      valor: `R$ ${DADOS_DESPESAS.despesaPorHabitante}`,
      subtitulo: "Custo per capita",
      icone: <Wallet className="w-5 h-5" />,
      cor: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      titulo: "Receitas",
      valor: formatMoeda(DADOS_DESPESAS.receitasArrecadadas),
      subtitulo: `${DADOS_DESPESAS.taxaRetorno}% de retorno`,
      icone: <PiggyBank className="w-5 h-5" />,
      cor: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 shadow-lg space-y-4"
    >
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-green-500" />
        <div>
          <h3 className="font-semibold text-foreground">Despesas e Receitas</h3>
          <p className="text-xs text-muted-foreground">Custos do Poder Judiciário</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.titulo}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${card.bg} rounded-lg p-3 border border-border/50`}
          >
            <div className={`${card.cor} mb-2`}>{card.icone}</div>
            <div className="text-xl font-bold text-foreground">{card.valor}</div>
            <div className="text-sm font-medium text-foreground">{card.titulo}</div>
            <div className="text-xs text-muted-foreground">{card.subtitulo}</div>
          </motion.div>
        ))}
      </div>

      {/* Barra de distribuição */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Distribuição de Despesas</span>
          <span className="font-medium text-foreground">{DADOS_DESPESAS.percentualPessoal}% Pessoal</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${DADOS_DESPESAS.percentualPessoal}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Pessoal: {formatMoeda(DADOS_DESPESAS.despesaPessoal)}</span>
          <span>Custas: {formatMoeda(DADOS_DESPESAS.custasJudiciais)}</span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center pt-2">
        Fonte: CNJ - Justiça em Números 2025
      </div>
    </motion.div>
  );
}
