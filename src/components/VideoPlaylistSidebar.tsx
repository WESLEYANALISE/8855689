import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Play, ArrowLeft, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Video {
  videoId: string;
  title: string;
  thumbnail?: string;
}

export const VideoPlaylistSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const currentVideoId = searchParams.get('videoId') || searchParams.get('startVideo');
  const areaParam = searchParams.get('area');

  useEffect(() => {
    const loadVideos = async () => {
      if (areaParam) {
        const { data } = await supabase
          .from('VIDEO AULAS-NOVO' as any)
          .select('*')
          .ilike('area', `%${areaParam}%`)
          .order('titulo', { ascending: true });
        
        if (data) {
          setVideos(data.map((v: any) => ({
            videoId: extractVideoId(v.link),
            title: v.titulo,
            thumbnail: v.thumb
          })));
        }
      }
    };
    loadVideos();
  }, [areaParam]);

  const extractVideoId = (url: string): string => {
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/);
    return match ? match[1] : '';
  };

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate('/videoaulas')}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-sm font-semibold">Playlist</h3>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar vídeo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Lista de vídeos */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredVideos.map((video) => (
            <button
              key={video.videoId}
              onClick={() => {
                const url = new URLSearchParams(window.location.search);
                url.set('videoId', video.videoId);
                navigate(`${location.pathname}?${url.toString()}`);
              }}
              className={cn(
                "w-full flex items-start gap-2 p-2 rounded-lg transition-colors text-left",
                currentVideoId === video.videoId
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              {/* Thumbnail */}
              <div className="w-20 h-12 bg-secondary rounded flex-shrink-0 overflow-hidden">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Título */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium line-clamp-2">{video.title}</p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
