import { Check, Eraser, X, Info } from "lucide-react";
import { HIGHLIGHT_COLORS } from "@/hooks/useArtigoGrifos";
import { cn } from "@/lib/utils";

interface HighlightColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  onClearAll?: () => void;
  onClose: () => void;
  hasHighlights?: boolean;
}

export const HighlightColorPicker = ({
  selectedColor,
  onSelectColor,
  onClearAll,
  onClose,
  hasHighlights = false
}: HighlightColorPickerProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border safe-area-bottom animate-in slide-in-from-bottom duration-200">
      <div className="max-w-md mx-auto p-3">
        {/* Header compacto */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Arraste o dedo sobre o texto para grifar
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Cores e ações em uma linha */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground/70 mr-1">Cor:</span>
            {HIGHLIGHT_COLORS.map(({ name, color }) => (
              <button
                key={color}
                onClick={() => onSelectColor(color)}
                className={cn(
                  "w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center shadow-sm",
                  "border-2",
                  selectedColor === color 
                    ? "border-foreground scale-110" 
                    : "border-white/50 hover:scale-105"
                )}
                style={{ backgroundColor: color }}
                title={name}
              >
                {selectedColor === color && (
                  <Check className="w-4 h-4 text-gray-700" />
                )}
              </button>
            ))}
          </div>
          
          {/* Botão de limpar todos */}
          {hasHighlights && onClearAll && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-destructive/20 hover:text-destructive transition-all duration-200 text-xs font-medium"
              title="Limpar todos os destaques"
            >
              <Eraser className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
