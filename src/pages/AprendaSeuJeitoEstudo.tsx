import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, Target, Presentation, Mic, 
  Network, ChevronLeft, ChevronRight, Play, Pause,
  CheckCircle2, XCircle, RefreshCw, Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PageLoader } from '@/components/ui/page-loader';

interface ExperienciaData {
  id: string;
  titulo: string;
  nivel: string;
  status: string;
  texto_imersivo: any;
  quizzes: any;
  slides_narrados: any;
  audio_conversacional: any;
  mapa_mental: any;
  formatos_gerados: string[];
  progresso: any;
}

export default function AprendaSeuJeitoEstudo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experiencia, setExperiencia] = useState<ExperienciaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('texto');
  const [slideAtual, setSlideAtual] = useState(0);
  const [quizAtual, setQuizAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [mostrarResposta, setMostrarResposta] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [dialogoAtual, setDialogoAtual] = useState(0);

  useEffect(() => {
    carregarExperiencia();
  }, [id]);

  const carregarExperiencia = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('experiencias_aprendizado')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Tipagem segura para os dados
      setExperiencia(data as unknown as ExperienciaData);
      
      // Definir tab inicial baseado nos formatos disponíveis
      const formatos = (data as any).formatos_gerados || [];
      if (formatos.includes('texto')) setActiveTab('texto');
      else if (formatos.includes('quiz')) setActiveTab('quiz');
      else if (formatos.includes('slides')) setActiveTab('slides');
      else if (formatos.includes('audio')) setActiveTab('audio');
      else if (formatos.includes('mapa')) setActiveTab('mapa');
      
    } catch (error) {
      console.error('Erro ao carregar experiência:', error);
      toast.error('Experiência não encontrada');
      navigate('/aprenda-seu-jeito');
    } finally {
      setLoading(false);
    }
  };

  const verificarResposta = (indice: number) => {
    if (mostrarResposta) return;
    setRespostaSelecionada(indice);
    setMostrarResposta(true);
    
    const questaoAtual = experiencia?.quizzes?.questoes?.[quizAtual];
    if (questaoAtual && indice === questaoAtual.respostaCorreta) {
      setAcertos(prev => prev + 1);
      toast.success('Resposta correta!');
    } else {
      toast.error('Resposta incorreta');
    }
  };

  const proximaQuestao = () => {
    if (quizAtual < (experiencia?.quizzes?.questoes?.length || 0) - 1) {
      setQuizAtual(prev => prev + 1);
      setRespostaSelecionada(null);
      setMostrarResposta(false);
    }
  };

  const reiniciarQuiz = () => {
    setQuizAtual(0);
    setRespostaSelecionada(null);
    setMostrarResposta(false);
    setAcertos(0);
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!experiencia) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Experiência não encontrada</p>
      </div>
    );
  }

  const formatos = experiencia.formatos_gerados || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/aprenda-seu-jeito')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{experiencia.titulo}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{experiencia.nivel}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatos.length} formatos disponíveis
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de navegação */}
      <div className="container mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            {formatos.includes('texto') && (
              <TabsTrigger value="texto" className="gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Texto Imersivo</span>
                <span className="sm:hidden">Texto</span>
              </TabsTrigger>
            )}
            {formatos.includes('quiz') && (
              <TabsTrigger value="quiz" className="gap-2">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Quizzes</span>
                <span className="sm:hidden">Quiz</span>
              </TabsTrigger>
            )}
            {formatos.includes('slides') && (
              <TabsTrigger value="slides" className="gap-2">
                <Presentation className="w-4 h-4" />
                <span className="hidden sm:inline">Slides</span>
                <span className="sm:hidden">Slides</span>
              </TabsTrigger>
            )}
            {formatos.includes('audio') && (
              <TabsTrigger value="audio" className="gap-2">
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Áudio-Aula</span>
                <span className="sm:hidden">Áudio</span>
              </TabsTrigger>
            )}
            {formatos.includes('mapa') && (
              <TabsTrigger value="mapa" className="gap-2">
                <Network className="w-4 h-4" />
                <span className="hidden sm:inline">Mapa Mental</span>
                <span className="sm:hidden">Mapa</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Conteúdo: Texto Imersivo */}
          <TabsContent value="texto" className="mt-4 sm:mt-6">
            {experiencia.texto_imersivo ? (
              <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 px-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-left"
                >
                  <h2 className="text-lg sm:text-xl font-bold mb-3">{experiencia.texto_imersivo.titulo}</h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-left">
                    {experiencia.texto_imersivo.introducao}
                  </p>
                </motion.div>

                {experiencia.texto_imersivo.secoes?.map((secao: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card>
                      <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg text-left">{secao.titulo}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-left">{secao.conteudo}</p>
                        
                        {secao.destaque && (
                          <div className="p-3 sm:p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                            <p className="text-sm font-medium text-primary text-left">{secao.destaque}</p>
                          </div>
                        )}

                        {secao.imagemConceito && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs sm:text-sm text-muted-foreground italic text-left">
                              🖼️ {secao.imagemConceito}
                            </p>
                          </div>
                        )}

                        {secao.perguntaReflexao && (
                          <div className="p-3 bg-yellow-500/10 rounded-lg">
                            <p className="text-xs sm:text-sm font-medium text-left">💭 Reflita: {secao.perguntaReflexao}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {experiencia.texto_imersivo.conclusao && (
                  <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10">
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="text-sm sm:text-base font-bold mb-2 text-left">Síntese Final</h3>
                      <p className="text-sm text-muted-foreground text-left">{experiencia.texto_imersivo.conclusao}</p>
                    </CardContent>
                  </Card>
                )}

                {experiencia.texto_imersivo.curiosidade && (
                  <div className="p-3 sm:p-4 bg-blue-500/10 rounded-lg">
                    <p className="text-xs sm:text-sm text-left">💡 <strong>Curiosidade:</strong> {experiencia.texto_imersivo.curiosidade}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Texto imersivo não disponível
              </div>
            )}
          </TabsContent>

          {/* Conteúdo: Quiz */}
          <TabsContent value="quiz" className="mt-4 sm:mt-6">
            {experiencia.quizzes?.questoes?.length > 0 ? (
              <div className="max-w-2xl mx-auto px-1">
                {quizAtual < experiencia.quizzes.questoes.length ? (
                  <motion.div
                    key={quizAtual}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card>
                      <CardHeader className="pb-2 sm:pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="text-xs">
                            Questão {quizAtual + 1} de {experiencia.quizzes.questoes.length}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {experiencia.quizzes.questoes[quizAtual].dificuldade}
                          </Badge>
                        </div>
                        <Progress 
                          value={(quizAtual / experiencia.quizzes.questoes.length) * 100} 
                          className="h-1.5"
                        />
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4">
                        <p className="text-sm sm:text-base font-medium text-left">
                          {experiencia.quizzes.questoes[quizAtual].pergunta}
                        </p>

                        <div className="space-y-2">
                          {experiencia.quizzes.questoes[quizAtual].alternativas?.map((alt: string, i: number) => {
                            const isCorreta = i === experiencia.quizzes.questoes[quizAtual].respostaCorreta;
                            const isSelecionada = i === respostaSelecionada;
                            
                            return (
                              <button
                                key={i}
                                onClick={() => verificarResposta(i)}
                                disabled={mostrarResposta}
                                className={`w-full p-3 sm:p-4 text-left rounded-lg border transition-all text-sm sm:text-base ${
                                  mostrarResposta
                                    ? isCorreta
                                      ? 'bg-green-500/20 border-green-500'
                                      : isSelecionada
                                        ? 'bg-red-500/20 border-red-500'
                                        : 'bg-muted/50'
                                    : 'hover:bg-muted/50 hover:border-primary'
                                }`}
                              >
                                <div className="flex items-center gap-2 sm:gap-3">
                                  {mostrarResposta && isCorreta && (
                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
                                  )}
                                  {mostrarResposta && isSelecionada && !isCorreta && (
                                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 shrink-0" />
                                  )}
                                  <span>{alt}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {mostrarResposta && experiencia.quizzes.questoes[quizAtual].explicacao && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-3 sm:p-4 bg-muted rounded-lg"
                          >
                            <p className="text-xs sm:text-sm text-left">
                              <strong>Explicação:</strong> {experiencia.quizzes.questoes[quizAtual].explicacao}
                            </p>
                          </motion.div>
                        )}

                        {mostrarResposta && (
                          <Button onClick={proximaQuestao} className="w-full text-sm">
                            {quizAtual < experiencia.quizzes.questoes.length - 1 
                              ? 'Próxima Questão' 
                              : 'Ver Resultado'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <Card className="text-center py-8 sm:py-12">
                    <CardContent>
                      <h3 className="text-lg sm:text-xl font-bold mb-3">Quiz Concluído!</h3>
                      <p className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                        {acertos}/{experiencia.quizzes.questoes.length}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
                        {acertos === experiencia.quizzes.questoes.length 
                          ? 'Perfeito! Você dominou o conteúdo!' 
                          : acertos >= experiencia.quizzes.questoes.length / 2
                            ? 'Bom trabalho! Continue estudando!'
                            : 'Revise o conteúdo e tente novamente'}
                      </p>
                      <Button onClick={reiniciarQuiz} size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refazer Quiz
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Quiz não disponível
              </div>
            )}
          </TabsContent>

          {/* Conteúdo: Slides */}
          <TabsContent value="slides" className="mt-4 sm:mt-6">
            {experiencia.slides_narrados?.slides?.length > 0 ? (
              <div className="max-w-4xl mx-auto px-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slideAtual}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <Card className="min-h-[280px] sm:min-h-[350px]">
                      <CardContent className="p-4 sm:p-6">
                        {(() => {
                          const slide = experiencia.slides_narrados.slides[slideAtual];
                          
                          if (slide.tipo === 'titulo') {
                            return (
                              <div className="text-left py-8 sm:py-12">
                                <h2 className="text-lg sm:text-2xl font-bold mb-3">{slide.titulo}</h2>
                                <p className="text-sm sm:text-base text-muted-foreground">{slide.subtitulo}</p>
                              </div>
                            );
                          }

                          if (slide.tipo === 'conceito') {
                            return (
                              <div className="space-y-4">
                                <h3 className="text-base sm:text-lg font-bold text-left">{slide.titulo}</h3>
                                <ul className="space-y-2">
                                  {slide.pontos?.map((ponto: string, i: number) => (
                                    <motion.li
                                      key={i}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.2 }}
                                      className="flex items-start gap-2 text-sm sm:text-base text-left"
                                    >
                                      <span className="text-primary shrink-0">•</span>
                                      {ponto}
                                    </motion.li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }

                          if (slide.tipo === 'exemplo') {
                            return (
                              <div className="space-y-4">
                                <h3 className="text-base sm:text-lg font-bold text-left">{slide.titulo}</h3>
                                <div className="p-3 sm:p-4 bg-muted rounded-lg">
                                  <p className="text-sm sm:text-base text-left">{slide.caso}</p>
                                </div>
                                <div className="p-3 border-l-4 border-primary">
                                  <p className="text-xs sm:text-sm text-muted-foreground text-left">{slide.analise}</p>
                                </div>
                              </div>
                            );
                          }

                          if (slide.tipo === 'resumo') {
                            return (
                              <div className="space-y-4">
                                <h3 className="text-base sm:text-lg font-bold text-left">{slide.titulo}</h3>
                                <div className="grid gap-2">
                                  {slide.pontosChave?.map((ponto: string, i: number) => (
                                    <div 
                                      key={i}
                                      className="p-3 bg-primary/10 rounded-lg text-left text-sm font-medium"
                                    >
                                      {ponto}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-4">
                              <h3 className="text-base sm:text-lg font-bold text-left">{slide.titulo}</h3>
                              <p className="text-sm sm:text-base text-muted-foreground text-left">{slide.narracao}</p>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>

                {/* Controles de navegação */}
                <div className="flex items-center justify-between mt-4 sm:mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSlideAtual(prev => Math.max(0, prev - 1))}
                    disabled={slideAtual === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {experiencia.slides_narrados.slides.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSlideAtual(i)}
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                          i === slideAtual ? 'bg-primary w-4 sm:w-6' : 'bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setSlideAtual(prev => Math.min(experiencia.slides_narrados.slides.length - 1, prev + 1))}
                    disabled={slideAtual === experiencia.slides_narrados.slides.length - 1}
                  >
                    <span className="hidden sm:inline">Próximo</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {/* Narração do slide atual */}
                {experiencia.slides_narrados.slides[slideAtual]?.narracao && (
                  <Card className="mt-3 sm:mt-4">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs sm:text-sm text-muted-foreground text-left">
                          {experiencia.slides_narrados.slides[slideAtual].narracao}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Slides não disponíveis
              </div>
            )}
          </TabsContent>

          {/* Conteúdo: Áudio-Aula */}
          <TabsContent value="audio" className="mt-4 sm:mt-6">
            {experiencia.audio_conversacional?.dialogo?.length > 0 ? (
              <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 px-1">
                <Card className="mb-4 sm:mb-6">
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-bold mb-2 text-left">{experiencia.audio_conversacional.titulo}</h3>
                    <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <span>👨‍🏫 {experiencia.audio_conversacional.participantes?.professor?.nome}</span>
                      <span>👩‍🎓 {experiencia.audio_conversacional.participantes?.aluno?.nome}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2 sm:space-y-3">
                  {experiencia.audio_conversacional.dialogo.slice(0, dialogoAtual + 5).map((fala: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${fala.falante === 'professor' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[85%] p-3 rounded-2xl ${
                        fala.falante === 'professor' 
                          ? 'bg-primary/10 rounded-tl-none' 
                          : 'bg-muted rounded-tr-none'
                      }`}>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                          {fala.falante === 'professor' 
                            ? `👨‍🏫 ${experiencia.audio_conversacional.participantes?.professor?.nome}` 
                            : `👩‍🎓 ${experiencia.audio_conversacional.participantes?.aluno?.nome}`}
                        </p>
                        <p className="text-sm sm:text-base text-left">{fala.texto}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {dialogoAtual + 5 < experiencia.audio_conversacional.dialogo.length && (
                  <Button 
                    variant="outline" 
                    className="w-full text-sm"
                    size="sm"
                    onClick={() => setDialogoAtual(prev => prev + 5)}
                  >
                    Carregar mais
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Áudio-aula não disponível
              </div>
            )}
          </TabsContent>

          {/* Conteúdo: Mapa Mental */}
          <TabsContent value="mapa" className="mt-6">
            {experiencia.mapa_mental?.raiz ? (
              <div className="max-w-4xl mx-auto">
                <Card className="bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center">
                      {/* Função helper para adicionar transparência à cor */}
                      {(() => {
                        const addTransparency = (color: string, opacity: number = 0.7) => {
                          if (color?.startsWith('#')) {
                            const r = parseInt(color.slice(1, 3), 16);
                            const g = parseInt(color.slice(3, 5), 16);
                            const b = parseInt(color.slice(5, 7), 16);
                            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                          }
                          if (color?.startsWith('rgb(')) {
                            return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
                          }
                          return color;
                        };

                        return (
                          <>
                            {/* Nó raiz */}
                            <div 
                              className="p-4 rounded-xl font-bold text-lg text-white mb-8 shadow-lg border border-white/20"
                              style={{ backgroundColor: addTransparency(experiencia.mapa_mental.raiz.cor, 0.75) }}
                            >
                              {experiencia.mapa_mental.raiz.texto}
                            </div>

                            {/* Filhos */}
                            <div className="flex flex-wrap justify-center gap-8">
                              {experiencia.mapa_mental.raiz.filhos?.map((filho: any, i: number) => (
                                <div key={i} className="flex flex-col items-center">
                                  {/* Linha conectora */}
                                  <div className="w-0.5 h-8 bg-muted-foreground/20" />
                                  
                                  {/* Nó filho */}
                                  <div 
                                    className="p-3 rounded-lg font-medium text-white mb-4 shadow-md border border-white/15"
                                    style={{ backgroundColor: addTransparency(filho.cor, 0.65) }}
                                  >
                                    {filho.texto}
                                  </div>

                                  {/* Sub-filhos */}
                                  {filho.filhos?.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-2">
                                      {filho.filhos.map((subFilho: any, j: number) => (
                                        <div key={j} className="flex flex-col items-center">
                                          <div className="w-0.5 h-4 bg-muted-foreground/15" />
                                          <div 
                                            className="p-2 rounded text-sm text-white shadow-sm border border-white/10"
                                            style={{ backgroundColor: addTransparency(subFilho.cor, 0.55) }}
                                          >
                                            {subFilho.texto}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Legenda */}
                    {experiencia.mapa_mental.legendas && (
                      <div className="mt-8 pt-4 border-t border-border/50">
                        <p className="text-sm font-medium mb-2 text-muted-foreground">Legenda:</p>
                        <div className="flex flex-wrap gap-4">
                          {Object.entries(experiencia.mapa_mental.legendas).map(([cor, texto]) => (
                            <div key={cor} className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded opacity-70"
                                style={{ backgroundColor: cor }}
                              />
                              <span className="text-sm text-muted-foreground">{texto as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Mapa mental não disponível
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
