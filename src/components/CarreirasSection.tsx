import { memo, useCallback } from "react";
import { Briefcase, ArrowRight } from "lucide-react";

// Imagens de carreiras
import carreiraAdvogado from "@/assets/carreira-advogado.webp";
import carreiraJuiz from "@/assets/carreira-juiz.webp";
import carreiraDelegado from "@/assets/carreira-delegado.webp";
import carreiraPromotor from "@/assets/carreira-promotor.webp";
import carreiraPrf from "@/assets/carreira-prf.webp";
import carreiraPf from "@/assets/pf-004-opt.webp";

interface CarreirasSectionProps {
  isDesktop: boolean;
  navigate: (path: string) => void;
  handleLinkHover: (path: string) => void;
}

// Itens de CARREIRAS
const itensCarreiras = [
  { id: "advogado", title: "Advogado", image: carreiraAdvogado, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=advogado" },
  { id: "juiz", title: "Juiz", image: carreiraJuiz, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=juiz" },
  { id: "delegado", title: "Delegado", image: carreiraDelegado, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=delegado" },
  { id: "promotor", title: "Promotor", image: carreiraPromotor, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=promotor" },
  { id: "prf", title: "PRF", image: carreiraPrf, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=prf" },
  { id: "pf", title: "Polícia Federal", image: carreiraPf, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=pf" },
];

export const CarreirasSection = memo(({ isDesktop, navigate, handleLinkHover }: CarreirasSectionProps) => {
  const handleNavigate = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  return (
    <div className="space-y-3">
      {/* Header FORA do container */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <Briefcase className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <h3 className="font-playfair text-xl md:text-lg font-bold text-amber-100 tracking-tight">
              Carreiras
            </h3>
            <p className="text-white/70 text-xs">
              Explore as profissões jurídicas
            </p>
          </div>
        </div>
        
        {/* Botão Ver mais */}
        <button
          onClick={() => handleNavigate('/carreiras-juridicas')}
          onMouseEnter={() => handleLinkHover('/carreiras-juridicas')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
        >
          <span>Ver mais</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Container - mesma estética do Em Alta */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 md:p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
        {/* Grid de Cards de Carreiras com imagens */}
        <div className={`grid gap-3 relative z-10 ${isDesktop ? 'grid-cols-6' : 'grid-cols-2'}`}>
          {itensCarreiras.map((item) => (
            <button 
              key={item.id} 
              onClick={() => handleNavigate(item.route)} 
              className={`group rounded-xl overflow-hidden relative transition-transform duration-150 hover:scale-[1.02] ${isDesktop ? 'aspect-square' : 'aspect-[4/3]'}`}
            >
              {/* Imagem de fundo */}
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
              
              {/* Overlay gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Nome da carreira */}
              <div className="absolute inset-x-0 bottom-0 p-3">
                <h4 className="font-condensed font-bold text-white text-sm drop-shadow-lg uppercase tracking-wide">
                  {item.title}
                </h4>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

CarreirasSection.displayName = 'CarreirasSection';

export default CarreirasSection;
