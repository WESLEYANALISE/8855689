import { useState, useRef, useEffect, useMemo } from "react";
import { Pause, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNarrationPlayer } from "@/contexts/NarrationPlayerContext";
import AudioWaveAnimation from "./AudioWaveAnimation";

interface InlineAudioButtonProps {
  audioUrl: string; // Pode ser URL única ou JSON array de URLs
  articleNumber: string;
  onPlay?: (audioElement: HTMLAudioElement) => void;
}

const InlineAudioButton = ({ audioUrl, articleNumber, onPlay }: InlineAudioButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { playNarration, currentNarrationRef } = useNarrationPlayer();

  // Parsear audioUrl - pode ser string única ou JSON array
  const audioUrls = useMemo(() => {
    if (!audioUrl) return [];
    try {
      const parsed = JSON.parse(audioUrl);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Se falhar parse, é uma URL única
    }
    return [audioUrl];
  }, [audioUrl]);

  const totalParts = audioUrls.length;
  const hasMultipleParts = totalParts > 1;

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Reset quando audioUrl muda
  useEffect(() => {
    setCurrentPartIndex(0);
    setProgress(0);
    setIsPlaying(false);
  }, [audioUrl]);

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

  // Atualizar src do áudio quando parte muda
  useEffect(() => {
    if (audioRef.current && audioUrls[currentPartIndex]) {
      audioRef.current.src = audioUrls[currentPartIndex];
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentPartIndex, audioUrls]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        if (onPlay) {
          onPlay(audioRef.current);
        } else {
          playNarration(audioRef.current);
        }
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      setIsPlaying(false);
    }
  };

  const handleLoadedMetadata = () => {
    setLoading(false);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      // Calcular progresso total considerando múltiplas partes
      const partProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      const partContribution = 100 / totalParts;
      const totalProgress = (currentPartIndex * partContribution) + (partProgress * partContribution / 100);
      setProgress(totalProgress);
    }
  };

  const handleEnded = () => {
    // Se há mais partes, avançar para próxima
    if (currentPartIndex < totalParts - 1) {
      setCurrentPartIndex(prev => prev + 1);
      // O useEffect acima vai atualizar o src e continuar tocando
    } else {
      // Última parte terminou - resetar tudo
      setIsPlaying(false);
      setProgress(0);
      setCurrentPartIndex(0);
    }
  };

  if (!audioUrl || audioUrls.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      <audio
        ref={audioRef}
        src={audioUrls[currentPartIndex]}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        preload="auto"
      />
      
      {/* Botão de Narração - maior e com texto branco */}
      <button
        onClick={togglePlay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg transition-all text-base font-medium shadow-lg hover:shadow-xl hover:scale-105 animate-fade-in relative overflow-hidden bg-accent/70 hover:bg-accent/90 border border-accent/30 group"
      >
        {/* Progress Fill */}
        {isPlaying && (
          <div 
            className="absolute inset-0 bg-white/10 transition-all duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        )}
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-2 text-white">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : isPlaying ? (
            <>
              <div className="text-white">
                <AudioWaveAnimation />
              </div>
              <Pause className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 text-white" />
              <span className="font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Pausar
              </span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5 text-white" />
              <span className="font-medium text-white">
                Narração
                {hasMultipleParts && (
                  <span className="ml-1 text-xs opacity-80">
                    ({totalParts} partes)
                  </span>
                )}
              </span>
            </>
          )}
        </div>
      </button>
    </div>
  );
};

export default InlineAudioButton;
