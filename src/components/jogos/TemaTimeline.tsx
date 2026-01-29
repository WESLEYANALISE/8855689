import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface TimelineItem {
  numero: number;
  titulo: string;
  descricao: string;
  icone?: string;
  completo?: boolean;
}

interface TemaTimelineProps {
  itens: TimelineItem[];
  onSelect: (item: TimelineItem) => void;
  loading?: boolean;
}

export const TemaTimeline = ({ itens, onSelect, loading }: TemaTimelineProps) => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {itens.map((item, index) => (
        <div key={index} className="relative">
          {/* Linha Conectora */}
          {index < itens.length - 1 && (
            <div className="absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b from-primary/50 to-transparent -z-10" />
          )}

          <Card
            className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-l-4 border-l-primary/50 hover:border-l-primary"
            onClick={() => !loading && onSelect(item)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Marcador Numérico com Gradiente */}
                <div className="flex-shrink-0 relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {item.icone || item.numero}
                  </div>
                  {item.completo && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg">{item.titulo}</h3>
                    {item.completo && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                        ✓ Completo
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.descricao}
                  </p>
                </div>

                {/* Indicador de Ação */}
                <div className="text-muted-foreground">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};
