import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Playlist {
  titulo: string;
  area: string;
  link: string;
  thumb?: string;
  tempo?: string;
  data?: string;
  categoria?: string;
}

interface VideoPlaylistCarouselProps {
  playlists: Playlist[];
}

export const VideoPlaylistCarousel = ({ playlists }: VideoPlaylistCarouselProps) => {
  const navigate = useNavigate();
  
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-3 md:gap-4">
        {playlists.map((playlist, idx) => (
          <div key={idx} className="flex-[0_0_70%] md:flex-[0_0_25%] min-w-0">
            <div className="bg-secondary/30 rounded-xl p-3 transition-all hover:bg-secondary/50">
              <div
                className="cursor-pointer group"
                onClick={() => navigate(`/videoaulas/player?area=${encodeURIComponent(playlist.area)}`)}
              >
                <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden mb-3 shadow-lg">
                  {playlist.thumb ? (
                    <img
                      src={playlist.thumb}
                      alt={playlist.titulo || playlist.area}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600/20 to-red-900/20">
                      <Video className="w-12 h-12 text-red-500/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="bg-red-600 rounded-full p-3 shadow-lg group-hover:scale-110 transition-transform">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="px-1">
                  <h3 className="font-bold text-sm text-foreground break-words leading-tight">
                    {playlist.titulo || playlist.area}
                  </h3>
                  {playlist.tempo && (
                    <p className="text-xs text-muted-foreground mt-1">{playlist.tempo}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
