import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Map, ArrowLeft, Play, Info, BarChart3, ChevronRight, RotateCcw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JornadaProgressoCircular } from "@/components/jornada/JornadaProgressoCircular";
import { JornadaStreakCard } from "@/components/jornada/JornadaStreakCard";
import { JornadaAreaSelector } from "@/components/jornada/JornadaAreaSelector";
import { JornadaBoasVindas } from "@/components/jornada/JornadaBoasVindas";
import { JornadaEstatisticas } from "@/components/jornada/JornadaEstatisticas";
import { useJornadaProgresso } from "@/hooks/useJornadaProgresso";
import { useAuth } from "@/contexts/AuthContext";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

type EtapaSetup = "boas-vindas" | "area" | "andamento";

const JornadaJuridica = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progresso, loading, iniciarJornada, fetchProgresso, jornadasExistentes } = useJornadaProgresso();
  
  const [etapa, setEtapa] = useState<EtapaSetup>("boas-vindas");
  const [areaSelecionada, setAreaSelecionada] = useState<string | null>(null);
  const [totalArtigosArea, setTotalArtigosArea] = useState(0);

  useEffect(() => {
    if (progresso && progresso.area_selecionada) {
      setEtapa("andamento");
      setAreaSelecionada(progresso.area_selecionada);
      setTotalArtigosArea(progresso.total_artigos);
    }
  }, [progresso]);

  const handleAreaSelect = (area: string, totalArtigos: number) => {
    setAreaSelecionada(area);
    setTotalArtigosArea(totalArtigos);
  };

  // Simplified: each day = 1 article, no duration selector
  const handleIniciar = async () => {
    if (!areaSelecionada) return;
    
    // Duration = total articles (1 article per day)
    const result = await iniciarJornada(areaSelecionada, totalArtigosArea, totalArtigosArea);
    if (result) {
      setEtapa("andamento");
    }
  };

  const handleContinuar = () => {
    navigate("/jornada-juridica/trilha");
  };

  const handleNovaJornada = () => {
    setEtapa("area");
    setAreaSelecionada(null);
  };

  const handleSelecionarJornadaExistente = async (area: string) => {
    await fetchProgresso(area);
    setEtapa("andamento");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Map className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2">Faça login para continuar</h2>
            <p className="text-muted-foreground mb-4">
              A Jornada Jurídica salva seu progresso automaticamente.
            </p>
            <Button onClick={() => navigate("/auth")}>Entrar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="p-2 rounded-full bg-primary/10">
              <Map className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Jornada Jurídica</h1>
              <p className="text-xs text-muted-foreground">
                {etapa === "andamento" && progresso
                  ? `${progresso.area_selecionada}`
                  : "Estude no seu ritmo"}
              </p>
            </div>
          </div>

          <div className="flex gap-1">
            {etapa === "andamento" && progresso && (
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

            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="w-5 h-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Como funciona?</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <h3 className="font-semibold">🎯 Objetivo</h3>
                    <p className="text-sm text-muted-foreground">
                      Estude uma matéria completa com aulas interativas detalhadas,
                      1 artigo por dia.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">📚 Cada aula inclui</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>Storytelling:</strong> Histórias envolventes</li>
                      <li>• <strong>Explicações:</strong> Conteúdo detalhado</li>
                      <li>• <strong>Exemplos:</strong> Casos práticos</li>
                      <li>• <strong>Matching:</strong> Jogo de conceitos</li>
                      <li>• <strong>Flashcards:</strong> Memorização</li>
                      <li>• <strong>Quiz:</strong> Questões de fixação</li>
                      <li>• <strong>Prova Final:</strong> Teste completo</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">🔥 Streak</h3>
                    <p className="text-sm text-muted-foreground">
                      Mantenha uma sequência de dias para aumentar seu streak!
                    </p>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Boas-vindas */}
            {etapa === "boas-vindas" && (
              <motion.div
                key="boas-vindas"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <JornadaBoasVindas onComecar={() => setEtapa("area")} />
                
                {/* Jornadas existentes */}
                {jornadasExistentes.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                      Ou continue uma jornada existente:
                    </p>
                    <div className="space-y-2">
                      {jornadasExistentes.map((j) => (
                        <Card
                          key={j.id}
                          className="cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => handleSelecionarJornadaExistente(j.area_selecionada || "")}
                        >
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{j.area_selecionada}</p>
                              <p className="text-xs text-muted-foreground">
                                Dia {j.dia_atual} de {j.total_dias} • {j.dias_completos.length} completos
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Seleção de área */}
            {etapa === "area" && (
              <motion.div
                key="area"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold">Escolha sua matéria</h2>
                  <p className="text-sm text-muted-foreground">
                    Cada dia você fará uma aula interativa completa
                  </p>
                </div>

                <JornadaAreaSelector
                  areaSelecionada={areaSelecionada}
                  onSelect={handleAreaSelect}
                />

                {areaSelecionada && (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{areaSelecionada}</p>
                          <p className="text-sm text-muted-foreground">
                            {totalArtigosArea} aulas interativas • 1 por dia
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setEtapa("boas-vindas")} className="flex-1">
                    Voltar
                  </Button>
                  <Button
                    onClick={handleIniciar}
                    className="flex-1 gap-2"
                    disabled={!areaSelecionada}
                  >
                    <Play className="w-4 h-4" />
                    Iniciar Jornada
                  </Button>
                </div>
              </motion.div>
            )}
            {/* Jornada em andamento */}
            {etapa === "andamento" && progresso && (
              <motion.div
                key="andamento"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Progresso visual */}
                <div className="flex flex-col items-center gap-4">
                  <JornadaProgressoCircular
                    diaAtual={progresso.dia_atual}
                    totalDias={progresso.total_dias}
                    size={140}
                  />
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">Dia {progresso.dia_atual}</h2>
                    <p className="text-muted-foreground">
                      {progresso.dias_completos.length} dias completos de{" "}
                      {progresso.total_dias}
                    </p>
                  </div>
                </div>

                {/* Streak */}
                <JornadaStreakCard
                  streakAtual={progresso.streak_atual}
                  maiorStreak={progresso.maior_streak}
                />

                {/* Info da jornada */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{progresso.area_selecionada}</p>
                        <p className="text-sm text-muted-foreground">
                          {progresso.artigos_por_dia} artigo
                          {progresso.artigos_por_dia > 1 ? "s" : ""}/dia •{" "}
                          {progresso.total_dias} dias total
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleNovaJornada}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Trocar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Botão principal */}
                <Button onClick={handleContinuar} className="w-full h-14 text-lg gap-2">
                  <Play className="w-5 h-5" />
                  Continuar Dia {progresso.dia_atual}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default JornadaJuridica;
