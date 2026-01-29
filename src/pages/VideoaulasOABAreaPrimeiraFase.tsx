import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Video, Loader2, Search, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDeviceType } from "@/hooks/use-device-type";

interface VideoaulaOAB {
  id: number;
  video_id: string;
  titulo: string;
  thumbnail: string | null;
  ordem: number;
  sobre_aula: string | null;
}

const VideoaulasOABAreaPrimeiraFase = () => {
  const navigate = useNavigate();
  const { area } = useParams();
  const decodedArea = decodeURIComponent(area || "");
  const [search, setSearch] = useState("");
  const { isDesktop } = useDeviceType();

  const { data: videoaulas, isLoading } = useQuery({
    queryKey: ["videoaulas-oab-1fase-area", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_oab_primeira_fase")
        .select("id, video_id, titulo, thumbnail, ordem, sobre_aula")
        .eq("area", decodedArea)
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data as VideoaulaOAB[];
    },
    enabled: !!decodedArea,
  });

  const filteredVideos = videoaulas?.filter(v =>
    v.titulo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar no desktop */}
      {isDesktop && (
        <div className="w-80 bg-card border-r border-border flex flex-col h-screen sticky top-0">
          <div className="p-4 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/videoaulas-oab-1fase")}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h2 className="text-lg font-bold text-foreground">{decodedArea}</h2>
            <p className="text-sm text-muted-foreground">
              {videoaulas?.length || 0} aulas
            </p>
          </div>

          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar aula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm bg-secondary/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
              </div>
            ) : (
              filteredVideos?.map((video, index) => (
                <SidebarVideoItem key={video.id} video={video} index={index} area={decodedArea} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1">
        {/* Header mobile */}
        {!isDesktop && (
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
            <div className="px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/videoaulas-oab-1fase")}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-lg font-bold text-foreground">{decodedArea}</h1>
                  <p className="text-sm text-muted-foreground">
                    {videoaulas?.length || 0} aulas
                  </p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Pesquisar aula..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-secondary/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Lista de vídeos (mobile) ou mensagem de seleção (desktop) */}
        <div className="p-4">
          {isDesktop ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <Video className="w-20 h-20 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Selecione uma aula
              </h2>
              <p className="text-muted-foreground max-w-md">
                Escolha uma videoaula na lista lateral para começar a assistir
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVideos?.map((video, index) => (
                <MobileVideoCard key={video.id} video={video} index={index} area={decodedArea} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Item da sidebar (desktop)
const SidebarVideoItem = ({ video, index, area }: { video: VideoaulaOAB; index: number; area: string }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <button
      onClick={() => navigate(`/videoaulas/oab-1fase/${encodeURIComponent(area)}/${video.id}`)}
      className="w-full flex gap-2 p-2 rounded-lg transition-all group text-left hover:bg-secondary/80 border border-transparent hover:border-red-500/30"
    >
      {/* Thumbnail */}
      <div className="shrink-0 relative w-24 aspect-video rounded overflow-hidden bg-neutral-800">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.titulo}
            className={cn(
              "w-full h-full object-cover transition-opacity",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
          <div className="w-6 h-6 rounded-full bg-red-600/70 group-hover:bg-red-600 flex items-center justify-center">
            <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
          </div>
        </div>
        {/* Número */}
        <div className="absolute bottom-0 left-0 px-1 py-0.5 text-[9px] font-bold bg-neutral-900 text-white/80 rounded-tr">
          {String(index + 1).padStart(2, '0')}
        </div>
      </div>

      {/* Título */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="text-xs font-medium line-clamp-2 leading-tight text-foreground group-hover:text-red-400 transition-colors">
          {video.titulo}
        </h3>
        {video.sobre_aula && (
          <span className="text-[10px] text-green-500 mt-1 block">✓ Conteúdo gerado</span>
        )}
      </div>
    </button>
  );
};

// Card mobile
const MobileVideoCard = ({ video, index, area }: { video: VideoaulaOAB; index: number; area: string }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      onClick={() => navigate(`/videoaulas/oab-1fase/${encodeURIComponent(area)}/${video.id}`)}
      className="cursor-pointer group"
    >
      <div className="flex gap-3 p-3 rounded-xl bg-card border border-border hover:border-red-500/40 transition-all">
        {/* Thumbnail */}
        <div className="shrink-0 relative w-32 aspect-video rounded-lg overflow-hidden bg-neutral-800">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.titulo}
              className={cn(
                "w-full h-full object-cover",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
            </div>
          </div>
          {/* Número */}
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] font-bold bg-black/80 text-white rounded">
            {String(index + 1).padStart(2, '0')}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="text-sm font-medium line-clamp-2 text-foreground group-hover:text-red-400 transition-colors">
            {video.titulo}
          </h3>
          {video.sobre_aula && (
            <span className="text-xs text-green-500 mt-1">✓ Conteúdo gerado</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoaulasOABAreaPrimeiraFase;
