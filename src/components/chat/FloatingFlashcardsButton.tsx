import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatFlashcardsModal from "@/components/ChatFlashcardsModal";
import { supabase } from "@/integrations/supabase/client";

// Paleta de cores alternadas para cada novo flashcard
const COLOR_THEMES = [
  {
    name: "amber",
    gradient: "from-amber-400 via-orange-500 to-red-500",
    glow: "from-amber-300 via-orange-400 to-red-400",
    shadow: "rgba(251,191,36,0.6),0_0_40px_rgba(249,115,22,0.4)",
    shadowHover: "rgba(251,191,36,0.8),0_0_60px_rgba(249,115,22,0.6)",
    border: "border-amber-300/50",
    sparkle1: "text-amber-200",
    sparkle2: "text-yellow-200",
  },
  {
    name: "emerald",
    gradient: "from-emerald-400 via-teal-500 to-cyan-500",
    glow: "from-emerald-300 via-teal-400 to-cyan-400",
    shadow: "rgba(52,211,153,0.6),0_0_40px_rgba(20,184,166,0.4)",
    shadowHover: "rgba(52,211,153,0.8),0_0_60px_rgba(20,184,166,0.6)",
    border: "border-emerald-300/50",
    sparkle1: "text-emerald-200",
    sparkle2: "text-cyan-200",
  },
  {
    name: "violet",
    gradient: "from-violet-400 via-purple-500 to-pink-500",
    glow: "from-violet-300 via-purple-400 to-pink-400",
    shadow: "rgba(139,92,246,0.6),0_0_40px_rgba(168,85,247,0.4)",
    shadowHover: "rgba(139,92,246,0.8),0_0_60px_rgba(168,85,247,0.6)",
    border: "border-violet-300/50",
    sparkle1: "text-violet-200",
    sparkle2: "text-pink-200",
  },
  {
    name: "blue",
    gradient: "from-blue-400 via-indigo-500 to-purple-500",
    glow: "from-blue-300 via-indigo-400 to-purple-400",
    shadow: "rgba(96,165,250,0.6),0_0_40px_rgba(99,102,241,0.4)",
    shadowHover: "rgba(96,165,250,0.8),0_0_60px_rgba(99,102,241,0.6)",
    border: "border-blue-300/50",
    sparkle1: "text-blue-200",
    sparkle2: "text-indigo-200",
  },
  {
    name: "rose",
    gradient: "from-rose-400 via-pink-500 to-fuchsia-500",
    glow: "from-rose-300 via-pink-400 to-fuchsia-400",
    shadow: "rgba(251,113,133,0.6),0_0_40px_rgba(236,72,153,0.4)",
    shadowHover: "rgba(251,113,133,0.8),0_0_60px_rgba(236,72,153,0.6)",
    border: "border-rose-300/50",
    sparkle1: "text-rose-200",
    sparkle2: "text-fuchsia-200",
  },
];

interface FloatingFlashcardsButtonProps {
  isVisible: boolean;
  lastAssistantMessage: string;
  messageCount?: number; // Contador para alternar cores
}

interface Flashcard {
  front: string;
  back: string;
  exemplo?: string;
}

