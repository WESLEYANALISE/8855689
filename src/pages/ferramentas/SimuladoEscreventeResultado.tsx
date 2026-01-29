import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Trophy, Clock, Target, RotateCcw, Home, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const SimuladoEscreventeResultado = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ano } = useParams();
  
  const { acertos = 0, total = 0, tempo = 0 } = location.state || {};

  const percentual = total > 0 ? Math.round((acertos / total) * 100) : 0;
  
  const formatarTempo = (segundos: number) => {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getResultadoInfo = () => {
    if (percentual >= 80) {
      return {
        titulo: "Excelente!",
        descricao: "Você está muito bem preparado!",
        cor: "text-green-500",
        bg: "bg-green-500/10"
      };
    } else if (percentual >= 60) {
      return {
        titulo: "Bom trabalho!",
        descricao: "Continue praticando para melhorar ainda mais.",
        cor: "text-yellow-500",
        bg: "bg-yellow-500/10"
      };
    } else {
      return {
        titulo: "Continue estudando!",
        descricao: "Revise os conteúdos e tente novamente.",
        cor: "text-orange-500",
        bg: "bg-orange-500/10"
      };
    }
  };

  const resultado = getResultadoInfo();

  return (
    <div className="flex flex-col min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className={`w-20 h-20 mx-auto rounded-full ${resultado.bg} flex items-center justify-center mb-4`}>
            <Trophy className={`w-10 h-10 ${resultado.cor}`} />
          </div>
          <h1 className={`text-3xl font-bold ${resultado.cor}`}>
            {resultado.titulo}
          </h1>
          <p className="text-muted-foreground">
            {resultado.descricao}
          </p>
          <p className="text-sm text-muted-foreground">
            Prova do Escrevente TJ-SP {ano}
          </p>
        </div>

        {/* Score Principal */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <span className="text-6xl font-bold text-primary">{percentual}%</span>
              <p className="text-muted-foreground mt-1">de aproveitamento</p>
            </div>
            <Progress value={percentual} className="h-3" />
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-500">{acertos}</p>
              <p className="text-xs text-muted-foreground">Acertos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold text-red-500">{total - acertos}</p>
              <p className="text-xs text-muted-foreground">Erros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-lg font-bold">{formatarTempo(tempo)}</p>
              <p className="text-xs text-muted-foreground">Tempo</p>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Total de questões: {total}</p>
                <p className="text-xs text-muted-foreground">
                  Média de {tempo > 0 ? Math.round(tempo / total) : 0}s por questão
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={() => navigate(`/ferramentas/simulados/escrevente/${ano}/resolver`)}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refazer Simulado
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/ferramentas/simulados/escrevente")}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar aos Simulados
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimuladoEscreventeResultado;
