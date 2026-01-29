import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, BookOpen, Loader2, Play, Sparkles, ListChecks, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import VideoaulaQuestoes from "@/components/videoaulas/VideoaulaQuestoes";
import StandardPageHeader from "@/components/StandardPageHeader";
import VideoaulaFlashcards from "@/components/videoaulas/VideoaulaFlashcards";

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

  // Buscar aula anterior e próxima
  const { data: navegacao } = useQuery({
    queryKey: ["videoaula-iniciante-nav", aula?.ordem],
    queryFn: async () => {
      if (!aula?.ordem) return { anterior: null, proxima: null };

      const [anteriorRes, proximaRes] = await Promise.all([
        supabase
          .from("videoaulas_iniciante")
          .select("id, titulo, ordem")
          .eq("ordem", aula.ordem - 1)
          .maybeSingle(),
        supabase
          .from("videoaulas_iniciante")
          .select("id, titulo, ordem")
          .eq("ordem", aula.ordem + 1)
          .maybeSingle(),
      ]);

      return {
        anterior: anteriorRes.data,
        proxima: proximaRes.data,
      };
    },
    enabled: !!aula?.ordem,
  });

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

    // Verifica se falta conteúdo (flashcards ou questões)
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

  const hasContent = aula.sobre_aula || aula.questoes;

  return (
    <div className="min-h-screen bg-background pb-24">
      <StandardPageHeader 
        title="Videoaulas" 
        subtitle={`Aula ${aula.ordem}`}
        backPath="/videoaulas/iniciante"
      />

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-4 space-y-4">
          {/* Player de Vídeo / Thumbnail - Menor no desktop */}
          <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            {isPlaying ? (
              <iframe
                src={`https://www.youtube.com/embed/${aula.video_id}?rel=0&autoplay=1`}
                title={aula.titulo}
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

          {/* Navegação entre aulas */}
          <div className="grid grid-cols-2 gap-3">
            {navegacao?.anterior ? (
              <button
                onClick={() => navigate(`/videoaulas/iniciante/${navegacao.anterior.id}`)}
                className="bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 hover:border-red-500/30 rounded-xl p-3 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Aula anterior</span>
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-red-400 transition-colors">
                  Aula {navegacao.anterior.ordem}
                </p>
              </button>
            ) : (
              <div />
            )}

            {navegacao?.proxima ? (
              <button
                onClick={() => navigate(`/videoaulas/iniciante/${navegacao.proxima.id}`)}
                className="bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 hover:border-red-500/30 rounded-xl p-3 text-right transition-all group"
              >
                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mb-1">
                  <span>Próxima aula</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-red-400 transition-colors">
                  Aula {navegacao.proxima.ordem}
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

export default VideoaulaInicianteView;
