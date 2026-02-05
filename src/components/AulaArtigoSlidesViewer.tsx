import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, GraduationCap, ChevronRight, BookOpen, HelpCircle, Play, Clock, Target, List, ArrowLeft, Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConceitosSlidesViewer } from "@/components/conceitos/slides/ConceitosSlidesViewer";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { QuizViewerEnhanced } from "@/components/QuizViewerEnhanced";
import { UniversalImage } from "@/components/ui/universal-image";
import type { ConceitoSecao } from "@/components/conceitos/slides/types";

interface AulaArtigoSlidesViewerProps {
  isOpen: boolean;
  onClose: () => void;
  codigoTabela: string;
  codigoNome: string;
  numeroArtigo: string;
  conteudoArtigo: string;
}

type EtapaAula = 'loading' | 'intro' | 'slides' | 'flashcards' | 'quiz' | 'resultado';

interface SlidesData {
  versao: number;
  titulo: string;
  tempoEstimado: string;
  area: string;
  objetivos: string[];
  secoes: ConceitoSecao[];
  flashcards: Array<{ frente: string; verso: string; exemplo?: string }>;
  questoes: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explicacao: string;
  }>;
  aulaId?: string;
  cached?: boolean;
}

// Mapeamento de códigos para URLs de capa padrão
const CAPAS_CODIGOS: Record<string, string> = {
  'CP': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&h=720&fit=crop&q=80', // Direito Penal
  'CC': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1280&h=720&fit=crop&q=80', // Direito Civil
  'CF': 'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=1280&h=720&fit=crop&q=80', // Constituição
  'CDC': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1280&h=720&fit=crop&q=80', // Consumidor
  'CLT': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1280&h=720&fit=crop&q=80', // Trabalho
  'CPP': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&h=720&fit=crop&q=80', // Processo Penal
  'CPC': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1280&h=720&fit=crop&q=80', // Processo Civil
  'ECA': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1280&h=720&fit=crop&q=80', // ECA
  'CTN': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1280&h=720&fit=crop&q=80', // Tributário
};

const loadingMessages = [
  "Analisando o artigo em profundidade...",
  "Criando seções de estudo completas...",
  "Preparando exemplos práticos...",
  "Gerando flashcards de revisão...",
  "Montando questões estilo OAB...",
  "Finalizando sua aula personalizada..."
];

