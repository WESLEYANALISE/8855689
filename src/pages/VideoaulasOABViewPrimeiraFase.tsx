import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Video, Loader2, Sparkles, BookOpen, HelpCircle, CheckCircle2, RotateCcw, Lightbulb, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReactCardFlip from "react-card-flip";
import VideoNavigationFooter from "@/components/videoaulas/VideoNavigationFooter";
import VideoProgressBar from "@/components/videoaulas/VideoProgressBar";
import ContinueWatchingModal from "@/components/videoaulas/ContinueWatchingModal";
import { useVideoProgress } from "@/hooks/useVideoProgress";

interface VideoaulaOAB {
  id: number;
  video_id: string;
  area: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  ordem: number;
  transcricao: string | null;
  sobre_aula: string | null;
  flashcards: any[] | null;
  questoes: any[] | null;
}

// Extrai apenas o título limpo da aula (remove prefixos como "Direito X | OAB - " e "CURSO GRATUITO")
const extractCleanTitle = (fullTitle: string): string => {
  // Remove "| CURSO GRATUITO" variações no final
  let title = fullTitle
    .replace(/\s*\|\s*CURSO GRATUITO COMPLETO\s*\|\s*CURSO GRATUITO COMPLETO\s*/gi, '')
    .replace(/\s*\|\s*CURSO GRATUITO COMPLETO\s*/gi, '')
    .replace(/\s*\|\s*CURSO GRATUITO\s*/gi, '')
    .replace(/\s*CURSO GRATUITO COMPLETO\s*/gi, '')
    .replace(/\s*CURSO GRATUITO\s*/gi, '');
  
  // Se tem formato "X | OAB - Y", pega só o Y
  const oabMatch = title.match(/\|\s*OAB\s*-\s*(.+)$/i);
  if (oabMatch) return oabMatch[1].trim();
  
  // Se tem formato "X - Y", pode ser "OAB - Título", pega só depois do último hífen
  const lastDashMatch = title.match(/^[^-]+-\s*(.+)$/);
  if (lastDashMatch && !title.includes('|')) return lastDashMatch[1].trim();
  
  return title.trim();
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

const VideoaulasOABViewPrimeiraFase = () => {
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
    queryKey: ["videoaula-oab-1fase", videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_oab_primeira_fase")
        .select("*")
        .eq("id", videoId)
        .single();
      
      if (error) throw error;
      return data as VideoaulaOAB;
    },
    enabled: !!videoId,
  });

  // Buscar lista para navegação
  const { data: allVideos } = useQuery({
    queryKey: ["videoaulas-oab-1fase-nav", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_oab_primeira_fase")
        .select("id, titulo, ordem, sobre_aula")
        .eq("area", decodedArea)
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!decodedArea,
  });

  // Hook de progresso
  const {
    progress,
    showContinueModal,
    dismissContinueModal,
    saveProgress,
    startAutoSave,
    stopAutoSave,
  } = useVideoProgress({
    tabela: "videoaulas_oab_primeira_fase",
    registroId: String(videoId),
    videoId: video?.video_id || "",
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
          videoId: video.video_id,
          titulo: video.titulo,
          tabela: "videoaulas_oab_primeira_fase",
          id: video.id,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Conteúdo gerado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["videoaula-oab-1fase", videoId] });
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
            onClick={() => navigate(`/videoaulas/oab-1fase/${encodeURIComponent(decodedArea)}`)}
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
            onClick={() => navigate('/videoaulas')}
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
                <h1 className="text-base font-bold leading-snug">{extractCleanTitle(video.titulo)}</h1>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Player - Igual ao VideoaulaInicianteView */}
      <div className="px-4 mb-2">
        <div className="max-w-lg mx-auto">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            {isPlaying ? (
              <iframe
                ref={iframeRef}
                id="youtube-player"
                src={`https://www.youtube.com/embed/${video.video_id}?rel=0&autoplay=1&enablejsapi=1&origin=${window.location.origin}`}
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
                  src={video.thumbnail || `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`}
                  alt={video.titulo}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`;
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
            {allVideos?.map((v, index) => (
              <button
                key={v.id}
                onClick={() => navigate(`/videoaulas/oab-1fase/${encodeURIComponent(decodedArea)}/${v.id}`)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all text-sm flex items-center gap-3",
                  v.id === videoId
                    ? "bg-red-500/20 border border-red-500/40 text-red-400"
                    : "bg-neutral-800/50 hover:bg-neutral-700/50 border border-transparent text-foreground"
                )}
              >
                <span className="font-bold text-muted-foreground w-6 text-center flex-shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 line-clamp-2 leading-snug">{extractCleanTitle(v.titulo)}</span>
                {v.sobre_aula && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rodapé de Navegação Fixo */}
      <VideoNavigationFooter
        currentIndex={currentIndex}
        totalVideos={allVideos?.length || 0}
        hasPrevious={!!prevVideo}
        hasNext={!!nextVideo}
        onPrevious={() => prevVideo && navigate(`/videoaulas/oab-1fase/${encodeURIComponent(decodedArea)}/${prevVideo.id}`)}
        onNext={() => nextVideo && navigate(`/videoaulas/oab-1fase/${encodeURIComponent(decodedArea)}/${nextVideo.id}`)}
      />
    </div>
  );
};

// Componente vazio
const EmptyContent = ({ title, description, onGenerate, isGenerating }: {
  title: string;
  description: string;
  onGenerate: () => void;
  isGenerating: boolean;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-xl border border-border">
    <Sparkles className="w-12 h-12 text-muted-foreground/30 mb-4" />
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-sm px-4">{description}</p>
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

// Flashcards com flip animation
const FlashcardsView = ({ flashcards }: { flashcards: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const card = flashcards[currentIndex];
  const frente = card?.pergunta || card?.front || card?.frente || "";
  const verso = card?.resposta || card?.back || card?.verso || "";
  const exemplo = card?.exemplo || "";

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(i => i + 1), 100);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(i => i - 1), 100);
    }
  };

  const handleReset = () => {
    setIsFlipped(false);
    setCurrentIndex(0);
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Card {currentIndex + 1} de {flashcards.length}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="gap-1.5 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reiniciar
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard with flip */}
      <div className="py-4">
        <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
          {/* Front */}
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full min-h-[200px] bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-red-500/50 transition-colors"
          >
            <p className="text-xs text-red-400 mb-3 font-medium uppercase">Pergunta</p>
            <p className="text-lg font-medium text-foreground leading-relaxed">{frente}</p>
            <p className="text-xs text-muted-foreground mt-4">Toque para ver a resposta</p>
          </button>

          {/* Back */}
          <button
            onClick={() => setIsFlipped(false)}
            className="w-full min-h-[200px] bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 transition-colors"
          >
            <p className="text-xs text-emerald-400 mb-3 font-medium uppercase">Resposta</p>
            <p className="text-base text-foreground leading-relaxed">{verso}</p>
            <p className="text-xs text-muted-foreground mt-4">Toque para voltar à pergunta</p>
          </button>
        </ReactCardFlip>
      </div>

      {/* Exemplo prático */}
      {isFlipped && exemplo && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold text-amber-500">Exemplo Prático</p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{exemplo}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          className="gap-1"
        >
          Próximo
        </Button>
      </div>
    </div>
  );
};

// Questões
const QuestoesView = ({ questoes }: { questoes: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const questao = questoes[currentIndex];
  const pergunta = questao?.pergunta || questao?.enunciado || "";
  const alternativas = questao?.alternativas || [];
  const correta = questao?.correta ?? questao?.resposta_correta ?? 0;
  const explicacao = questao?.explicacao || "";

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questoes.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Questão {currentIndex + 1} de {questoes.length}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="gap-1.5 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reiniciar
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questoes.length) * 100}%` }}
        />
      </div>

      {/* Pergunta */}
      <div className="bg-neutral-800/50 rounded-xl p-4">
        <p className="text-sm text-foreground leading-relaxed">{pergunta}</p>
      </div>

      {/* Alternativas */}
      <div className="space-y-2">
        {alternativas.map((alt: string, index: number) => {
          const isCorrect = index === correta;
          const isSelected = selectedAnswer === index;
          
          let bgClass = "bg-neutral-800/50 hover:bg-neutral-700/50 border-neutral-700";
          if (showResult) {
            if (isCorrect) {
              bgClass = "bg-emerald-500/20 border-emerald-500/50";
            } else if (isSelected && !isCorrect) {
              bgClass = "bg-red-500/20 border-red-500/50";
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
              className={cn(
                "w-full text-left p-3 rounded-xl border transition-all text-sm",
                bgClass
              )}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
              {alt}
            </button>
          );
        })}
      </div>

      {/* Explicação */}
      {showResult && explicacao && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-400 mb-2">Explicação</p>
          <p className="text-sm text-foreground leading-relaxed">{explicacao}</p>
        </div>
      )}

      {/* Navigation */}
      {showResult && (
        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={currentIndex === questoes.length - 1}
            className="bg-red-600 hover:bg-red-700"
          >
            Próxima Questão
          </Button>
        </div>
      )}
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

export default VideoaulasOABViewPrimeiraFase;
