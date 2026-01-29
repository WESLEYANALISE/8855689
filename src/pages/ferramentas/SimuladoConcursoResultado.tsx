import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Trophy, Clock, Target, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const SimuladoConcursoResultado = () => {
  const navigate = useNavigate();
  const { concurso } = useParams();
  const location = useLocation();
  const { acertos = 0, total = 0, tempo = 0 } = location.state || {};

  const percentual = total > 0 ? Math.round((acertos / total) * 100) : 0;
  const erros = total - acertos;

  const formatarTempo = (segundos: number) => {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    if (h > 0) {
      return `${h}h ${m}min`;
    }
    return `${m}min ${s}s`;
  };

  const getDesempenho = () => {
    if (percentual >= 80) return { texto: "Excelente!", cor: "text-green-500" };
    if (percentual >= 60) return { texto: "Bom trabalho!", cor: "text-yellow-500" };
    if (percentual >= 40) return { texto: "Continue estudando", cor: "text-orange-500" };
    return { texto: "Precisa melhorar", cor: "text-red-500" };
  };

  const desempenho = getDesempenho();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Simulado Concluído!
          </h1>
          <p className={`text-lg font-medium mt-2 ${desempenho.cor}`}>
            {desempenho.texto}
          </p>
        </div>

        {/* Resultado Principal */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-primary">{percentual}%</p>
              <p className="text-muted-foreground mt-1">de aproveitamento</p>
            </div>
            <Progress value={percentual} className="h-3" />
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-5 h-5 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-500">{acertos}</p>
              <p className="text-xs text-muted-foreground">Acertos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-5 h-5 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold text-red-500">{erros}</p>
              <p className="text-xs text-muted-foreground">Erros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-lg font-bold">{formatarTempo(tempo)}</p>
              <p className="text-xs text-muted-foreground">Tempo</p>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              📊 Você respondeu {total} questões em {formatarTempo(tempo)}. 
              Continue praticando para melhorar seu desempenho!
            </p>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate(`/ferramentas/simulados/${concurso}/resolver`)}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Refazer Simulado
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => navigate("/ferramentas/simulados")}
          >
            <Home className="w-5 h-5 mr-2" />
            Voltar aos Simulados
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimuladoConcursoResultado;
