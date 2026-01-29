import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Play, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useEmblaCarousel from "embla-carousel-react";
import { useInstantCache, preloadImages } from "@/hooks/useInstantCache";
import { useEffect } from "react";

interface VideoEmAlta {
  id: number;
  area: string;
  tema: string;
  titulo: string;
  thumbnail: string;
}

export const VideoaulasEmAltaCarousel = () => {
  const navigate = useNavigate();
  const [emblaRef] = useEmblaCarousel({ 
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps"
  });

  const { data: videos, isLoading } = useInstantCache<VideoEmAlta[]>({
    cacheKey: "videoaulas-em-alta",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO")
        .select("id, area, tema, titulo, thumbnail")
        .not("thumbnail", "is", null)
        .limit(15);

      if (error) throw error;

      return (data || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
        .map((v: any) => ({
          id: v.id,
          area: v.area || "Videoaulas",
          tema: v.tema || "",
          titulo: v.titulo || v.tema || "Videoaula",
          thumbnail: v.thumbnail
        }));
    },
    preloadImages: true,
    imageExtractor: (data) => data.map(v => v.thumbnail).filter(Boolean),
  });

  // Preload imagens quando dados chegam
  useEffect(() => {
    if (videos && videos.length > 0) {
      preloadImages(videos.map(v => v.thumbnail).filter(Boolean));
    }
  }, [videos]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-500" />
          <h2 className="font-bold text-base">Videoaulas em Alta</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[180px] h-[120px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Video className="w-5 h-5 text-blue-500" />
        <h2 className="font-bold text-base">Videoaulas em Alta</h2>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="flex-shrink-0 w-[180px] cursor-pointer group"
              onClick={() => navigate(`/videoaulas/playlists`)}
            >
              <div className="bg-secondary/30 rounded-xl overflow-hidden transition-all hover:bg-secondary/50 hover:scale-[1.02]">
                <div className="relative aspect-video bg-secondary overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.titulo}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 text-blue-600 ml-0.5" fill="currentColor" />
                    </div>
                  </div>

                  <div className="absolute bottom-1.5 left-1.5 right-1.5">
                    <div className="flex items-center gap-1 text-white/90">
                      <span className="text-[9px] font-medium truncate bg-blue-600/80 px-1.5 py-0.5 rounded">
                        {video.area}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <h3 className="font-medium text-xs line-clamp-2 leading-tight">
                    {video.titulo}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};