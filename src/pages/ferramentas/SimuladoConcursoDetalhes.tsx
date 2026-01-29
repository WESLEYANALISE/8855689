import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Clock, FileQuestion, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SimuladoConcursoDetalhes = () => {
  const navigate = useNavigate();
  const { concurso } = useParams();

  // Dados do concurso baseado no ID
  const concursoInfo = {
    "tjsp-2024": {
      nome: "TJSP",
      banca: "VUNESP",
      ano: 2024,
      cargo: "Escrevente Técnico Judiciário",
      tabela: "SIMULADO-TJSP"
    }
  }[concurso || ""] || null;

  // Buscar estatísticas das questões
  const { data: stats } = useQuery({
    queryKey: ["simulado-stats", concurso],
    queryFn: async () => {
      if (!concursoInfo) return null;
      
      const { data, error } = await supabase
        .from("SIMULADO-TJSP" as any)
        .select("Materia, Numero");
      
      if (error) throw error;
      
      const totalQuestoes = data?.length || 0;
      const areas = [...new Set((data as unknown as { Materia: string }[])?.map(q => q.Materia).filter(Boolean))];
      
      return { totalQuestoes, areas };
    },
    enabled: !!concursoInfo
  });

  if (!concursoInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Concurso não encontrado</p>
        <Button onClick={() => navigate("/ferramentas/simulados")} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas/simulados")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {concursoInfo.nome} {concursoInfo.ano}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {concursoInfo.cargo}
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <FileQuestion className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats?.totalQuestoes || 0}</p>
              <p className="text-xs text-muted-foreground">Questões</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">5h</p>
              <p className="text-xs text-muted-foreground">Tempo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{concursoInfo.banca}</p>
              <p className="text-xs text-muted-foreground">Banca</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats?.areas?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Áreas</p>
            </CardContent>
          </Card>
        </div>

        {/* Áreas */}
        {stats?.areas && stats.areas.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Áreas de Conhecimento</h3>
              <div className="flex flex-wrap gap-2">
                {stats.areas.map((area) => (
                  <span
                    key={area}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Iniciar */}
        <Button
          size="lg"
          className="w-full"
          onClick={() => navigate(`/ferramentas/simulados/${concurso}/resolver`)}
        >
          <Play className="w-5 h-5 mr-2" />
          Iniciar Simulado
        </Button>
      </div>
    </div>
  );
};

export default SimuladoConcursoDetalhes;
