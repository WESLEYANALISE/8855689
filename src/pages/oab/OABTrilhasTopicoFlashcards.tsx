import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronLeft, ChevronRight, RotateCcw, Sparkles, Trophy, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";
import StandardPageHeader from "@/components/StandardPageHeader";
import { useAuth } from "@/contexts/AuthContext";

interface Flashcard {
  frente: string;
  verso: string;
  exemplo?: string;
}

const OABTrilhasTopicoFlashcards = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardsVistos, setCardsVistos] = useState<Set<number>>(new Set());
  const [concluido, setConcluido] = useState(false);

  // Buscar flashcards (prioriza RESUMO; fallback para oab_trilhas_topicos)
  const { data: payload, isLoading } = useQuery({
    queryKey: ["oab-trilha-topico-flashcards", id],
    queryFn: async () => {
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) throw new Error("ID inválido");

      // 1) Tenta RESUMO (subtema)
      const { data: resumo, error: resumoError } = await supabase
        .from("RESUMO")
        .select("id, subtema, area, tema, conteudo_gerado")
        .eq("id", numericId)
        .maybeSingle();

      if (!resumoError && resumo?.conteudo_gerado) {
        const conteudo = resumo.conteudo_gerado as unknown as Record<string, unknown>;
        const flashcards = (conteudo?.flashcards as unknown as Flashcard[]) || [];

        return {
          source: "resumo" as const,
          titulo: resumo.subtema ?? "Flashcards",
          area: resumo.area,
          tema: resumo.tema,
          flashcards,
        };
      }

      // 2) Fallback: tópico (rota antiga)
      const { data: topico, error: topicoError } = await supabase
        .from("oab_trilhas_topicos")
        .select(`*, materia:oab_trilhas_materias(*)`)
        .eq("id", numericId)
        .maybeSingle();
      if (topicoError) throw topicoError;

      return {
        source: "topico" as const,
        titulo: topico?.titulo ?? "Flashcards",
        area: null,
        tema: null,
        flashcards: ((topico as any)?.flashcards as unknown as Flashcard[]) || [],
      };
    },
  });

  const flashcards: Flashcard[] = payload?.flashcards || [];
  const currentCard = flashcards[currentIndex];
  const totalCards = flashcards.length;
  const progressoPercent = totalCards > 0 ? Math.round((cardsVistos.size / totalCards) * 100) : 0;

  // Determinar caminho de volta - vai para lista de subtemas da trilha OAB
  const backPath = "/oab/trilhas-aprovacao";

  // Marcar card como visto ao virar
  useEffect(() => {
    if (isFlipped && !cardsVistos.has(currentIndex)) {
      setCardsVistos(prev => new Set([...prev, currentIndex]));
    }
  }, [isFlipped, currentIndex]);

  // Verificar conclusão
  useEffect(() => {
    if (cardsVistos.size === totalCards && totalCards > 0 && !concluido) {
      setConcluido(true);
      salvarProgresso(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [cardsVistos.size, totalCards]);

  // Salvar progresso no banco
  const salvarProgresso = async (completo: boolean) => {
    if (!user?.id || !id) return;
    
    try {
      await supabase
        .from('oab_trilhas_estudo_progresso')
        .upsert({
          user_id: user.id,
          topico_id: parseInt(id),
          flashcards_completos: completo,
          progresso_flashcards: 100,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id,topico_id'
        });
    } catch (e) {
      console.error('Erro ao salvar progresso:', e);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 100);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 100);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReset = () => {
    setIsFlipped(false);
    setCurrentIndex(0);
    setCardsVistos(new Set());
    setConcluido(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!flashcards.length) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <StandardPageHeader
          title="Flashcards"
          subtitle={payload?.titulo}
          backPath={backPath}
        />
        <div className="flex flex-col items-center justify-center p-4 text-center pt-20">
          <p className="text-gray-400 mb-4">Nenhum flashcard disponível para este tópico.</p>
          <Button variant="outline" onClick={() => navigate(backPath)}>Voltar às Trilhas</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14] pb-24">
      {/* Header */}
      <StandardPageHeader
        title="Flashcards"
        subtitle={payload?.titulo}
        backPath={backPath}
      />

      {/* Progress Bar e Stats */}
      <div className="sticky top-0 z-40 bg-[#0d0d14]/95 backdrop-blur-sm border-b border-white/10">
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Card {currentIndex + 1} de {totalCards}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-400 font-medium">{cardsVistos.size} vistos</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 text-xs h-7 text-gray-400 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </Button>
            </div>
          </div>
          <Progress value={progressoPercent} className="h-1.5" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {concluido ? (
            <motion.div
              key="resultado"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8"
            >
              <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center bg-purple-500/20">
                  <Trophy className="w-12 h-12 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Parabéns!</h2>
                <p className="text-gray-400">Você revisou todos os flashcards</p>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                <p className="text-3xl font-bold text-purple-400">{totalCards}</p>
                <p className="text-sm text-gray-400">Flashcards revisados</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={handleReset} className="bg-gradient-to-r from-purple-500 to-indigo-600">
                  Revisar Novamente
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(backPath)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Voltar às Trilhas
                </Button>
                <Button 
                  onClick={() => navigate(`/oab/trilhas-aprovacao/topico/${id}/questoes`)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Ir para Questões →
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="py-4"
            >
              {/* Flashcard com Flip */}
              <div
                className="relative w-full min-h-[280px] cursor-pointer perspective-1000"
                onClick={handleFlip}
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  className="w-full min-h-[280px] relative"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front - Pergunta */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col"
                    style={{
                      backfaceVisibility: 'hidden',
                      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      boxShadow: '0 10px 40px -10px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-violet-300" />
                      <span className="text-xs text-violet-300 font-medium uppercase tracking-wider">Pergunta</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-lg font-medium text-white text-center leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                        {currentCard?.frente}
                      </p>
                    </div>
                    <div className="text-center mt-4">
                      <span className="text-xs text-violet-300/60 inline-flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" />
                        Toque para ver a resposta
                      </span>
                    </div>
                  </div>

                  {/* Back - Resposta */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span className="text-xs text-emerald-300 font-medium uppercase tracking-wider">Resposta</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-base text-white text-center leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                        {currentCard?.verso}
                      </p>
                    </div>
                    <div className="text-center mt-4">
                      <span className="text-xs text-emerald-300/60">
                        Toque para voltar à pergunta
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Exemplo Prático (se houver) */}
              {isFlipped && currentCard?.exemplo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💡</span>
                    <p className="text-sm font-semibold text-amber-500">Exemplo Prático</p>
                  </div>
                  <p className="text-sm text-white leading-relaxed">
                    {currentCard.exemplo}
                  </p>
                </motion.div>
              )}

              {/* Indicador de Visto */}
              {cardsVistos.has(currentIndex) && (
                <div className="flex items-center justify-center gap-2 mt-4 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-medium">Card revisado</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer de Navegação */}
      {!concluido && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d14]/95 backdrop-blur-sm border-t border-white/10 p-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex-1 gap-2 border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            
            {/* Progress dots */}
            <div className="flex items-center gap-1 px-2">
              {flashcards.slice(
                Math.max(0, currentIndex - 2),
                Math.min(totalCards, currentIndex + 3)
              ).map((_, idx) => {
                const realIdx = Math.max(0, currentIndex - 2) + idx;
                return (
                  <div
                    key={realIdx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      realIdx === currentIndex
                        ? 'bg-purple-500 w-4'
                        : cardsVistos.has(realIdx)
                          ? 'bg-emerald-500'
                          : 'bg-white/20'
                    }`}
                  />
                );
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === totalCards - 1}
              className="flex-1 gap-2 border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OABTrilhasTopicoFlashcards;
