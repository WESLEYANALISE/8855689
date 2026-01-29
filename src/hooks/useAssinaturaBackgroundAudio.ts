import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook que reproduz o áudio de fundo da página de assinatura.
 * 
 * - Volume baixo (15%) para não sobrepor a narração
 * - Loop infinito
 * - Para imediatamente ao sair da página ou quando enabled=false
 * - Expõe função stopAudio para parar manualmente (ex: pagamento aprovado)
 */
export function useAssinaturaBackgroundAudio(enabled: boolean = true) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Função para parar o áudio imediatamente
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Se desabilitado, parar e não criar áudio
    if (!enabled) {
      stopAudio();
      return;
    }

    // Criar e configurar áudio
    const audio = new Audio('/audio/assinatura-fundo.mp3');
    audio.loop = true;
    audio.volume = 0.15;
    audio.preload = 'auto';
    audioRef.current = audio;

    // Tentar reproduzir automaticamente
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Se bloqueado, reproduzir ao primeiro clique/toque
        const handleInteraction = () => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        };
        document.addEventListener('click', handleInteraction, { once: true });
        document.addEventListener('touchstart', handleInteraction, { once: true });
      });
    }

    // Cleanup: parar áudio IMEDIATAMENTE ao sair da página
    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [enabled, stopAudio]);

  return { audioRef, stopAudio };
}
