import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface AmbientSound {
  id: number;
  numero: number;
  link: string;
}

interface AmbientSoundContextType {
  currentSound: AmbientSound | null;
  isPlaying: boolean;
  volume: number;
  setCurrentSound: (sound: AmbientSound | null) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  stopSound: () => void;
}

const AmbientSoundContext = createContext<AmbientSoundContextType | undefined>(undefined);

export const AmbientSoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSound, setCurrentSound] = useState<AmbientSound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;

    if (currentSound && currentSound.link) {
      audio.src = currentSound.link;
      audio.volume = volume;
      
      // Toca automaticamente quando um novo som é selecionado
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('Error playing ambient sound:', error);
          setIsPlaying(false);
        });
      }
    }

    return () => {
      audio.pause();
    };
  }, [currentSound, volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Error playing ambient sound:', error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (currentSound) {
      setIsPlaying(!isPlaying);
    }
  };

  const stopSound = () => {
    setIsPlaying(false);
    setCurrentSound(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <AmbientSoundContext.Provider
      value={{
        currentSound,
        isPlaying,
        volume,
        setCurrentSound,
        togglePlay,
        setVolume,
        stopSound,
      }}
    >
      {children}
    </AmbientSoundContext.Provider>
  );
};

export const useAmbientSound = () => {
  const context = useContext(AmbientSoundContext);
  if (context === undefined) {
    throw new Error('useAmbientSound must be used within an AmbientSoundProvider');
  }
  return context;
};
