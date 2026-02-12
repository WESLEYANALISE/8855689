import { useNavigate } from "react-router-dom";
import { BookOpen, BarChart3, Clock, TrendingUp, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";

interface CategoriasBottomNavProps {
  activeTab: 'aulas' | 'progresso' | 'historico' | 'estatisticas' | 'material';
}

export const CategoriasBottomNav = ({ activeTab }: CategoriasBottomNavProps) => {
  const navigate = useNavigate();
  const { isNative } = useCapacitorPlatform();

  const isActive = (tab: string) => activeTab === tab;

  const handleTab = (tab: CategoriasBottomNavProps['activeTab']) => {
    const routes: Record<string, string> = {
      aulas: '/categorias',
      progresso: '/categorias/progresso',
      historico: '/categorias/historico',
      estatisticas: '/categorias/estatisticas',
      material: '/categorias/material',
    };
    navigate(routes[tab]);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-red-900/20 bg-card",
        isNative && "pb-safe"
      )}
      style={isNative ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
    >
      <div className="max-w-2xl mx-auto px-2 py-2">
        <div className="grid grid-cols-5 items-end">
          <button
            onClick={() => handleTab('aulas')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("aulas")
                ? "text-red-500 bg-red-500/15 ring-1 ring-red-500/20"
                : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            )}
          >
            <BookOpen className={cn("w-6 h-6 transition-transform", isActive("aulas") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Aulas</span>
          </button>

          <button
            onClick={() => handleTab('progresso')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("progresso")
                ? "text-red-500 bg-red-500/15 ring-1 ring-red-500/20"
                : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            )}
          >
            <BarChart3 className={cn("w-6 h-6 transition-transform", isActive("progresso") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Progresso</span>
          </button>

          {/* Central button */}
          <div className="flex flex-col items-center -mt-6">
            <button
              onClick={() => handleTab('historico')}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-[0_6px_20px_rgba(239,68,68,0.4)] hover:shadow-[0_10px_30px_rgba(239,68,68,0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center"
            >
              <Clock className="w-7 h-7 text-white" />
            </button>
            <span className="text-[10px] font-medium text-red-500 mt-1">Histórico</span>
          </div>

          <button
            onClick={() => handleTab('estatisticas')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("estatisticas")
                ? "text-red-500 bg-red-500/15 ring-1 ring-red-500/20"
                : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            )}
          >
            <TrendingUp className={cn("w-6 h-6 transition-transform", isActive("estatisticas") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Estatísticas</span>
          </button>

          <button
            onClick={() => handleTab('material')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("material")
                ? "text-red-500 bg-red-500/15 ring-1 ring-red-500/20"
                : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            )}
          >
            <FileText className={cn("w-6 h-6 transition-transform", isActive("material") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Material</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
