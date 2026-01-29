import { createContext, useContext, useRef, useEffect, useCallback, ReactNode } from "react";

interface NarrationPlayerContextType {
  currentNarrationRef: React.MutableRefObject<HTMLAudioElement | null>;
  playNarration: (audioElement: HTMLAudioElement) => Promise<void>;
  stopNarration: () => void;
}

const NarrationPlayerContext = createContext<NarrationPlayerContextType | undefined>(undefined);

const BACKGROUND_VOLUME = 0.05; // 5% do volume para não atrapalhar a narração

export const NarrationPlayerProvider = ({ children }: { children: ReactNode }) => {
  const currentNarrationRef = useRef<HTMLAudioElement | null>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const eventHandlersRef = useRef<{
    element: HTMLAudioElement | null;
    ended: (() => void) | null;
    pause: (() => void) | null;
    play: (() => void) | null;
  }>({ element: null, ended: null, pause: null, play: null });

  // Lazy load: inicializa o áudio de fundo apenas quando necessário
  const getOrCreateBackgroundAudio = useCallback(() => {
    if (!backgroundAudioRef.current) {
      const audio = new Audio('/audio/fundo.mp3');
      audio.loop = true;
      audio.volume = BACKGROUND_VOLUME;
      audio.preload = 'auto';
      backgroundAudioRef.current = audio;
    }
    return backgroundAudioRef.current;
  }, []);

  const startBackgroundAudio = useCallback(() => {
    const audio = getOrCreateBackgroundAudio();
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.log('Background audio blocked:', err.message);
    });
  }, [getOrCreateBackgroundAudio]);

  const stopBackgroundAudio = useCallback(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
    }
  }, []);

  const pauseBackgroundAudio = useCallback(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
    }
  }, []);

  const resumeBackgroundAudio = useCallback(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.play().catch(() => {});
    }
  }, []);

  // Limpar handlers antigos de um elemento
  const cleanupEventHandlers = useCallback(() => {
    const { element, ended, pause, play } = eventHandlersRef.current;
    if (element) {
      if (ended) element.removeEventListener('ended', ended);
      if (pause) element.removeEventListener('pause', pause);
      if (play) element.removeEventListener('play', play);
    }
    eventHandlersRef.current = { element: null, ended: null, pause: null, play: null };
  }, []);

  const playNarration = useCallback(async (audioElement: HTMLAudioElement) => {
    // Pausar áudio anterior se existir
    if (currentNarrationRef.current && currentNarrationRef.current !== audioElement) {
      currentNarrationRef.current.pause();
      currentNarrationRef.current.currentTime = 0;
    }

    // Limpar handlers antigos
    cleanupEventHandlers();

    // Atualizar referência
    currentNarrationRef.current = audioElement;

    // Criar novos handlers
    const handleEnded = () => {
      stopBackgroundAudio();
    };

    const handlePause = () => {
      pauseBackgroundAudio();
    };

    const handlePlay = () => {
      resumeBackgroundAudio();
    };

    // Armazenar referências dos handlers
    eventHandlersRef.current = {
      element: audioElement,
      ended: handleEnded,
      pause: handlePause,
      play: handlePlay,
    };

    // Adicionar listeners
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('play', handlePlay);

    // Iniciar fundo e narração
    startBackgroundAudio();
    await audioElement.play();
  }, [cleanupEventHandlers, startBackgroundAudio, stopBackgroundAudio, pauseBackgroundAudio, resumeBackgroundAudio]);

  const stopNarration = useCallback(() => {
    cleanupEventHandlers();
    if (currentNarrationRef.current) {
      currentNarrationRef.current.pause();
      currentNarrationRef.current.currentTime = 0;
      currentNarrationRef.current = null;
    }
    stopBackgroundAudio();
  }, [cleanupEventHandlers, stopBackgroundAudio]);

  return (
    <NarrationPlayerContext.Provider value={{ currentNarrationRef, playNarration, stopNarration }}>
      {children}
    </NarrationPlayerContext.Provider>
  );
};

export const useNarrationPlayer = () => {
  const context = useContext(NarrationPlayerContext);
  if (!context) {
    throw new Error("useNarrationPlayer must be used within NarrationPlayerProvider");
  }
  return context;
};
