import { motion } from "framer-motion";
import { FileText, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Secao } from "./types";

interface SecaoHeaderProps {
  secao: Secao;
  secaoIndex: number;
  totalSecoes: number;
  onComecar: () => void;
}

const tipoLabels: Record<string, string> = {
  caput: "Caput",
  inciso: "Inciso",
  paragrafo: "Parágrafo",
  alinea: "Alínea",
  item: "Item"
};

export const SecaoHeader = ({
  secao,
  secaoIndex,
  totalSecoes,
  onComecar
}: SecaoHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg text-center">
        {/* Section indicator */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6"
        >
          <BookOpen className="w-4 h-4" />
          Seção {secaoIndex + 1} de {totalSecoes}
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl"
        >
          {/* Section type badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm text-muted-foreground mb-4">
            <FileText className="w-4 h-4" />
            {tipoLabels[secao.tipo] || secao.tipo}
          </div>

          {/* Title */}
          {secao.titulo && (
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
              {secao.titulo}
            </h2>
          )}

          {/* Original text preview */}
          <div className="bg-secondary/50 border border-border rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-muted-foreground mb-2">Texto original:</p>
            <p className="text-foreground leading-relaxed italic">
              "{secao.trechoOriginal.length > 200 
                ? secao.trechoOriginal.substring(0, 200) + '...' 
                : secao.trechoOriginal}"
            </p>
          </div>

          {/* Slides count */}
          <p className="text-muted-foreground mb-6">
            {secao.slides.length} etapas de aprendizado nesta seção
          </p>

          {/* Start button */}
          <Button
            onClick={onComecar}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg rounded-xl"
          >
            Estudar esta seção
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
