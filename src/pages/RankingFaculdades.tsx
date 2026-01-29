import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Trophy, Medal, Award, Crown, ArrowLeft, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Faculdade {
  id: number;
  universidade: string;
  estado: string;
  posicao: number;
  tipo: string;
  nota_geral: number;
  nota_doutores: number;
  nota_concluintes: number;
  avaliacao_cn: number;
  avaliacao_mec: number;
  qualidade: number;
  quantidade_doutores: number;
  qualidade_doutores: number;
}

const RankingFaculdades = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("todos");

  const { data: faculdades, isLoading } = useQuery({
    queryKey: ["ranking-faculdades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("RANKING-FACULDADES")
        .select("*")
        .order("posicao", { ascending: true });
      
      if (error) throw error;
      return data as Faculdade[];
    },
  });

  const faculdadesFiltradas = faculdades?.filter((f) => {
    const matchBusca = f.universidade.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = abaAtiva === "todos" || f.tipo === abaAtiva;
    return matchBusca && matchTipo;
  });

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "Federal":
        return "bg-green-600 text-white border-green-600";
      case "Estadual":
        return "bg-blue-600 text-white border-blue-600";
      case "Privada":
        return "bg-purple-600 text-white border-purple-600";
      default:
        return "bg-gray-600 text-white border-gray-600";
    }
  };

  const getPosicaoIcon = (posicao: number) => {
    if (posicao === 1) return <Trophy className="w-7 h-7 text-yellow-400" />;
    if (posicao === 2) return <Medal className="w-7 h-7 text-gray-300" />;
    if (posicao === 3) return <Award className="w-7 h-7 text-amber-600" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header sticky padronizado */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
            <div className="inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10">
              <GraduationCap className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">Ranking de Faculdades</h1>
              <p className="text-muted-foreground text-sm">Melhores instituições de Direito do Brasil</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 py-4 pb-20">

      {/* Busca */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar universidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          {/* Tabs Compactas */}
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="todos" className="text-xs">
                Todos
              </TabsTrigger>
              <TabsTrigger value="Federal" className="text-xs text-green-600">
                Federal
              </TabsTrigger>
              <TabsTrigger value="Estadual" className="text-xs text-blue-600">
                Estadual
              </TabsTrigger>
              <TabsTrigger value="Privada" className="text-xs text-purple-600">
                Privada
              </TabsTrigger>
            </TabsList>

            <TabsContent value={abaAtiva}>
              <div className="space-y-2">
                {faculdadesFiltradas?.map((faculdade) => {
                  const Icon = getPosicaoIcon(faculdade.posicao);
                  
                  return (
                    <Card
                      key={faculdade.id}
                      className="cursor-pointer hover:border-accent transition-all border"
                      onClick={() => navigate(`/ranking-faculdades/${faculdade.id}`)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        {/* Posição */}
                        <div className="flex-shrink-0 w-12 text-center">
                          {faculdade.posicao <= 3 ? (
                            <div className="flex justify-center">
                              {Icon}
                            </div>
                          ) : (
                            <div className="text-lg font-bold text-muted-foreground">
                              {faculdade.posicao}º
                            </div>
                          )}
                        </div>

                        {/* Dados */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-1">
                            {faculdade.universidade}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              className={`text-xs ${getTipoColor(faculdade.tipo)}`}
                              variant="outline"
                            >
                              {faculdade.tipo}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {faculdade.estado}
                            </span>
                          </div>
                        </div>

                        {/* Nota */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-lg font-bold text-primary">
                            {faculdade.nota_geral?.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Nota
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {faculdadesFiltradas?.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma faculdade encontrada.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
      </div>
    </div>
  );
};

export default RankingFaculdades;
