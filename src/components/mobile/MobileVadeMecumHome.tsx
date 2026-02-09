import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, BookOpen, Gavel, Calendar, Bell, ChevronRight, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import brasaoRepublica from "@/assets/brasao-republica.png";
import heroVadeMecumPlanalto from "@/assets/hero-vademecum-planalto.webp";
import heroVadeMecumBusca from "@/assets/hero-vademecum-busca.webp";
import { PesquisaLegislacaoTimeline } from "@/components/PesquisaLegislacaoTimeline";
import ExplicacoesList from "@/components/lei-seca/ExplicacoesList";
import { AnimatePresence } from "framer-motion";

// Cards principais do Vade Mecum
const mainCards = [
  {
    id: "pesquisa-legislacao",
    title: "Legislação",
    description: "Constituição, Códigos, Estatutos, Súmulas",
    icon: Scale,
    route: "",
    iconBg: "bg-blue-500",
    color: "#3b82f6"
  },
  {
    id: "resenha-diaria",
    title: "Resenha Diária",
    description: "Novas leis no Diário Oficial",
    icon: Calendar,
    route: "/vade-mecum/resenha-diaria",
    iconBg: "bg-orange-500",
    color: "#f97316"
  },
  {
    id: "push-legislacao",
    title: "Push de Legislação",
    description: "Alertas de novas leis por e-mail",
    icon: Bell,
    route: "/vade-mecum/push-legislacao",
    iconBg: "bg-emerald-500",
    color: "#10b981"
  }
];

