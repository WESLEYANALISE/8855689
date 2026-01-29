import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Music, Play, Pause } from "lucide-react";
import { useAmbientSound } from "@/contexts/AmbientSoundContext";

interface AmbientSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AmbientSoundModal = ({ isOpen, onClose }: AmbientSoundModalProps) => {
  const { currentSound, setCurrentSound, isPlaying, togglePlay } = useAmbientSound();

  const { data: sounds, isLoading } = useQuery({
    queryKey: ["ambient-sounds"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("SOM AMBIENTE")
        .select("*")
        .order("numero", { ascending: true });

      if (error) throw error;
      return data as Array<{ id: number; numero: number; link: string }>;
    },
  });

  const handleSoundSelect = (sound: any) => {
    setCurrentSound(sound);
    if (currentSound?.id !== sound.id) {
      // Força o play ao selecionar um novo som
      setTimeout(() => togglePlay(), 100);
    } else {
      togglePlay();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Sons Ambiente para Leitura
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {sounds?.map((sound, index) => {
                const isActive = currentSound?.id === sound.id;
                const isCurrentlyPlaying = isActive && isPlaying;

                const colors = [
                  { bg: "bg-gradient-to-br from-purple-600 to-purple-800", border: "border-purple-500", text: "text-purple-100" },
                  { bg: "bg-gradient-to-br from-blue-600 to-blue-800", border: "border-blue-500", text: "text-blue-100" },
                  { bg: "bg-gradient-to-br from-cyan-600 to-cyan-800", border: "border-cyan-500", text: "text-cyan-100" },
                  { bg: "bg-gradient-to-br from-green-600 to-green-800", border: "border-green-500", text: "text-green-100" },
                  { bg: "bg-gradient-to-br from-orange-600 to-orange-800", border: "border-orange-500", text: "text-orange-100" },
                  { bg: "bg-gradient-to-br from-pink-600 to-pink-800", border: "border-pink-500", text: "text-pink-100" },
                  { bg: "bg-gradient-to-br from-red-600 to-red-800", border: "border-red-500", text: "text-red-100" },
                  { bg: "bg-gradient-to-br from-indigo-600 to-indigo-800", border: "border-indigo-500", text: "text-indigo-100" },
                ];
                const colorSet = colors[index % colors.length];

                return (
                  <button
                    key={sound.id}
                    onClick={() => handleSoundSelect(sound)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all border-2 ${
                      isActive 
                        ? `${colorSet.bg} ${colorSet.border} shadow-lg` 
                        : `bg-card border-border hover:border-accent/50 hover:shadow-md`
                    }`}
                  >
                    <span className={isActive ? colorSet.text : "text-foreground"}>
                      Som Ambiente {sound.numero}
                    </span>
                    <div className="flex items-center gap-2">
                      {isCurrentlyPlaying ? (
                        <Pause className={`w-4 h-4 ${isActive ? colorSet.text : ""}`} />
                      ) : (
                        <Play className={`w-4 h-4 ${isActive ? colorSet.text : ""}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AmbientSoundModal;
