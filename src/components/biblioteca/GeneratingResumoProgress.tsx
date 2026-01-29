import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Search, 
  CheckCircle, 
  Loader2,
  Sparkles,
  Volume2,
  ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CapituloInfo {
  numero: number;
  titulo: string;
  status: 'pendente' | 'gerando' | 'concluido';
}

interface GeneratingResumoProgressProps {
  tituloLivro: string;
  autorLivro?: string;
  etapa: 'pesquisando' | 'descoberto' | 'gerando' | 'concluido';
  totalCapitulos: number;
  capitulosGerados: number;
  capituloAtual?: number;
  capitulosInfo?: CapituloInfo[];
}

const GeneratingResumoProgress = ({
  tituloLivro,
  autorLivro,
  etapa,
  totalCapitulos,
  capitulosGerados,
  capituloAtual = 0,
  capitulosInfo = []
}: GeneratingResumoProgressProps) => {
  const [dots, setDots] = useState("");
  
  useEffect(() => {
    if (etapa === 'pesquisando' || etapa === 'gerando') {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? "" : prev + ".");
      }, 500);
      return () => clearInterval(interval);
    }
  }, [etapa]);

  const progressPercentage = totalCapitulos > 0 
    ? Math.round((capitulosGerados / totalCapitulos) * 100)
    : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 space-y-8">
      {/* Header com ícone animado */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <motion.div
          animate={{ 
            rotate: etapa === 'pesquisando' ? 360 : 0,
            scale: etapa === 'concluido' ? [1, 1.1, 1] : 1
          }}
          transition={{ 
            rotate: { duration: 3, repeat: etapa === 'pesquisando' ? Infinity : 0, ease: "linear" },
            scale: { duration: 0.5 }
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center"
        >
          <BookOpen className="w-12 h-12 text-accent" />
        </motion.div>
        
        {etapa === 'gerando' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 text-accent-foreground" />
          </motion.div>
        )}
      </motion.div>

      {/* Título do livro */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-2"
      >
        <h2 className="text-2xl font-bold text-foreground">"{tituloLivro}"</h2>
        {autorLivro && (
          <p className="text-muted-foreground">{autorLivro}</p>
        )}
      </motion.div>

      {/* Status Steps */}
      <div className="w-full max-w-md space-y-4">
        {/* Step 1: Pesquisando */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border transition-all",
            etapa === 'pesquisando' 
              ? "bg-accent/10 border-accent" 
              : "bg-card/50 border-border"
          )}
        >
          {etapa === 'pesquisando' ? (
            <Loader2 className="w-5 h-5 text-accent animate-spin shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          )}
          <span className={cn(
            "font-medium",
            etapa === 'pesquisando' ? "text-accent" : "text-muted-foreground"
          )}>
            {etapa === 'pesquisando' 
              ? `Pesquisando estrutura do livro${dots}` 
              : "Estrutura do livro identificada"
            }
          </span>
        </motion.div>

        {/* Step 2: Descoberto */}
        <AnimatePresence>
          {(etapa === 'descoberto' || etapa === 'gerando' || etapa === 'concluido') && (
            <motion.div
              initial={{ x: -20, opacity: 0, height: 0 }}
              animate={{ x: 0, opacity: 1, height: 'auto' }}
              exit={{ x: -20, opacity: 0, height: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all",
                etapa === 'descoberto' 
                  ? "bg-accent/10 border-accent" 
                  : "bg-card/50 border-border"
              )}
            >
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <span className="font-medium text-foreground">
                Encontramos <span className="text-accent font-bold">{totalCapitulos} capítulos</span> neste livro!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Gerando */}
        <AnimatePresence>
          {(etapa === 'gerando' || etapa === 'concluido') && (
            <motion.div
              initial={{ x: -20, opacity: 0, height: 0 }}
              animate={{ x: 0, opacity: 1, height: 'auto' }}
              exit={{ x: -20, opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className={cn(
                "p-4 rounded-xl border transition-all",
                etapa === 'gerando' 
                  ? "bg-accent/10 border-accent" 
                  : "bg-card/50 border-border"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">
                    {etapa === 'gerando' 
                      ? `Gerando capítulos${dots}` 
                      : "Capítulos gerados!"
                    }
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {capitulosGerados} de {totalCapitulos}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-primary rounded-full"
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {progressPercentage}% concluído
                </p>
              </div>

              {/* Lista de capítulos */}
              {capitulosInfo.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="max-h-48 overflow-y-auto space-y-2 pr-2"
                >
                  {capitulosInfo.slice(0, capitulosGerados + 2).map((cap, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg text-sm",
                        cap.status === 'concluido' && "bg-green-500/10",
                        cap.status === 'gerando' && "bg-accent/10",
                        cap.status === 'pendente' && "bg-muted/30"
                      )}
                    >
                      {cap.status === 'concluido' && (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      )}
                      {cap.status === 'gerando' && (
                        <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
                      )}
                      {cap.status === 'pendente' && (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                      <span className={cn(
                        "truncate",
                        cap.status === 'pendente' && "text-muted-foreground"
                      )}>
                        Cap {cap.numero}: {cap.titulo}
                      </span>
                      
                      {cap.status === 'gerando' && (
                        <div className="ml-auto flex items-center gap-1 text-xs text-accent">
                          <ImageIcon className="w-3 h-3" />
                          <Volume2 className="w-3 h-3" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mensagem de dica */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground text-center max-w-sm"
      >
        {etapa === 'pesquisando' && "A IA está pesquisando a estrutura real do livro..."}
        {etapa === 'descoberto' && "Preparando para gerar resumos ilustrados..."}
        {etapa === 'gerando' && "Cada capítulo recebe uma imagem realista e narração em áudio"}
        {etapa === 'concluido' && "Seu resumo está pronto para leitura!"}
      </motion.p>
    </div>
  );
};

export default GeneratingResumoProgress;
