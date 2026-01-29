import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, X, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import StandardPageHeader from "@/components/StandardPageHeader";
import { useAuth } from "@/contexts/AuthContext";

interface Questao {
  enunciado: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
  exemplo?: string;
  dificuldade?: string;
}

const ConceitosTopicoQuestoes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [quizFinalizado, setQuizFinalizado] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Buscar tópico com questões
  const { data: topico, isLoading } = useQuery({
    queryKey: ["conceitos-topico-questoes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_topicos")
        .select(`
          *,
          materia:conceitos_materias(nome, id)
        `)
        .eq("id", parseInt(id!))
        .single();

      if (error) throw error;
      return data;
    },
  });

  const questoes: Questao[] = (topico?.questoes as unknown as Questao[]) || [];
  const questaoAtual = questoes[questaoIndex];

  // Salvar progresso quando finalizar
  useEffect(() => {
    if (quizFinalizado && user?.id && id) {
      salvarProgresso();
    }
  }, [quizFinalizado]);

  const salvarProgresso = async () => {
    if (!user?.id || !id) return;
    
    try {
      await (supabase as any)
        .from('conceitos_topicos_progresso')
        .upsert({
          user_id: user.id,
          topico_id: parseInt(id),
          pratica_completa: true,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id,topico_id'
        });
    } catch (e) {
      console.error('Erro ao salvar progresso:', e);
    }
  };

  // Reproduz som de acerto/erro
  const playSound = (type: 'correct' | 'error') => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      console.log("Áudio não disponível");
    }
  };

  // Reproduz narração de feedback
  const playNarracao = async (acertou: boolean) => {
    if (isPlayingAudio) return;
    
    try {
      setIsPlayingAudio(true);
      
      const tipoFeedback = acertou ? 'acertou' : 'errou';
      const { data: cacheData } = await supabase
        .from('AUDIO_FEEDBACK_CACHE')
        .select('url_audio')
        .eq('tipo', tipoFeedback)
        .single();
      
      if (cacheData?.url_audio) {
        const audio = new Audio(cacheData.url_audio);
        audio.volume = 0.7;
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        await audio.play();
      } else {
        setIsPlayingAudio(false);
      }
    } catch (e) {
      console.error("Erro ao reproduzir narração:", e);
      setIsPlayingAudio(false);
    }
  };

  const verificarResposta = async (index: number) => {
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
    
    playNarracao(correct);
    
    setTimeout(() => {
      window.scrollTo({ 
        top: document.body.scrollHeight, 
        behavior: 'smooth' 
      });
    }, 100);
  };

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const proximaQuestao = () => {
    if (questaoIndex < questoes.length - 1) {
      setQuestaoIndex(prev => prev + 1);
      setRespostaSelecionada(null);
      setMostrarExplicacao(false);
      scrollToTop();
    } else {
      setQuizFinalizado(true);
      if (acertos >= questoes.length * 0.6) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const questaoAnterior = () => {
    if (questaoIndex > 0) {
      setQuestaoIndex(prev => prev - 1);
      setRespostaSelecionada(null);
      setMostrarExplicacao(false);
      scrollToTop();
    }
  };

  const reiniciarQuiz = () => {
    setQuestaoIndex(0);
    setRespostaSelecionada(null);
    setMostrarExplicacao(false);
    setAcertos(0);
    setQuizFinalizado(false);
    scrollToTop();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!questoes.length) {
    return (
      <div className="min-h-screen bg-background">
        <StandardPageHeader
          title="Questões"
          subtitle={topico?.titulo}
          backPath={`/conceitos/topico/${id}`}
        />
        <div className="flex flex-col items-center justify-center p-4 text-center pt-20">
          <p className="text-muted-foreground mb-4">Nenhuma questão disponível para este tópico.</p>
          <Button onClick={() => navigate(`/conceitos/topico/${id}`)}>Voltar ao Tópico</Button>
        </div>
      </div>
    );
  }

  const percentual = Math.round((acertos / questoes.length) * 100);
  const errosAtuais = questaoIndex + 1 - acertos;

  return (
    <div className={`min-h-screen bg-background pb-24 ${isShaking ? 'animate-shake' : ''}`} ref={contentRef}>
      {/* Header */}
      <StandardPageHeader
        title="Questões"
        subtitle={topico?.titulo}
        backPath={`/conceitos/topico/${id}`}
      />

      {/* Barra de Progresso e Stats */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
          <span className="text-sm font-medium">
            {questaoIndex + 1} / {questoes.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-green-500 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {acertos}
            </span>
            <span className="text-xs text-red-500 font-medium flex items-center gap-1">
              <X className="w-3 h-3" /> {Math.max(0, errosAtuais)}
            </span>
          </div>
        </div>
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-green-600"
            initial={{ width: 0 }}
            animate={{ width: `${((questaoIndex + 1) / questoes.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {quizFinalizado ? (
            <motion.div
              key="resultado"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8"
            >
              <div className="text-center mb-8">
                <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  percentual >= 60 ? 'bg-green-500/20' : 'bg-amber-500/20'
                }`}>
                  <Trophy className={`w-12 h-12 ${percentual >= 60 ? 'text-green-500' : 'text-amber-500'}`} />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {percentual >= 80 ? 'Excelente!' : percentual >= 60 ? 'Muito bem!' : 'Continue praticando!'}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-500">{acertos}</p>
                  <p className="text-xs text-muted-foreground">Acertos</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                  <X className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-500">{questoes.length - acertos}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
              </div>

              <div className="bg-card border rounded-xl p-4 mb-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Aproveitamento</p>
                <p className={`text-3xl font-bold ${percentual >= 60 ? 'text-green-500' : 'text-amber-500'}`}>
                  {percentual}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {acertos} de {questoes.length} questões
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={reiniciarQuiz} className="bg-gradient-to-r from-emerald-500 to-green-600">
                  Zerar e Praticar Novamente
                </Button>
                <Button variant="outline" onClick={() => navigate(`/conceitos/topico/${id}`)}>
                  Voltar ao Tópico
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={questaoIndex}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className={isPulsing ? 'animate-pulse' : ''}
            >
              {questaoAtual?.dificuldade && (
                <div className="mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    questaoAtual.dificuldade === 'facil' ? 'bg-green-500/20 text-green-400' :
                    questaoAtual.dificuldade === 'medio' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {questaoAtual.dificuldade === 'facil' ? 'Fácil' :
                     questaoAtual.dificuldade === 'medio' ? 'Médio' : 'Difícil'}
                  </span>
                </div>
              )}

              <h2 className="text-lg font-medium mb-6 leading-relaxed">
                {questaoAtual?.enunciado}
              </h2>

              <div className="space-y-3">
                {questaoAtual?.opcoes.map((opcao, idx) => {
                  const isSelected = respostaSelecionada === idx;
                  const isCorrect = idx === questaoAtual.correta;
                  const showResult = respostaSelecionada !== null;

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => verificarResposta(idx)}
                      disabled={respostaSelecionada !== null}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        showResult
                          ? isCorrect
                            ? "bg-green-500/20 border-green-500"
                            : isSelected
                              ? "bg-red-500/20 border-red-500"
                              : "bg-muted/30 border-transparent"
                          : "bg-card border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                      whileTap={{ scale: respostaSelecionada === null ? 0.98 : 1 }}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                          showResult
                            ? isCorrect
                              ? "bg-green-500 text-white"
                              : isSelected
                                ? "bg-red-500 text-white"
                                : "bg-muted text-muted-foreground"
                            : "bg-muted text-foreground"
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm leading-relaxed">{opcao}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {mostrarExplicacao && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-3"
                  >
                    <div className={`p-4 rounded-xl ${
                      respostaSelecionada === questaoAtual?.correta
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      <div className="flex items-center gap-2">
                        {respostaSelecionada === questaoAtual?.correta ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`font-semibold ${
                          respostaSelecionada === questaoAtual?.correta ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {respostaSelecionada === questaoAtual?.correta ? 'Correto!' : 'Ops, você errou!'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-card border">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{String.fromCharCode(65 + (questaoAtual?.correta || 0))}</span>
                        </div>
                        <span className="font-semibold text-green-400 text-sm">Resposta Correta</span>
                      </div>
                      <p className="text-sm text-foreground mb-3 pl-8">
                        {questaoAtual?.opcoes[questaoAtual?.correta]}
                      </p>
                      <div className="border-t pt-3 mt-3">
                        <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wide">Explicação</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {questaoAtual?.explicacao}
                        </p>
                      </div>
                    </div>

                    {questaoAtual?.exemplo && (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">💡</span>
                          <span className="font-semibold text-amber-400 text-sm">Exemplo Prático</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {questaoAtual.exemplo}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Fixo com Navegação */}
      {!quizFinalizado && mostrarExplicacao && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t p-4"
        >
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {questaoIndex > 0 && (
              <Button
                variant="outline"
                onClick={questaoAnterior}
                className="flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            
            <Button
              onClick={proximaQuestao}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600"
            >
              {questaoIndex < questoes.length - 1 ? (
                <>
                  Próxima Questão
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                'Ver Resultado'
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ConceitosTopicoQuestoes;
