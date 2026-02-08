import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Video, ArrowLeft, Search, Loader2, Play, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import HeroBackground from "@/components/HeroBackground";
import heroVideoaulas from "@/assets/hero-videoaulas.webp";
import BackButton from "@/components/BackButton";
import { AREAS_PLAYLISTS } from "@/data/videoaulasAreasPlaylists";
import { supabase } from "@/integrations/supabase/client";

interface VideoItem {
  id: string;
  videoId: string;
  titulo: string;
  thumbnail: string;
  duracao?: string;
}

// Função para extrair ID do vídeo de uma URL do YouTube
const extractVideoId = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : '';
};

const VideoCard = ({ video, index, areaNome }: { video: VideoItem; index: number; areaNome: string }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handleClick = () => {
    // Navegar para o player com o vídeo específico
    navigate(`/videoaulas/player?link=https://www.youtube.com/watch?v=${video.videoId}&area=${encodeURIComponent(areaNome)}`);
  };

  return (
    <Card
      onClick={handleClick}
      className="cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all border border-accent/20 hover:border-red-500/50 bg-card group shadow-xl overflow-hidden"
    >
      <div className="relative aspect-video bg-secondary overflow-hidden">
        <div 
          className={cn(
            "absolute inset-0 skeleton-shimmer transition-opacity duration-300",
            imageLoaded ? "opacity-0" : "opacity-100"
          )}
        />
        
        <img
          src={video.thumbnail}
          alt={video.titulo}
          loading={index < 6 ? "eager" : "lazy"}
          className={cn(
            "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/50 transition-colors">
          {video.duracao && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {video.duracao}
            </div>
          )}
        </div>
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-red-600 rounded-full p-3 shadow-lg">
            <Play className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
      
      <CardContent className="p-3">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-red-400 transition-colors">
          {video.titulo}
        </h3>
      </CardContent>
    </Card>
  );
};

const VideoaulasAreaVideos = () => {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  
  const decodedArea = decodeURIComponent(area || '');
  
  // Encontrar a playlist correspondente à área
  const areaPlaylist = AREAS_PLAYLISTS.find(
    p => p.nome.toLowerCase() === decodedArea.toLowerCase()
  );

  // Buscar vídeos da playlist (via edge function ou diretamente do banco)
  const { data: videos, isLoading, error } = useQuery({
    queryKey: ['videoaulas-area-videos', areaPlaylist?.playlistId],
    queryFn: async () => {
      if (!areaPlaylist) return [];
      
      // Primeiro, tentar buscar do banco de dados (se já foram indexados)
      const { data: dbVideos, error: dbError } = await supabase
        .from('VIDEO AULAS-NOVO' as any)
        .select('*')
        .ilike('area', `%${decodedArea}%`)
        .order('titulo', { ascending: true });
      
      if (dbVideos && dbVideos.length > 0) {
        return dbVideos.map((v: any) => ({
          id: v.id?.toString() || extractVideoId(v.link),
          videoId: extractVideoId(v.link),
          titulo: v.titulo || 'Sem título',
          thumbnail: v.thumb || `https://img.youtube.com/vi/${extractVideoId(v.link)}/mqdefault.jpg`,
          duracao: v.tempo
        }));
      }
      
      // Se não encontrar no banco, usar os dados da playlist via API do YouTube
      // Por agora, retornar array vazio e mostrar link externo
      return [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutos de cache
    enabled: !!areaPlaylist
  });

  const filteredVideos = (videos || []).filter((video: VideoItem) =>
    video.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!areaPlaylist) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto">
        <BackButton to="/videoaulas/areas" className="mb-4" />
        <div className="text-center py-12">
          <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Área não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            A área "{decodedArea}" não foi encontrada.
          </p>
          <Button onClick={() => navigate('/videoaulas/areas')}>
            Voltar para Áreas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto relative min-h-screen">
      <HeroBackground imageSrc={heroVideoaulas} height="50vh" />
      
      <div className="relative z-10">
        {/* Botão Voltar */}
        <BackButton to="/videoaulas/areas" className="mb-4" />
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold">{decodedArea}</h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Carregando...' : `${filteredVideos.length} vídeos disponíveis`}
              </p>
            </div>
          </div>
          
          {/* Link direto para playlist */}
          <a
            href={areaPlaylist.playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors mt-2"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir playlist no YouTube
          </a>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-xl mb-6">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar vídeo..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-400" />
          </div>
        )}

        {/* Grid de vídeos */}
        {!isLoading && filteredVideos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video: VideoItem, index: number) => (
              <VideoCard 
                key={video.id} 
                video={video} 
                index={index}
                areaNome={decodedArea}
              />
            ))}
          </div>
        )}

        {/* Sem vídeos no banco - mostrar opção de acessar playlist */}
        {!isLoading && filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">Playlist disponível no YouTube</h2>
            <p className="text-muted-foreground mb-6">
              Os vídeos desta área ainda não foram indexados. 
              Você pode assistir diretamente no YouTube.
            </p>
            <Button
              onClick={() => window.open(areaPlaylist.playlistUrl, '_blank')}
              className="bg-red-600 hover:bg-red-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Assistir no YouTube
            </Button>
          </div>
        )}

        {/* Busca sem resultados */}
        {!isLoading && searchTerm && filteredVideos.length === 0 && videos && videos.length > 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum vídeo encontrado para "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoaulasAreaVideos;
