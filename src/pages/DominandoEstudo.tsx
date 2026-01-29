import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, BookOpen, Target, Lightbulb, Layers, HelpCircle, Check, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

interface Etapa {
  id: string;
  nome: string;
  icon: React.ComponentType<{ className?: string }>;
  completada: boolean;
}

const etapasConfig: Etapa[] = [
  { id: "leitura", nome: "Leitura", icon: BookOpen, completada: false },
  { id: "pratica", nome: "Prática", icon: Target, completada: false },
  { id: "conceitos", nome: "Conceitos", icon: Lightbulb, completada: false },
  { id: "flashcards", nome: "Flashcards", icon: Layers, completada: false },
  { id: "quiz", nome: "Quiz", icon: HelpCircle, completada: false },
];

const DominandoEstudo = () => {
  const { disciplinaId } = useParams<{ disciplinaId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [etapaAtual, setEtapaAtual] = useState("leitura");
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [respostasQuiz, setRespostasQuiz] = useState<Record<number, number>>({});
  const [quizEnviado, setQuizEnviado] = useState(false);
  
  const parsedId = disciplinaId ? parseInt(disciplinaId) : null;

  // Buscar disciplina da BIBLIOTECA-ESTUDOS
  const { data: disciplina, isLoading: loadingDisciplina } = useQuery({
    queryKey: ["dominando-disciplina", parsedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("*")
        .eq("id", parsedId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!parsedId,
  });

  // Buscar conteúdo gerado
  const { data: conteudo, isLoading: loadingConteudo, refetch: refetchConteudo } = useQuery({
    queryKey: ["dominando-conteudo", parsedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dominando_conteudo")
        .select("*")
        .eq("disciplina_id", parsedId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!parsedId,
  });

  // Mutation para gerar conteúdo
  const gerarConteudoMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('gerar-conteudo-dominando', {
        body: { 
          disciplinaId: parsedId,
          tema: disciplina?.Tema,
          area: disciplina?.["Área"],
          sobre: disciplina?.Sobre
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Conteúdo gerado com sucesso!");
      refetchConteudo();
    },
    onError: (err: any) => {
      console.error("Erro ao gerar conteúdo:", err);
      toast.error("Erro ao gerar conteúdo: " + (err.message || "Tente novamente"));
    }
  });

  // Se não tem conteúdo, gera automaticamente
  useEffect(() => {
    if (disciplina && conteudo === null && !loadingConteudo && !gerarConteudoMutation.isPending) {
      gerarConteudoMutation.mutate();
    }
  }, [disciplina, conteudo, loadingConteudo]);

  const toggleFlipCard = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleQuizResposta = (questaoIndex: number, alternativaIndex: number) => {
    if (!quizEnviado) {
      setRespostasQuiz(prev => ({ ...prev, [questaoIndex]: alternativaIndex }));
    }
  };

  const handleEnviarQuiz = () => {
    setQuizEnviado(true);
    const questoes = (conteudo?.questoes as any[]) || [];
    const corretas = questoes.filter((q: any, i: number) => respostasQuiz[i] === q.correta).length;
    toast.success(`Você acertou ${corretas} de ${questoes.length} questões!`);
  };

  const isLoading = loadingDisciplina || loadingConteudo || gerarConteudoMutation.isPending;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <p className="text-white/60 text-sm">
          {gerarConteudoMutation.isPending ? "Gerando conteúdo interativo..." : "Carregando..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0d0d14]/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>
      </div>

      {/* Header com info */}
      <div className="relative">
        <div className="absolute inset-0 h-32 bg-gradient-to-br from-red-900 to-red-950" />
        <div className="absolute inset-0 h-32 bg-gradient-to-b from-transparent to-[#0d0d14]" />
        
        <div className="relative z-10 px-4 pt-4 pb-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/30 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <BookOpen className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <span className="text-xs font-mono text-red-400">
                  {disciplina?.["Área"]}
                </span>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {disciplina?.Tema}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de Etapas */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto">
          <Tabs value={etapaAtual} onValueChange={setEtapaAtual} className="w-full">
            <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/50 p-1 mb-4">
              {etapasConfig.map((etapa) => {
                const Icon = etapa.icon;
                return (
                  <TabsTrigger
                    key={etapa.id}
                    value={etapa.id}
                    className="flex-1 min-w-[60px] gap-1 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{etapa.nome}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Conteúdo das Etapas */}
            <TabsContent value="leitura" className="space-y-4">
              <div className="bg-neutral-800/50 rounded-xl p-4">
                <h3 className="text-lg font-bold text-white mb-3">📖 Introdução</h3>
                {conteudo?.introducao ? (
                  <p className="text-gray-300 text-sm leading-relaxed">{conteudo.introducao}</p>
                ) : (
                  <p className="text-gray-400 text-sm">Conteúdo sendo gerado...</p>
                )}
              </div>
              
              {conteudo?.conteudo_markdown && (
                <div className="bg-neutral-800/50 rounded-xl p-4 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{conteudo.conteudo_markdown}</ReactMarkdown>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pratica" className="space-y-4">
              <div className="bg-neutral-800/50 rounded-xl p-4">
                <h3 className="text-lg font-bold text-white mb-3">🎯 Exercícios Práticos</h3>
                <p className="text-gray-400 text-sm">
                  Complete a leitura primeiro para desbloquear os exercícios práticos.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="conceitos" className="space-y-4">
              <div className="bg-neutral-800/50 rounded-xl p-4">
                <h3 className="text-lg font-bold text-white mb-3">💡 Conceitos-Chave</h3>
                {conteudo?.termos && Array.isArray(conteudo.termos) && conteudo.termos.length > 0 ? (
                  <div className="space-y-3">
                    {conteudo.termos.map((termo: any, i: number) => (
                      <div key={i} className="bg-neutral-700/50 rounded-lg p-3">
                        <p className="text-red-400 font-medium text-sm">{termo.termo}</p>
                        <p className="text-gray-300 text-xs mt-1">{termo.definicao}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Conceitos sendo extraídos...</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="flashcards" className="space-y-4">
              <div className="bg-neutral-800/50 rounded-xl p-4">
                <h3 className="text-lg font-bold text-white mb-3">🃏 Flashcards</h3>
                {conteudo?.flashcards && Array.isArray(conteudo.flashcards) && conteudo.flashcards.length > 0 ? (
                  <div className="grid gap-3">
                    {conteudo.flashcards.map((card: any, i: number) => (
                      <motion.div 
                        key={i}
                        onClick={() => toggleFlipCard(i)}
                        className="cursor-pointer min-h-[120px] perspective-1000"
                      >
                        <motion.div
                          animate={{ rotateY: flippedCards.has(i) ? 180 : 0 }}
                          transition={{ duration: 0.4 }}
                          className="relative w-full h-full preserve-3d"
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          {/* Frente */}
                          <div 
                            className={`absolute inset-0 bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl p-4 flex items-center justify-center backface-hidden ${flippedCards.has(i) ? 'invisible' : ''}`}
                            style={{ backfaceVisibility: 'hidden' }}
                          >
                            <p className="text-white font-medium text-center">{card.frente || card.pergunta}</p>
                          </div>
                          {/* Verso */}
                          <div 
                            className={`absolute inset-0 bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-4 flex items-center justify-center ${!flippedCards.has(i) ? 'invisible' : ''}`}
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                          >
                            <p className="text-white text-center text-sm">{card.verso || card.resposta}</p>
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Flashcards sendo gerados...</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="quiz" className="space-y-4">
              <div className="bg-neutral-800/50 rounded-xl p-4">
                <h3 className="text-lg font-bold text-white mb-3">❓ Quiz</h3>
                {conteudo?.questoes && Array.isArray(conteudo.questoes) && conteudo.questoes.length > 0 ? (
                  <div className="space-y-6">
                    {conteudo.questoes.map((questao: any, qIndex: number) => (
                      <div key={qIndex} className="space-y-3">
                        <p className="text-white font-medium">{qIndex + 1}. {questao.pergunta || questao.enunciado}</p>
                        <div className="space-y-2">
                          {(questao.alternativas || questao.opcoes)?.map((alt: string, aIndex: number) => {
                            const selecionada = respostasQuiz[qIndex] === aIndex;
                            const correta = quizEnviado && questao.correta === aIndex;
                            const errada = quizEnviado && selecionada && !correta;
                            
                            return (
                              <button
                                key={aIndex}
                                onClick={() => handleQuizResposta(qIndex, aIndex)}
                                disabled={quizEnviado}
                                className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${
                                  correta 
                                    ? 'bg-green-600/30 border border-green-500 text-green-400'
                                    : errada 
                                      ? 'bg-red-600/30 border border-red-500 text-red-400'
                                      : selecionada 
                                        ? 'bg-red-600/20 border border-red-500/50 text-white'
                                        : 'bg-neutral-700/50 border border-transparent text-gray-300 hover:bg-neutral-600/50'
                                }`}
                              >
                                {alt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    
                    {!quizEnviado && Object.keys(respostasQuiz).length === conteudo.questoes.length && (
                      <Button 
                        onClick={handleEnviarQuiz}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        Enviar Respostas
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Questões sendo geradas...</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Botão para regenerar */}
          {conteudo && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => gerarConteudoMutation.mutate()}
                disabled={gerarConteudoMutation.isPending}
                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${gerarConteudoMutation.isPending ? 'animate-spin' : ''}`} />
                Regenerar Conteúdo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DominandoEstudo;
