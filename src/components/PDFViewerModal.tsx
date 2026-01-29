import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, ZoomIn, ZoomOut, Maximize, Bookmark, BookmarkCheck, Eye, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Sun, Moon, Coffee, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { processDriveUrl } from "@/lib/driveUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  normalModeUrl: string;
  verticalModeUrl: string;
  title: string;
  viewMode?: 'normal' | 'vertical';
}

interface BookmarkItem {
  id: string;
  position: number;
  timestamp: Date;
  label: string;
}

type ReadingMode = 'light' | 'dark' | 'sepia';
type TextWidth = 60 | 80 | 100;

const PDFViewerModal = ({ isOpen, onClose, normalModeUrl, verticalModeUrl, title, viewMode = 'normal' }: PDFViewerModalProps) => {
  const isMobile = useIsMobile();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Estados para recursos premium (apenas modo vertical)
  const [zoomLevel, setZoomLevel] = useState(100);
  const [readingProgress, setReadingProgress] = useState(0);
  const [readingMode, setReadingMode] = useState<ReadingMode>('light');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isZenMode, setIsZenMode] = useState(false);
  const [textWidth, setTextWidth] = useState<TextWidth>(100);
  
  // Selecionar URL baseado no modo
  const urlToUse = viewMode === 'normal' ? normalModeUrl : verticalModeUrl;
  const processedUrl = processDriveUrl(urlToUse, viewMode);
  
  // Carregar bookmarks salvos
  useEffect(() => {
    if (viewMode === 'vertical') {
      const saved = localStorage.getItem(`bookmarks-${title}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setBookmarks(parsed.map((b: any) => ({
            ...b,
            timestamp: new Date(b.timestamp)
          })));
        } catch (e) {
          console.error('Erro ao carregar bookmarks:', e);
        }
      }
    }
  }, [title, viewMode]);
  
  // Aplicar zoom ao iframe
  useEffect(() => {
    if (iframeRef.current && viewMode === 'vertical') {
      const container = iframeRef.current.parentElement;
      if (container) {
        container.style.transform = `scale(${zoomLevel / 100})`;
        container.style.transformOrigin = 'top center';
        container.style.transition = 'transform 0.2s ease-out';
      }
    }
  }, [zoomLevel, viewMode]);
  
  // Suporte para pinch-to-zoom (gestos de pinça)
  useEffect(() => {
    if (!iframeRef.current || viewMode !== 'vertical') return;
    
    const container = iframeRef.current.parentElement;
    if (!container) return;
    
    let initialDistance = 0;
    let initialZoom = zoomLevel;
    
    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches);
        initialZoom = zoomLevel;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const scale = currentDistance / initialDistance;
        const newZoom = Math.min(Math.max(initialZoom * scale, 50), 200);
        setZoomLevel(Math.round(newZoom));
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialDistance = 0;
      }
    };
    
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [viewMode, zoomLevel]);
  
  // Monitorar progresso de leitura
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || viewMode !== 'vertical') return;
    
    const handleScroll = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
          const scrollHeight = (doc.documentElement.scrollHeight || doc.body.scrollHeight) - 
                              (doc.documentElement.clientHeight || doc.body.clientHeight);
          if (scrollHeight > 0) {
            const progress = (scrollTop / scrollHeight) * 100;
            setReadingProgress(Math.min(Math.max(progress, 0), 100));
          }
        }
      } catch (e) {
        // Cross-origin iframe
      }
    };
    
    const onLoad = () => {
      iframe.contentWindow?.addEventListener('scroll', handleScroll);
      handleScroll();
    };
    
    iframe.addEventListener('load', onLoad);
    
    return () => {
      iframe.removeEventListener('load', onLoad);
    };
  }, [viewMode]);
  
  // Funções de controle
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoomLevel(100);
  
  const addBookmark = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const scrollPos = doc?.documentElement.scrollTop || doc?.body.scrollTop || 0;
      const progress = Math.round(readingProgress);
      
      const newBookmark: BookmarkItem = {
        id: Date.now().toString(),
        position: scrollPos,
        timestamp: new Date(),
        label: `${progress}% - ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      };
      
      const updatedBookmarks = [...bookmarks, newBookmark];
      setBookmarks(updatedBookmarks);
      localStorage.setItem(`bookmarks-${title}`, JSON.stringify(updatedBookmarks));
      
      toast({
        title: "Marcador adicionado",
        description: newBookmark.label,
      });
    } catch (e) {
      console.error('Erro ao adicionar bookmark:', e);
    }
  };
  
  const goToBookmark = (position: number) => {
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      doc?.documentElement.scrollTo({ top: position, behavior: 'smooth' });
    } catch (e) {
      console.error('Erro ao ir para bookmark:', e);
    }
  };
  
  const deleteBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(updatedBookmarks);
    localStorage.setItem(`bookmarks-${title}`, JSON.stringify(updatedBookmarks));
  };
  
  const scrollToTop = () => {
    try {
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      doc?.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  };
  
  const scrollToBottom = () => {
    try {
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      const maxScroll = (doc?.documentElement.scrollHeight || 0) - (doc?.documentElement.clientHeight || 0);
      doc?.documentElement.scrollTo({ top: maxScroll, behavior: 'smooth' });
    } catch (e) {}
  };
  
  const scrollBySection = (direction: 'next' | 'prev') => {
    try {
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      const viewportHeight = doc?.documentElement.clientHeight || 0;
      const currentScroll = doc?.documentElement.scrollTop || 0;
      const delta = viewportHeight * 0.8; // 80% da altura da viewport
      
      const newScroll = direction === 'next' ? currentScroll + delta : currentScroll - delta;
      doc?.documentElement.scrollTo({ top: newScroll, behavior: 'smooth' });
    } catch (e) {}
  };
  
  const getReadingModeStyles = () => {
    switch (readingMode) {
      case 'dark':
        return 'bg-gray-900';
      case 'sepia':
        return 'bg-[#f4ecd8]';
      default:
        return 'bg-background';
    }
  };
  
  const getReadingModeIcon = () => {
    switch (readingMode) {
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'sepia':
        return <Coffee className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };
  
  const cycleReadingMode = () => {
    const modes: ReadingMode[] = ['light', 'dark', 'sepia'];
    const currentIndex = modes.indexOf(readingMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setReadingMode(modes[nextIndex]);
  };
  
  const isVerticalMode = viewMode === 'vertical';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full w-full h-screen max-h-screen p-0 m-0 rounded-none border-0">
        <div className={`flex flex-col h-full ${getReadingModeStyles()}`}>
          {/* Barra de Progresso */}
          {isVerticalMode && !isZenMode && (
            <div className="h-1 bg-muted relative">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${readingProgress}%` }}
              />
            </div>
          )}
          
          {/* Header */}
          {!isZenMode && (
            <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border flex-wrap">
              <Button
                onClick={onClose}
                variant="destructive"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              
              <h2 className="text-sm md:text-lg font-semibold text-foreground flex-1 min-w-0 truncate">
                {title}
              </h2>
              
              {/* Controles removidos conforme solicitado */}
            </div>
          )}
          
          {/* Botão Sair do Zen */}
          {isZenMode && (
            <Button
              onClick={() => setIsZenMode(false)}
              className="absolute top-4 right-4 z-50"
              size="sm"
            >
              <Minimize2 className="w-4 h-4 mr-2" />
              Sair do Zen
            </Button>
          )}
          
          {/* Conteúdo do PDF */}
          <div className="flex-1 overflow-auto relative">
            <div 
              className="h-full flex justify-center touch-pan-y"
              style={{ 
                width: '100%',
                margin: '0 auto',
                minHeight: '100%'
              }}
            >
              <iframe
                ref={iframeRef}
                src={processedUrl}
                className="w-full h-full"
                title={title}
                style={{
                  touchAction: 'pan-y pinch-zoom'
                }}
              />
            </div>
            
            {/* Controles de Zoom (Modo Vertical) */}
            {isVerticalMode && !isZenMode && (
              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-40">
                <Button
                  onClick={handleZoomIn}
                  size="icon"
                  variant="secondary"
                  className="shadow-lg h-12 w-12 rounded-full touch-manipulation"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="w-5 h-5" />
                </Button>
                <div className="bg-secondary/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-center">
                  {zoomLevel}%
                </div>
                <Button
                  onClick={handleZoomOut}
                  size="icon"
                  variant="secondary"
                  className="shadow-lg h-12 w-12 rounded-full touch-manipulation"
                  title="Diminuir zoom"
                >
                  <ZoomOut className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewerModal;