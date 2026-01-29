import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPaginaPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  className?: string;
}

export interface AudioPaginaPlayerRef {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  isPlaying: () => boolean;
  getCurrentTime: () => number;
}

export const AudioPaginaPlayer = forwardRef<AudioPaginaPlayerRef, AudioPaginaPlayerProps>(({
  audioUrl,
  autoPlay = false,
  onEnded,
  onPlayStateChange,
  className
}, ref) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Expor métodos via ref
  useImperativeHandle(ref, () => ({
    play: async () => {
      if (audioRef.current) {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    },
    pause: () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    },
    stop: () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setCurrentTime(0);
      }
    },
    isPlaying: () => isPlaying,
    getCurrentTime: () => audioRef.current?.currentTime || 0
  }));

  // Criar elemento de áudio
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
      onPlayStateChange?.(false);
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      onPlayStateChange?.(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);

    // Auto-play se solicitado
    if (autoPlay) {
      setIsLoading(true);
      audio.play().catch(() => setIsLoading(false));
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl, autoPlay, onEnded, onPlayStateChange]);

  // Atualizar volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setIsLoading(true);
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Erro ao reproduzir:', error);
        setIsLoading(false);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2",
      className
    )}>
      {/* Botão Play/Pause */}
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        disabled={isLoading}
        className="h-8 w-8 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </Button>

      {/* Tempo atual */}
      <span className="text-xs text-white/60 w-10 text-right font-mono">
        {formatTime(currentTime)}
      </span>

      {/* Barra de progresso */}
      <div className="flex-1 relative">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer [&>span:first-child]:h-1 [&>span:first-child]:bg-white/20 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-amber-400 [&>span:first-child>span]:bg-amber-400"
        />
      </div>

      {/* Duração */}
      <span className="text-xs text-white/60 w-10 font-mono">
        {formatTime(duration)}
      </span>

      {/* Volume */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMuted(!isMuted)}
        className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
});

AudioPaginaPlayer.displayName = "AudioPaginaPlayer";