export const MobileVadeMecumHome = memo(() => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("menu");
  const [showLegislacao, setShowLegislacao] = useState(false);

  const handleMainCardClick = (card: typeof mainCards[0]) => {
    if (card.id === "pesquisa-legislacao") {
      setShowLegislacao(true);
    } else {
      navigate(card.route);
    }
  };

  // Se clicou em "Pesquisa de Legislação", mostra a tela animada
  if (showLegislacao) {
    return (
      <AnimatePresence mode="wait">
        <PesquisaLegislacaoTimeline onVoltar={() => setShowLegislacao(false)} />
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-32">
      {/* Hero Background Full Screen FIXO */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ top: '160px' }}>
        {/* Menu background */}
        <img
          src={heroVadeMecumPlanalto}
          alt="Vade Mecum"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${activeTab === "menu" ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
          fetchPriority="high"
        />
        {/* Busca background */}
        <img
          src={heroVadeMecumBusca}
          alt="Vade Mecum - Busca"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${activeTab === "busca" ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
        />
        
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0 transition-all duration-300"
          style={{
            background: activeTab === "menu" 
              ? `linear-gradient(
                  to bottom,
                  hsl(var(--background) / 0) 0%,
                  hsl(var(--background) / 0.15) 30%,
                  hsl(var(--background) / 0.4) 60%,
                  hsl(var(--background) / 0.85) 100%
                )`
              : `linear-gradient(
                  to bottom,
                  hsl(var(--background) / 0.5) 0%,
                  hsl(var(--background) / 0.65) 30%,
                  hsl(var(--background) / 0.8) 60%,
                  hsl(var(--background) / 0.92) 100%
                )`
          }}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-amber-800/30">
              <Scale className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Vade Mecum X</h2>
              <p className="text-sm text-muted-foreground">
                Seu Vade Mecum Jurídico <span className="text-amber-400 font-semibold">2026</span>
              </p>
            </div>
          </div>
        </div>

        {/* Sistema de Tabs */}
        <div className="px-4 pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-card/80 backdrop-blur-md border border-border/50 h-auto p-1">
              <TabsTrigger 
                value="menu" 
                className="flex items-center gap-1.5 py-2.5 text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
              >
                <Scale className="w-4 h-4" />
                <span>Menu</span>
              </TabsTrigger>
              <TabsTrigger 
                value="busca" 
                className="flex items-center gap-1.5 py-2.5 text-xs data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
              >
                <Search className="w-4 h-4" />
                <span>Busca</span>
              </TabsTrigger>
              <TabsTrigger 
                value="explicacao" 
                className="flex items-center gap-1.5 py-2.5 text-xs data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explicação</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto">
          {/* Aba Menu - Timeline Curva */}
          {activeTab === "menu" && (
            <div className="px-4 pb-8 pt-6">
              <div className="relative">
                {/* Linha curva SVG de fundo com animação de luz */}
                <svg 
                  className="absolute left-0 top-0 w-full h-full pointer-events-none"
                  viewBox="0 0 400 450"
                  preserveAspectRatio="none"
                  style={{ zIndex: 0, willChange: 'transform', transform: 'translateZ(0)' }}
                >
                  <defs>
                    <linearGradient id="timelineGradientHome" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    
                    <filter id="glowHome" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <path
                    d="M 50 30 
                       Q 350 30, 350 120
                       Q 350 210, 50 210
                       Q -50 210, 50 300
                       Q 150 390, 350 390"
                    fill="none"
                    stroke="url(#timelineGradientHome)"
                    strokeWidth="3"
                    strokeDasharray="8 4"
                    className="opacity-60"
                  />
                  
                  <circle r="6" fill="white" filter="url(#glowHome)">
                    <animateMotion
                      dur="4s"
                      repeatCount="indefinite"
                      path="M 50 30 
                            Q 350 30, 350 120
                            Q 350 210, 50 210
                            Q -50 210, 50 300
                            Q 150 390, 350 390"
                    />
                    <animate 
                      attributeName="opacity" 
                      values="0.3;1;0.3" 
                      dur="2s" 
                      repeatCount="indefinite" 
                    />
                  </circle>
                </svg>

                {/* Cards da timeline */}
                <div className="relative z-10 space-y-6" style={{ contain: 'content' }}>
                  {mainCards.map((card, index) => {
                    const Icon = card.icon;
                    const isEven = index % 2 === 0;
                    
                    return (
                      <div
                        key={card.id}
                        className={`flex ${isEven ? 'justify-start' : 'justify-end'}`}
                        style={{ 
                          opacity: 0,
                          transform: 'translateY(-20px) translateZ(0)',
                          animation: `slideDown 0.5s ease-out ${index * 0.15}s forwards`,
                          willChange: 'transform, opacity'
                        }}
                      >
                        <button
                          onClick={() => handleMainCardClick(card)}
                          className={`
                            w-[75%]
                            bg-card/95 backdrop-blur-sm
                            rounded-2xl
                            border-2 border-white/20
                            cursor-pointer
                            hover:scale-[1.02] hover:shadow-2xl
                            transition-all duration-200
                            relative overflow-hidden
                            shadow-xl
                            group
                            text-left
                          `}
                          style={{
                            borderLeftColor: card.color,
                            borderLeftWidth: '4px',
                            transform: 'translateZ(0)',
                            willChange: 'transform',
                            height: '72px'
                          }}
                        >
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: `radial-gradient(circle at center, ${card.color}20 0%, transparent 70%)`
                            }}
                          />
                          
                          <div className="flex items-center gap-3 relative z-10 h-full px-4">
                            <div 
                              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${card.iconBg}`}
                              style={{ boxShadow: `0 4px 20px ${card.color}40` }}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-foreground truncate">{card.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.description}</p>
                            </div>
                            
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {/* Seção especial com brasão */}
                <div 
                  className="mt-10 text-center"
                  style={{ 
                    opacity: 0,
                    animation: 'slideDown 0.6s ease-out 0.5s forwards'
                  }}
                >
                  <div className="inline-flex flex-col items-center">
                    <img 
                      src={brasaoRepublica} 
                      alt="Brasão da República Federativa do Brasil" 
                      className="w-20 h-20 object-contain mb-4 drop-shadow-lg"
                    />
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      Seu Vade Mecum Digital
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                      Acesse a legislação brasileira sempre atualizada, jurisprudências consolidadas do STF e STJ, 
                      e receba notificações sobre novas leis diretamente no seu dispositivo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aba Busca */}
          {activeTab === "busca" && (
            <div className="px-4 pb-8 pt-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50">
                  <Search className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Busca Avançada</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Acesse o Vade Mecum completo para buscar artigos, leis e códigos
                  </p>
                  <button
                    onClick={() => navigate('/vade-mecum?tab=busca')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-medium transition-colors"
                  >
                    Abrir Busca Completa
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Aba Explicação */}
          {activeTab === "explicacao" && (
            <div className="px-4 pb-8 pt-6">
              <ExplicacoesList />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MobileVadeMecumHome.displayName = 'MobileVadeMecumHome';

export default MobileVadeMecumHome;
