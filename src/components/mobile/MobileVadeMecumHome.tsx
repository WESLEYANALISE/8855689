import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, BookOpen, Gavel, Calendar, Bell, ChevronRight, Search, ScrollText, BookText, HandCoins, Landmark, PenTool, Newspaper } from "lucide-react";
import brasaoRepublica from "@/assets/brasao-republica.png";
import heroVadeMecumPlanalto from "@/assets/hero-vademecum-planalto.webp";
import heroVadeMecumBusca from "@/assets/hero-vademecum-busca.webp";
import ExplicacoesList from "@/components/lei-seca/ExplicacoesList";
import { cn } from "@/lib/utils";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";

// Categorias de Legislação para o grid
const categoriasLegislacao = [
  { id: "constituicao", title: "Constituição", description: "CF/88 completa e atualizada", icon: Landmark, iconBg: "bg-blue-500", color: "#3b82f6" },
  { id: "codigos", title: "Códigos", description: "Civil, Penal, CPC, CPP...", icon: Scale, iconBg: "bg-purple-500", color: "#a855f7" },
  { id: "legislacao-penal", title: "Legislação Penal", description: "Lei de Drogas, Maria da Penha...", icon: Gavel, iconBg: "bg-red-500", color: "#ef4444" },
  { id: "estatutos", title: "Estatutos", description: "ECA, Idoso, OAB, Cidade...", icon: BookOpen, iconBg: "bg-amber-500", color: "#f59e0b" },
  { id: "previdenciario", title: "Previdenciário", description: "Lei 8.213, Lei 8.212...", icon: HandCoins, iconBg: "bg-emerald-500", color: "#10b981" },
  { id: "sumulas", title: "Súmulas", description: "STF, STJ, TST, Vinculantes", icon: BookText, iconBg: "bg-cyan-500", color: "#06b6d4" },
  { id: "leis-ordinarias", title: "Leis Ordinárias", description: "Legislação esparsa federal", icon: ScrollText, iconBg: "bg-orange-500", color: "#f97316" },
  { id: "pec", title: "PEC", description: "Propostas de Emenda", icon: PenTool, iconBg: "bg-pink-500", color: "#ec4899" },
];

const categoriasRoutes: Record<string, string> = {
  "constituicao": "/vade-mecum?categoria=constituicao",
  "codigos": "/vade-mecum?categoria=codigos",
  "legislacao-penal": "/vade-mecum?categoria=legislacao-penal",
  "estatutos": "/vade-mecum?categoria=estatutos",
  "previdenciario": "/resumos-juridicos/artigos-lei/previdenciario",
  "sumulas": "/resumos-juridicos/artigos-lei/sumulas",
  "leis-ordinarias": "/vade-mecum?categoria=leis-ordinarias",
  "pec": "/vade-mecum?categoria=pec",
};

// Tabs do menu de rodapé
type FooterTab = "legislacao" | "busca" | "explicacao" | "resenha" | "push";

