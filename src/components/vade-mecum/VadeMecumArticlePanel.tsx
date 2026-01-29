import { useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração"?: string | null;
}

interface VadeMecumArticlePanelProps {
  articles: Article[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedArticle: Article | null;
  onSelectArticle: (article: Article) => void;
  codeName: string;
  totalCount: number;
  targetArticle?: string | null;
}

export const VadeMecumArticlePanel = ({
  articles,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedArticle,
  onSelectArticle,
  codeName,
  totalCount,
  targetArticle
}: VadeMecumArticlePanelProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const articleRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Auto-scroll para artigo alvo
  useEffect(() => {
    if (targetArticle && articles.length > 0) {
      const targetArt = articles.find(a => 
        a["Número do Artigo"]?.toLowerCase().includes(targetArticle.toLowerCase())
      );
      if (targetArt) {
        const ref = articleRefs.current.get(targetArt.id);
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
          onSelectArticle(targetArt);
        }
      }
    }
  }, [targetArticle, articles, onSelectArticle]);

  // Atalho de teclado para busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'f' && (e.ctrlKey || e.metaKey)) || e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Truncar texto do artigo para preview
  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header com busca */}
      <div className="p-4 border-b border-border bg-card/30 sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar artigo... (Ctrl+F ou /)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-11 text-sm bg-background/50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Contador de resultados */}
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {searchQuery 
              ? `${articles.length} resultado${articles.length !== 1 ? 's' : ''}`
              : `${articles.length} de ${totalCount} artigos`
            }
          </span>
          {selectedArticle && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              Selecionado: Art. {selectedArticle["Número do Artigo"]}
            </span>
          )}
        </div>
      </div>

      {/* Lista de artigos */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            // Skeleton loading
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card/30">
                <Skeleton className="h-5 w-20 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-base">Nenhum artigo encontrado</p>
              <p className="text-sm mt-1">Tente buscar por outro termo</p>
            </div>
          ) : (
            articles.map((article) => {
              const isSelected = selectedArticle?.id === article.id;
              const hasAudio = !!article["Narração"];
              
              return (
                <div
                  key={article.id}
                  ref={(el) => {
                    if (el) articleRefs.current.set(article.id, el);
                  }}
                  onClick={() => onSelectArticle(article)}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all duration-200",
                    "hover:bg-primary/5 hover:border-primary/40 hover:shadow-sm",
                    isSelected 
                      ? "bg-primary/10 border-primary/50 shadow-md ring-1 ring-primary/20" 
                      : "bg-card/40 border-border"
                  )}
                >
                  {/* Número do artigo */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "text-sm font-bold",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      Art. {article["Número do Artigo"]}
                    </span>
                    
                    {hasAudio && (
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Possui áudio" />
                    )}
                  </div>
                  
                  {/* Preview do conteúdo */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {truncateText(article["Artigo"] || 'Conteúdo não disponível', 220)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default VadeMecumArticlePanel;
