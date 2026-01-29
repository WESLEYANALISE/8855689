import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Footprints, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JornadaTrilhaVisual } from "@/components/jornada/JornadaTrilhaVisual";
import { JornadaProgressoCircular } from "@/components/jornada/JornadaProgressoCircular";
import { JornadaEstatisticas } from "@/components/jornada/JornadaEstatisticas";
import { useJornadaProgresso } from "@/hooks/useJornadaProgresso";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const JornadaJuridicaTrilha = () => {
  const navigate = useNavigate();
  const { progresso, loading } = useJornadaProgresso();

  const handleDiaClick = (dia: number) => {
    navigate(`/jornada-juridica/dia/${dia}`);
  };

  if (!progresso && !loading) {
    navigate("/jornada-juridica");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/jornada-juridica")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="p-2 rounded-full bg-primary/10">
              <Footprints className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Sua Trilha</h1>
              <p className="text-xs text-muted-foreground">
                {progresso?.area_selecionada || "Carregando..."}
              </p>
            </div>
          </div>

          {progresso && (
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon">
                  <BarChart3 className="w-5 h-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Estatísticas</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 pb-8 max-h-[70vh] overflow-y-auto">
                  <JornadaEstatisticas
                    diasCompletos={progresso.dias_completos.length}
                    totalDias={progresso.total_dias}
                    streakAtual={progresso.streak_atual}
                    maiorStreak={progresso.maior_streak}
                    artigosPorDia={progresso.artigos_por_dia}
                    area={progresso.area_selecionada || ""}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : progresso ? (
          <>
            {/* Resumo do progresso */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <JornadaProgressoCircular
                  diaAtual={progresso.dia_atual}
                  totalDias={progresso.total_dias}
                  size={80}
                />
                <div>
                  <p className="text-sm text-muted-foreground">Progresso geral</p>
                  <p className="text-xl font-bold">
                    {Math.round((progresso.dias_completos.length / progresso.total_dias) * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {progresso.artigos_por_dia} artigo{progresso.artigos_por_dia > 1 ? "s" : ""}/dia
                  </p>
                </div>
              </div>

              <Button onClick={() => handleDiaClick(progresso.dia_atual)} className="gap-2">
                Ir para Dia {progresso.dia_atual}
              </Button>
            </motion.div>

            {/* Trilha visual */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Footprints className="w-5 h-5 text-primary" />
                  Trilha de Estudos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <JornadaTrilhaVisual
                  diaAtual={progresso.dia_atual}
                  diasCompletos={progresso.dias_completos}
                  totalDias={progresso.total_dias}
                  onDiaClick={handleDiaClick}
                />
              </CardContent>
            </Card>

            {/* Legenda */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Completo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary ring-2 ring-primary/30" />
                <span className="text-muted-foreground">Atual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-muted border border-border" />
                <span className="text-muted-foreground">Pendente</span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default JornadaJuridicaTrilha;
