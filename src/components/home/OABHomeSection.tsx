import { memo, useCallback } from "react";
import { Gavel, Target, FileText, ChevronRight } from "lucide-react";

interface OABHomeSectionProps {
  isDesktop: boolean;
  navigate: (path: string) => void;
  handleLinkHover: (path: string) => void;
}

const fasesOAB = [
  { 
    id: "primeira-fase", 
    title: "1ª Fase", 
    description: "Prova Objetiva", 
    icon: Target, 
    route: "/oab/primeira-fase" 
  },
  { 
    id: "segunda-fase", 
    title: "2ª Fase", 
    description: "Prova Prática", 
    icon: FileText, 
    route: "/oab/segunda-fase" 
  },
];

export const OABHomeSection = memo(({ isDesktop, navigate, handleLinkHover }: OABHomeSectionProps) => {
  const handleNavigate = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  return (
    <div className="space-y-3" data-tutorial="oab-section">
      {/* Header FORA do container */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-xl">
            <Gavel className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-playfair text-xl md:text-lg font-bold text-amber-100 tracking-tight">
              OAB
            </h3>
            <p className="text-white/70 text-xs">
              Prepare-se para a aprovação
            </p>
          </div>
        </div>
      </div>

      {/* Container vermelho */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 md:p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
        {/* Grid de Cards - 2 colunas */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {fasesOAB.map((item) => {
            const Icon = item.icon;
            return (
              <button 
                key={item.id} 
                onClick={() => handleNavigate(item.route)}
                onMouseEnter={() => handleLinkHover(item.route)}
                className="group bg-white/15 rounded-xl p-4 text-left transition-all duration-150 hover:bg-white/20 flex flex-col gap-2 border border-white/10 hover:border-white/20 overflow-hidden relative h-[120px]"
                style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.4)' }}
              >
                <div className="bg-white/20 rounded-lg p-2 w-fit group-hover:bg-white/30 transition-colors shadow-lg">
                  <Icon className="w-5 h-5 text-amber-100 drop-shadow-md" />
                </div>
                <div>
                  <h4 className="font-playfair text-base font-bold text-amber-100 mb-0.5 group-hover:translate-x-0.5 transition-transform tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {item.title}
                  </h4>
                  <p className="text-white text-xs" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                    {item.description}
                  </p>
                </div>
                {/* Setinha indicadora de clicável */}
                <ChevronRight className="absolute bottom-3 right-3 w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

OABHomeSection.displayName = 'OABHomeSection';

export default OABHomeSection;
