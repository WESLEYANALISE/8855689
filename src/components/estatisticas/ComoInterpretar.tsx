import { motion } from "framer-motion";
import { HelpCircle, BarChart3, PieChart, TrendingUp, Users, Map } from "lucide-react";

const DICAS_INTERPRETACAO = [
  {
    icone: BarChart3,
    titulo: "Gráficos de Barras (Tribunais)",
    dicas: [
      "Barras maiores = mais processos = maior demanda",
      "Compare tribunais do mesmo tipo (estaduais com estaduais)",
      "TJSP sempre será o maior devido à população de SP",
      "Tribunais menores podem ser mais eficientes proporcionalmente"
    ]
  },
  {
    icone: PieChart,
    titulo: "Gráficos de Pizza (Assuntos)",
    dicas: [
      "Cada fatia representa um tipo de demanda judicial",
      "Direito Civil e Consumidor dominam os tribunais estaduais",
      "Processos trabalhistas estão em varas específicas",
      "Fatias pequenas podem ter impacto social grande (ex: violência doméstica)"
    ]
  },
  {
    icone: TrendingUp,
    titulo: "Gráficos de Tendência",
    dicas: [
      "Linha vermelha = novos processos entrando",
      "Linha verde = processos finalizados",
      "Ideal: linha verde acima da vermelha (reduzindo acervo)",
      "Picos podem indicar eventos específicos (ex: reforma trabalhista)"
    ]
  },
  {
    icone: Users,
    titulo: "Grandes Litigantes",
    dicas: [
      "Mostra quem mais aparece como parte em processos",
      "INSS lidera por causa da previdência social",
      "Bancos aparecem muito por questões de consumidor",
      "Entes públicos têm muitas causas tributárias e administrativas"
    ]
  },
  {
    icone: Map,
    titulo: "Mapa por Estado",
    dicas: [
      "Cores mais escuras = maior volume de processos",
      "SP e RJ concentram grande parte das demandas",
      "Proporção per capita pode ser mais reveladora que total",
      "Estados do Norte têm menos processos mas também menos acesso"
    ]
  }
];

const METRICAS_IMPORTANTES = [
  {
    metrica: "Taxa de Congestionamento",
    boa: "< 65%",
    regular: "65-75%",
    ruim: "> 75%",
    interpretacao: "Quanto menor, melhor. Indica processos resolvidos vs acumulados."
  },
  {
    metrica: "IAD",
    boa: "> 100%",
    regular: "95-100%",
    ruim: "< 95%",
    interpretacao: "Acima de 100% significa que está baixando mais do que entra."
  },
  {
    metrica: "Tempo Médio",
    boa: "< 2 anos",
    regular: "2-4 anos",
    ruim: "> 4 anos",
    interpretacao: "Varia muito por tipo de processo. Execução fiscal é a mais lenta."
  }
];

export function ComoInterpretar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <HelpCircle className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Como Interpretar os Dados</h3>
          <p className="text-xs text-muted-foreground">Dicas para entender as estatísticas</p>
        </div>
      </div>

      {/* Dicas por tipo de gráfico */}
      <div className="space-y-4">
        {DICAS_INTERPRETACAO.map((item, index) => (
          <motion.div
            key={item.titulo}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icone className="w-4 h-4 text-primary" />
              <h4 className="font-medium text-sm text-foreground">{item.titulo}</h4>
            </div>
            <ul className="space-y-1">
              {item.dicas.map((dica, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {dica}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Tabela de métricas */}
      <div className="bg-card border border-border rounded-lg p-3">
        <h4 className="font-medium text-sm text-foreground mb-3">📊 Referência de Métricas</h4>
        <div className="space-y-3">
          {METRICAS_IMPORTANTES.map((m) => (
            <div key={m.metrica} className="text-xs">
              <div className="font-medium text-foreground mb-1">{m.metrica}</div>
              <div className="flex gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-500">
                  Bom: {m.boa}
                </span>
                <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
                  Regular: {m.regular}
                </span>
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500">
                  Ruim: {m.ruim}
                </span>
              </div>
              <p className="text-muted-foreground">{m.interpretacao}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dica geral */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-blue-300 leading-relaxed">
          💡 <strong>Dica:</strong> Sempre considere o contexto! Um tribunal com muitos processos não é necessariamente ineficiente - pode simplesmente atender uma população maior. Compare sempre taxas e proporções, não apenas números absolutos.
        </p>
      </div>
    </motion.div>
  );
}