export const AulaArtigoSlidesViewer = ({
  isOpen,
  onClose,
  codigoTabela,
  codigoNome,
  numeroArtigo,
  conteudoArtigo
}: AulaArtigoSlidesViewerProps) => {
  const [slidesData, setSlidesData] = useState<SlidesData | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<EtapaAula>('loading');
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [slidesProgress, setSlidesProgress] = useState(0);
  const [quizAcertos, setQuizAcertos] = useState(0);
  const [capaUrl, setCapaUrl] = useState<string | null>(null);
  
  // Progress state for realistic loading indicator
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Iniciando...");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const queryClient = useQueryClient();

  // Query para verificar se a aula já existe no cache do banco
  const { data: cachedAula, isLoading: isCheckingCache } = useQuery({
    queryKey: ['aula-artigo', codigoTabela, numeroArtigo],
    queryFn: async () => {
      const codigoNorm = codigoTabela.toUpperCase().split(' ')[0].split('-')[0].trim();
      
      // Verificar primeiro com código normalizado
      const { data: aulaNorm } = await supabase
        .from('aulas_artigos')
        .select('id, slides_json')
        .eq('codigo_tabela', codigoNorm)
        .eq('numero_artigo', numeroArtigo)
        .single();
      
      if (aulaNorm?.slides_json) {
        const slidesSecoes = (aulaNorm.slides_json as any)?.secoes;
        const hasSufficientSlides = slidesSecoes && 
          slidesSecoes.length >= 5 &&
          slidesSecoes.reduce((acc: number, s: any) => acc + (s.slides?.length || 0), 0) >= 40;
        
        if (hasSufficientSlides) {
          return {
            ...(aulaNorm.slides_json as unknown as SlidesData),
            cached: true,
            aulaId: aulaNorm.id
          };
        }
      }
      
      // Verificar com código original
      const { data: aulaOrig } = await supabase
        .from('aulas_artigos')
        .select('id, slides_json')
        .eq('codigo_tabela', codigoTabela)
        .eq('numero_artigo', numeroArtigo)
        .single();
      
      if (aulaOrig?.slides_json) {
        const slidesSecoes = (aulaOrig.slides_json as any)?.secoes;
        const hasSufficientSlides = slidesSecoes && 
          slidesSecoes.length >= 5 &&
          slidesSecoes.reduce((acc: number, s: any) => acc + (s.slides?.length || 0), 0) >= 40;
        
        if (hasSufficientSlides) {
          return {
            ...(aulaOrig.slides_json as unknown as SlidesData),
            cached: true,
            aulaId: aulaOrig.id
          };
        }
      }
      
      return null;
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30 // 30 minutos
  });

  // Variável memoizada: sempre usa cachedAula se disponível, senão slidesData gerado
  const currentSlidesData = useMemo(() => {
    return cachedAula || slidesData;
  }, [cachedAula, slidesData]);

  // Quando temos cache, ir para intro imediatamente (sem depender de setSlidesData)
  useEffect(() => {
    // IMPORTANTE: Só processar quando o cache terminou de carregar E temos dados
    if (!isCheckingCache && cachedAula && isOpen && etapaAtual === 'loading') {
      console.log('[AulaArtigo] ✅ Carregado do cache React Query');
      setEtapaAtual('intro');
      toast.success("Aula carregada!");
    }
  }, [isCheckingCache, cachedAula, isOpen, etapaAtual]);

  // Rotate loading messages
  useEffect(() => {
    if (etapaAtual === 'loading') {
      const interval = setInterval(() => {
        setLoadingIndex(prev => {
          const next = (prev + 1) % loadingMessages.length;
          setLoadingMessage(loadingMessages[next]);
          return next;
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [etapaAtual]);

  // Estado para modais de bloqueio
  const [showFlashcardsBlockedModal, setShowFlashcardsBlockedModal] = useState(false);
  const [showPraticarBlockedModal, setShowPraticarBlockedModal] = useState(false);
  const [flashcardsProgresso, setFlashcardsProgresso] = useState(0);

  // Buscar ou gerar capa do código
  useEffect(() => {
    const fetchOrGenerateCapaCodigo = async () => {
      const codigoNorm = codigoTabela.toUpperCase().split(' ')[0].split('-')[0].trim();
      
      // Primeiro tentar do banco
      const { data: capaData } = await supabase
        .from('codigos_capas')
        .select('capa_url')
        .eq('codigo_tabela', codigoNorm)
        .single();
      
      if (capaData?.capa_url) {
        setCapaUrl(capaData.capa_url);
      } else {
        // Fallback para mapeamento estático
        const capaDefault = CAPAS_CODIGOS[codigoNorm];
        if (capaDefault) {
          setCapaUrl(capaDefault);
        }
        
        // Tentar gerar capa em background (não bloqueia UI)
        supabase.functions.invoke('gerar-capa-codigo', {
          body: { codigo_tabela: codigoTabela }
        }).then(response => {
          if (response.data?.capa_url) {
            setCapaUrl(response.data.capa_url);
          }
        }).catch(console.error);
      }
    };
    
    if (codigoTabela) {
      fetchOrGenerateCapaCodigo();
    }
  }, [codigoTabela]);

  // Fetch or generate slides when modal opens
  // Gerar slides SOMENTE se não existir no cache
  useEffect(() => {
    // CRÍTICO: NUNCA gerar enquanto isCheckingCache for true
    // A ordem das condições é importante para evitar race condition
    if (!isCheckingCache && isOpen && !cachedAula && !slidesData && !isGenerating) {
      console.log('[AulaArtigo] 🔄 Iniciando geração (não há cache)');
      generateSlidesFromScratch();
    }
  }, [isCheckingCache, isOpen, cachedAula, slidesData, isGenerating]);

  const generateSlidesFromScratch = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    let progressInterval: number | undefined;
    let currentProgress = 0;
    
    const startProgressAnimation = () => {
      progressInterval = window.setInterval(() => {
        if (currentProgress < 95) {
          // Progresso realista com velocidade variável - vai até 95% (não trava em 85%)
          const increment = currentProgress < 15 ? 2.5 : currentProgress < 35 ? 2 : currentProgress < 55 ? 1.5 : currentProgress < 75 ? 1 : currentProgress < 90 ? 0.6 : 0.3;
          currentProgress = Math.min(95, currentProgress + increment);
          setProgress(Math.round(currentProgress));
          
          // Mensagens contextuais
          if (currentProgress < 15) {
            setProgressMessage("📖 Analisando o artigo...");
          } else if (currentProgress < 35) {
            setProgressMessage("🏗️ Criando estrutura da aula...");
          } else if (currentProgress < 55) {
            setProgressMessage("✍️ Gerando slides didáticos...");
          } else if (currentProgress < 75) {
            setProgressMessage("🎴 Criando flashcards...");
          } else if (currentProgress < 90) {
            setProgressMessage("✨ Montando questões...");
          } else {
            setProgressMessage("🎯 Finalizando aula...");
          }
        }
      }, 350);
    };
    
    try {
      setEtapaAtual('loading');
      setProgress(0);
      setProgressMessage("Iniciando...");
      
      startProgressAnimation();
      
      const response = await supabase.functions.invoke('gerar-slides-artigo', {
        body: {
          codigoTabela,
          numeroArtigo,
          conteudoArtigo,
          codigoNome
        }
      });

      if (response.error) throw response.error;

      // Limpar intervalo e completar progresso
      if (progressInterval) clearInterval(progressInterval);
      
      // Animação suave até 100%
      // Animar suavemente até 100%
      for (let i = Math.round(currentProgress); i <= 100; i += 2) {
        setProgress(Math.min(i, 100));
        if (i < 98) setProgressMessage("🎉 Quase pronto!");
        await new Promise(r => setTimeout(r, 30));
      }
      setProgressMessage("✅ Concluído!");
      await new Promise(r => setTimeout(r, 300));

      const data = response.data as SlidesData;
      setSlidesData(data);
      
      // Invalidar e atualizar cache React Query
      queryClient.setQueryData(['aula-artigo', codigoTabela, numeroArtigo], data);

      if (data.cached) {
        toast.success("Aula carregada!");
      } else {
        toast.success("Aula criada com sucesso!");
      }

      // Ir para tela de introdução
      setEtapaAtual('intro');
    } catch (error: any) {
      console.error('Erro ao gerar slides:', error);
      if (progressInterval) clearInterval(progressInterval);
      toast.error("Erro ao gerar aula. Tente novamente.");
      setIsGenerating(false);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartSlides = useCallback(() => {
    // Usar currentSlidesData que combina cache + gerado
    const data = cachedAula || slidesData;
    console.log('[AulaArtigoSlides] Starting slides, secoes:', data?.secoes?.length, 'cached:', !!cachedAula);
    if (data?.secoes && data.secoes.length > 0) {
      // Se veio do cache, garantir que slidesData seja setado para uso nos outros componentes
      if (cachedAula && !slidesData) {
        setSlidesData(cachedAula);
      }
      setEtapaAtual('slides');
    } else {
      toast.error("Erro: Nenhum slide disponível");
      console.error('[AulaArtigoSlides] No secoes found:', data);
    }
  }, [cachedAula, slidesData]);

  const handleStartFlashcards = useCallback(() => {
    setEtapaAtual('flashcards');
  }, []);

  const handleStartQuiz = useCallback(() => {
    setEtapaAtual('quiz');
  }, []);

  const handleSlidesComplete = useCallback(() => {
    setSlidesProgress(100);
    setEtapaAtual('intro');
  }, []);

  const handleFlashcardsComplete = useCallback(() => {
    setEtapaAtual('intro');
  }, []);

  const handleQuizComplete = useCallback((acertos: number, total: number) => {
    setQuizAcertos(acertos);
    setEtapaAtual('resultado');
  }, []);

  const handleRefazer = () => {
    setSlidesProgress(0);
    setQuizAcertos(0);
    setEtapaAtual('intro');
  };

  const handleSair = () => {
    setSlidesData(null);
    setEtapaAtual('loading');
    setSlidesProgress(0);
    setQuizAcertos(0);
    onClose();
  };

  if (!isOpen) return null;

  // Slides viewer (full screen)
  if (etapaAtual === 'slides' && currentSlidesData) {
    return (
      <ConceitosSlidesViewer
        secoes={currentSlidesData.secoes}
        titulo={currentSlidesData.titulo}
        materiaName={currentSlidesData.area}
        onClose={() => setEtapaAtual('intro')}
        onComplete={handleSlidesComplete}
        onProgressChange={setSlidesProgress}
        initialProgress={slidesProgress}
      />
    );
  }

  const totalSlides = currentSlidesData?.secoes?.reduce((acc, s) => acc + (s.slides?.length || 0), 0) || 0;
  const totalSecoes = currentSlidesData?.secoes?.length || 0;
  const leituraCompleta = slidesProgress >= 100;
  const flashcardsCompletos = flashcardsProgresso >= 100;
  const questoesCompletas = quizAcertos > 0;

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] z-[60] flex flex-col overflow-y-auto">
      <AnimatePresence mode="wait">
        {/* Loading State */}
        {etapaAtual === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center px-6 max-w-md">
              <h2 className="text-2xl font-bold text-white mb-2">
                Art. {numeroArtigo}
              </h2>
              <p className="text-gray-400 mb-8">{codigoNome}</p>

              {/* Círculo de progresso com porcentagem */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6"
              >
                <div className="relative w-28 h-28 mx-auto">
                  <svg className="w-28 h-28 -rotate-90">
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="50" 
                      stroke="currentColor" 
                      strokeWidth="5" 
                      fill="none" 
                      className="text-gray-700" 
                    />
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="50" 
                      stroke="currentColor" 
                      strokeWidth="5" 
                      fill="none" 
                      strokeDasharray={314.16} 
                      strokeDashoffset={314.16 * (1 - progress / 100)} 
                      className="text-red-500 transition-all duration-300" 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-red-400">{progress}%</span>
                  </div>
                </div>
              </motion.div>

              <div className="text-center space-y-1 mb-6">
                <motion.p
                  key={progressMessage}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-base font-semibold text-white"
                >
                  {progressMessage}
                </motion.p>
                <p className="text-xs text-gray-500">Isso pode levar alguns instantes</p>
              </div>

              <Button 
                variant="ghost" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleSair();
                }} 
                className="text-gray-400 relative z-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Intro Screen (like OAB Trilhas) */}
        {etapaAtual === 'intro' && currentSlidesData && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            {/* Hero image com degradê */}
            <div className="relative w-full aspect-video max-h-72 overflow-hidden">
              <UniversalImage
                src={capaUrl}
                alt={currentSlidesData.titulo}
                priority
                blurCategory="juridico"
                containerClassName="w-full h-full"
                className="object-cover scale-110"
                fallback={
                  <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-red-400/30" />
                  </div>
                }
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
              
              {/* Back button */}
              <button
                onClick={handleSair}
                className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 pb-8 -mt-20 relative z-10 overflow-y-auto">
              <div className="max-w-lg mx-auto">
                {/* Decorative line */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                  <span className="text-red-400 text-lg">⚖️</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                </div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center mb-6"
                >
                  <p className="text-xs text-red-400 uppercase tracking-widest font-medium mb-2">
                    {codigoNome}
                  </p>
                  <h1 
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Art. {numeroArtigo}
                  </h1>
                  <p className="text-sm text-gray-400 mt-2">
                    Prepare-se para dominar este artigo!
                  </p>
                </motion.div>

                {/* Stats row */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center justify-center gap-4 mb-6 text-sm"
                >
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{currentSlidesData?.tempoEstimado || "25 min"}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-600" />
                  <div className="flex items-center gap-1 text-gray-400">
                    <BookOpen className="w-4 h-4" />
                    <span>{totalSlides} slides</span>
                  </div>
                </motion.div>

                {/* Objetivos */}
                {currentSlidesData.objetivos && currentSlidesData.objetivos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium text-white">Objetivos</span>
                    </div>
                    <ul className="space-y-2">
                      {currentSlidesData.objetivos.slice(0, 4).map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-red-400 mt-0.5">•</span>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Progress cards */}
                {/* Módulos - Layout estilo OAB Trilhas */}
                <div className="space-y-2">
                  {/* Módulo 1: Leitura - Sempre desbloqueado */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleStartSlides();
                      }}
                      className="w-full bg-gradient-to-r from-red-500/20 to-orange-500/10 hover:from-red-500/30 hover:to-orange-500/20 border border-red-500/30 rounded-xl p-3 sm:p-4 transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">
                          1
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                            <span className="text-sm sm:text-base font-semibold text-white">Começar Leitura</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress 
                              value={slidesProgress} 
                              className="h-1 sm:h-1.5 flex-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-orange-500" 
                            />
                            <span className="text-xs text-gray-400 w-10 text-right">{slidesProgress}%</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      </div>
                    </button>
                  </motion.div>

                  {/* Módulo 2: Flashcards */}
                  {currentSlidesData.flashcards && currentSlidesData.flashcards.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (leituraCompleta) {
                            handleStartFlashcards();
                          } else {
                            setShowFlashcardsBlockedModal(true);
                          }
                        }}
                        className={`w-full rounded-xl p-3 sm:p-4 transition-all ${
                          leituraCompleta 
                            ? 'bg-gradient-to-r from-purple-500/20 to-violet-500/10 hover:from-purple-500/30 hover:to-violet-500/20 border border-purple-500/30' 
                            : 'bg-purple-500/10 border border-purple-500/20 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            leituraCompleta ? 'bg-purple-500 text-white' : 'bg-purple-500/30 text-purple-300'
                          }`}>
                            2
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                              <span className={`text-sm sm:text-base font-semibold ${leituraCompleta ? 'text-white' : 'text-purple-300'}`}>
                                Flashcards
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {currentSlidesData.flashcards.length} cards de revisão
                            </p>
                          </div>
                          {leituraCompleta ? (
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                      </button>
                    </motion.div>
                  )}

                  {/* Módulo 3: Praticar */}
                  {currentSlidesData.questoes && currentSlidesData.questoes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (leituraCompleta) {
                            handleStartQuiz();
                          } else {
                            setShowPraticarBlockedModal(true);
                          }
                        }}
                        className={`w-full rounded-xl p-3 sm:p-4 transition-all ${
                          leituraCompleta 
                            ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 hover:from-emerald-500/30 hover:to-green-500/20 border border-emerald-500/30' 
                            : 'bg-emerald-500/10 border border-emerald-500/20 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            leituraCompleta ? 'bg-emerald-500 text-white' : 'bg-emerald-500/30 text-emerald-300'
                          }`}>
                            3
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                              <span className={`text-sm sm:text-base font-semibold ${leituraCompleta ? 'text-white' : 'text-emerald-300'}`}>
                                Praticar
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {currentSlidesData.questoes.length} questões estilo OAB
                            </p>
                          </div>
                          {questoesCompletas ? (
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                          ) : leituraCompleta ? (
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Footer tip */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center text-xs text-gray-600 mt-8"
                >
                  Os slides são interativos e ideais para memorização
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Flashcards */}
        {etapaAtual === 'flashcards' && currentSlidesData && (
          <motion.div
            key="flashcards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a0a0f]">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setEtapaAtual('intro')}>
                  <ArrowLeft className="w-5 h-5 text-white" />
                </Button>
                <div>
                  <h1 className="font-semibold text-white text-sm">Flashcards</h1>
                  <p className="text-xs text-gray-400">Art. {numeroArtigo}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">
                      Flashcards de Revisão
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">
                    Revise os conceitos principais do artigo
                  </p>
                  
                  <FlashcardViewer
                    flashcards={currentSlidesData.flashcards.map(f => ({
                      front: f.frente,
                      back: f.verso,
                      example: f.exemplo
                    }))}
                    tema={`Art. ${numeroArtigo}`}
                  />
                  
                  <div className="mt-6 flex justify-center gap-3">
                    <Button
                      onClick={() => setEtapaAtual('intro')}
                      variant="outline"
                      className="rounded-xl"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handleStartQuiz}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 rounded-xl"
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Ir para Quiz
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quiz */}
        {etapaAtual === 'quiz' && currentSlidesData && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a0a0f]">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setEtapaAtual('intro')}>
                  <ArrowLeft className="w-5 h-5 text-white" />
                </Button>
                <div>
                  <h1 className="font-semibold text-white text-sm">Praticar</h1>
                  <p className="text-xs text-gray-400">Art. {numeroArtigo}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-32">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">
                      Questões de Fixação
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">
                    Teste seus conhecimentos sobre o artigo
                  </p>
                  
                  <QuizViewerEnhanced questions={currentSlidesData.questoes} />
                  
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={() => handleQuizComplete(0, currentSlidesData.questoes.length)}
                      className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold px-8 rounded-xl"
                    >
                      Concluir Aula
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Resultado */}
        {etapaAtual === 'resultado' && currentSlidesData && (
          <motion.div
            key="resultado"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex items-center justify-center p-4"
          >
            <div className="text-center max-w-md">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
              >
                <GraduationCap className="w-12 h-12 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-2">
                Aula Concluída! 🎉
              </h2>
              <p className="text-gray-400 mb-8">
                Você estudou o Art. {numeroArtigo} com sucesso!
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleRefazer}
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  Refazer Aula
                </Button>
                <Button
                  onClick={handleSair}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-600 rounded-xl"
                >
                  Voltar ao Artigo
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Flashcards Bloqueados */}
      <AnimatePresence>
        {showFlashcardsBlockedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowFlashcardsBlockedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#12121a] rounded-2xl p-6 max-w-sm w-full border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white">Flashcards Bloqueados</h3>
              </div>
              
              <p className="text-sm text-gray-400 mb-6">
                Complete a leitura primeiro para desbloquear os flashcards de revisão.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFlashcardsBlockedModal(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFlashcardsBlockedModal(false);
                    handleStartSlides();
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  Iniciar Leitura
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Praticar Bloqueado */}
      <AnimatePresence>
        {showPraticarBlockedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowPraticarBlockedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#12121a] rounded-2xl p-6 max-w-sm w-full border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white">Praticar Bloqueado</h3>
              </div>
              
              <p className="text-sm text-gray-400 mb-6">
                Complete a leitura primeiro para desbloquear as questões de fixação.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPraticarBlockedModal(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPraticarBlockedModal(false);
                    handleStartSlides();
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  Iniciar Leitura
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AulaArtigoSlidesViewer;
