import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Building2, 
  DollarSign, 
  Calendar, 
  ExternalLink,
  Briefcase,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface VagaDetalhesModalProps {
  vaga: AdzunaVaga | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const identificarPlataforma = (url: string): string => {
  if (url.includes('infojobs')) return 'InfoJobs';
  if (url.includes('linkedin')) return 'LinkedIn';
  if (url.includes('catho')) return 'Catho';
  if (url.includes('vagas.com')) return 'Vagas.com';
  if (url.includes('indeed')) return 'Indeed';
  if (url.includes('glassdoor')) return 'Glassdoor';
  return 'Site da Empresa';
};

const formatarSalario = (min?: number, max?: number): string => {
  if (!min && !max) return 'Não informado';
  
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
  return 'Não informado';
};

export const VagaDetalhesModal = ({
  vaga,
  open,
  onOpenChange,
}: VagaDetalhesModalProps) => {
  if (!vaga) return null;

  const plataforma = identificarPlataforma(vaga.link_externo);
  const diasPublicacao = formatDistanceToNow(new Date(vaga.data_publicacao), {
    addSuffix: true,
    locale: ptBR,
  });

  const isVagaNova = new Date().getTime() - new Date(vaga.data_publicacao).getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{vaga.titulo}</DialogTitle>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{vaga.empresa}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {isVagaNova && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  Nova
                </Badge>
              )}
              <Badge variant="outline">{plataforma}</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Localização</p>
                <p className="text-sm text-muted-foreground">{vaga.local}</p>
                {vaga.distancia && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ~{vaga.distancia.toFixed(1)} km de você
                  </p>
                )}
              </div>
            </div>

            {(vaga.salario_min || vaga.salario_max) && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Salário</p>
                  <p className="text-sm text-muted-foreground">
                    {formatarSalario(vaga.salario_min, vaga.salario_max)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Publicado</p>
                <p className="text-sm text-muted-foreground capitalize">{diasPublicacao}</p>
              </div>
            </div>

            {vaga.tipo_contrato && (
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Tipo de contrato</p>
                  <p className="text-sm text-muted-foreground">{vaga.tipo_contrato}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Categoria</p>
                <p className="text-sm text-muted-foreground">{vaga.categoria}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Descrição completa */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Descrição da Vaga</h3>
            <div 
              className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed"
              dangerouslySetInnerHTML={{ __html: vaga.descricao }}
            />
          </div>

          <Separator />

          {/* Botão de ação */}
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => window.open(vaga.link_externo, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver no {plataforma}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
