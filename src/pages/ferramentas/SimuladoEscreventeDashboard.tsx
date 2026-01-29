import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, BookOpen, Clock, FileQuestion, Trophy, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface MateriaCount {
  materia: string;
  count: number;
}

const SimuladoEscreventeDashboard = () => {
  const navigate = useNavigate();
  const { ano } = useParams();

  // Buscar informações da prova
  const { data: provaInfo, isLoading } = useQuery({
    queryKey: ["simulado-escrevente-dashboard", ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("SIMULADO-ESCREVENTE" as any)
        .select("Ano, Banca, Orgao, Nivel, Materia, Questao")
        .eq("Ano", parseInt(ano || "0"));

      if (error) throw error;

      const questoes = data as any[];
      
      // Agrupar por matéria
      const materiaMap: Record<string, number> = {};
      questoes.forEach((q) => {
        const materia = q.Materia || "Outros";
        materiaMap[materia] = (materiaMap[materia] || 0) + 1;
      });

      const materias: MateriaCount[] = Object.entries(materiaMap)
        .map(([materia, count]) => ({ materia, count }))
        .sort((a, b) => b.count - a.count);

      return {
        ano: questoes[0]?.Ano,
        banca: questoes[0]?.Banca,
        orgao: questoes[0]?.Orgao,
        nivel: questoes[0]?.Nivel,
        totalQuestoes: questoes.length,
        materias
      };
    },
    enabled: !!ano
  });

  // Tempo estimado (média de 2 min por questão)
  const tempoEstimado = provaInfo ? Math.ceil(provaInfo.totalQuestoes * 2) : 0;

  const handleIniciar = () => {
    navigate(`/ferramentas/simulados/escrevente/${ano}/resolver`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-6">
        <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!provaInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Prova não encontrada</p>
        <Button onClick={() => navigate("/ferramentas/simulados/escrevente")} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6 pb-32">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas/simulados/escrevente")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Prova {provaInfo.ano}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {provaInfo.banca} • {provaInfo.orgao}
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <FileQuestion className="w-6 h-6 text-primary mb-2" />
              <span className="text-2xl font-bold text-foreground">{provaInfo.totalQuestoes}</span>
              <span className="text-xs text-muted-foreground">Questões</span>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Clock className="w-6 h-6 text-amber-500 mb-2" />
              <span className="text-2xl font-bold text-foreground">{tempoEstimado}</span>
              <span className="text-xs text-muted-foreground">Minutos</span>
            </CardContent>
          </Card>
          
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <GraduationCap className="w-6 h-6 text-emerald-500 mb-2" />
              <span className="text-2xl font-bold text-foreground">{provaInfo.materias.length}</span>
              <span className="text-xs text-muted-foreground">Matérias</span>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-500/5 border-purple-500/20">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Trophy className="w-6 h-6 text-purple-500 mb-2" />
              <Badge variant="outline" className="mt-1">
                {provaInfo.nivel}
              </Badge>
              <span className="text-xs text-muted-foreground mt-1">Nível</span>
            </CardContent>
          </Card>
        </div>

        {/* Matérias */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Questões por Matéria</h2>
          </div>
          
          <div className="space-y-2">
            {provaInfo.materias.map((item) => {
              const percentage = (item.count / provaInfo.totalQuestoes) * 100;
              return (
                <Card key={item.materia} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground truncate flex-1">
                        {item.materia}
                      </span>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        {item.count} {item.count === 1 ? 'questão' : 'questões'}
                      </Badge>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Dicas */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2">💡 Dicas para a prova</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Reserve um ambiente tranquilo sem distrações</li>
              <li>• Leia cada questão com atenção antes de responder</li>
              <li>• Não há limite de tempo, mas tente simular condições reais</li>
              <li>• Ao finalizar, você verá seu desempenho detalhado</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Botão Fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-4xl mx-auto">
          <Button
            size="lg"
            onClick={handleIniciar}
            className="w-full h-14 text-lg gap-2 bg-primary hover:bg-primary/90"
          >
            <Play className="w-5 h-5" />
            Iniciar Simulado
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimuladoEscreventeDashboard;
