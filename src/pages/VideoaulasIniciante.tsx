import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import StandardPageHeader from "@/components/StandardPageHeader";

interface VideoaulaIniciante {
  id: string;
  video_id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  ordem: number;
}

const VideoaulasIniciante = () => {
  const navigate = useNavigate();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  // Helper function to get YouTube thumbnail
  const getYouTubeThumbnail = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <StandardPageHeader 
        title="Videoaulas para Iniciantes" 
        subtitle={`${videoaulas?.length || 0} aulas disponíveis`}
        backPath="/primeiros-passos"
      />

      {/* Lista de Aulas - Centralizada */}
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          {videoaulas?.map((aula) => (
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
              </div>

              {/* Conteúdo */}
              <div className="flex-1 text-left min-w-0 py-0.5">
                <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">
                  {aula.titulo}
                </h3>
                {aula.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                    {aula.descricao.substring(0, 100)}...
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default VideoaulasIniciante;
