import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SlideAudioButtonProps {
  aulaId: string;
  slideKey: string;
  conteudo: string;
  audioUrl?: string;
  onAudioGenerated?: (url: string) => void;
}

// ============================================
// ÁUDIO DESATIVADO TEMPORARIAMENTE
// ============================================
// A geração de áudio para aulas foi desativada.
// Para reativar, restaure a versão anterior deste arquivo.

export const SlideAudioButton = ({
  aulaId,
  slideKey,
  conteudo,
  audioUrl: propAudioUrl,
  onAudioGenerated
}: SlideAudioButtonProps) => {
  // Retorna botão desabilitado - áudio desativado
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={true}
      className="gap-2 text-muted-foreground opacity-50 cursor-not-allowed"
      title="Narração temporariamente indisponível"
    >
      <Volume2 className="w-4 h-4" />
      <span className="text-xs">Indisponível</span>
    </Button>
  );
};
