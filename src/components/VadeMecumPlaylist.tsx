import { Play, Pause, Music2, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useEffect } from "react";

interface Article {
  id: number;
  "Número do Artigo": string;
  Artigo: string;
  Narração: string;
}

interface VadeMecumPlaylistProps {
  articles: Article[];
  codigoNome: string;
}

export const VadeMecumPlaylist = ({ articles, codigoNome }: VadeMecumPlaylistProps) => {
  const { playAudio, setPlaylist, currentAudio, isPlaying, togglePlayPause } = useAudioPlayer();

  // Preparar playlist quando componente monta
  useEffect(() => {
    const audioItems = articles.map((article) => ({
      id: article.id,
      titulo: `Art. ${article["Número do Artigo"]} - ${codigoNome}`,
      url_audio: article.Narração,
      imagem_miniatura: "/logo.webp",
      descricao: article.Artigo,
      area: codigoNome,
      tema: `Artigo ${article["Número do Artigo"]}`
    }));
    
    setPlaylist(audioItems);
  }, [articles, codigoNome, setPlaylist]);

  const handlePlayArticle = (article: Article) => {
    playAudio({
      id: article.id,
      titulo: `Art. ${article["Número do Artigo"]} - ${codigoNome}`,
      url_audio: article.Narração,
      imagem_miniatura: "/logo.webp",
      descricao: article.Artigo,
      area: codigoNome,
      tema: `Artigo ${article["Número do Artigo"]}`
    });
  };

  const isCurrentlyPlaying = (article: Article) => {
    return currentAudio?.id === article.id && isPlaying;
  };

  const isCurrent = (article: Article) => {
    return currentAudio?.id === article.id;
  };

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Music2 className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Nenhum áudio disponível
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Este código ainda não possui artigos com narração em áudio. 
        </p>
      </div>
    );
  }

  const getPreviewText = (content: string) => {
    const cleanText = content.replace(/\n/g, ' ').trim();
    return cleanText.length > 120 ? cleanText.substring(0, 120) + '...' : cleanText;
  };

  return (
    <div className="space-y-2 pb-20">
      {articles.map((article) => {
        const isActive = isCurrentlyPlaying(article);
        const isCurrentTrack = isCurrent(article);
        const preview = getPreviewText(article.Artigo);

        return (
          <Card
            key={article.id}
            className={`cursor-pointer hover:bg-muted/50 transition-colors border-l-4 ${
              isActive 
                ? 'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] bg-amber-500/5' 
                : ''
            }`}
            style={{
              borderLeftColor: "hsl(38, 92%, 50%)",
            }}
            onClick={() => {
              if (isActive) {
                togglePlayPause();
              } else {
                handlePlayArticle(article);
              }
            }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white'
                      : isCurrentTrack
                        ? 'bg-amber-500/20 text-amber-500'
                        : 'bg-muted text-muted-foreground hover:bg-amber-500/20 hover:text-amber-500'
                  }`}
                >
                  {isActive ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm ${isActive ? 'text-amber-500' : ''}`}>
                  Art. {article["Número do Artigo"]}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {preview}
                </p>
              </div>
              {/* Indicador de reprodução */}
              {isActive && (
                <div className="flex-shrink-0 flex items-end gap-0.5 h-4">
                  <div className="w-0.5 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <div className="w-0.5 h-3 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-0.5 h-4 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  <div className="w-0.5 h-2 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};