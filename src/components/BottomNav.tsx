import { useNavigate, useLocation } from "react-router-dom";
import { Home, Monitor, Menu, Landmark, GraduationCap, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "./AppSidebar";
import { useState, useEffect } from "react";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";
import { useNarrationPlayer } from "@/contexts/NarrationPlayerContext";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isNative } = useCapacitorPlatform();
  const { currentNarrationRef, stopNarration } = useNarrationPlayer();
  
  // Estado para controlar se há áudio tocando
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hasActiveAudio, setHasActiveAudio] = useState(false);

  // Monitorar o estado do áudio
  useEffect(() => {
    const checkAudioStatus = () => {
      const audioElement = currentNarrationRef.current;
      if (audioElement) {
        setHasActiveAudio(true);
        setIsAudioPlaying(!audioElement.paused);
      } else {
        setHasActiveAudio(false);
        setIsAudioPlaying(false);
      }
    };

    // Verificar a cada 500ms
    const interval = setInterval(checkAudioStatus, 500);
    checkAudioStatus();

    return () => clearInterval(interval);
  }, [currentNarrationRef]);

  const isActive = (path: string) => location.pathname === path;
  
  // Mostrar apenas na página inicial
  if (location.pathname !== '/') {
    return null;
  }

  const handleToggleAudio = () => {
    const audioElement = currentNarrationRef.current;
    if (!audioElement) return;
    
    if (audioElement.paused) {
      audioElement.play().catch(console.error);
      setIsAudioPlaying(true);
    } else {
      audioElement.pause();
      setIsAudioPlaying(false);
    }
  };
  
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

          {/* Áudio ou Desktop */}
          {hasActiveAudio ? (
            <button
              onClick={handleToggleAudio}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                isAudioPlaying
                  ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              {isAudioPlaying ? (
                <Pause className="w-6 h-6 transition-transform" />
              ) : (
                <Play className="w-6 h-6 transition-transform" />
              )}
              <span className="text-[10px] font-medium leading-tight text-center">
                {isAudioPlaying ? "Pausar" : "Continuar"}
              </span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/videoaulas")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                isActive("/videoaulas")
                  ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              <Monitor className={cn("w-6 h-6 transition-transform", isActive("/videoaulas") && "scale-110")} />
              <span className="text-[10px] font-medium leading-tight text-center">Desktop</span>
            </button>
          )}

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
