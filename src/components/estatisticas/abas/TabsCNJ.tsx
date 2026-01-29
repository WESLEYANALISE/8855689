import React from "react";
import { 
  FileStack, 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Layers, 
  BookOpen, 
  Tags, 
  Handshake, 
  Calendar, 
  MapPin, 
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AbaCNJ {
  id: string;
  label: string;
  labelCurto: string;
  icon: React.ComponentType<{ className?: string }>;
  descricao: string;
}

export const ABAS_CNJ: AbaCNJ[] = [
  { id: "gestao", label: "Gestão Processual", labelCurto: "Gestão", icon: FileStack, descricao: "Movimentação e fluxo de processos" },
  { id: "produtividade", label: "Produtividade", labelCurto: "Produtiv.", icon: TrendingUp, descricao: "Produtividade de magistrados e servidores" },
  { id: "indicadores", label: "Indicadores", labelCurto: "Indicad.", icon: BarChart3, descricao: "Taxa de congestionamento e IAD" },
  { id: "tempos", label: "Tempos", labelCurto: "Tempos", icon: Clock, descricao: "Tempo médio de tramitação" },
  { id: "classes", label: "Classes", labelCurto: "Classes", icon: Layers, descricao: "Classes processuais mais frequentes" },
  { id: "assuntos", label: "Assuntos", labelCurto: "Assuntos", icon: BookOpen, descricao: "Assuntos processuais" },
  { id: "temas", label: "Temas", labelCurto: "Temas", icon: Tags, descricao: "Temas repetitivos e de repercussão" },
  { id: "conciliacao", label: "Conciliação", labelCurto: "Concil.", icon: Handshake, descricao: "Acordos e mediação" },
  { id: "mais15anos", label: "+15 Anos", labelCurto: "+15 Anos", icon: Calendar, descricao: "Processos muito antigos" },
  { id: "mapas", label: "Mapas", labelCurto: "Mapas", icon: MapPin, descricao: "Distribuição geográfica" },
  { id: "downloads", label: "Downloads", labelCurto: "Down.", icon: Download, descricao: "Baixar dados e relatórios" },
];

interface TabsCNJProps {
  abaAtiva: string;
  onChangeAba: (abaId: string) => void;
}

export function TabsCNJ({ abaAtiva, onChangeAba }: TabsCNJProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollTo = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative w-full">
      {/* Seta esquerda */}
      {showLeftArrow && (
        <button
          onClick={() => scrollTo('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-background via-background to-transparent pl-1 pr-4 h-full flex items-center"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      )}

      {/* Seta direita */}
      {showRightArrow && (
        <button
          onClick={() => scrollTo('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-l from-background via-background to-transparent pr-1 pl-4 h-full flex items-center"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      )}

      {/* Container com scroll horizontal */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-2 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {ABAS_CNJ.map((aba) => {
          const Icon = aba.icon;
          const isActive = abaAtiva === aba.id;
          
          return (
            <button
              key={aba.id}
              onClick={() => onChangeAba(aba.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap text-xs sm:text-sm font-medium transition-all min-w-fit active:scale-95",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{aba.label}</span>
              <span className="sm:hidden">{aba.labelCurto}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
