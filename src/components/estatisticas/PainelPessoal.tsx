import { Users, UserCheck, Briefcase, TrendingUp } from "lucide-react";

// Dados oficiais do Justiça em Números 2025
const DADOS_PESSOAL = {
  magistrados: 18700,
  magistradosPor100mil: 8.9,
  servidores: 260000,
  auxiliares: 80000,
  produtividadeMagistrado: 1847,
  cargosVagos: 2300,
  percentualVagas: 12.3,
  taxaCrescimento: 1.2,
};

export function PainelPessoal() {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString("pt-BR");
  };

  const cards = [
    {
      titulo: "Magistrados",
      valor: DADOS_PESSOAL.magistrados,
      subtitulo: `${DADOS_PESSOAL.magistradosPor100mil}/100 mil hab.`,
      icone: <UserCheck className="w-5 h-5" />,
      cor: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      titulo: "Servidores",
      valor: DADOS_PESSOAL.servidores,
      subtitulo: "Servidores efetivos",
      icone: <Users className="w-5 h-5" />,
      cor: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      titulo: "Auxiliares",
      valor: DADOS_PESSOAL.auxiliares,
      subtitulo: "Terceirizados e estagiários",
      icone: <Briefcase className="w-5 h-5" />,
      cor: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      titulo: "Produtividade",
      valor: DADOS_PESSOAL.produtividadeMagistrado,
      subtitulo: "Processos/magistrado/ano",
      icone: <TrendingUp className="w-5 h-5" />,
      cor: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-lg space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-purple-500" />
        <div>
          <h3 className="font-semibold text-foreground">Dados de Pessoal</h3>
          <p className="text-xs text-muted-foreground">Recursos humanos do Poder Judiciário</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, index) => (
          <div
            key={card.titulo}
            className={`${card.bg} rounded-lg p-3 border border-border/50 animate-fade-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`${card.cor} mb-2`}>{card.icone}</div>
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(card.valor)}
            </div>
            <div className="text-sm font-medium text-foreground">{card.titulo}</div>
            <div className="text-xs text-muted-foreground">{card.subtitulo}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
        <div className="text-center">
          <div className="text-xl font-bold text-red-500">{formatNumber(DADOS_PESSOAL.cargosVagos)}</div>
          <div className="text-xs text-muted-foreground">Cargos vagos ({DADOS_PESSOAL.percentualVagas}%)</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-500">+{DADOS_PESSOAL.taxaCrescimento}%</div>
          <div className="text-xs text-muted-foreground">Crescimento anual</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center pt-2">
        Fonte: CNJ - Justiça em Números 2025
      </div>
    </div>
  );
}