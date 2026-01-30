import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Sparkles } from "lucide-react";
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
              delay: 0.5 // Delay para aparecer após a resposta
            }}
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "fixed right-0 top-1/2 -translate-y-1/2 z-40",
              "h-14 w-14 rounded-l-2xl",
              "bg-gradient-to-br from-amber-500 to-orange-600",
              "shadow-lg shadow-amber-500/30",
              "flex flex-col items-center justify-center gap-0.5",
              "hover:scale-105 hover:shadow-xl hover:shadow-amber-500/40",
              "active:scale-95",
              "transition-all duration-200",
              "border-l border-t border-b border-amber-400/30"
            )}
            aria-label="Gerar Flashcards"
          >
            {/* Ícone */}
            <Layers className="w-5 h-5 text-white" />
            
            {/* Badge com número */}
            <span className="text-[10px] font-bold text-white/90">
              10
            </span>
            
            {/* Sparkle decorativo */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="w-3 h-3 text-amber-200" />
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
