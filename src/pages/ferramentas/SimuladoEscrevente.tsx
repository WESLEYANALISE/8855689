import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, FileQuestion, BookOpen, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface SimuladoAno {
  ano: number;
  banca: string;
  orgao: string;
  nivel: string;
  totalQuestoes: number;
}

const SimuladoEscrevente = () => {
  const navigate = useNavigate();

  // Buscar anos disponíveis
  const { data: anos, isLoading } = useQuery({
    queryKey: ["simulado-escrevente-anos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("SIMULADO-ESCREVENTE" as any)
        .select("Ano, Banca, Orgao, Nivel, Questao");

      if (error) throw error;

      // Agrupar por ano
      const porAno: Record<number, SimuladoAno> = {};
      (data as any[])?.forEach((q) => {
        const ano = q.Ano;
        if (!porAno[ano]) {
          porAno[ano] = {
            ano: q.Ano,
            banca: q.Banca,
            orgao: q.Orgao,
            nivel: q.Nivel,
            totalQuestoes: 0
          };
        }
        porAno[ano].totalQuestoes++;
      });

      return Object.values(porAno).sort((a, b) => b.ano - a.ano);
    }
  });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/simulados")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Escrevente Técnico Judiciário
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Simulados por ano de prova
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">TJ-SP • VUNESP</h3>
                <p className="text-sm text-muted-foreground">
                  Provas do concurso de Escrevente Técnico Judiciário do Tribunal de Justiça de São Paulo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Anos */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Provas Disponíveis</h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              {anos?.map((simulado) => (
                <Card
                  key={simulado.ano}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/ferramentas/simulados/escrevente/${simulado.ano}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-xl font-bold text-primary">{simulado.ano}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Prova {simulado.ano}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {simulado.banca}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileQuestion className="w-3 h-3" />
                              {simulado.totalQuestoes} questões
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {simulado.nivel}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {!isLoading && (!anos || anos.length === 0) && (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-6 text-center">
              <FileQuestion className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Nenhum simulado disponível no momento
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SimuladoEscrevente;
