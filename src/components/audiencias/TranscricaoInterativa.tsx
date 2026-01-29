import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Segmento {
  texto: string;
  inicio_segundos: number;
  fim_segundos: number;
}

interface TranscricaoInterativaProps {
  segmentos: Segmento[];
  currentTime: number;
  onSeek: (seconds: number) => void;
  isPlaying?: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function TranscricaoInterativa({
  segmentos,
  currentTime,
  onSeek,
  isPlaying = false
}: TranscricaoInterativaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  // Encontra o segmento ativo baseado no tempo atual
  const activeIndex = segmentos.findIndex((seg, index) => {
    const next = segmentos[index + 1];
    if (next) {
      return currentTime >= seg.inicio_segundos && currentTime < next.inicio_segundos;
    }
    return currentTime >= seg.inicio_segundos;
  });

  // Auto-scroll para o segmento ativo
  useEffect(() => {
    if (autoScroll && isPlaying && activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex, isPlaying, autoScroll]);

  // Filtra segmentos com base na busca
  const filteredSegmentos = searchTerm
    ? segmentos.filter(seg => 
        seg.texto.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : segmentos;

  // Destaca texto encontrado
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (segmentos.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Transcrição Interativa</span>
          <Badge variant="secondary" className="text-xs">
            {segmentos.length} trechos
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <>
          {/* Search e controles */}
          <div className="p-3 border-b border-border flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar na transcrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button
              variant={autoScroll ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              className="text-xs whitespace-nowrap"
            >
              Auto-scroll
            </Button>
          </div>

          {/* Lista de segmentos */}
          <ScrollArea className="h-[300px]" ref={containerRef}>
            <div className="p-2 space-y-1">
              {filteredSegmentos.map((segmento, index) => {
                const originalIndex = segmentos.indexOf(segmento);
                const isActive = originalIndex === activeIndex;
                const isPast = originalIndex < activeIndex;

                return (
                  <div
                    key={index}
                    ref={isActive ? activeRef : undefined}
                    onClick={() => onSeek(segmento.inicio_segundos)}
                    className={cn(
                      "flex gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200",
                      "hover:bg-muted/80",
                      isActive && "bg-primary/10 border border-primary/30",
                      isPast && "opacity-60"
                    )}
                  >
                    {/* Timestamp */}
                    <div className={cn(
                      "shrink-0 text-xs font-mono px-2 py-0.5 rounded",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {formatTime(segmento.inicio_segundos)}
                    </div>

                    {/* Texto */}
                    <p className={cn(
                      "text-sm leading-relaxed flex-1",
                      isActive ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {highlightText(segmento.texto, searchTerm)}
                    </p>
                  </div>
                );
              })}

              {filteredSegmentos.length === 0 && searchTerm && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum trecho encontrado para "{searchTerm}"
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer com progresso */}
          <div className="p-2 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {activeIndex >= 0 ? `Trecho ${activeIndex + 1} de ${segmentos.length}` : 'Aguardando...'}
              </span>
              <span>{formatTime(currentTime)}</span>
            </div>
            {/* Barra de progresso */}
            <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${segmentos.length > 0 ? ((activeIndex + 1) / segmentos.length) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
