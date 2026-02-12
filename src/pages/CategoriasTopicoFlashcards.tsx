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

interface Flashcard { frente: string; verso: string; exemplo?: string; }

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const CategoriasTopicoFlashcards = () => {
  const { topicoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardsVistos, setCardsVistos] = useState<Set<number>>(new Set());
  const [concluido, setConcluido] = useState(false);

  useEffect(() => { if (user && !isAdmin) navigate("/", { replace: true }); }, [user, isAdmin]);

  const { data: topico, isLoading } = useQuery({
    queryKey: ["categorias-topico-flashcards", topicoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_topicos")
        .select("*, materia:categorias_materias(*)")
        .eq("id", parseInt(topicoId!))
        .single();
      if (error) throw error;
      return data;
    },
  });

  const flashcards: Flashcard[] = (topico?.flashcards as unknown as Flashcard[]) || [];
  const currentCard = flashcards[currentIndex];
  const totalCards = flashcards.length;
  const progressoPercent = totalCards > 0 ? Math.round((cardsVistos.size / totalCards) * 100) : 0;

  useEffect(() => {
    if (isFlipped && !cardsVistos.has(currentIndex)) setCardsVistos(prev => new Set([...prev, currentIndex]));
  }, [isFlipped, currentIndex]);

  useEffect(() => {
    if (cardsVistos.size === totalCards && totalCards > 0 && !concluido) {
      setConcluido(true);
      if (user?.id && topicoId) {
        supabase.from("categorias_progresso").upsert({
          user_id: user.id, topico_id: parseInt(topicoId), flashcards_concluidos: true, updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,topico_id' });
      }
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [cardsVistos.size, totalCards]);

  if (isLoading) return <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  if (!flashcards.length) return (
    <div className="min-h-screen bg-[#0d0d14]">
      <StandardPageHeader title="Flashcards" subtitle={topico?.titulo} backPath={`/categorias/topico/${topicoId}/estudo`} />
      <div className="flex flex-col items-center justify-center p-4 text-center pt-20">
        <p className="text-gray-400 mb-4">Nenhum flashcard disponível.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d14] pb-24">
      <StandardPageHeader title="Flashcards" subtitle={topico?.titulo} backPath={`/categorias/topico/${topicoId}/estudo`} />
      <div className="sticky top-0 z-40 bg-[#0d0d14]/95 backdrop-blur-sm border-b border-white/10">
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Card {currentIndex + 1} de {totalCards}</span>
            <Button variant="ghost" size="sm" onClick={() => { setIsFlipped(false); setCurrentIndex(0); setCardsVistos(new Set()); setConcluido(false); }} className="gap-1.5 text-xs h-7 text-gray-400 hover:text-white">
              <RotateCcw className="w-3.5 h-3.5" />Reiniciar
            </Button>
          </div>
          <Progress value={progressoPercent} className="h-1.5" />
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {concluido ? (
            <motion.div key="resultado" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center bg-purple-500/20">
                <Trophy className="w-12 h-12 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Parabéns!</h2>
              <p className="text-gray-400 mb-6">Todos os flashcards revisados</p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => { setIsFlipped(false); setCurrentIndex(0); setCardsVistos(new Set()); setConcluido(false); }} className="bg-gradient-to-r from-purple-500 to-indigo-600">Revisar Novamente</Button>
                <Button onClick={() => navigate(`/categorias/topico/${topicoId}/questoes`)} className="bg-emerald-500 hover:bg-emerald-600">Ir para Questões →</Button>
                <Button variant="outline" onClick={() => navigate(-1)} className="border-white/20 text-white hover:bg-white/10">Voltar</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key={currentIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="py-4">
              <div className="relative w-full min-h-[280px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)} style={{ perspective: '1000px' }}>
                <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }} className="w-full min-h-[280px] relative" style={{ transformStyle: 'preserve-3d' }}>
                  <div className="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col" style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                    <div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-violet-300" /><span className="text-xs text-violet-300 font-medium uppercase tracking-wider">Pergunta</span></div>
                    <div className="flex-1 flex items-center justify-center"><p className="text-lg font-medium text-white text-center leading-relaxed">{currentCard?.frente}</p></div>
                    <div className="text-center mt-4"><span className="text-xs text-violet-300/60 inline-flex items-center gap-1"><RotateCcw className="w-3 h-3" />Toque para ver a resposta</span></div>
                  </div>
                  <div className="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div className="flex items-center gap-2 mb-4"><CheckCircle2 className="w-4 h-4 text-emerald-300" /><span className="text-xs text-emerald-300 font-medium uppercase tracking-wider">Resposta</span></div>
                    <div className="flex-1 flex items-center justify-center"><p className="text-base text-white text-center leading-relaxed">{currentCard?.verso}</p></div>
                  </div>
                </motion.div>
              </div>
              {isFlipped && currentCard?.exemplo && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-500 mb-1">💡 Exemplo Prático</p>
                  <p className="text-sm text-white leading-relaxed">{currentCard.exemplo}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!concluido && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d14]/95 backdrop-blur-sm border-t border-white/10 p-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentIndex(Math.max(0, currentIndex - 1)), 100); }} disabled={currentIndex === 0} className="flex-1 gap-2 border-white/20 text-white hover:bg-white/10">
              <ChevronLeft className="w-4 h-4" />Anterior
            </Button>
            <Button variant="outline" onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentIndex(Math.min(totalCards - 1, currentIndex + 1)), 100); }} disabled={currentIndex === totalCards - 1} className="flex-1 gap-2 border-white/20 text-white hover:bg-white/10">
              Próximo<ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriasTopicoFlashcards;
