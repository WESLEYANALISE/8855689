import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Camera, Loader2, Trash2, RefreshCw, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GerenciadorBackgroundModalProps {
  backgroundUrl: string | null;
  opacity: number;
  isGenerating: boolean;
  onGenerate: () => Promise<void>;
  onDelete: () => Promise<void>;
  onOpacityChange: (value: number) => void;
  triggerClassName?: string;
}

export function GerenciadorBackgroundModal({
  backgroundUrl,
  opacity,
  isGenerating,
  onGenerate,
  onDelete,
  onOpacityChange,
  triggerClassName
}: GerenciadorBackgroundModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all",
            triggerClassName
          )}
        >
          <Camera className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Gerenciar Fundo
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Visualização
            </label>
            <div className="relative w-full h-32 rounded-xl overflow-hidden bg-muted border border-border">
              {backgroundUrl ? (
                <>
                  <img 
                    src={backgroundUrl} 
                    alt="Background preview"
                    className="w-full h-full object-cover"
                    style={{ opacity }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Nenhuma imagem definida
                </div>
              )}
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                Opacidade
              </label>
              <span className="text-sm text-foreground font-medium">
                {Math.round(opacity * 100)}%
              </span>
            </div>
            <Slider
              value={[opacity]}
              min={0.1}
              max={0.8}
              step={0.05}
              onValueChange={([value]) => onOpacityChange(value)}
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex-1"
              variant="default"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {backgroundUrl ? 'Gerar Nova' : 'Gerar Imagem'}
                </>
              )}
            </Button>
            
            {backgroundUrl && (
              <Button
                onClick={onDelete}
                variant="destructive"
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            A imagem é gerada por IA e pode levar alguns segundos
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
