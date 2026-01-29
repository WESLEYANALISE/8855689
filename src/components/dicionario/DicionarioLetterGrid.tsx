import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LetterData {
  letter: string;
  count: number;
  available: boolean;
}

interface DicionarioLetterGridProps {
  lettersData: LetterData[];
  isLoading?: boolean;
}

// Mapa de letras acentuadas para letras base
const ACCENT_MAP: Record<string, string> = {
  'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A',
  'É': 'E', 'Ê': 'E',
  'Í': 'I', 'Î': 'I',
  'Ó': 'O', 'Ô': 'O', 'Õ': 'O',
  'Ú': 'U', 'Û': 'U',
  'Ç': 'C',
};

export const normalizeToBaseLetter = (letter: string): string => {
  const upper = letter.toUpperCase();
  return ACCENT_MAP[upper] || upper;
};

export const DicionarioLetterGrid = ({ lettersData, isLoading }: DicionarioLetterGridProps) => {
  const navigate = useNavigate();

  const handleLetterClick = (letter: string, available: boolean) => {
    if (available) {
      navigate(`/dicionario/${letter}`);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-13 gap-2">
        {Array.from({ length: 26 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-card/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-13 gap-2">
      {lettersData.map((item, index) => (
        <motion.button
          key={item.letter}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.02, duration: 0.2 }}
          onClick={() => handleLetterClick(item.letter, item.available)}
          disabled={!item.available}
          className={cn(
            "aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200",
            "border border-border/50 relative overflow-hidden group",
            item.available
              ? "bg-card hover:bg-amber-500/20 hover:border-amber-500/50 hover:scale-105 cursor-pointer"
              : "bg-card/30 opacity-40 cursor-not-allowed"
          )}
        >
          {/* Glow effect on hover */}
          {item.available && (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-600/0 group-hover:from-amber-500/10 group-hover:to-amber-600/20 transition-all duration-300" />
          )}
          
          <span className={cn(
            "text-xl sm:text-2xl font-bold relative z-10",
            item.available ? "text-foreground group-hover:text-amber-400" : "text-muted-foreground/50"
          )}>
            {item.letter}
          </span>
          
          {item.available && item.count > 0 && (
            <span className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-amber-400/80 relative z-10">
              {item.count}
            </span>
          )}
        </motion.button>
      ))}
    </div>
  );
};
