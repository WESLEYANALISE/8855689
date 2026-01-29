import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface EstagioFiltrosProps {
  selectedArea: string;
  selectedEstado: string;
  selectedTipo: string;
  onAreaChange: (value: string) => void;
  onEstadoChange: (value: string) => void;
  onTipoChange: (value: string) => void;
  onClearFilters: () => void;
}

export const EstagioFiltros = ({
  selectedArea,
  selectedEstado,
  selectedTipo,
  onAreaChange,
  onEstadoChange,
  onTipoChange,
  onClearFilters
}: EstagioFiltrosProps) => {
  const areas = [
    "Todos", "Civil", "Penal", "Trabalhista", "Empresarial", "Público", 
    "Ambiental", "Digital", "Tributário", "Consumidor", "Previdenciário",
    "Imobiliário", "Família", "Direitos Humanos", "Arbitragem", "Desportivo", "Saúde"
  ];

  const estados = [
    "Todos", "SP", "RJ", "MG", "RS", "PR", "BA", "DF", "CE", "Nacional"
  ];

  const tipos = [
    "Todos", "Escritório", "Empresa", "Órgão Público", "ONG", "Startup", "Consultoria", "Hospital", "Instituição"
  ];

  const hasActiveFilters = selectedArea !== "Todos" || selectedEstado !== "Todos" || selectedTipo !== "Todos";

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtros</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-2">
            <X className="w-4 h-4" />
            Limpar
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Área do Direito</Label>
          <Select value={selectedArea} onValueChange={onAreaChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {areas.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Estado</Label>
          <Select value={selectedEstado} onValueChange={onEstadoChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {estados.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Vaga</Label>
          <Select value={selectedTipo} onValueChange={onTipoChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tipos.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
