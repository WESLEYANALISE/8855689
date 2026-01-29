import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, CheckCircle2, Loader2, Play, 
  Brain, Gamepad2, HelpCircle, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ModuloGerado {
  id: number;
  nome: string;
  icone?: string;
  teoria: string;
  matching: Array<{ termo: string; definicao: string }>;
  flashcards: Array<{ frente: string; verso: string; exemplo?: string }>;
  questoes: Array<any>;
}

interface AulaProgressChatProps {
  tema: string;
  titulo?: string;
  descricao?: string;
  modulos: ModuloGerado[];
  moduloAtual: number;
  totalModulos: number;
  isGenerating: boolean;
  estruturaCompleta?: any;
  onIniciarAula?: () => void;
}

export const AulaProgressChat = ({
  tema,
  titulo,
  descricao,
  modulos,
  moduloAtual,
  totalModulos,
  isGenerating,
  estruturaCompleta,
  onIniciarAula
}: AulaProgressChatProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<number | null>(null);
  
  const progresso = totalModulos > 0 ? (modulos.length / totalModulos) * 100 : 0;
  const isComplete = modulos.length === totalModulos && !isGenerating;

  const handleIniciarAula = () => {
    if (estruturaCompleta) {
      // Salvar estrutura no sessionStorage para a página de aula
      sessionStorage.setItem('aulaGeradaChat', JSON.stringify({
        estrutura: estruturaCompleta,
        tema
      }));
      navigate('/aula-interativa?fromChat=true');
    }
  };

  const getIconeModulo = (index: number) => {
    const icones = [
      <Brain className="w-4 h-4" />,
      <BookOpen className="w-4 h-4" />,
      <Gamepad2 className="w-4 h-4" />,
      <HelpCircle className="w-4 h-4" />
    ];
    return icones[index % icones.length];
  };

  return (
    <Card className="w-full border-accent/30 bg-gradient-to-br from-background to-accent/5 overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-lg text-foreground">
                {titulo || `Aula: ${tema}`}
              </h3>
            </div>
            {descricao && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {descricao}
              </p>
            )}
          </div>
          <Badge variant={isComplete ? "default" : "secondary"} className="shrink-0">
            {isComplete ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Pronta
              </>
            ) : (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Gerando...
              </>
            )}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso da geração</span>
            <span>{modulos.length}/{totalModulos} módulos</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>

        {/* Módulos */}
        <div className="space-y-2">
          {Array.from({ length: totalModulos }).map((_, index) => {
            const modulo = modulos[index];
            const isCurrentlyGenerating = isGenerating && index === modulos.length;
            const isGenerated = modulo !== undefined;
            
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all",
                  isGenerated ? "bg-accent/10 border border-accent/20" : 
                  isCurrentlyGenerating ? "bg-primary/10 border border-primary/30 animate-pulse" :
                  "bg-muted/30 border border-border/50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isGenerated ? "bg-accent text-accent-foreground" :
                  isCurrentlyGenerating ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                )}>
                  {isCurrentlyGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isGenerated ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-sm truncate",
                    isGenerated ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {modulo?.nome || `Módulo ${index + 1}`}
                  </p>
                  {isGenerated && (
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs py-0">
                        <Brain className="w-3 h-3 mr-1" />
                        Teoria
                      </Badge>
                      <Badge variant="outline" className="text-xs py-0">
                        <Gamepad2 className="w-3 h-3 mr-1" />
                        {modulo.flashcards?.length || 0} cards
                      </Badge>
                      <Badge variant="outline" className="text-xs py-0">
                        <HelpCircle className="w-3 h-3 mr-1" />
                        {modulo.questoes?.length || 0} questões
                      </Badge>
                    </div>
                  )}
                  {isCurrentlyGenerating && (
                    <p className="text-xs text-primary mt-1">
                      ✨ Gerando conteúdo...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Prova Final indicator */}
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg transition-all",
            isComplete ? "bg-yellow-500/10 border border-yellow-500/30" :
            "bg-muted/30 border border-border/50"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isComplete ? "bg-yellow-500 text-yellow-950" : "bg-muted text-muted-foreground"
            )}>
              <Trophy className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className={cn(
                "font-medium text-sm",
                isComplete ? "text-foreground" : "text-muted-foreground"
              )}>
                Prova Final
              </p>
              {isComplete && (
                <p className="text-xs text-muted-foreground">
                  {estruturaCompleta?.provaFinal?.length || 10} questões
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isComplete && (
          <Button
            onClick={handleIniciarAula}
            className="w-full gap-2 bg-gradient-to-r from-accent to-primary hover:opacity-90"
            size="lg"
          >
            <Play className="w-5 h-5" />
            Iniciar Aula Interativa
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
