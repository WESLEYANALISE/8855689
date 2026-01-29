import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface VideoPlayerProps {
  src: string;
  autoPlay?: boolean;
}

const VideoPlayer = ({ src, autoPlay = false }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Detectar se é um link do YouTube
  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      let videoId = '';
      
      // youtube.com/watch?v=ID
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || '';
      }
      
      // youtu.be/ID
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      }
      
      // Se já é um embed URL, extrair ID
      if (url.includes('/embed/')) {
        const match = url.match(/embed\/([^?&]+)/);
        videoId = match ? match[1] : '';
      }
      
      if (videoId) {
        const params = new URLSearchParams({
          autoplay: autoPlay ? '1' : '0',
          modestbranding: '1',        // Minimiza branding do YouTube
          rel: '0',                    // Vídeos relacionados apenas do mesmo canal
          iv_load_policy: '3',         // Desabilita anotações
          playsinline: '1',            // Reprodução inline no iOS
          enablejsapi: '1',            // Habilita controle via JavaScript
          origin: window.location.origin, // Segurança
          vq: 'hd1080',                // Qualidade máxima (HD 1080p)
        });
        
        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
      }
    } catch (error) {
      console.error('Erro ao processar URL do YouTube:', error);
    }
    return url;
  };

  const isYouTube = isYouTubeUrl(src);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
      setCurrentTime(video.currentTime);
      
      // Parar 3 segundos antes do fim
      if (video.duration - video.currentTime <= 3 && !video.paused) {
        video.pause();
      }
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("play", () => setIsPlaying(true));
    video.addEventListener("pause", () => setIsPlaying(false));

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("play", () => setIsPlaying(true));
      video.removeEventListener("pause", () => setIsPlaying(false));
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Se for YouTube, renderizar iframe (sem controles customizados)
  if (isYouTube) {
    return (
      <div className="relative w-full h-full bg-black rounded-lg">
        <iframe
          src={getYouTubeEmbedUrl(src)}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Para outros vídeos, usar player customizado
  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full rounded-lg"
        autoPlay={autoPlay}
        playsInline
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Overlay com controles - desaparecem completamente quando está tocando */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-all duration-500">
          {/* Botão de play central */}
          <button
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center hover:bg-primary transition-all hover:scale-110 shadow-2xl"
          >
            <Play className="w-10 h-10 text-primary-foreground ml-1" fill="currentColor" />
          </button>
        </div>
      )}

      {/* Controles inferiores - só aparecem quando pausado */}
      {!isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 bg-gradient-to-t from-black/80 to-transparent">
          {/* Barra de progresso customizada */}
          <div
            className="relative h-2 bg-white/20 rounded-full cursor-pointer group/progress"
            onClick={handleProgressClick}
          >
            <div
              className="absolute h-full bg-accent rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, marginLeft: "-8px" }}
            />
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm font-medium bg-accent/20 px-3 py-1 rounded-full">
                {Math.round(progress)}%
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
