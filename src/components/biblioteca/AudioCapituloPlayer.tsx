import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { Play, Pause, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface AudioCapituloPlayerProps {
  audioUrl: string;
  tituloCapitulo?: string;
  className?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export interface AudioCapituloPlayerRef {
  pause: () => void;
  resume: () => void;
  isPlaying: () => boolean;
  getCurrentTime: () => number;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const AudioCapituloPlayer = forwardRef<AudioCapituloPlayerRef, AudioCapituloPlayerProps>(({ 
  audioUrl, 
  tituloCapitulo,
  className,
  onPlayStateChange
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [wasPlayingBeforePause, setWasPlayingBeforePause] = useState(false);

  // Expor métodos para controle externo
  useImperativeHandle(ref, () => ({
    pause: () => {
      if (audioRef.current && isPlaying) {
        setWasPlayingBeforePause(true);
        audioRef.current.pause();
        setIsPlaying(false);
      }
    },
    resume: () => {
      if (audioRef.current && wasPlayingBeforePause && !isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
        setWasPlayingBeforePause(false);
      }
    },
    isPlaying: () => isPlaying,
    getCurrentTime: () => audioRef.current?.currentTime || 0
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setWasPlayingBeforePause(false);
      onPlayStateChange?.(false);
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, [audioUrl, onPlayStateChange]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setWasPlayingBeforePause(false);
      onPlayStateChange?.(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      onPlayStateChange?.(true);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    audioRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  return (
    <div className={cn(
      "w-full bg-gradient-to-r from-amber-50/90 to-orange-50/90 dark:from-amber-950/40 dark:to-orange-950/40",
      "border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-4 shadow-sm",
      "backdrop-blur-sm",
      className
    )}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Título do capítulo */}
      {tituloCapitulo && (
        <div className="mb-3 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200 line-clamp-1">
            🎧 Ouvir: {tituloCapitulo}
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full shrink-0 transition-all",
            "bg-amber-500 hover:bg-amber-600 text-white",
            "dark:bg-amber-600 dark:hover:bg-amber-500",
            "shadow-md hover:shadow-lg"
          )}
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Progress Bar & Times */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-amber-700 dark:text-amber-300 w-10 text-right font-mono tabular-nums">
            {formatTime(currentTime)}
          </span>
          
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1 [&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-600"
          />
          
          <span className="text-xs text-amber-700 dark:text-amber-300 w-10 font-mono tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume Control */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100/50"
            onClick={toggleMute}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-20 [&_[role=slider]]:bg-amber-500"
          />
        </div>
      </div>
    </div>
  );
});

AudioCapituloPlayer.displayName = "AudioCapituloPlayer";
