import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, BookOpen, Play, Sparkles, Lock, Volume2, VolumeX, X, ChevronDown, ChevronUp, Target, List, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UniversalImage } from "@/components/ui/universal-image";

interface OABTrilhasTopicoIntroProps {
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
  onBack?: () => void;
  subtituloMateria?: string;
  textoMotivacional?: string;
  textoFooter?: string;
}

export const OABTrilhasTopicoIntro = ({
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
  onStartQuestoes,
  onBack,
  subtituloMateria,
  textoMotivacional,
  textoFooter,
}: OABTrilhasTopicoIntroProps) => {
  // Ruído marrom
  const [brownNoiseEnabled, setBrownNoiseEnabled] = useState(false);
  const [showBrownNoiseInfo, setShowBrownNoiseInfo] = useState(false);
  const brownNoiseRef = useRef<HTMLAudioElement | null>(null);
  
  // Índice - inicia fechado e abre com animação de "suspense"
  const [showIndex, setShowIndex] = useState(false);
  
  // Auto-open with suspense animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowIndex(true), 800);
    return () => clearTimeout(timer);
  }, []);
  
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
      const hasSeenInfo = localStorage.getItem('oab-trilhas-brown-noise-info-seen');
      if (!hasSeenInfo) {
        setShowBrownNoiseInfo(true);
        localStorage.setItem('oab-trilhas-brown-noise-info-seen', 'true');
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
      className="min-h-screen flex flex-col bg-[#0a0a0f]"
    >
      {/* Hero image com degradê */}
      <div className="relative w-full aspect-video max-h-72 overflow-hidden">
        <UniversalImage
          src={capaUrl}
          alt={titulo}
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
        
        {/* Gradient overlay - only at bottom where content overlaps */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-8 -mt-20 relative z-10">
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
            {materiaName && (
              <p className="text-xs text-red-400 uppercase tracking-widest font-medium mb-2">
                {subtituloMateria || (materiaName ? `${materiaName} • OAB 1ª Fase` : '')}
              </p>
            )}
            <h1 
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {titulo}
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              {textoMotivacional || "Prepare-se para dominar este tema da OAB!"}
            </p>
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

          {/* Serpentine Study Path */}
          <div className="flex flex-col items-center relative py-4">
            {/* SVG connector line */}
            <svg className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full pointer-events-none" viewBox="0 0 4 600" preserveAspectRatio="none">
              <line x1="2" y1="40" x2="2" y2="560" stroke="rgba(255,255,255,0.1)" strokeWidth="3" strokeLinecap="round" />
              <line x1="2" y1="40" x2="2" y2={leituraCompleta ? (flashcardsCompletos ? "560" : "300") : "40"} stroke="url(#progressGrad)" strokeWidth="3" strokeLinecap="round" />
              <defs>
                <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(239,68,68,0.8)" />
                  <stop offset="50%" stopColor="rgba(168,85,247,0.8)" />
                  <stop offset="100%" stopColor="rgba(16,185,129,0.8)" />
                </linearGradient>
              </defs>
            </svg>

            {/* Node 1: Leitura */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 180, damping: 15 }}
              className="relative z-10 flex flex-col items-center mb-8"
            >
              <button onClick={onStartPaginas} className="relative group">
                {/* Pulse ring for current step */}
                {!leituraCompleta && (
                  <>
                    <motion.div
                      className="absolute -inset-3 rounded-full border-2 border-red-500"
                      animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute -inset-5 rounded-full border border-red-500"
                      animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    />
                  </>
                )}
                <div className={`relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-xl transition-transform active:scale-95 ${
                  !leituraCompleta ? "border-[3px] border-red-500 shadow-red-500/40" : leituraCompleta ? "border-[3px] border-green-500 shadow-green-500/30" : "border-2 border-white/20"
                }`}>
                  <div className="w-full h-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-full">
                    <span className="text-white font-bold text-xs mb-2 drop-shadow-lg">{progressoLeitura}%</span>
                  </div>
                </div>
                <div className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center border-2 border-[#0a0a0f] font-bold text-white text-xs shadow-lg">
                  1
                </div>
              </button>
              <p className="mt-2 text-sm font-semibold text-white">Começar Leitura</p>
              <p className="text-[10px] text-gray-500">{totalPaginas} páginas</p>
            </motion.div>

            {/* Node 2: Flashcards */}
            {hasFlashcards && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45, type: "spring", stiffness: 180, damping: 15 }}
                className="relative z-10 flex flex-col items-center mb-8"
              >
                <button
                  onClick={() => {
                    if (leituraCompleta && onStartFlashcards) {
                      onStartFlashcards();
                    } else if (!leituraCompleta) {
                      setShowFlashcardsBlockedModal(true);
                    }
                  }}
                  className="relative group"
                >
                  {leituraCompleta && !flashcardsCompletos && (
                    <>
                      <motion.div
                        className="absolute -inset-3 rounded-full border-2 border-purple-500"
                        animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.div
                        className="absolute -inset-5 rounded-full border border-purple-500"
                        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                      />
                    </>
                  )}
                  <div className={`relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-xl transition-transform active:scale-95 ${
                    leituraCompleta && !flashcardsCompletos ? "border-[3px] border-purple-500 shadow-purple-500/40" : flashcardsCompletos ? "border-[3px] border-green-500 shadow-green-500/30" : "border-2 border-white/20 opacity-60"
                  }`}>
                    <div className={`w-full h-full flex items-center justify-center ${leituraCompleta ? "bg-gradient-to-br from-purple-500 to-violet-600" : "bg-gradient-to-br from-purple-500/40 to-violet-600/40"}`}>
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    {!leituraCompleta && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                        <Lock className="w-6 h-6 text-white/80" />
                      </div>
                    )}
                    {leituraCompleta && (
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-full">
                        <span className="text-white font-bold text-xs mb-2 drop-shadow-lg">{progressoFlashcards}%</span>
                      </div>
                    )}
                  </div>
                  <div className={`absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#0a0a0f] font-bold text-white text-xs shadow-lg ${
                    leituraCompleta ? "bg-purple-600" : "bg-purple-600/50"
                  }`}>
                    2
                  </div>
                </button>
                <p className={`mt-2 text-sm font-semibold ${leituraCompleta ? "text-white" : "text-purple-300/60"}`}>Flashcards</p>
                {!leituraCompleta && <p className="text-[10px] text-gray-600">Conclua a leitura</p>}
              </motion.div>
            )}

            {/* Node 3: Praticar */}
            {hasQuestoes && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 180, damping: 15 }}
                className="relative z-10 flex flex-col items-center"
              >
                <button
                  onClick={() => {
                    if (flashcardsCompletos && onStartQuestoes) {
                      onStartQuestoes();
                    } else if (!flashcardsCompletos) {
                      setShowPraticarBlockedModal(true);
                    }
                  }}
                  className="relative group"
                >
                  {flashcardsCompletos && (
                    <>
                      <motion.div
                        className="absolute -inset-3 rounded-full border-2 border-emerald-500"
                        animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.div
                        className="absolute -inset-5 rounded-full border border-emerald-500"
                        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                      />
                    </>
                  )}
                  <div className={`relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-xl transition-transform active:scale-95 ${
                    flashcardsCompletos ? "border-[3px] border-emerald-500 shadow-emerald-500/40" : "border-2 border-white/20 opacity-60"
                  }`}>
                    <div className={`w-full h-full flex items-center justify-center ${flashcardsCompletos ? "bg-gradient-to-br from-emerald-500 to-green-600" : "bg-gradient-to-br from-emerald-500/40 to-green-600/40"}`}>
                      <Target className="w-10 h-10 text-white" />
                    </div>
                    {!flashcardsCompletos && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                        <Lock className="w-6 h-6 text-white/80" />
                      </div>
                    )}
                    {flashcardsCompletos && (
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-full">
                        <span className="text-white font-bold text-xs mb-2 drop-shadow-lg">{progressoQuestoes}%</span>
                      </div>
                    )}
                  </div>
                  <div className={`absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#0a0a0f] font-bold text-white text-xs shadow-lg ${
                    flashcardsCompletos ? "bg-emerald-600" : "bg-emerald-600/50"
                  }`}>
                    3
                  </div>
                </button>
                <p className={`mt-2 text-sm font-semibold ${flashcardsCompletos ? "text-white" : "text-emerald-300/60"}`}>Praticar</p>
                {!flashcardsCompletos && <p className="text-[10px] text-gray-600">Conclua os flashcards</p>}
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
            {textoFooter || "As páginas são interativas e ideais para memorização da OAB"}
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

export default OABTrilhasTopicoIntro;
