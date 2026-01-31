import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingScrollButtonProps {
  threshold?: number;
  className?: string;
}

export const FloatingScrollButton = ({ 
  threshold = 300,
  className 
}: FloatingScrollButtonProps) => {
  const [showButton, setShowButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Mostrar botão se scrollou além do threshold
      setShowButton(scrollY > threshold);
      
      // Verificar se está no final da página
      const bottomThreshold = 100;
      setIsAtBottom(scrollY + windowHeight >= documentHeight - bottomThreshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ 
      top: document.documentElement.scrollHeight, 
      behavior: "smooth" 
    });
  };

  return (
    <AnimatePresence>
      {showButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={isAtBottom ? scrollToTop : scrollToBottom}
          className={cn(
            "fixed bottom-20 left-4 z-50",
            "w-11 h-11 rounded-full",
            "bg-red-600/90 backdrop-blur-sm",
            "border border-red-500/50",
            "flex items-center justify-center",
            "shadow-lg shadow-red-500/30",
            "hover:bg-red-500 hover:scale-105",
            "active:scale-95",
            "transition-all duration-200",
            className
          )}
          aria-label={isAtBottom ? "Voltar ao topo" : "Ir para o final"}
        >
          {isAtBottom ? (
            <ArrowUp className="w-5 h-5 text-white" />
          ) : (
            <ArrowDown className="w-5 h-5 text-white" />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};
