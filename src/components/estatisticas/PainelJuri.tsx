import { motion } from "framer-motion";
import { Gavel, Users, Clock, CheckCircle2, XCircle, Scale } from "lucide-react";

// Dados oficiais do Tribunal do Júri
const DADOS_JURI = {
  totalSessoes: 45000,
  casosJulgados: 38000,
  tempoMedio: 3.8, // anos até julgamento
  taxaCondenacao: 78,
  taxaAbsolvicao: 22,
  juradosConvocados: 540000,
  comparecimento: 65,
  tiposCrimes: [
    { tipo: "Homicídio doloso", quantidade: 28000, percentual: 73.7 },
    { tipo: "Tentativa de homicídio", quantidade: 6500, percentual: 17.1 },
    { tipo: "Feminicídio", quantidade: 2000, percentual: 5.3 },
    { tipo: "Infanticídio", quantidade: 500, percentual: 1.3 },
    { tipo: "Outros", quantidade: 1000, percentual: 2.6 },
  ],
};

export function PainelJuri() {
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
        <Gavel className="w-5 h-5 text-slate-500" />
        <div>
          <h3 className="font-semibold text-foreground">Tribunal do Júri</h3>
          <p className="text-xs text-muted-foreground">Crimes dolosos contra a vida</p>
        </div>
      </div>

      {/* Taxa de condenação/absolvição */}
      <div className="flex gap-3">
        <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
          <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-foreground">{DADOS_JURI.taxaCondenacao}%</div>
          <div className="text-xs text-muted-foreground">Condenações</div>
        </div>
        <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-foreground">{DADOS_JURI.taxaAbsolvicao}%</div>
          <div className="text-xs text-muted-foreground">Absolvições</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Scale className="w-4 h-4 text-slate-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-foreground">{formatNumber(DADOS_JURI.totalSessoes)}</div>
          <div className="text-xs text-muted-foreground">Sessões/ano</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Gavel className="w-4 h-4 text-slate-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-foreground">{formatNumber(DADOS_JURI.casosJulgados)}</div>
          <div className="text-xs text-muted-foreground">Casos julgados</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Clock className="w-4 h-4 text-slate-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-foreground">{DADOS_JURI.tempoMedio} anos</div>
          <div className="text-xs text-muted-foreground">Tempo médio</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Users className="w-4 h-4 text-slate-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-foreground">{formatNumber(DADOS_JURI.juradosConvocados)}</div>
          <div className="text-xs text-muted-foreground">Jurados/ano</div>
        </div>
      </div>

      {/* Tipos de crimes */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Crimes julgados</h4>
        {DADOS_JURI.tiposCrimes.map((item, index) => (
          <motion.div
            key={item.tipo}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-1"
          >
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.tipo}</span>
              <span className="font-medium text-foreground">{formatNumber(item.quantidade)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percentual}%` }}
                transition={{ duration: 0.8, delay: index * 0.05 }}
                className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between text-sm pt-2 border-t border-border">
        <div>
          <span className="text-muted-foreground">Comparecimento jurados:</span>
          <span className="font-bold text-foreground ml-1">{DADOS_JURI.comparecimento}%</span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Fonte: CNJ - Painel do Tribunal do Júri
      </div>
    </motion.div>
  );
}
