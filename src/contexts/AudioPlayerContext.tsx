import React, { createContext, useContext, useState, useRef, useEffect } from "react";

interface AudioItem {
  id: number;
  titulo: string;
  url_audio: string;
  url_audio_resposta?: string;
  url_audio_exemplo?: string;
  imagem_miniatura: string;
  descricao: string;
  area: string;
  tema: string;
  // Novos campos para conteúdo visual
  tipo?: "audioaula" | "flashcard" | "resumo" | "artigo";
  texto_exemplo?: string;
  url_imagem_exemplo?: string;
  pergunta?: string;
  resposta?: string;
  subtema?: string;
}

export type { AudioItem };

interface AudioPlayerContextType {
  currentAudio: AudioItem | null;
  isPlaying: boolean;
  playlist: AudioItem[];
  currentIndex: number;
  playAudio: (audio: AudioItem) => void;
  pauseAudio: () => void;
  togglePlayPause: () => void;
  closePlayer: () => void;
  setPlaylist: (audios: AudioItem[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAudio, setCurrentAudio] = useState<AudioItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylistState] = useState<AudioItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && currentAudio) {
      console.log('🎵 AudioPlayerContext: Loading audio', {
        title: currentAudio.titulo,
        url: currentAudio.url_audio,
        isPlaying
      });
      
      audioRef.current.src = currentAudio.url_audio;
      audioRef.current.load();
      
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Audio playing successfully');
            })
            .catch(error => {
              console.error('❌ Error playing audio:', error);
              console.error('Audio URL:', currentAudio.url_audio);
              setIsPlaying(false);
            });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentAudio]);

  const playAudio = (audio: AudioItem) => {
    console.log('▶️ PlayAudio called:', audio.titulo);
    
    // Find index in playlist if audio is part of it
    const indexInPlaylist = playlist.findIndex(p => p.id === audio.id);
    if (indexInPlaylist !== -1) {
      setCurrentIndex(indexInPlaylist);
      console.log('📍 Audio found in playlist at index:', indexInPlaylist);
    }
    
    setCurrentAudio(audio);
    setIsPlaying(true);
  };

  const pauseAudio = () => {
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const closePlayer = () => {
    setCurrentAudio(null);
    setIsPlaying(false);
    setPlaylistState([]);
    setCurrentIndex(0);
  };

  const setPlaylist = (audios: AudioItem[]) => {
    setPlaylistState(audios);
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    playAudio(playlist[nextIndex]);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    playAudio(playlist[prevIndex]);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentAudio,
        isPlaying,
        playlist,
        currentIndex,
        playAudio,
        pauseAudio,
        togglePlayPause,
        closePlayer,
        setPlaylist,
        playNext,
        playPrevious,
        audioRef,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
};
