import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Scale, BookOpen, Loader2, Play, ListChecks } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SimuladoTJSPMaterias = () => {
  const navigate = useNavigate();

  // Buscar matérias e contagem
  const { data: materiasData, isLoading } = useQuery({
    queryKey: ["simulado-tjsp-materias-contagem"],
    queryFn: async (): Promise<{ materia: string; quantidade: number }[]> => {
      const { data, error } = await supabase
        .from("SIMULADO-TJSP" as any)
        .select("Materia, Numero");
      
      if (error) throw error;
      
      // Agrupar por matéria
      const materiasMap: Record<string, number> = {};
      (data || []).forEach((q: any) => {
        if (q.Materia) {
          materiasMap[q.Materia] = (materiasMap[q.Materia] || 0) + 1;
        }
      });

      // Converter para array ordenado
      return Object.entries(materiasMap)
        .map(([materia, quantidade]) => ({ materia, quantidade }))
        .sort((a, b) => a.materia.localeCompare(b.materia));
    },
  });

  const totalQuestoes = materiasData?.reduce((acc, m) => acc + m.quantidade, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando matérias...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-background to-background pointer-events-none" />

      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-6 relative">
        {/* Header */}
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className="bg-blue-500/20 backdrop-blur-sm rounded-2xl p-3 shadow-lg ring-2 ring-blue-500/30"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Scale className="w-6 h-6 text-blue-400" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">TJSP 2025</h1>
            <p className="text-muted-foreground text-sm">Escrevente Técnico Judiciário</p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{totalQuestoes}</p>
              <p className="text-xs text-muted-foreground">Questões</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{materiasData?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Matérias</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Botão para iniciar simulado completo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={() => navigate("/simulados/tjsp/resolver")}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-lg font-semibold"
          >
            <Play className="w-5 h-5 mr-2" />
            Iniciar Simulado Completo
          </Button>
        </motion.div>

        {/* Divisor */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">ou escolha por matéria</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Lista de matérias */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {materiasData?.map((item, index) => (
            <motion.div
              key={item.materia}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.03 }}
            >
              <Card 
                className="overflow-hidden cursor-pointer hover:bg-muted/30 transition-all border-l-4 border-l-blue-500/50"
                onClick={() => navigate(`/simulados/tjsp/resolver?materia=${encodeURIComponent(item.materia)}`)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-4">
                    {/* Ícone */}
                    <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-blue-500/10">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 py-3 pr-4">
                      <h3 className="font-semibold text-sm text-foreground">
                        {item.materia}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {item.quantidade} {item.quantidade === 1 ? 'questão' : 'questões'}
                      </p>
                    </div>

                    {/* Ícone de seta */}
                    <div className="pr-4">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ListChecks className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Sobre este simulado</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Questões da prova de Escrevente Técnico Judiciário do Tribunal de Justiça de São Paulo (TJSP) 
                    aplicada em 2025. Banca: VUNESP.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SimuladoTJSPMaterias;
