import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play, Loader2, ArrowLeft, Video, Search, History, Clock, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useMultipleVideoProgress } from "@/hooks/useVideoProgress";
import { cn } from "@/lib/utils";

// Função para limpar título (remove "CURSO GRATUITO", "PRIMEIROS PASSOS NO DIREITO", etc.)
const cleanVideoTitle = (title: string): string => {
  return title
    .replace(/\s*\|\s*CURSO GRATUITO COMPLETO\s*/gi, '')
    .replace(/\s*\|\s*CURSO GRATUITO\s*/gi, '')
    .replace(/\s*CURSO GRATUITO COMPLETO\s*/gi, '')
    .replace(/\s*CURSO GRATUITO\s*/gi, '')
    .replace(/\s*PRIMEIROS PASSOS NO DIREITO[:\s]*/gi, '')
    .replace(/\s*o método para que[^\|]*/gi, '')
    .trim();
};

interface VideoaulaIniciante {
  id: string;
  video_id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  ordem: number;
}

type MainTabType = "videos" | "historico";

interface HistoricoVideo {
  id: string;
  video_id: string;
  titulo: string;
  thumbnail: string | null;
  assistido_em: string;
  progresso_segundos: number;
  duracao_total?: number;
  rota: string;
}

const VideoaulasIniciante = () => {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<MainTabType>("videos");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: videoaulas, isLoading } = useQuery({
    queryKey: ["videoaulas-iniciante"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_iniciante")
        .select("*")
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data as VideoaulaIniciante[];
    },
  });

  // Buscar progresso de todos os vídeos
  const registroIds = useMemo(() => videoaulas?.map(v => v.id) || [], [videoaulas]);
  const { progressMap } = useMultipleVideoProgress("videoaulas_iniciante", registroIds);

  // Buscar histórico de vídeos assistidos
  const { data: historico, isLoading: loadingHistorico } = useQuery({
    queryKey: ['videoaulas-iniciante-historico'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('videoaulas_progresso')
        .select('*')
        .eq('user_id', user.id)
        .eq('tabela', 'videoaulas_iniciante')
        .order('updated_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }

      const historicoFormatado: HistoricoVideo[] = [];

      for (const item of data || []) {
        // Buscar detalhes do vídeo
        const videoInfo = videoaulas?.find(v => v.id === item.registro_id);
        
        if (videoInfo) {
          historicoFormatado.push({
            id: item.id,
            video_id: videoInfo.video_id,
            titulo: videoInfo.titulo,
            thumbnail: videoInfo.thumbnail || `https://img.youtube.com/vi/${videoInfo.video_id}/mqdefault.jpg`,
            assistido_em: item.updated_at,
            progresso_segundos: item.tempo_atual || 0,
            duracao_total: item.duracao_total || undefined,
            rota: `/videoaulas/iniciante/${videoInfo.id}`
          });
        }
      }

      return historicoFormatado;
    },
    enabled: mainTab === 'historico' && !!videoaulas,
    staleTime: 1000 * 60 * 2,
  });

  // Filtrar vídeos por busca
  const filteredVideos = useMemo(() => {
    if (!videoaulas) return [];
    if (!searchQuery.trim()) return videoaulas;
    return videoaulas.filter(v => 
      cleanVideoTitle(v.titulo).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [videoaulas, searchQuery]);

  // Helper function to get YouTube thumbnail
  const getYouTubeThumbnail = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Formatar data relativa
  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Simples */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button 
            onClick={() => navigate('/videoaulas')}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>
      </div>

      {/* Header da Página */}
      <div className="pt-4 pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-500/60 flex items-center justify-center shadow-lg flex-shrink-0">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                  CONCEITOS
                </span>
                <h1 className="text-lg font-bold mt-1">Videoaulas para Iniciantes</h1>
                <p className="text-xs text-muted-foreground">{videoaulas?.length || 0} aulas disponíveis</p>
              </div>
            </div>

            {/* Barra de Pesquisa */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar aula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-secondary/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Tabs Vídeos / Histórico */}
            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTabType)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-neutral-900/80 border border-red-700/30 p-1 h-11">
                <TabsTrigger 
                  value="videos"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-muted-foreground gap-2"
                >
                  <Video className="w-4 h-4" />
                  Vídeos
                </TabsTrigger>
                <TabsTrigger 
                  value="historico"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-muted-foreground gap-2"
                >
                  <History className="w-4 h-4" />
                  Histórico
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* Content based on tab */}
      {mainTab === "videos" && (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="max-w-4xl mx-auto px-4 space-y-3">
            {filteredVideos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{searchQuery ? "Nenhuma aula encontrada" : "Nenhuma videoaula disponível"}</p>
              </div>
            ) : (
              filteredVideos.map((aula) => {
                const progress = progressMap[aula.id];
                const percentual = progress?.percentual || 0;
                const assistido = progress?.assistido || false;
                
                return (
                  <button
                    key={aula.id}
                    onClick={() => navigate(`/videoaulas/iniciante/${aula.id}`)}
                    className="w-full bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 rounded-xl p-2.5 flex gap-3 items-start transition-all group"
                  >
                    {/* Thumbnail com número e ícone de play - aspect-video */}
                    <div className="shrink-0 relative w-32 aspect-video rounded-lg overflow-hidden bg-neutral-800">
                      <img 
                        src={aula.thumbnail || getYouTubeThumbnail(aula.video_id)} 
                        alt={aula.titulo}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Play icon overlay - transparente */}
                      <div className="absolute inset-0 bg-black/15 flex items-center justify-center group-hover:bg-black/25 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-red-600/70 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-600/90 transition-all">
                          <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      {/* Número da aula no canto inferior esquerdo - colado */}
                      <div className="absolute bottom-0 left-0 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-tr">
                        {String(aula.ordem).padStart(2, '0')}
                      </div>
                      {/* Barra de progresso */}
                      {percentual > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                          <div 
                            className={cn(
                              "h-full transition-all",
                              assistido ? "bg-green-500" : "bg-red-600"
                            )}
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Conteúdo - Só título limpo, sem descrição */}
                    <div className="flex-1 text-left min-w-0 py-0.5">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">
                        {cleanVideoTitle(aula.titulo)}
                      </h3>
                      {/* Info de progresso */}
                      {percentual > 0 && (
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <span className={cn(
                            "font-medium",
                            assistido ? "text-green-400" : "text-red-400"
                          )}>
                            {assistido ? "Concluído" : `${percentual}%`}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}

      {/* Histórico Tab */}
      {mainTab === "historico" && (
        <div className="max-w-4xl mx-auto px-4 pt-2">
          {loadingHistorico ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : !historico || historico.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg font-medium mb-2">Nenhum vídeo assistido</p>
              <p className="text-muted-foreground/70 text-sm">Os vídeos que você assistir aparecerão aqui</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-3 pb-8">
                {historico.map((video) => (
                  <motion.button
                    key={video.id}
                    onClick={() => navigate(video.rota)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 rounded-xl p-2.5 flex gap-3 items-start transition-all group"
                  >
                    {/* Thumbnail com progresso */}
                    <div className="shrink-0 relative w-28 aspect-video rounded-lg overflow-hidden bg-neutral-800">
                      <img 
                        src={video.thumbnail || ''} 
                        alt={video.titulo}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 bg-black/15 flex items-center justify-center group-hover:bg-black/25 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-red-600/70 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-600/90 transition-all">
                          <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      {/* Barra de progresso */}
                      {video.duracao_total && video.duracao_total > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                          <div 
                            className="h-full bg-red-600"
                            style={{ width: `${Math.min((video.progresso_segundos / video.duracao_total) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 text-left min-w-0 py-0.5">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">
                        {cleanVideoTitle(video.titulo)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeDate(video.assistido_em)}</span>
                        {video.progresso_segundos > 0 && (
                          <>
                            <span>•</span>
                            <span>{formatTime(video.progresso_segundos)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoaulasIniciante;
