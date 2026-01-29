import { AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioCommentButtonProps {
  isPlaying: boolean;
  onClick: () => void;
  progress?: number; // Progresso de 0 a 100
}

const AudioCommentButton = ({ isPlaying, onClick, progress = 0 }: AudioCommentButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm shadow-md hover:shadow-lg hover:scale-105 animate-fade-in relative overflow-hidden bg-secondary/50 hover:bg-secondary text-foreground"
      )}
    >
      {/* Barra de progresso de fundo */}
      {isPlaying && progress > 0 && (
        <div 
          className="absolute left-0 top-0 h-full bg-accent/20 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-2">
        <AudioLines className={cn("w-4 h-4", isPlaying && "animate-pulse")} />
        <span className="font-medium">{isPlaying ? "Comentando" : "Comentário"}</span>
      </div>
    </button>
  );
};

export default AudioCommentButton;
