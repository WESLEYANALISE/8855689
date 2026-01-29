import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Calendar, Building2, ExternalLink } from "lucide-react";

interface AdzunaVaga {
  id: string;
  titulo: string;
  empresa: string;
  local: string;
  estado: string;
  descricao: string;
  salario_min?: number;
  salario_max?: number;
  tipo_contrato?: string;
  link_externo: string;
  data_publicacao: string;
  categoria: string;
  origem: string;
  distancia?: number;
}

interface AdzunaVagaCardProps {
  vaga: AdzunaVaga;
  onClick?: () => void;
}

export const AdzunaVagaCard = ({ vaga, onClick }: AdzunaVagaCardProps) => {
  const formatSalario = (min?: number, max?: number): string | null => {
    if (!min && !max) return null;
    
    const formatarValor = (valor: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(valor);
    };

    if (min && max && min !== max) {
      return `${formatarValor(min)} - ${formatarValor(max)}`;
    }
    if (min) return `A partir de ${formatarValor(min)}`;
    if (max) return `Até ${formatarValor(max)}`;
    return null;
  };

  const formatData = (dataString: string): string => {
    const data = new Date(dataString);
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - data.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays <= 7) return `${diffDays} dias atrás`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    return `${Math.floor(diffDays / 30)} meses atrás`;
  };

  const identificarPlataforma = (url: string): string => {
    if (url.includes('infojobs')) return 'InfoJobs';
    if (url.includes('linkedin')) return 'LinkedIn';
    if (url.includes('catho')) return 'Catho';
    if (url.includes('vagas.com')) return 'Vagas.com';
    if (url.includes('indeed')) return 'Indeed';
    if (url.includes('glassdoor')) return 'Glassdoor';
    return 'Site da Empresa';
  };

  const salarioFormatado = formatSalario(vaga.salario_min, vaga.salario_max);
  const plataforma = identificarPlataforma(vaga.link_externo);
  const isVagaNova = new Date().getTime() - new Date(vaga.data_publicacao).getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer hover:border-emerald-500"
      onClick={onClick}
    >
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-semibold text-lg line-clamp-2">{vaga.titulo}</h3>
            <div className="flex flex-col gap-2 items-end">
              {isVagaNova && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 shrink-0">
                  Nova
                </Badge>
              )}
              <Badge variant="outline" className="shrink-0">
                {plataforma}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span className="text-sm">{vaga.empresa}</span>
          </div>
        </div>

        {/* Descrição */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {vaga.descricao.replace(/<[^>]*>/g, '')}
        </p>

        {/* Detalhes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{vaga.local}</span>
            {vaga.distancia && (
              <span className="text-emerald-600 font-medium">
                • ~{vaga.distancia.toFixed(1)} km
              </span>
            )}
          </div>

          {salarioFormatado && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-emerald-600">{salarioFormatado}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Publicado {formatData(vaga.data_publicacao)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {vaga.categoria}
            </Badge>
            {vaga.tipo_contrato && (
              <Badge variant="outline" className="text-xs">
                {vaga.tipo_contrato}
              </Badge>
            )}
          </div>

          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(vaga.link_externo, '_blank');
            }}
            className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Ver no {plataforma}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
