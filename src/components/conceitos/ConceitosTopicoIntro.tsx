import { motion } from "framer-motion";
import { BookOpen, Layers, Clock, Play, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calcularTempoEstimado, dividirMarkdownEmSlides } from "@/lib/markdown-to-slides";
import { useMemo } from "react";

interface ConceitosTopicoIntroProps {
  titulo: string;
  materia?: string;
  capaUrl?: string;
  paginas: Array<{ titulo: string; markdown: string; tipo?: string }>;
  onStartSlides: () => void;
  onStartReading: () => void;
}

export const ConceitosTopicoIntro = ({
  titulo,
  materia,
  capaUrl,
  paginas,
  onStartSlides,
  onStartReading
}: ConceitosTopicoIntroProps) => {
  // Calcular estatísticas
  const stats = useMemo(() => {
    const slides = dividirMarkdownEmSlides(paginas);
    const tempoEstimado = calcularTempoEstimado(slides);
    const numSecoes = paginas.length;
    const numSlides = slides.length;
    
    return { tempoEstimado, numSecoes, numSlides };
  }, [paginas]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Capa/Ícone */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mx-auto"
        >
          {capaUrl ? (
            <div className="w-40 h-40 mx-auto rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={capaUrl} 
                alt={titulo}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-40 h-40 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-xl">
              <BookOpen className="w-16 h-16 text-primary" />
            </div>
          )}
        </motion.div>
        
        {/* Título e matéria */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-2"
        >
          {materia && (
            <p className="text-xs uppercase tracking-widest text-primary font-medium">
              {materia}
            </p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {titulo}
          </h1>
        </motion.div>
        
        {/* Estatísticas */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{stats.tempoEstimado} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>{stats.numSecoes} seções</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>{stats.numSlides} slides</span>
          </div>
        </motion.div>
        
        {/* Modos de estudo */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          {/* Modo Slides - Destacado */}
          <Button
            onClick={onStartSlides}
            size="lg"
            className="w-full h-14 text-base gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-semibold">Modo Slides</span>
              <span className="text-xs opacity-80 block">Conteúdo em doses</span>
            </div>
            <Sparkles className="w-4 h-4" />
          </Button>
          
          {/* Modo Leitura */}
          <Button
            onClick={onStartReading}
            variant="outline"
            size="lg"
            className="w-full h-14 text-base gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-semibold">Modo Leitura</span>
              <span className="text-xs text-muted-foreground block">Texto corrido tradicional</span>
            </div>
          </Button>
        </motion.div>
        
        {/* Dica */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-center text-muted-foreground"
        >
          💡 O modo slides divide o conteúdo em partes menores para melhor absorção
        </motion.p>
      </div>
    </motion.div>
  );
};

export default ConceitosTopicoIntro;
