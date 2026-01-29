import { Building2, TrendingUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Litigante {
  nome: string;
  quantidade: number;
  percentual: number;
}

interface GrandesLitigantesProps {
  data: Litigante[];
  onExplicar?: (litigante: Litigante) => void;
}

export function GrandesLitigantes({ data, onExplicar }: GrandesLitigantesProps) {
  const formatarNumero = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString("pt-BR");
  };

  const maxQuantidade = Math.max(...data.map(l => l.quantidade));

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Grandes Litigantes</h3>
            <p className="text-xs text-muted-foreground">Top 10 maiores demandantes</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data.slice(0, 10).map((litigante, index) => (
          <div
            key={litigante.nome}
            className="group relative animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground w-5">
                  {index + 1}º
                </span>
                <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                  {litigante.nome}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {formatarNumero(litigante.quantidade)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({litigante.percentual}%)
                </span>
                {onExplicar && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onExplicar(litigante)}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
                style={{ 
                  width: `${(litigante.quantidade / maxQuantidade) * 100}%`,
                  transitionDelay: `${index * 50}ms`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Fonte: CNJ - 100 Maiores Litigantes</span>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Dados de 2024</span>
        </div>
      </div>
    </div>
  );
}