import { GraduationCap } from "lucide-react";
import { Button } from "./ui/button";

interface FloatingProfessoraButtonProps {
  onClick: () => void;
}

export const FloatingProfessoraButton = ({ onClick }: FloatingProfessoraButtonProps) => {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-24 right-4 md:right-8 z-50 w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 animate-fade-in bg-gradient-to-br from-primary to-primary/80"
    >
      <div className="flex flex-col items-center justify-center">
        <GraduationCap className="w-7 h-7 md:w-9 md:h-9" />
        <span className="text-[8px] md:text-[9px] font-semibold mt-0.5">Professora</span>
      </div>
    </Button>
  );
};
