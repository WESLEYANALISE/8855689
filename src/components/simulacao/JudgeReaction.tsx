import { CheckCircle, AlertCircle, MinusCircle, Sparkles } from "lucide-react";

interface JudgeReactionProps {
  tipo: "aprovacao" | "duvida" | "desaprovacao" | "imparcial" | "excelente";
  texto: string;
}

export const JudgeReaction = ({ tipo, texto }: JudgeReactionProps) => {
  const config = {
    aprovacao: {
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/30"
    },
    duvida: {
      icon: AlertCircle,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30"
    },
    desaprovacao: {
      icon: AlertCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30"
    },
    imparcial: {
      icon: MinusCircle,
      color: "text-gray-400",
      bg: "bg-gray-500/10",
      border: "border-gray-500/30"
    },
    excelente: {
      icon: Sparkles,
      color: "text-amber-400",
      bg: "bg-amber-500/20",
      border: "border-amber-500/50"
    }
  };

  const { icon: Icon, color, bg, border } = config[tipo];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bg} border ${border} animate-scale-in`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-sm italic ${color}`}>{texto}</span>
    </div>
  );
};
