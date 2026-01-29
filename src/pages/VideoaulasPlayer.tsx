import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Play, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";
import { useDeviceType } from "@/hooks/use-device-type";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
}
const VideoaulasPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { goBack } = useHierarchicalNavigation();
  const { isDesktop } = useDeviceType();
  const {
    toast
  } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const playerRef = useRef<HTMLDivElement>(null);
  const playlistLink = searchParams.get('link');
  const areaParam = searchParams.get('area');
  const startVideoId = searchParams.get('videoId') || searchParams.get('startVideo');
  const fromSearch = searchParams.get('fromSearch') === 'true';
  
  // Check if link is actually a playlist (contains 'list=' parameter)
  const isPlaylistLink = playlistLink && playlistLink.includes('list=');
  
  // useEffect para vídeos únicos (não playlists)
  useEffect(() => {
    console.log('📹 [VIDEOAULAS-PLAYER] Query params:', { 
      playlistLink, 
      areaParam, 
      startVideoId, 
      fromSearch,
      isPlaylistLink 
    });

    // Se não é playlist e não tem área, é um vídeo único
    if (!isPlaylistLink && !areaParam) {
      console.log('📹 [VIDEOAULAS-PLAYER] Modo: Vídeo único');
      
      // Tentar extrair ID do vídeo
      let videoId = '';
      
      // Primeiro tentar de startVideoId (pode ser ID ou URL completa)
      if (startVideoId) {
        videoId = extractVideoId(startVideoId) || startVideoId;
      }
      
      // Se não encontrou, tentar de playlistLink (pode ser link de vídeo único)
      if (!videoId && playlistLink) {
        videoId = extractVideoId(playlistLink);
      }
      
      console.log('📹 [VIDEOAULAS-PLAYER] Video ID extraído:', videoId);
      
      if (videoId) {
        // Criar objeto de vídeo
        const video: Video = {
          videoId,
          title: 'Carregando...',
          description: '',
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        };
        
        setCurrentVideo(video);
        setVideos([video]);
        setLoading(false);
        
        // Se veio da busca, scroll até o player
        if (fromSearch && playerRef.current) {
          setTimeout(() => {
            playerRef.current?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }, 500);
        }
      } else {
        console.warn('⚠️ [VIDEOAULAS-PLAYER] Nenhum ID válido encontrado');
        setLoading(false);
        toast({
          title: "Erro",
          description: "Link de vídeo inválido",
          variant: "destructive"
        });
      }
    }
  }, [playlistLink, areaParam, startVideoId, fromSearch, isPlaylistLink]);

  // useEffect para playlists e áreas
  useEffect(() => {
    if (isPlaylistLink || areaParam) {
      console.log('📹 [VIDEOAULAS-PLAYER] Modo:', isPlaylistLink ? 'Playlist' : 'Área');
      fetchVideos();
    }
  }, [isPlaylistLink, areaParam]);
  const extractVideoId = (url: string): string => {
    if (!url) return '';
    
    // Suportar múltiplos formatos de URL do YouTube
    const patterns = [
      /[?&]v=([^&]+)/,           // watch?v=ID
      /youtu\.be\/([^?&]+)/,     // youtu.be/ID
      /embed\/([^?&]+)/,         // embed/ID
      /shorts\/([^?&]+)/,        // shorts/ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return '';
  };
  const fetchVideos = async () => {
    try {
      let videosData: Video[] = [];
      if (areaParam) {
        // Buscar vídeos por área do Supabase (busca flexível)
        console.log('📹 [VIDEOAULAS] Buscando vídeos da área:', areaParam);
        const {
          data,
          error
        } = await supabase.from('VIDEO AULAS-NOVO' as any).select('*').ilike('area', `%${areaParam}%`).order('titulo', {
          ascending: true
        });
        if (error) {
          console.error('❌ [VIDEOAULAS] Erro ao buscar do Supabase:', error);
          toast({
            title: "Erro",
            description: `Erro ao carregar vídeos: ${error.message}`,
            variant: "destructive"
          });
          throw error;
        }
        console.log('✅ [VIDEOAULAS] Vídeos encontrados:', data?.length || 0);
        if (data && data.length > 0) {
          videosData = data.map((videoItem: any) => ({
            videoId: extractVideoId(videoItem.link),
            title: videoItem.titulo,
            description: '',
            thumbnail: videoItem.thumb,
            rawData: videoItem
          })).filter((v: any) => {
            if (!v.videoId) {
              console.warn('⚠️ [VIDEOAULAS] Vídeo sem ID válido:', v.title, 'Link:', v.rawData?.link);
            }
            return v.videoId;
          });
        } else {
          console.warn('⚠️ [VIDEOAULAS] Nenhum vídeo encontrado para área:', areaParam);
        }
      } else if (isPlaylistLink) {
        // Buscar vídeos de playlist do YouTube
        const {
          data,
          error
        } = await supabase.functions.invoke('buscar-videos-playlist', {
          body: {
            playlistLink
          }
        });
        if (error) throw error;
        videosData = data?.videos || [];
      }
      if (videosData.length > 0) {
        setVideos(videosData);

        // Se há um vídeo inicial especificado, começar por ele
        if (startVideoId) {
          const startVideo = videosData.find((v: Video) => v.videoId === startVideoId);
          setCurrentVideo(startVideo || videosData[0]);

          // Se veio da busca, scroll até o player após um delay
          if (fromSearch && playerRef.current) {
            setTimeout(() => {
              playerRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }, 500);
          }
        } else {
          setCurrentVideo(videosData[0]);
        }
      } else {
        throw new Error('Nenhum vídeo encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os vídeos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="px-3 py-4 max-w-6xl mx-auto">
        <Button variant="ghost" size="sm" onClick={goBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <p className="text-muted-foreground">Carregando vídeos...</p>
      </div>;
  }
  if (!currentVideo) {
    return <div className="px-3 py-4 max-w-6xl mx-auto">
        <Button variant="ghost" size="sm" onClick={goBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <p className="text-muted-foreground">Nenhum vídeo encontrado.</p>
      </div>;
  }
  const filteredVideos = videos.filter(video => video.videoId !== currentVideo.videoId && (searchTerm === "" || video.title.toLowerCase().includes(searchTerm.toLowerCase()) || video.description?.toLowerCase().includes(searchTerm.toLowerCase())));
  
  // Desktop Layout
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background">
        {/* Breadcrumb Header */}
        <div className="border-b border-border/30 bg-card/30 p-4">
          <div className="max-w-7xl mx-auto px-8 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => areaParam ? navigate(`/videoaulas/area/${encodeURIComponent(areaParam)}`) : navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <nav className="flex items-center gap-2 text-sm">
              <button 
                onClick={() => navigate('/')} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Início
              </button>
              <span className="text-muted-foreground">›</span>
              <button 
                onClick={() => navigate('/aprender')} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Aprender
              </button>
              <span className="text-muted-foreground">›</span>
              {areaParam ? (
                <>
                  <button 
                    onClick={() => navigate(`/videoaulas/area/${encodeURIComponent(areaParam)}`)} 
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {areaParam}
                  </button>
                  <span className="text-muted-foreground">›</span>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/videoaulas')} 
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Videoaulas
                  </button>
                  <span className="text-muted-foreground">›</span>
                </>
              )}
              <span className="text-foreground font-medium truncate max-w-[300px]">{currentVideo?.title}</span>
            </nav>
          </div>
        </div>

        {/* Conteúdo principal - Layout Desktop */}
        <div className="max-w-7xl mx-auto px-8 flex gap-6 py-6">
          {/* Sidebar esquerda - Lista de vídeos */}
          <div className="w-80 flex-shrink-0 border-r border-border/30">
            <div className="pr-4">
              <h3 className="text-sm font-bold text-foreground mb-1">
                {areaParam || 'Playlist'}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">{videos.length} vídeos</p>
              
              {/* Busca */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10 pr-8 h-9 text-sm"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="pr-4 space-y-1">
                {/* Vídeo atual primeiro */}
                <button
                  className="w-full flex gap-3 p-2 text-left bg-primary/15 border-l-4 border-l-primary"
                >
                  <div className="w-20 h-14 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={currentVideo.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2 leading-tight text-primary">
                      {currentVideo.title}
                    </p>
                  </div>
                </button>
                
                {/* Outros vídeos */}
                {filteredVideos.map((video) => (
                  <button
                    key={video.videoId}
                    onClick={() => setCurrentVideo(video)}
                    className="w-full flex gap-3 p-2 text-left transition-all border-l-4 border-l-transparent hover:bg-secondary/30"
                  >
                    <div className="w-20 h-14 rounded-md overflow-hidden flex-shrink-0 relative group">
                      <img
                        src={video.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2 leading-tight text-foreground">
                        {video.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Área principal - Player */}
          <div className="flex-1" ref={playerRef}>
            <h1 className="text-xl font-bold mb-4">{currentVideo.title}</h1>
            
            <div className={`transition-all duration-500 ${fromSearch ? 'ring-4 ring-accent/50 rounded-lg' : ''}`}>
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${window.location.origin}&vq=hd1080`}
                  title={currentVideo.title} 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                  className="w-full h-full" 
                />
              </div>
            </div>
            
            {currentVideo.description && (
              <p className="text-sm text-muted-foreground mt-4">
                {currentVideo.description}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile Layout (original)
  return (
    <div className="px-3 py-4 max-w-6xl mx-auto pb-20">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <button 
          onClick={() => navigate('/aprender')} 
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          Aprender
        </button>
        <span className="text-muted-foreground">›</span>
        {areaParam ? (
          <>
            <button 
              onClick={() => navigate(`/videoaulas/area/${encodeURIComponent(areaParam)}`)} 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {areaParam}
            </button>
            <span className="text-muted-foreground">›</span>
          </>
        ) : (
          <>
            <button 
              onClick={() => navigate('/videoaulas')} 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Videoaulas
            </button>
            <span className="text-muted-foreground">›</span>
          </>
        )}
        <span className="text-foreground font-medium truncate">{currentVideo?.title}</span>
      </div>

      {/* Botão Voltar */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => areaParam ? navigate(`/videoaulas/area/${encodeURIComponent(areaParam)}`) : navigate(-1)} 
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {areaParam ? `Voltar para ${areaParam}` : 'Voltar'}
      </Button>

      {/* Barra de Pesquisa */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input type="text" placeholder="Pesquisar nesta playlist..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-10" />
          {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>}
        </div>
        {searchTerm && <p className="text-sm text-muted-foreground mt-2">
            {filteredVideos.length} {filteredVideos.length === 1 ? "vídeo encontrado" : "vídeos encontrados"}
          </p>}
      </div>

      {/* Player */}
      <div ref={playerRef} className={`mb-6 transition-all duration-500 ${fromSearch ? 'ring-4 ring-accent/50 rounded-lg' : ''}`}>
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl">
          <iframe 
            width="100%" 
            height="100%" 
            src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${window.location.origin}&vq=hd1080`}
            title={currentVideo.title} 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen 
            className="w-full h-full" 
          />
        </div>
        <div className="mt-4">
          <h1 className="text-xl md:text-2xl font-bold mb-2">{currentVideo.title}</h1>
          {currentVideo.description && <p className="text-sm text-muted-foreground line-clamp-3">
              {currentVideo.description}
            </p>}
        </div>
      </div>

      {/* Lista de vídeos */}
      <div>
        <h2 className="text-lg font-bold mb-4">
          {searchTerm ? "Resultados da busca" : `Outros vídeos ${areaParam ? `de ${areaParam}` : 'da playlist'}`}
        </h2>
        {filteredVideos.length === 0 ? <p className="text-muted-foreground text-center py-8">
            {searchTerm ? "Nenhum vídeo encontrado com esse termo" : "Nenhum outro vídeo disponível"}
          </p> : <div className="space-y-3">
            {filteredVideos.map(video => <Card key={video.videoId} className="cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all border border-border hover:border-accent/50 bg-card group animate-fade-in" onClick={() => {
          setCurrentVideo(video);
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }}>
                <CardContent className="p-3 flex gap-3">
                  <div className="relative w-40 min-w-40 aspect-video bg-secondary rounded overflow-hidden">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Play className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 text-foreground break-words leading-tight">
                      {video.title}
                    </h3>
                    {video.description && <p className="text-xs text-muted-foreground line-clamp-2">
                        {video.description}
                      </p>}
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>
    </div>
  );
};
export default VideoaulasPlayer;