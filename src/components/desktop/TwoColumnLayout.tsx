import { ReactNode, useState, useCallback } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TwoColumnLayoutProps {
  /** Sidebar/Painel lateral */
  sidebar: ReactNode;
  /** Conteúdo principal */
  content: ReactNode;
  /** Posição do sidebar */
  sidebarPosition?: 'left' | 'right';
  /** Largura mínima do sidebar */
  sidebarMinWidth?: number;
  /** Largura default do sidebar (%) */
  sidebarDefaultWidth?: number;
  /** Se o sidebar pode colapsar */
  collapsible?: boolean;
  /** Callback para fechar sidebar */
  onCloseSidebar?: () => void;
  /** Título do sidebar */
  sidebarTitle?: string;
  /** Classes CSS adicionais */
  className?: string;
}

export const TwoColumnLayout = ({
  sidebar,
  content,
  sidebarPosition = 'left',
  sidebarMinWidth = 280,
  sidebarDefaultWidth = 30,
  collapsible = true,
  onCloseSidebar,
  sidebarTitle,
  className
}: TwoColumnLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const sidebarPanel = (
    <ResizablePanel 
      defaultSize={collapsed ? 4 : sidebarDefaultWidth} 
      minSize={collapsed ? 4 : 15}
      maxSize={collapsed ? 4 : 40}
      collapsible={collapsible}
      collapsedSize={4}
      onCollapse={() => setCollapsed(true)}
      onExpand={() => setCollapsed(false)}
      className="relative"
    >
      <div className={cn(
        "h-full bg-card/50 border-border overflow-hidden flex flex-col",
        sidebarPosition === 'left' ? "border-r" : "border-l",
        collapsed && "items-center"
      )}>
        {/* Header com toggle */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/30">
          {!collapsed && sidebarTitle && (
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {sidebarTitle}
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {collapsible && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="h-6 w-6"
              >
                {collapsed 
                  ? (sidebarPosition === 'left' ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />)
                  : (sidebarPosition === 'left' ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)
                }
              </Button>
            )}
            {onCloseSidebar && !collapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCloseSidebar}
                className="h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Conteúdo do sidebar */}
        <div className={cn(
          "flex-1 overflow-y-auto",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
          {sidebar}
        </div>
      </div>
    </ResizablePanel>
  );

  const contentPanel = (
    <ResizablePanel 
      defaultSize={100 - sidebarDefaultWidth} 
      minSize={40}
    >
      <div className="h-full overflow-y-auto bg-background">
        {content}
      </div>
    </ResizablePanel>
  );

  return (
    <div className={cn("h-[calc(100vh-4rem)] flex", className)}>
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {sidebarPosition === 'left' ? (
          <>
            {sidebarPanel}
            <ResizableHandle withHandle className="bg-border hover:bg-primary/20 transition-colors" />
            {contentPanel}
          </>
        ) : (
          <>
            {contentPanel}
            <ResizableHandle withHandle className="bg-border hover:bg-primary/20 transition-colors" />
            {sidebarPanel}
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default TwoColumnLayout;
