import { Volume2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface NarracaoGenerationCardProps {
  isGenerating: boolean;
  currentArtigo: string | null;
  generatedCount: number;
  totalCount: number;
}

export const NarracaoGenerationCard = ({
  isGenerating,
  currentArtigo,
  generatedCount,
  totalCount
}: NarracaoGenerationCardProps) => {
  if (!isGenerating) return null;

  return (
    <Card className="mb-4 bg-gradient-to-r from-amber-900/30 to-amber-800/20 border-amber-700/30 animate-pulse">
      <CardContent className="py-3 px-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-amber-400" />
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-300">
            Gerando narrações automaticamente...
          </p>
          <p className="text-xs text-muted-foreground">
            {currentArtigo} • {generatedCount}/{totalCount} processados
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
