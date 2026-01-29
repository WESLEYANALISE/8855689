import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, MapPin, DollarSign, Calendar } from "lucide-react";

const ESTADOS_BRASILEIROS = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

interface EstagiosFiltrosMobileProps {
  location: string;
  onLocationChange: (value: string) => void;
  estado: string;
  onEstadoChange: (value: string) => void;
  salarioMin: number;
  salarioMax: number;
  onSalarioChange: (min: number, max: number) => void;
  periodo: string;
  onPeriodoChange: (value: string) => void;
  onLimparFiltros: () => void;
  filtrosAtivos: number;
}

export const EstagiosFiltrosMobile = ({
  location,
  onLocationChange,
  estado,
  onEstadoChange,
  salarioMin,
  salarioMax,
  onSalarioChange,
  periodo,
  onPeriodoChange,
  onLimparFiltros,
  filtrosAtivos,
}: EstagiosFiltrosMobileProps) => {
  const [open, setOpen] = useState(false);
  const [tempSalarioMin, setTempSalarioMin] = useState(salarioMin);
  const [tempSalarioMax, setTempSalarioMax] = useState(salarioMax);

  const handleAplicarFiltros = () => {
    onSalarioChange(tempSalarioMin, tempSalarioMax);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="lg:hidden fixed bottom-20 right-4 z-50 rounded-full shadow-lg h-14 w-14 p-0"
        >
          <Filter className="w-5 h-5" />
          {filtrosAtivos > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {filtrosAtivos}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">Filtros</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Localização */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localização
            </Label>
            <Input
              placeholder="Ex: São Paulo, Rio de Janeiro"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
            />
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={onEstadoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                {ESTADOS_BRASILEIROS.map((e) => (
                  <SelectItem key={e.sigla} value={e.sigla}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Faixa Salarial */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Faixa Salarial
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Mínimo</Label>
                <Input
                  type="number"
                  value={tempSalarioMin}
                  onChange={(e) => setTempSalarioMin(Number(e.target.value))}
                  placeholder="R$ 0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Máximo</Label>
                <Input
                  type="number"
                  value={tempSalarioMax}
                  onChange={(e) => setTempSalarioMax(Number(e.target.value))}
                  placeholder="R$ 10.000"
                />
              </div>
            </div>
            <Slider
              value={[tempSalarioMin, tempSalarioMax]}
              min={0}
              max={10000}
              step={500}
              onValueChange={([min, max]) => {
                setTempSalarioMin(min);
                setTempSalarioMax(max);
              }}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground text-center">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(tempSalarioMin)}
              {' - '}
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(tempSalarioMax)}
            </p>
          </div>

          {/* Período de Publicação */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Publicado há
            </Label>
            <RadioGroup value={periodo} onValueChange={onPeriodoChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="todos" id="mobile-todos" />
                <Label htmlFor="mobile-todos" className="font-normal cursor-pointer">
                  Qualquer período
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="7" id="mobile-7dias" />
                <Label htmlFor="mobile-7dias" className="font-normal cursor-pointer">
                  Última semana
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30" id="mobile-30dias" />
                <Label htmlFor="mobile-30dias" className="font-normal cursor-pointer">
                  Último mês
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="90" id="mobile-90dias" />
                <Label htmlFor="mobile-90dias" className="font-normal cursor-pointer">
                  Últimos 3 meses
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background pb-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onLimparFiltros}
            >
              Limpar Tudo
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAplicarFiltros}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
