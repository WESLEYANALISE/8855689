import { memo, useCallback } from "react";
import { GraduationCap, FileText, FileCheck2, Video, Target, ChevronRight, Sparkles, Briefcase } from "lucide-react";

interface EmAltaSectionProps {
  isDesktop: boolean;
  navigate: (path: string) => void;
  handleLinkHover: (path: string) => void;
}

// Itens de ESTUDOS - ordem: Resumos, Videoaulas, Questões, Flashcards, Documentos, Carreiras
const itensEstudos = [
  { id: "resumos", title: "Resumos", description: "Conteúdo objetivo e direto", icon: FileCheck2, route: "/resumos-juridicos" },
  { id: "videoaulas", title: "Videoaulas", description: "Aulas em vídeo", icon: Video, route: "/videoaulas" },
  { id: "questoes", title: "Questões", description: "Pratique com questões reais", icon: Target, route: "/questoes" },
  { id: "flashcards", title: "Flashcards", description: "Memorização eficiente", icon: Sparkles, route: "/flashcards/areas" },
  { id: "documentos", title: "Documentos", description: "Petições e contratos", icon: FileText, route: "/peticoes" },
  { id: "carreiras", title: "Carreiras", description: "Explore as carreiras jurídicas", icon: Briefcase, route: "/carreiras-juridicas" },
];

export const EmAltaSection = memo(({ isDesktop, navigate, handleLinkHover }: EmAltaSectionProps) => {
  const handleNavigate = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  return (
    <div className="space-y-3" data-tutorial="em-alta">
      {/* Header FORA do container */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <GraduationCap className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <h3 className="font-playfair text-xl md:text-lg font-bold text-amber-100 tracking-tight">
              Estudos
            </h3>
            <p className="text-white/70 text-xs">
              Material de apoio
            </p>
          </div>
        </div>
      </div>

      {/* Container vermelho */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 md:p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
        {/* Grid de Cards de Estudos */}
        <div className={`grid gap-2 relative z-10 ${isDesktop ? 'grid-cols-6' : 'grid-cols-2 gap-3'}`}>
          {itensEstudos.map((item) => {
            const Icon = item.icon;
            return (
              <button 
                key={item.id} 
                onClick={() => handleNavigate(item.route)} 
                className={`group bg-white/15 rounded-xl p-2.5 text-left transition-all duration-150 hover:bg-white/20 flex flex-col gap-1.5 border border-white/10 hover:border-white/20 overflow-hidden relative ${isDesktop ? 'h-[100px]' : 'h-[130px] rounded-2xl p-3 gap-2'}`}
                style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.4)' }}
              >
                <div className={`bg-white/20 rounded-lg w-fit group-hover:bg-white/30 transition-colors shadow-lg ${isDesktop ? 'p-1.5' : 'p-2 rounded-xl'}`}>
                  <Icon className={`text-amber-100 drop-shadow-md ${isDesktop ? 'w-4 h-4' : 'w-5 h-5'}`} />
                </div>
                <div>
                  <h4 className={`font-playfair font-bold text-amber-100 mb-0.5 group-hover:translate-x-0.5 transition-transform tracking-wide ${isDesktop ? 'text-xs' : 'text-sm'}`} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className={`text-white line-clamp-2 leading-snug ${isDesktop ? 'text-[10px]' : 'text-xs'}`} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                      {item.description}
                    </p>
                  )}
                </div>
                <ChevronRight className={`absolute bottom-2 right-2 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all ${isDesktop ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

EmAltaSection.displayName = 'EmAltaSection';

export default EmAltaSection;
