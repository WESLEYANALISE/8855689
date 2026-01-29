import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Play, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { AudioAula } from "@/types/database.types";
const AudioaulasTema = () => {
  const {
    area
  } = useParams();
  const navigate = useNavigate();
  const {
    playAudio,
    currentAudio,
    isPlaying
  } = useAudioPlayer();
  const {
    data: audios,
    isLoading
  } = useQuery({
    queryKey: ["audioaulas-tema", area],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("AUDIO-AULA" as any).select("*").eq("area", decodeURIComponent(area || "")).order("sequencia", {
        ascending: true
      });
      if (error) throw error;
      return data as unknown as AudioAula[];
    }
  });
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>;
  }
  return <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{decodeURIComponent(area || "")}</h1>
        <p className="text-sm text-muted-foreground">
          {audios?.length} {audios?.length === 1 ? "áudio" : "áudios"}
        </p>
      </div>

      <div className="space-y-3">
        {audios?.map((audio, index) => {
        const isCurrentAudio = currentAudio?.id === audio.id;
        const iconColors = [{
          bg: "bg-purple-600",
          text: "text-purple-100"
        }, {
          bg: "bg-blue-600",
          text: "text-blue-100"
        }, {
          bg: "bg-cyan-600",
          text: "text-cyan-100"
        }, {
          bg: "bg-green-600",
          text: "text-green-100"
        }, {
          bg: "bg-orange-600",
          text: "text-orange-100"
        }, {
          bg: "bg-pink-600",
          text: "text-pink-100"
        }];
        const colors = iconColors[index % iconColors.length];
        return <Card key={audio.id} className={`cursor-pointer hover:scale-[1.01] transition-all border animate-fade-in ${isCurrentAudio ? "border-accent bg-accent/5" : "border-border bg-card"}`} onClick={() => {
          playAudio({
            id: audio.id,
            titulo: audio.titulo,
            url_audio: audio.url_audio,
            imagem_miniatura: audio.imagem_miniatura,
            descricao: audio.descricao,
            area: audio.area,
            tema: audio.tema
          });
        }}>
              <div className="flex items-center gap-4 p-4">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} relative`}>
                  <Headphones className={`w-7 h-7 ${colors.text}`} />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                    <Play className="w-6 h-6 text-white" fill="white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {audio.sequencia && <span className="text-xs text-muted-foreground font-medium">
                        {audio.sequencia}
                      </span>}
                    {audio.tag && <Badge variant="outline" className="text-xs">
                        {audio.tag}
                      </Badge>}
                  </div>
                  <h3 className="font-semibold text-base mb-1">
                    {audio.titulo}
                  </h3>
                  {audio.tema && <p className="text-sm text-muted-foreground">
                      {audio.tema}
                    </p>}
                </div>
                {isCurrentAudio && isPlaying && <div className="flex gap-0.5 items-center">
                    <div className="w-1 h-4 bg-accent rounded-full animate-pulse" />
                    <div className="w-1 h-6 bg-accent rounded-full animate-pulse" style={{
                animationDelay: "0.2s"
              }} />
                    <div className="w-1 h-5 bg-accent rounded-full animate-pulse" style={{
                animationDelay: "0.4s"
              }} />
                  </div>}
              </div>
            </Card>;
      })}
      </div>
    </div>;
};
export default AudioaulasTema;