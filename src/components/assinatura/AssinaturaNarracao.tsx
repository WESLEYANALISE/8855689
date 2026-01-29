import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AssinaturaNarracaoProps {
  frase: string;
  audioBase64: string | null;
}

const AssinaturaNarracao = ({ frase, audioBase64 }: AssinaturaNarracaoProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef(false);

  // Efeito de typing - inicia imediatamente
  useEffect(() => {
    if (!frase) return;
    
    setDisplayedText("");
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < frase.length) {
        setDisplayedText(frase.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [frase]);

  // Auto-play automático: Gemini 2.5 Flash TTS
  useEffect(() => {
    if (hasPlayedRef.current || !audioBase64) return;
    
    // Usar áudio gerado pelo Gemini 2.5 Flash
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`;
    audioRef.current = new Audio(audioUrl);
    audioRef.current.volume = 0.8;
    
    audioRef.current.onplay = () => {
      hasPlayedRef.current = true;
    };
    audioRef.current.onerror = () => {
      console.log("Erro ao reproduzir áudio");
    };
    
    // Tentar reproduzir automaticamente com delay mínimo
    const playAudio = async () => {
      try {
        await audioRef.current?.play();
      } catch (err) {
        // Em caso de bloqueio do navegador, tentar com interação do usuário
        const handleInteraction = () => {
          audioRef.current?.play().catch(() => {});
          document.removeEventListener('click', handleInteraction);
          document.removeEventListener('touchstart', handleInteraction);
        };
        document.addEventListener('click', handleInteraction, { once: true });
        document.addEventListener('touchstart', handleInteraction, { once: true });
      }
    };
    
    // Delay pequeno para sincronizar com animação
    setTimeout(playAudio, 200);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioBase64]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative px-2 sm:px-4 py-4 sm:py-6"
    >
      <div className="max-w-2xl mx-auto text-center">
        {/* Frase com typing effect */}
        <div className="relative">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-white tracking-wide font-playfair leading-relaxed">
            "{displayedText}
            <AnimatePresence>
              {displayedText.length < frase.length && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-0.5 h-4 sm:h-5 md:h-6 bg-amber-500 ml-0.5 align-middle"
                />
              )}
            </AnimatePresence>
            {displayedText.length === frase.length && '"'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AssinaturaNarracao;
