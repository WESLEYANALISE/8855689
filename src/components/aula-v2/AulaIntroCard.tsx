import { motion } from "framer-motion";
import { Clock, Target, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AulaIntroCardProps {
  titulo: string;
  codigoNome: string;
  tempoEstimado: string;
  objetivos: string[];
  totalSecoes: number;
  onComecar: () => void;
}

export const AulaIntroCard = ({
  titulo,
  codigoNome,
  tempoEstimado,
  objetivos,
  totalSecoes,
  onComecar
}: AulaIntroCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg">
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <BookOpen className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-foreground mb-2"
            >
              {titulo}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground"
            >
              {codigoNome}
            </motion.p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Duração</p>
              <p className="font-semibold text-foreground">{tempoEstimado}</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <Target className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Seções</p>
              <p className="font-semibold text-foreground">{totalSecoes} partes</p>
            </div>
          </motion.div>

          {/* Objectives */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              O que você vai aprender
            </h3>
            <ul className="space-y-2">
              {(objetivos || []).slice(0, 4).map((objetivo, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-start gap-3 text-foreground"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-sm">{objetivo}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <Button
              onClick={onComecar}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              Começar Aula
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
