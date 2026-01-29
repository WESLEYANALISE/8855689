import { motion } from "framer-motion";
import { Check, Lock, Play } from "lucide-react";

interface JornadaDiaCardProps {
  dia: number;
  completo: boolean;
  atual: boolean;
  bloqueado?: boolean;
  onClick: () => void;
}

export const JornadaDiaCard = ({ 
  dia, 
  completo, 
  atual, 
  bloqueado = false,
  onClick 
}: JornadaDiaCardProps) => {
  const getStatus = () => {
    if (completo) return "completo";
    if (atual) return "atual";
    if (bloqueado) return "bloqueado";
    return "pendente";
  };

  const status = getStatus();

  const statusStyles = {
    completo: "bg-green-500 border-green-400 shadow-green-500/30",
    atual: "bg-primary border-primary shadow-primary/50 ring-4 ring-primary/20",
    pendente: "bg-muted border-border hover:border-primary/50",
    bloqueado: "bg-muted/50 border-border/50 opacity-50 cursor-not-allowed"
  };

  const iconMap = {
    completo: <Check className="w-4 h-4 text-white" />,
    atual: <Play className="w-3 h-3 text-primary-foreground fill-current" />,
    pendente: <span className="text-xs font-medium text-muted-foreground">{dia}</span>,
    bloqueado: <Lock className="w-3 h-3 text-muted-foreground" />
  };

  return (
    <motion.button
      onClick={bloqueado ? undefined : onClick}
      className={`
        relative w-10 h-10 rounded-full border-2 flex items-center justify-center
        transition-all duration-200 shadow-lg
        ${statusStyles[status]}
        ${!bloqueado && "cursor-pointer hover:scale-110"}
      `}
      whileHover={!bloqueado ? { scale: 1.15 } : undefined}
      whileTap={!bloqueado ? { scale: 0.95 } : undefined}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {iconMap[status]}
      
      {/* Pegada visual (efeito) */}
      {atual && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/30"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
};
