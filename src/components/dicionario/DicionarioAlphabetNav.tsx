import { cn } from "@/lib/utils";

interface DicionarioAlphabetNavProps {
  letters: string[];
  currentLetter?: string;
  onLetterClick: (letter: string) => void;
  vertical?: boolean;
  className?: string;
}

export const DicionarioAlphabetNav = ({
  letters,
  currentLetter,
  onLetterClick,
  vertical = false,
  className,
}: DicionarioAlphabetNavProps) => {
  return (
    <nav
      className={cn(
        "flex gap-0.5",
        vertical 
          ? "flex-col sticky top-20 self-start" 
          : "flex-wrap justify-center",
        className
      )}
    >
      {letters.map((letter) => (
        <button
          key={letter}
          onClick={() => onLetterClick(letter)}
          className={cn(
            "transition-all duration-150 font-semibold",
            vertical
              ? "w-8 h-7 text-xs rounded-md"
              : "w-9 h-9 text-sm rounded-lg",
            currentLetter === letter
              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
              : "bg-card/50 text-muted-foreground hover:bg-amber-500/20 hover:text-amber-400"
          )}
        >
          {letter}
        </button>
      ))}
    </nav>
  );
};
