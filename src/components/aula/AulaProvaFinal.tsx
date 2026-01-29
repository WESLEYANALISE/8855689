import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Clock, ChevronRight } from "lucide-react";

interface Questao {
  question: string;
  options: string[];
  correctAnswer: number;
  explicacao: string;
  tempoLimite: number;
}

interface AulaProvaFinalProps {
  questoes: Questao[];
  onFinalizar: (acertos: number, total: number) => void;
}

export const AulaProvaFinal = ({ questoes, onFinalizar }: AulaProvaFinalProps) => {
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostaEscolhida, setRespostaEscolhida] = useState<number | null>(null);
  const [mostrarResposta, setMostrarResposta] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(questoes[0]?.tempoLimite || 45);

  const questao = questoes[questaoAtual];

  useEffect(() => {
    if (!mostrarResposta && tempoRestante > 0) {
      const timer = setInterval(() => {
        setTempoRestante(prev => {
          if (prev <= 1) {
            handleResponder(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [mostrarResposta, tempoRestante, questaoAtual]);

  const handleResponder = (opcao: number | null) => {
    setRespostaEscolhida(opcao);
    setMostrarResposta(true);
    
    if (opcao === questao.correctAnswer) {
      setAcertos(prev => prev + 1);
    }
  };

  const handleProxima = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1);
      setRespostaEscolhida(null);
      setMostrarResposta(false);
      setTempoRestante(questoes[questaoAtual + 1]?.tempoLimite || 45);
    } else {
      onFinalizar(acertos, questoes.length);
    }
  };

  const progressoPorcentagem = ((questaoAtual + 1) / questoes.length) * 100;
  const tempoProgressoPorcentagem = (tempoRestante / questao.tempoLimite) * 100;

  return (
    <div className="min-h-screen pt-16 pb-8 px-3 bg-gradient-to-br from-background to-primary/5">
      <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
        <Card className="p-4 md:p-6 border-2 border-primary/20">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-primary/10 rounded-lg p-2 md:p-3">
                <Trophy className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Prova Final</h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Questão {questaoAtual + 1} de {questoes.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 md:w-5 md:h-5 ${tempoRestante <= 10 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
              <span className={`text-xl md:text-2xl font-bold ${tempoRestante <= 10 ? "text-destructive" : ""}`}>
                {tempoRestante}s
              </span>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
            <Progress value={progressoPorcentagem} className="h-2" />
            <Progress 
              value={tempoProgressoPorcentagem} 
              className={`h-1 ${tempoRestante <= 10 ? "bg-destructive/20" : ""}`}
            />
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="bg-card/50 p-4 md:p-6 rounded-lg border border-border">
              <p className="text-base md:text-lg font-medium leading-relaxed">{questao.question}</p>
            </div>

            <div className="space-y-2 md:space-y-3">
              {questao.options.map((opcao, index) => {
                const isCorreta = index === questao.correctAnswer;
                const isEscolhida = index === respostaEscolhida;
                
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={`w-full justify-start h-auto py-3 md:py-4 px-3 md:px-4 text-left text-sm transition-all ${
                      mostrarResposta
                        ? isCorreta
                          ? "bg-green-500/20 border-green-500 hover:bg-green-500/30"
                          : isEscolhida
                          ? "bg-destructive/20 border-destructive hover:bg-destructive/30"
                          : ""
                        : "hover:border-primary hover:bg-primary/5"
                    }`}
                    onClick={() => !mostrarResposta && handleResponder(index)}
                    disabled={mostrarResposta}
                  >
                    <span className="font-semibold mr-2 md:mr-3">{String.fromCharCode(65 + index)}.</span>
                    {opcao}
                  </Button>
                );
              })}
            </div>

            {mostrarResposta && (
              <div className="bg-primary/5 p-4 md:p-6 rounded-lg border border-primary/20 animate-fade-in">
                <h4 className="font-semibold mb-2 text-primary">Explicação:</h4>
                <p className="text-sm leading-relaxed">{questao.explicacao}</p>
              </div>
            )}
          </div>
        </Card>

        {mostrarResposta && (
          <div className="flex justify-end">
            <Button
              onClick={handleProxima}
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {questaoAtual < questoes.length - 1 ? "Próxima Questão" : "Ver Resultado"}
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
