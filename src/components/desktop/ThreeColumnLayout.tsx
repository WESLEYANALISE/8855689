import { ReactNode, useState, useCallback } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThreeColumnLayoutProps {
  /** Sidebar de navegação (esquerda) */
  navigation: ReactNode;
  /** Conteúdo principal (centro) */
  content: ReactNode;
  /** Painel de detalhes (direita) - opcional */
  detail?: ReactNode;
  /** Título do painel de detalhes */
  detailTitle?: string;
  /** Largura mínima do painel de navegação */
  navMinWidth?: number;
  /** Largura default do painel de navegação (%) */
  navDefaultWidth?: number;
  /** Largura mínima do painel de detalhes */
  detailMinWidth?: number;
  /** Largura default do painel de detalhes (%) */
  detailDefaultWidth?: number;
  /** Callback para fechar painel de detalhes */
  onCloseDetail?: () => void;
  /** Classes CSS adicionais */
  className?: string;
  /** Se deve mostrar o painel de detalhes */
  showDetail?: boolean;
}

export const ThreeColumnLayout = ({
  navigation,
  content,
  detail,
  detailTitle,
  navMinWidth = 280,
  navDefaultWidth = 25,
  detailMinWidth = 400,
  detailDefaultWidth = 40,
  onCloseDetail,
  className,
  showDetail = false
}: ThreeColumnLayoutProps) => {
  const [navCollapsed, setNavCollapsed] = useState(false);

  const toggleNav = useCallback(() => {
    setNavCollapsed(prev => !prev);
  }, []);

  return (
    <div className={cn("h-[calc(100vh-3.5rem)] flex", className)}>
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Painel de Navegação */}
        <ResizablePanel 
          defaultSize={navCollapsed ? 4 : navDefaultWidth} 
          minSize={navCollapsed ? 4 : 12}
          maxSize={navCollapsed ? 4 : 35}
          collapsible
          collapsedSize={5}
          onCollapse={() => setNavCollapsed(true)}
          onExpand={() => setNavCollapsed(false)}
          className="relative"
        >
          <div className={cn(
            "h-full bg-card/50 border-r border-border overflow-hidden flex flex-col",
            navCollapsed && "items-center"
          )}>
            {/* Toggle button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleNav}
              className="absolute top-3 right-2 z-10 h-7 w-7 bg-background/80 hover:bg-background"
            >
              {navCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            
            {/* Navegação */}
            <div className={cn(
              "flex-1 overflow-y-auto",
              navCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
              {navigation}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-border hover:bg-primary/20 transition-colors w-1" />

        {/* Conteúdo Principal */}
        <ResizablePanel 
          defaultSize={showDetail ? (100 - navDefaultWidth - detailDefaultWidth) : (100 - navDefaultWidth)} 
          minSize={25}
        >
          <div className="h-full overflow-y-auto bg-background">
            {content}
          </div>
        </ResizablePanel>

        {/* Painel de Detalhes - Condicional */}
        {showDetail && detail && (
          <>
            <ResizableHandle withHandle className="bg-border hover:bg-primary/20 transition-colors w-1" />
            
            <ResizablePanel 
              defaultSize={detailDefaultWidth} 
              minSize={25}
              maxSize={55}
            >
              <div className="h-full bg-card/30 border-l border-border flex flex-col">
                {/* Header do painel */}
                {(detailTitle || onCloseDetail) && (
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
                    {detailTitle && (
                      <h3 className="text-base font-semibold text-foreground truncate">{detailTitle}</h3>
                    )}
                    {onCloseDetail && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCloseDetail}
                        className="h-8 w-8 ml-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Conteúdo do detalhe */}
                <div className="flex-1 overflow-y-auto">
                  {detail}
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default ThreeColumnLayout;
