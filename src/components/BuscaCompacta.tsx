import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface BuscaCompactaProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  viewMode?: 'lista' | 'expandido';
  onViewModeChange?: (mode: 'lista' | 'expandido') => void;
  resultCount: number;
  isDesktopSidebar?: boolean; // Nova prop para modo sidebar no desktop
}

export const BuscaCompacta = ({
  value,
  onChange,
  onSearch,
  onClear,
  resultCount,
  isDesktopSidebar = false
}: BuscaCompactaProps) => {
  // Modo sidebar para desktop - aparece do lado direito
  if (isDesktopSidebar) {
    return (
      <div className="p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar artigo..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearch();
                }
              }}
              className="pl-9 h-11"
            />
          </div>
          
          <Button
            onClick={onSearch}
            className="w-full bg-amber-500/70 hover:bg-amber-500/90 border border-amber-500/30 text-black"
          >
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
          
          {value && (
            <p className="text-xs text-muted-foreground text-center">
              Buscando Art. {value}...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Modo padrão (mobile ou desktop sem sidebar)
  return (
    <div className="bg-background border-b border-border">
      <div className="px-4 py-3 max-w-4xl mx-auto">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar artigo..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearch();
                }
              }}
              className="pl-9 pr-20 h-11"
            />
            <Button
              onClick={onSearch}
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 bg-amber-500/70 hover:bg-amber-500/90 border border-amber-500/30 text-black"
            >
              Buscar
            </Button>
          </div>
        </div>
        
        {value && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Buscando Art. {value}...
          </p>
        )}
      </div>
    </div>
  );
};
