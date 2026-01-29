import { BarChart3, BookOpen, HelpCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModoVisualizacao = "dados" | "explicacao" | "glossario" | "interpretar";

interface ToggleExplicacaoProps {
  modoExplicacao: ModoVisualizacao;
  setModoExplicacao: (value: ModoVisualizacao) => void;
}

const MODOS = [
  { id: "dados" as const, icon: BarChart3, label: "Dados" },
  { id: "explicacao" as const, icon: Lightbulb, label: "Explicação" },
  { id: "glossario" as const, icon: BookOpen, label: "Glossário" },
  { id: "interpretar" as const, icon: HelpCircle, label: "Como Ler" },
];

export function ToggleExplicacao({ modoExplicacao, setModoExplicacao }: ToggleExplicacaoProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex items-center bg-muted/50 rounded-full p-1 gap-0.5 overflow-x-auto max-w-full">
        {MODOS.map((modo) => (
          <button
            key={modo.id}
            onClick={() => setModoExplicacao(modo.id)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap",
              modoExplicacao === modo.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <modo.icon className="w-3 h-3" />
            <span className="hidden xs:inline sm:inline">{modo.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
