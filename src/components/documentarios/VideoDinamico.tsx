import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipForward, RotateCcw, Sparkles, Loader2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import QuestaoOverlay from "./QuestaoOverlay";

interface QuestaoDinamica {
  id: string;
  timestamp: number;
  pergunta: string;
  alternativas: string[];
  respostaCorreta: number;
  explicacao: string;
}

interface VideoDinamicoProps {
  videoId: string;
  questoesDinamicas: QuestaoDinamica[] | null;
  onGenerate: () => void;
  isLoading: boolean;
  hasTranscricao: boolean;
}

const VideoDinamico = ({ 
  videoId, 
  questoesDinamicas, 
  onGenerate, 
  isLoading, 
  hasTranscricao 
}: VideoDinamicoProps) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuestaoDinamica | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [score, setScore] = useState({ corretas: 0, total: 0 });
  const [isGameMode, setIsGameMode] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Inicializar player
  useEffect(() => {
    if (!isGameMode || !videoId) return;

    const initPlayer = () => {
      if (!(window as any).YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const createPlayer = () => {
        if (playerRef.current) {
          playerRef.current.destroy();
        }

        playerRef.current = new (window as any).YT.Player("dynamic-player", {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            mute: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            cc_load_policy: 0,
            iv_load_policy: 3,
          },
          events: {
            onReady: () => {
              setIsPlayerReady(true);
              playerRef.current?.playVideo();
            },
            onStateChange: (event: any) => {
              setIsPlaying(event.data === 1);
            },
          },
        });
      };

      if ((window as any).YT && (window as any).YT.Player) {
        createPlayer();
      } else {
        (window as any).onYouTubeIframeAPIReady = createPlayer;
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setIsPlayerReady(false);
    };
  }, [isGameMode, videoId]);

  // Monitorar tempo e verificar questões
  useEffect(() => {
    if (!isGameMode || !isPlaying || !questoesDinamicas || !isPlayerReady) return;

    const interval = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);

        // Verificar se há questão para este momento
        const question = questoesDinamicas.find(q => {
          const timeDiff = Math.abs(q.timestamp - time);
          return timeDiff < 2 && !answeredQuestions.has(q.id);
        });

        if (question) {
          playerRef.current.pauseVideo();
          setCurrentQuestion(question);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isGameMode, isPlaying, questoesDinamicas, answeredQuestions, isPlayerReady]);

  const handleAnswer = useCallback((questionId: string, isCorrect: boolean) => {
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
    setScore(prev => ({
      corretas: prev.corretas + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  }, []);

  const handleCloseQuestion = useCallback(() => {
    setCurrentQuestion(null);
    if (playerRef.current?.playVideo) {
      playerRef.current.playVideo();
    }
  }, []);

  const handleReset = useCallback(() => {
    setAnsweredQuestions(new Set());
    setScore({ corretas: 0, total: 0 });
    setCurrentQuestion(null);
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
    }
  }, []);

  const handleSkipQuestion = useCallback(() => {
    if (currentQuestion) {
      setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]));
    }
    handleCloseQuestion();
  }, [currentQuestion, handleCloseQuestion]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">
          Gerando questões dinâmicas...
        </p>
      </div>
    );
  }

  if (!questoesDinamicas || questoesDinamicas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Gamepad2 className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground mb-2">
          Modo Vídeo Dinâmico
        </p>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">
          {hasTranscricao 
            ? "Questões aparecem em momentos-chave do vídeo. Responda para continuar assistindo!"
            : "É necessário ter a transcrição para gerar o modo dinâmico"}
        </p>
        {hasTranscricao && (
          <Button onClick={onGenerate} disabled={isLoading} size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar Questões Dinâmicas
          </Button>
        )}
      </div>
    );
  }

  if (!isGameMode) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Gamepad2 className="h-12 w-12 text-primary mb-4" />
        <p className="text-sm font-medium text-foreground mb-2">
          Modo Vídeo Dinâmico
        </p>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">
          {questoesDinamicas.length} questões aparecerão em momentos-chave. 
          O vídeo pausa para você responder!
        </p>
        <Button onClick={() => setIsGameMode(true)} className="gap-2">
          <Play className="h-4 w-4" />
          Iniciar Modo Dinâmico
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            {answeredQuestions.size}/{questoesDinamicas.length} questões
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-500">{score.corretas} ✓</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{score.total}</span>
        </div>
      </div>

      {/* Player container */}
      <div ref={containerRef} className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <div id="dynamic-player" className="absolute inset-0 w-full h-full" />
        
        {/* Overlay de questão */}
        {currentQuestion && (
          <QuestaoOverlay
            questao={currentQuestion}
            onAnswer={handleAnswer}
            onClose={handleCloseQuestion}
            onSkip={handleSkipQuestion}
          />
        )}
      </div>

      {/* Timeline com marcadores */}
      <div className="relative h-2 bg-muted rounded-full overflow-visible">
        {questoesDinamicas.map((q, index) => {
          const position = (q.timestamp / (playerRef.current?.getDuration?.() || 3600)) * 100;
          const isAnswered = answeredQuestions.has(q.id);
          
          return (
            <div
              key={q.id}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all cursor-pointer",
                isAnswered ? "bg-green-500" : "bg-primary animate-pulse"
              )}
              style={{ left: `${Math.min(position, 97)}%` }}
              title={`Questão ${index + 1} - ${formatTime(q.timestamp)}`}
            />
          );
        })}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsGameMode(false);
            handleReset();
          }}
        >
          Sair do Modo
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            size="icon"
            onClick={() => {
              if (isPlaying) {
                playerRef.current?.pauseVideo();
              } else {
                playerRef.current?.playVideo();
              }
            }}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoDinamico;
