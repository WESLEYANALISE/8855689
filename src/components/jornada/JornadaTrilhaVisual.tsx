import { motion } from "framer-motion";
import { JornadaDiaCard } from "./JornadaDiaCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface JornadaTrilhaVisualProps {
  diaAtual: number;
  diasCompletos: number[];
  totalDias: number;
  onDiaClick: (dia: number) => void;
}

export const JornadaTrilhaVisual = ({ 
  diaAtual, 
  diasCompletos, 
  totalDias,
  onDiaClick 
}: JornadaTrilhaVisualProps) => {
  const diasPorSemana = 7;
  const totalSemanas = Math.ceil(totalDias / diasPorSemana);
  
  // Calcular semana atual baseada no dia atual
  const semanaAtual = Math.ceil(diaAtual / diasPorSemana);
  const [semanaVisivel, setSemanaVisivel] = useState(semanaAtual);

  const diasDaSemana = () => {
    const inicio = (semanaVisivel - 1) * diasPorSemana + 1;
    const fim = Math.min(semanaVisivel * diasPorSemana, totalDias);
    return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
  };

  const dias = diasDaSemana();
  const isInvertido = semanaVisivel % 2 === 0;

  return (
    <div className="space-y-4">
      {/* Navegação de semanas */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSemanaVisivel(s => Math.max(1, s - 1))}
          disabled={semanaVisivel === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        
        <span className="text-sm font-medium text-muted-foreground">
          Semana {semanaVisivel} de {totalSemanas}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSemanaVisivel(s => Math.min(totalSemanas, s + 1))}
          disabled={semanaVisivel === totalSemanas}
        >
          Próxima
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Trilha visual em serpentina */}
      <div className="relative py-8 px-4">
        {/* Linha conectora */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          <motion.path
            d={isInvertido 
              ? `M ${dias.length * 50 - 25} 50 ${dias.map((_, i) => `L ${(dias.length - 1 - i) * 50 + 25} 50`).join(' ')}`
              : `M 25 50 ${dias.map((_, i) => `L ${i * 50 + 25} 50`).join(' ')}`
            }
            stroke="hsl(var(--muted-foreground) / 0.3)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="8 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
        </svg>

        {/* Cards dos dias */}
        <div 
          className={`flex gap-3 justify-center flex-wrap ${isInvertido ? 'flex-row-reverse' : ''}`}
        >
          {dias.map((dia, index) => (
            <motion.div
              key={dia}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center gap-1"
            >
              <JornadaDiaCard
                dia={dia}
                completo={diasCompletos.includes(dia)}
                atual={dia === diaAtual}
                bloqueado={dia > diaAtual + 1}
                onClick={() => onDiaClick(dia)}
              />
              <span className="text-xs text-muted-foreground">
                Dia {dia}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Indicador de progresso da semana */}
      <div className="flex justify-center gap-1">
        {Array.from({ length: Math.min(10, totalSemanas) }, (_, i) => {
          const semana = Math.floor((semanaVisivel - 1) / 10) * 10 + i + 1;
          if (semana > totalSemanas) return null;
          
          return (
            <button
              key={semana}
              onClick={() => setSemanaVisivel(semana)}
              className={`w-2 h-2 rounded-full transition-all ${
                semana === semanaVisivel 
                  ? "bg-primary w-4" 
                  : semana < semanaVisivel 
                    ? "bg-green-500" 
                    : "bg-muted"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
