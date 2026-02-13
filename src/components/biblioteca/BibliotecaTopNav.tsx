import { useNavigate } from "react-router-dom";
import { BookOpen, Target, Clock, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "acervo", label: "Acervo", icon: BookOpen, route: "/bibliotecas" },
  { key: "plano", label: "Plano", icon: Target, route: "/biblioteca/plano-leitura" },
  { key: "historico", label: "Histórico", icon: Clock, route: "/biblioteca/historico" },
  { key: "favoritos", label: "Favoritos", icon: Heart, route: "/biblioteca/favoritos" },
] as const;

interface BibliotecaTopNavProps {
  activeTab: "acervo" | "plano" | "historico" | "favoritos";
}

export const BibliotecaTopNav = ({ activeTab }: BibliotecaTopNavProps) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/30">
      <div className="max-w-4xl mx-auto px-3">
        <div className="flex items-center h-14 gap-1.5 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.route)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center min-w-0",
                  isActive
                    ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25 shadow-sm"
                    : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                )}
              >
                <Icon className={cn("w-4.5 h-4.5 shrink-0", isActive && "scale-110")} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
