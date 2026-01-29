import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Video, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Playlist {
  titulo?: string;
  area: string;
  link: string;
  thumb?: string;
  categoria?: string;
  tempo?: string;
}

const VideoaulasArea = () => {
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
        .select('titulo, area, link, thumb, categoria, tempo')
        .eq('area', decodeURIComponent(area || ''));

      if (error) throw error;

      const playlistsData = (data || []).map((p: any) => ({
        titulo: p.titulo,
        area: p.area,
        link: p.link,
        thumb: p.thumb,
        categoria: p.categoria,
        tempo: p.tempo,
      }));
      setPlaylists(playlistsData);
    } catch (error) {
      console.error('Erro ao buscar playlists:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as playlists",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/aprender')}
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
        onClick={() => navigate('/aprender')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">{decodeURIComponent(area || '')}</h1>
        <p className="text-sm text-muted-foreground">
          {filteredPlaylists.length} playlist{filteredPlaylists.length !== 1 ? 's' : ''} disponíve{filteredPlaylists.length !== 1 ? 'is' : 'l'}
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
                {playlist.thumb ? (
                  <img
                    src={playlist.thumb}
                    alt={playlist.titulo || playlist.area}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-12 h-12 text-accent" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="bg-red-600 rounded-full p-3 shadow-lg">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-base text-foreground leading-tight min-h-[2.5rem]">
                  {playlist.titulo || playlist.area}
                </h3>
                {playlist.tempo && (
                  <p className="text-xs text-muted-foreground mt-1">{playlist.tempo}</p>
                )}
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

export default VideoaulasArea;
