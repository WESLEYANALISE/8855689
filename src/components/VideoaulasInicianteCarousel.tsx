import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, Loader2, Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface VideoAula {
  id: number;
  titulo: string;
  link: string;
  thumb: string;
  area: string;
}

const VideoaulaCard = ({ video, priority = false }: { video: VideoAula; priority?: boolean }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div 
      onClick={() => navigate(`/videoaulas/iniciante/${video.id}`)}
      className="cursor-pointer group flex-shrink-0 w-[200px]"
    >
      <div className="flex flex-col rounded-xl bg-card border border-border shadow-lg overflow-hidden h-full">
        <div className="relative w-full aspect-[16/9] overflow-hidden flex-shrink-0">
          <div 
            className={cn(
              "absolute inset-0 skeleton-shimmer transition-opacity duration-300",
              isLoading && video.thumb ? "opacity-100" : "opacity-0"
            )}
          />
          
          {video.thumb ? (
            <img 
              src={video.thumb} 
              alt={video.titulo}
              loading={priority ? "eager" : "lazy"}
              decoding={priority ? "sync" : "async"}
              fetchPriority={priority ? "high" : "auto"}
              className={cn(
                "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
                isLoading ? "opacity-0" : "opacity-100"
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-900/40 to-red-950/60 flex items-center justify-center">
              <Video className="w-8 h-8 text-red-400" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Play Icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-red-600/90 rounded-full p-2">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          </div>
        </div>
        
        <div className="p-2.5 flex-1 flex flex-col justify-center">
          <h3 className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">
            {video.titulo}
          </h3>
        </div>
      </div>
    </div>
  );
};

export const VideoaulasInicianteCarousel = () => {
  const navigate = useNavigate();

  const { data: videos, isLoading } = useQuery({
    queryKey: ['videoaulas-iniciante-videos-carousel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('VIDEO AULAS-NOVO' as any)
        .select('id, titulo, link, thumb, area')
        .eq('categoria', 'Guia do Direito')
        .limit(15);

      if (error) throw error;
      return (data || []) as unknown as VideoAula[];
    },
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-red-400" />
      </div>
    );
  }

  if (!videos || videos.length === 0) return null;

  return (
    <div className="bg-neutral-900/90 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-white/5">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-red-900/20 rounded-2xl p-3 shadow-lg ring-1 ring-red-800/30">
            <Video className="w-6 h-6 md:w-5 md:h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl md:text-lg font-bold text-foreground tracking-tight">
              Videoaulas
            </h3>
            <p className="text-muted-foreground text-xs">Guia do Direito para iniciantes</p>
          </div>
        </div>
        
        <Button 
          size="sm" 
          onClick={() => navigate('/videoaulas/iniciante')} 
          className="bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-full px-4 text-xs flex items-center gap-1.5 font-medium"
        >
          Ver mais
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Carrossel de Vídeos */}
      <ScrollArea className="w-full relative z-10">
        <div className="flex gap-3 pb-2 touch-pan-x">
          {videos.map((video, index) => (
            <VideoaulaCard 
              key={video.id} 
              video={video} 
              priority={index < 3}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default VideoaulasInicianteCarousel;
