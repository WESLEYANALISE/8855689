import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play, Loader2 } from "lucide-react";

interface VideoaulaOAB {
  id: number;
  titulo: string | null;
  thumb: string | null;
  link: string | null;
}

interface VideoaulasOABSidebarProps {
  area: string;
  aulaAtualId?: string;
}

export const VideoaulasOABSidebar = ({ area, aulaAtualId }: VideoaulasOABSidebarProps) => {
  const navigate = useNavigate();

  const { data: videoaulas, isLoading } = useQuery({
    queryKey: ["videoaulas-oab-sidebar", area],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO")
        .select("id, titulo, thumb, link")
        .ilike("area", `%${area}%`)
        .order("titulo", { ascending: true });
      
      if (error) throw error;
      return data as VideoaulaOAB[];
    },
    enabled: !!area,
  });

  // Extrair video ID do YouTube para thumbnail
  const getYouTubeThumbnail = (link: string) => {
    const match = link?.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (match?.[1]) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="w-72 bg-card border-r border-border p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="w-72 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-bold">{area}</h2>
        <p className="text-xs text-muted-foreground">{videoaulas?.length || 0} aulas</p>
      </div>

      {/* Lista de vídeos */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {videoaulas?.map((aula, index) => {
          const isActive = String(aula.id) === aulaAtualId;
          const thumbnail = aula.thumb || (aula.link ? getYouTubeThumbnail(aula.link) : null);
          
          return (
            <button
              key={aula.id}
              onClick={() => navigate(`/videoaulas/oab/${encodeURIComponent(area)}/${aula.id}`)}
              className={`w-full flex gap-2 p-2 rounded-lg transition-all group text-left ${
                isActive 
                  ? "bg-red-500/20 border border-red-500/40" 
                  : "hover:bg-secondary/80 border border-transparent"
              }`}
            >
              {/* Thumbnail */}
              <div className="shrink-0 relative w-20 aspect-video rounded overflow-hidden bg-neutral-800">
                {thumbnail ? (
                  <img 
                    src={thumbnail} 
                    alt={aula.titulo || ''}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                {/* Play overlay */}
                <div className={`absolute inset-0 flex items-center justify-center transition-colors ${
                  isActive ? "bg-black/20" : "bg-black/30 group-hover:bg-black/20"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isActive ? "bg-red-600" : "bg-red-600/70 group-hover:bg-red-600"
                  }`}>
                    <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
                  </div>
                </div>
                {/* Número */}
                <div className={`absolute bottom-0 left-0 px-1 py-0.5 text-[9px] font-bold rounded-tr ${
                  isActive ? "bg-red-600 text-white" : "bg-neutral-900 text-white/80"
                }`}>
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>

              {/* Título */}
              <div className="flex-1 min-w-0 py-0.5">
                <h3 className={`text-xs font-medium line-clamp-2 leading-tight ${
                  isActive ? "text-red-400" : "text-foreground group-hover:text-red-400"
                }`}>
                  {aula.titulo}
                </h3>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
