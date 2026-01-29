import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BotaoExplicacaoProps {
  onClick: () => void;
  className?: string;
  size?: "sm" | "md";
  title?: string;
}

export function BotaoExplicacao({ 
  onClick, 
  className, 
  size = "sm",
  title = "Explicar com IA" 
}: BotaoExplicacaoProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors",
        size === "sm" ? "h-6 w-6" : "h-8 w-8",
        className
      )}
      title={title}
      aria-label={title}
    >
      <Lightbulb className={cn(size === "sm" ? "w-4 h-4" : "w-5 h-5")} />
    </Button>
  );
}
