import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface AulaIntroCardProps {
  area: string;
  aulaNumero: number;
  aulaTema: string;
  aulaDescricao?: string;
  capaUrl?: string;
  onIniciar: () => void;
  onVoltar?: () => void;
}

export const AulaIntroCard = ({ 
  area,
  aulaNumero, 
  aulaTema, 
  aulaDescricao,
  capaUrl,
  onIniciar,
  onVoltar
}: AulaIntroCardProps) => {
  const [show, setShow] = useState(true);

  const handleIniciar = () => {
    setShow(false);
    setTimeout(onIniciar, 500);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <Card className="max-w-2xl w-full bg-gradient-to-br from-card via-muted/30 to-card border-2 border-primary/20 shadow-2xl overflow-hidden relative">
            {/* Botão Voltar */}
            {onVoltar && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={onVoltar}
                className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 hover:bg-background border border-border/50 text-foreground hover:text-primary transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Voltar</span>
              </motion.button>
            )}
            
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
              className="space-y-6"
            >
              {/* Capa da Aula */}
              {capaUrl ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative w-full aspect-video overflow-hidden"
                >
                  <img 
                    src={capaUrl} 
                    alt={aulaTema}
                    className="w-full h-full object-contain bg-muted"
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 15 }}
                  className="flex justify-center pt-12"
                >
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                    <BookOpen className="w-12 h-12 text-primary-foreground" />
                  </div>
                </motion.div>
              )}

              {/* Conteúdo */}
              <div className={`px-8 md:px-12 ${capaUrl ? 'pb-8 pt-6' : 'pb-12'} text-center space-y-4`}>
                {/* Área e Número da Aula */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <div className="text-sm text-muted-foreground font-medium">
                    {area} • Aula {aulaNumero}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    {aulaTema}
                  </h2>
                </motion.div>

                {/* Descrição */}
                {aulaDescricao && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto leading-relaxed"
                  >
                    {aulaDescricao}
                  </motion.p>
                )}

                {/* Botão Iniciar */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                  className="pt-4"
                >
                  <Button
                    onClick={handleIniciar}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Play className="w-5 h-5" />
                    Iniciar Aula
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
