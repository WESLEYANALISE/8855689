import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Video, Loader2, Sparkles, BookOpen, HelpCircle, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReactCardFlip from "react-card-flip";
import VideoProgressBar from "@/components/videoaulas/VideoProgressBar";
import ContinueWatchingModal from "@/components/videoaulas/ContinueWatchingModal";
import { useVideoProgress } from "@/hooks/useVideoProgress";

interface VideoaulaArea {
  id: number;
  titulo: string;
  area: string;
  link: string;
  thumb: string | null;
  tempo: string | null;
  sobre_aula?: string | null;
  flashcards?: any[] | null;
  questoes?: any[] | null;
}

// Extrai ID do vídeo do YouTube
const extractVideoId = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : '';
};

// Função para simplificar nome da área
const simplifyAreaName = (areaName: string): string => {
  const prefixesToRemove = ['Direito ', 'Legislação '];
  for (const prefix of prefixesToRemove) {
    if (areaName.startsWith(prefix)) {
      return areaName.replace(prefix, '');
    }
  }
  return areaName;
};

const VideoaulasAreaVideoView = () => {
  const navigate = useNavigate();
  const { area, id } = useParams();
  const decodedArea = decodeURIComponent(area || "");
  const videoId = parseInt(id || "0");
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("sobre");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const seekToTimeRef = useRef<number | null>(null);

  // Buscar vídeo atual
  const { data: video, isLoading } = useQuery({
    queryKey: ["videoaula-area-view", videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO" as any)
        .select("*")
        .eq("id", videoId)
        .single();
      
      if (error) throw error;
      return data as unknown as VideoaulaArea;
    },
    enabled: !!videoId,
  });

  // Buscar lista para navegação
  const { data: allVideos } = useQuery({
    queryKey: ["videoaulas-area-nav", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO" as any)
        .select("id, titulo, thumb, link")
        .ilike("area", `%${decodedArea}%`)
        .order("titulo", { ascending: true });
      
      if (error) throw error;
      return data as unknown as { id: number; titulo: string; thumb: string | null; link: string }[];
    },
    enabled: !!decodedArea,
  });

  const youtubeVideoId = video ? extractVideoId(video.link) : "";

  // Hook de progresso
  const {
    progress,
    showContinueModal,
    dismissContinueModal,
    saveProgress,
    startAutoSave,
    stopAutoSave,
  } = useVideoProgress({
    tabela: "VIDEO AULAS-NOVO",
    registroId: String(videoId),
    videoId: youtubeVideoId,
    enabled: !!video,
  });

  // Navegação
  const currentIndex = allVideos?.findIndex(v => v.id === videoId) ?? -1;
  const prevVideo = currentIndex > 0 ? allVideos?.[currentIndex - 1] : null;
  const nextVideo = currentIndex < (allVideos?.length || 0) - 1 ? allVideos?.[currentIndex + 1] : null;

  // YouTube API callbacks
  const getPlayerTime = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      return {
        current: playerRef.current.getCurrentTime() || 0,
        duration: playerRef.current.getDuration() || 0,
      };
    }
    return null;
  }, []);

  // Iniciar vídeo
  const handlePlayClick = useCallback((seekTo?: number) => {
    if (seekTo !== undefined) {
      seekToTimeRef.current = seekTo;
    }
    setIsPlaying(true);
  }, []);

  // Handler para continuar de onde parou
  const handleContinue = useCallback(() => {
    if (progress?.tempo_atual) {
      handlePlayClick(progress.tempo_atual);
    } else {
      handlePlayClick();
    }
  }, [progress, handlePlayClick]);

  // Handler para começar do início
  const handleStartOver = useCallback(() => {
    handlePlayClick(0);
  }, [handlePlayClick]);

  // Configurar YouTube player quando iframe carregar
  useEffect(() => {
    if (!isPlaying || !video) return;

    // Carregar YouTube API se não estiver carregada
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!iframeRef.current) return;
      
      playerRef.current = new (window as any).YT.Player(iframeRef.current, {
        events: {
          onReady: (event: any) => {
            // Seek se necessário
            if (seekToTimeRef.current !== null && seekToTimeRef.current > 0) {
              event.target.seekTo(seekToTimeRef.current, true);
              seekToTimeRef.current = null;
            }
            
            // Iniciar auto-save
            startAutoSave(getPlayerTime);
            
            // Atualizar tempo periodicamente para a barra de progresso
            const updateTime = setInterval(() => {
              if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                setCurrentTime(playerRef.current.getCurrentTime() || 0);
                setDuration(playerRef.current.getDuration() || 0);
              }
            }, 1000);
            
            return () => clearInterval(updateTime);
          },
          onStateChange: (event: any) => {
            // Quando o vídeo pausar ou terminar, salvar progresso
            if (event.data === (window as any).YT.PlayerState.PAUSED || 
                event.data === (window as any).YT.PlayerState.ENDED) {
              const time = getPlayerTime();
              if (time) {
                saveProgress(time.current, time.duration, true);
              }
            }
          }
        }
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      stopAutoSave();
    };
  }, [isPlaying, video, startAutoSave, stopAutoSave, getPlayerTime, saveProgress]);

  // Reset quando muda de vídeo
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    seekToTimeRef.current = null;
    playerRef.current = null;
  }, [videoId]);

  // Mutation para gerar conteúdo
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!video) throw new Error("Vídeo não encontrado");
      
      const { data, error } = await supabase.functions.invoke("processar-videoaula-oab", {
        body: {
          videoId: youtubeVideoId,
          titulo: video.titulo,
          tabela: "VIDEO AULAS-NOVO",
          id: video.id,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Conteúdo gerado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["videoaula-area-view", videoId] });
    },
    onError: (error) => {
      console.error("Erro ao gerar conteúdo:", error);
      toast.error("Erro ao gerar conteúdo. Tente novamente.");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Video className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Videoaula não encontrada</p>
          <Button
            variant="outline"
            onClick={() => navigate(`/videoaulas/areas/${encodeURIComponent(decodedArea)}`)}
            className="mt-4"
          >
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-red-500/5 pb-20">
      {/* Modal Continuar de Onde Parou */}
      <ContinueWatchingModal
        isOpen={showContinueModal && !isPlaying}
        onClose={dismissContinueModal}
        onContinue={handleContinue}
        onStartOver={handleStartOver}
        savedTime={progress?.tempo_atual || 0}
        percentage={progress?.percentual || 0}
      />

      {/* Header com Voltar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <button 
            onClick={() => navigate(`/videoaulas/areas/${encodeURIComponent(decodedArea)}`)}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>
      </div>

      {/* Header do Vídeo */}
      <div className="pt-4 pb-2 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-500/60 flex items-center justify-center shadow-lg flex-shrink-0">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold leading-snug">{video.titulo}</h1>
                {video.tempo && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {video.tempo}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Player */}
      <div className="px-4 mb-2">
        <div className="max-w-lg mx-auto">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            {isPlaying ? (
              <iframe
                ref={iframeRef}
                id="youtube-player"
                src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&autoplay=1&enablejsapi=1&origin=${window.location.origin}`}
                title={video.titulo}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                onClick={() => handlePlayClick(progress?.tempo_atual)}
                className="absolute inset-0 w-full h-full group cursor-pointer"
              >
                {/* Thumbnail */}
                <img
                  src={video.thumb || `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`}
                  alt={video.titulo}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
                  }}
                />
                {/* Overlay escuro */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                {/* Botão Play */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-12 bg-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-700 group-hover:scale-110 transition-all shadow-lg">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Progresso */}
      {isPlaying && duration > 0 && (
        <div className="px-4 mb-4">
          <div className="max-w-lg mx-auto">
            <VideoProgressBar currentTime={currentTime} duration={duration} />
          </div>
        </div>
      )}

      {/* Tabs de conteúdo */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 mb-4 bg-neutral-800/80">
              <TabsTrigger value="sobre" className="gap-2 data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">
                <BookOpen className="w-4 h-4" />
                Sobre
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="gap-2 data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">
                <Sparkles className="w-4 h-4" />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="questoes" className="gap-2 data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">
                <HelpCircle className="w-4 h-4" />
                Questões
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sobre">
              {video.sobre_aula ? (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <div className="prose prose-sm prose-invert max-w-none 
                    prose-headings:text-red-400 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                    prose-p:text-gray-300 prose-p:leading-relaxed
                    prose-strong:text-white
                    prose-li:text-gray-300 prose-li:marker:text-red-400
                    prose-ul:space-y-1 prose-ol:space-y-1
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{video.sobre_aula}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <EmptyContent 
                  title="Resumo não gerado" 
                  description="Clique no botão abaixo para gerar o resumo desta aula com IA"
                  onGenerate={() => generateMutation.mutate()}
                  isGenerating={generateMutation.isPending}
                />
              )}
            </TabsContent>

            <TabsContent value="flashcards">
              {video.flashcards && video.flashcards.length > 0 ? (
                <FlashcardsView flashcards={video.flashcards} />
              ) : (
                <EmptyContent 
                  title="Flashcards não gerados" 
                  description="Clique no botão abaixo para gerar flashcards desta aula"
                  onGenerate={() => generateMutation.mutate()}
                  isGenerating={generateMutation.isPending}
                />
              )}
            </TabsContent>

            <TabsContent value="questoes">
              {video.questoes && video.questoes.length > 0 ? (
                <QuestoesView questoes={video.questoes} />
              ) : (
                <EmptyContent 
                  title="Questões não geradas" 
                  description="Clique no botão abaixo para gerar questões desta aula"
                  onGenerate={() => generateMutation.mutate()}
                  isGenerating={generateMutation.isPending}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Lista de Aulas (Mini Sidebar) */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Video className="w-4 h-4" />
            Outras Aulas
          </h2>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {allVideos?.map((v: any, index: number) => {
              const vVideoId = extractVideoId(v.link);
              return (
                <button
                  key={v.id}
                  onClick={() => navigate(`/videoaulas/areas/${encodeURIComponent(decodedArea)}/${v.id}`)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all text-sm flex items-center gap-3",
                    v.id === videoId
                      ? "bg-red-600/20 border border-red-500/40"
                      : "bg-neutral-800/50 hover:bg-neutral-700/50 border border-transparent"
                  )}
                >
                  <span className={cn(
                    "text-xs font-mono",
                    v.id === videoId ? "text-red-400" : "text-muted-foreground"
                  )}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={cn(
                    "flex-1 line-clamp-1",
                    v.id === videoId ? "text-red-400 font-medium" : "text-foreground"
                  )}>
                    {v.titulo}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para estado vazio
const EmptyContent = ({ 
  title, 
  description, 
  onGenerate, 
  isGenerating 
}: { 
  title: string; 
  description: string; 
  onGenerate: () => void; 
  isGenerating: boolean;
}) => (
  <div className="bg-card rounded-xl p-6 border border-border text-center">
    <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/30 mb-4" />
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground mb-4">{description}</p>
    <Button 
      onClick={onGenerate} 
      disabled={isGenerating}
      className="bg-red-600 hover:bg-red-700"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Gerar com IA
        </>
      )}
    </Button>
  </div>
);

// Componente de Flashcards
const FlashcardsView = ({ flashcards }: { flashcards: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const current = flashcards[currentIndex];

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} de {flashcards.length}
        </span>
      </div>

      <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
        <div
          onClick={() => setIsFlipped(true)}
          className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 min-h-[200px] flex items-center justify-center cursor-pointer shadow-lg"
        >
          <p className="text-white text-center text-lg font-medium">
            {current?.pergunta || current?.frente}
          </p>
        </div>

        <div
          onClick={() => setIsFlipped(false)}
          className="bg-card rounded-xl p-6 min-h-[200px] flex items-center justify-center cursor-pointer border border-border shadow-lg"
        >
          <p className="text-foreground text-center">
            {current?.resposta || current?.verso}
          </p>
        </div>
      </ReactCardFlip>

      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex(Math.max(0, currentIndex - 1));
          }}
          disabled={currentIndex === 0}
        >
          Anterior
        </Button>
        <Button
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex(Math.min(flashcards.length - 1, currentIndex + 1));
          }}
          disabled={currentIndex === flashcards.length - 1}
          className="bg-red-600 hover:bg-red-700"
        >
          Próximo
        </Button>
      </div>
    </div>
  );
};

// Componente de Questões
const QuestoesView = ({ questoes }: { questoes: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const current = questoes[currentIndex];
  const alternatives = current?.alternativas || [];
  const correctAnswer = current?.resposta_correta || current?.correta;

  const handleSelectAnswer = (alt: string) => {
    if (showResult) return;
    setSelectedAnswer(alt);
    setShowResult(true);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentIndex(Math.min(questoes.length - 1, currentIndex + 1));
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <span className="text-sm text-muted-foreground">
          Questão {currentIndex + 1} de {questoes.length}
        </span>
      </div>

      <div className="bg-card rounded-xl p-5 border border-border">
        <p className="font-medium mb-4">{current?.enunciado || current?.pergunta}</p>

        <div className="space-y-2">
          {alternatives.map((alt: any, idx: number) => {
            const letter = String.fromCharCode(65 + idx);
            const altText = typeof alt === 'string' ? alt : alt?.texto || alt?.alternativa;
            const isCorrect = letter === correctAnswer || altText === correctAnswer;
            const isSelected = selectedAnswer === letter;

            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(letter)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  showResult && isCorrect
                    ? "bg-green-500/20 border-green-500"
                    : showResult && isSelected && !isCorrect
                      ? "bg-red-500/20 border-red-500"
                      : isSelected
                        ? "bg-red-500/20 border-red-500"
                        : "bg-secondary/50 border-transparent hover:border-red-500/30"
                )}
              >
                <span className="font-medium mr-2">{letter})</span>
                {altText}
              </button>
            );
          })}
        </div>
      </div>

      {showResult && (
        <Button
          onClick={handleNext}
          disabled={currentIndex === questoes.length - 1}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          {currentIndex === questoes.length - 1 ? "Finalizar" : "Próxima Questão"}
        </Button>
      )}
    </div>
  );
};

export default VideoaulasAreaVideoView;
