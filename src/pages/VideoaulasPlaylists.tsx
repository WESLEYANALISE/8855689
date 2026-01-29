import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Play, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Playlist {
  titulo?: string;
  area: string;
  link: string;
  thumb?: string;
  categoria?: string;
  thumbnail?: string;
}

const VideoaulasPlaylists = () => {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPlaylists();
  }, [area]);

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('VIDEO AULAS-NOVO' as any)
        .select('titulo, area, link, thumb, categoria')
        .eq('area', decodeURIComponent(area || ''));

      if (error) throw error;

      // Inicializar playlists com thumb se existir, senão usar null
      const playlistsData = (data || []).map((p: any) => ({ 
        titulo: p.titulo,
        area: p.area, 
        link: p.link,
        thumb: p.thumb,
        categoria: p.categoria,
        thumbnail: p.thumb || null 
      }));
      setPlaylists(playlistsData);
      setLoading(false);

      // Carregar TODAS as thumbnails em PARALELO instantaneamente
      await Promise.allSettled(
        (data || []).map(async (playlist: any) => {
          try {
            const { data: videoData, error: functionError } = await supabase.functions.invoke(
              'buscar-videos-playlist',
              { body: { playlistLink: playlist.link } }
            );

            if (!functionError && videoData?.videos?.[0]?.thumbnail) {
              setPlaylists(prev => 
                prev.map(p => 
                  p.link === playlist.link 
                    ? { ...p, thumbnail: videoData.videos[0].thumbnail }
                    : p
                )
              );
            }
          } catch (err) {
            console.error('Erro ao carregar thumbnail:', err);
          }
        })
      );
    } catch (error) {
      console.error('Erro ao buscar playlists:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as playlists",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/videoaulas')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold mb-1">{decodeURIComponent(area || '')}</h1>
          <p className="text-sm text-muted-foreground">Carregando playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/videoaulas')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">{decodeURIComponent(area || '')}</h1>
        <p className="text-sm text-muted-foreground">
          Selecione uma playlist para assistir
        </p>
      </div>

      {/* Barra de Pesquisa */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-xl mb-4">
        <Search className="w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar playlist por nome..."
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredPlaylists.length > 0 ? (
          filteredPlaylists.map((playlist, idx) => (
            <Card
              key={`${playlist.link}-${idx}`}
              className="cursor-pointer hover:scale-105 hover:shadow-2xl hover:-translate-y-1 transition-all border border-accent/20 hover:border-accent/50 bg-card group shadow-xl overflow-hidden"
              onClick={() => navigate(`/videoaulas/player?link=${encodeURIComponent(playlist.link)}`)}
            >
              <div className="relative aspect-video bg-secondary">
                {playlist.thumbnail ? (
                  <img
                    src={playlist.thumbnail}
                    alt={playlist.area}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-12 h-12 text-accent" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Play className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-base text-foreground">{playlist.area}</h3>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Nenhuma playlist encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoaulasPlaylists;
