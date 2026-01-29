import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PeticaoEditorProps {
  content: {
    etapa1: string;
    etapa2: string;
    etapa3: string;
  };
  currentStep: number;
  isGenerating: boolean;
  totalCaracteres: number;
}

export const PeticaoEditor = ({ content, currentStep, isGenerating, totalCaracteres }: PeticaoEditorProps) => {
  const etapas = [
    {
      numero: 1,
      titulo: "Qualificação e Fundamentação Jurídica",
      conteudo: content.etapa1,
    },
    {
      numero: 2,
      titulo: "Análise Detalhada e Argumentação",
      conteudo: content.etapa2,
    },
    {
      numero: 3,
      titulo: "Pedidos e Conclusão",
      conteudo: content.etapa3,
    },
  ];

  const getStatusIcon = (numeroEtapa: number) => {
    if (currentStep === numeroEtapa && isGenerating) {
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    }
    if (etapas[numeroEtapa - 1].conteudo) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <Circle className="w-5 h-5 text-muted-foreground" />;
  };

  const getStatusText = (numeroEtapa: number) => {
    if (currentStep === numeroEtapa && isGenerating) return "Gerando...";
    if (etapas[numeroEtapa - 1].conteudo) return "Concluído";
    return "Aguardando";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Preview da Petição</CardTitle>
          {totalCaracteres > 0 && (
            <Badge variant="secondary">
              {totalCaracteres.toLocaleString()} caracteres
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {etapas.map((etapa) => (
          <div key={etapa.numero} className="space-y-2">
            <div className="flex items-center gap-3">
              {getStatusIcon(etapa.numero)}
              <div className="flex-1">
                <h3 className="font-semibold text-sm">
                  Etapa {etapa.numero}: {etapa.titulo}
                </h3>
                <p className="text-xs text-muted-foreground">{getStatusText(etapa.numero)}</p>
              </div>
            </div>
            
            {etapa.conteudo && (
              <div className="bg-muted/50 rounded-lg p-4 ml-8">
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                  {etapa.conteudo}
                </div>
              </div>
            )}

            {currentStep === etapa.numero && isGenerating && !etapa.conteudo && (
              <div className="bg-muted/30 rounded-lg p-4 ml-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando conteúdo...
                </div>
              </div>
            )}
          </div>
        ))}

        {!content.etapa1 && !isGenerating && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Preencha os dados acima e clique em "Gerar Petição" para começar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
