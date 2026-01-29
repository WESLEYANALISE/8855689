import { useRef } from "react";
import { formatTextWithUppercase } from "@/lib/textFormatter";
import { SumulaActionsMenu } from "./SumulaActionsMenu";
import { useArticleTracking } from "@/hooks/useArticleTracking";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import InlineAudioButton from "@/components/InlineAudioButton";

interface Sumula {
  id: number;
  "Título da Súmula": string | null;
  "Texto da Súmula": string | null;
  "Narração": string | null;
  "Data de Aprovação": string | null;
}

interface SumulaCardProps {
  sumula: Sumula;
  index: number;
  isHighlighted: boolean;
  isFirstResult: boolean;
  firstResultRef: React.RefObject<HTMLDivElement>;
  fontSize: number;
  categoryName: string;
  isCNMPorCNJ: boolean;
  tableName: string;
  onOpenExplicacao: (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => void;
  onGenerateFlashcards: (artigo: string, numeroArtigo: string) => void;
  onOpenTermos: (artigo: string, numeroArtigo: string) => void;
  onOpenQuestoes: (artigo: string, numeroArtigo: string) => void;
  onShare: (sumula: Sumula) => void;
  onPerguntar: (sumula: Sumula) => void;
  loadingFlashcards: boolean;
}

export const SumulaCard = ({
  sumula,
  index,
  isHighlighted,
  isFirstResult,
  firstResultRef,
  fontSize,
  categoryName,
  isCNMPorCNJ,
  tableName,
  onOpenExplicacao,
  onGenerateFlashcards,
  onOpenTermos,
  onOpenQuestoes,
  onShare,
  onPerguntar,
  loadingFlashcards,
}: SumulaCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Tracking de visualização
  const { elementRef } = useArticleTracking({
    tableName: tableName,
    articleId: sumula.id,
    numeroArtigo: sumula.id?.toString() || "",
    enabled: true
  });

  // Combinar refs
  const setRefs = (element: HTMLDivElement | null) => {
    if (isFirstResult && firstResultRef) {
      (firstResultRef as any).current = element;
    }
    (cardRef as any).current = element;
    (elementRef as any).current = element;
  };

  return (
    <div
      ref={setRefs}
      className={`bg-card rounded-2xl p-6 mb-6 border transition-all animate-fade-in hover:shadow-lg scroll-mt-4 ${
        isHighlighted 
          ? 'border-[hsl(45,93%,58%)] shadow-lg shadow-[hsl(45,93%,58%)]/20 ring-2 ring-[hsl(45,93%,58%)]/20' 
          : 'border-border/50 hover:border-[hsl(45,93%,58%)]/30 hover:shadow-[hsl(45,93%,58%)]/5'
      }`}
      style={{
        animationDelay: `${index * 0.08}s`,
        animationFillMode: 'backwards'
      }}
    >
      {/* Header com título e botões de ação */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <h2 className="text-[hsl(45,93%,58%)] font-bold text-xl md:text-2xl animate-scale-in">
          {isCNMPorCNJ ? 'Enunciado' : 'Súmula'} {sumula.id}
        </h2>
        
        <div className="flex gap-2 flex-shrink-0">
          {/* Botão de Áudio */}
          {sumula["Narração"] && (
            <InlineAudioButton 
              audioUrl={sumula["Narração"]!} 
              articleNumber={sumula.id?.toString() || ""} 
            />
          )}
          
          {/* Botão de Compartilhar */}
          <Button
            onClick={() => onShare(sumula)}
            variant="outline"
            size="icon"
            className="bg-gradient-to-r from-[hsl(45,93%,58%)]/10 to-[hsl(45,93%,58%)]/20 hover:from-[hsl(45,93%,58%)]/20 hover:to-[hsl(45,93%,58%)]/30 border-[hsl(45,93%,58%)]/40 transition-all hover:scale-105"
          >
            <Share2 className="w-4 h-4 text-[hsl(45,93%,58%)]" />
          </Button>
        </div>
      </div>

      {/* Sumula Content */}
      <div 
        className="article-content text-foreground/90 mb-4 whitespace-pre-line leading-relaxed font-serif-content" 
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: "1.7"
        }} 
        dangerouslySetInnerHTML={{
          __html: formatTextWithUppercase(sumula["Texto da Súmula"] || "Texto não disponível")
        }} 
      />

      {/* Data de Aprovação */}
      {sumula["Data de Aprovação"] && (
        <p className="text-sm text-muted-foreground mb-6">
          Aprovada em: {sumula["Data de Aprovação"]}
        </p>
      )}

      {/* Action Menu */}
      <SumulaActionsMenu
        sumula={sumula}
        codigoNome={categoryName}
        onOpenExplicacao={(tipo) => 
          onOpenExplicacao(sumula["Texto da Súmula"]!, sumula.id?.toString() || "", tipo)
        }
        onGenerateFlashcards={() => 
          onGenerateFlashcards(sumula["Texto da Súmula"]!, sumula.id?.toString() || "")
        }
        onOpenTermos={() => 
          onOpenTermos(sumula["Texto da Súmula"]!, sumula.id?.toString() || "")
        }
        onOpenQuestoes={() => 
          onOpenQuestoes(sumula["Texto da Súmula"]!, sumula.id?.toString() || "")
        }
        onPerguntar={() => onPerguntar(sumula)}
        loadingFlashcards={loadingFlashcards}
      />
    </div>
  );
};
