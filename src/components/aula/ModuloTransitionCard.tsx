import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { BookOpen, Scale, Gavel, FileText, Users, Building } from "lucide-react";

interface ModuloTransitionCardProps {
  moduloNumero: number;
  moduloNome: string;
  icone?: string;
  imagemUrl?: string;
  onComplete: () => void;
}

const iconMap: Record<string, any> = {
  BookOpen,
  Scale,
  Gavel,
  FileText,
  Users,
  Building
};

export const ModuloTransitionCard = ({ 
  moduloNumero, 
  moduloNome, 
  icone = "BookOpen",
  imagemUrl,
  onComplete 
}: ModuloTransitionCardProps) => {
  const [show, setShow] = useState(true);
  const IconComponent = iconMap[icone] || BookOpen;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setShow(false);
            setTimeout(onComplete, 300);
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300 
            }}
          >
            <Card className="p-8 max-w-md mx-4 text-center space-y-4 border-2 border-primary/30 shadow-2xl bg-gradient-to-br from-card to-primary/5 overflow-hidden">
              {imagemUrl && moduloNumero === 1 ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                  className="relative -mx-8 -mt-8 mb-4"
                >
                  <img 
                    src={imagemUrl} 
                    alt="Capa da aula" 
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ 
                    delay: 0.2,
                    type: "spring",
                    damping: 15,
                    stiffness: 200
                  }}
                  className="inline-block bg-gradient-to-br from-primary to-accent rounded-2xl p-6 shadow-lg"
                >
                  <IconComponent className="w-16 h-16 text-primary-foreground" />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  MÓDULO {moduloNumero}
                </h2>
                <p className="text-xl font-semibold text-foreground">
                  {moduloNome}
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-muted-foreground"
              >
                Clique para continuar
              </motion.p>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
