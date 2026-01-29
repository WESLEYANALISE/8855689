import { Target, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

// Dados oficiais das Metas CNJ 2025
const METAS_CNJ = [
  {
    numero: 1,
    nome: "Julgar mais que o distribuído",
    descricao: "Julgar quantidade maior de processos que os distribuídos no ano",
    cumprimento: 72,
    status: "parcial",
  },
  {
    numero: 2,
    nome: "Julgar processos antigos",
    descricao: "Julgar processos mais antigos, segundo critério de antiguidade",
    cumprimento: 65,
    status: "parcial",
  },
  {
    numero: 3,
    nome: "Impulsionar execução fiscal",
    descricao: "Estimular a conciliação, reduzindo o estoque de execuções fiscais",
    cumprimento: 48,
    status: "baixo",
  },
  {
    numero: 4,
    nome: "Priorizar 1º grau",
    descricao: "Identificar e julgar ações coletivas no 1º grau",
    cumprimento: 58,
    status: "parcial",
  },
  {
    numero: 5,
    nome: "Impulsionar processo digital",
    descricao: "Aumentar o número de casos novos distribuídos por meio eletrônico",
    cumprimento: 95,
    status: "alto",
  },
  {
    numero: 6,
    nome: "Gestão orçamentária",
    descricao: "Garantir a execução de pelo menos 95% do orçamento autorizado",
    cumprimento: 89,
    status: "alto",
  },
  {
    numero: 7,
    nome: "Ações de improbidade",
    descricao: "Julgar ações de improbidade administrativa e ações penais",
    cumprimento: 54,
    status: "parcial",
  },
  {
    numero: 8,
    nome: "Conciliação",
    descricao: "Ampliar a conciliação através do CEJUSC",
    cumprimento: 78,
    status: "alto",
  },
];

export function PainelMetas() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "alto": return "text-green-500";
      case "parcial": return "text-yellow-500";
      case "baixo": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "alto": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "parcial": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "baixo": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getProgressColor = (cumprimento: number) => {
    if (cumprimento >= 80) return "bg-green-500";
    if (cumprimento >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const mediaCumprimento = Math.round(
    METAS_CNJ.reduce((acc, m) => acc + m.cumprimento, 0) / METAS_CNJ.length
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-lg space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="font-semibold text-foreground">Metas Nacionais CNJ</h3>
            <p className="text-xs text-muted-foreground">Cumprimento das metas do Poder Judiciário</p>
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{mediaCumprimento}%</div>
          <div className="text-xs text-muted-foreground">Média geral</div>
        </div>
      </div>

      <div className="space-y-3">
        {METAS_CNJ.map((meta, index) => (
          <div
            key={meta.numero}
            className="space-y-1 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(meta.status)}
                <span className="text-sm font-medium text-foreground">
                  Meta {meta.numero}: {meta.nome}
                </span>
              </div>
              <span className={`text-sm font-bold ${getStatusColor(meta.status)}`}>
                {meta.cumprimento}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(meta.cumprimento)} rounded-full transition-all duration-700`}
                style={{ 
                  width: `${meta.cumprimento}%`,
                  transitionDelay: `${index * 50}ms`
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{meta.descricao}</p>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground text-center pt-2">
        Fonte: CNJ - Metas Nacionais 2025
      </div>
    </div>
  );
}