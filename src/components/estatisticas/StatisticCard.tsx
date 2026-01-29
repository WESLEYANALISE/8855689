import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, HelpCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatisticCardProps {
  titulo: string;
  valor: number;
  formato?: "numero" | "percentual" | "moeda";
  icone: React.ReactNode;
  cor?: string;
  tendencia?: "alta" | "baixa" | "estavel";
  variacao?: number;
  descricao?: string;
  index?: number;
  onExplicar?: () => void;
  carregando?: boolean;
}

export function StatisticCard({
  titulo,
  valor,
  formato = "numero",
  icone,
  cor = "primary",
  tendencia,
  variacao,
  descricao,
  index = 0,
  onExplicar,
  carregando,
}: StatisticCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animação de contagem progressiva
  useEffect(() => {
    if (carregando) return;
    
    const duration = 1500;
    const steps = 60;
    const increment = valor / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= valor) {
        setDisplayValue(valor);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [valor, carregando]);

  const formatarValor = (num: number): string => {
    switch (formato) {
      case "percentual":
        return `${num.toFixed(1)}%`;
      case "moeda":
        return num.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
      default:
        if (num >= 1000000) {
          return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
          return `${(num / 1000).toFixed(0)}K`;
        }
        return num.toLocaleString("pt-BR");
    }
  };

  const getTrendIcon = () => {
    switch (tendencia) {
      case "alta":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "baixa":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (tendencia) {
      case "alta":
        return "text-green-500";
      case "baixa":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative overflow-hidden"
    >
      <div className="bg-card border border-border rounded-xl p-4 h-full shadow-lg hover:shadow-xl transition-shadow">
        {/* Gradient overlay */}
        <div 
          className="absolute top-0 right-0 w-24 h-24 opacity-10 blur-2xl rounded-full"
          style={{ background: `hsl(var(--${cor}))` }}
        />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            "p-2.5 rounded-lg bg-gradient-to-br",
            cor === "primary" && "from-primary/20 to-primary/5",
            cor === "blue" && "from-blue-500/20 to-blue-500/5",
            cor === "green" && "from-green-500/20 to-green-500/5",
            cor === "yellow" && "from-yellow-500/20 to-yellow-500/5",
            cor === "purple" && "from-purple-500/20 to-purple-500/5",
          )}>
            {icone}
          </div>
          
          {onExplicar && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={onExplicar}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Título */}
        <p className="text-sm text-muted-foreground font-medium mb-1">
          {titulo}
        </p>

        {/* Valor */}
        <div className="flex items-end gap-2">
          {carregando ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          ) : (
            <motion.span 
              className="text-2xl md:text-3xl font-bold text-foreground"
              key={displayValue}
            >
              {formatarValor(displayValue)}
            </motion.span>
          )}
          
          {tendencia && variacao !== undefined && !carregando && (
            <div className={cn("flex items-center gap-1 text-sm mb-1", getTrendColor())}>
              {getTrendIcon()}
              <span>{variacao > 0 ? "+" : ""}{variacao}%</span>
            </div>
          )}
        </div>

        {/* Descrição */}
        {descricao && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {descricao}
          </p>
        )}
      </div>
    </motion.div>
  );
}
