import { Clock, AlertCircle } from "lucide-react";

interface ConceitosProgressBadgeProps {
  status: "concluido" | "gerando" | "pendente" | "erro" | "na_fila";
  progresso: number;
  posicaoFila?: number;
}

export const ConceitosProgressBadge = ({ status, progresso, posicaoFila }: ConceitosProgressBadgeProps) => {
  // Concluído - não mostra nada
  if (status === "concluido") {
    return null;
  }

  // Gerando - não mostra badge (animação no card)
  if (status === "gerando") {
    return null;
  }

  // Na fila - mostra posição
  if (status === "na_fila" && posicaoFila) {
    return (
      <div className="bg-blue-600/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5 flex-shrink-0">
        <Clock className="w-3.5 h-3.5 text-white" />
        <span className="text-xs font-medium text-white">#{posicaoFila}</span>
      </div>
    );
  }

  // Erro - badge vermelho
  if (status === "erro") {
    return (
      <div className="bg-red-600/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5 flex-shrink-0">
        <AlertCircle className="w-3.5 h-3.5 text-white" />
        <span className="text-xs font-medium text-white">Erro</span>
      </div>
    );
  }

  // Pendente - não mostra nada
  return null;
};
