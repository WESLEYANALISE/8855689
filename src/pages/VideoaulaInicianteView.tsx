import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Loader2, Play, Sparkles, ListChecks, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import VideoaulaQuestoes from "@/components/videoaulas/VideoaulaQuestoes";
import StandardPageHeader from "@/components/StandardPageHeader";
import VideoaulaFlashcards from "@/components/videoaulas/VideoaulaFlashcards";
import VideoNavigationFooter from "@/components/videoaulas/VideoNavigationFooter";
import VideoProgressBar from "@/components/videoaulas/VideoProgressBar";
import ContinueWatchingModal from "@/components/videoaulas/ContinueWatchingModal";
import { useVideoProgress } from "@/hooks/useVideoProgress";

interface VideoaulaIniciante {
  id: string;
  video_id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  ordem: number;
  publicado_em: string | null;
  transcricao: string | null;
  sobre_aula: string | null;
  flashcards: any[] | null;
  questoes: any[] | null;
}

const VideoaulaInicianteView = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("sobre");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const seekToTimeRef = useRef<number | null>(null);

  // Buscar a aula atual
  const { data: aula, isLoading } = useQuery({
    queryKey: ["videoaula-iniciante", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_iniciante")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as VideoaulaIniciante;
    },
    enabled: !!id,
  });

  // Buscar total de aulas e navegação
  const { data: allAulas } = useQuery({
    queryKey: ["videoaulas-iniciante-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_iniciante")
        .select("id, titulo, ordem")
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Navegação
  const currentIndex = allAulas?.findIndex(a => a.id === id) ?? -1;
  const prevAula = currentIndex > 0 ? allAulas?.[currentIndex - 1] : null;
  const nextAula = currentIndex < (allAulas?.length || 0) - 1 ? allAulas?.[currentIndex + 1] : null;

  // Hook de progresso
  const {
    progress,
    showContinueModal,
    dismissContinueModal,
    saveProgress,
    startAutoSave,
    stopAutoSave,
  } = useVideoProgress({
    tabela: "videoaulas_iniciante",
    registroId: id || "",
    videoId: aula?.video_id || "",
    enabled: !!aula,
  });

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

  // Configurar YouTube player
  useEffect(() => {
    if (!isPlaying || !aula) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!iframeRef.current) return;
      
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: (event: any) => {
            if (seekToTimeRef.current !== null && seekToTimeRef.current > 0) {
              event.target.seekTo(seekToTimeRef.current, true);
              seekToTimeRef.current = null;
            }
            
            startAutoSave(getPlayerTime);
            
            const updateTime = setInterval(() => {
              if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                setCurrentTime(playerRef.current.getCurrentTime() || 0);
                setDuration(playerRef.current.getDuration() || 0);
              }
            }, 1000);
            
            return () => clearInterval(updateTime);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PAUSED || 
                event.data === window.YT.PlayerState.ENDED) {
              const time = getPlayerTime();
              if (time) {
                saveProgress(time.current, time.duration, true);
              }
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      stopAutoSave();
    };
  }, [isPlaying, aula, startAutoSave, stopAutoSave, getPlayerTime, saveProgress]);

  // Reset quando muda de aula
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    seekToTimeRef.current = null;
    playerRef.current = null;
  }, [id]);

  // Mutation para processar a videoaula
  const processarMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("processar-videoaula-iniciante", {
        body: { videoaulaId: id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Conteúdo gerado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["videoaula-iniciante", id] });
    },
    onError: (error) => {
      console.error("Error processing:", error);
      toast.error("Erro ao gerar conteúdo. Tente novamente.");
    },
  });

  // Ref para evitar geração duplicada
  const hasTriggeredGeneration = useRef(false);

  // Automação: gerar conteúdo automaticamente se não existir
  useEffect(() => {
    if (!aula || isLoading || processarMutation.isPending || hasTriggeredGeneration.current) {
      return;
    }

    const needsContent = !aula.flashcards || aula.flashcards.length === 0 || 
                         !aula.questoes || aula.questoes.length === 0;

    if (needsContent) {
      hasTriggeredGeneration.current = true;
      toast.info("Gerando conteúdo automaticamente...", { duration: 3000 });
      processarMutation.mutate();
    }
  }, [aula, isLoading, processarMutation.isPending]);

  // Reset ref quando muda de aula
  useEffect(() => {
    hasTriggeredGeneration.current = false;
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!aula) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">Aula não encontrada</p>
        <Button onClick={() => navigate("/videoaulas/iniciante")}>
          Voltar para a lista
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Modal Continuar de Onde Parou */}
      <ContinueWatchingModal
        isOpen={showContinueModal && !isPlaying}
        onClose={dismissContinueModal}
        onContinue={handleContinue}
        onStartOver={handleStartOver}
        savedTime={progress?.tempo_atual || 0}
        percentage={progress?.percentual || 0}
      />

      <StandardPageHeader 
        title="Videoaulas" 
        subtitle={`Aula ${aula.ordem}`}
        backPath="/videoaulas/iniciante"
      />

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-4 space-y-4">
          {/* Player de Vídeo / Thumbnail */}
          <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            {isPlaying ? (
              <iframe
                ref={iframeRef}
                id="youtube-player-iniciante"
                src={`https://www.youtube.com/embed/${aula.video_id}?rel=0&autoplay=1&enablejsapi=1&origin=${window.location.origin}`}
                title={aula.titulo}
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
                  src={aula.thumbnail || `https://img.youtube.com/vi/${aula.video_id}/maxresdefault.jpg`}
                  alt={aula.titulo}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${aula.video_id}/hqdefault.jpg`;
                  }}
                />
                {/* Overlay escuro */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                {/* Botão Play do YouTube */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-12 bg-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-700 group-hover:scale-110 transition-all shadow-lg">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Barra de Progresso */}
          {isPlaying && duration > 0 && (
            <div className="max-w-2xl mx-auto">
              <VideoProgressBar currentTime={currentTime} duration={duration} />
            </div>
          )}

          {/* Info da Aula */}
          <div className="bg-neutral-900/80 border border-white/5 rounded-xl p-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {aula.titulo}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Aula {aula.ordem}</span>
            </div>
          </div>

          {/* Tabs: Sobre / Flashcards / Questões */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-neutral-900/80 border border-white/5">
              <TabsTrigger value="sobre" className="gap-1.5 text-xs data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                <BookOpen className="w-3.5 h-3.5" />
                Sobre
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="gap-1.5 text-xs data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                <Layers className="w-3.5 h-3.5" />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="questoes" className="gap-1.5 text-xs data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                <ListChecks className="w-3.5 h-3.5" />
                Questões
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sobre" className="mt-4">
              <div className="bg-neutral-900/80 border border-white/5 rounded-xl p-4 space-y-4">
                {aula.sobre_aula ? (
                  <>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-red-500" />
                      Sobre esta aula
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {aula.sobre_aula}
                    </p>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Sparkles className="w-10 h-10 text-red-500/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      O conteúdo desta aula ainda não foi gerado pela IA.
                    </p>
                    <Button 
                      onClick={() => processarMutation.mutate()}
                      disabled={processarMutation.isPending}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    >
                      {processarMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando conteúdo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar análise da aula
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="flashcards" className="mt-4">
              <div className="bg-neutral-900/80 border border-white/5 rounded-xl p-4">
                {aula.flashcards && aula.flashcards.length > 0 ? (
                  <VideoaulaFlashcards flashcards={aula.flashcards} />
                ) : (
                  <div className="text-center py-6">
                    <Layers className="w-10 h-10 text-red-500/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Os flashcards ainda não foram gerados para esta aula.
                    </p>
                    <Button 
                      onClick={() => processarMutation.mutate()}
                      disabled={processarMutation.isPending}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    >
                      {processarMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando flashcards...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar flashcards
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="questoes" className="mt-4">
              <div className="bg-neutral-900/80 border border-white/5 rounded-xl p-4">
                {aula.questoes && aula.questoes.length > 0 ? (
                  <VideoaulaQuestoes questoes={aula.questoes} />
                ) : (
                  <div className="text-center py-6">
                    <ListChecks className="w-10 h-10 text-red-500/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      As questões ainda não foram geradas para esta aula.
                    </p>
                    {!aula.sobre_aula && (
                      <Button 
                        onClick={() => processarMutation.mutate()}
                        disabled={processarMutation.isPending}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                      >
                        {processarMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Gerando conteúdo...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Gerar questões
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Rodapé de Navegação Fixo */}
      <VideoNavigationFooter
        currentIndex={currentIndex}
        totalVideos={allAulas?.length || 0}
        hasPrevious={!!prevAula}
        hasNext={!!nextAula}
        onPrevious={() => prevAula && navigate(`/videoaulas/iniciante/${prevAula.id}`)}
        onNext={() => nextAula && navigate(`/videoaulas/iniciante/${nextAula.id}`)}
      />
    </div>
  );
};

// Declare YouTube types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default VideoaulaInicianteView;
