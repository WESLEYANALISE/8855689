import { Landmark, DollarSign, TrendingDown, AlertCircle } from "lucide-react";

// Dados oficiais de Execuções Fiscais
const DADOS_FAZENDA = {
  execucoesFiscais: 28000000,
  valorTotal: 2700000000000, // R$ 2.7 trilhões
  taxaRecuperacao: 1.2,
  percentualAcervo: 35,
  tempoMedio: 8.6, // anos
  taxaCongestionamento: 89,
  distribuicaoPorEnte: [
    { ente: "União", quantidade: 8400000, valor: 1200000000000, percentual: 30 },
    { ente: "Estados", quantidade: 11200000, valor: 900000000000, percentual: 40 },
    { ente: "Municípios", quantidade: 7000000, valor: 500000000000, percentual: 25 },
    { ente: "Outros", quantidade: 1400000, valor: 100000000000, percentual: 5 },
  ],
};

export function PainelFazenda() {
  const formatNumber = (num: number) => {
    if (num >= 1000000000000) return `R$ ${(num / 1000000000000).toFixed(1)} tri`;
    if (num >= 1000000000) return `R$ ${(num / 1000000000).toFixed(0)} bi`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString("pt-BR");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-lg space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Landmark className="w-5 h-5 text-yellow-600" />
        <div>
          <h3 className="font-semibold text-foreground">Fazenda Nacional</h3>
          <p className="text-xs text-muted-foreground">Execuções fiscais e cobranças tributárias</p>
        </div>
      </div>

      {/* Destaque principal */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-600 mb-2">
          <DollarSign className="w-5 h-5" />
          <span className="text-sm font-medium">Valor Total em Cobrança</span>
        </div>
        <div className="text-3xl font-bold text-foreground">{formatNumber(DADOS_FAZENDA.valorTotal)}</div>
        <div className="flex items-center gap-2 mt-2">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <span className="text-sm text-muted-foreground">Taxa de recuperação: apenas {DADOS_FAZENDA.taxaRecuperacao}%</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{formatNumber(DADOS_FAZENDA.execucoesFiscais)}</div>
          <div className="text-xs text-muted-foreground">Processos</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{DADOS_FAZENDA.percentualAcervo}%</div>
          <div className="text-xs text-muted-foreground">Do acervo total</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{DADOS_FAZENDA.tempoMedio} anos</div>
          <div className="text-xs text-muted-foreground">Tempo médio</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-500">{DADOS_FAZENDA.taxaCongestionamento}%</div>
          <div className="text-xs text-muted-foreground">Congestionamento</div>
        </div>
      </div>

      {/* Distribuição por ente */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Por ente federativo</h4>
        {DADOS_FAZENDA.distribuicaoPorEnte.map((item) => (
          <div key={item.ente} className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-20">{item.ente}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-700"
                style={{ width: `${item.percentual}%` }}
              />
            </div>
            <span className="text-xs font-medium text-foreground w-16 text-right">{formatNumber(item.valor)}</span>
          </div>
        ))}
      </div>

      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Execuções fiscais representam {DADOS_FAZENDA.percentualAcervo}% do acervo total do Judiciário, 
          mas têm a maior taxa de congestionamento ({DADOS_FAZENDA.taxaCongestionamento}%).
        </p>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Fonte: CNJ - Painel de Execuções Fiscais
      </div>
    </div>
  );
}
