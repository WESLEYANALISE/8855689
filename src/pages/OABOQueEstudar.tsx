import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

const OABOQueEstudar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: materias, isLoading } = useQuery({
    queryKey: ["plano-estudos-materias"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("PLANO DE ESTUDOS- MATERIAS")
        .select("*");

      if (error) {
        console.error("Erro ao buscar matérias:", error);
        throw error;
      }

      console.log("Dados brutos da tabela:", data);
      console.log("Primeira linha:", data?.[0]);
      console.log("Colunas disponíveis:", data?.[0] ? Object.keys(data[0]) : []);

      return data;
    },
  });

  // Processar estrutura de colunas da tabela
  // Cada coluna (exceto as de controle) é uma área do direito
  // Cada linha contém um tema/matéria dessa área
  const areas = useMemo(() => {
    if (!materias || materias.length === 0) return [];

    // Pegar as colunas da primeira linha (excluindo id e outras colunas de controle)
    const primeiraLinha = materias[0];
    const todasColunas = Object.keys(primeiraLinha);
    
    console.log("Todas as colunas:", todasColunas);

    // Filtrar colunas que são áreas (excluir id, created_at, etc.)
    const colunasAreas = todasColunas.filter(
      (col) => !["id", "created_at", "updated_at"].includes(col.toLowerCase())
    );

    console.log("Colunas identificadas como áreas:", colunasAreas);

    // Para cada coluna (área), contar quantas matérias não-vazias existem
    const areasList = colunasAreas.map((coluna) => {
      const materiasNaoVazias = materias.filter(
        (row: any) => row[coluna] && row[coluna].toString().trim() !== ""
      ).length;

      return {
        nome: coluna,
        count: materiasNaoVazias,
      };
    }).filter((area) => area.count > 0); // Só incluir áreas com conteúdo

    console.log("Áreas processadas:", areasList);

    return areasList.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [materias]);

  // Filtrar áreas
  const areasFiltradas = useMemo(() => {
    if (!searchTerm) return areas;
    const searchLower = searchTerm.toLowerCase();
    return areas.filter((area: any) =>
      area.nome.toLowerCase().includes(searchLower)
    );
  }, [areas, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[hsl(0,75%,55%)] to-[hsl(350,70%,45%)] text-white p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="max-w-4xl mx-auto pt-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">O que estudar</h1>
              <p className="text-sm text-white/90 mt-1">
                Escolha uma área do Direito para ver as matérias da OAB
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-6 max-w-4xl mx-auto">
        {/* Barra de Pesquisa */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Input
              placeholder="Buscar área do Direito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-base"
            />
          </CardContent>
        </Card>

        {/* Grid de Áreas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {areasFiltradas.map((area: any) => (
            <Card
              key={area.nome}
              className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg group"
              onClick={() => navigate(`/oab/o-que-estudar/${encodeURIComponent(area.nome)}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {area.nome}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {area.count} {area.count === 1 ? "matéria" : "matérias"}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {areasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma área encontrada para "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OABOQueEstudar;
