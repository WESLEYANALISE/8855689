import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Volume2, Sparkles, VolumeX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlashcardSettings, StudyMode } from "./FlashcardViewer";

interface FlashcardSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onStart: (settings: FlashcardSettings) => void;
  totalFlashcards: number;
  tema: string;
  onBack?: () => void;
}

export const FlashcardSettingsModal = ({
  open,
  onClose,
  onStart,
  totalFlashcards,
  tema,
  onBack,
}: FlashcardSettingsModalProps) => {
  const handleSelect = (mode: StudyMode) => {
    const settings: FlashcardSettings = {
      autoNarration: mode !== 'leitura',
      showExamples: true,
      studyMode: mode,
    };
    onStart(settings);
    onClose();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md bg-[#1a1a1a] border-[#2a2a2a]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>

        <DialogHeader className="flex flex-col items-center gap-3 pb-2 pt-6">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-red-500" />
          </div>
          <DialogTitle className="text-center text-xl">Configurar Estudo</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {totalFlashcards} flashcards sobre "{tema}"
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground text-center mb-4">
          Escolha como deseja estudar
        </p>

        <div className="space-y-3">
          {/* Imersão Total */}
          <button
            onClick={() => handleSelect('imersao')}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border border-emerald-700/30 hover:border-emerald-600/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Imersão Total</h3>
                <p className="text-xs text-emerald-400 font-medium">Narração Completa</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pergunta, resposta e exemplo prático narrados automaticamente
                </p>
              </div>
            </div>
          </button>

          {/* Estudo Guiado */}
          <button
            onClick={() => handleSelect('guiado')}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-900/40 to-amber-800/20 border border-amber-700/30 hover:border-amber-600/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Estudo Guiado</h3>
                <p className="text-xs text-amber-400 font-medium">Narração Automática</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pergunta e resposta narradas. Exemplo sob demanda
                </p>
              </div>
            </div>
          </button>

          {/* Leitura Focada */}
          <button
            onClick={() => handleSelect('leitura')}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-zinc-800/60 to-zinc-800/30 border border-zinc-700/30 hover:border-zinc-600/50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-600/30 flex items-center justify-center flex-shrink-0">
                <VolumeX className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Leitura Focada</h3>
                <p className="text-xs text-zinc-400 font-medium">Modo Silencioso</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sem narração. Estude no seu ritmo
                </p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Você pode alterar essas configurações a qualquer momento
        </p>
      </DialogContent>
    </Dialog>
  );
};
