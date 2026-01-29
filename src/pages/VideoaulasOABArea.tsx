import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Play, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeviceType } from "@/hooks/use-device-type";

interface Videoaula {
  id: number;
  titulo: string | null;
  link: string | null;
  thumb: string | null;
  tempo: string | null;
}

const VideoaulasOABArea = () => {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const decodedArea = area ? decodeURIComponent(area) : "";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const { isDesktop } = useDeviceType();

  const { data: videoaulas, isLoading } = useQuery({
    queryKey: ["videoaulas-oab-area", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO")
        .select("id, titulo, link, thumb, tempo")
        .ilike("area", `%${decodedArea}%`)
        .order("titulo", { ascending: true });

      if (error) throw error;
      return data as Videoaula[];
    },
    enabled: !!decodedArea,
  });

  // Filtrar videoaulas pelo termo de pesquisa
  const filteredVideoaulas = videoaulas
    ?.filter((aula) =>
      aula.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    ?.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "", "pt-BR"));

  // Extrair video ID do YouTube para thumbnail
  const getYouTubeThumbnail = (link: string, quality: 'mq' | 'hq' | 'maxres' = 'mq') => {
    const match = link?.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (match?.[1]) {
      const qualityMap = { mq: 'mqdefault', hq: 'hqdefault', maxres: 'maxresdefault' };
      return `https://img.youtube.com/vi/${match[1]}/${qualityMap[quality]}.jpg`;
    }
    return null;
  };

  // Navegar para a visualização da videoaula
  const handleVideoClick = (videoaula: Videoaula) => {
    if (!videoaula.id || !videoaula.titulo) return;
    navigate(`/videoaulas/oab/${encodeURIComponent(decodedArea)}/${videoaula.id}`);
  };

  // Selecionar vídeo no desktop (sem navegar)
  const handleVideoSelect = (index: number) => {
    setSelectedVideoIndex(index);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const selectedVideo = filteredVideoaulas?.[selectedVideoIndex];
  const selectedThumbnail = selectedVideo?.thumb || (selectedVideo?.link ? getYouTubeThumbnail(selectedVideo.link, 'maxres') : null);

  // Layout Desktop - Duas Colunas
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-white/5">
          <div className="px-6 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/videoaulas-oab")}
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
        </div>

        {/* Layout de Duas Colunas */}
        <div className="flex h-[calc(100vh-60px)]">
          {/* Sidebar Esquerda - Lista de Vídeos */}
          <div className="w-80 border-r border-white/5 flex flex-col bg-neutral-950/50">
            {/* Pesquisa */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar aula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-neutral-900/80 border-white/10 focus:border-red-500/50 text-sm"
                />
              </div>
            </div>

            {/* Lista de Vídeos */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1.5">
                {filteredVideoaulas?.map((aula, index) => {
                  const thumbnail = aula.thumb || (aula.link ? getYouTubeThumbnail(aula.link) : null);
                  const numero = String(index + 1).padStart(2, "0");
                  const isSelected = index === selectedVideoIndex;

                  if (!aula.titulo || !aula.link) return null;

                  return (
                    <button
                      key={`${aula.id}-${index}`}
                      onClick={() => handleVideoSelect(index)}
                      className={`w-full rounded-lg p-2 flex gap-2.5 items-start transition-all group text-left ${
                        isSelected
                          ? "bg-red-500/20 border border-red-500/40"
                          : "bg-neutral-900/50 hover:bg-neutral-800/70 border border-transparent"
                      }`}
                    >
                      {/* Thumbnail pequena */}
                      <div className="shrink-0 relative w-24 aspect-video rounded overflow-hidden bg-neutral-800">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={aula.titulo}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isSelected ? "bg-red-600" : "bg-red-600/60"
                          }`}>
                            <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
                          </div>
                        </div>
                        {/* Número */}
                        <div className={`absolute bottom-0 left-0 px-1 py-0.5 text-[9px] font-bold rounded-tr ${
                          isSelected ? "bg-red-600 text-white" : "bg-neutral-900 text-white/80"
                        }`}>
                          {numero}
                        </div>
                      </div>

                      {/* Título */}
                      <div className="flex-1 min-w-0 py-0.5">
                        <h3 className={`text-xs font-medium line-clamp-2 leading-tight ${
                          isSelected ? "text-red-400" : "text-foreground group-hover:text-red-400"
                        }`}>
                          {aula.titulo}
                        </h3>
                        {aula.tempo && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {aula.tempo}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Área Principal - Vídeo em Destaque */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
            {selectedVideo ? (
              <div className="w-full max-w-4xl">
                {/* Capa Grande com Play */}
                <button
                  onClick={() => handleVideoClick(selectedVideo)}
                  className="w-full relative aspect-video rounded-2xl overflow-hidden bg-neutral-900 group shadow-2xl"
                >
                  {selectedThumbnail ? (
                    <img
                      src={selectedThumbnail}
                      alt={selectedVideo.titulo || ""}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 via-background to-background">
                      <Play className="w-20 h-20 text-red-400/50" />
                    </div>
                  )}
                  
                  {/* Overlay escuro */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  
                  {/* Ícone de Play Grande Central */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-red-600/80 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300">
                      <Play className="w-10 h-10 text-white ml-1" fill="white" />
                    </div>
                  </div>

                  {/* Número da aula */}
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-lg shadow-lg">
                    {String(selectedVideoIndex + 1).padStart(2, "0")}
                  </div>

                  {/* Duração */}
                  {selectedVideo.tempo && (
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 text-white text-sm font-medium rounded-lg">
                      {selectedVideo.tempo}
                    </div>
                  )}
                </button>

                {/* Título do Vídeo */}
                <div className="mt-6 text-center">
                  <h2 className="text-2xl font-bold text-foreground">
                    {selectedVideo.titulo}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    {decodedArea}
                  </p>
                  <Button
                    onClick={() => handleVideoClick(selectedVideo)}
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6"
                  >
                    <Play className="w-4 h-4 mr-2" fill="white" />
                    Assistir Aula
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Selecione uma aula para visualizar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Layout Mobile - Lista Tradicional
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-white/5">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/videoaulas-oab")}
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
                key={`${aula.id}-${index}`}
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

                {/* Conteúdo - título completo */}
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
                Nenhuma aula encontrada para esta área.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default VideoaulasOABArea;
