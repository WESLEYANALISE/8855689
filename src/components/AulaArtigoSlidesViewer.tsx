import { useState, useEffect, useCallback } from "react";
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

  // Buscar capa do código
  useEffect(() => {
    const fetchCapaCodigo = async () => {
      // Primeiro tentar do banco
      const { data: capaData } = await supabase
        .from('codigos_capas')
        .select('capa_url')
        .eq('codigo_tabela', codigoTabela)
        .single();
      
      if (capaData?.capa_url) {
        setCapaUrl(capaData.capa_url);
      } else {
        // Fallback para mapeamento estático
        const capaDefault = CAPAS_CODIGOS[codigoTabela.toUpperCase()];
        if (capaDefault) {
          setCapaUrl(capaDefault);
        }
      }
    };
    
    if (codigoTabela) {
      fetchCapaCodigo();
    }
  }, [codigoTabela]);

  // Fetch or generate slides when modal opens
  useEffect(() => {
    if (isOpen && !slidesData) {
      fetchOrGenerateSlides();
    }
  }, [isOpen]);

  const fetchOrGenerateSlides = async () => {
    try {
      setEtapaAtual('loading');
      
      const response = await supabase.functions.invoke('gerar-slides-artigo', {
        body: {
          codigoTabela,
          numeroArtigo,
          conteudoArtigo,
          codigoNome
        }
      });

      if (response.error) throw response.error;

      const data = response.data as SlidesData;
      setSlidesData(data);

      if (data.cached) {
        toast.success("Aula carregada!");
      } else {
        toast.success("Aula criada com sucesso!");
      }

      // Ir para tela de introdução
      setEtapaAtual('intro');
    } catch (error: any) {
      console.error('Erro ao gerar slides:', error);
      toast.error("Erro ao gerar aula. Tente novamente.");
      onClose();
    }
  };

  const handleStartSlides = useCallback(() => {
    setEtapaAtual('slides');
  }, []);

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
  if (etapaAtual === 'slides' && slidesData) {
    return (
      <ConceitosSlidesViewer
        secoes={slidesData.secoes}
        titulo={slidesData.titulo}
        materiaName={slidesData.area}
        onClose={() => setEtapaAtual('intro')}
        onComplete={handleSlidesComplete}
        onProgressChange={setSlidesProgress}
        initialProgress={slidesProgress}
      />
    );
  }

  // Calcular estatísticas
  const totalSlides = slidesData?.secoes?.reduce((acc, s) => acc + (s.slides?.length || 0), 0) || 0;
  const totalSecoes = slidesData?.secoes?.length || 0;
  const leituraCompleta = slidesProgress >= 100;
  const flashcardsCompletos = false; // TODO: track
  const questoesCompletas = quizAcertos > 0;

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] z-[60] overflow-hidden flex flex-col">
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
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="mb-8"
              >
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/30">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-2">
                Art. {numeroArtigo}
              </h2>
              <p className="text-gray-400 mb-8">{codigoNome}</p>

              <div className="flex items-center justify-center gap-3 mb-6">
                <Loader2 className="w-5 h-5 animate-spin text-red-400" />
                <motion.span
                  key={loadingIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-gray-400"
                >
                  {loadingMessage}
                </motion.span>
              </div>

              <div className="flex justify-center gap-2">
                {loadingMessages.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      i <= loadingIndex ? 'bg-red-400' : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>

              <Button variant="ghost" onClick={handleSair} className="mt-8 text-gray-400">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Intro Screen (like OAB Trilhas) */}
        {etapaAtual === 'intro' && slidesData && (
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
                alt={slidesData.titulo}
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
                    <span>{slidesData.tempoEstimado || "25 min"}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-600" />
                  <div className="flex items-center gap-1 text-gray-400">
                    <BookOpen className="w-4 h-4" />
                    <span>{totalSlides} slides</span>
                  </div>
                </motion.div>

                {/* Objetivos */}
                {slidesData.objetivos && slidesData.objetivos.length > 0 && (
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
                      {slidesData.objetivos.slice(0, 4).map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-red-400 mt-0.5">•</span>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Progress cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-3 mb-8"
                >
                  {/* Leitura */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={handleStartSlides}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartSlides()}
                    className="w-full bg-gradient-to-r from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-4 text-left cursor-pointer hover:border-orange-500/50 transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <span className="text-white font-medium">Leitura</span>
                          <p className="text-xs text-gray-400">{totalSlides} slides interativos</p>
                        </div>
                      </div>
                      {leituraCompleta ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <Play className="w-5 h-5 text-orange-400" />
                      )}
                    </div>
                    <Progress value={slidesProgress} className="h-1 bg-orange-500/20" />
                  </div>

                  {/* Flashcards */}
                  <button
                    onClick={leituraCompleta ? handleStartFlashcards : undefined}
                    className={`w-full border rounded-xl p-4 text-left transition-all ${
                      leituraCompleta 
                        ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/10 border-purple-500/30'
                        : 'bg-white/5 border-white/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          leituraCompleta ? 'bg-purple-500/20' : 'bg-white/10'
                        }`}>
                          {leituraCompleta ? (
                            <Sparkles className="w-5 h-5 text-purple-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <span className={leituraCompleta ? 'text-white font-medium' : 'text-gray-400'}>
                            Flashcards
                          </span>
                          <p className="text-xs text-gray-500">
                            {slidesData.flashcards?.length || 0} cards de revisão
                          </p>
                        </div>
                      </div>
                      {leituraCompleta && <ChevronRight className="w-5 h-5 text-purple-400" />}
                    </div>
                  </button>

                  {/* Quiz */}
                  <button
                    onClick={leituraCompleta ? handleStartQuiz : undefined}
                    className={`w-full border rounded-xl p-4 text-left transition-all ${
                      leituraCompleta 
                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-500/30'
                        : 'bg-white/5 border-white/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          leituraCompleta ? 'bg-emerald-500/20' : 'bg-white/10'
                        }`}>
                          {leituraCompleta ? (
                            <HelpCircle className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <span className={leituraCompleta ? 'text-white font-medium' : 'text-gray-400'}>
                            Praticar
                          </span>
                          <p className="text-xs text-gray-500">
                            {slidesData.questoes?.length || 0} questões estilo OAB
                          </p>
                        </div>
                      </div>
                      {questoesCompletas && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {leituraCompleta && !questoesCompletas && <ChevronRight className="w-5 h-5 text-emerald-400" />}
                    </div>
                  </button>
                </motion.div>

                {/* Main CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={handleStartSlides}
                    className="w-full h-14 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {slidesProgress > 0 ? 'Continuar Leitura' : 'Iniciar Aula'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Flashcards */}
        {etapaAtual === 'flashcards' && slidesData && (
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
                    flashcards={slidesData.flashcards.map(f => ({
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
        {etapaAtual === 'quiz' && slidesData && (
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
                  
                  <QuizViewerEnhanced questions={slidesData.questoes} />
                  
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={() => handleQuizComplete(0, slidesData.questoes.length)}
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
        {etapaAtual === 'resultado' && slidesData && (
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
    </div>
  );
};

export default AulaArtigoSlidesViewer;
