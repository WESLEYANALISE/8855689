import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Clock, Share2, Sparkles, ChevronDown, ChevronUp, Loader2, Info, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AnaliseDocumentario from "@/components/documentarios/AnaliseDocumentario";
import SobreDocumentario from "@/components/documentarios/SobreDocumentario";
import QuestoesDocumentario from "@/components/documentarios/QuestoesDocumentario";

import CapaDocumentario from "@/components/documentarios/CapaDocumentario";


interface Questao {
  id: string;
  pergunta: string;
  alternativas: string[];
  respostaCorreta: number;
  explicacao: string;
}

interface QuestaoDinamica extends Questao {
  timestamp: number;
}

interface Documentario {
  id: string;
  video_id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  capa_webp: string | null;
  duracao: string | null;
  publicado_em: string | null;
  canal_nome: string | null;
  
  transcricao_texto: string | null;
  visualizacoes: number;
  analise_ia: string | null;
  sobre_texto: string | null;
  questoes: Questao[] | null;
  questoes_dinamicas: QuestaoDinamica[] | null;
}

const DocumentarioDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const playerRef = useRef<any>(null);

  const { data: doc, isLoading } = useQuery({
    queryKey: ["documentario", id],
    queryFn: async () => {
      if (!id) throw new Error("ID não fornecido");
      
      const { data, error } = await supabase
        .from("documentarios_juridicos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Incrementar visualizações
      await supabase
        .from("documentarios_juridicos")
        .update({ visualizacoes: (data.visualizacoes || 0) + 1 })
        .eq("id", id);
      
      // Parse questoes
      const questoesRaw = data.questoes;
      const questoes: Questao[] | null = Array.isArray(questoesRaw) ? questoesRaw as unknown as Questao[] : null;

      // Parse questoes_dinamicas
      const questoesDinamicasRaw = data.questoes_dinamicas;
      const questoesDinamicas: QuestaoDinamica[] | null = Array.isArray(questoesDinamicasRaw) ? questoesDinamicasRaw as unknown as QuestaoDinamica[] : null;
      
      return {
        id: data.id,
        video_id: data.video_id,
        titulo: data.titulo,
        descricao: data.descricao,
        thumbnail: data.thumbnail,
        capa_webp: data.capa_webp,
        duracao: data.duracao,
        publicado_em: data.publicado_em,
        canal_nome: data.canal_nome,
        transcricao_texto: data.transcricao_texto,
        visualizacoes: data.visualizacoes || 0,
        analise_ia: data.analise_ia,
        sobre_texto: data.sobre_texto,
        questoes,
        questoes_dinamicas: questoesDinamicas
      } as Documentario;
    },
    enabled: !!id,
  });

  // Mutation para gerar conteúdo completo (sobre, análise, questões)
  const conteudoMutation = useMutation({
    mutationFn: async () => {
      if (!doc) throw new Error("Documentário não encontrado");
      if (!doc.transcricao_texto) throw new Error("Transcrição não disponível");
      
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-documentario", {
        body: {
          documentarioId: doc.id,
          transcricao: doc.transcricao_texto,
          titulo: doc.titulo,
          duracao: doc.duracao
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentario", id] });
      toast.success("Conteúdo gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar conteúdo");
    }
  });


  // Gerar conteúdo automaticamente quando tiver transcrição mas não tiver sobre
  useEffect(() => {
    if (doc && doc.transcricao_texto && !doc.sobre_texto && !conteudoMutation.isPending) {
      conteudoMutation.mutate();
    }
  }, [doc?.id, doc?.transcricao_texto, doc?.sobre_texto]);

  const hasTranscriptText = doc?.transcricao_texto && doc.transcricao_texto.length > 0;

  // Inicializar YouTube IFrame API com AUTOPLAY e SOM
  useEffect(() => {
    if (!doc?.video_id) return;

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new (window as any).YT.Player("youtube-player", {
        videoId: doc.video_id,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          disablekb: 0,
          fs: 1,
          playsinline: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event: any) => {
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            setIsPlaying(event.data === 1);
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [doc?.video_id]);

  // Atualizar tempo atual
  useEffect(() => {
    if (!playerRef.current || !isPlaying) return;

    const interval = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const seekToTime = useCallback((seconds: number) => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(seconds, true);
      if (playerRef.current.playVideo) {
        playerRef.current.playVideo();
      }
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Limpa o título removendo prefixos
  const formatTitulo = (titulo: string) => {
    return titulo
      .replace(/^Audiodescrição\s*\|\s*🎥?\s*Documentário\s*[-–]\s*/i, '')
      .replace(/^🎥?\s*Documentário\s*[-–]\s*/i, '')
      .trim() || titulo;
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: doc?.titulo,
          url,
        });
      } catch {
        // Cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="aspect-video bg-muted rounded-lg" />
          <div className="h-6 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <p className="text-muted-foreground mb-4">Documentário não encontrado</p>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="flex-1 font-medium text-foreground truncate text-sm">
          Documentário
        </span>
        <Button variant="ghost" size="icon" className="shrink-0" onClick={handleShare}>
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Player - responsivo com autoplay */}
        <div className="relative w-full aspect-video bg-black">
          <div id="youtube-player" className="absolute inset-0 w-full h-full" />
        </div>

        {/* Info */}
        <div className="px-3 py-3 space-y-2 border-b border-border">
          <h1 className="text-base font-bold text-foreground leading-tight line-clamp-2">
            {formatTitulo(doc.titulo)}
          </h1>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {doc.publicado_em && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(doc.publicado_em)}
              </span>
            )}
            {doc.duracao && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {doc.duracao}
              </span>
            )}
          </div>

          {doc.descricao && (
            <div>
              <p className={`text-xs text-muted-foreground ${showFullDescription ? "" : "line-clamp-2"}`}>
                {doc.descricao}
              </p>
              {doc.descricao.length > 100 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-xs text-primary flex items-center gap-1 mt-1"
                >
                  {showFullDescription ? (
                    <>
                      Menos <ChevronUp className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      Mais <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabs - Sobre, Análise, Questões */}
        <Tabs defaultValue="sobre" className="flex-1">
          <TabsList className="w-full grid grid-cols-3 border-b border-border rounded-none bg-transparent h-auto py-0">
            <TabsTrigger
              value="sobre"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm"
            >
              <Info className="h-4 w-4 mr-2" />
              Sobre
            </TabsTrigger>
            <TabsTrigger
              value="analise"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Análise
            </TabsTrigger>
            <TabsTrigger
              value="questoes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Questões
            </TabsTrigger>
          </TabsList>

          {/* Sobre */}
          <TabsContent value="sobre" className="mt-0 px-4 py-4 pb-8">
            <SobreDocumentario
              sobre={doc.sobre_texto}
              onGenerate={() => conteudoMutation.mutate()}
              isLoading={conteudoMutation.isPending}
              hasTranscricao={!!hasTranscriptText}
            />
          </TabsContent>

          {/* Análise */}
          <TabsContent value="analise" className="mt-0 px-4 py-4 pb-8">
            {conteudoMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">
                  Gerando análise...
                </p>
              </div>
            ) : doc.analise_ia ? (
              <AnaliseDocumentario analise={doc.analise_ia} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  {hasTranscriptText 
                    ? "Gere a análise do documentário"
                    : "É necessário ter a transcrição para gerar análise"}
                </p>
                {hasTranscriptText && (
                  <Button 
                    onClick={() => conteudoMutation.mutate()}
                    disabled={conteudoMutation.isPending}
                    size="sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Análise
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Questões */}
          <TabsContent value="questoes" className="mt-0 px-4 py-4 pb-8">
            <QuestoesDocumentario
              questoes={doc.questoes}
              onGenerate={() => conteudoMutation.mutate()}
              isLoading={conteudoMutation.isPending}
              hasTranscricao={!!hasTranscriptText}
            />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default DocumentarioDetalhes;
