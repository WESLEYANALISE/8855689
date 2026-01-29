import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Calendar, Navigation } from "lucide-react";

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

interface EstagiosBuscaFiltrosProps {
  location: string;
  onLocationChange: (value: string) => void;
  estado: string;
  onEstadoChange: (value: string) => void;
  salarioMin: number;
  salarioMax: number;
  onSalarioChange: (min: number, max: number) => void;
  periodo: string;
  onPeriodoChange: (value: string) => void;
  onUsarLocalizacao: () => void;
  loadingGeo: boolean;
}

export const EstagiosBuscaFiltros = ({
  location,
  onLocationChange,
  estado,
  onEstadoChange,
  salarioMin,
  salarioMax,
  onSalarioChange,
  periodo,
  onPeriodoChange,
  onUsarLocalizacao,
  loadingGeo,
}: EstagiosBuscaFiltrosProps) => {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vagas perto de mim */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={onUsarLocalizacao}
            disabled={loadingGeo}
          >
            <Navigation className="w-4 h-4 mr-2" />
            {loadingGeo ? 'Buscando...' : 'Vagas perto de mim'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Use sua localização atual
          </p>
        </div>

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
          <p className="text-xs text-muted-foreground">
            Digite cidade ou estado
          </p>
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
                value={salarioMin}
                onChange={(e) => onSalarioChange(Number(e.target.value), salarioMax)}
                placeholder="R$ 0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Máximo</Label>
              <Input
                type="number"
                value={salarioMax}
                onChange={(e) => onSalarioChange(salarioMin, Number(e.target.value))}
                placeholder="R$ 10.000"
              />
            </div>
          </div>
          <Slider
            value={[salarioMin, salarioMax]}
            min={0}
            max={10000}
            step={500}
            onValueChange={([min, max]) => onSalarioChange(min, max)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground text-center">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(salarioMin)}
            {' - '}
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(salarioMax)}
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
              <RadioGroupItem value="todos" id="todos" />
              <Label htmlFor="todos" className="font-normal cursor-pointer">
                Qualquer período
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="7" id="7dias" />
              <Label htmlFor="7dias" className="font-normal cursor-pointer">
                Última semana
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="30" id="30dias" />
              <Label htmlFor="30dias" className="font-normal cursor-pointer">
                Último mês
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="90" id="90dias" />
              <Label htmlFor="90dias" className="font-normal cursor-pointer">
                Últimos 3 meses
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Info sobre API */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Vagas fornecidas pela API Adzuna, atualizado diariamente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
