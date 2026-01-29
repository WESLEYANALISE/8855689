import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Music2, Pause } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Badge } from "@/components/ui/badge";

interface AudioPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AudioPlaylistModal = ({ isOpen, onClose }: AudioPlaylistModalProps) => {
  const { playAudio, currentAudio, isPlaying, playlist, togglePlayPause } = useAudioPlayer();

  const handleAudioClick = (audio: any, index: number) => {
    playAudio(audio);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-gradient-to-br from-gray-900/98 to-gray-800/98 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Music2 className="w-5 h-5 text-purple-400" />
            Playlist: {playlist.length > 0 ? playlist[0]?.area : 'Vazia'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {playlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Music2 className="w-16 h-16 text-gray-500 mb-4 opacity-50" />
              <p className="text-gray-400">Nenhum áudio na playlist</p>
            </div>
          ) : (
            <div className="space-y-2">
              {playlist.map((audio, index) => {
                const isCurrentAudio = currentAudio?.id === audio.id;
                return (
                  <div
                    key={audio.id}
                    onClick={() => handleAudioClick(audio, index)}
                    className={`cursor-pointer p-3 rounded-lg transition-all hover:bg-white/10 border ${
                      isCurrentAudio
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Ícone de Play/Pause */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrentAudio) {
                            togglePlayPause();
                          } else {
                            handleAudioClick(audio, index);
                          }
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isCurrentAudio
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-purple-600/80 text-white hover:bg-purple-600"
                        }`}
                      >
                        {isCurrentAudio && isPlaying ? (
                          <Pause className="w-4 h-4" fill="white" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" fill="white" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm truncate ${
                          isCurrentAudio ? "text-purple-300" : "text-white"
                        }`}>
                          {audio.titulo}
                        </h4>
                        <p className="text-xs text-gray-400 truncate">
                          {audio.tema}
                        </p>
                      </div>

                      {/* Indicador Tocando */}
                      {isCurrentAudio && isPlaying && (
                        <div className="shrink-0 flex gap-0.5 items-center">
                          <div className="w-0.5 h-3 bg-purple-400 rounded-full animate-pulse" />
                          <div className="w-0.5 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                          <div className="w-0.5 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AudioPlaylistModal;
