import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, ExternalLink, User } from "lucide-react";

interface CandidatoCardProps {
  candidato: {
    nome: string;
    numero: string;
    partido: string;
    cargo: string;
    uf: string;
    situacao?: string;
    foto?: string;
    bens?: string;
    redesSociais?: Array<{ tipo: string; url: string }>;
  };
}

export const CandidatoCard = ({ candidato }: CandidatoCardProps) => {
  const getSituacaoColor = (situacao?: string) => {
    if (!situacao) return "bg-secondary";
    
    const situacaoUpper = situacao.toUpperCase();
    if (situacaoUpper.includes("ELEITO") || situacaoUpper.includes("DEFERIDO")) {
      return "bg-green-500/20 text-green-500 border-green-500/50";
    }
    if (situacaoUpper.includes("NÃO ELEITO") || situacaoUpper.includes("INDEFERIDO")) {
      return "bg-red-500/20 text-red-500 border-red-500/50";
    }
    return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
  };

  return (
    <Card className="bg-card border-border hover:border-accent/50 transition-all">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Foto do Candidato */}
          <div className="flex-shrink-0">
            {candidato.foto ? (
              <img 
                src={candidato.foto} 
                alt={candidato.nome}
                className="w-24 h-24 rounded-lg object-cover border-2 border-accent/30"
                onError={(e) => {
                  // Fallback para avatar genérico se a foto não carregar
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center border-2 border-accent/30"><svg class="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`;
                  }
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center border-2 border-accent/30">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Informações do Candidato */}
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-bold text-lg leading-tight">{candidato.nome}</h3>
              <p className="text-sm text-muted-foreground">
                {candidato.numero} - {candidato.partido}
              </p>
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {candidato.cargo}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {candidato.uf}
              </Badge>
              {candidato.situacao && (
                <Badge className={`text-xs border ${getSituacaoColor(candidato.situacao)}`}>
                  {candidato.situacao}
                </Badge>
              )}
            </div>

            {/* Bens Declarados */}
            {candidato.bens && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">Bens declarados:</span>
                <span className="font-semibold">{candidato.bens}</span>
              </div>
            )}

            {/* Redes Sociais */}
            {candidato.redesSociais && candidato.redesSociais.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {candidato.redesSociais.map((rede, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    size="sm" 
                    asChild
                    className="h-7 text-xs"
                  >
                    <a href={rede.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {rede.tipo}
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
