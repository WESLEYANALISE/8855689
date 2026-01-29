import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Award, Users, GraduationCap, TrendingUp, Medal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const RankingFaculdadeDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: faculdade, isLoading } = useQuery({
    queryKey: ["faculdade", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("RANKING-FACULDADES")
        .select("*")
        .eq("id", Number(id))
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "Federal":
        return "bg-green-600";
      case "Estadual":
        return "bg-blue-600";
      case "Privada":
        return "bg-purple-600";
      default:
        return "bg-gray-600";
    }
  };

  const getPosicaoBadge = (posicao: number) => {
    if (posicao === 1) return { icon: Trophy, text: "1º Lugar", color: "bg-yellow-600" };
    if (posicao === 2) return { icon: Medal, text: "2º Lugar", color: "bg-gray-400" };
    if (posicao === 3) return { icon: Award, text: "3º Lugar", color: "bg-amber-600" };
    if (posicao <= 10) return { icon: TrendingUp, text: `Top 10 - ${posicao}º`, color: "bg-primary" };
    return { icon: GraduationCap, text: `${posicao}º Lugar`, color: "bg-secondary" };
  };

  if (isLoading) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!faculdade) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
        <Button onClick={() => navigate("/ranking-faculdades")} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <p className="text-center text-muted-foreground">Faculdade não encontrada.</p>
      </div>
    );
  }

  const posicaoBadge = getPosicaoBadge(faculdade.posicao);
  const PosicaoIcon = posicaoBadge.icon;

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button onClick={() => navigate("/ranking-faculdades")} variant="ghost" className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar ao Ranking
      </Button>

      {/* Card Principal */}
      <Card className="mb-6 bg-gradient-to-br from-card to-card/80 border-2 border-primary/30">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-full ${posicaoBadge.color} shadow-lg`}>
              <PosicaoIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{faculdade.universidade}</CardTitle>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={getTipoColor(faculdade.tipo)}>
                  {faculdade.tipo}
                </Badge>
                <Badge variant="outline">{faculdade.estado}</Badge>
                <Badge className={posicaoBadge.color}>
                  {posicaoBadge.text}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">
                {faculdade.nota_geral?.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Nota Geral</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="text-3xl font-bold mb-1">
                {faculdade.avaliacao_cn}º
              </div>
              <p className="text-xs text-muted-foreground">Aval. CN</p>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg">
              <div className="text-3xl font-bold text-accent mb-1">
                {faculdade.avaliacao_mec?.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Aval. MEC</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Detalhadas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Métricas de Qualidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Qualidade de Ensino</span>
              <span className="text-sm font-bold text-primary">{faculdade.qualidade}º</span>
            </div>
            <Progress value={(23 - faculdade.qualidade) / 22 * 100} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Nota dos Doutores</span>
              <span className="text-sm font-bold">{faculdade.nota_doutores?.toFixed(2)}/10</span>
            </div>
            <Progress value={(faculdade.nota_doutores || 0) * 10} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Qualidade dos Doutores</span>
              <span className="text-sm font-bold text-primary">{faculdade.qualidade_doutores}º</span>
            </div>
            <Progress value={(23 - faculdade.qualidade_doutores) / 22 * 100} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Nota dos Concluintes</span>
              <span className="text-sm font-bold">{faculdade.nota_concluintes?.toFixed(2)}/10</span>
            </div>
            <Progress value={(faculdade.nota_concluintes || 0) * 10} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Card de Corpo Docente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Corpo Docente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <GraduationCap className="w-8 h-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold mb-1">{faculdade.quantidade_doutores}</div>
              <p className="text-xs text-muted-foreground">Doutores</p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <Award className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary mb-1">
                {faculdade.nota_doutores?.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Nota Média</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Destaques */}
      {faculdade.posicao <= 3 && (
        <Card className="mt-6 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Destaques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {faculdade.posicao === 1 && (
                <Badge variant="secondary" className="bg-yellow-600">
                  🏆 Melhor Faculdade do Brasil
                </Badge>
              )}
              {faculdade.avaliacao_cn <= 3 && (
                <Badge variant="secondary" className="bg-blue-600 ml-2">
                  ⭐ Top 3 Avaliação CN
                </Badge>
              )}
              {faculdade.avaliacao_mec && faculdade.avaliacao_mec >= 8 && (
                <Badge variant="secondary" className="bg-green-600 ml-2">
                  ✅ Nota Máxima MEC
                </Badge>
              )}
              {faculdade.qualidade <= 5 && (
                <Badge variant="secondary" className="bg-purple-600 ml-2">
                  📚 Top 5 em Qualidade
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RankingFaculdadeDetalhes;
