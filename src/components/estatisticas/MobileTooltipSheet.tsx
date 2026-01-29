import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileTooltipSheetProps {
  item: {
    nome: string;
    valor?: number;
    quantidade?: number;
    percentual?: number;
    sigla?: string;
  };
  onClose: () => void;
  onExplicar?: (item: any) => void;
}

function formatarValor(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toLocaleString("pt-BR");
}

export function MobileTooltipSheet({ item, onClose, onExplicar }: MobileTooltipSheetProps) {
  const valor = item.valor || item.quantidade || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-4 pb-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground text-lg">
                {item.nome}
              </h3>
              {item.sigla && (
                <p className="text-sm text-muted-foreground">{item.sigla}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Valor principal */}
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-primary">
              {formatarValor(valor)}
            </p>
            <p className="text-sm text-muted-foreground">
              {item.percentual ? `${item.percentual}% do total` : "processos"}
            </p>
          </div>

          {/* Botão de explicação */}
          {onExplicar && (
            <Button
              variant="outline"
              className="w-full mt-4 gap-2"
              onClick={() => {
                onExplicar(item);
                onClose();
              }}
            >
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Explicar com IA
            </Button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
