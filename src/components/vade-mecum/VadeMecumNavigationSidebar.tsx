import { BookOpen, FileText, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChapterStructure {
  name: string;
  articles: any[];
  count: number;
}

interface VadeMecumNavigationSidebarProps {
  codeName: string;
  structure: ChapterStructure[];
  selectedChapter: string | null;
  onSelectChapter: (chapter: string | null) => void;
  totalArticles: number;
}

export const VadeMecumNavigationSidebar = ({
  codeName,
  structure,
  selectedChapter,
  onSelectChapter,
  totalArticles
}: VadeMecumNavigationSidebarProps) => {
  // A estrutura já vem na ordem cronológica correta do VadeMecumDesktopLayout

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/30">
        <div className="flex items-center gap-3">
          <Scale className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">{codeName}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {totalArticles} artigos
        </div>
      </div>

      {/* Navegação */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Botão "Todos os artigos" */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedChapter === null ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onSelectChapter(null)}
                  className={cn(
                    "w-full justify-start text-sm h-10 px-3",
                    selectedChapter === null && "bg-primary/10 text-primary border border-primary/30"
                  )}
                >
                  <FileText className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span className="truncate">Todos os artigos</span>
                  <span className="ml-auto text-xs text-muted-foreground font-medium">{totalArticles}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Ver todos os {totalArticles} artigos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Lista de seções na ordem cronológica */}
          <div className="space-y-1 mt-2">
            {structure.map((item) => (
              <TooltipProvider key={item.name} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedChapter === item.name ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => onSelectChapter(item.name)}
                      className={cn(
                        "w-full justify-start text-sm h-9 px-3",
                        selectedChapter === item.name && "bg-primary/10 text-primary border border-primary/30"
                      )}
                    >
                      <BookOpen className="h-4 w-4 mr-3 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate text-left flex-1">
                        {item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">{item.count}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.count} artigos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Footer com atalhos */}
      <div className="p-3 border-t border-border bg-card/30">
        <div className="text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">↑↓</kbd>
            <span>Navegar artigos</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">/</kbd>
            <span>Buscar</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Esc</kbd>
            <span>Fechar painel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VadeMecumNavigationSidebar;
