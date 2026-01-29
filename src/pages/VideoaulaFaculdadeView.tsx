import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, BookOpen, Loader2, Play, Sparkles, ListChecks, Layers, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import VideoaulaQuestoes from "@/components/videoaulas/VideoaulaQuestoes";
import VideoaulaFlashcards from "@/components/videoaulas/VideoaulaFlashcards";

interface VideoaulaFaculdade {
  id: number;
  titulo: string | null;
  link: string | null;
  thumb: string | null;
  tempo: string | null;
  area: string | null;
  sobre_aula: string | null;
  flashcards: any[] | null;
  questoes: any[] | null;
  transcricao: string | null;
}

const VideoaulaFaculdadeView = () => {
  const navigate = useNavigate();
  const { area, videoId } = useParams<{ area: string; videoId: string }>();
  const decodedArea = area ? decodeURIComponent(area) : "";
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("sobre");
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract video ID from YouTube URL
  const extractVideoId = (link: string) => {
    const match = link?.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match?.[1] || null;
  };

  // Buscar a aula atual
  const { data: aula, isLoading } = useQuery({
    queryKey: ["videoaula-faculdade", videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO")
        .select("*")
        .eq("id", parseInt(videoId!))
        .single();
      
      if (error) throw error;
      return data as VideoaulaFaculdade;
    },
    enabled: !!videoId,
  });

  // Buscar todas as aulas da mesma área para navegação
  const { data: todasAulas } = useQuery({
    queryKey: ["videoaulas-faculdade-nav", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO")
        .select("id, titulo")
        .eq("area", decodedArea)
        .order("titulo", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!decodedArea,
  });

  // Encontrar índice atual e aulas anterior/próxima
  const currentIndex = todasAulas?.findIndex(a => a.id === parseInt(videoId!)) ?? -1;
  const aulaAnterior = currentIndex > 0 ? todasAulas?.[currentIndex - 1] : null;
  const aulaProxima = currentIndex >= 0 && currentIndex < (todasAulas?.length ?? 0) - 1 
    ? todasAulas?.[currentIndex + 1] 
    : null;

  // Mutation para processar a videoaula
  const processarMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("processar-videoaula-faculdade", {
        body: { videoaulaId: parseInt(videoId!) },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Conteúdo gerado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["videoaula-faculdade", videoId] });
    },
    onError: (error) => {
      console.error("Error processing:", error);
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

  if (!aula) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">Aula não encontrada</p>
        <Button onClick={() => navigate(`/videoaulas/faculdade/${encodeURIComponent(decodedArea)}`)}>
          Voltar para a lista
        </Button>
      </div>
    );
  }

  const youtubeVideoId = aula.link ? extractVideoId(aula.link) : null;
  const thumbnail = aula.thumb || (youtubeVideoId ? `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg` : null);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-white/5">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/videoaulas/faculdade/${encodeURIComponent(decodedArea)}`)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{decodedArea}</p>
            <h1 className="text-sm font-semibold truncate">{aula.titulo}</h1>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4">
          {/* Player de Vídeo / Thumbnail - Menor no desktop */}
          <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            {isPlaying && youtubeVideoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&autoplay=1`}
                title={aula.titulo || "Videoaula"}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 w-full h-full group cursor-pointer"
              >
                {/* Thumbnail */}
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={aula.titulo || "Videoaula"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (youtubeVideoId) {
                        e.currentTarget.src = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                    <Play className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
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

          {/* Info da Aula */}
          <div className="bg-neutral-900/80 border border-white/5 rounded-xl p-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {aula.titulo}
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{decodedArea}</span>
              </div>
              {aula.tempo && (
                <span className="text-red-400">{aula.tempo}</span>
              )}
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
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Navegação entre aulas */}
          <div className="grid grid-cols-2 gap-3">
            {aulaAnterior ? (
              <button
                onClick={() => navigate(`/videoaulas/faculdade/${encodeURIComponent(decodedArea)}/${aulaAnterior.id}`)}
                className="bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 hover:border-red-500/30 rounded-xl p-3 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Aula anterior</span>
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-red-400 transition-colors">
                  {aulaAnterior.titulo}
                </p>
              </button>
            ) : (
              <div />
            )}

            {aulaProxima ? (
              <button
                onClick={() => navigate(`/videoaulas/faculdade/${encodeURIComponent(decodedArea)}/${aulaProxima.id}`)}
                className="bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 hover:border-red-500/30 rounded-xl p-3 text-right transition-all group"
              >
                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mb-1">
                  <span>Próxima aula</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-red-400 transition-colors">
                  {aulaProxima.titulo}
                </p>
              </button>
            ) : (
              <div />
            )}
          </div>

        </div>
      </ScrollArea>
    </div>
  );
};

export default VideoaulaFaculdadeView;
