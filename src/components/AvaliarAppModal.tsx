import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface AvaliarAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceType?: "ios" | "android";
  onRated: () => void;
  onPostpone: () => void;
}

export const AvaliarAppModal = ({ 
  open, 
  onOpenChange,
  deviceType = "android",
  onRated,
  onPostpone,
}: AvaliarAppModalProps) => {
  const handleAvaliar = () => {
    onRated();
    onOpenChange(false);
  };

  const handlePostpone = () => {
    onPostpone();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-primary/20 animate-scale-in">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Adorando o App?
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Sua avaliação faz toda a diferença! ⭐
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-center text-sm text-muted-foreground leading-relaxed px-2">
            Sua opinião nos ajuda a crescer e a oferecer cada vez mais recursos incríveis para você.
          </p>

          <div className="w-full flex justify-center py-4">
            <div className="w-56 h-56 flex items-center justify-center">
              <DotLottieReact
                src="/animations/star-rating.lottie"
                loop
                autoplay
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="flex gap-3 w-full pt-2">
            <Button
              variant="outline"
              onClick={handlePostpone}
              className="flex-1 hover-scale"
            >
              Mais Tarde
            </Button>
            <Button 
              onClick={handleAvaliar} 
              className="flex-1 hover-scale bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Star className="w-4 h-4 mr-2 fill-current" />
              Avaliar Agora
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
