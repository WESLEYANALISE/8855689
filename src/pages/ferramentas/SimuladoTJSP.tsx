import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Scale, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { playFeedbackSound } from "@/hooks/useFeedbackSound";
import { useQuery } from "@tanstack/react-query";

interface QuestaoTJSP {
  Numero: number;
  Enunciado: string;
  "Alternativa A": string;
  "Alternativa B": string;
  "Alternativa C": string;
  "Alternativa D": string;
  "Alternativa E": string;
  Gabarito: string;
  Materia: string;
  Ano: number;
  "Tipo da Prova": string;
  Imagem: string | null;
}

const SimuladoTJSP = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const materiaParam = searchParams.get("materia");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [respostas, setRespostas] = useState<Record<number, { resposta: string; correta: boolean }>>({});
  const [shakeError, setShakeError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Buscar questões
  const { data: questoes, isLoading } = useQuery({
    queryKey: ["simulado-tjsp", materiaParam],
    queryFn: async () => {
      let query = supabase
        .from("SIMULADO-TJSP" as any)
        .select("*")
        .order("Numero", { ascending: true });
      
      if (materiaParam) {
        query = query.eq("Materia", materiaParam);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as QuestaoTJSP[];
    },
  });

  // Buscar matérias disponíveis para estatísticas
  const { data: materias } = useQuery({
    queryKey: ["simulado-tjsp-materias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("SIMULADO-TJSP" as any)
        .select("Materia");
      
      if (error) throw error;
      
      const materiasUnicas = [...new Set((data || []).map((q: any) => q.Materia))];
      return materiasUnicas.filter(Boolean).sort() as string[];
    },
  });

  const currentQuestao = questoes?.[currentIndex];
  const totalQuestoes = questoes?.length || 0;
  const questoesRespondidas = Object.keys(respostas).length;
  const acertos = Object.values(respostas).filter(r => r.correta).length;

  // Processar enunciado para substituir [IMAGEM] pelo link da imagem
  const processarEnunciado = (enunciado: string, imagemUrl: string | null): string => {
    if (!enunciado) return "";
    if (!imagemUrl) return enunciado.replace(/\[IMAGEM\]/gi, "");
    return enunciado;
  };

  // Verificar se enunciado tem marcador de imagem
  const temImagemNoEnunciado = (enunciado: string): boolean => {
    return /\[IMAGEM\]/gi.test(enunciado);
  };

  const handleSelectAnswer = (letter: string) => {
    if (showResult) return;
    setSelectedAnswer(letter);
  };

  const handleConfirm = () => {
    if (!selectedAnswer || !currentQuestao) return;

    const isCorrect = selectedAnswer.toUpperCase() === currentQuestao.Gabarito?.toUpperCase();
    
    // Salvar resposta
    setRespostas(prev => ({
      ...prev,
      [currentQuestao.Numero]: { resposta: selectedAnswer, correta: isCorrect }
    }));

    // Feedback sonoro
    playFeedbackSound(isCorrect ? "correct" : "error");

    if (!isCorrect) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    }

    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestoes - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      // Restaurar estado da questão anterior se já foi respondida
      const questaoAnterior = questoes?.[currentIndex - 1];
      if (questaoAnterior && respostas[questaoAnterior.Numero]) {
        setSelectedAnswer(respostas[questaoAnterior.Numero].resposta);
        setShowResult(true);
      } else {
        setSelectedAnswer(null);
        setShowResult(false);
      }
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setRespostas({});
    toast.success("Simulado reiniciado!");
  };

  // Shake animation
  const shakeVariants = {
    shake: {
      x: [0, -8, 8, -8, 8, -4, 4, 0],
      transition: { duration: 0.5 }
    },
    idle: { x: 0 }
  };

  // Restaurar resposta se já foi respondida
  useEffect(() => {
    if (currentQuestao && respostas[currentQuestao.Numero]) {
      setSelectedAnswer(respostas[currentQuestao.Numero].resposta);
      setShowResult(true);
    }
  }, [currentQuestao, respostas]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando questões...</p>
      </div>
    );
  }

  if (!questoes || questoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <Scale className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">Nenhuma questão encontrada para este simulado.</p>
        <Button onClick={() => navigate("/simulados")} variant="outline">
          Voltar aos Simulados
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate("/simulados")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Simulados</span>
          </button>
          <Button variant="ghost" size="sm" onClick={handleRestart}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reiniciar
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Questão {currentIndex + 1} de {totalQuestoes}</span>
            <span>{questoesRespondidas} respondidas • {acertos} acertos</span>
          </div>
          <Progress value={((currentIndex + 1) / totalQuestoes) * 100} className="h-2" />
        </div>
      </div>

      {/* Conteúdo */}
      <div ref={containerRef} className="flex-1 px-4 py-6 overflow-auto">
        {currentQuestao && (
          <motion.div
            key={currentQuestao.Numero}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Info da questão */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                {currentQuestao.Materia}
              </span>
              <span className="px-2 py-1 bg-muted rounded-full text-muted-foreground">
                {currentQuestao.Ano}
              </span>
              <span className="px-2 py-1 bg-muted rounded-full text-muted-foreground">
                Q{currentQuestao.Numero}
              </span>
            </div>

            {/* Enunciado */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                  {processarEnunciado(currentQuestao.Enunciado, currentQuestao.Imagem)}
                </p>
                
                {/* Imagem se houver [IMAGEM] no enunciado */}
                {temImagemNoEnunciado(currentQuestao.Enunciado) && currentQuestao.Imagem && (
                  <div className="mt-4">
                    <img 
                      src={currentQuestao.Imagem} 
                      alt="Imagem da questão"
                      className="max-w-full rounded-lg border border-border/50"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alternativas */}
            <motion.div 
              className="space-y-2"
              variants={shakeVariants}
              animate={shakeError ? "shake" : "idle"}
            >
              {["A", "B", "C", "D", "E"].map((letter) => {
                const alternativaKey = `Alternativa ${letter}` as keyof QuestaoTJSP;
                const alternativaTexto = currentQuestao[alternativaKey] as string;
                
                if (!alternativaTexto) return null;

                const isSelected = selectedAnswer === letter;
                const isCorrect = currentQuestao.Gabarito?.toUpperCase() === letter;
                const isWrong = showResult && isSelected && !isCorrect;
                const showCorrectHighlight = showResult && isCorrect;

                return (
                  <motion.button
                    key={letter}
                    onClick={() => handleSelectAnswer(letter)}
                    disabled={showResult}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all",
                      "flex items-start gap-3",
                      !showResult && isSelected && "border-primary bg-primary/10",
                      !showResult && !isSelected && "border-border/50 hover:border-border hover:bg-muted/30",
                      showCorrectHighlight && "border-green-500 bg-green-500/10",
                      isWrong && "border-red-500 bg-red-500/10",
                      showResult && !isSelected && !isCorrect && "opacity-50"
                    )}
                    whileTap={{ scale: showResult ? 1 : 0.98 }}
                  >
                    <span className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      !showResult && isSelected && "bg-primary text-primary-foreground",
                      !showResult && !isSelected && "bg-muted text-muted-foreground",
                      showCorrectHighlight && "bg-green-500 text-white",
                      isWrong && "bg-red-500 text-white"
                    )}>
                      {showCorrectHighlight ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isWrong ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        letter
                      )}
                    </span>
                    <span className="text-[15px] leading-relaxed pt-1">
                      {alternativaTexto}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Resultado */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-4"
                >
                  <Card className={cn(
                    "border-2",
                    respostas[currentQuestao.Numero]?.correta 
                      ? "border-green-500/50 bg-green-500/10" 
                      : "border-red-500/50 bg-red-500/10"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {respostas[currentQuestao.Numero]?.correta ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="font-semibold text-green-500">Resposta Correta!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="font-semibold text-red-500">Resposta Incorreta</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Gabarito: <span className="font-bold text-foreground">{currentQuestao.Gabarito}</span>
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Footer fixo com navegação */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 py-4 pb-safe">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {!showResult ? (
            <Button
              onClick={handleConfirm}
              disabled={!selectedAnswer}
              className="flex-[2] bg-primary hover:bg-primary/90"
            >
              Confirmar
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={currentIndex === totalQuestoes - 1}
              className="flex-[2] bg-primary hover:bg-primary/90"
            >
              Próxima
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimuladoTJSP;
