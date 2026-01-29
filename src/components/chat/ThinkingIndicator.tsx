import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ThinkingIndicatorProps {
  elapsedTime: number;
}

interface Phase {
  icon: string;
  text: string;
  color: string;
}

export const ThinkingIndicator = ({ elapsedTime }: ThinkingIndicatorProps) => {
  const [currentPhase, setCurrentPhase] = useState<Phase>({
    icon: "🧠",
    text: "Analisando",
    color: "text-blue-500"
  });

  useEffect(() => {
    if (elapsedTime < 2000) {
      setCurrentPhase({ icon: "🧠", text: "Analisando", color: "text-blue-500" });
    } else if (elapsedTime < 5000) {
      setCurrentPhase({ icon: "⚖️", text: "Gerando", color: "text-purple-500" });
    } else {
      setCurrentPhase({ icon: "🔥", text: "Pensando", color: "text-orange-500" });
    }
  }, [elapsedTime]);

  return (
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhase.text}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <motion.span
            className="text-2xl"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {currentPhase.icon}
          </motion.span>
          
          <div className="flex flex-col">
            <span className={`font-medium ${currentPhase.color} transition-colors duration-300`}>
              {currentPhase.text}
            </span>
            <div className="flex gap-1 mt-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-current opacity-70"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
