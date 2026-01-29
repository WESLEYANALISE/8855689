import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import { ListVideo, PlayCircle, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Playlist {
  id: string;
  playlist_id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  video_count: number;
}

interface PlaylistsTribunalCarouselProps {
  tribunalFiltro: string;
  canalId?: string | null;
}

export function PlaylistsTribunalCarousel({ tribunalFiltro, canalId }: PlaylistsTribunalCarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  const { data: playlists, isLoading } = useQuery({
    queryKey: ['playlists-tribunal', canalId],
    queryFn: async () => {
      if (!canalId) return [];
      
      const { data, error } = await supabase
        .from('audiencias_playlists')
        .select('*')
        .eq('canal_id', canalId)
        .order('video_count', { ascending: false });

      if (error) throw error;
      return data as Playlist[];
    },
    enabled: !!canalId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!playlists || playlists.length === 0) {
    return null;
  }

  const openPlaylist = (playlistId: string) => {
    window.open(`https://www.youtube.com/playlist?list=${playlistId}`, '_blank');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ListVideo className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Playlists do {tribunalFiltro}
        </h2>
        <Badge variant="secondary" className="text-xs">
          {playlists.length} playlists
        </Badge>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="flex-shrink-0 w-[240px] cursor-pointer group"
              onClick={() => openPlaylist(playlist.playlist_id)}
            >
              <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
                {playlist.thumbnail ? (
                  <img
                    src={playlist.thumbnail}
                    alt={playlist.titulo}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <ListVideo className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white text-sm">
                      <PlayCircle className="w-4 h-4" />
                      <span>{playlist.video_count} vídeos</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Badge de quantidade */}
                <Badge 
                  className="absolute top-2 right-2 bg-black/70 text-white border-none text-xs"
                >
                  {playlist.video_count} vídeos
                </Badge>
              </div>

              <div className="mt-2">
                <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {playlist.titulo}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
