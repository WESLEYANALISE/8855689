import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, XCircle, RotateCw, Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Questao {
  id: number;
  area: string;
  enunciado: string;
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  resposta: string;
  comentario: string;
}

interface ResultadoState {
  questoes: Questao[];
  respostas: { [key: number]: string };
  tempoDecorrido: number;
  exame?: string;
  ano?: string;
  areas?: string[];
}

const SimuladosResultado = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resultado = location.state as ResultadoState;

  if (!resultado) {
    navigate("/simulados");
    return null;
  }

  const { questoes, respostas, tempoDecorrido } = resultado;

  // Calcular estatísticas
  const total = questoes.length;
  const respondidas = Object.keys(respostas).length;
  const acertos = questoes.filter(
    (q, index) => respostas[index] === q.resposta
  ).length;
  const erros = respondidas - acertos;
  const percentual = ((acertos / total) * 100).toFixed(1);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  // Performance por área
  const performancePorArea = questoes.reduce((acc, q, index) => {
    if (!acc[q.area]) {
      acc[q.area] = { total: 0, acertos: 0 };
    }
    acc[q.area].total++;
    if (respostas[index] === q.resposta) {
      acc[q.area].acertos++;
    }
    return acc;
  }, {} as { [key: string]: { total: number; acertos: number } });

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">
          Resultado do Simulado
        </h1>
        <p className="text-sm text-muted-foreground">
          Confira seu desempenho e revise as questões
        </p>
      </div>

      {/* Card de Performance */}
      <Card className="mb-6 bg-gradient-to-br from-accent/20 to-accent/5">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-accent mb-2">
              {percentual}%
            </div>
            <div className="text-lg font-semibold text-foreground mb-1">
              {acertos} de {total} questões corretas
            </div>
            <div className="text-sm text-muted-foreground">
              Tempo total: {formatTime(tempoDecorrido)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{acertos}</div>
              <div className="text-xs text-muted-foreground">Acertos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{erros}</div>
              <div className="text-xs text-muted-foreground">Erros</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {total - respondidas}
              </div>
              <div className="text-xs text-muted-foreground">Não respondidas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance por Área */}
      {Object.keys(performancePorArea).length > 1 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4">Performance por Área</h3>
            <div className="space-y-3">
              {Object.entries(performancePorArea).map(([area, stats]) => (
                <div key={area} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{area}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.acertos}/{stats.total} (
                    {((stats.acertos / stats.total) * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revisão de Questões */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h3 className="font-semibold mb-4">Revisão de Questões</h3>
          <Accordion type="single" collapsible className="w-full">
            {questoes.map((questao, index) => {
              const respUsuario = respostas[index];
              const acertou = respUsuario === questao.resposta;
              const respondeu = respUsuario !== undefined;

              const alternativas = [
                { letra: "A", texto: questao.alternativaA },
                { letra: "B", texto: questao.alternativaB },
                { letra: "C", texto: questao.alternativaC },
                { letra: "D", texto: questao.alternativaD },
              ];

              return (
                <AccordionItem key={questao.id} value={`questao-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 w-full text-left">
                      {respondeu ? (
                        acertou ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                        )
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted shrink-0" />
                      )}
                      <span className="flex-1 text-sm">
                        Questão {index + 1} - {questao.area}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 space-y-4">
                      <p className="text-sm leading-relaxed">
                        {questao.enunciado}
                      </p>

                      <div className="space-y-2">
                        {alternativas.map((alt) => {
                          const isCorreta = alt.letra === questao.resposta;
                          const isEscolhida = alt.letra === respUsuario;

                          return (
                            <div
                              key={alt.letra}
                              className={cn(
                                "p-3 rounded-lg border-2 text-sm",
                                isCorreta &&
                                  "border-green-500 bg-green-500/10",
                                isEscolhida &&
                                  !isCorreta &&
                                  "border-red-500 bg-red-500/10",
                                !isCorreta &&
                                  !isEscolhida &&
                                  "border-border bg-card"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <span className="font-bold shrink-0">
                                  {alt.letra}.
                                </span>
                                <span className="flex-1">{alt.texto}</span>
                                {isCorreta && (
                                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                )}
                                {isEscolhida && !isCorreta && (
                                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {questao.comentario && (
                        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                          <p className="text-sm font-semibold mb-1 text-accent">
                            💡 Comentário:
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">
                            {questao.comentario}
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate("/simulados")} className="flex-1">
          <Home className="w-4 h-4 mr-2" />
          Início
        </Button>
        <Button onClick={() => navigate("/simulados")} className="flex-1">
          <RotateCw className="w-4 h-4 mr-2" />
          Novo Simulado
        </Button>
      </div>
    </div>
  );
};

export default SimuladosResultado;
