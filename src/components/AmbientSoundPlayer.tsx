import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Music, Volume2, VolumeX, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useAmbientSound } from "@/contexts/AmbientSoundContext";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import AmbientSoundModal from "./AmbientSoundModal";

const AmbientSoundPlayer = () => {
  const [showModal, setShowModal] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const { currentSound, isPlaying, volume, setVolume, stopSound, togglePlay } = useAmbientSound();
  const { currentAudio } = useAudioPlayer();

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
  };

  // Só mostra se houver um áudio tocando
  if (!currentAudio) return null;

  return (
    <>
      <div className="fixed bottom-24 md:bottom-8 right-4 z-40 flex flex-col gap-2 items-end animate-fade-in">
        {currentSound && (
          <div className="bg-card border border-accent/20 rounded-full shadow-lg backdrop-blur-sm px-4 py-2 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="h-8 w-8 rounded-full p-0"
            >
              {isPlaying ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>

            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Som {currentSound.numero}
            </span>

            {showVolumeControl && (
              <div className="w-20">
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="cursor-pointer"
                />
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVolumeControl(!showVolumeControl)}
              className="h-8 w-8 rounded-full p-0"
            >
              <Volume2 className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={stopSound}
              className="h-8 w-8 rounded-full p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        <Button
          onClick={() => setShowModal(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-accent/50 transition-all"
        >
          <Music className="w-6 h-6" />
        </Button>
      </div>

      <AmbientSoundModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default AmbientSoundPlayer;
