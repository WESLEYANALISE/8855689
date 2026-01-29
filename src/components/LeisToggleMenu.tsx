import { List, Star, Clock } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type FilterMode = 'todos' | 'favoritos' | 'recentes';

interface LeisToggleMenuProps {
  value: FilterMode;
  onChange: (value: FilterMode) => void;
  favoritosCount?: number;
  recentesCount?: number;
  className?: string;
}

export function LeisToggleMenu({ 
  value, 
  onChange, 
  favoritosCount = 0,
  recentesCount = 0,
  className 
}: LeisToggleMenuProps) {
  return (
    <div className={cn("w-full", className)}>
      <ToggleGroup 
        type="single" 
        value={value} 
        onValueChange={(v) => v && onChange(v as FilterMode)}
        className="w-full justify-start gap-2 bg-card/50 p-1 rounded-lg border border-border/50"
      >
        <ToggleGroupItem 
          value="todos" 
          aria-label="Todos"
          className={cn(
            "flex-1 gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
            "transition-all duration-200"
          )}
        >
          <List className="w-4 h-4" />
          <span className="text-sm font-medium">Todos</span>
        </ToggleGroupItem>
        
        <ToggleGroupItem 
          value="favoritos" 
          aria-label="Favoritos"
          className={cn(
            "flex-1 gap-2 data-[state=on]:bg-amber-500 data-[state=on]:text-white",
            "transition-all duration-200"
          )}
        >
          <Star className="w-4 h-4" />
          <span className="text-sm font-medium">Favoritos</span>
          {favoritosCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-background/20">
              {favoritosCount}
            </span>
          )}
        </ToggleGroupItem>
        
        <ToggleGroupItem 
          value="recentes" 
          aria-label="Recentes"
          className={cn(
            "flex-1 gap-2 data-[state=on]:bg-blue-500 data-[state=on]:text-white",
            "transition-all duration-200"
          )}
        >
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Recentes</span>
          {recentesCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-background/20">
              {recentesCount}
            </span>
          )}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
