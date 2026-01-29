import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  Palavra: string;
  Significado: string;
}

interface DicionarioSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  results?: SearchResult[];
  isSearching?: boolean;
  onResultClick?: (palavra: string) => void;
  placeholder?: string;
  className?: string;
}

export const DicionarioSearchBar = ({
  value,
  onChange,
  results = [],
  isSearching,
  onResultClick,
  placeholder = "Buscar termo jurídico...",
  className,
}: DicionarioSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showResults = isFocused && value.trim().length > 0 && (results.length > 0 || isSearching);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className={cn(
            "pl-12 pr-10 h-12 text-base bg-card/80 backdrop-blur-sm border-border/50",
            "focus:border-amber-500/50 focus:ring-amber-500/20 transition-all",
            showResults && "rounded-b-none border-b-0"
          )}
        />
        
        {value && (
          <button
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 z-50 bg-card border border-t-0 border-border/50 rounded-b-xl shadow-xl max-h-80 overflow-y-auto"
          >
            {isSearching ? (
              <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Buscando...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.slice(0, 8).map((result, index) => (
                  <button
                    key={`${result.Palavra}-${index}`}
                    onClick={() => {
                      onResultClick?.(result.Palavra);
                      setIsFocused(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-amber-500/10 transition-colors border-b border-border/30 last:border-b-0"
                  >
                    <p className="font-semibold text-foreground text-sm">
                      {result.Palavra}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {result.Significado}
                    </p>
                  </button>
                ))}
                {results.length > 8 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground text-center bg-muted/30">
                    +{results.length - 8} resultados encontrados
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
