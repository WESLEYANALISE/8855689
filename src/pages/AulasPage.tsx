import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MobileTrilhasAprender } from "@/components/mobile/MobileTrilhasAprender";
import { DesktopTrilhasAprender } from "@/components/desktop/DesktopTrilhasAprender";
import { useDeviceType } from "@/hooks/use-device-type";
import themisEstudosDesktop from "@/assets/themis-estudos-desktop.webp";

const AulasPage = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header com botão voltar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Aulas</h1>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden px-2 py-4">
        <MobileTrilhasAprender />
      </div>

      {/* Desktop */}
      <div className="hidden md:block px-6 py-8 relative">
        <div className="fixed left-0 right-0 bottom-0 z-0 pointer-events-none" style={{ top: '60px' }}>
          <img
            src={themisEstudosDesktop}
            alt="Jornada de Estudos"
            className="w-full h-full object-cover object-top opacity-60"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
        </div>
        <div className="relative z-10">
          <DesktopTrilhasAprender />
        </div>
      </div>
    </div>
  );
};

export default AulasPage;
