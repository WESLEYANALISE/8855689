import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Questao {
  enunciado: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
  dificuldade?: string;
}

const BibliotecaClassicosAnaliseQuestoes = () => {
  const { livroId, temaId } = useParams();
  const navigate = useNavigate();
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [quizFinalizado, setQuizFinalizado] = useState(false);

  // Buscar tema
  const { data: tema, isLoading } = useQuery({
    queryKey: ["biblioteca-classicos-tema-questoes", temaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biblioteca_classicos_temas")
        .select("*")
        .eq("id", temaId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Buscar livro
  const { data: livro } = useQuery({
    queryKey: ["biblioteca-classicos-livro-questoes", livroId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-CLASSICOS")
        .select("livro")
        .eq("id", livroId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const parseJsonField = (field: any): any[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    return [];
  };

  const questoes: Questao[] = parseJsonField(tema?.questoes);
  const questaoAtual = questoes[questaoIndex];
  const progresso = ((questaoIndex + 1) / questoes.length) * 100;

  const playSound = (type: 'correct' | 'error') => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      console.log("Áudio não disponível");
    }
  };

  const verificarResposta = (index: number) => {
    if (respostaSelecionada !== null) return;
    
    setRespostaSelecionada(index);
    setMostrarExplicacao(true);
    
    const correct = index === questaoAtual.correta;
    if (correct) {
      playSound('correct');
      setAcertos(prev => prev + 1);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 600);
    } else {
      playSound('error');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }

    // Scroll para mostrar explicação
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const proximaQuestao = () => {
    if (questaoIndex < questoes.length - 1) {
      setQuestaoIndex(prev => prev + 1);
      setRespostaSelecionada(null);
      setMostrarExplicacao(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setQuizFinalizado(true);
    }
  };

  const reiniciarQuiz = () => {
    setQuestaoIndex(0);
    setRespostaSelecionada(null);
    setMostrarExplicacao(false);
    setAcertos(0);
    setQuizFinalizado(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!tema || questoes.length === 0) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Nenhuma questão disponível</p>
        <Button onClick={() => navigate(`/biblioteca-classicos/${livroId}/analise/${temaId}`)}>
          Voltar
        </Button>
      </div>
    );
  }

  // Tela de resultado final
  if (quizFinalizado) {
    const percentual = Math.round((acertos / questoes.length) * 100);
    const nota = percentual >= 70 ? 'Excelente!' : percentual >= 50 ? 'Bom trabalho!' : 'Continue estudando!';
    
    return (
      <div className="min-h-screen bg-[#0d0d14] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-6"
        >
          <Trophy className="w-12 h-12 text-white" />
        </motion.div>
        
        <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
          Quiz Concluído!
        </h1>
        
        <p className="text-gray-400 mb-8 text-center">
          {tema.titulo}
        </p>
        
        <div className="bg-[#12121a] rounded-xl border border-white/10 p-6 w-full max-w-sm mb-6">
          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-amber-400">{acertos}</span>
            <span className="text-2xl text-gray-500">/{questoes.length}</span>
          </div>
          
          <Progress value={percentual} className="h-3 mb-2" />
          
          <p className="text-center text-gray-400">{percentual}% de aproveitamento</p>
          
          <p className={`text-center font-medium mt-4 ${
            percentual >= 70 ? 'text-green-400' : percentual >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {nota}
          </p>
        </div>
        
        <div className="flex gap-3 w-full max-w-sm">
          <Button
            variant="outline"
            onClick={reiniciarQuiz}
            className="flex-1 bg-transparent border-white/10 text-gray-400 hover:bg-white/5"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refazer
          </Button>
          <Button
            onClick={() => navigate(`/biblioteca-classicos/${livroId}/analise/${temaId}`)}
            className="flex-1 bg-amber-600 hover:bg-amber-700"
          >
            Voltar ao Tema
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-[#0d0d14]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate(`/biblioteca-classicos/${livroId}/analise/${temaId}`)}
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Voltar</span>
            </button>
            
            <div className="text-sm text-gray-400">
              <span className="text-amber-400 font-medium">{questaoIndex + 1}</span>
              <span>/{questoes.length}</span>
            </div>
          </div>
          
          <Progress value={progresso} className="h-1.5" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Info do tema */}
        <p className="text-xs text-gray-500 mb-4">
          {livro?.livro} • {tema.titulo}
        </p>

        {/* Dificuldade */}
        {questaoAtual.dificuldade && (
          <span className={`inline-block px-2 py-1 rounded text-xs mb-4 ${
            questaoAtual.dificuldade === 'facil' ? 'bg-green-500/20 text-green-400' :
            questaoAtual.dificuldade === 'medio' ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {questaoAtual.dificuldade === 'facil' ? 'Fácil' :
             questaoAtual.dificuldade === 'medio' ? 'Médio' : 'Difícil'}
          </span>
        )}

        {/* Enunciado */}
        <motion.div
          key={questaoIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-[#12121a] rounded-xl border border-white/10 p-5 mb-6 ${
            isShaking ? 'animate-shake' : ''
          } ${isPulsing ? 'animate-pulse' : ''}`}
        >
          <p className="text-white leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
            {questaoAtual.enunciado}
          </p>
        </motion.div>

        {/* Opções */}
        <div className="space-y-3 mb-6">
          {questaoAtual.opcoes.map((opcao, index) => {
            const isSelected = respostaSelecionada === index;
            const isCorrect = index === questaoAtual.correta;
            const showResult = respostaSelecionada !== null;
            
            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => verificarResposta(index)}
                disabled={respostaSelecionada !== null}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  showResult
                    ? isCorrect
                      ? 'border-green-500 bg-green-500/10'
                      : isSelected
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-white/5 bg-[#12121a]/50 opacity-50'
                    : 'border-white/10 bg-[#12121a] hover:border-amber-500/50 hover:bg-amber-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    showResult
                      ? isCorrect
                        ? 'bg-green-500'
                        : isSelected
                          ? 'bg-red-500'
                          : 'bg-white/10'
                      : 'bg-white/10'
                  }`}>
                    {showResult && isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : showResult && isSelected ? (
                      <XCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs text-gray-400">{String.fromCharCode(65 + index)}</span>
                    )}
                  </div>
                  <span className={`${
                    showResult
                      ? isCorrect
                        ? 'text-green-400'
                        : isSelected
                          ? 'text-red-400'
                          : 'text-gray-500'
                      : 'text-gray-300'
                  }`}>
                    {opcao}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Explicação */}
        {mostrarExplicacao && questaoAtual.explicacao && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mb-6"
          >
            <p className="text-xs text-amber-500 uppercase tracking-wider font-medium mb-2">
              Explicação
            </p>
            <p className="text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              {questaoAtual.explicacao}
            </p>
          </motion.div>
        )}

        {/* Botão Próxima */}
        {respostaSelecionada !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={proximaQuestao}
              className="w-full bg-amber-600 hover:bg-amber-700 py-6"
            >
              {questaoIndex < questoes.length - 1 ? (
                <>
                  Próxima Questão
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  Ver Resultado
                  <Trophy className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Placar flutuante */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#12121a]/95 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-green-400 font-medium">{acertos}</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-400 font-medium">{questaoIndex - acertos + (respostaSelecionada !== null ? 1 : 0) - (respostaSelecionada === questaoAtual?.correta ? 1 : 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibliotecaClassicosAnaliseQuestoes;
