import { formatTime } from "@/hooks/useVideoProgress";
import { cn } from "@/lib/utils";

interface VideoProgressBarProps {
  currentTime: number;
  duration: number;
  className?: string;
}

const VideoProgressBar = ({
  currentTime,
  duration,
  className,
}: VideoProgressBarProps) => {
  const percentage = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Barra de progresso */}
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Tempo e porcentagem */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <span className="font-medium text-red-400">
          {percentage}%
        </span>
      </div>
    </div>
  );
};

export default VideoProgressBar;
