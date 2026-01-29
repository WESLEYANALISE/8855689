import { Volume2, Loader2 } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNarrationPlayer } from "@/contexts/NarrationPlayerContext";
import AudioWaveAnimation from "./AudioWaveAnimation";

interface CopyButtonProps {
  text: string;
  articleNumber: string;
  narrationUrl?: string;
}

// Parse narration URL que pode ser uma única URL ou JSON array de URLs
function parseNarrationUrls(narrationUrl: string): string[] {
  if (!narrationUrl) return [];
  
  try {
    // Tenta parsear como JSON (array de URLs)
    const parsed = JSON.parse(narrationUrl);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [narrationUrl];
  } catch {
    // Se não for JSON, é uma URL simples
    return [narrationUrl];
  }
}

export const CopyButton = ({ text, articleNumber, narrationUrl }: CopyButtonProps) => {
  const { toast } = useToast();
  const { playNarration, currentNarrationRef } = useNarrationPlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Suporte para múltiplas partes
  const [urls] = useState(() => parseNarrationUrls(narrationUrl || ''));
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const totalParts = urls.length;

  // Detectar quando outro áudio começa a tocar
  useEffect(() => {
    const checkIfStillPlaying = () => {
      if (audioRef.current && currentNarrationRef.current !== audioRef.current) {
        setIsPlaying(false);
        setProgress(0);
        setCurrentPartIndex(0);
      }
    };

    const interval = setInterval(checkIfStillPlaying, 100);
    return () => clearInterval(interval);
  }, [currentNarrationRef]);

  // Atualizar src do audio quando mudar de parte
  useEffect(() => {
    if (audioRef.current && urls[currentPartIndex]) {
      audioRef.current.src = urls[currentPartIndex];
    }
  }, [currentPartIndex, urls]);

  const handlePlayNarration = async () => {
    if (!urls.length || !audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setLoading(true);
        // Se estava pausado e não voltou ao início, continua de onde parou
        await playNarration(audioRef.current);
        setIsPlaying(true);
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && totalParts > 0) {
      // Calcular progresso total considerando múltiplas partes
      const partProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      const partWeight = 100 / totalParts;
      const totalProgress = (currentPartIndex * partWeight) + (partProgress * partWeight / 100);
      setProgress(totalProgress);
    }
  };

  const handleEnded = useCallback(async () => {
    // Se há mais partes, avançar para a próxima
    if (currentPartIndex < totalParts - 1) {
      const nextIndex = currentPartIndex + 1;
      setCurrentPartIndex(nextIndex);
      
      // Aguardar atualização do src e tocar automaticamente
      setTimeout(async () => {
        if (audioRef.current) {
          try {
            await playNarration(audioRef.current);
            setIsPlaying(true);
          } catch (e) {
            setIsPlaying(false);
          }
        }
      }, 100);
    } else {
      // Fim de todas as partes
      setIsPlaying(false);
      setProgress(0);
      setCurrentPartIndex(0);
    }
  }, [currentPartIndex, totalParts, playNarration]);

  const handleCanPlayThrough = () => {
    setLoading(false);
  };

  if (!urls.length) return null;

  return (
    <>
      <audio 
        ref={audioRef} 
        src={urls[0]} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onCanPlayThrough={handleCanPlayThrough}
        preload="auto"
      />
      <button
        onClick={handlePlayNarration}
        disabled={loading}
        className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all border text-xs font-medium hover:scale-105 bg-accent/20 hover:bg-accent/30 border-accent/30 text-foreground overflow-hidden group"
        title={isPlaying ? "Pausar Narração" : "Ouvir Narração"}
      >
        {/* Barra de progresso por dentro */}
        {isPlaying && (
          <div 
            className="absolute inset-0 bg-accent/10 transition-all duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        )}
        
        {/* Conteúdo */}
        <div className="relative z-10 flex items-center gap-1.5">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isPlaying ? (
            <AudioWaveAnimation />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
          <span>
            {isPlaying 
              ? (totalParts > 1 ? `Parte ${currentPartIndex + 1}/${totalParts}` : "Pausar")
              : "Narração"
            }
          </span>
        </div>
      </button>
    </>
  );
};
