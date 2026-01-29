import { useState, useRef, useEffect } from "react";
import { X, Play, Pause, Volume2, VolumeX, List, Music2, MessageCircle, CheckCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AudioVisualization from "./AudioVisualization";
import AudioPlaylistModal from "./AudioPlaylistModal";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { motion, AnimatePresence } from "framer-motion";

interface SpotifyLikePlayerProps {
  isOpen: boolean;
  onClose: () => void;
  audioUrl: string;
  audioUrlResposta?: string;
  audioUrlExemplo?: string;
  title: string;
  area: string;
  tema: string;
  descricao: string;
  tag?: string;
  imagem_miniatura?: string;
  onPlaylistClick?: () => void;
  tipo?: "audioaula" | "flashcard" | "resumo" | "artigo";
  texto_exemplo?: string;
  url_imagem_exemplo?: string;
  pergunta?: string;
  resposta?: string;
}

type FlashcardStep = "pergunta" | "resposta" | "exemplo";

const SpotifyLikePlayer = ({
  isOpen,
  onClose,
  audioUrl,
  audioUrlResposta,
  audioUrlExemplo,
  title,
  area,
  tema,
  descricao,
  tag,
  onPlaylistClick,
  tipo,
  texto_exemplo,
  url_imagem_exemplo,
  pergunta,
  resposta,
}: SpotifyLikePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [flashcardStep, setFlashcardStep] = useState<FlashcardStep>("pergunta");
  const [currentAudioUrl, setCurrentAudioUrl] = useState(audioUrl);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { playNext, playlist } = useAudioPlayer();

  // Reset state when audio changes
  useEffect(() => {
    if (isOpen && tipo === "flashcard") {
      setFlashcardStep("pergunta");
      setCurrentAudioUrl(audioUrl);
    }
  }, [isOpen, audioUrl, tipo]);

  // Handle flashcard audio sequence
  const handleAudioEnded = () => {
    if (tipo === "flashcard") {
      if (flashcardStep === "pergunta" && audioUrlResposta && resposta) {
        // Finished question, play answer
        setFlashcardStep("resposta");
        setCurrentAudioUrl(audioUrlResposta);
        setCurrentTime(0);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = audioUrlResposta;
            audioRef.current.load();
            audioRef.current.play().catch(console.error);
          }
        }, 300);
        return;
      } else if (flashcardStep === "resposta" && audioUrlExemplo && texto_exemplo) {
        // Finished answer, play example
        setFlashcardStep("exemplo");
        setCurrentAudioUrl(audioUrlExemplo);
        setCurrentTime(0);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = audioUrlExemplo;
            audioRef.current.load();
            audioRef.current.play().catch(console.error);
          }
        }, 300);
        return;
      }
    }
    
    // Finished all or not flashcard - go to next in playlist
    setIsPlaying(false);
    if (playlist.length > 0) {
      console.log('🎵 Áudio finalizado, tocando próximo da playlist');
      playNext();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setFlashcardStep("pergunta");
    } else if (audioRef.current && currentAudioUrl) {
      audioRef.current.src = currentAudioUrl;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
      }
    }
  }, [isOpen]);

  // Update audio source when currentAudioUrl changes (but not on initial load)
  useEffect(() => {
    if (audioRef.current && currentAudioUrl && isOpen && audioRef.current.src !== currentAudioUrl) {
      // This is handled by handleAudioEnded for flashcards
    }
  }, [currentAudioUrl, isOpen]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    handleSeek([percent * duration]);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  const getStepLabel = () => {
    switch (flashcardStep) {
      case "pergunta": return "Pergunta";
      case "resposta": return "Resposta";
      case "exemplo": return "Exemplo Prático";
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-50 bg-gradient-to-br from-gray-900 to-gray-800 transition-all duration-300 ${
        isOpen ? "translate-y-0" : "translate-y-full"
      } overflow-y-auto`}>
        <audio
          ref={audioRef}
          src={currentAudioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
        />

        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Header com botão fechar */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-gray-400">Tocando Agora</h3>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Flashcard Card - APENAS UM POR VEZ */}
          {tipo === "flashcard" && (
            <div className="min-h-[200px] relative">
              <AnimatePresence mode="wait">
                {/* Card da Pergunta */}
                {flashcardStep === "pergunta" && pergunta && (
                  <motion.div
                    key="pergunta-card"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="rounded-2xl p-5 border bg-blue-500/20 border-blue-500/40 ring-2 ring-blue-500/30"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                      <h3 className="text-sm font-semibold text-blue-400">Pergunta</h3>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto px-2 py-0.5 bg-blue-500/30 rounded-full text-xs text-blue-300"
                      >
                        Reproduzindo
                      </motion.span>
                    </div>
                    <p className="text-white leading-relaxed">{pergunta}</p>
                  </motion.div>
                )}
                
                {/* Card da Resposta */}
                {flashcardStep === "resposta" && resposta && (
                  <motion.div
                    key="resposta-card"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="rounded-2xl p-5 border bg-green-500/20 border-green-500/40 ring-2 ring-green-500/30"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <h3 className="text-sm font-semibold text-green-400">Resposta</h3>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto px-2 py-0.5 bg-green-500/30 rounded-full text-xs text-green-300"
                      >
                        Reproduzindo
                      </motion.span>
                    </div>
                    <p className="text-white leading-relaxed">{resposta}</p>
                  </motion.div>
                )}
                
                {/* Card do Exemplo Prático com Imagem */}
                {flashcardStep === "exemplo" && texto_exemplo && (
                  <motion.div
                    key="exemplo-card"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="rounded-2xl overflow-hidden border bg-purple-500/20 border-purple-500/40 ring-2 ring-purple-500/30"
                  >
                    {/* Imagem do Exemplo (se houver) */}
                    {url_imagem_exemplo && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-full h-48 overflow-hidden"
                      >
                        <img 
                          src={url_imagem_exemplo} 
                          alt="Ilustração do exemplo" 
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-purple-400" />
                        <h3 className="text-sm font-semibold text-purple-400">Exemplo Prático</h3>
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto px-2 py-0.5 bg-purple-500/30 rounded-full text-xs text-purple-300"
                        >
                          Reproduzindo
                        </motion.span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{texto_exemplo}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step Indicator for Flashcards */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className={`w-2 h-2 rounded-full transition-colors ${flashcardStep === "pergunta" ? "bg-blue-500" : "bg-white/30"}`} />
                <div className={`w-2 h-2 rounded-full transition-colors ${flashcardStep === "resposta" ? "bg-green-500" : "bg-white/30"}`} />
                <div className={`w-2 h-2 rounded-full transition-colors ${flashcardStep === "exemplo" ? "bg-purple-500" : "bg-white/30"}`} />
              </div>
            </div>
          )}

          {/* Ícone/Visual Central - Menor para flashcards */}
          <div className={`flex justify-center ${tipo === "flashcard" ? "py-2" : "py-8"}`}>
            <div className={`${tipo === "flashcard" ? "w-24 h-24" : "w-48 h-48"} rounded-3xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-2xl shadow-purple-500/50 relative`}>
              <Music2 className={`${tipo === "flashcard" ? "w-12 h-12" : "w-24 h-24"} text-white`} />
              {isPlaying && (
                <div className="absolute inset-0 bg-purple-400/20 rounded-3xl animate-pulse" />
              )}
            </div>
          </div>

          {/* Título, área e volume */}
          <div className="text-center space-y-4">
            <div>
              <h2 className={`font-bold text-white ${tipo === "flashcard" ? "text-lg" : "text-3xl"}`}>{title}</h2>
              <p className="text-base text-gray-300">
                {area} {tema && `• ${tema}`}
              </p>
              {tipo === "flashcard" && (
                <p className="text-sm text-primary mt-1">{getStepLabel()}</p>
              )}
            </div>
            
            {/* Controles de volume */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-48 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="cursor-pointer" onClick={handleProgressClick}>
              <Progress 
                value={(currentTime / duration) * 100 || 0} 
                className="h-2 bg-white/10"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Visualização e Play/Pause */}
          <div className="flex items-center justify-center gap-8">
            <AudioVisualization isPlaying={isPlaying} />
            
            <Button
              onClick={togglePlayPause}
              size="icon"
              className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 shadow-2xl shadow-purple-500/50 transition-all hover:scale-110"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8 text-white" fill="white" />
              ) : (
                <Play className="h-8 w-8 text-white ml-1" fill="white" />
              )}
            </Button>

            <AudioVisualization isPlaying={isPlaying} />
          </div>

          {/* Conteúdo Visual para Resumos */}
          {tipo === "resumo" && (texto_exemplo || url_imagem_exemplo) && (
            <div className="space-y-4">
              {url_imagem_exemplo && (
                <div className="rounded-2xl overflow-hidden">
                  <img 
                    src={url_imagem_exemplo} 
                    alt="Ilustração do resumo" 
                    className="w-full object-cover max-h-72"
                  />
                </div>
              )}
              {texto_exemplo && (
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-3">Conteúdo</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">{texto_exemplo}</p>
                </div>
              )}
            </div>
          )}

          {/* Sobre o áudio (para audioaulas tradicionais) */}
          {(!tipo || tipo === "audioaula") && descricao && (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Sobre o áudio</h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{descricao}</p>
            </div>
          )}

          {/* Botão de playlist */}
          <div className="flex items-center justify-center pt-4 border-t border-white/10">
            <button
              onClick={() => setShowPlaylist(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              <List className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">Ver Playlist</span>
            </button>
          </div>

          {/* Espaço extra no final para evitar corte */}
          <div className="h-8"></div>
        </div>
      </div>

      {/* Modal de Playlist */}
      <AudioPlaylistModal
        isOpen={showPlaylist}
        onClose={() => setShowPlaylist(false)}
      />
    </>
  );
};

export default SpotifyLikePlayer;
