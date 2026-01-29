import { Filter, Calendar, Scale, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TribunalSelector } from "./TribunalSelector";

interface FiltersPanelProps {
  tribunal: string;
  setTribunal: (value: string) => void;
  periodo: string;
  setPeriodo: (value: string) => void;
  area: string;
  setArea: (value: string) => void;
  grau: string;
  setGrau: (value: string) => void;
  onLimpar: () => void;
}

export function FiltersPanel({
  tribunal,
  setTribunal,
  periodo,
  setPeriodo,
  area,
  setArea,
  grau,
  setGrau,
  onLimpar,
}: FiltersPanelProps) {
  const temFiltros = tribunal || periodo !== "ano" || area || grau;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Filtros</h3>
        </div>
        {temFiltros && (
          <Button variant="ghost" size="sm" onClick={onLimpar}>
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tribunal */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            Tribunal
          </label>
          <TribunalSelector value={tribunal} onChange={setTribunal} />
        </div>

        {/* Período */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Período
          </label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Último mês</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
              <SelectItem value="semestre">Último semestre</SelectItem>
              <SelectItem value="ano">Último ano</SelectItem>
              <SelectItem value="todos">Todos os tempos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Área do Direito */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Área do Direito
          </label>
          <Select value={area || "all"} onValueChange={(v) => setArea(v === "all" ? "" : v)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Todas as áreas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              <SelectItem value="civil">Direito Civil</SelectItem>
              <SelectItem value="penal">Direito Penal</SelectItem>
              <SelectItem value="trabalhista">Direito Trabalhista</SelectItem>
              <SelectItem value="tributario">Direito Tributário</SelectItem>
              <SelectItem value="administrativo">Direito Administrativo</SelectItem>
              <SelectItem value="consumidor">Direito do Consumidor</SelectItem>
              <SelectItem value="familia">Direito de Família</SelectItem>
              <SelectItem value="empresarial">Direito Empresarial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grau de Jurisdição */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            Grau
          </label>
          <Select value={grau || "all"} onValueChange={(v) => setGrau(v === "all" ? "" : v)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Todos os graus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os graus</SelectItem>
              <SelectItem value="1">1º Grau</SelectItem>
              <SelectItem value="2">2º Grau</SelectItem>
              <SelectItem value="recursos">Recursos</SelectItem>
              <SelectItem value="superiores">Tribunais Superiores</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}