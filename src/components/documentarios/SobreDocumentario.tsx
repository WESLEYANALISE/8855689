import { Info, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SobreDocumentarioProps {
  sobre: string | null;
  onGenerate: () => void;
  isLoading: boolean;
  hasTranscricao: boolean;
}

const SobreDocumentario = ({ sobre, onGenerate, isLoading, hasTranscricao }: SobreDocumentarioProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">
          Gerando conteúdo do documentário...
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Isso pode levar alguns segundos
        </p>
      </div>
    );
  }

  if (sobre) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary mb-3">
          <Info className="h-5 w-5" />
          <h3 className="font-semibold">Sobre o Documentário</h3>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {sobre}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Info className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground mb-3">
        {hasTranscricao 
          ? "Gere o conteúdo completo do documentário"
          : "É necessário ter a transcrição para gerar o conteúdo"}
      </p>
      {hasTranscricao && (
        <Button onClick={onGenerate} disabled={isLoading} size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Gerar Conteúdo
        </Button>
      )}
    </div>
  );
};

export default SobreDocumentario;
