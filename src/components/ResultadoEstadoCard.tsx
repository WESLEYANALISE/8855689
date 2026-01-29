import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, TrendingUp } from "lucide-react";

interface ResultadoEstadoCardProps {
  estado: {
    uf: string;
    nomeEstado: string;
    vencedor: {
      nome: string;
      foto?: string;
      partido: string;
      votos: number;
      percentual: number;
    };
    vice?: {
      nome: string;
      foto?: string;
      partido: string;
    };
    totalVotos?: number;
  };
}

export const ResultadoEstadoCard = ({ estado }: ResultadoEstadoCardProps) => {
  return (
    <Card className="bg-card border-border hover:border-accent/50 transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-bold">{estado.uf}</span>
          <Badge variant="outline" className="text-xs">
            {estado.nomeEstado}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Vencedor */}
        <div className="p-3 bg-accent/10 rounded-lg border border-accent/30">
          <div className="flex items-start gap-3">
            {estado.vencedor.foto ? (
              <img 
                src={estado.vencedor.foto} 
                alt={estado.vencedor.nome}
                className="w-16 h-16 rounded-lg object-cover border-2 border-accent"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-accent/20 flex items-center justify-center border-2 border-accent">
                <Trophy className="w-8 h-8 text-accent" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-xs font-semibold text-accent">ELEITO</span>
              </div>
              <h4 className="font-bold text-sm leading-tight mb-1 truncate">
                {estado.vencedor.nome}
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                {estado.vencedor.partido}
              </p>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-accent h-full rounded-full transition-all"
                    style={{ width: `${Math.min(estado.vencedor.percentual, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-accent whitespace-nowrap">
                  {estado.vencedor.percentual.toFixed(1)}%
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                {estado.vencedor.votos.toLocaleString('pt-BR')} votos
              </p>
            </div>
          </div>
        </div>

        {/* Vice */}
        {estado.vice && (
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-start gap-3">
              {estado.vice.foto ? (
                <img 
                  src={estado.vice.foto} 
                  alt={estado.vice.nome}
                  className="w-12 h-12 rounded-lg object-cover border border-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center border border-border">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Vice</p>
                <h5 className="font-semibold text-sm leading-tight truncate">
                  {estado.vice.nome}
                </h5>
                <p className="text-xs text-muted-foreground">
                  {estado.vice.partido}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Total de Votos */}
        {estado.totalVotos && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Total de votos</span>
            </div>
            <span className="font-semibold">
              {estado.totalVotos.toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
