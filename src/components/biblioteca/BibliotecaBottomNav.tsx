import { useNavigate } from "react-router-dom";
import { BookOpen, Target, Search, Clock, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";

interface BibliotecaBottomNavProps {
  activeTab: 'acervo' | 'plano' | 'procurar' | 'historico' | 'favoritos';
}

export const BibliotecaBottomNav = ({ activeTab }: BibliotecaBottomNavProps) => {
  const navigate = useNavigate();
  const { isNative } = useCapacitorPlatform();

  const isActive = (tab: string) => activeTab === tab;

  const handleTab = (tab: BibliotecaBottomNavProps['activeTab']) => {
    const routes: Record<string, string> = {
      acervo: '/bibliotecas',
      plano: '/biblioteca/plano-leitura',
      procurar: '/biblioteca/busca',
      historico: '/biblioteca/historico',
      favoritos: '/biblioteca/favoritos',
    };
    navigate(routes[tab]);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-amber-900/20 bg-card",
        isNative && "pb-safe"
      )}
      style={isNative ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
    >
      <div className="max-w-2xl mx-auto px-2 py-2">
        <div className="grid grid-cols-5 items-end">
          {/* Acervo */}
          <button
            onClick={() => handleTab('acervo')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("acervo")
                ? "text-amber-500 bg-amber-500/15 ring-1 ring-amber-500/20"
                : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
            )}
          >
            <BookOpen className={cn("w-6 h-6 transition-transform", isActive("acervo") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Acervo</span>
          </button>

          {/* Plano de Leitura */}
          <button
            onClick={() => handleTab('plano')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("plano")
                ? "text-amber-500 bg-amber-500/15 ring-1 ring-amber-500/20"
                : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
            )}
          >
            <Target className={cn("w-6 h-6 transition-transform", isActive("plano") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Plano</span>
          </button>

          {/* Botão Central - Procurar (Elevado) */}
          <div className="flex flex-col items-center -mt-6">
            <button
              onClick={() => handleTab('procurar')}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-[0_6px_20px_rgba(245,158,11,0.4)] hover:shadow-[0_10px_30px_rgba(245,158,11,0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center"
            >
              <Search className="w-7 h-7 text-white" />
            </button>
            <span className="text-[10px] font-medium text-amber-500 mt-1">Procurar</span>
          </div>

          {/* Histórico */}
          <button
            onClick={() => handleTab('historico')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("historico")
                ? "text-amber-500 bg-amber-500/15 ring-1 ring-amber-500/20"
                : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
            )}
          >
            <Clock className={cn("w-6 h-6 transition-transform", isActive("historico") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Histórico</span>
          </button>

          {/* Favoritos */}
          <button
            onClick={() => handleTab('favoritos')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("favoritos")
                ? "text-amber-500 bg-amber-500/15 ring-1 ring-amber-500/20"
                : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
            )}
          >
            <Heart className={cn("w-6 h-6 transition-transform", isActive("favoritos") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Favoritos</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
