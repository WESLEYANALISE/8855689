import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Video, Loader2, ChevronLeft, ChevronRight, Sparkles, BookOpen, HelpCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDeviceType } from "@/hooks/use-device-type";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

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

const VideoaulasOABViewPrimeiraFase = () => {
  const navigate = useNavigate();
  const { area, id } = useParams();
  const decodedArea = decodeURIComponent(area || "");
  const videoId = parseInt(id || "0");
  const { isDesktop } = useDeviceType();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("sobre");

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
        .select("id, titulo, ordem")
        .eq("area", decodedArea)
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!decodedArea,
  });

  // Navegação
  const currentIndex = allVideos?.findIndex(v => v.id === videoId) ?? -1;
  const prevVideo = currentIndex > 0 ? allVideos?.[currentIndex - 1] : null;
  const nextVideo = currentIndex < (allVideos?.length || 0) - 1 ? allVideos?.[currentIndex + 1] : null;

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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar desktop */}
      {isDesktop && (
        <VideoSidebar 
          area={decodedArea} 
          currentId={videoId} 
          videos={allVideos || []} 
        />
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/videoaulas/oab-1fase/${encodeURIComponent(decodedArea)}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">
                {video.titulo}
              </h1>
              <p className="text-xs text-muted-foreground">{decodedArea}</p>
            </div>
          </div>
        </div>

        {/* Player */}
        <div className="w-full aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${video.video_id}?rel=0`}
            title={video.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="sm"
            disabled={!prevVideo}
            onClick={() => prevVideo && navigate(`/videoaulas/oab-1fase/${encodeURIComponent(decodedArea)}/${prevVideo.id}`)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} de {allVideos?.length || 0}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!nextVideo}
            onClick={() => nextVideo && navigate(`/videoaulas/oab-1fase/${encodeURIComponent(decodedArea)}/${nextVideo.id}`)}
          >
            Próxima
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Tabs de conteúdo */}
        <div className="flex-1 p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="sobre" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Sobre
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="questoes" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                Questões
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sobre">
              {video.sobre_aula ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{video.sobre_aula}</ReactMarkdown>
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
                  description="Clique no botão abaixo para gerar questões de revisão"
                  onGenerate={() => generateMutation.mutate()}
                  isGenerating={generateMutation.isPending}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Sidebar de vídeos
const VideoSidebar = ({ area, currentId, videos }: { area: string; currentId: number; videos: any[] }) => {
  const navigate = useNavigate();

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-bold text-foreground">{area}</h2>
        <p className="text-xs text-muted-foreground">{videos.length} aulas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {videos.map((v, index) => (
          <button
            key={v.id}
            onClick={() => navigate(`/videoaulas/oab-1fase/${encodeURIComponent(area)}/${v.id}`)}
            className={cn(
              "w-full text-left p-2 rounded-lg transition-all text-xs",
              v.id === currentId
                ? "bg-red-500/20 border border-red-500/40 text-red-400"
                : "hover:bg-secondary/80 border border-transparent text-foreground"
            )}
          >
            <span className="font-bold mr-2 text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="line-clamp-2">{v.titulo}</span>
          </button>
        ))}
      </div>
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
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Sparkles className="w-12 h-12 text-muted-foreground/30 mb-4" />
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
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

// Flashcards
const FlashcardsView = ({ flashcards }: { flashcards: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = flashcards[currentIndex];

  return (
    <div className="space-y-4">
      <div 
        onClick={() => setFlipped(!flipped)}
        className="cursor-pointer min-h-[200px] bg-gradient-to-br from-red-900/20 to-background border border-red-500/30 rounded-xl p-6 flex items-center justify-center text-center transition-all hover:border-red-500/50"
      >
        <p className="text-lg font-medium">
          {flipped ? card?.resposta || card?.back : card?.pergunta || card?.front}
        </p>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Clique para virar o card
      </p>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={currentIndex === 0}
          onClick={() => { setCurrentIndex(i => i - 1); setFlipped(false); }}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} de {flashcards.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentIndex === flashcards.length - 1}
          onClick={() => { setCurrentIndex(i => i + 1); setFlipped(false); }}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Questões
const QuestoesView = ({ questoes }: { questoes: any[] }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  return (
    <div className="space-y-6">
      {questoes.map((q, index) => (
        <div key={index} className="bg-card border border-border rounded-xl p-4">
          <p className="font-medium mb-3">{q.pergunta || q.enunciado}</p>
          <div className="space-y-2">
            {(q.alternativas || q.opcoes || []).map((alt: any, altIndex: number) => {
              const letra = String.fromCharCode(65 + altIndex);
              const texto = typeof alt === 'string' ? alt : alt.texto;
              const isSelected = answers[index] === letra;
              const isCorrect = showResults && (q.correta === letra || q.resposta_correta === letra);
              const isWrong = showResults && isSelected && !isCorrect;

              return (
                <button
                  key={altIndex}
                  onClick={() => !showResults && setAnswers(prev => ({ ...prev, [index]: letra }))}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all text-sm",
                    isCorrect && "bg-green-500/20 border-green-500",
                    isWrong && "bg-red-500/20 border-red-500",
                    isSelected && !showResults && "bg-red-500/20 border-red-500",
                    !isSelected && !showResults && "border-border hover:border-red-500/50"
                  )}
                  disabled={showResults}
                >
                  <span className="font-bold mr-2">{letra})</span>
                  {texto}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      <Button
        onClick={() => setShowResults(true)}
        disabled={showResults || Object.keys(answers).length !== questoes.length}
        className="w-full bg-red-600 hover:bg-red-700"
      >
        Verificar Respostas
      </Button>
    </div>
  );
};

export default VideoaulasOABViewPrimeiraFase;
