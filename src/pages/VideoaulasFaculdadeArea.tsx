import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Play, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Videoaula {
  id: number;
  titulo: string | null;
  link: string | null;
  thumb: string | null;
  tempo: string | null;
}

const VideoaulasFaculdadeArea = () => {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const decodedArea = area ? decodeURIComponent(area) : "";
  const [searchTerm, setSearchTerm] = useState("");

  const { data: videoaulas, isLoading } = useQuery({
    queryKey: ["videoaulas-faculdade-area", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO")
        .select("id, titulo, link, thumb, tempo")
        .eq("area", decodedArea)
        .order("titulo", { ascending: true });

      if (error) throw error;
      return data as Videoaula[];
    },
    enabled: !!decodedArea,
  });

  // Filtrar videoaulas pelo termo de pesquisa e ordenar alfabeticamente
  const filteredVideoaulas = videoaulas
    ?.filter((aula) =>
      aula.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    ?.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "", "pt-BR"));

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

  // Navegar para a visualização da videoaula
  const handleVideoClick = (videoaula: Videoaula) => {
    if (!videoaula.id || !videoaula.titulo) return;
    navigate(`/videoaulas/faculdade/${encodeURIComponent(decodedArea)}/${videoaula.id}`);
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
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-white/5">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/videoaulas/faculdade")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">{decodedArea}</h1>
            <p className="text-xs text-muted-foreground">
              {filteredVideoaulas?.length || 0} aulas disponíveis
            </p>
          </div>
        </div>

        {/* Barra de pesquisa */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar aula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-neutral-900/80 border-white/10 focus:border-red-500/50"
            />
          </div>
        </div>
      </div>

      {/* Lista de Aulas */}
      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="px-3 py-3 space-y-3">
          {filteredVideoaulas?.map((aula, index) => {
            const thumbnail = aula.thumb || (aula.link ? getYouTubeThumbnail(aula.link) : null);
            const numero = String(index + 1).padStart(2, "0");

            if (!aula.titulo || !aula.link) return null;

            return (
              <button
                key={`${aula.titulo}-${index}`}
                onClick={() => handleVideoClick(aula)}
                className="w-full bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 rounded-xl p-2.5 flex gap-3 items-start transition-all group"
              >
                {/* Thumbnail com número e ícone de play */}
                <div className="shrink-0 relative w-32 aspect-video rounded-lg overflow-hidden bg-neutral-800">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={aula.titulo}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 bg-black/15 flex items-center justify-center group-hover:bg-black/25 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-red-600/70 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-600/90 transition-all">
                      <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  {/* Número da aula */}
                  <div className="absolute bottom-0 left-0 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-tr">
                    {numero}
                  </div>
                  {/* Duração */}
                  {aula.tempo && (
                    <div className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-medium rounded-tl">
                      {aula.tempo}
                    </div>
                  )}
                </div>

                {/* Conteúdo - título completo sem truncar */}
                <div className="flex-1 text-left min-w-0 py-0.5">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-red-400 transition-colors leading-snug">
                    {aula.titulo}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {decodedArea}
                  </p>
                </div>
              </button>
            );
          })}

          {filteredVideoaulas?.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhuma aula encontrada para "{searchTerm}"
              </p>
            </div>
          )}

          {videoaulas?.length === 0 && !searchTerm && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhuma aula encontrada para esta matéria.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default VideoaulasFaculdadeArea;
