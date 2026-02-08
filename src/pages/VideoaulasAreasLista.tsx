import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, ArrowLeft, Search, Loader2, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import HeroBackground from "@/components/HeroBackground";
import heroVideoaulas from "@/assets/hero-videoaulas.webp";
import BackButton from "@/components/BackButton";
import { AREAS_PLAYLISTS, AreaPlaylist } from "@/data/videoaulasAreasPlaylists";

const AreaCard = ({ area, index }: { area: AreaPlaylist; index: number }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Para playlists, usar a thumbnail da playlist do YouTube
  // O formato é: https://i.ytimg.com/vi/PRIMEIRO_VIDEO_ID/mqdefault.jpg
  // Como não temos o ID do primeiro vídeo, usamos um ícone padrão com fallback para o gradient
  const isPlaylist = area.playlistId.startsWith('PL');
  const thumbnail = isPlaylist 
    ? null // Playlists não têm thumbnail direta, mostraremos o ícone
    : `https://img.youtube.com/vi/${area.playlistId}/mqdefault.jpg`;
  
  const handleClick = () => {
    navigate(`/videoaulas/areas/${encodeURIComponent(area.nome)}`);
  };

  return (
    <Card
      onClick={handleClick}
      className="cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all border border-accent/20 hover:border-red-500/50 bg-card group shadow-xl overflow-hidden"
    >
      <div className="relative aspect-video bg-secondary overflow-hidden">
        {/* Skeleton while loading */}
        <div 
          className={cn(
            "absolute inset-0 skeleton-shimmer transition-opacity duration-300",
            imageLoaded || imageError ? "opacity-0" : "opacity-100"
          )}
        />
        
        {thumbnail && !imageError ? (
          <img
            src={thumbnail}
            alt={area.nome}
            loading={index < 4 ? "eager" : "lazy"}
            className={cn(
              "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/60 via-red-800/40 to-red-950/70">
            <Video className="w-12 h-12 text-red-400/80" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/50 transition-colors">
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-semibold text-sm leading-tight drop-shadow-lg">
              {area.nome}
            </h3>
          </div>
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-red-600 rounded-full p-3 shadow-lg">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const VideoaulasAreasLista = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAreas = AREAS_PLAYLISTS.filter(area =>
    area.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto relative min-h-screen">
      <HeroBackground imageSrc={heroVideoaulas} height="50vh" />
      
      <div className="relative z-10">
        {/* Botão Voltar */}
        <BackButton to="/videoaulas" className="mb-4" />
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Áreas do Direito</h1>
              <p className="text-sm text-muted-foreground">
                {AREAS_PLAYLISTS.length} áreas disponíveis
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-xl mb-6">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar área..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid de áreas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAreas.map((area, index) => (
            <AreaCard key={area.playlistId} area={area} index={index} />
          ))}
        </div>

        {filteredAreas.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma área encontrada para "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoaulasAreasLista;