export const MobileVadeMecumHome = memo(() => {
  const navigate = useNavigate();
  const [activeFooterTab, setActiveFooterTab] = useState<FooterTab>("legislacao");
  const { isNative } = useCapacitorPlatform();

  const handleProcurarClick = () => {
    navigate('/vade-mecum?tab=busca');
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      {/* Hero Background Full Screen FIXO */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ top: '160px' }}>
        {/* Background principal */}
        <img
          src={activeFooterTab === "busca" ? heroVadeMecumBusca : heroVadeMecumPlanalto}
          alt="Vade Mecum"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          loading="eager"
          fetchPriority="high"
        />
        
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              hsl(var(--background) / 0) 0%,
              hsl(var(--background) / 0.15) 30%,
              hsl(var(--background) / 0.5) 60%,
              hsl(var(--background) / 0.9) 100%
            )`
          }}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10">
        {/* Header com Brasão */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-4">
            <img 
              src={brasaoRepublica} 
              alt="Brasão da República Federativa do Brasil" 
              className="w-14 h-14 object-contain drop-shadow-lg"
            />
            <div>
              <h2 className="text-xl font-bold text-foreground">Seu Vade Mecum Digital</h2>
              <p className="text-sm text-muted-foreground">
                Acesse a legislação brasileira sempre atualizada
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto">
          {/* Aba Legislação - Timeline com cards */}
          {activeFooterTab === "legislacao" && (
            <div className="px-4 pb-8 pt-2">
              <div className="relative">
                {/* Linha curva SVG de fundo com animação de luz */}
                <svg 
                  className="absolute left-0 top-0 w-full h-full pointer-events-none"
                  viewBox="0 0 400 850"
                  preserveAspectRatio="none"
                  style={{ zIndex: 0, willChange: 'transform', transform: 'translateZ(0)' }}
                >
                  <defs>
                    <linearGradient id="timelineGradientLeis" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="25%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="75%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    
                    <filter id="glowLeis" x="-50%" y="-50%" width="200%" height="200%">
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
                       Q 150 390, 350 390
                       Q 450 390, 350 480
                       Q 250 570, 50 570
                       Q -50 570, 50 660
                       Q 150 750, 350 750"
                    fill="none"
                    stroke="url(#timelineGradientLeis)"
                    strokeWidth="3"
                    strokeDasharray="8 4"
                    className="opacity-60"
                  />
                  
                  <circle r="6" fill="white" filter="url(#glowLeis)">
                    <animateMotion
                      dur="6s"
                      repeatCount="indefinite"
                      path="M 50 30 
                            Q 350 30, 350 120
                            Q 350 210, 50 210
                            Q -50 210, 50 300
                            Q 150 390, 350 390
                            Q 450 390, 350 480
                            Q 250 570, 50 570
                            Q -50 570, 50 660
                            Q 150 750, 350 750"
                    />
                    <animate 
                      attributeName="opacity" 
                      values="0.3;1;0.3" 
                      dur="2s" 
                      repeatCount="indefinite" 
                    />
                  </circle>
                </svg>

                {/* Cards da timeline - alternando esquerda/direita */}
                <div className="relative z-10 space-y-4" style={{ contain: 'content' }}>
                  {categoriasLegislacao.map((categoria, index) => {
                    const Icon = categoria.icon;
                    const isEven = index % 2 === 0;
                    
                    return (
                      <div
                        key={categoria.id}
                        className={`flex ${isEven ? 'justify-start' : 'justify-end'}`}
                        style={{ 
                          opacity: 0,
                          transform: 'translateY(-20px) translateZ(0)',
                          animation: `slideDown 0.5s ease-out ${index * 0.1}s forwards`,
                          willChange: 'transform, opacity'
                        }}
                      >
                        <button
                          onClick={() => navigate(categoriasRoutes[categoria.id])}
                          className="w-[75%] bg-card/95 backdrop-blur-sm rounded-2xl border-2 border-white/20 cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 relative overflow-hidden shadow-xl group text-left"
                          style={{
                            borderLeftColor: categoria.color,
                            borderLeftWidth: '4px',
                            transform: 'translateZ(0)',
                            willChange: 'transform',
                            height: '72px'
                          }}
                        >
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: `radial-gradient(circle at center, ${categoria.color}20 0%, transparent 70%)`
                            }}
                          />
                          
                          <div className="flex items-center gap-3 relative z-10 h-full px-4">
                            <div 
                              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${categoria.iconBg}`}
                              style={{ boxShadow: `0 4px 20px ${categoria.color}40` }}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-foreground truncate">{categoria.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{categoria.description}</p>
                            </div>
                            
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Aba Busca */}
          {activeFooterTab === "busca" && (
            <div className="px-4 pb-8 pt-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50">
                  <Search className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Busca Avançada</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Acesse o Vade Mecum completo para buscar artigos, leis e códigos
                  </p>
                  <button
                    onClick={() => navigate('/vade-mecum?tab=busca')}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 font-medium transition-colors"
                  >
                    Abrir Busca Completa
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Aba Explicação */}
          {activeFooterTab === "explicacao" && (
            <div className="px-4 pb-8 pt-6">
              <ExplicacoesList />
            </div>
          )}

          {/* Aba Resenha Diária */}
          {activeFooterTab === "resenha" && (
            <div className="px-4 pb-8 pt-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50">
                  <Newspaper className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Resenha Diária</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Acompanhe as novas leis publicadas no Diário Oficial da União todos os dias
                  </p>
                  <button
                    onClick={() => navigate('/vade-mecum/resenha-diaria')}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-3 font-medium transition-colors"
                  >
                    Ver Resenha Diária
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Aba Push de Legislação */}
          {activeFooterTab === "push" && (
            <div className="px-4 pb-8 pt-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50">
                  <Bell className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Push de Legislação</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Receba alertas sobre novas leis diretamente no seu e-mail ou dispositivo
                  </p>
                  <button
                    onClick={() => navigate('/vade-mecum/push-legislacao')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-medium transition-colors"
                  >
                    Configurar Alertas
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu de Rodapé Fixo - Igual ao BottomNav do Estudos */}
      <nav 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card",
          isNative && "pb-safe"
        )}
        style={isNative ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
      >
        <div className="max-w-2xl mx-auto px-2 py-2">
          <div className="grid grid-cols-5 items-end">
            {/* Legislação */}
            <button
              onClick={() => setActiveFooterTab("legislacao")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                activeFooterTab === "legislacao"
                  ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              <Scale className={cn("w-6 h-6 transition-transform", activeFooterTab === "legislacao" && "scale-110")} />
              <span className="text-[10px] font-medium leading-tight text-center">Legislação</span>
            </button>

            {/* Explicação */}
            <button
              onClick={() => setActiveFooterTab("explicacao")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                activeFooterTab === "explicacao"
                  ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              <BookOpen className={cn("w-6 h-6 transition-transform", activeFooterTab === "explicacao" && "scale-110")} />
              <span className="text-[10px] font-medium leading-tight text-center">Explicação</span>
            </button>

            {/* Botão Central Procurar - Elevado */}
            <div className="flex flex-col items-center -mt-6">
              <button
                onClick={handleProcurarClick}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                <Search className="w-7 h-7 text-primary-foreground" />
              </button>
              <span className="text-[10px] font-medium text-primary mt-1">Procurar</span>
            </div>

            {/* Resenha */}
            <button
              onClick={() => setActiveFooterTab("resenha")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                activeFooterTab === "resenha"
                  ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              <Newspaper className={cn("w-6 h-6 transition-transform", activeFooterTab === "resenha" && "scale-110")} />
              <span className="text-[10px] font-medium leading-tight text-center">Resenha</span>
            </button>

            {/* Push */}
            <button
              onClick={() => setActiveFooterTab("push")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                activeFooterTab === "push"
                  ? "text-primary bg-primary/15 ring-1 ring-primary/20"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              <Bell className={cn("w-6 h-6 transition-transform", activeFooterTab === "push" && "scale-110")} />
              <span className="text-[10px] font-medium leading-tight text-center">Push</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
});

MobileVadeMecumHome.displayName = 'MobileVadeMecumHome';

export default MobileVadeMecumHome;
