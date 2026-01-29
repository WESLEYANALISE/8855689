import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";

interface YouTubePlayerSyncProps {
  videoId: string;
  onTimeUpdate?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onReady?: () => void;
  className?: string;
}

export interface YouTubePlayerRef {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
  isPlaying: () => boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayerSync = forwardRef<YouTubePlayerRef, YouTubePlayerSyncProps>(({
  videoId,
  onTimeUpdate,
  onPlay,
  onPause,
  onReady,
  className = ""
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Carrega a API do YouTube
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    // Carrega o script da API
    if (!document.getElementById('youtube-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId]);

  const initPlayer = useCallback(() => {
    if (!containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: () => {
          setIsPlayerReady(true);
          onReady?.();
          startTimeTracking();
        },
        onStateChange: (event: any) => {
          const state = event.data;
          if (state === window.YT.PlayerState.PLAYING) {
            setPlaying(true);
            onPlay?.();
            startTimeTracking();
          } else if (state === window.YT.PlayerState.PAUSED) {
            setPlaying(false);
            onPause?.();
          } else if (state === window.YT.PlayerState.ENDED) {
            setPlaying(false);
            onPause?.();
          }
        }
      }
    });
  }, [videoId, onReady, onPlay, onPause]);

  const startTimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const time = playerRef.current.getCurrentTime();
          onTimeUpdate?.(time);
        } catch (e) {
          // Player pode não estar pronto
        }
      }
    }, 250); // Atualiza a cada 250ms
  }, [onTimeUpdate]);

  // Expõe métodos via ref
  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(seconds, true);
      }
    },
    play: () => {
      if (playerRef.current && playerRef.current.playVideo) {
        playerRef.current.playVideo();
      }
    },
    pause: () => {
      if (playerRef.current && playerRef.current.pauseVideo) {
        playerRef.current.pauseVideo();
      }
    },
    getCurrentTime: () => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        return playerRef.current.getCurrentTime();
      }
      return 0;
    },
    isPlaying: () => playing
  }), [playing]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
});

YouTubePlayerSync.displayName = "YouTubePlayerSync";
