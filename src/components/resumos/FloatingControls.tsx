import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Plus, Minus } from "lucide-react";

interface FloatingControlsProps {
  onFontSizeChange?: (size: number) => void;
  initialFontSize?: number;
}

export const FloatingControls = ({ 
  onFontSizeChange, 
  initialFontSize = 0 
}: FloatingControlsProps) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState(initialFontSize);

  // Detectar scroll para mostrar botão "voltar ao topo"
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Salvar preferência de fonte no localStorage
  useEffect(() => {
    localStorage.setItem("resumo-font-size", String(fontSizeLevel));
    onFontSizeChange?.(fontSizeLevel);
  }, [fontSizeLevel, onFontSizeChange]);

  // Carregar preferência salva
  useEffect(() => {
    const saved = localStorage.getItem("resumo-font-size");
    if (saved) {
      setFontSizeLevel(parseInt(saved));
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const increaseFontSize = () => {
    if (fontSizeLevel < 3) {
      setFontSizeLevel(prev => prev + 1);
    }
  };

  const decreaseFontSize = () => {
    if (fontSizeLevel > -2) {
      setFontSizeLevel(prev => prev - 1);
    }
  };

  return (
    <div className="fixed bottom-20 right-3 z-50 flex flex-col gap-2">
      {/* Controles de fonte */}
      <div className="flex flex-col gap-1 bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={increaseFontSize}
          disabled={fontSizeLevel >= 3}
          className="h-8 w-8 rounded-md hover:bg-primary/20"
          title="Aumentar fonte"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <div className="text-center text-xs text-muted-foreground font-medium">
          Aa
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={decreaseFontSize}
          disabled={fontSizeLevel <= -2}
          className="h-8 w-8 rounded-md hover:bg-primary/20"
          title="Diminuir fonte"
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>

      {/* Botão voltar ao topo */}
      {showBackToTop && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollToTop}
          className="h-10 w-10 rounded-full bg-card/95 backdrop-blur-sm border-border shadow-lg hover:bg-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-200"
          title="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};
