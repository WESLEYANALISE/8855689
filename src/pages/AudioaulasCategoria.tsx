import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Headphones, Brain, BookOpen, Play, Pause, Image as ImageIcon, Shuffle, ListMusic, Lock, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAudioPlayer, type AudioItem } from "@/contexts/AudioPlayerContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const AudioaulasCategoria = () => {
  const { categoria, area } = useParams();
  const navigate = useNavigate();
  const { playAudio, setPlaylist, currentAudio, isPlaying, togglePlayPause } = useAudioPlayer();
  const { isPremium } = useSubscription();

  const decodedArea = area ? decodeURIComponent(area) : "";

  const { data: audios, isLoading } = useQuery({
    queryKey: ["audioaulas-categoria", categoria, decodedArea],
    queryFn: async () => {
      let result: AudioItem[] = [];

      if (categoria === "audioaulas") {
        const { data, error } = await supabase
          .from("AUDIO-AULA" as any)
          .select("*")
          .eq("area", decodedArea)
          .not("url_audio", "is", null)
          .order("sequencia");

        if (error) throw error;

        result = (data as any[])?.map((item) => ({
          id: item.id,
          titulo: item.titulo || item.tema || "Sem título",
          url_audio: item.url_audio,
          imagem_miniatura: item.imagem_miniatura || "",
          descricao: item.descricao || "",
          area: item.area || "",
          tema: item.tema || "",
          tipo: "audioaula" as const,
        })) || [];
      } else if (categoria === "flashcards") {
        // Buscar flashcards com todos os áudios (pergunta, resposta, exemplo)
        const { data, error } = await supabase
          .from("FLASHCARDS - ARTIGOS LEI" as any)
          .select('*, "audio-pergunta", "audio-resposta", url_audio_exemplo')
          .eq("area", decodedArea)
          .not('"audio-pergunta"', "is", null)
          .order("id");

        if (error) throw error;

        result = (data as any[])?.map((item) => ({
          id: item.id,
          titulo: item.tema || item.pergunta?.substring(0, 50) || "Flashcard",
          url_audio: item["audio-pergunta"],
          url_audio_resposta: item["audio-resposta"] || null,
          url_audio_exemplo: item.url_audio_exemplo || null,
          imagem_miniatura: item.imagem_exemplo || "",
          descricao: item.pergunta || "",
          area: item.area || "",
          tema: item.tema || "",
          tipo: "flashcard" as const,
          texto_exemplo: item.exemplo,
          url_imagem_exemplo: item.imagem_exemplo,
          pergunta: item.pergunta,
          resposta: item.resposta,
        })) || [];
      } else if (categoria === "resumos") {
        // CORRIGIDO: usar "url_audio_resumo"
        const { data, error } = await supabase
          .from("RESUMO" as any)
          .select("*")
          .eq("area", decodedArea)
          .not("url_audio_resumo", "is", null)
          .order("id");

        if (error) throw error;

        result = (data as any[])?.map((item) => ({
          id: item.id,
          titulo: item.titulo || item.tema || "Resumo",
          url_audio: item.url_audio_resumo,
          imagem_miniatura: item.url_imagem || "",
          descricao: item.texto || "",
          area: item.area || "",
          tema: item.tema || "",
          tipo: "resumo" as const,
          texto_exemplo: item.texto,
          url_imagem_exemplo: item.url_imagem,
        })) || [];
      }

      return result;
    },
    enabled: !!categoria && !!decodedArea,
  });

  // Limite de 20% para usuários gratuitos
  const limiteGratis = Math.max(1, Math.ceil((audios || []).length * 0.20));

  const handleLockedClick = () => {
    toast.error("Conteúdo Premium", {
      description: "Assine para acessar todos os áudios",
      action: {
        label: "Ver Planos",
        onClick: () => navigate('/assinatura')
      }
    });
  };

  const handlePlayAudio = (audio: AudioItem, index: number) => {
    const isLocked = !isPremium && index >= limiteGratis;
    
    if (isLocked) {
      handleLockedClick();
      return;
    }
    
    if (currentAudio?.id === audio.id && currentAudio?.tipo === audio.tipo) {
      togglePlayPause();
    } else {
      // Define a playlist a partir do áudio clicado (apenas áudios liberados)
      if (audios) {
        const audiosLiberados = isPremium ? audios : audios.slice(0, limiteGratis);
        const playlistFromIndex = audiosLiberados.slice(audiosLiberados.indexOf(audio));
        setPlaylist(playlistFromIndex.length > 0 ? playlistFromIndex : [audio]);
      }
      playAudio(audio);
    }
  };

  const handlePlayAll = () => {
    if (audios && audios.length > 0) {
      const audiosLiberados = isPremium ? audios : audios.slice(0, limiteGratis);
      setPlaylist(audiosLiberados);
      playAudio(audiosLiberados[0]);
    }
  };

  const handleShuffle = () => {
    if (audios && audios.length > 0) {
      const audiosLiberados = isPremium ? audios : audios.slice(0, limiteGratis);
      const shuffled = [...audiosLiberados].sort(() => Math.random() - 0.5);
      setPlaylist(shuffled);
      playAudio(shuffled[0]);
    }
  };

  const getCategoriaLabel = () => {
    switch (categoria) {
      case "audioaulas": return "Audioaulas";
      case "flashcards": return "Flashcards";
      case "resumos": return "Resumos";
      default: return "Áudios";
    }
  };

  const getCategoriaIcon = () => {
    switch (categoria) {
      case "audioaulas": return Headphones;
      case "flashcards": return Brain;
      case "resumos": return BookOpen;
      default: return Headphones;
    }
  };

  const getGradientClass = () => {
    switch (categoria) {
      case "flashcards": return "from-purple-600 to-purple-800";
      case "resumos": return "from-emerald-600 to-emerald-800";
      default: return "from-rose-600 to-rose-800";
    }
  };

  const Icon = getCategoriaIcon();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/audioaulas")}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradientClass()} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold line-clamp-1">{decodedArea}</h1>
            <p className="text-sm text-muted-foreground">
              {getCategoriaLabel()} • {audios?.length || 0} áudios
              {!isPremium && audios && audios.length > limiteGratis && (
                <span className="text-amber-500 ml-1">({limiteGratis} grátis)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {audios && audios.length > 0 && (
        <div className="flex gap-3 mb-6">
          <Button
            onClick={handlePlayAll}
            className={`flex-1 bg-gradient-to-r ${getGradientClass()} hover:opacity-90`}
          >
            <ListMusic className="w-4 h-4 mr-2" />
            Reproduzir em sequência
          </Button>
          <Button
            onClick={handleShuffle}
            variant="outline"
            className="px-4"
          >
            <Shuffle className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Lista de Áudios */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-3">
          {audios?.map((audio, index) => {
            const isCurrentPlaying = currentAudio?.id === audio.id && currentAudio?.tipo === audio.tipo;
            const isLocked = !isPremium && index >= limiteGratis;
            
            return (
              <Card
                key={`${audio.tipo}-${audio.id}`}
                className={`cursor-pointer transition-all hover:shadow-lg border-0 bg-card/50 backdrop-blur-sm group ${
                  isCurrentPlaying ? "ring-2 ring-accent bg-accent/10" : ""
                } ${isLocked ? "opacity-70" : ""}`}
                onClick={() => handlePlayAudio(audio, index)}
              >
                <CardContent className="p-4 flex items-center gap-4 relative">
                  {/* Badge Premium para itens bloqueados */}
                  {isLocked && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/90 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                      <Crown className="w-3 h-3" />
                      Premium
                    </div>
                  )}
                  
                  {/* Number indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isLocked ? "bg-amber-500/20 text-amber-500" :
                    isCurrentPlaying ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : isCurrentPlaying && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>

                  {/* Thumbnail ou ícone */}
                  <div className="relative shrink-0">
                    {audio.imagem_miniatura || audio.url_imagem_exemplo ? (
                      <img
                        src={audio.imagem_miniatura || audio.url_imagem_exemplo}
                        alt={audio.titulo}
                        className={`w-14 h-14 rounded-lg object-cover ${isLocked ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${getGradientClass()} flex items-center justify-center ${isLocked ? 'grayscale' : ''}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    {/* Play overlay on hover */}
                    <div className={`absolute inset-0 flex items-center justify-center rounded-lg ${
                      isLocked ? "bg-black/40" :
                      isCurrentPlaying ? "bg-black/40" : "bg-black/0 group-hover:bg-black/40"
                    } transition-colors`}>
                      {isLocked ? (
                        <Lock className="w-5 h-5 text-white" />
                      ) : !isCurrentPlaying && (
                        <Play className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm line-clamp-1 ${
                      isLocked ? "text-muted-foreground" :
                      isCurrentPlaying ? "text-accent" : "text-foreground"
                    }`}>
                      {audio.titulo}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {audio.tema || audio.area}
                    </p>
                    {audio.tipo === "flashcard" && audio.pergunta && (
                      <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-1">
                        {audio.pergunta.substring(0, 50)}...
                      </p>
                    )}
                  </div>

                  {/* Indicador de conteúdo visual disponível */}
                  {!isLocked && (audio.url_imagem_exemplo || audio.texto_exemplo) && (
                    <div className="shrink-0">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-accent" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {(!audios || audios.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <Icon className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum áudio encontrado nesta categoria</p>
        </div>
      )}
    </div>
  );
};

export default AudioaulasCategoria;