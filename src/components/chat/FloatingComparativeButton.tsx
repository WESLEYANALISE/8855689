import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatComparativoModal from "@/components/ChatComparativoModal";

interface FloatingComparativeButtonProps {
  isVisible: boolean;
  lastAssistantMessage: string;
}

export const FloatingComparativeButton = ({ 
  isVisible, 
  lastAssistantMessage 
}: FloatingComparativeButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const prevMessageRef = useRef<string>("");

  // Controlar animação de entrada/saída baseado na mudança de mensagem
  useEffect(() => {
    if (isVisible && lastAssistantMessage) {
      // Se a mensagem mudou, fazer animação de saída e depois entrada
      if (prevMessageRef.current && prevMessageRef.current !== lastAssistantMessage) {
        setShowButton(false);
        const timer = setTimeout(() => {
          setShowButton(true);
          prevMessageRef.current = lastAssistantMessage;
        }, 400);
        return () => clearTimeout(timer);
      } else {
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
            key="comparative-btn"
            initial={{ x: 100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 100, opacity: 0, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              delay: 0.2
            }}
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "fixed right-0 top-1/2 -translate-y-[calc(50%+70px)] z-40",
              "h-14 w-14 rounded-l-2xl",
              "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500",
              "flex flex-col items-center justify-center gap-0.5",
              "hover:scale-105",
              "active:scale-95",
              "transition-all duration-200",
              "border-l border-t border-b border-cyan-300/50"
            )}
            style={{
              boxShadow: "0 0 20px rgba(34,211,238,0.6), 0 0 40px rgba(59,130,246,0.4)",
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 30px rgba(34,211,238,0.8), 0 0 60px rgba(59,130,246,0.6)",
            }}
            aria-label="Gerar Tabela Comparativa"
          >
            {/* Glow pulsante de fundo */}
            <motion.div
              className="absolute inset-0 rounded-l-2xl opacity-50 bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-400"
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
            
            {/* Ícone de Tabela */}
            <Table className="w-6 h-6 text-white relative z-10 drop-shadow-lg" />
            
            {/* Badge com texto */}
            <span className="text-[9px] font-bold text-white/90 relative z-10">
              Tabela
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal de Tabela Comparativa */}
      <ChatComparativoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={lastAssistantMessage}
      />
    </>
  );
};

export default FloatingComparativeButton;
