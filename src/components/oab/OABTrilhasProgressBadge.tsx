import { Clock, AlertCircle } from "lucide-react";

interface OABTrilhasProgressBadgeProps {
  status: "concluido" | "gerando" | "pendente" | "erro";
  progresso: number;
}

export const OABTrilhasProgressBadge = ({ status, progresso }: OABTrilhasProgressBadgeProps) => {
  // Concluído - não mostra nada
  if (status === "concluido") {
    return null;
  }

  // Gerando - badge discreto sem animação
  if (status === "gerando") {
    return null;
  }

  // Erro - badge vermelho
  if (status === "erro") {
    return (
      <div className="absolute top-2 right-2 z-20">
        <div className="bg-red-600/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-medium text-white">Erro</span>
        </div>
      </div>
    );
  }

  // Pendente - não mostra nada
  return null;
};
