import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Scale, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface TCCTema {
  id: string;
  area_direito: string;
  tema: string;
  descricao: string | null;
  nivel_dificuldade: string | null;
  tema_saturado: boolean;
  relevancia: number;
  anos_recomendados: number[] | null;
  legislacao_relacionada: string[] | null;
  oportunidade: boolean;
}

interface TCCTemaCardProps {
  tema: TCCTema;
  onBuscarTCCs?: (tema: string) => void;
  onSalvar?: (tema: TCCTema) => void;
}

const TCCTemaCard = ({ tema, onBuscarTCCs, onSalvar }: TCCTemaCardProps) => {
  const getNivelColor = (nivel: string | null) => {
    switch (nivel) {
      case "iniciante":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "intermediario":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "avancado":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getNivelLabel = (nivel: string | null) => {
    switch (nivel) {
      case "iniciante":
        return "Iniciante";
      case "intermediario":
        return "Intermediário";
      case "avancado":
        return "Avançado";
      default:
        return "Não definido";
    }
  };

  return (
    <Card className={`border-border/50 ${tema.oportunidade ? "border-green-500/30 bg-green-500/5" : tema.tema_saturado ? "border-yellow-500/30 bg-yellow-500/5" : "bg-card/50"}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {tema.oportunidade && (
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Alta Oportunidade
              </Badge>
            )}
            {tema.tema_saturado && (
              <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Tema Saturado
              </Badge>
            )}
            <Badge variant="outline" className={getNivelColor(tema.nivel_dificuldade)}>
              {getNivelLabel(tema.nivel_dificuldade)}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            {tema.relevancia}%
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-foreground">{tema.tema}</h3>
          {tema.descricao && (
            <p className="text-sm text-muted-foreground mt-1">{tema.descricao}</p>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {tema.area_direito}
          </Badge>
          {tema.anos_recomendados && tema.anos_recomendados.length > 0 && (
            <span>
              Recomendado: {tema.anos_recomendados.map((a) => `${a}º ano`).join(", ")}
            </span>
          )}
        </div>

        {tema.legislacao_relacionada && tema.legislacao_relacionada.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Scale className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
            {tema.legislacao_relacionada.map((lei, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {lei}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onBuscarTCCs?.(tema.tema)}
          >
            Ver TCCs Relacionados
          </Button>
          {onSalvar && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSalvar(tema)}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TCCTemaCard;
