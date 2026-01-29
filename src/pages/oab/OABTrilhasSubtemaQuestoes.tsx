import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import StandardPageHeader from "@/components/StandardPageHeader";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

interface Questao {
  pergunta: string;
  alternativas: string[];
  correta: number;
  explicacao: string;
}

const OABTrilhasSubtemaQuestoes = () => {
  const { materiaId, topicoId, resumoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Buscar dados do RESUMO (subtema)
  const { data: resumo, isLoading } = useQuery({
    queryKey: ["oab-resumo-questoes", resumoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("RESUMO")
        .select("id, subtema, area, tema, conteudo_gerado")
        .eq("id", parseInt(resumoId!))
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Extrair questões do conteudo_gerado
  const parseQuestoes = (): Questao[] => {
    if (!resumo?.conteudo_gerado) return [];
    
    const conteudo = typeof resumo.conteudo_gerado === 'string' 
      ? JSON.parse(resumo.conteudo_gerado)
      : resumo.conteudo_gerado;
    
    if (Array.isArray(conteudo?.questoes)) {
      return conteudo.questoes;
    }
    return [];
  };

  const questoes = parseQuestoes();
  const questaoAtual = questoes[currentIndex];
  const backPath = `/oab/trilhas-aprovacao/materia/${materiaId}/topicos/${topicoId}/estudo/${resumoId}`;

  const handleSelectAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const handleConfirm = () => {
    if (selectedAnswer === null) return;
    
    if (selectedAnswer === questaoAtual.correta) {
      setAcertos(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = async () => {
    if (currentIndex < questoes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Finalizar
      if (user && topicoId) {
        try {
          const aproveitamento = Math.round((acertos / questoes.length) * 100);
          await supabase
            .from('oab_trilhas_estudo_progresso')
            .upsert({
              user_id: user.id,
              topico_id: parseInt(topicoId),
              pratica_completa: true,
              progresso_questoes: 100,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,topico_id' });
        } catch (error) {
          console.error("Erro ao salvar progresso:", error);
        }
      }
      setCompleted(true);
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
          subtitle={resumo?.subtema}
          backPath={backPath}
        />
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <p className="text-gray-400">Nenhuma questão disponível para este subtema.</p>
          <Button
            onClick={() => navigate(backPath)}
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
    const aproveitamento = Math.round((acertos / questoes.length) * 100);
    const isAprovado = aproveitamento >= 70;
    
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <StandardPageHeader
          title="Questões"
          subtitle={resumo?.subtema}
          backPath={backPath}
        />
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className={`w-20 h-20 rounded-full ${isAprovado ? 'bg-emerald-500/20' : 'bg-amber-500/20'} flex items-center justify-center mb-4`}>
            {isAprovado ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            ) : (
              <XCircle className="w-10 h-10 text-amber-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isAprovado ? "Parabéns!" : "Continue Estudando!"}
          </h2>
          <p className="text-gray-400 mb-2">
            Você acertou {acertos} de {questoes.length} questões
          </p>
          <p className={`text-lg font-semibold mb-6 ${isAprovado ? 'text-emerald-400' : 'text-amber-400'}`}>
            Aproveitamento: {aproveitamento}%
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setShowExplanation(false);
                setAcertos(0);
                setCompleted(false);
              }}
              variant="outline"
            >
              Refazer Questões
            </Button>
            <Button
              onClick={() => navigate(backPath)}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Voltar ao Estudo
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
        subtitle={resumo?.subtema}
        backPath={backPath}
      />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progresso */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Questão {currentIndex + 1} de {questoes.length}</span>
            <span>{acertos} acertos</span>
          </div>
          <Progress 
            value={((currentIndex + 1) / questoes.length) * 100} 
            className="h-2 bg-gray-800"
          />
        </div>

        {/* Questão */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-[#1a1a24] rounded-xl p-6 border border-white/10"
          >
            <p className="text-white text-lg mb-6 leading-relaxed">
              {questaoAtual.pergunta}
            </p>

            {/* Alternativas */}
            <div className="space-y-3">
              {questaoAtual.alternativas.map((alt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === questaoAtual.correta;
                const showResult = showExplanation;
                
                let bgColor = "bg-[#0d0d14]";
                let borderColor = "border-white/10";
                
                if (showResult) {
                  if (isCorrect) {
                    bgColor = "bg-emerald-500/20";
                    borderColor = "border-emerald-500";
                  } else if (isSelected && !isCorrect) {
                    bgColor = "bg-red-500/20";
                    borderColor = "border-red-500";
                  }
                } else if (isSelected) {
                  bgColor = "bg-primary/20";
                  borderColor = "border-primary";
                }
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(idx)}
                    disabled={showExplanation}
                    className={`w-full p-4 rounded-lg border ${borderColor} ${bgColor} text-left transition-all ${!showExplanation && 'hover:bg-white/5'}`}
                  >
                    <span className="text-gray-300">{alt}</span>
                  </button>
                );
              })}
            </div>

            {/* Explicação */}
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30"
              >
                <p className="text-sm font-semibold text-blue-400 mb-2">Explicação:</p>
                <p className="text-gray-300 text-sm">{questaoAtual.explicacao}</p>
              </motion.div>
            )}

            {/* Botões */}
            <div className="mt-6 flex justify-end gap-3">
              {!showExplanation ? (
                <Button
                  onClick={handleConfirm}
                  disabled={selectedAnswer === null}
                  className="bg-primary hover:bg-primary/90"
                >
                  Confirmar
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {currentIndex < questoes.length - 1 ? "Próxima" : "Finalizar"}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OABTrilhasSubtemaQuestoes;
