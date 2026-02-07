import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Briefcase, Scale, Shield, FileText, Building2, Gavel, Car, BadgeCheck, Users } from "lucide-react";
import { preloadImages } from "@/hooks/useInstantCache";

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

// Configuração completa das carreiras
interface CarreiraConfig {
  icon: any;
  cor: string;
  nome: string;
  descricao: string;
  capa: string;
}

const carreirasConfig: Record<string, CarreiraConfig> = {
  advogado: { icon: Briefcase, cor: "from-amber-600 to-amber-800", nome: "Advogado", descricao: "Defenda causas e clientes", capa: advogadoCapa },
  juiz: { icon: Gavel, cor: "from-purple-600 to-purple-800", nome: "Juiz", descricao: "Julgue processos judiciais", capa: juizCapa },
  delegado: { icon: Shield, cor: "from-blue-600 to-blue-800", nome: "Delegado", descricao: "Investigue crimes", capa: delegadoCapa },
  promotor: { icon: Scale, cor: "from-red-600 to-red-800", nome: "Promotor", descricao: "Represente a sociedade", capa: promotorCapa },
  defensor: { icon: FileText, cor: "from-green-600 to-green-800", nome: "Defensor Público", descricao: "Assista quem precisa", capa: defensorCapa },
  procurador: { icon: Building2, cor: "from-indigo-600 to-indigo-800", nome: "Procurador", descricao: "Defenda o Estado", capa: procuradorCapa },
  pf: { icon: BadgeCheck, cor: "from-slate-600 to-slate-800", nome: "Polícia Federal", descricao: "Segurança nacional", capa: pfCapa },
  prf: { icon: Car, cor: "from-yellow-600 to-yellow-800", nome: "PRF", descricao: "Polícia Rodoviária Federal", capa: prfCapa },
  pcivil: { icon: Shield, cor: "from-sky-600 to-sky-800", nome: "Polícia Civil", descricao: "Investigação estadual", capa: pcivilCapa },
  pmilitar: { icon: Users, cor: "from-emerald-600 to-emerald-800", nome: "Polícia Militar", descricao: "Policiamento ostensivo", capa: pmilitarCapa },
};

// Ordem de exibição das carreiras
const CARREIRAS_ORDEM = ['advogado', 'juiz', 'delegado', 'promotor', 'defensor', 'procurador', 'pf', 'prf', 'pcivil', 'pmilitar'];

// Lista de todas as imagens para preload
const ALL_CAREER_IMAGES = [
  advogadoCapa, juizCapa, delegadoCapa, promotorCapa, defensorCapa,
  procuradorCapa, pfCapa, prfCapa, pcivilCapa, pmilitarCapa
];

const CarreirasJuridicas = () => {
  const navigate = useNavigate();

  // Preload de todas as imagens no mount
  useEffect(() => {
    preloadImages(ALL_CAREER_IMAGES);
  }, []);

  // Montar lista completa de carreiras na ordem definida
  const carreiras = CARREIRAS_ORDEM.map(carreiraId => {
    const config = carreirasConfig[carreiraId];
    return {
      id: carreiraId,
      nome: config?.nome || carreiraId,
      descricao: config?.descricao || '',
      cor: config?.cor || 'from-gray-600 to-gray-800',
      icon: config?.icon || Briefcase,
      capa: config?.capa || null,
    };
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Bússola de Carreira</h1>
          <p className="text-muted-foreground">Explore as profissões jurídicas</p>
        </div>

        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          {carreiras.map((carreira) => (
            <button
              key={carreira.id}
              onClick={() => navigate(`/estudo-carreira/${carreira.id}`)}
              className="relative h-40 rounded-2xl overflow-hidden group shadow-xl transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              {/* Background Image ou Gradient */}
              {carreira.capa ? (
                <img 
                  src={carreira.capa} 
                  alt={carreira.nome}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${carreira.cor}`} />
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Content - Título alinhado à esquerda na parte inferior */}
              <div className="relative z-10 h-full flex flex-col justify-end p-4">
                <h3 className="text-lg font-bold text-white text-left">
                  {carreira.nome}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarreirasJuridicas;
