import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Video, Loader2, Search, Play, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AreaStats {
  area: string;
  count: number;
  thumbnail: string | null;
}

const VideoaulasOABPrimeiraFase = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Buscar estatísticas agrupadas por área
  const { data: areas, isLoading } = useQuery({
    queryKey: ["videoaulas-oab-1fase-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_oab_primeira_fase")
        .select("area, thumbnail")
        .order("area", { ascending: true });
      
      if (error) throw error;
      
      // Agrupar por área
      const areaMap: Record<string, AreaStats> = {};
      (data || []).forEach((v: any) => {
        if (!areaMap[v.area]) {
          areaMap[v.area] = { 
            area: v.area, 
            count: 0, 
            thumbnail: v.thumbnail 
          };
        }
        areaMap[v.area].count++;
      });
      
      return Object.values(areaMap).sort((a, b) => 
        a.area.localeCompare(b.area, 'pt-BR')
      );
    },
    staleTime: 1000 * 60 * 10,
  });

  const filteredAreas = areas?.filter(a => 
    a.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Video className="w-5 h-5 text-red-500" />
                Videoaulas OAB 1ª Fase
              </h1>
              <p className="text-sm text-muted-foreground">
                {areas?.reduce((acc, a) => acc + a.count, 0) || 0} aulas em {areas?.length || 0} áreas
              </p>
            </div>
          </div>

          {/* Barra de pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar área..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : filteredAreas && filteredAreas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAreas.map((area) => (
              <AreaCard key={area.area} area={area} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {search ? "Nenhuma área encontrada" : "Nenhuma videoaula disponível"}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              Execute a sincronização para importar as videoaulas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de Card de Área
const AreaCard = ({ area }: { area: AreaStats }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      onClick={() => navigate(`/videoaulas/oab-1fase/${encodeURIComponent(area.area)}`)}
      className="cursor-pointer group"
    >
      <div className="flex flex-col rounded-xl bg-card border border-border shadow-lg overflow-hidden h-full transition-all hover:border-red-500/50 hover:shadow-red-500/10">
        {/* Thumbnail */}
        <div className="relative w-full aspect-video overflow-hidden bg-neutral-900">
          {area.thumbnail ? (
            <>
              <div className={cn(
                "absolute inset-0 bg-neutral-800 animate-pulse transition-opacity",
                imageLoaded ? "opacity-0" : "opacity-100"
              )} />
              <img
                src={area.thumbnail}
                alt={area.area}
                className={cn(
                  "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 to-background">
              <Video className="w-12 h-12 text-red-400/50" />
            </div>
          )}
          
          {/* Overlay com play */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-600/80 group-hover:bg-red-600 flex items-center justify-center transition-colors">
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            </div>
          </div>

          {/* Badge de quantidade */}
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs font-medium text-white bg-red-600 shadow-md">
            {area.count} {area.count === 1 ? 'aula' : 'aulas'}
          </span>
        </div>

        {/* Título */}
        <div className="p-3 flex-1">
          <h3 className="text-sm font-semibold text-card-foreground line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
            {area.area}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default VideoaulasOABPrimeiraFase;
