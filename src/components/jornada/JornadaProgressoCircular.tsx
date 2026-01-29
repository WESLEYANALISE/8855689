import { motion } from "framer-motion";

interface JornadaProgressoCircularProps {
  diaAtual: number;
  totalDias: number;
  size?: number;
}

export const JornadaProgressoCircular = ({ 
  diaAtual, 
  totalDias, 
  size = 120 
}: JornadaProgressoCircularProps) => {
  const progresso = (diaAtual / totalDias) * 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progresso / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg 
        width={size} 
        height={size} 
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-2xl font-bold text-foreground"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {diaAtual}
        </motion.span>
        <span className="text-xs text-muted-foreground">de {totalDias}</span>
      </div>
    </div>
  );
};
