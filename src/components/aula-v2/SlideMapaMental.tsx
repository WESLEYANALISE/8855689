import { motion } from "framer-motion";
import { Network, ArrowRight } from "lucide-react";
import { ConceitoMental } from "./types";

interface SlideMapaMentalProps {
  conceitos: ConceitoMental[];
  titulo?: string;
  conteudo?: string;
}

export const SlideMapaMental = ({ conceitos, titulo, conteudo }: SlideMapaMentalProps) => {
  if (!conceitos || conceitos.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Mapa mental não disponível
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Intro text if provided */}
      {conteudo && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-foreground leading-relaxed"
        >
          {conteudo}
        </motion.p>
      )}
      
      {/* Concepts map */}
      {conceitos.map((conceito, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + idx * 0.1 }}
          className="space-y-3"
        >
          {/* Central concept */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/40 shadow-lg shadow-green-500/10">
              <Network className="w-5 h-5 text-green-400" />
              <span className="font-bold text-foreground text-lg">{conceito.central}</span>
            </div>
          </div>
          
          {/* Related concepts */}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {conceito.relacionados.map((relacionado, relIdx) => (
              <motion.div
                key={relIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 + relIdx * 0.05 }}
                className="relative group"
              >
                {/* Connection line visual */}
                <div className="absolute -top-2 left-1/2 w-0.5 h-2 bg-green-500/30" />
                
                {/* Related concept card */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-green-500/40 hover:bg-green-500/5 transition-all cursor-default">
                  <ArrowRight className="w-3 h-3 text-green-400" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {relacionado}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
      
      {/* Map indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 pt-2 text-muted-foreground justify-center"
      >
        <Network className="w-4 h-4 text-green-400" />
        <span className="text-xs">Conexões com outros conceitos jurídicos</span>
      </motion.div>
    </div>
  );
};
