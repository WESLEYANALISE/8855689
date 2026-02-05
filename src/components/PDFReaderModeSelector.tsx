import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, ScrollText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PDFReaderModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'normal' | 'vertical' | 'dinamica') => void;
  bookTitle: string;
  hasLeituraDinamica?: boolean;
  isAdmin?: boolean;
}

const PDFReaderModeSelector = ({ 
  isOpen, 
  onClose, 
  onSelectMode, 
  bookTitle,
  hasLeituraDinamica = false,
  isAdmin = false
}: PDFReaderModeSelectorProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-4 sm:p-6">
        <DialogHeader className="space-y-2 pb-2">
          <DialogTitle className="text-center text-lg sm:text-xl font-bold">
            Como você quer ler?
          </DialogTitle>
          <p className="text-xs text-muted-foreground text-center line-clamp-1">{bookTitle}</p>
        </DialogHeader>
        
        <div className={`grid gap-3 sm:gap-4 ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <Card 
            className="group relative p-4 sm:p-6 cursor-pointer transition-all duration-300 border-2 hover:border-primary hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
            onClick={() => onSelectMode('normal')}
          >
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
              <div className="p-3 sm:p-4 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-base mb-1">
                  Páginas
                </h3>
                <p className="text-[9px] sm:text-xs text-muted-foreground leading-tight">
                  Virar páginas
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="group relative p-4 sm:p-6 cursor-pointer transition-all duration-300 border-2 hover:border-accent hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
            onClick={() => onSelectMode('vertical')}
          >
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
              <div className="p-3 sm:p-4 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <ScrollText className="w-6 h-6 sm:w-10 sm:h-10 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-base mb-1">
                  Vertical
                </h3>
                <p className="text-[9px] sm:text-xs text-muted-foreground leading-tight">
                  Scroll contínuo
                </p>
              </div>
            </div>
          </Card>

          {isAdmin && (
            <Card 
              className="group relative p-4 sm:p-6 cursor-pointer transition-all duration-300 border-2 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 active:scale-95"
              onClick={() => onSelectMode('dinamica')}
            >
              <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                <div className="p-3 sm:p-4 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Sparkles className="w-6 h-6 sm:w-10 sm:h-10 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-base mb-1">
                    Dinâmica
                  </h3>
                  <p className="text-[9px] sm:text-xs text-muted-foreground leading-tight">
                    Texto formatado
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFReaderModeSelector;
