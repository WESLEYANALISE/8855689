import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ResumoLevel = "detalhado" | "resumido" | "super_resumido";

interface StepSelectLevelProps {
  onSelect: (level: ResumoLevel) => void;
  onBack: () => void;
}

export const StepSelectLevel = ({ onSelect, onBack }: StepSelectLevelProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Conteúdo Analisado!
          </h1>
          <p className="text-muted-foreground">
            Agora escolha o nível de detalhamento do seu resumo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group"
            onClick={() => onSelect("super_resumido")}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto group-hover:bg-accent/20 transition-colors">
                <span className="text-3xl">⚡</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Super Resumido</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  4-6 pontos principais em bullets
                </p>
                <div className="text-xs text-muted-foreground">
                  • Ideal para revisão rápida<br/>
                  • 10-15 palavras por ponto<br/>
                  • Leitura: ~1 minuto
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group border-accent/50"
            onClick={() => onSelect("resumido")}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto group-hover:bg-accent/20 transition-colors">
                <span className="text-3xl">📋</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Resumido</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  1 parágrafo por tópico essencial
                </p>
                <div className="text-xs text-muted-foreground">
                  • Equilíbrio perfeito<br/>
                  • 2-3 linhas por tópico<br/>
                  • Leitura: ~3 minutos
                </div>
              </div>
              <div className="inline-block px-2 py-1 bg-accent/20 text-accent text-xs font-medium rounded">
                Recomendado
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-accent group"
            onClick={() => onSelect("detalhado")}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto group-hover:bg-accent/20 transition-colors">
                <span className="text-3xl">📚</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Detalhado</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  2-3 parágrafos por tópico completo
                </p>
                <div className="text-xs text-muted-foreground">
                  • Análise aprofundada<br/>
                  • 3-5 linhas por tópico<br/>
                  • Leitura: ~5-7 minutos
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
