import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, ArrowLeft, Loader2, Search, Play, History, Clock, X, ExternalLink, Youtube, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AREAS_PLAYLISTS } from "@/data/videoaulasAreasPlaylists";

interface VideoaulaArea {
  id: number;
  titulo: string;
  area: string;
  link: string;
  thumb: string | null;
  tempo: string | null;
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
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

const VideoaulasAreaVideos = () => {
  const navigate = useNavigate();
  const { area } = useParams();
  const decodedArea = decodeURIComponent(area || "");
  const [search, setSearch] = useState("");
  const [mainTab, setMainTab] = useState<MainTabType>("videos");

  // Encontrar playlist correspondente
  const areaPlaylist = AREAS_PLAYLISTS.find(
    p => p.nome.toLowerCase() === decodedArea.toLowerCase()
  );

  // Buscar vídeos da tabela videoaulas_areas_direito
  const { data: videoaulas, isLoading: isLoadingLocal, error: loadError } = useQuery({
    queryKey: ["videoaulas-areas-direito", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_areas_direito")
        .select("id, video_id, titulo, descricao, area, thumb, ordem, sobre_aula, flashcards, questoes")
        .eq("area", decodedArea)
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!decodedArea,
  });

  // Se não tiver vídeos locais, buscar do YouTube via edge function (fallback)
  const { data: youtubeVideos, isLoading: isLoadingYoutube, error: youtubeError } = useQuery({
    queryKey: ["youtube-playlist-videos", areaPlaylist?.playlistId],
    queryFn: async () => {
      if (!areaPlaylist) throw new Error("Playlist não encontrada");
      
      console.log("Buscando vídeos da playlist (fallback):", areaPlaylist.playlistUrl);
      
      const { data, error } = await supabase.functions.invoke('buscar-videos-playlist', {
        body: { playlistLink: areaPlaylist.playlistUrl }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data.videos as YouTubeVideo[];
    },
    enabled: !!areaPlaylist && (!videoaulas || videoaulas.length === 0) && !isLoadingLocal,
    retry: 2,
    staleTime: 1000 * 60 * 30, // 30 minutos
  });

  const isLoading = isLoadingLocal || ((!videoaulas || videoaulas.length === 0) && isLoadingYoutube);

  // Combinar vídeos locais e do YouTube
  const allVideos = useMemo(() => {
    // Prioridade: tabela videoaulas_areas_direito
    if (videoaulas && videoaulas.length > 0) {
      return videoaulas.map((v: any) => ({
        id: String(v.id),
        isLocal: true,
        titulo: v.titulo,
        thumb: v.thumb,
        tempo: null,
        link: `https://www.youtube.com/watch?v=${v.video_id}`,
        videoId: v.video_id,
        description: v.descricao,
        hasContent: !!(v.sobre_aula || v.flashcards || v.questoes),
      }));
    }
    
    // Fallback: YouTube API
    if (youtubeVideos && youtubeVideos.length > 0) {
      return youtubeVideos.map(v => ({
        id: v.videoId,
        isLocal: false,
        titulo: v.title,
        thumb: v.thumbnail,
        tempo: null,
        link: `https://www.youtube.com/watch?v=${v.videoId}`,
        videoId: v.videoId,
        description: v.description,
        hasContent: false,
      }));
    }
    
    return [];
  }, [videoaulas, youtubeVideos]);

  const filteredVideos = useMemo(() => {
    if (!allVideos.length) return [];
    if (!search.trim()) return allVideos;
    return allVideos.filter(v =>
      v.titulo.toLowerCase().includes(search.toLowerCase())
    );
  }, [allVideos, search]);

  const totalVideos = allVideos.length;

  // Buscar histórico de vídeos assistidos
  const { data: historico, isLoading: loadingHistorico } = useQuery({
    queryKey: ['videoaulas-areas-historico', decodedArea, allVideos.length],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('videoaulas_progresso')
        .select('*')
        .eq('user_id', user.id)
        .eq('tabela', 'videoaulas_areas_direito')
        .order('updated_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }

      const historicoFormatado: HistoricoVideo[] = [];

      for (const item of data || []) {
        // Buscar detalhes do vídeo usando video_id
        const videoInfo = allVideos.find(v => v.id === item.registro_id || v.videoId === item.registro_id);
        
        if (videoInfo) {
          historicoFormatado.push({
            id: item.id,
            video_id: videoInfo.videoId,
            titulo: videoInfo.titulo,
            thumbnail: videoInfo.thumb || `https://img.youtube.com/vi/${videoInfo.videoId}/mqdefault.jpg`,
            assistido_em: item.updated_at,
            progresso_segundos: item.tempo_atual || 0,
            duracao_total: item.duracao_total || undefined,
            rota: `/videoaulas/areas/${encodeURIComponent(decodedArea)}/${videoInfo.id}`
          });
        }
      }

      return historicoFormatado;
    },
    enabled: mainTab === 'historico' && allVideos.length > 0,
    staleTime: 1000 * 60 * 2,
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-red-500/5">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <button 
            onClick={() => navigate('/videoaulas/areas')}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>
      </div>
      
      {/* Header da Área */}
      <div className="pt-4 pb-4 px-4">
        <div className="max-w-lg mx-auto">
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
                  ÁREAS DO DIREITO
                </span>
                <h1 className="text-lg font-bold mt-1">{simplifyAreaName(decodedArea)}</h1>
                <p className="text-xs text-muted-foreground">{totalVideos} aulas disponíveis</p>
              </div>
            </div>

            {/* Link para playlist externa */}
            {areaPlaylist && (
              <a
                href={areaPlaylist.playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors mb-4"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir playlist no YouTube
              </a>
            )}
            
            {/* Barra de pesquisa */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar aula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-10 bg-secondary/50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
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
        <div className="px-4 pb-24">
          <div className="max-w-lg mx-auto">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              {youtubeVideos && youtubeVideos.length > 0 && (!videoaulas || videoaulas.length === 0) ? (
                <>
                  <Youtube className="w-4 h-4 text-red-500" />
                  Vídeos do YouTube
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  Lista de Aulas
                </>
              )}
            </h2>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <p className="text-sm text-muted-foreground">Carregando vídeos...</p>
              </div>
            ) : youtubeError ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500/50" />
                <p className="mb-2">Erro ao carregar vídeos do YouTube</p>
                <p className="text-xs text-muted-foreground/70 mb-4">
                  {youtubeError instanceof Error ? youtubeError.message : "Tente novamente mais tarde"}
                </p>
                {areaPlaylist && (
                  <a
                    href={areaPlaylist.playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir no YouTube
                  </a>
                )}
              </div>
            ) : filteredVideos.length > 0 ? (
              <div className="space-y-2">
                {filteredVideos.map((video, index) => (
                  <VideoListItemUnified
                    key={video.id}
                    video={video}
                    index={index}
                    area={decodedArea}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{search ? "Nenhuma aula encontrada" : "Nenhuma videoaula disponível"}</p>
                {areaPlaylist && !search && (
                  <a
                    href={areaPlaylist.playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Assistir no YouTube
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Histórico Tab */}
      {mainTab === "historico" && (
        <div className="px-4 pb-24">
          <div className="max-w-lg mx-auto">
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
                          {video.titulo}
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
        </div>
      )}
    </div>
  );
};

// Componente unificado para lista de vídeos (locais ou YouTube)
interface UnifiedVideo {
  id: string;
  isLocal: boolean;
  titulo: string;
  thumb: string | null;
  tempo: string | null;
  link: string;
  videoId: string;
  description?: string;
}

const VideoListItemUnified = ({ 
  video, 
  index, 
  area,
}: { 
  video: UnifiedVideo; 
  index: number; 
  area: string;
}) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const thumbnail = video.thumb || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;

  const handleClick = () => {
    // Se for local, usa o ID numérico, senão usa o videoId do YouTube
    const routeId = video.isLocal ? video.id : video.videoId;
    navigate(`/videoaulas/areas/${encodeURIComponent(area)}/${routeId}`);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={handleClick}
      className="w-full text-left border rounded-xl transition-all overflow-hidden bg-neutral-800/90 hover:bg-neutral-700/90 border-neutral-700/50 hover:border-red-500/30"
    >
      <div className="flex items-center">
        {/* Thumbnail */}
        <div className="relative w-24 h-16 flex-shrink-0 bg-neutral-800 rounded-l-xl overflow-hidden">
          <div className={cn(
            "absolute inset-0 bg-neutral-700 animate-pulse transition-opacity",
            imageLoaded ? "opacity-0" : "opacity-100"
          )} />
          <img 
            src={thumbnail} 
            alt={video.titulo}
            className={cn(
              "w-full h-full object-cover transition-opacity",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-red-600/80 flex items-center justify-center">
              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
            </div>
          </div>
          
          {/* Número */}
          <div className="absolute bottom-0 left-0 bg-red-600/90 text-white text-xs font-bold px-2 py-0.5 rounded-tr-lg">
            {String(index + 1).padStart(2, '0')}
          </div>
          
          {/* Badge YouTube */}
          {!video.isLocal && (
            <div className="absolute top-0.5 right-0.5 bg-red-600/90 px-1 py-0.5 rounded text-[9px] text-white font-medium flex items-center gap-0.5">
              <Youtube className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 py-2 px-3 min-w-0">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
            {video.titulo}
          </h3>
          {video.tempo && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {video.tempo}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default VideoaulasAreaVideos;
