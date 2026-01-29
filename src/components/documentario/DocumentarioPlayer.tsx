import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Cena {
  ordem: number;
  titulo: string;
  texto_narrado: string;
  url_audio?: string;
  imagem_url: string;
  imagem_descricao: string;
  duracao?: number;
}

interface DocumentarioPlayerProps {
  cenas: Cena[];
  ministroNome: string;
  onClose?: () => void;
}

export const DocumentarioPlayer = ({ cenas, ministroNome, onClose }: DocumentarioPlayerProps) => {
  const [cenaAtual, setCenaAtual] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const cena = cenas[cenaAtual];
  const totalDuracao = cenas.reduce((acc, c) => acc + (c.duracao || 30), 0);
  
  // Calcular tempo decorrido até a cena atual
  const tempoAteCenaAtual = cenas.slice(0, cenaAtual).reduce((acc, c) => acc + (c.duracao || 30), 0);

  // Criar elemento de áudio quando a cena muda
  useEffect(() => {
    if (cena?.url_audio) {
      const audio = new Audio(cena.url_audio);
      audio.muted = isMuted;
      audioRef.current = audio;

      audio.addEventListener('ended', handleCenaEnded);
      audio.addEventListener('timeupdate', handleTimeUpdate);

      if (isPlaying) {
        audio.play().catch(console.error);
      }

      return () => {
        audio.pause();
        audio.removeEventListener('ended', handleCenaEnded);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [cenaAtual, cena?.url_audio]);

  // Atualizar mute do áudio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current || !cena) return;
    
    const cenaDuracao = cena.duracao || 30;
    const cenaProgress = audioRef.current.currentTime / cenaDuracao;
    const totalProgress = (tempoAteCenaAtual + audioRef.current.currentTime) / totalDuracao;
    
    setProgress(totalProgress * 100);
  }, [cena, tempoAteCenaAtual, totalDuracao]);

  const handleCenaEnded = useCallback(() => {
    if (cenaAtual < cenas.length - 1) {
      // Transição suave para próxima cena
      setTransitioning(true);
      setTimeout(() => {
        setCenaAtual(prev => prev + 1);
        setTransitioning(false);
      }, 500);
    } else {
      // Documentário terminou
      setIsPlaying(false);
      setProgress(100);
    }
  }, [cenaAtual, cenas.length]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const goToCena = useCallback((index: number) => {
    if (index >= 0 && index < cenas.length) {
      audioRef.current?.pause();
      setTransitioning(true);
      setTimeout(() => {
        setCenaAtual(index);
        setTransitioning(false);
        if (isPlaying) {
          setTimeout(() => {
            audioRef.current?.play().catch(console.error);
          }, 100);
        }
      }, 300);
    }
  }, [cenas.length, isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    const targetTime = (value[0] / 100) * totalDuracao;
    let accumulated = 0;
    
    for (let i = 0; i < cenas.length; i++) {
      const cenaDuracao = cenas[i].duracao || 30;
      if (accumulated + cenaDuracao >= targetTime) {
        const tempoNaCena = targetTime - accumulated;
        setCenaAtual(i);
        if (audioRef.current) {
          audioRef.current.currentTime = tempoNaCena;
        }
        setProgress(value[0]);
        break;
      }
      accumulated += cenaDuracao;
    }
  }, [cenas, totalDuracao]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(console.error);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(console.error);
    }
  }, []);

  // Auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = (progress / 100) * totalDuracao;

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Imagem de fundo */}
      <div className="absolute inset-0">
        <img
          src={cena?.imagem_url || '/placeholder.svg'}
          alt={cena?.imagem_descricao}
          className={cn(
            "w-full h-full object-cover transition-all duration-700",
            transitioning ? "opacity-0 scale-105" : "opacity-100 scale-100",
            !imageLoaded && "blur-sm"
          )}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        
        {/* Gradiente para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      </div>

      {/* Título do ministro */}
      <div className={cn(
        "absolute top-4 left-4 right-4 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <h2 className="text-white text-lg md:text-xl font-bold drop-shadow-lg">
          {ministroNome}
        </h2>
        <p className="text-white/80 text-sm drop-shadow">
          {cena?.titulo}
        </p>
      </div>

      {/* Legenda/Narração */}
      <div className={cn(
        "absolute bottom-24 left-4 right-4 md:left-8 md:right-8 transition-all duration-300",
        transitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      )}>
        <p className="text-white text-sm md:text-base lg:text-lg text-center px-4 py-2 bg-black/60 rounded-lg backdrop-blur-sm leading-relaxed">
          {cena?.texto_narrado?.substring(0, 200)}
          {(cena?.texto_narrado?.length || 0) > 200 && '...'}
        </p>
      </div>

      {/* Indicador de cena */}
      <div className={cn(
        "absolute top-4 right-4 flex gap-1 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        {cenas.map((_, i) => (
          <button
            key={i}
            onClick={() => goToCena(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              i === cenaAtual ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"
            )}
          />
        ))}
      </div>

      {/* Controles */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-4 transition-all duration-300",
        showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        {/* Barra de progresso */}
        <div className="mb-3">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        {/* Botões de controle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Cena anterior */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goToCena(cenaAtual - 1)}
              disabled={cenaAtual === 0}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-white/20 h-10 w-10"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            {/* Próxima cena */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goToCena(cenaAtual + 1)}
              disabled={cenaAtual === cenas.length - 1}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            {/* Volume */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            {/* Tempo */}
            <span className="text-white text-xs tabular-nums">
              {formatTime(currentTime)} / {formatTime(totalDuracao)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Indicador de cena */}
            <span className="text-white/60 text-xs">
              Cena {cenaAtual + 1} de {cenas.length}
            </span>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Play button grande quando pausado */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
            <Play className="h-8 w-8 md:h-10 md:w-10 text-black ml-1" />
          </div>
        </button>
      )}
    </div>
  );
};

export default DocumentarioPlayer;
