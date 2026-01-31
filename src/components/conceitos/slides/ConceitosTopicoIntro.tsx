import { motion } from "framer-motion";
import { Clock, BookOpen, Layers, Play, BookText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalImage } from "@/components/ui/universal-image";

interface ConceitosTopicoIntroProps {
  titulo: string;
  materiaName?: string;
  capaUrl?: string | null;
  tempoEstimado?: string;
  totalSecoes?: number;
  totalSlides?: number;
  objetivos?: string[];
  onStartSlides: () => void;
  onStartReading: () => void;
}

export const ConceitosTopicoIntro = ({
  titulo,
  materiaName,
  capaUrl,
  tempoEstimado = "25 min",
  totalSecoes = 6,
  totalSlides = 35,
  objetivos = [],
  onStartSlides,
  onStartReading
}: ConceitosTopicoIntroProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-4rem)] flex flex-col"
    >
      {/* Hero image */}
      <div className="relative w-full aspect-video max-h-64 overflow-hidden">
        <UniversalImage
          src={capaUrl}
          alt={titulo}
          priority
          blurCategory="juridico"
          containerClassName="w-full h-full"
          className="object-cover"
          fallback={
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-primary/30" />
            </div>
          }
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-8 -mt-16 relative z-10">
        <div className="max-w-lg mx-auto">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {materiaName && (
              <p className="text-sm text-primary font-medium mb-1">
                {materiaName}
              </p>
            )}
            <h1 className="text-2xl font-bold text-foreground">
              {titulo}
            </h1>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mt-4 text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{tempoEstimado}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span className="text-sm">{totalSecoes} seções</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">{totalSlides} slides</span>
            </div>
          </motion.div>

          {/* Objectives */}
          {objetivos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-4 rounded-xl bg-card border border-border"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                O que você vai aprender
              </h3>
              <ul className="space-y-2">
                {objetivos.slice(0, 4).map((objetivo, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {objetivo}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 space-y-3"
          >
            {/* Primary: Slides mode */}
            <Button
              onClick={onStartSlides}
              size="lg"
              className="w-full gap-2"
            >
              <Play className="w-5 h-5" />
              Modo Slides
              <span className="ml-auto text-xs opacity-70">Recomendado</span>
            </Button>
            
            {/* Secondary: Reading mode */}
            <Button
              onClick={onStartReading}
              variant="outline"
              size="lg"
              className="w-full gap-2"
            >
              <BookText className="w-5 h-5" />
              Modo Leitura
            </Button>
          </motion.div>

          {/* Tip */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-muted-foreground mt-6"
          >
            O modo Slides é interativo e ideal para memorização
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default ConceitosTopicoIntro;
