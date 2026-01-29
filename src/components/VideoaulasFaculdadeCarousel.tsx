import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDeviceType } from "@/hooks/use-device-type";

interface AreaFaculdade {
  area: string;
  count: number;
  thumbnail?: string;
}

const getYouTubeThumbnail = (link: string | undefined) => {
  if (!link) return null;
  const match = link.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }
  return null;
};

const VideoaulaAreaCard = ({ area, priority = false, isDesktop = false }: { area: AreaFaculdade; priority?: boolean; isDesktop?: boolean }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  const thumbnail = area.thumbnail ? getYouTubeThumbnail(area.thumbnail) : null;

  return (
    <div 
      onClick={() => navigate(`/videoaulas/faculdade/${encodeURIComponent(area.area)}`)}
      className={cn(
        "cursor-pointer group",
        isDesktop ? "w-full" : "flex-shrink-0 w-[240px]"
      )}
    >
      <div className="flex flex-col rounded-xl bg-card border border-border shadow-lg overflow-hidden h-full">
        <div className="relative w-full aspect-[16/9] overflow-hidden flex-shrink-0">
          <div 
            className={cn(
              "absolute inset-0 skeleton-shimmer transition-opacity duration-300",
              isLoading && thumbnail ? "opacity-100" : "opacity-0"
            )}
          />
          
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={area.area}
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
          <div className="absolute bottom-2 left-2 bg-red-600/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            {area.count} {area.count === 1 ? 'aula' : 'aulas'}
          </div>
        </div>
        
        <div className="p-2.5 flex-1 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-red-400 transition-colors">
            {area.area}
          </h3>
        </div>
      </div>
    </div>
  );
};

export const VideoaulasFaculdadeCarousel = () => {
  const { isDesktop } = useDeviceType();

  const { data: areas, isLoading } = useQuery({
    queryKey: ['videoaulas-faculdade-areas-carousel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('VIDEO AULAS-NOVO' as any)
        .select('area, thumb, link')
        .eq('categoria', 'Faculdade')
        .order('titulo', { ascending: true });

      if (error) throw error;
      
      const areaMap: Record<string, AreaFaculdade> = {};
      (data || []).forEach((v: any) => {
        const area = v.area || 'Outros';
        if (!areaMap[area]) {
          areaMap[area] = { 
            area, 
            count: 0, 
            thumbnail: v.link || v.thumb
          };
        }
        areaMap[area].count++;
      });

      return Object.values(areaMap).sort((a, b) => 
        a.area.localeCompare(b.area, 'pt-BR')
      );
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

  if (!areas || areas.length === 0) return null;

  if (isDesktop) {
    return (
      <div className="grid grid-cols-4 gap-3 relative z-10">
        {areas.slice(0, 8).map((area, index) => (
          <VideoaulaAreaCard 
            key={area.area} 
            area={area} 
            priority={index < 4}
            isDesktop={true}
          />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="w-full relative z-10">
      <div className="flex gap-3 pb-4 touch-pan-x">
        {areas.map((area, index) => (
          <VideoaulaAreaCard 
            key={area.area} 
            area={area} 
            priority={index < 3}
            isDesktop={false}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default VideoaulasFaculdadeCarousel;
