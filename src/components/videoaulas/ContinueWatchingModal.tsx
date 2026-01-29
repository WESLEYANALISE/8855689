import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import { formatTime } from "@/hooks/useVideoProgress";

interface ContinueWatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onStartOver: () => void;
  savedTime: number;
  percentage: number;
}

const ContinueWatchingModal = ({
  isOpen,
  onClose,
  onContinue,
  onStartOver,
  savedTime,
  percentage,
}: ContinueWatchingModalProps) => {
  const handleContinue = () => {
    onContinue();
    onClose();
  };

  const handleStartOver = () => {
    onStartOver();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            Continuar de onde parou?
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Você assistiu até <span className="font-semibold text-foreground">{formatTime(savedTime)}</span> ({percentage}%)
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleStartOver}
            className="w-full sm:w-auto gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Começar do Início
          </Button>
          <Button
            onClick={handleContinue}
            className="w-full sm:w-auto gap-2 bg-red-600 hover:bg-red-700"
          >
            <Play className="w-4 h-4" />
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContinueWatchingModal;
