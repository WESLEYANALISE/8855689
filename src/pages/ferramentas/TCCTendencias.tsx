import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Sparkles, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TCCTema {
  id: string;
  area_direito: string;
  tema: string;
  descricao: string | null;
  relevancia: number;
  tema_saturado: boolean;
  oportunidade: boolean;
}

const TCCTendencias = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [temasMaisPesquisados, setTemasMaisPesquisados] = useState<TCCTema[]>([]);
  const [temasOportunidade, setTemasOportunidade] = useState<TCCTema[]>([]);
  const [temasSaturados, setTemasSaturados] = useState<TCCTema[]>([]);

  useEffect(() => {
    carregarTendencias();
  }, []);

  const carregarTendencias = async () => {
    try {
      // Buscar temas mais relevantes (mais pesquisados)
      const { data: relevantes, error: errRelevantes } = await supabase
        .from("tcc_temas_sugeridos")
        .select("*")
        .order("relevancia", { ascending: false })
        .limit(10);

      if (errRelevantes) throw errRelevantes;
      setTemasMaisPesquisados(relevantes || []);

      // Buscar oportunidades
      const { data: oportunidades, error: errOportunidades } = await supabase
        .from("tcc_temas_sugeridos")
        .select("*")
        .eq("oportunidade", true)
        .order("relevancia", { ascending: false })
        .limit(8);

      if (errOportunidades) throw errOportunidades;
      setTemasOportunidade(oportunidades || []);

      // Buscar saturados
      const { data: saturados, error: errSaturados } = await supabase
        .from("tcc_temas_sugeridos")
        .select("*")
        .eq("tema_saturado", true)
        .order("relevancia", { ascending: false })
        .limit(6);

      if (errSaturados) throw errSaturados;
      setTemasSaturados(saturados || []);
    } catch (error) {
      console.error("Erro ao carregar tendências:", error);
      toast.error("Erro ao carregar tendências");
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (tema: string) => {
    navigate(`/ferramentas/tcc/buscar?q=${encodeURIComponent(tema)}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-6">
        <div className="flex-1 px-4 py-4 space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas/tcc")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Tendências e Oportunidades
            </h1>
            <p className="text-xs text-muted-foreground">
              Temas atuais para 2024/2025
            </p>
          </div>
        </div>

        {/* Mais Pesquisados */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Temas Mais Pesquisados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {temasMaisPesquisados.map((tema, index) => (
              <div
                key={tema.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleBuscar(tema.tema)}
              >
                <span className="text-sm font-medium text-muted-foreground w-6">
                  {index + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {tema.tema}
                  </p>
                  <p className="text-xs text-muted-foreground">{tema.area_direito}</p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {tema.relevancia}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Oportunidades */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-green-600">
              <Sparkles className="h-4 w-4" />
              Oportunidades (Pouco Exploradas)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {temasOportunidade.map((tema) => (
              <div
                key={tema.id}
                className="p-3 rounded-lg bg-background/50 hover:bg-background cursor-pointer transition-colors"
                onClick={() => handleBuscar(tema.tema)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {tema.tema}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tema.descricao}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {tema.area_direito}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Temas Saturados */}
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              Temas Saturados (Evite ou Inove)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {temasSaturados.map((tema) => (
                <Badge
                  key={tema.id}
                  variant="outline"
                  className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30 cursor-pointer hover:bg-yellow-500/20"
                  onClick={() => handleBuscar(tema.tema)}
                >
                  {tema.tema}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Esses temas possuem muitos trabalhos. Se optar por algum, busque um diferencial único.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <Button
          variant="default"
          className="w-full"
          onClick={() => navigate("/ferramentas/tcc/sugestoes")}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Gerar Sugestões Personalizadas para Mim
        </Button>
      </div>
    </div>
  );
};

export default TCCTendencias;
