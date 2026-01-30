import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatFlashcardsModal from "@/components/ChatFlashcardsModal";

interface FloatingFlashcardsButtonProps {
  isVisible: boolean;
  lastAssistantMessage: string;
}

export const FloatingFlashcardsButton = ({ 
  isVisible, 
  lastAssistantMessage 
}: FloatingFlashcardsButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isVisible || !lastAssistantMessage) return null;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              delay: 0.5
            }}
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "fixed right-0 top-1/2 -translate-y-1/2 z-40",
              "h-14 w-14 rounded-l-2xl",
              "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
              "shadow-[0_0_20px_rgba(251,191,36,0.6),0_0_40px_rgba(249,115,22,0.4)]",
              "flex flex-col items-center justify-center gap-0.5",
              "hover:scale-105 hover:shadow-[0_0_30px_rgba(251,191,36,0.8),0_0_60px_rgba(249,115,22,0.6)]",
              "active:scale-95",
              "transition-all duration-200",
              "border-l border-t border-b border-amber-300/50"
            )}
            aria-label="Gerar Flashcards"
          >
            {/* Glow pulsante de fundo */}
            <motion.div
              className="absolute inset-0 rounded-l-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-red-400 opacity-50"
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
            
            {/* Badge com número */}
            <span className="text-[10px] font-bold text-white/90 relative z-10">
              10
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
              <Sparkles className="w-3 h-3 text-amber-200" />
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
              <Sparkles className="w-2 h-2 text-yellow-200" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal de Flashcards */}
      <ChatFlashcardsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={lastAssistantMessage}
      />
    </>
  );
};

export default FloatingFlashcardsButton;
