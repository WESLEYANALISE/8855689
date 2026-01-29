import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Layers, HelpCircle, ChevronLeft, ChevronRight, RotateCcw, Check, X, Play, Loader2, Sparkles, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Flashcard {
  frente: string;
  verso: string;
}

interface Questao {
  enunciado: string;
  alternativas: string[];
  correta: number;
  explicacao: string;
}

interface Subtopico {
  id: string;
  ordem: number;
  titulo: string;
  flashcards: Flashcard[];
  questoes: Questao[];
  status: string;
}

export default function TrilhaTemaEstudo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { area, temaId } = useParams<{ area: string; temaId: string }>();
  const decodedArea = decodeURIComponent(area || '');
  
  const [activeTab, setActiveTab] = useState('subtopicos');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [acertos, setAcertos] = useState(0);

  // Buscar tema
  const { data: tema, isLoading: loadingTema } = useQuery({
    queryKey: ['oab-trilha-tema', temaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oab_trilhas_temas')
        .select('*')
        .eq('id', temaId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!temaId,
  });

  // Buscar subtópicos
  const { data: subtopicos, isLoading: loadingSubtopicos, refetch: refetchSubtopicos } = useQuery({
    queryKey: ['oab-trilha-subtopicos', temaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oab_trilhas_subtopicos')
        .select('*')
        .eq('tema_id', temaId)
        .order('ordem');
      if (error) throw error;
      return data as unknown as Subtopico[];
    },
    enabled: !!temaId,
    staleTime: 0, // Sempre buscar dados frescos
  });

  // Mutation para gerar subtópicos (processa em lotes)
  const gerarSubtopicos = useMutation({
    mutationFn: async (): Promise<any> => {
      let resultado: any;
      let tentativas = 0;
      const maxTentativas = 5;
      
      do {
        const { data, error } = await supabase.functions.invoke('gerar-subtopicos-trilha', {
          body: { temaId, area: decodedArea, continuar: tentativas > 0 }
        });
        
        if (error) throw error;
        resultado = data;
        
        if (resultado.subtopicosGerados > 0) {
          toast.success(`${resultado.totalGerados}/${resultado.totalEsperados} subtópicos gerados`);
          queryClient.invalidateQueries({ queryKey: ['oab-trilha-subtopicos', temaId] });
        }
        
        tentativas++;
      } while (resultado.precisaContinuar && tentativas < maxTentativas);
      
      return resultado;
    },
    onSuccess: (data) => {
      if (data.completo) {
        toast.success('Todas as aulas foram geradas!');
      }
      queryClient.invalidateQueries({ queryKey: ['oab-trilha-subtopicos', temaId] });
      queryClient.invalidateQueries({ queryKey: ['oab-trilha-tema', temaId] });
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const flashcards: Flashcard[] = Array.isArray(tema?.flashcards) ? (tema.flashcards as unknown as Flashcard[]) : [];
  const questoes: Questao[] = Array.isArray(tema?.questoes) ? (tema.questoes as unknown as Questao[]) : [];

  const handleNextFlashcard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev + 1) % flashcards.length);
    }, 200);
  };

  const handlePrevFlashcard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 200);
  };

  const handleResponder = (index: number) => {
    setRespostaSelecionada(index);
    setMostrarExplicacao(true);
    if (index === questoes[questaoIndex]?.correta) {
      setAcertos((prev) => prev + 1);
    }
  };

  const handleProximaQuestao = () => {
    setRespostaSelecionada(null);
    setMostrarExplicacao(false);
    setQuestaoIndex((prev) => prev + 1);
  };

  const handleReiniciarQuiz = () => {
    setQuestaoIndex(0);
    setRespostaSelecionada(null);
    setMostrarExplicacao(false);
    setAcertos(0);
  };

  const isLoading = loadingTema || loadingSubtopicos;
  const hasSubtopicos = (subtopicos?.length ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/oab/trilhas-aprovacao/${encodeURIComponent(decodedArea)}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">{tema?.titulo}</h1>
            <p className="text-xs text-muted-foreground">{decodedArea}</p>
          </div>
        </div>
      </div>

      {/* Tabs - Responsivo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="sticky top-[57px] z-40 bg-background border-b border-border">
          <div className="max-w-4xl mx-auto px-2">
            <TabsList className="w-full justify-start h-11 bg-transparent gap-1 overflow-x-auto scrollbar-hide flex-nowrap">
              <TabsTrigger 
                value="subtopicos" 
                className="data-[state=active]:bg-primary/10 gap-1.5 flex-shrink-0 px-3 text-sm"
              >
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Trilha</span>
              </TabsTrigger>
              <TabsTrigger 
                value="leitura" 
                className="data-[state=active]:bg-primary/10 gap-1.5 flex-shrink-0 px-3 text-sm"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Resumo</span>
              </TabsTrigger>
              <TabsTrigger 
                value="flashcards" 
                className="data-[state=active]:bg-primary/10 gap-1.5 flex-shrink-0 px-3 text-sm"
              >
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
                <span className="text-xs opacity-70">({flashcards.length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="questoes" 
                className="data-[state=active]:bg-primary/10 gap-1.5 flex-shrink-0 px-3 text-sm"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Quiz</span>
                <span className="text-xs opacity-70">({questoes.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Subtópicos - Linha do Tempo */}
        <TabsContent value="subtopicos" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-130px)]">
            <div className="max-w-2xl mx-auto px-4 py-6">
              {!hasSubtopicos ? (
                // Estado: Sem subtópicos - oferecer geração
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Aulas Interativas</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Gere aulas detalhadas com explicações completas, flashcards e questões para cada subtópico deste tema.
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => gerarSubtopicos.mutate()}
                    disabled={gerarSubtopicos.isPending}
                    className="gap-2"
                  >
                    {gerarSubtopicos.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Gerando aulas...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Gerar Aulas Interativas
                      </>
                    )}
                  </Button>
                  {gerarSubtopicos.isPending && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Isso pode levar alguns minutos...
                    </p>
                  )}
                </div>
              ) : (
                // Linha do tempo dos subtópicos
                <div className="relative">
                  {/* Linha vertical */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-4">
                    {subtopicos?.map((sub, index) => (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pl-10"
                      >
                        {/* Marcador da linha do tempo */}
                        <div className="absolute left-0 top-4 w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                          <CircleDot className="w-4 h-4 text-primary" />
                        </div>

                        {/* Card do subtópico */}
                        <Card 
                          className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
                          onClick={() => navigate(`/oab/trilhas-aprovacao/${encodeURIComponent(decodedArea)}/${temaId}/subtopico/${sub.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {sub.ordem}
                                  </Badge>
                                  <h3 className="font-semibold text-sm truncate">{sub.titulo}</h3>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Layers className="h-3 w-3" />
                                    {(sub.flashcards as Flashcard[])?.length || 0} cards
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <HelpCircle className="h-3 w-3" />
                                    {(sub.questoes as Questao[])?.length || 0} questões
                                  </span>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" className="flex-shrink-0">
                                <Play className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Botão para regenerar */}
                  <div className="mt-8 text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => gerarSubtopicos.mutate()}
                      disabled={gerarSubtopicos.isPending}
                      className="gap-2"
                    >
                      {gerarSubtopicos.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Regenerar Aulas
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Leitura (Resumo do tema) */}
        <TabsContent value="leitura" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-130px)]">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <article className="prose prose-invert prose-sm md:prose-base max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {tema?.conteudo_formatado || 'Conteúdo em processamento...'}
                </ReactMarkdown>
              </article>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Flashcards */}
        <TabsContent value="flashcards" className="flex-1 mt-0">
          <div className="max-w-xl mx-auto px-4 py-6 h-[calc(100vh-130px)] flex flex-col items-center justify-center">
            {flashcards.length > 0 ? (
              <>
                <div className="w-full mb-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Card {flashcardIndex + 1} de {flashcards.length}</span>
                  </div>
                  <Progress value={((flashcardIndex + 1) / flashcards.length) * 100} className="h-1.5" />
                </div>

                <div 
                  className="w-full aspect-[4/3] perspective-1000 cursor-pointer mb-4"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <motion.div
                    className="relative w-full h-full"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-4 md:p-6 flex items-center justify-center backface-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <p className="text-base md:text-lg text-center font-medium">
                        {flashcards[flashcardIndex]?.frente}
                      </p>
                    </div>

                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-2xl p-4 md:p-6 flex items-center justify-center"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <p className="text-sm md:text-base text-center">
                        {flashcards[flashcardIndex]?.verso}
                      </p>
                    </div>
                  </motion.div>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  Toque no card para virar
                </p>

                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handlePrevFlashcard}
                    disabled={flashcards.length <= 1}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsFlipped(false)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleNextFlashcard}
                    disabled={flashcards.length <= 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum flashcard disponível</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Questões */}
        <TabsContent value="questoes" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-130px)]">
            <div className="max-w-2xl mx-auto px-4 py-6">
              {questoes.length > 0 && questaoIndex < questoes.length ? (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Questão {questaoIndex + 1} de {questoes.length}</span>
                      <span>{acertos} acertos</span>
                    </div>
                    <Progress value={((questaoIndex + 1) / questoes.length) * 100} className="h-1.5" />
                  </div>

                  <Card className="mb-4">
                    <CardContent className="p-4">
                      <p className="text-sm md:text-base leading-relaxed">
                        {questoes[questaoIndex]?.enunciado}
                      </p>
                    </CardContent>
                  </Card>

                  <div className="space-y-2 mb-4">
                    {questoes[questaoIndex]?.alternativas.map((alt, index) => {
                      const isSelected = respostaSelecionada === index;
                      const isCorrect = index === questoes[questaoIndex]?.correta;
                      const showResult = respostaSelecionada !== null;

                      return (
                        <button
                          key={index}
                          onClick={() => !showResult && handleResponder(index)}
                          disabled={showResult}
                          className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${
                            showResult
                              ? isCorrect
                                ? 'bg-green-500/20 border-green-500'
                                : isSelected
                                ? 'bg-red-500/20 border-red-500'
                                : 'bg-muted/30 border-border opacity-50'
                              : 'bg-card border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              showResult && isCorrect
                                ? 'bg-green-500 text-white'
                                : showResult && isSelected
                                ? 'bg-red-500 text-white'
                                : 'bg-muted'
                            }`}>
                              {showResult ? (
                                isCorrect ? <Check className="h-3 w-3" /> : isSelected ? <X className="h-3 w-3" /> : String.fromCharCode(65 + index)
                              ) : (
                                String.fromCharCode(65 + index)
                              )}
                            </div>
                            <span className="flex-1">{alt.replace(/^[A-D]\)\s*/, '')}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {mostrarExplicacao && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Card className="mb-4 border-primary/30">
                          <CardContent className="p-4">
                            <h4 className="font-semibold mb-2 text-primary text-sm">Explicação</h4>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              {questoes[questaoIndex]?.explicacao}
                            </p>
                          </CardContent>
                        </Card>

                        <Button 
                          onClick={handleProximaQuestao}
                          className="w-full"
                        >
                          {questaoIndex < questoes.length - 1 ? 'Próxima Questão' : 'Ver Resultado'}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : questoes.length > 0 ? (
                <div className="text-center py-12">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    acertos >= questoes.length * 0.7 ? 'bg-green-500/20' : 'bg-orange-500/20'
                  }`}>
                    <span className="text-3xl font-bold">
                      {Math.round((acertos / questoes.length) * 100)}%
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Quiz Concluído!</h3>
                  <p className="text-muted-foreground mb-6">
                    Você acertou {acertos} de {questoes.length} questões
                  </p>
                  <Button onClick={handleReiniciarQuiz}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refazer Quiz
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhuma questão disponível</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
