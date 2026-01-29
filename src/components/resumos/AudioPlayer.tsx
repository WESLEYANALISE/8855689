import { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  audioUrl?: string;
  onGenerate: () => void;
  isLoading?: boolean;
  label?: string;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const AudioPlayer = ({ audioUrl, onGenerate, isLoading, label = "Narrar" }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  // Se não tem áudio, mostrar botão de gerar
  if (!audioUrl) {
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

  // Player horizontal elegante
  return (
    <div className="w-full bg-[#2a1f1f] border border-primary/20 rounded-lg p-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 shrink-0"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-primary" />
          ) : (
            <Play className="h-5 w-5 text-primary ml-0.5" />
          )}
        </Button>

        {/* Progress Bar */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-10 text-right font-mono">
            {formatTime(currentTime)}
          </span>
          
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          
          <span className="text-xs text-muted-foreground w-10 font-mono">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
