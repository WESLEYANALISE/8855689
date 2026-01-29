import { useState } from "react";
import { Flame, ArrowRight, Scale, Library, MessageCircle, Newspaper, MapPin, Landmark, FileCheck2, Sparkles, Video, Target, Wrench, BookOpen, ChevronRight, Briefcase } from "lucide-react";

// Imagens de carreiras
import carreiraAdvogado from "@/assets/carreira-advogado.webp";
import carreiraJuiz from "@/assets/carreira-juiz.webp";
import carreiraDelegado from "@/assets/carreira-delegado.webp";
import carreiraPromotor from "@/assets/carreira-promotor.webp";
import carreiraPrf from "@/assets/carreira-prf.webp";
import carreiraPf from "@/assets/pf-004.jpg";

interface EmAltaSectionProps {
  isDesktop: boolean;
  navigate: (path: string) => void;
  handleLinkHover: (path: string) => void;
}

// Itens para aba FERRAMENTAS (sem Vade Mecum - já está em Estudos)
const itensFerramentas = [
  { id: "evelyn-whatsapp", title: "Evelyn WhatsApp", description: "Sua assistente jurídica 24h", icon: MessageCircle, route: "/evelyn" },
  { id: "peticoes", title: "Petições", description: "Modelos de petições e contratos", icon: FileCheck2, route: "/peticoes" },
  { id: "boletins", title: "Boletins", description: "O essencial em minutos", icon: Newspaper, route: "/ferramentas/boletins" },
  { id: "localizador", title: "Localizador", description: "Encontre escritórios, cartórios e mais", icon: MapPin, route: "/localizador-juridico" },
  { id: "tres-poderes", title: "Três Poderes", description: "Executivo, Legislativo e Judiciário", icon: Landmark, route: "/tres-poderes" },
  { id: "dicionario", title: "Dicionário", description: "Consulte termos jurídicos", icon: BookOpen, route: "/dicionario" },
];

// Itens para aba ESTUDOS - ordem: Vade Mecum, Biblioteca, Resumos, Videoaulas, Flashcards, Questões
const itensEstudos = [
  { id: "vade-mecum", title: "Vade Mecum", titleHighlight: "Comentado", description: "Legislação comentada e atualizada", icon: Scale, route: "/vade-mecum" },
  { id: "biblioteca", title: "Biblioteca", description: "Acervo completo de livros", icon: Library, route: "/bibliotecas" },
  { id: "resumos", title: "Resumos", description: "Conteúdo objetivo e direto", icon: FileCheck2, route: "/resumos-juridicos" },
  { id: "videoaulas", title: "Videoaulas", description: "Aulas em vídeo", icon: Video, route: "/videoaulas" },
  { id: "flashcards", title: "Flashcards", description: "Memorização eficiente", icon: Sparkles, route: "/flashcards/areas" },
  { id: "questoes", title: "Questões", description: "Pratique com questões reais", icon: Target, route: "/questoes" },
];

// Itens para aba CARREIRAS - navega para artigos do blogger jurídico
const itensCarreiras = [
  { id: "advogado", title: "Advogado", image: carreiraAdvogado, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=advogado" },
  { id: "juiz", title: "Juiz", image: carreiraJuiz, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=juiz" },
  { id: "delegado", title: "Delegado", image: carreiraDelegado, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=delegado" },
  { id: "promotor", title: "Promotor", image: carreiraPromotor, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=promotor" },
  { id: "prf", title: "PRF", image: carreiraPrf, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=prf" },
  { id: "pf", title: "Polícia Federal", image: carreiraPf, route: "/blogger-juridico/artigos?tipo=carreiras&carreira=pf" },
];

export const EmAltaSection = ({ isDesktop, navigate, handleLinkHover }: EmAltaSectionProps) => {
  const [activeTab, setActiveTab] = useState<"ferramentas" | "estudos" | "carreiras">("estudos");
  
  const itensAtivos = activeTab === "ferramentas" ? itensFerramentas : itensEstudos;

  return (
    <div className="space-y-3" data-tutorial="em-alta">
      {/* Header FORA do container - estilo Jornada de Estudos */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <Flame className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <h3 className="font-playfair text-xl md:text-lg font-bold text-amber-100 tracking-tight">
              Em Alta
            </h3>
            <p className="text-white/70 text-xs">
              Recursos mais acessados
            </p>
          </div>
        </div>
        
        {/* Botão Ver mais para Carreiras */}
        {activeTab === "carreiras" && (
          <button
            onClick={() => navigate('/carreiras-juridicas')}
            onMouseEnter={() => handleLinkHover('/carreiras-juridicas')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
          >
            <span>Ver mais</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Container vermelho - mesma cor da Jornada de Estudos */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 md:p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
        {/* Menu de Alternância com Shimmer em todos */}
        <div className="flex gap-2 mb-4 relative z-10">
          <button
            onClick={() => setActiveTab("estudos")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-condensed font-medium transition-all duration-200 relative overflow-hidden ${
              activeTab === "estudos"
                ? "bg-white/25 text-white shadow-lg border border-white/30"
                : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white border border-transparent"
            }`}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
            <Library className="w-3.5 h-3.5 text-amber-100 relative z-10" />
            <span className="relative z-10">Estudos</span>
          </button>
          <button
            onClick={() => setActiveTab("ferramentas")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-condensed font-medium transition-all duration-200 relative overflow-hidden ${
              activeTab === "ferramentas"
                ? "bg-white/25 text-white shadow-lg border border-white/30"
                : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white border border-transparent"
            }`}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" style={{ animationDelay: '0.5s' }} />
            <Wrench className="w-3.5 h-3.5 text-amber-100 relative z-10" />
            <span className="relative z-10">Ferramentas</span>
          </button>
          <button
            onClick={() => setActiveTab("carreiras")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-condensed font-medium transition-all duration-200 relative overflow-hidden ${
              activeTab === "carreiras"
                ? "bg-white/25 text-white shadow-lg border border-white/30"
                : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white border border-transparent"
            }`}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" style={{ animationDelay: '1s' }} />
            <Briefcase className="w-3.5 h-3.5 text-amber-100 relative z-10" />
            <span className="relative z-10">Carreiras</span>
          </button>
        </div>
        
        {/* Conteúdo baseado na aba ativa */}
        {activeTab === "carreiras" ? (
          /* Grid de Cards de Carreiras com imagens */
          <div className={`grid gap-3 relative z-10 ${isDesktop ? 'grid-cols-6' : 'grid-cols-2'}`}>
            {itensCarreiras.map((item) => (
              <button 
                key={item.id} 
                onClick={() => navigate(item.route)} 
                className={`group rounded-xl overflow-hidden relative transition-transform duration-150 hover:scale-[1.02] ${isDesktop ? 'aspect-square' : 'aspect-[4/3]'}`}
              >
                {/* Imagem de fundo */}
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
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
        ) : (
          /* Grid de Cards para Estudos/Ferramentas */
          <div className={`grid gap-2 relative z-10 ${isDesktop ? 'grid-cols-6' : 'grid-cols-2 gap-3'}`}>
            {itensAtivos.map((item) => {
              const Icon = item.icon;
              const hasHighlight = 'titleHighlight' in item && item.titleHighlight;
              return (
                <button 
                  key={item.id} 
                  onClick={() => navigate(item.route)} 
                  className={`group bg-white/15 rounded-xl p-2.5 text-left transition-all duration-150 hover:bg-white/20 flex flex-col gap-1.5 border border-white/10 hover:border-white/20 overflow-hidden relative ${isDesktop ? 'h-[100px]' : 'h-[130px] rounded-2xl p-3 gap-2'}`}
                  style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.4)' }}
                >
                  {/* Badge Comentado no canto superior direito */}
                  {hasHighlight && (
                    <span className={`absolute top-1.5 right-1.5 italic bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent font-bold animate-pulse ${isDesktop ? 'text-[8px]' : 'text-[10px]'}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {(item as any).titleHighlight}
                    </span>
                  )}
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
                  {/* Setinha indicadora de clicável */}
                  <ChevronRight className={`absolute bottom-2 right-2 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all ${isDesktop ? 'w-4 h-4' : 'w-5 h-5'}`} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmAltaSection;