import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, BookOpen, Layers, Play, BookText, Sparkles, Lock, Volume2, VolumeX, HelpCircle, X, ChevronDown, ChevronUp, Target, List, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UniversalImage } from "@/components/ui/universal-image";

interface ConceitosTopicoIntroProps {
  titulo: string;
  materiaName?: string;
  capaUrl?: string | null;
  tempoEstimado?: string;
  totalSecoes?: number;
  totalPaginas?: number;
  objetivos?: string[];
  progressoLeitura?: number;
  progressoFlashcards?: number;
  progressoQuestoes?: number;
  hasFlashcards?: boolean;
  hasQuestoes?: boolean;
  onStartPaginas: () => void;
  onStartFlashcards?: () => void;
  onStartQuestoes?: () => void;
}

export const ConceitosTopicoIntro = ({
  titulo,
  materiaName,
  capaUrl,
  tempoEstimado = "25 min",
  totalSecoes = 6,
  totalPaginas = 35,
  objetivos = [],
  progressoLeitura = 0,
  progressoFlashcards = 0,
  progressoQuestoes = 0,
  hasFlashcards = false,
  hasQuestoes = false,
  onStartPaginas,
  onStartFlashcards,
  onStartQuestoes
}: ConceitosTopicoIntroProps) => {
  // Ruído marrom
  const [brownNoiseEnabled, setBrownNoiseEnabled] = useState(false);
  const [showBrownNoiseInfo, setShowBrownNoiseInfo] = useState(false);
  const brownNoiseRef = useRef<HTMLAudioElement | null>(null);
  
  // Índice - expandido por padrão para mostrar objetivos
  const [showIndex, setShowIndex] = useState(true);
  
  // Modais de aviso para itens bloqueados
  const [showFlashcardsBlockedModal, setShowFlashcardsBlockedModal] = useState(false);
  const [showPraticarBlockedModal, setShowPraticarBlockedModal] = useState(false);

  // Calcular desbloqueios
  const leituraCompleta = progressoLeitura >= 100;
  const flashcardsCompletos = progressoFlashcards >= 100;

  // Gerenciar áudio do ruído marrom
  useEffect(() => {
    if (!brownNoiseRef.current) {
      brownNoiseRef.current = new Audio('/audio/ruido-marrom.mp3');
      brownNoiseRef.current.loop = true;
      brownNoiseRef.current.volume = 0.5;
    }

    if (brownNoiseEnabled) {
      brownNoiseRef.current.play().catch(console.error);
      // Mostrar info na primeira vez
      const hasSeenInfo = localStorage.getItem('conceitos-brown-noise-info-seen');
      if (!hasSeenInfo) {
        setShowBrownNoiseInfo(true);
        localStorage.setItem('conceitos-brown-noise-info-seen', 'true');
      }
    } else {
      brownNoiseRef.current.pause();
    }

    return () => {
      if (brownNoiseRef.current) {
        brownNoiseRef.current.pause();
      }
    };
  }, [brownNoiseEnabled]);

  return (
    <motion.div 
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-4rem)] flex flex-col bg-[#0a0a0f]"
    >
      {/* Hero image com degradê */}
      <div className="relative w-full aspect-video max-h-72 overflow-hidden">
        <UniversalImage
          src={capaUrl}
          alt={titulo}
          priority
          blurCategory="juridico"
          containerClassName="w-full h-full"
          className="object-cover"
          fallback={
            <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-red-400/30" />
            </div>
          }
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-8 -mt-20 relative z-10">
        <div className="max-w-lg mx-auto">
          {/* Decorative line */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            <span className="text-red-400 text-lg">✦</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6"
          >
            {materiaName && (
              <p className="text-xs text-red-400 uppercase tracking-widest font-medium mb-2">
                {materiaName}
              </p>
            )}
            <h1 
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {titulo}
            </h1>
          </motion.div>

          {/* Stats row com ruído marrom inline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-6 flex-wrap"
          >
            <div className="flex items-center gap-1.5 text-gray-400">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">{totalPaginas} páginas</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-1.5 text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{tempoEstimado}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <button
              onClick={() => setBrownNoiseEnabled(!brownNoiseEnabled)}
              className={`flex items-center gap-1.5 transition-colors ${
                brownNoiseEnabled ? 'text-red-400' : 'text-gray-500'
              }`}
            >
              {brownNoiseEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="text-sm">Ruído Marrom</span>
            </button>
          </motion.div>

          {/* Objectives BEFORE modules */}
          {objetivos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <button
                onClick={() => setShowIndex(!showIndex)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">O que você vai aprender</span>
                </div>
                {showIndex ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              <AnimatePresence>
                {showIndex && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ul className="mt-3 space-y-2 px-2">
                      {objetivos.slice(0, 5).map((objetivo, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                          {objetivo}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Modules - Compact responsive design */}
          <div className="space-y-2">
            {/* Module 1: Leitura - Always unlocked */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={onStartPaginas}
                className="w-full bg-gradient-to-r from-red-500/20 to-orange-500/10 hover:from-red-500/30 hover:to-orange-500/20 border border-red-500/30 rounded-xl p-3 sm:p-4 transition-all"
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
                        value={progressoLeitura} 
                        className="h-1 sm:h-1.5 flex-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-orange-500" 
                      />
                      <span className="text-xs text-gray-400 w-10 text-right">{progressoLeitura}%</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </div>
              </button>
            </motion.div>

            {/* Module 2: Flashcards */}
            {hasFlashcards && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={() => {
                    if (leituraCompleta && onStartFlashcards) {
                      onStartFlashcards();
                    } else if (!leituraCompleta) {
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
                      <div className="flex items-center gap-2 mt-1">
                        <Progress 
                          value={progressoFlashcards} 
                          className="h-1 sm:h-1.5 flex-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-violet-500"
                        />
                        <span className="text-xs text-purple-400 w-10 text-right">{progressoFlashcards}%</span>
                      </div>
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

            {/* Module 3: Praticar */}
            {hasQuestoes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <button
                  onClick={() => {
                    if (flashcardsCompletos && onStartQuestoes) {
                      onStartQuestoes();
                    } else if (!flashcardsCompletos) {
                      setShowPraticarBlockedModal(true);
                    }
                  }}
                  className={`w-full rounded-xl p-3 sm:p-4 transition-all ${
                    flashcardsCompletos 
                      ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 hover:from-emerald-500/30 hover:to-green-500/20 border border-emerald-500/30' 
                      : 'bg-emerald-500/10 border border-emerald-500/20 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      flashcardsCompletos ? 'bg-emerald-500 text-white' : 'bg-emerald-500/30 text-emerald-300'
                    }`}>
                      3
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                        <span className={`text-sm sm:text-base font-semibold ${flashcardsCompletos ? 'text-white' : 'text-emerald-300'}`}>
                          Praticar
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress 
                          value={progressoQuestoes} 
                          className="h-1 sm:h-1.5 flex-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-green-500"
                        />
                        <span className="text-xs text-emerald-400 w-10 text-right">{progressoQuestoes}%</span>
                      </div>
                    </div>
                    {flashcardsCompletos ? (
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
            transition={{ delay: 0.7 }}
            className="text-center text-xs text-gray-600 mt-8"
          >
            As páginas são interativas e ideais para memorização
          </motion.p>
        </div>
      </div>

      {/* Brown noise info modal */}
      <AnimatePresence>
        {showBrownNoiseInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowBrownNoiseInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#12121a] rounded-2xl p-6 max-w-sm w-full border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-red-400" />
                  <h3 className="font-semibold text-white">Ruído Marrom</h3>
                </div>
                <button
                  onClick={() => setShowBrownNoiseInfo(false)}
                  className="p-1 text-gray-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 text-sm text-gray-400">
                <p>
                  O ruído marrom é um som de baixa frequência que ajuda a:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✓</span>
                    Melhorar a concentração nos estudos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✓</span>
                    Reduzir distrações do ambiente
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✓</span>
                    Criar um ambiente propício para foco
                  </li>
                </ul>
                <p className="text-xs text-gray-500 pt-2">
                  Dica: Use fones de ouvido para melhor experiência.
                </p>
              </div>
              
              <Button
                onClick={() => setShowBrownNoiseInfo(false)}
                className="w-full mt-4 bg-red-500 hover:bg-red-600"
              >
                Entendi
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Flashcards bloqueado */}
      <AnimatePresence>
        {showFlashcardsBlockedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFlashcardsBlockedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#12121a] rounded-2xl p-6 max-w-sm w-full border border-purple-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold text-white">Flashcards Bloqueados</h3>
                </div>
                <button
                  onClick={() => setShowFlashcardsBlockedModal(false)}
                  className="p-1 text-gray-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 text-sm text-gray-400">
                <p>
                  Para desbloquear os flashcards, você precisa:
                </p>
                <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <Play className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-gray-300">Concluir a leitura das páginas interativas</span>
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  A leitura ajuda a absorver o conteúdo antes de treinar com flashcards.
                </p>
              </div>
              
              <Button
                onClick={() => {
                  setShowFlashcardsBlockedModal(false);
                  onStartPaginas();
                }}
                className="w-full mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Começar Leitura
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Praticar bloqueado */}
      <AnimatePresence>
        {showPraticarBlockedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPraticarBlockedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#12121a] rounded-2xl p-6 max-w-sm w-full border border-emerald-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">Praticar Bloqueado</h3>
                </div>
                <button
                  onClick={() => setShowPraticarBlockedModal(false)}
                  className="p-1 text-gray-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 text-sm text-gray-400">
                <p>
                  Para desbloquear o modo Praticar, você precisa:
                </p>
                <div className="space-y-2">
                  <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                    leituraCompleta 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <Play className={`w-5 h-5 flex-shrink-0 ${leituraCompleta ? 'text-green-400' : 'text-red-400'}`} />
                    <span className="text-gray-300">
                      {leituraCompleta ? '✓ Leitura concluída' : 'Concluir a leitura'}
                    </span>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                    flashcardsCompletos 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : 'bg-purple-500/10 border-purple-500/20'
                  }`}>
                    <Sparkles className={`w-5 h-5 flex-shrink-0 ${flashcardsCompletos ? 'text-green-400' : 'text-purple-400'}`} />
                    <span className="text-gray-300">
                      {flashcardsCompletos ? '✓ Flashcards concluídos' : 'Treinar com flashcards'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  Seguir essa ordem ajuda a fixar o conteúdo de forma progressiva.
                </p>
              </div>
              
              <Button
                onClick={() => {
                  setShowPraticarBlockedModal(false);
                  if (!leituraCompleta) {
                    onStartPaginas();
                  } else if (onStartFlashcards) {
                    onStartFlashcards();
                  }
                }}
                className={`w-full mt-4 ${
                  !leituraCompleta 
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                    : 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600'
                }`}
              >
                {!leituraCompleta ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Começar Leitura
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Treinar Flashcards
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConceitosTopicoIntro;
