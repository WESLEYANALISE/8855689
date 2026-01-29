import { useState, useEffect, useRef } from 'react';
import { Crown, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import AudioWaveAnimation from '@/components/AudioWaveAnimation';
import { persuasiveAudioCache } from '@/hooks/useHomePreloader';

// Guard global para garantir que apenas um áudio toque por vez
let globalAudioPlaying = false;

interface PremiumFloatingCardProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const PremiumFloatingCard = ({
  isOpen,
  onClose,
  title = "Conteúdo Premium",
  description = "Desbloqueie este recurso assinando um dos nossos planos."
}: PremiumFloatingCardProps) => {
  const navigate = useNavigate();
  const [narracaoData, setNarracaoData] = useState<{ frase: string; audioBase64: string | null } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const hasPlayedRef = useRef(false);

  // Função para parar áudio imediatamente
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
    globalAudioPlaying = false;
  };

  // Função para tocar áudio (sempre WAV após conversão na edge function)
  const playAudio = (audioBase64: string) => {
    // Não toca se já tem áudio global tocando
    if (globalAudioPlaying) return;
    
    globalAudioPlaying = true;
    const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
    audio.volume = 0.8;
    audioRef.current = audio;
    setIsPlayingAudio(true);
    
    audio.onended = () => {
      setIsPlayingAudio(false);
      globalAudioPlaying = false;
    };
    audio.onerror = (e) => {
      console.error('Erro ao reproduzir áudio:', e);
      setIsPlayingAudio(false);
      globalAudioPlaying = false;
    };
    
    audio.play().catch((err) => {
      console.log('Autoplay bloqueado:', err);
      setIsPlayingAudio(false);
      globalAudioPlaying = false;
    });
  };

  // Pré-carregar mais áudios em background (fallback caso cache esteja vazio)
  const preloadMoreAudios = async () => {
    for (let i = 0; i < 3; i++) {
      try {
        const { data } = await supabase.functions.invoke('gerar-frase-assinatura');
        if (data?.audioBase64 && data?.frase && !persuasiveAudioCache.has(data.frase)) {
          persuasiveAudioCache.set(data.frase, data);
        }
      } catch (err) {
        console.log('Erro ao pré-carregar áudio:', err);
      }
    }
  };

  // Carregar e tocar áudio quando o modal abrir
  useEffect(() => {
    if (isOpen && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      
      // Verifica cache global primeiro (pré-carregado no login)
      if (persuasiveAudioCache.size > 0) {
        const cached = Array.from(persuasiveAudioCache.values());
        const randomCached = cached[Math.floor(Math.random() * cached.length)];
        setNarracaoData(randomCached);
        playAudio(randomCached.audioBase64);
      } else {
        // Fallback: busca da edge function se cache vazio
        supabase.functions.invoke('gerar-frase-assinatura')
          .then(({ data, error }) => {
            if (error) {
              console.error('Erro ao gerar narração:', error);
              return;
            }
            if (data?.audioBase64) {
              persuasiveAudioCache.set(data.frase, data);
              setNarracaoData(data);
              playAudio(data.audioBase64);
              
              // Pré-carrega mais áudios em background
              preloadMoreAudios();
            }
          });
      }
    } else if (!isOpen) {
      // Parar áudio ao fechar e resetar flag
      stopAudio();
      setNarracaoData(null);
      hasPlayedRef.current = false;
    }
  }, [isOpen]);

  const handleVerPlanos = () => {
    // Parar áudio imediatamente
    stopAudio();
    
    // Fechar modal
    onClose();
    
    // Navegar após pequeno delay para garantir limpeza
    setTimeout(() => {
      navigate('/assinatura');
    }, 50);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />
          
          {/* Card Flutuante */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-4 right-4 bottom-24 z-[9999] md:left-1/2 md:-translate-x-1/2 md:w-[400px] md:max-w-[90vw] pointer-events-auto"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-yellow-500/20 border border-amber-500/30 shadow-2xl shadow-amber-500/20">
              {/* Glow effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl" />
              
              {/* Botão fechar */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/50 hover:bg-background/80 flex items-center justify-center transition-colors z-10"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="relative p-6 text-center">
                {/* Ícone animado */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", damping: 15 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/40 mb-4"
                >
                  <Crown className="w-8 h-8 text-white" />
                </motion.div>

                {/* Título */}
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xl font-bold text-foreground mb-2"
                >
                  {title}
                </motion.h3>

                {/* Descrição */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-muted-foreground mb-6"
                >
                  {description}
                </motion.p>

                {/* Frase persuasiva narrada */}
                {narracaoData?.frase && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-2 mb-4 text-sm text-amber-400/90 italic"
                  >
                    {isPlayingAudio && (
                      <div className="text-amber-400">
                        <AudioWaveAnimation />
                      </div>
                    )}
                    <span>"{narracaoData.frase}"</span>
                  </motion.div>
                )}

                {/* Botão */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Button
                    onClick={handleVerPlanos}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold h-12 rounded-xl shadow-lg shadow-amber-500/30"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ver Planos
                  </Button>
                </motion.div>

                {/* Features rápidas */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground"
                >
                  <span>✓ Acesso ilimitado</span>
                  <span>•</span>
                  <span>✓ Sem anúncios</span>
                  <span>•</span>
                  <span>✓ Suporte VIP</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PremiumFloatingCard;
