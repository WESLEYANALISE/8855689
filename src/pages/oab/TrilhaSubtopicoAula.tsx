import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Layers, HelpCircle, ChevronLeft, ChevronRight, RotateCcw, Check, X, ChevronDown, ChevronUp, Target, Scale, Lightbulb, Brain, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  conteudo_expandido: string;
  flashcards: Flashcard[];
  questoes: Questao[];
}

export default function TrilhaSubtopicoAula() {
  const navigate = useNavigate();
  const { area, temaId, subtopicoId } = useParams<{ area: string; temaId: string; subtopicoId: string }>();
  const decodedArea = decodeURIComponent(area || '');
  
  const [activeTab, setActiveTab] = useState('leitura');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [openSections, setOpenSections] = useState<string[]>(['introducao', 'teoria']);

  // Buscar subtópico atual
  const { data: subtopico, isLoading } = useQuery({
    queryKey: ['oab-trilha-subtopico', subtopicoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oab_trilhas_subtopicos')
        .select('*')
        .eq('id', subtopicoId)
        .single();
      if (error) throw error;
      return data as unknown as Subtopico;
    },
    enabled: !!subtopicoId,
  });

  // Buscar todos os subtópicos do tema para navegação
  const { data: todosSubtopicos } = useQuery({
    queryKey: ['oab-trilha-subtopicos-nav', temaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oab_trilhas_subtopicos')
        .select('id, ordem, titulo')
        .eq('tema_id', temaId)
        .order('ordem');
      if (error) throw error;
      return data;
    },
    enabled: !!temaId,
  });

  const flashcards: Flashcard[] = Array.isArray(subtopico?.flashcards) ? subtopico.flashcards : [];
  const questoes: Questao[] = Array.isArray(subtopico?.questoes) ? subtopico.questoes : [];

  const currentIndex = todosSubtopicos?.findIndex(s => s.id === subtopicoId) ?? -1;
  const prevSubtopico = currentIndex > 0 ? todosSubtopicos?.[currentIndex - 1] : null;
  const nextSubtopico = currentIndex >= 0 && currentIndex < (todosSubtopicos?.length ?? 0) - 1 
    ? todosSubtopicos?.[currentIndex + 1] 
    : null;

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

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

  const navigateToSubtopico = (id: string) => {
    navigate(`/oab/trilhas-aprovacao/${encodeURIComponent(decodedArea)}/${temaId}/subtopico/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Separar conteúdo por seções (baseado nos emojis/headers)
  const conteudo = subtopico?.conteudo_expandido || '';
  
  const sections = [
    { id: 'introducao', icon: Target, title: 'Introdução', pattern: /## 🎯 Introdução[\s\S]*?(?=## |$)/i },
    { id: 'teoria', icon: BookOpen, title: 'Teoria Completa', pattern: /## 📚 Teoria[\s\S]*?(?=## |$)/i },
    { id: 'legal', icon: Scale, title: 'Base Legal', pattern: /## ⚖️ Base Legal[\s\S]*?(?=## |$)/i },
    { id: 'jurisprudencia', icon: FileText, title: 'Jurisprudência', pattern: /## 📋 Jurisprudência[\s\S]*?(?=## |$)/i },
    { id: 'exemplos', icon: Lightbulb, title: 'Exemplos Práticos', pattern: /## 💡 Exemplos[\s\S]*?(?=## |$)/i },
    { id: 'oab', icon: AlertTriangle, title: 'Como cai na OAB', pattern: /## 🎓 Como cai[\s\S]*?(?=## |$)/i },
    { id: 'memorizar', icon: Brain, title: 'Dicas de Memorização', pattern: /## 🧠 Dicas[\s\S]*?(?=## |$)/i },
    { id: 'resumo', icon: Check, title: 'Resumo Final', pattern: /## ✅ Resumo[\s\S]*?(?=## |$)/i },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/oab/trilhas-aprovacao/${encodeURIComponent(decodedArea)}/${temaId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">{subtopico?.titulo}</h1>
            <p className="text-xs text-muted-foreground">{decodedArea} • Tópico {subtopico?.ordem}</p>
          </div>
        </div>
      </div>

      {/* Tabs - Responsivo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="sticky top-[61px] z-40 bg-background border-b border-border">
          <div className="max-w-4xl mx-auto px-2">
            <TabsList className="w-full justify-start h-11 bg-transparent gap-1 overflow-x-auto scrollbar-hide flex-nowrap">
              <TabsTrigger 
                value="leitura" 
                className="data-[state=active]:bg-primary/10 gap-1.5 flex-shrink-0 px-3 text-sm"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Leitura</span>
              </TabsTrigger>
              <TabsTrigger 
                value="flashcards" 
                className="data-[state=active]:bg-primary/10 gap-1.5 flex-shrink-0 px-3 text-sm"
              >
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Flashcards</span>
                <span className="text-xs opacity-70">({flashcards.length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="questoes" 
                className="data-[state=active]:bg-primary/10 gap-1.5 flex-shrink-0 px-3 text-sm"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Questões</span>
                <span className="text-xs opacity-70">({questoes.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Leitura - Seções Colapsáveis */}
        <TabsContent value="leitura" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-130px)]">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
              {/* Renderizar conteúdo completo com formatação melhorada */}
              <article className="prose prose-invert prose-sm md:prose-base max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({children}) => (
                      <h2 className="text-xl font-bold mt-8 mb-4 text-primary border-b border-primary/20 pb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({children}) => (
                      <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground">
                        {children}
                      </h3>
                    ),
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-primary/50 bg-primary/5 pl-4 py-2 my-4 italic">
                        {children}
                      </blockquote>
                    ),
                    ul: ({children}) => (
                      <ul className="list-disc pl-6 space-y-2 my-4">
                        {children}
                      </ul>
                    ),
                    ol: ({children}) => (
                      <ol className="list-decimal pl-6 space-y-2 my-4">
                        {children}
                      </ol>
                    ),
                    li: ({children}) => (
                      <li className="text-muted-foreground leading-relaxed">
                        {children}
                      </li>
                    ),
                  }}
                >
                  {conteudo || 'Conteúdo em processamento...'}
                </ReactMarkdown>
              </article>

              {/* Navegação entre subtópicos */}
              <div className="flex justify-between items-center pt-8 border-t border-border mt-8">
                {prevSubtopico ? (
                  <Button 
                    variant="outline" 
                    onClick={() => navigateToSubtopico(prevSubtopico.id)}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                ) : (
                  <div />
                )}
                
                {nextSubtopico ? (
                  <Button 
                    onClick={() => navigateToSubtopico(nextSubtopico.id)}
                    className="gap-2"
                  >
                    <span className="hidden sm:inline">Próximo</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate(`/oab/trilhas-aprovacao/${encodeURIComponent(decodedArea)}/${temaId}`)}
                    className="gap-2"
                  >
                    Concluir
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
                      className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-2xl p-4 md:p-6 flex items-center justify-center overflow-auto"
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
