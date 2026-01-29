import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Filter, RotateCcw, Calendar, Scale, Layers, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FiltrosRapidosProps {
  periodo: string;
  setPeriodo: (value: string) => void;
  area: string;
  setArea: (value: string) => void;
  tribunal: string;
  setTribunal: (value: string) => void;
  onLimpar: () => void;
  onAbrirFiltrosAvancados?: () => void;
}

interface FiltroPreset {
  id: string;
  label: string;
  categoria: "periodo" | "area" | "tribunal";
}

const FILTROS_PERIODO: FiltroPreset[] = [
  { id: "mes", label: "Último mês", categoria: "periodo" },
  { id: "trimestre", label: "Trimestre", categoria: "periodo" },
  { id: "ano", label: "Último ano", categoria: "periodo" },
  { id: "todos", label: "Todos", categoria: "periodo" },
];

const FILTROS_AREA: FiltroPreset[] = [
  { id: "civil", label: "Civil", categoria: "area" },
  { id: "penal", label: "Penal", categoria: "area" },
  { id: "trabalhista", label: "Trabalhista", categoria: "area" },
  { id: "tributario", label: "Tributário", categoria: "area" },
  { id: "consumidor", label: "Consumidor", categoria: "area" },
  { id: "familia", label: "Família", categoria: "area" },
];

const FILTROS_TRIBUNAL: FiltroPreset[] = [
  { id: "TJSP", label: "TJSP", categoria: "tribunal" },
  { id: "TJRJ", label: "TJRJ", categoria: "tribunal" },
  { id: "TJMG", label: "TJMG", categoria: "tribunal" },
  { id: "STF", label: "STF", categoria: "tribunal" },
  { id: "STJ", label: "STJ", categoria: "tribunal" },
  { id: "TST", label: "TST", categoria: "tribunal" },
];

export function FiltrosRapidos({
  periodo,
  setPeriodo,
  area,
  setArea,
  tribunal,
  setTribunal,
  onLimpar,
  onAbrirFiltrosAvancados
}: FiltrosRapidosProps) {
  
  const temFiltros = periodo !== "ano" || area || tribunal;
  
  const handleFiltroClick = (filtro: FiltroPreset) => {
    switch (filtro.categoria) {
      case "periodo":
        setPeriodo(filtro.id === periodo ? "ano" : filtro.id);
        break;
      case "area":
        setArea(filtro.id === area ? "" : filtro.id);
        break;
      case "tribunal":
        setTribunal(filtro.id === tribunal ? "" : filtro.id);
        break;
    }
  };

  const isSelected = (filtro: FiltroPreset) => {
    switch (filtro.categoria) {
      case "periodo":
        return periodo === filtro.id;
      case "area":
        return area === filtro.id;
      case "tribunal":
        return tribunal === filtro.id;
    }
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header dos filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Filtros Rápidos</span>
        </div>
        <div className="flex items-center gap-2">
          {temFiltros && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLimpar}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar
            </Button>
          )}
          {onAbrirFiltrosAvancados && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAbrirFiltrosAvancados}
              className="h-7 text-xs gap-1"
            >
              <Settings2 className="w-3 h-3" />
              Avançado
            </Button>
          )}
        </div>
      </div>

      {/* Período */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Período
        </p>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {FILTROS_PERIODO.map((filtro) => (
              <button
                key={filtro.id}
                onClick={() => handleFiltroClick(filtro)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  isSelected(filtro)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {filtro.label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Área do Direito */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Layers className="w-3 h-3" />
          Área do Direito
        </p>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {FILTROS_AREA.map((filtro) => (
              <button
                key={filtro.id}
                onClick={() => handleFiltroClick(filtro)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  isSelected(filtro)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {filtro.label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Tribunal */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Scale className="w-3 h-3" />
          Tribunal
        </p>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {FILTROS_TRIBUNAL.map((filtro) => (
              <button
                key={filtro.id}
                onClick={() => handleFiltroClick(filtro)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  isSelected(filtro)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {filtro.label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}