import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";

interface LeiFavoritaButtonProps {
  isFavorita: boolean;
  isLoading?: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export function LeiFavoritaButton({ 
  isFavorita, 
  isLoading,
  onClick, 
  className 
}: LeiFavoritaButtonProps) {
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    onClick(e);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "p-1.5 rounded-full transition-all duration-300",
          "hover:scale-110 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-amber-500/50",
          isFavorita 
            ? "text-amber-500" 
            : "text-muted-foreground hover:text-amber-400",
          isLoading && "opacity-50 cursor-not-allowed",
          className
        )}
        aria-label={isFavorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Star 
          className={cn(
            "w-5 h-5 transition-all duration-300",
            isFavorita && "fill-current animate-[pulse_0.3s_ease-in-out]"
          )} 
        />
      </button>

      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="Faça login para favoritar"
        description="Salve seus artigos favoritos para acessar rapidamente depois."
      />
    </>
  );
}
