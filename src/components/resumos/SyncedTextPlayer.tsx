import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface Timepoint {
  markName: string;
  timeSeconds: number;
}

interface SyncedTextPlayerProps {
  text: string;
  audioUrl?: string;
  timepoints?: Timepoint[];
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  autoScroll?: boolean;
}

export const SyncedTextPlayer = ({
  text,
  audioUrl,
  timepoints,
  onPlay,
  onPause,
  onEnded,
  autoScroll = true
}: SyncedTextPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Parse text into words while preserving structure
  const words = useMemo(() => {
    if (!text) return [];
    // Remove markdown and split into words
    const cleanText = text
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/>\s?/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-*+]\s/g, ' ')
      .trim();
    
    return cleanText.split(/\s+/).filter(Boolean);
  }, [text]);

  // Map timepoints to word indices
  const wordTimings = useMemo(() => {
    if (!timepoints || timepoints.length === 0) {
      // Estimate based on average speaking rate if no timepoints
      const avgWordDuration = 0.35; // ~170 words per minute
      return words.map((_, i) => i * avgWordDuration);
    }
    
    // Use actual timepoints
    return timepoints.map(tp => tp.timeSeconds);
  }, [timepoints, words]);

  // Update current word based on audio time
  useEffect(() => {
    if (!isPlaying || wordTimings.length === 0) return;

    let newIndex = -1;
    for (let i = wordTimings.length - 1; i >= 0; i--) {
      if (currentTime >= wordTimings[i]) {
        newIndex = i;
        break;
      }
    }

    if (newIndex !== currentWordIndex) {
      setCurrentWordIndex(newIndex);
    }
  }, [currentTime, wordTimings, isPlaying, currentWordIndex]);

  // Auto-scroll to current word
  useEffect(() => {
    if (!autoScroll || currentWordIndex < 0) return;
    
    const wordEl = wordRefs.current[currentWordIndex];
    if (wordEl && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const wordRect = wordEl.getBoundingClientRect();
      
      // Check if word is outside visible area
      if (wordRect.top < containerRect.top || wordRect.bottom > containerRect.bottom) {
        wordEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentWordIndex, autoScroll]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handlePlay = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
      onPlay?.();
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPause?.();
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentWordIndex(-1);
    onEnded?.();
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setCurrentWordIndex(-1);
    }
  };

  const handleWordClick = (index: number) => {
    if (audioRef.current && wordTimings[index] !== undefined) {
      audioRef.current.currentTime = wordTimings[index];
      setCurrentTime(wordTimings[index]);
      if (!isPlaying) {
        handlePlay();
      }
    }
  };

  if (!audioUrl) {
    // Render without sync if no audio
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="leading-relaxed">{text}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Audio Controls */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={isPlaying ? handlePause : handlePlay}
          className="h-10 w-10 rounded-full"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestart}
          className="h-8 w-8 rounded-full"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 text-sm text-muted-foreground">
          {isPlaying ? 'Acompanhe a leitura...' : 'Clique para ouvir e acompanhar'}
        </div>
      </div>

      {/* Synced Text */}
      <div 
        ref={containerRef}
        className="max-h-[60vh] overflow-y-auto p-4 bg-background rounded-lg border scroll-smooth"
      >
        <p className="leading-loose text-base">
          {words.map((word, index) => (
            <span
              key={index}
              ref={el => wordRefs.current[index] = el}
              onClick={() => handleWordClick(index)}
              className={`
                cursor-pointer transition-all duration-150 px-0.5 rounded
                ${index === currentWordIndex 
                  ? 'bg-primary/30 text-primary font-semibold scale-105 inline-block' 
                  : index < currentWordIndex 
                    ? 'text-muted-foreground' 
                    : 'hover:bg-muted'
                }
              `}
            >
              {word}{' '}
            </span>
          ))}
        </p>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />
    </div>
  );
};

export default SyncedTextPlayer;
