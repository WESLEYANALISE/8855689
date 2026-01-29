import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface AulaTransitionCardProps {
  aulaNumero: number;
  aulaTema: string;
  onComplete: () => void;
}

export const AulaTransitionCard = ({ aulaNumero, aulaTema, onComplete }: AulaTransitionCardProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleClick = () => {
    setShow(false);
    setTimeout(onComplete, 500);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClick}
        >
          <Card className="max-w-lg w-full bg-gradient-to-br from-card via-muted/30 to-card border-2 border-primary/20 shadow-2xl overflow-hidden cursor-pointer">
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
              className="p-8 md:p-12 text-center space-y-6"
            >
              {/* Ícone */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 150, damping: 15 }}
                className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg"
              >
                <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" />
              </motion.div>

              {/* Número da Aula */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-sm text-muted-foreground font-medium mb-2">
                  Aula {aulaNumero}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {aulaTema}
                </h2>
              </motion.div>

              {/* Mensagem de continuar */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ 
                  delay: 1, 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
                className="text-sm text-muted-foreground"
              >
                Clique para continuar
              </motion.p>
            </motion.div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