export const FloatingFlashcardsButton = ({ 
  isVisible, 
  lastAssistantMessage,
  messageCount = 0
}: FloatingFlashcardsButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const prevMessageRef = useRef<string>("");
  
  // Estado para flashcards pré-carregados em segundo plano
  const [preloadedFlashcards, setPreloadedFlashcards] = useState<Flashcard[]>([]);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState(false);
  
  // Selecionar tema de cor baseado no contador de mensagens
  const colorTheme = COLOR_THEMES[messageCount % COLOR_THEMES.length];

  // Gerar flashcards automaticamente em segundo plano quando mensagem finaliza
  const generateFlashcardsInBackground = useCallback(async (content: string) => {
    if (content.length < 200) return; // Não gerar para conteúdo muito curto
    
    setIsPreloading(true);
    setPreloadError(false);
    
    try {
      const { data, error } = await supabase.functions.invoke("gerar-flashcards", {
        body: { content, tipo: 'chat' }
      });
      
      if (error) throw error;
      
      if (data?.flashcards && Array.isArray(data.flashcards)) {
        setPreloadedFlashcards(data.flashcards);
      }
    } catch (error) {
      console.error("Erro ao pré-carregar flashcards:", error);
      setPreloadError(true);
    } finally {
      setIsPreloading(false);
    }
  }, []);

  // Iniciar geração em segundo plano quando uma nova mensagem do assistente aparece
  useEffect(() => {
    if (isVisible && lastAssistantMessage && lastAssistantMessage !== prevMessageRef.current) {
      // Resetar flashcards pré-carregados para nova mensagem
      setPreloadedFlashcards([]);
      setPreloadError(false);
      
      // Aguardar um pouco para garantir que a mensagem foi finalizada
      const timer = setTimeout(() => {
        generateFlashcardsInBackground(lastAssistantMessage);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, lastAssistantMessage, generateFlashcardsInBackground]);

  // Controlar animação de entrada/saída baseado na mudança de mensagem
  useEffect(() => {
    if (isVisible && lastAssistantMessage) {
      // Se a mensagem mudou, fazer animação de saída e depois entrada
      if (prevMessageRef.current && prevMessageRef.current !== lastAssistantMessage) {
        setShowButton(false);
        const timer = setTimeout(() => {
          setShowButton(true);
          prevMessageRef.current = lastAssistantMessage;
        }, 400); // Tempo para animação de saída
        return () => clearTimeout(timer);
      } else {
        // Primeira vez ou mesma mensagem
        setShowButton(true);
        prevMessageRef.current = lastAssistantMessage;
      }
    } else {
      setShowButton(false);
    }
  }, [isVisible, lastAssistantMessage]);

  if (!lastAssistantMessage) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {showButton && isVisible && (
          <motion.button
            key={`flashcard-btn-${messageCount}`}
            initial={{ x: 100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 100, opacity: 0, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              delay: 0.3
            }}
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "fixed right-0 top-1/2 -translate-y-1/2 z-40",
              "h-14 w-14 rounded-l-2xl",
              `bg-gradient-to-br ${colorTheme.gradient}`,
              "flex flex-col items-center justify-center gap-0.5",
              "hover:scale-105",
              "active:scale-95",
              "transition-all duration-200",
              `border-l border-t border-b ${colorTheme.border}`
            )}
            style={{
              boxShadow: `0_0_20px_${colorTheme.shadow}`,
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: `0_0_30px_${colorTheme.shadowHover}`,
            }}
            aria-label="Gerar Flashcards"
          >
            {/* Glow pulsante de fundo */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-l-2xl opacity-50",
                `bg-gradient-to-br ${colorTheme.glow}`
              )}
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Ícone Sparkles (brilho) */}
            <Sparkles className="w-6 h-6 text-white relative z-10 drop-shadow-lg" />
            
            {/* Badge com número ou indicador de loading */}
            <span className="text-[10px] font-bold text-white/90 relative z-10">
              {isPreloading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : preloadedFlashcards.length > 0 ? (
                preloadedFlashcards.length
              ) : (
                "10"
              )}
            </span>
            
            {/* Partículas de brilho decorativas */}
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
                rotate: [0, 15, 0]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-1 -left-1"
            >
              <Sparkles className={cn("w-3 h-3", colorTheme.sparkle1)} />
            </motion.div>
            
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{ 
                duration: 1.8, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
              className="absolute -bottom-1 left-0"
            >
              <Sparkles className={cn("w-2 h-2", colorTheme.sparkle2)} />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal de Flashcards - passa flashcards pré-carregados */}
      <ChatFlashcardsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={lastAssistantMessage}
        preloadedFlashcards={preloadedFlashcards.length > 0 ? preloadedFlashcards : undefined}
      />
    </>
  );
};

export default FloatingFlashcardsButton;
