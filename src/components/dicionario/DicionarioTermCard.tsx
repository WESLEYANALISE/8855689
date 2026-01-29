import { useState } from "react";
import { Lightbulb, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";

interface DicionarioTermCardProps {
  palavra: string;
  significado: string;
  exemploUso1?: string | null;
  exemploUso2?: string | null;
  exemploPratico?: string | null;
  onGerarExemplo: () => void;
  isLoadingExemplo?: boolean;
  exemploPraticoContent?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

export const DicionarioTermCard = ({
  palavra,
  significado,
  exemploUso1,
  exemploUso2,
  exemploPratico,
  onGerarExemplo,
  isLoadingExemplo,
  exemploPraticoContent,
  style,
  compact = false,
}: DicionarioTermCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasExamples = exemploUso1 || exemploUso2;
  const showExemploPratico = !!exemploPraticoContent;

  return (
    <div
      style={style}
      className={cn(
        "bg-card rounded-xl border border-border/50 transition-all duration-200",
        "hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5",
        compact ? "p-3" : "p-4"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-bold text-amber-400",
            compact ? "text-base" : "text-lg"
          )}>
            {palavra}
          </h3>
          <p className={cn(
            "text-foreground/90 mt-1",
            compact ? "text-sm line-clamp-2" : "text-sm"
          )}>
            {significado}
          </p>
        </div>

        {/* Expand button for compact mode */}
        {compact && (hasExamples || exemploPratico) && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Expandable content for compact mode */}
      <AnimatePresence>
        {(!compact || expanded) && (
          <motion.div
            initial={compact ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={compact ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Action button */}
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                className="border-border/50 hover:border-amber-500/50 hover:bg-amber-500/10"
                onClick={onGerarExemplo}
                disabled={isLoadingExemplo}
              >
                {isLoadingExemplo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    {showExemploPratico ? "Fechar" : "Ver"} Exemplo Prático
                  </>
                )}
              </Button>
            </div>

            {/* AI Generated Example */}
            <AnimatePresence>
              {showExemploPratico && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20"
                >
                  <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-3 h-3" />
                    Exemplo Prático (IA)
                  </p>
                  <div className="prose prose-invert prose-sm max-w-none text-foreground/90">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {exemploPraticoContent}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Usage Examples */}
            {hasExamples && (
              <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  Exemplos de uso:
                </p>
                {exemploUso1 && (
                  <p className="text-sm text-muted-foreground italic">
                    • {exemploUso1}
                  </p>
                )}
                {exemploUso2 && (
                  <p className="text-sm text-muted-foreground italic">
                    • {exemploUso2}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
