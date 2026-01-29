import { Card, CardContent } from "@/components/ui/card";
import { FileText, User, Calendar, Vote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ProposicaoCardProps {
  proposicao: {
    id: number;
    siglaTipo: string;
    numero: number;
    ano: number;
    ementa: string;
    dataApresentacao?: string;
    titulo_gerado_ia?: string;
    autor_principal_nome?: string;
    autor_principal_foto?: string;
    autor_principal_partido?: string;
    autor_principal_uf?: string;
    quantidade_votacoes?: number;
    status?: string;
  };
  onClick?: () => void;
}

export const ProposicaoCard = ({ proposicao, onClick }: ProposicaoCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-300 border-2 border-border hover:border-primary/50 bg-card"
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 md:p-6">
        {/* Header com tipo e badge */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="font-bold text-base sm:text-lg text-foreground">
                {proposicao.siglaTipo} {proposicao.numero}/{proposicao.ano}
              </h3>
              {proposicao.quantidade_votacoes !== undefined && proposicao.quantidade_votacoes > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Vote className="w-3 h-3 mr-1" />
                  {proposicao.quantidade_votacoes} {proposicao.quantidade_votacoes === 1 ? 'votação' : 'votações'}
                </Badge>
              )}
            </div>

            {/* Título gerado por IA */}
            {proposicao.titulo_gerado_ia && (
              <p className="text-sm sm:text-base font-medium text-foreground mb-2 line-clamp-2">
                {proposicao.titulo_gerado_ia}
              </p>
            )}
            
            {/* Ementa */}
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
              {proposicao.ementa}
            </p>
          </div>
        </div>

        {/* Footer com autor e data */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border">
          {/* Autor */}
          {proposicao.autor_principal_nome && (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 border-2 border-primary/20">
                <AvatarImage src={proposicao.autor_principal_foto} alt={proposicao.autor_principal_nome} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                  {proposicao.autor_principal_nome}
                </p>
                {(proposicao.autor_principal_partido || proposicao.autor_principal_uf) && (
                  <p className="text-xs text-muted-foreground">
                    {proposicao.autor_principal_partido && proposicao.autor_principal_uf
                      ? `${proposicao.autor_principal_partido}/${proposicao.autor_principal_uf}`
                      : proposicao.autor_principal_partido || proposicao.autor_principal_uf}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Data */}
          {proposicao.dataApresentacao && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>

        {/* Status (se disponível) */}
        {proposicao.status && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground line-clamp-1">
              <span className="font-medium">Status:</span> {proposicao.status}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
