import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";

// Função para normalizar texto (remover acentos e lowercase)
const normalizeText = (text: string | null | undefined): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

interface Materia {
  id: number;
  area: string;
  materia: string;
}

interface Resumo {
  id: number;
  area: string;
  tema: string;
  subtema: string | null;
}

const OABOQueEstudarArea = () => {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const [searchTerm, setSearchTerm] = useState("");

  const areaDecoded = decodeURIComponent(area || "");

  // Buscar matérias da área (são os valores da coluna correspondente)
  const { data: dadosTabela, isLoading: loadingMaterias } = useQuery({
    queryKey: ["plano-estudos-materias", areaDecoded],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("PLANO DE ESTUDOS- MATERIAS")
        .select("*");

      if (error) {
        console.error("Erro ao buscar matérias:", error);
        throw error;
      }

      console.log("Dados da tabela:", data);
      console.log("Área selecionada:", areaDecoded);

      // Extrair matérias da coluna correspondente à área
      const materiasDaArea: Materia[] = [];
      
      data?.forEach((row: any, index: number) => {
        // Verificar se a coluna existe e tem valor
        if (row[areaDecoded] && row[areaDecoded].toString().trim() !== "") {
          materiasDaArea.push({
            id: index + 1,
            area: areaDecoded,
            materia: row[areaDecoded].toString().trim(),
          });
        }
      });

      console.log("Matérias extraídas:", materiasDaArea);
      return materiasDaArea;
    },
  });

  // Buscar todos os resumos para fazer matching
  const { data: resumos, isLoading: loadingResumos } = useQuery({
    queryKey: ["resumos-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("RESUMO")
        .select("id, area, tema, subtema");

      if (error) throw error;
      return data as Resumo[];
    },
  });

  // Fazer matching de matérias com resumos
  const materiasComResumos = useMemo(() => {
    if (!dadosTabela || !resumos) return [];

    return dadosTabela.map((materia) => {
      const materiaNormalizada = normalizeText(materia.materia);

      // Buscar match no tema primeiro
      let resumoMatch = resumos.find((resumo) => {
        const temaNormalizado = normalizeText(resumo.tema);
        return temaNormalizado && temaNormalizado === materiaNormalizada;
      });

      // Se não achou no tema, buscar no subtema
      if (!resumoMatch) {
        resumoMatch = resumos.find((resumo) => {
          const subtemaNormalizado = normalizeText(resumo.subtema);
          return subtemaNormalizado && subtemaNormalizado === materiaNormalizada;
        });
      }

      return {
        ...materia,
        temResumo: !!resumoMatch,
        resumo: resumoMatch || null,
      };
    });
  }, [dadosTabela, resumos]);

  // Filtrar matérias
  const materiasFiltradas = useMemo(() => {
    if (!searchTerm) return materiasComResumos;
    const searchLower = searchTerm.toLowerCase();
    return materiasComResumos.filter((materia) =>
      materia.materia.toLowerCase().includes(searchLower)
    );
  }, [materiasComResumos, searchTerm]);

  const isLoading = loadingMaterias || loadingResumos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const totalMaterias = materiasComResumos.length;
  const materiasComConteudo = materiasComResumos.filter((m) => m.temResumo).length;

  return (
    <div className="min-h-screen pb-20">
      {/* Header Melhorado */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)] shadow-lg">
        <div className="relative px-4 py-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{areaDecoded}</h1>
            <div className="flex items-center justify-center gap-4 text-sm text-white/90">
              <span>{totalMaterias} {totalMaterias === 1 ? "matéria" : "matérias"}</span>
              <span>•</span>
              <span className="font-semibold">{materiasComConteudo} com conteúdo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-6 max-w-4xl mx-auto">
        {/* Barra de Pesquisa */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Input
              placeholder="Buscar matéria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-base"
            />
          </CardContent>
        </Card>

        {/* Lista de Matérias - Layout Uniforme */}
        <div className="grid grid-cols-1 gap-3">
          {materiasFiltradas.map((materia) => (
            <Card key={materia.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  {/* Conteúdo Principal */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-2 line-clamp-2">
                      {materia.materia}
                    </h3>
                    
                    {/* Badge de Status */}
                    <div className="mb-2">
                      {materia.temResumo ? (
                        <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Conteúdo disponível
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="border">
                          <Clock className="w-3 h-3 mr-1" />
                          Em breve
                        </Badge>
                      )}
                    </div>

                    {/* Informação de localização */}
                    {materia.temResumo && materia.resumo && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {materia.resumo.area} → {materia.resumo.tema}
                      </p>
                    )}
                  </div>

                  {/* Botão de Ação */}
                  <div className="flex-shrink-0">
                    {materia.temResumo && materia.resumo && (
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/resumos-juridicos/prontos/${encodeURIComponent(
                              materia.resumo!.area
                            )}/${encodeURIComponent(materia.resumo!.tema)}`
                          )
                        }
                        className="whitespace-nowrap"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Ver conteúdo
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {materiasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma matéria encontrada para "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OABOQueEstudarArea;
