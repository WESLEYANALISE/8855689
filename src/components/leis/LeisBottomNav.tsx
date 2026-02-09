import { useNavigate } from "react-router-dom";
import { Scale, BookOpen, Search, Newspaper, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";

interface LeisBottomNavProps {
  activeTab: 'legislacao' | 'explicacao' | 'procurar' | 'resenha' | 'push';
  onTabChange: (tab: 'legislacao' | 'explicacao' | 'procurar' | 'resenha' | 'push') => void;
}

export const LeisBottomNav = ({ activeTab, onTabChange }: LeisBottomNavProps) => {
  const navigate = useNavigate();
  const { isNative } = useCapacitorPlatform();

  const isActive = (tab: string) => activeTab === tab;

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card",
        isNative && "pb-safe"
      )}
      style={isNative ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
    >
      <div className="max-w-2xl mx-auto px-2 py-2">
        <div className="grid grid-cols-5 items-end">
          {/* Legislação */}
          <button
            onClick={() => onTabChange('legislacao')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("legislacao")
                ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            <Scale className={cn("w-6 h-6 transition-transform", isActive("legislacao") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Legislação</span>
          </button>

          {/* Explicação */}
          <button
            onClick={() => onTabChange('explicacao')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("explicacao")
                ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            <BookOpen className={cn("w-6 h-6 transition-transform", isActive("explicacao") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Explicação</span>
          </button>

          {/* Botão Central - Procurar (Elevado) */}
          <div className="flex flex-col items-center -mt-6">
            <button
              onClick={() => onTabChange('procurar')}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center"
            >
              <Search className="w-7 h-7 text-primary-foreground" />
            </button>
            <span className="text-[10px] font-medium text-primary mt-1">Procurar</span>
          </div>

          {/* Resenha */}
          <button
            onClick={() => onTabChange('resenha')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("resenha")
                ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            <Newspaper className={cn("w-6 h-6 transition-transform", isActive("resenha") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Resenha</span>
          </button>

          {/* Push */}
          <button
            onClick={() => onTabChange('push')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("push")
                ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            <Bell className={cn("w-6 h-6 transition-transform", isActive("push") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Push</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
