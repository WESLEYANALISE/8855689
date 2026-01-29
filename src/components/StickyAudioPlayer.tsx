import { useState, useRef, useEffect } from "react";
import { X, Play, Pause, Volume2, VolumeX, AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface StickyAudioPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  audioUrl: string;
  title: string;
}

const StickyAudioPlayer = ({ isOpen, onClose, audioUrl, title }: StickyAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!isOpen) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setCurrentTime(0);
    } else if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-30 animate-fade-in-down border-b border-border shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card/95 backdrop-blur-sm p-4">
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />
          
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <Button
              onClick={togglePlayPause}
              size="icon"
              className="h-10 w-10 rounded-full shrink-0 hover:scale-110 transition-transform animate-pulse-glow"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
            
            {/* Progress and Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground mb-1 truncate">
                {title}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatTime(currentTime)}
                </span>
                
                <div className="flex-1">
                  <Progress 
                    value={(currentTime / duration) * 100} 
                    className="h-1.5 cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percent = (e.clientX - rect.left) / rect.width;
                      handleSeek([percent * duration]);
                    }}
                  />
                </div>
                
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
            
            {/* Volume Control */}
            <Button
              onClick={toggleMute}
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            {/* Close Button */}
            <Button
              onClick={onClose}
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyAudioPlayer;
