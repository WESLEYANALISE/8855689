import { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface MultiAudioPlayerProps {
  audioUrls: string[];
  onGenerate?: () => void;
  isLoading?: boolean;
  label?: string;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const MultiAudioPlayer = ({ 
  audioUrls, 
  onGenerate, 
  isLoading, 
  label = "Narrar" 
}: MultiAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [durations, setDurations] = useState<number[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);

  // Calcular durações totais quando os áudios carregarem
  useEffect(() => {
    if (audioUrls.length === 0) return;

    const loadDurations = async () => {
      const newDurations: number[] = [];
      
      for (const url of audioUrls) {
        const audio = new Audio(url);
        await new Promise<void>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            newDurations.push(audio.duration);
            resolve();
          });
          audio.addEventListener('error', () => {
            newDurations.push(0);
            resolve();
          });
        });
      }
      
      setDurations(newDurations);
      setTotalDuration(newDurations.reduce((a, b) => a + b, 0));
    };

    loadDurations();
  }, [audioUrls]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      // Calcular tempo total considerando partes anteriores
      const tempoPartesAnteriores = durations.slice(0, currentIndex).reduce((a, b) => a + b, 0);
      setCurrentTime(tempoPartesAnteriores + audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      // Ir para o próximo áudio se houver
      if (currentIndex < audioUrls.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Terminou todos os áudios
        setIsPlaying(false);
        setCurrentIndex(0);
        setCurrentTime(0);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrls, currentIndex, durations]);

  // Auto-play quando mudar de índice durante reprodução
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, [currentIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const targetTime = value[0];
    
    // Encontrar qual parte corresponde ao tempo alvo
    let acumulado = 0;
    for (let i = 0; i < durations.length; i++) {
      if (targetTime <= acumulado + durations[i]) {
        // Está nesta parte
        if (i !== currentIndex) {
          setCurrentIndex(i);
          // Esperar o áudio carregar antes de setar o tempo
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.currentTime = targetTime - acumulado;
            }
          }, 100);
        } else if (audioRef.current) {
          audioRef.current.currentTime = targetTime - acumulado;
        }
        break;
      }
      acumulado += durations[i];
    }
    
    setCurrentTime(targetTime);
  };

  // Se não tem áudio, mostrar botão de gerar
  if (!audioUrls || audioUrls.length === 0) {
    if (!onGenerate) return null;
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerate}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            {label}
          </>
        )}
      </Button>
    );
  }

  // Player horizontal elegante - Tema azul
  return (
    <div className="w-full bg-slate-800/60 border border-blue-500/30 rounded-lg p-3">
      <audio 
        ref={audioRef} 
        src={audioUrls[currentIndex]} 
        preload="metadata" 
      />
      
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-blue-500/20 hover:bg-blue-500/30 shrink-0"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-blue-400" />
          ) : (
            <Play className="h-5 w-5 text-blue-400 ml-0.5" />
          )}
        </Button>

        {/* Progress Bar */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-slate-400 w-10 text-right font-mono">
            {formatTime(currentTime)}
          </span>
          
          <Slider
            value={[currentTime]}
            max={totalDuration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1 [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-400 [&_.bg-primary]:bg-blue-500"
          />
          
          <span className="text-xs text-slate-400 w-10 font-mono">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Indicador de parte (se houver múltiplas) */}
        {audioUrls.length > 1 && (
          <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
            {currentIndex + 1}/{audioUrls.length}
          </span>
        )}
      </div>
    </div>
  );
};