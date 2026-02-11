import { useNavigate, useLocation } from "react-router-dom";
import { Home, MessageCircle, Menu, Landmark, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "./AppSidebar";
import { useState } from "react";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isNative } = useCapacitorPlatform();
  
  const isActive = (path: string) => location.pathname === path;
  
  // Mostrar apenas na página inicial
  if (location.pathname !== '/') {
    return null;
  }
  
  const handlePoliticaClick = () => {
    navigate('/politica');
  };

  const handleProfessoraClick = () => {
    navigate('/chat-professora');
  };

  return (
    <nav 
      data-footer="main"
      data-bottom-nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card",
        isNative && "pb-safe"
      )}
      style={isNative ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
    >
      <div className="max-w-2xl mx-auto px-2 py-2">
        <div className="grid grid-cols-5 items-end">
          {/* Início */}
          <button
            onClick={() => navigate("/")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("/")
                ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            <Home className={cn("w-6 h-6 transition-transform", isActive("/") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Início</span>
          </button>

          {/* Evelyn */}
          <button
            onClick={() => navigate("/evelyn")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("/evelyn")
                ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            <MessageCircle className={cn("w-6 h-6 transition-transform", isActive("/evelyn") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Evelyn</span>
          </button>

          {/* Botão Central da Professora - Elevado */}
          <div className="flex flex-col items-center -mt-6">
            <button
              onClick={handleProfessoraClick}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center"
            >
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </button>
            <span className="text-[10px] font-medium text-primary mt-1">Professora</span>
          </div>

          {/* Política */}
          <button
            onClick={handlePoliticaClick}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
              isActive("/politica")
                ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            <Landmark className={cn("w-6 h-6 transition-transform", isActive("/politica") && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Política</span>
          </button>

          {/* Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                  "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
              >
                <Menu className="w-6 h-6 transition-transform" />
                <span className="text-[10px] font-medium leading-tight">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
              <AppSidebar onClose={() => setIsMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
