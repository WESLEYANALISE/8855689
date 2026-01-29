import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExplicacaoProcessoModalProps {
  open: boolean;
  onClose: () => void;
  explicacao: string;
  numeroProcesso: string;
}

const ExplicacaoProcessoModal = ({
  open,
  onClose,
  explicacao,
  numeroProcesso,
}: ExplicacaoProcessoModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Explicação do Processo</DialogTitle>
          <DialogDescription>
            Processo: {numeroProcesso}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {explicacao}
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ExplicacaoProcessoModal;
