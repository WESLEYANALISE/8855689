import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Library, Wrench, Briefcase, ChevronRight, Landmark, Footprints, Scale, Gavel, ScrollText, Target, FileCheck2, Video, Sparkles, MessageCircle, MapPin, BookOpen } from "lucide-react";
import { useState } from "react";
import ResumosDisponiveisCarousel from "@/components/ResumosDisponiveisCarousel";

// Capas dos cards principais
import homeCardEstudos from "@/assets/home-card-estudos.webp";
import homeCardOab from "@/assets/home-card-oab.webp";

// Imagens de carreiras
import carreiraAdvogado from "@/assets/carreira-advogado.webp";
import carreiraJuiz from "@/assets/carreira-juiz.webp";
import carreiraDelegado from "@/assets/carreira-delegado.webp";
import carreiraPromotor from "@/assets/carreira-promotor.webp";
import carreiraPrf from "@/assets/carreira-prf.webp";
import carreiraPf from "@/assets/pf-004.jpg";

// Itens Em Alta
const itensFerramentas = [
  { id: "evelyn-whatsapp", title: "Evelyn WhatsApp", description: "Sua assistente jurídica 24h", icon: MessageCircle, route: "/evelyn" },
  { id: "peticoes", title: "Petições/Contratos", description: "Modelos prontos para usar", icon: FileCheck2, route: "/peticoes" },
  { id: "localizador", title: "Localizador Jurídico", description: "Encontre escritórios, cartórios e mais", icon: MapPin, route: "/localizador-juridico" },
  { id: "tres-poderes", title: "Três Poderes", description: "Executivo, Legislativo e Judiciário", icon: Landmark, route: "/tres-poderes" },
  { id: "dicionario", title: "Dicionário Jurídico", description: "Consulte termos jurídicos", icon: BookOpen, route: "/dicionario" },
];

const itensEstudos = [
  { id: "vade-mecum", title: "Vade Mecum", titleHighlight: "Comentado", description: "Legislação comentada e atualizada", icon: Scale, route: "/vade-mecum" },
  { id: "biblioteca", title: "Biblioteca", description: "Acervo completo de livros", icon: Library, route: "/bibliotecas" },
  { id: "resumos", title: "Resumos Jurídicos", description: "Conteúdo objetivo e direto", icon: FileCheck2, route: "/resumos-juridicos" },
  { id: "videoaulas", title: "Videoaulas", description: "Aulas em vídeo", icon: Video, route: "/tela" },
  { id: "flashcards", title: "Flashcards", description: "Memorização eficiente", icon: Sparkles, route: "/flashcards/areas" },
  { id: "questoes", title: "Questões", description: "Pratique com questões reais", icon: Target, route: "/questoes" },
];

const itensCarreiras = [
  { id: "advogado", title: "Advogado", image: carreiraAdvogado, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=advogado" },
  { id: "juiz", title: "Juiz", image: carreiraJuiz, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=juiz" },
  { id: "delegado", title: "Delegado", image: carreiraDelegado, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=delegado" },
  { id: "promotor", title: "Promotor", image: carreiraPromotor, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=promotor" },
  { id: "prf", title: "PRF", image: carreiraPrf, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=prf" },
  { id: "pf", title: "Polícia Federal", image: carreiraPf, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=pf" },
];

// Trilhas do Aprender
const trilhasAprender = [
  { 
    title: "Conceitos", 
    subtitle: "Bases do Direito", 
    icon: Landmark, 
    route: "/primeiros-passos" 
  },
  { 
    title: "Dominando", 
    subtitle: "Profundidade", 
    icon: Footprints, 
    route: "/dominando" 
  },
  { 
    title: "Temática", 
    subtitle: "Por Área", 
    icon: Scale, 
    route: "/biblioteca-tematica" 
  },
];

// Trilhas do OAB
const trilhasOAB = [
  { 
    title: "1ª Fase", 
    subtitle: "Prova Objetiva", 
    icon: ScrollText, 
    route: "/oab-trilhas" 
  },
  { 
    title: "2ª Fase", 
    subtitle: "Prova Prática", 
    icon: Gavel, 
    route: "/oab/segunda-fase" 
  },
  { 
    title: "Carreira", 
    subtitle: "Advocacia", 
    icon: Briefcase, 
    route: "/advogado" 
  },
];

// Componente de Trilha com Pegadas
interface TrilhaCardMiniProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  onClick: () => void;
  delay?: number;
  isActive?: boolean;
}

const TrilhaCardMini = ({ title, subtitle, icon: Icon, onClick, delay = 0 }: TrilhaCardMiniProps) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    onClick={onClick}
    className="group relative flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-br from-red-950/90 to-red-900/80 backdrop-blur-sm border border-amber-500/20 shadow-lg hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 hover:scale-105 hover:border-amber-400/40"
  >
    {/* Glow effect */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    {/* Icon */}
    <div className="relative z-10 p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 group-hover:border-amber-400/50 transition-all mb-2">
      <Icon className="w-6 h-6 text-amber-400" />
    </div>
    
    {/* Text */}
    <div className="relative z-10 text-center">
      <h4 className="font-cinzel text-sm font-bold text-amber-100 group-hover:text-amber-50 transition-colors">
        {title}
      </h4>
      <p className="text-[10px] text-amber-200/70 mt-0.5">{subtitle}</p>
    </div>
  </motion.button>
);

// Conector animado (pegadas)
const FootprintConnector = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scaleX: 0 }}
    animate={{ opacity: 1, scaleX: 1 }}
    transition={{ duration: 0.4, delay }}
    className="flex items-center gap-1 px-2"
  >
    <motion.div
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
    >
      <Footprints className="w-4 h-4 text-amber-500/60 rotate-90" />
    </motion.div>
    <motion.div
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
    >
      <Footprints className="w-4 h-4 text-amber-500/50 rotate-90" />
    </motion.div>
  </motion.div>
);

// Seção de Trilha Horizontal
interface TrailSectionProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  trilhas: typeof trilhasAprender;
  image: string;
  delay?: number;
  fullHeight?: boolean;
}

const TrailSection = ({ title, subtitle, icon: SectionIcon, trilhas, image, delay = 0, fullHeight = false }: TrailSectionProps) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`relative rounded-2xl overflow-hidden shadow-xl border border-red-800/30 ${fullHeight ? 'h-full' : ''}`}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-red-900 to-red-950/95" />
      
      {/* Imagem de fundo semi-transparente */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5 shadow-lg ring-2 ring-white/10">
            <SectionIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-playfair text-lg font-bold text-amber-100 tracking-tight">
              {title}
            </h3>
            <p className="text-white/60 text-xs">{subtitle}</p>
          </div>
        </div>
        
        {/* Trilhas Horizontais com Pegadas */}
        <div className="flex items-center justify-center">
          {trilhas.map((trilha, index) => (
            <div key={trilha.title} className="flex items-center">
              <TrilhaCardMini
                title={trilha.title}
                subtitle={trilha.subtitle}
                icon={trilha.icon}
                onClick={() => navigate(trilha.route)}
                delay={delay + index * 0.1}
              />
              {index < trilhas.length - 1 && (
                <FootprintConnector delay={delay + index * 0.1 + 0.15} />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const DesktopHomeDestaque = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"ferramentas" | "estudos" | "carreiras">("estudos");

  const itensAtivos = activeTab === "ferramentas" ? itensFerramentas : itensEstudos;

  return (
    <div className="space-y-6">
      {/* Layout Principal - 60/40 */}
      <div className="flex gap-6 items-stretch">
        {/* Esquerda - Trilhas de Aprender e OAB (60%) */}
        <div className="flex-[6] flex flex-col gap-4">
          <div className="flex-1">
            <TrailSection
              title="Aprender"
              subtitle="Sua jornada de estudos jurídicos"
              icon={Library}
              trilhas={trilhasAprender}
              image={homeCardEstudos}
              delay={0}
              fullHeight
            />
          </div>
          <div className="flex-1">
            <TrailSection
              title="OAB"
              subtitle="Sua aprovação começa aqui"
              icon={Gavel}
              trilhas={trilhasOAB}
              image={homeCardOab}
              delay={0.15}
              fullHeight
            />
          </div>
        </div>

        {/* Direita - Em Alta (40%) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-[4] bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-5 shadow-2xl border border-red-800/30"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2.5 shadow-lg ring-2 ring-white/10">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-playfair text-lg font-bold text-amber-100 tracking-tight">
                  {activeTab === "carreiras" ? "Carreiras" : "Em Alta"}
                </h3>
                <p className="text-white/70 text-xs">
                  {activeTab === "carreiras" ? "Explore profissões" : "Mais acessados"}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 mb-4">
            {[
              { id: "estudos", icon: Library, label: "Estudos" },
              { id: "ferramentas", icon: Wrench, label: "Ferramentas" },
              { id: "carreiras", icon: Briefcase, label: "Carreiras" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white/25 text-white shadow-lg border border-white/30"
                    : "bg-white/10 text-white/70 hover:bg-white/15"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Conteúdo - Grid vertical para caber no lado direito */}
          {activeTab === "carreiras" ? (
            <div className="grid grid-cols-3 gap-2">
              {itensCarreiras.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => navigate(item.route)} 
                  className="group rounded-lg overflow-hidden relative aspect-square transition-transform hover:scale-[1.03]"
                >
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <h4 className="font-playfair font-bold text-white text-[11px] drop-shadow-lg">
                      {item.title}
                    </h4>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {itensAtivos.map((item) => {
                const Icon = item.icon;
                const hasHighlight = 'titleHighlight' in item && item.titleHighlight;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => navigate(item.route)} 
                    className="group bg-white/15 rounded-lg p-3 text-left transition-colors hover:bg-white/25 flex flex-col gap-2 border border-white/15 relative"
                  >
                    {hasHighlight && (
                      <span className="absolute top-1.5 right-1.5 italic bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent font-bold text-[9px] animate-pulse">
                        {(item as any).titleHighlight}
                      </span>
                    )}
                    <div className="bg-white/15 rounded-md w-fit p-1.5 group-hover:bg-white/25 transition-colors">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-playfair font-bold text-amber-100 text-xs mb-0.5">
                        {item.title}
                      </h4>
                      <p className="text-white/70 text-[10px] line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="absolute bottom-2 right-2 w-3.5 h-3.5 text-white/50 group-hover:text-white/80 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Boletins Informativos - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <ResumosDisponiveisCarousel tipo="ambos" showTabs={true} />
      </motion.div>
    </div>
  );
};

export default DesktopHomeDestaque;
