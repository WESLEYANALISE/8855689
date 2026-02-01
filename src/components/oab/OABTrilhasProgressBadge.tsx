import { Clock, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OABTrilhasProgressBadgeProps {
  status: "concluido" | "gerando" | "pendente" | "erro" | "na_fila";
  progresso: number;
  posicaoFila?: number;
}

export const OABTrilhasProgressBadge = ({ status, progresso, posicaoFila }: OABTrilhasProgressBadgeProps) => {
  // Concluído - não mostra nada
  if (status === "concluido") {
    return null;
  }

  // Gerando - badge com barra de progresso e porcentagem
  if (status === "gerando") {
    return (
      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="bg-black/80 backdrop-blur-sm px-3 py-1.5 flex items-center gap-2">
          <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
          <Progress 
            value={progresso} 
            className="h-1 flex-1 bg-white/20 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500" 
          />
          <span className="text-xs font-medium text-amber-400 min-w-[32px] text-right">{progresso}%</span>
        </div>
      </div>
    );
  }

  // Na fila - mostra posição
  if (status === "na_fila" && posicaoFila) {
    return (
      <div className="absolute top-2 right-2 z-20">
        <div className="bg-blue-600/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-medium text-white">#{posicaoFila}</span>
        </div>
      </div>
    );
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
