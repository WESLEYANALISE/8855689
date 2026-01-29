import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { MermaidDiagram } from '@/components/chat/MermaidDiagram';
import { DiagramType } from './DiagramTypeSelector';

interface InfographicPreviewProps {
  codigo: string;
  tipo: DiagramType;
  onRef?: (ref: HTMLDivElement | null) => void;
}

export const InfographicPreview = ({ codigo, tipo, onRef }: InfographicPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };
  
  const handleReset = () => {
    setZoom(100);
  };
  
  const handleFit = () => {
    setZoom(100);
    // Scroll to center
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: (containerRef.current.scrollWidth - containerRef.current.clientWidth) / 2,
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background border border-border/50">
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-border/50">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          title="Diminuir zoom"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <span className="text-xs font-medium px-2 min-w-[3rem] text-center text-muted-foreground">
          {zoom}%
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          title="Aumentar zoom"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleFit}
          title="Ajustar à tela"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleReset}
          title="Resetar zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tipo badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="text-xs font-medium px-2 py-1 bg-primary/20 text-primary rounded-full border border-primary/30">
          {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
        </span>
      </div>

      {/* Diagram container */}
      <div 
        ref={(el) => {
          (containerRef as any).current = el;
          onRef?.(el);
        }}
        className="overflow-auto min-h-[300px] max-h-[600px] p-8 pt-14"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.1) 1px, transparent 0)
          `,
          backgroundSize: '24px 24px',
        }}
      >
        <div 
          className="transition-transform duration-200 ease-out origin-center"
          style={{ 
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center top',
          }}
        >
          <MermaidDiagram 
            chart={codigo} 
            tipo={tipo}
            className="bg-transparent"
          />
        </div>
      </div>

      {/* Gradient overlays for scroll indication */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
};
