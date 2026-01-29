import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import StandardPageHeader from "@/components/StandardPageHeader";

interface Questao {
  pergunta: string;
  alternativas: string[];
  correta: number;
  explicacao: string;
}

type QuestaoRaw = {
  pergunta?: string;
  alternativas?: string[];
  enunciado?: string;
  opcoes?: string[];
  correta?: number;
  explicacao?: string;
};

const OABTrilhasTopicoQuestoes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Buscar questões (prioriza RESUMO; fallback para oab_trilhas_topicos)
  const { data: payload, isLoading } = useQuery({
    queryKey: ["oab-trilha-topico-questoes", id],
    queryFn: async () => {
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) throw new Error("ID inválido");

      // 1) Tenta RESUMO (subtema)
      const { data: resumo, error: resumoError } = await supabase
        .from("RESUMO")
        .select("id, subtema, conteudo_gerado")
        .eq("id", numericId)
        .maybeSingle();

      if (!resumoError && resumo?.conteudo_gerado) {
        const conteudo = resumo.conteudo_gerado as unknown as Record<string, unknown>;
        const rawQuestoes = (conteudo?.questoes as unknown as QuestaoRaw[]) || [];
        const questoes: Questao[] = rawQuestoes
          .map((q) => ({
            pergunta: q.pergunta ?? q.enunciado ?? "",
            alternativas: q.alternativas ?? q.opcoes ?? [],
            correta: typeof q.correta === "number" ? q.correta : -1,
            explicacao: q.explicacao ?? "",
          }))
          .filter((q) => q.pergunta && Array.isArray(q.alternativas) && q.alternativas.length > 0 && q.correta >= 0);

        return {
          source: "resumo" as const,
          titulo: resumo.subtema ?? "Questões",
          questoes,
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
        titulo: topico?.titulo ?? "Questões",
        questoes: ((topico as any)?.questoes as unknown as Questao[]) || [],
      };
    },
  });

  const questoes: Questao[] = payload?.questoes || [];
  const currentQuestion = questoes[currentIndex];
  const isLastQuestion = currentIndex === questoes.length - 1;

  const handleAnswer = (index: number) => {
    if (showExplanation) return;
    
    setSelectedAnswer(index);
    setShowExplanation(true);
    
    if (index === currentQuestion?.correta) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      // Marcar prática como completa
      if (user && id) {
        try {
          await supabase
            .from('oab_trilhas_estudo_progresso')
            .upsert({
              user_id: user.id,
              topico_id: parseInt(id),
              pratica_completa: true,
              progresso_questoes: 100,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,topico_id' });
        } catch (error) {
          console.error("Erro ao salvar progresso:", error);
        }
      }
      setCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!questoes.length) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <StandardPageHeader
          title="Questões"
          subtitle={payload?.titulo}
          backPath={`/oab/trilhas-aprovacao/topico/${id}`}
        />
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <p className="text-gray-400">Nenhuma questão disponível para este tópico.</p>
          <Button
            onClick={() => navigate(`/oab/trilhas-aprovacao/topico/${id}`)}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (completed) {
    const percentage = Math.round((score / questoes.length) * 100);
    
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <StandardPageHeader
          title="Resultado"
          subtitle={payload?.titulo}
          backPath={`/oab/trilhas-aprovacao/topico/${id}`}
        />
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6"
          >
            <Trophy className="w-12 h-12 text-emerald-400" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-white mb-2">Parabéns!</h2>
          <p className="text-gray-400 mb-6">Você completou todas as questões.</p>
          
          <div className="bg-white/5 rounded-2xl p-6 mb-6 w-full max-w-sm">
            <div className="text-5xl font-bold text-emerald-400 mb-2">{percentage}%</div>
            <p className="text-gray-400">
              {score} de {questoes.length} questões corretas
            </p>
            
            {/* Barra de progresso */}
            <div className="h-3 bg-white/10 rounded-full overflow-hidden mt-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate(`/oab/trilhas-aprovacao/topico/${id}`)}
              variant="outline"
            >
              Voltar ao Tópico
            </Button>
            <Button
              onClick={() => {
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setShowExplanation(false);
                setScore(0);
                setCompleted(false);
              }}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Refazer Questões
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <StandardPageHeader
        title="Questões"
        subtitle={`${currentIndex + 1} de ${questoes.length}`}
        backPath={`/oab/trilhas-aprovacao/topico/${id}`}
      />

      <div className="p-4 max-w-2xl mx-auto">
        {/* Barra de progresso */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questoes.length) * 100}%` }}
          />
        </div>

        {/* Pergunta */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6"
          >
            <p className="text-white text-lg leading-relaxed">
              {currentQuestion?.pergunta}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Alternativas */}
        <div className="space-y-3">
          {currentQuestion?.alternativas.map((alt, idx) => {
            const isCorrect = idx === currentQuestion.correta;
            const isSelected = idx === selectedAnswer;
            
            return (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleAnswer(idx)}
                disabled={showExplanation}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  showExplanation
                    ? isCorrect
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : isSelected
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    : 'bg-white/5 border-white/10 text-white hover:border-white/30 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    showExplanation
                      ? isCorrect
                        ? 'bg-emerald-500 text-white'
                        : isSelected
                          ? 'bg-red-500 text-white'
                          : 'bg-white/10 text-gray-500'
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {showExplanation && isCorrect ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : showExplanation && isSelected && !isCorrect ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </span>
                  <span className="flex-1">{alt}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Explicação */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <p className="text-sm text-gray-300 leading-relaxed">
                {currentQuestion?.explicacao}
              </p>
              
              <Button
                onClick={handleNext}
                className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                {isLastQuestion ? "Ver Resultado" : "Próxima Questão →"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OABTrilhasTopicoQuestoes;
