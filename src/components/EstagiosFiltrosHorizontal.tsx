import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Navigation } from "lucide-react";

const AREAS_DIREITO = [
  "Todos",
  "Civil",
  "Penal",
  "Trabalhista",
  "Tributário",
  "Administrativo",
  "Empresarial",
  "Ambiental",
  "Família",
  "Criminal"
];

const ESTADOS = [
  "Todos",
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

interface EstagiosFiltrosHorizontalProps {
  selectedArea: string;
  selectedEstado: string;
  selectedTipo: string;
  onAreaChange: (value: string) => void;
  onEstadoChange: (value: string) => void;
  onTipoChange: (value: string) => void;
  onClearFilters: () => void;
  onUsarLocalizacao: () => void;
  loadingGeo?: boolean;
  totalResultados?: number;
}

export const EstagiosFiltrosHorizontal = ({
  selectedArea,
  selectedEstado,
  selectedTipo,
  onAreaChange,
  onEstadoChange,
  onTipoChange,
  onClearFilters,
  onUsarLocalizacao,
  loadingGeo = false,
  totalResultados = 0
}: EstagiosFiltrosHorizontalProps) => {
  const hasActiveFilters = selectedArea !== "Todos" || selectedEstado !== "Todos" || selectedTipo !== "Todos";

  return (
    <div className="space-y-4 bg-card p-4 rounded-lg border">
      {/* Primeira linha - Filtros principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tipo de vaga */}
        <Select value={selectedTipo} onValueChange={onTipoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de vaga" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os tipos</SelectItem>
            <SelectItem value="Estágio">Estágio</SelectItem>
            <SelectItem value="Advogado">Advogado</SelectItem>
            <SelectItem value="Júnior">Júnior</SelectItem>
          </SelectContent>
        </Select>

        {/* Área do Direito */}
        <Select value={selectedArea} onValueChange={onAreaChange}>
          <SelectTrigger>
            <SelectValue placeholder="Área do direito" />
          </SelectTrigger>
          <SelectContent>
            {AREAS_DIREITO.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Estado */}
        <Select value={selectedEstado} onValueChange={onEstadoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS.map((estado) => (
              <SelectItem key={estado} value={estado}>
                {estado}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Vagas perto de mim */}
        <Button
          variant="outline"
          className="w-full"
          onClick={onUsarLocalizacao}
          disabled={loadingGeo}
        >
          <Navigation className="w-4 h-4 mr-2" />
          {loadingGeo ? 'Buscando...' : 'Vagas perto de mim'}
        </Button>
      </div>

      {/* Segunda linha - Filtros ativos e total */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {hasActiveFilters && (
            <>
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {selectedTipo !== "Todos" && (
                <Badge variant="secondary" className="gap-1">
                  Tipo: {selectedTipo}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => onTipoChange("Todos")}
                  />
                </Badge>
              )}
              {selectedArea !== "Todos" && (
                <Badge variant="secondary" className="gap-1">
                  Área: {selectedArea}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => onAreaChange("Todos")}
                  />
                </Badge>
              )}
              {selectedEstado !== "Todos" && (
                <Badge variant="secondary" className="gap-1">
                  Estado: {selectedEstado}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => onEstadoChange("Todos")}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-6 text-xs"
              >
                Limpar todos
              </Button>
            </>
          )}
        </div>
        
        <span className="text-sm text-muted-foreground">
          {totalResultados} {totalResultados === 1 ? 'vaga encontrada' : 'vagas encontradas'}
        </span>
      </div>
    </div>
  );
};