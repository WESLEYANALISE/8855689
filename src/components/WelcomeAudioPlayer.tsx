import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, X } from 'lucide-react';

/**
 * Componente que toca o áudio de boas-vindas personalizado
 * apenas na primeira vez que o usuário entra na home após o cadastro.
 */
export const WelcomeAudioPlayer = () => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userName, setUserName] = useState('');
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!user || hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const localStorageKey = `welcome_audio_played_${user.id}`;
    
    // Verificar localStorage primeiro (fallback rápido)
    if (localStorage.getItem(localStorageKey) === 'true') {
      return;
    }

    const checkAndPlayWelcome = async () => {
      try {
        // Buscar perfil do usuário
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('nome, audio_boas_vindas, audio_boas_vindas_ouvido')
          .eq('id', user.id)
          .single();

        if (error || !profile) return;

        // Já ouviu o áudio - marcar no localStorage também
        if (profile.audio_boas_vindas_ouvido) {
          localStorage.setItem(localStorageKey, 'true');
          return;
        }

        setUserName(profile.nome?.split(' ')[0] || 'usuário');

        // Se já tem áudio, tocar
        if (profile.audio_boas_vindas) {
          playAudio(profile.audio_boas_vindas);
          return;
        }

        // Se não tem áudio, gerar
        if (profile.nome) {
          const { data: audioData, error: audioError } = await supabase.functions.invoke(
            'gerar-audio-boas-vindas',
            { body: { nome: profile.nome, user_id: user.id } }
          );

          if (!audioError && audioData?.url_audio) {
            playAudio(audioData.url_audio);
          }
        }
      } catch (err) {
        console.error('[WelcomeAudio] Erro:', err);
      }
    };

    // Aguardar um pouco para não atrapalhar o carregamento inicial
    const timeout = setTimeout(checkAndPlayWelcome, 2000);
    return () => clearTimeout(timeout);
  }, [user]);

  const playAudio = async (audioUrl: string) => {
    if (!audioRef.current || !user) return;
    
    // Marcar no localStorage IMEDIATAMENTE ao mostrar
    localStorage.setItem(`welcome_audio_played_${user.id}`, 'true');
    
    try {
      audioRef.current.src = audioUrl;
      setShowBanner(true);
      
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('[WelcomeAudio] Erro ao reproduzir:', err);
      // Fallback: mostrar banner mesmo sem áudio
      setShowBanner(true);
    }
  };

  const handleAudioEnded = async () => {
    setIsPlaying(false);
    
    // Marcar como ouvido
    if (user) {
      await supabase
        .from('profiles')
        .update({ audio_boas_vindas_ouvido: true })
        .eq('id', user.id);
    }

    // Esconder banner após 2s
    setTimeout(() => setShowBanner(false), 2000);
  };

  const handleClose = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setShowBanner(false);
    setIsPlaying(false);

    // Marcar como ouvido em ambos os lugares
    if (user) {
      localStorage.setItem(`welcome_audio_played_${user.id}`, 'true');
      await supabase
        .from('profiles')
        .update({ audio_boas_vindas_ouvido: true })
        .eq('id', user.id);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={() => setIsPlaying(false)}
      />

      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-lg"
          >
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <Volume2 className="w-5 h-5" />
                </motion.div>
                <div>
                  <p className="font-bold text-sm">
                    Bem-vindo, {userName}! 🎉
                  </p>
                  <p className="text-xs text-white/80">
                    {isPlaying ? 'Ouvindo mensagem de boas-vindas...' : 'Seja bem-vindo ao Juridiquê!'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
