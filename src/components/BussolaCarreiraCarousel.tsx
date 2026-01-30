import { useNavigate } from "react-router-dom";
import { Compass, Loader2 } from "lucide-react";
import { useDeviceType } from "@/hooks/use-device-type";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

// Importar TODAS as imagens locais
import advogadoCapa from '@/assets/carreira-advogado.webp';
import juizCapa from '@/assets/carreira-juiz.webp';
import delegadoCapa from '@/assets/carreira-delegado.webp';
import promotorCapa from '@/assets/carreira-promotor.webp';
import defensorCapa from '@/assets/carreira-defensor.webp';
import procuradorCapa from '@/assets/carreira-procurador.webp';
import pfCapa from '@/assets/pf-004-opt.webp';
import prfCapa from '@/assets/carreira-prf.webp';
import pcivilCapa from '@/assets/carreira-pcivil.webp';
import pmilitarCapa from '@/assets/carreira-pmilitar.webp';

// Carreiras jurídicas com nomes e capas locais
interface CarreiraConfig {
  nome: string;
  capa: string;
}

const CARREIRAS_CONFIG: Record<string, CarreiraConfig> = {
  advogado: { nome: 'Advogado', capa: advogadoCapa },
  juiz: { nome: 'Juiz', capa: juizCapa },
  delegado: { nome: 'Delegado', capa: delegadoCapa },
  promotor: { nome: 'Promotor', capa: promotorCapa },
  defensor: { nome: 'Defensor Público', capa: defensorCapa },
  procurador: { nome: 'Procurador', capa: procuradorCapa },
  pf: { nome: 'Polícia Federal', capa: pfCapa },
  prf: { nome: 'PRF', capa: prfCapa },
  pcivil: { nome: 'Polícia Civil', capa: pcivilCapa },
  pmilitar: { nome: 'Polícia Militar', capa: pmilitarCapa },
};

// Ordem de exibição das carreiras - PRF e PF aparecem antes de Defensor e Procurador
// No carrossel mostra apenas as 6 primeiras, o restante aparece em "Ver mais"
const CARREIRAS_ORDEM = ['advogado', 'juiz', 'delegado', 'promotor', 'prf', 'pf', 'defensor', 'procurador', 'pcivil', 'pmilitar'];

export const BussolaCarreiraCarousel = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();

  const handleCarreiraClick = (carreiraId: string) => {
    // Navegar diretamente para os artigos da carreira
    navigate(`/blogger-juridico/artigos?tipo=carreiras&carreira=${carreiraId}`);
  };

  // Monta lista completa de carreiras usando ordem definida
  const carreiras = CARREIRAS_ORDEM.map(carreiraId => {
    const config = CARREIRAS_CONFIG[carreiraId];
    return {
      id: carreiraId,
      nome: config?.nome || carreiraId.charAt(0).toUpperCase() + carreiraId.slice(1),
      capa: config?.capa || null,
    };
  });

  return (
    <div className="space-y-4 mb-6 md:mb-8">
      <div className="bg-neutral-900/90 rounded-3xl p-4 md:p-4 relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-amber-900/20 rounded-2xl p-3 shadow-lg ring-1 ring-amber-800/30">
              <Compass className="w-6 h-6 md:w-5 md:h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl md:text-lg font-bold text-foreground tracking-tight">
                Carreiras
              </h3>
              <p className="text-muted-foreground text-xs">Bússola para explorar profissões jurídicas</p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={() => navigate('/carreiras-juridicas')} 
            className="bg-amber-500/20 hover:bg-amber-500/30 text-white border border-amber-500/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-full px-4 text-xs flex items-center gap-1.5 font-medium"
          >
            Ver mais
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        
        <div className={`grid gap-2 relative z-10 ${isDesktop ? 'grid-cols-5' : 'grid-cols-2 gap-3'}`}>
          {carreiras.slice(0, isDesktop ? 10 : 6).map((carreira) => (
            <button 
              key={carreira.id} 
              onClick={() => handleCarreiraClick(carreira.id)} 
              className={`group relative overflow-hidden rounded-xl text-left transition-all duration-300 shadow-lg border border-white/5 hover:border-amber-500/30 hover:shadow-amber-500/10 ${isDesktop ? 'h-[100px]' : 'h-[130px] rounded-2xl'}`}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                {carreira.capa ? (
                  <img 
                    src={carreira.capa} 
                    alt={carreira.nome}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-900/50 to-amber-950/80 flex items-center justify-center">
                    <Compass className="w-8 h-8 text-amber-400/50" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>

              {/* Content - Título alinhado à esquerda na parte inferior */}
              <div className={`relative z-10 h-full flex flex-col justify-end ${isDesktop ? 'p-2.5' : 'p-3'}`}>
                <h4 className={`font-bold text-white text-left group-hover:text-amber-300 transition-colors drop-shadow-lg ${isDesktop ? 'text-sm' : 'text-base'}`}>
                  {carreira.nome}
                </h4>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BussolaCarreiraCarousel;
