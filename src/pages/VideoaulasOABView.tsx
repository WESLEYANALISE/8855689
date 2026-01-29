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

interface VideoaulaOAB {
  id: number;
  titulo: string | null;
  link: string | null;
  thumb: string | null;
  tempo: string | null;
  area: string | null;
  sobre_aula: string | null;
  questoes: any[] | null;
  flashcards: any[] | null;
}

const VideoaulasOABView = () => {
  const navigate = useNavigate();
  const { area, id } = useParams<{ area: string; id: string }>();
  const decodedArea = area ? decodeURIComponent(area) : "";
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("sobre");
  const [isPlaying, setIsPlaying] = useState(false);

  // Mutation para gerar conteúdo (sobre, flashcards, questões)
  const gerarConteudoMutation = useMutation({
    mutationFn: async (videoaulaId: number) => {
      const { data, error } = await supabase.functions.invoke("processar-videoaula-oab", {
        body: { videoaulaId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoaula-oab", id] });
      toast.success("Conteúdo gerado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao gerar conteúdo:", error);
      toast.error("Erro ao gerar conteúdo. Tente novamente.");
    }
  });

  const hasContent = (aula: VideoaulaOAB | undefined) => {
    if (!aula) return false;
    return aula.sobre_aula || (aula.flashcards && aula.flashcards.length > 0) || (aula.questoes && aula.questoes.length > 0);
  };

  // Buscar a aula atual
  const { data: aula, isLoading } = useQuery({
    queryKey: ["videoaula-oab", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO")
        .select("*")
        .eq("id", Number(id))
        .single();
      
      if (error) throw error;
      return data as VideoaulaOAB;
    },
    enabled: !!id,
  });

  // Buscar todas as aulas da área para navegação
  const { data: todasAulas } = useQuery({
    queryKey: ["videoaulas-oab-area-nav", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO")
        .select("id, titulo")
        .ilike("area", `%${decodedArea}%`)
        .order("titulo", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!decodedArea,
  });

  // Encontrar índice e navegação
  const currentIndex = todasAulas?.findIndex(a => a.id === Number(id)) ?? -1;
  const anterior = currentIndex > 0 ? todasAulas?.[currentIndex - 1] : null;
  const proxima = currentIndex < (todasAulas?.length || 0) - 1 ? todasAulas?.[currentIndex + 1] : null;

  // Extrair video ID do YouTube
  const extractVideoId = (url: string): string => {
    if (!url) return '';
    const patterns = [
      /[?&]v=([^&]+)/,
      /youtu\.be\/([^?&]+)/,
      /embed\/([^?&]+)/,
      /shorts\/([^?&]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return '';
  };

  const videoId = aula?.link ? extractVideoId(aula.link) : '';

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
        <Button onClick={() => navigate(`/videoaulas/oab/${encodeURIComponent(decodedArea)}`)}>
          Voltar para a lista
        </Button>
      </div>
    );
  }

  const backToList = `/videoaulas/oab/${encodeURIComponent(decodedArea)}`;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header com botão voltar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backToList)}
            className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">Videoaulas</h1>
            <p className="text-xs text-muted-foreground truncate">{decodedArea}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-4 space-y-4">
          {/* Player de Vídeo / Thumbnail - Menor no desktop */}
          <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            {isPlaying ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`}
                title={aula.titulo || ''}
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
                <img
                  src={aula.thumb || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                  alt={aula.titulo || ''}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
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

          {/* Info da Aula */}
          <div className="bg-neutral-900/80 border border-white/5 rounded-xl p-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {aula.titulo}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{decodedArea}</span>
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
                      {hasContent(aula) 
                        ? "A descrição desta aula será adicionada em breve."
                        : "Gere o conteúdo completo da aula: descrição, flashcards e questões."}
                    </p>
                    {!hasContent(aula) && (
                      <Button 
                        onClick={() => gerarConteudoMutation.mutate(aula.id)}
                        disabled={gerarConteudoMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {gerarConteudoMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Gerando conteúdo...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Gerar Conteúdo
                          </>
                        )}
                      </Button>
                    )}
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
                      {hasContent(aula) 
                        ? "Flashcards estarão disponíveis em breve."
                        : "Clique em \"Gerar Conteúdo\" na aba Sobre."}
                    </p>
                    {!hasContent(aula) && (
                      <Button 
                        onClick={() => {
                          setActiveTab("sobre");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Ir para aba Sobre
                      </Button>
                    )}
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
                      {hasContent(aula) 
                        ? "Questões estarão disponíveis em breve."
                        : "Clique em \"Gerar Conteúdo\" na aba Sobre."}
                    </p>
                    {!hasContent(aula) && (
                      <Button 
                        onClick={() => {
                          setActiveTab("sobre");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Ir para aba Sobre
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Navegação entre aulas */}
          <div className="grid grid-cols-2 gap-3">
            {anterior ? (
              <button
                onClick={() => navigate(`/videoaulas/oab/${encodeURIComponent(decodedArea)}/${anterior.id}`)}
                className="bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 hover:border-red-500/30 rounded-xl p-3 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Aula anterior</span>
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-red-400 transition-colors">
                  {anterior.titulo}
                </p>
              </button>
            ) : (
              <div />
            )}

            {proxima ? (
              <button
                onClick={() => navigate(`/videoaulas/oab/${encodeURIComponent(decodedArea)}/${proxima.id}`)}
                className="bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 hover:border-red-500/30 rounded-xl p-3 text-right transition-all group"
              >
                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mb-1">
                  <span>Próxima aula</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-red-400 transition-colors">
                  {proxima.titulo}
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

export default VideoaulasOABView;
