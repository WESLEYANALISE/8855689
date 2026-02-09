import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, BookOpen, Gavel, BookText, HandCoins, Scroll, ChevronRight, Landmark, Users, FileText, FilePlus, BookMarked, Crown } from "lucide-react";
import { LeisBottomNav } from "@/components/leis/LeisBottomNav";
import heroVadeMecumPlanalto from "@/assets/hero-vademecum-planalto.webp";

// Categorias do Vade Mecum
const categoriasVadeMecum = [
  { id: "constituicao", title: "Constituição Federal", icon: Crown, route: "/codigos/constituicao", iconBg: "bg-amber-500", color: "#f59e0b" },
  { id: "codigos", title: "Códigos", icon: Scale, route: "/codigos", iconBg: "bg-blue-500", color: "#3b82f6" },
  { id: "estatutos", title: "Estatutos", icon: Users, route: "/estatutos", iconBg: "bg-emerald-500", color: "#10b981" },
  { id: "legislacao-penal", title: "Legislação Penal", icon: Gavel, route: "/legislacao-penal-especial", iconBg: "bg-red-500", color: "#ef4444" },
  { id: "sumulas", title: "Súmulas", icon: BookText, route: "/sumulas", iconBg: "bg-purple-500", color: "#a855f7" },
  { id: "previdenciario", title: "Previdenciário", icon: HandCoins, route: "/previdenciario", iconBg: "bg-orange-500", color: "#f97316" },
  { id: "leis-ordinarias", title: "Leis Ordinárias", icon: FileText, route: "/leis-ordinarias", iconBg: "bg-cyan-500", color: "#06b6d4" },
  { id: "pec", title: "PEC", icon: FilePlus, route: "/vade-mecum/legislacao", iconBg: "bg-indigo-500", color: "#6366f1" },
  { id: "novas-leis", title: "Novas Leis", icon: Scroll, route: "/novas-leis", iconBg: "bg-lime-500", color: "#84cc16" },
];

export const MobileLeisHome = memo(() => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'legislacao' | 'explicacao' | 'procurar' | 'resenha' | 'push'>('legislacao');

  const handleTabChange = (tab: 'legislacao' | 'explicacao' | 'procurar' | 'resenha' | 'push') => {
    setActiveTab(tab);
    if (tab === 'procurar') navigate('/pesquisar?tipo=legislacao');
    else if (tab === 'resenha') navigate('/vade-mecum/resenha-diaria');
    else if (tab === 'push') navigate('/vade-mecum/push-legislacao');
    else if (tab === 'explicacao') navigate('/vade-mecum/sobre');
  };

  // Gerar path SVG curvo para 9 itens (ajustado para mais itens)
  const generateCurvedPath = () => {
    // Path que alterna de forma curva entre esquerda e direita
    return `M 50 40 
            Q 350 40, 350 120
            Q 350 200, 50 200
            Q -50 200, 50 280
            Q 150 360, 350 360
            Q 450 360, 350 440
            Q 250 520, 50 520
            Q -50 520, 50 600
            Q 150 680, 350 680`;
  };

  return (
    <div className="relative min-h-[500px]">
      {/* Imagem de fundo fixa - 100% igual ao Vade Mecum */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={heroVadeMecumPlanalto} 
          alt="Vade Mecum"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        {/* Gradient Overlay - igual ao Vade Mecum */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              hsl(var(--background) / 0) 0%,
              hsl(var(--background) / 0.15) 30%,
              hsl(var(--background) / 0.4) 60%,
              hsl(var(--background) / 0.85) 100%
            )`
          }}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center pt-2 pb-32">
        {/* Header */}
        <div className="text-center mb-4 animate-fade-in">
          <h2 className="font-cinzel text-xl font-bold text-amber-100 mb-1">Vade Mecum X</h2>
          <p className="text-amber-200/70 text-xs">Seu Vade Mecum Jurídico <span className="text-primary font-semibold">2026</span></p>
        </div>

        {/* Info Stats */}
        <div className="flex items-center justify-center gap-4 text-xs text-white/80 mb-5">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>{categoriasVadeMecum.length} categorias</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Legislação completa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookMarked className="w-3.5 h-3.5 text-purple-400" />
            <span>Atualizado</span>
          </div>
        </div>

        {/* Timeline Curva - Estilo Vade Mecum */}
        <div className="w-full px-4">
          <div className="max-w-lg mx-auto relative">
            
            {/* Linha curva SVG de fundo com animação de luz - 100% igual Vade Mecum */}
            <svg 
              className="absolute left-0 top-0 w-full h-full pointer-events-none"
              viewBox="0 0 400 720"
              preserveAspectRatio="none"
              style={{ zIndex: 0, willChange: 'transform', transform: 'translateZ(0)' }}
            >
              <defs>
                <linearGradient id="leisTimelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="15%" stopColor="#3b82f6" />
                  <stop offset="30%" stopColor="#10b981" />
                  <stop offset="45%" stopColor="#ef4444" />
                  <stop offset="60%" stopColor="#a855f7" />
                  <stop offset="75%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#84cc16" />
                </linearGradient>
                
                <filter id="leisGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Path curvo tracejado */}
              <path
                d={generateCurvedPath()}
                fill="none"
                stroke="url(#leisTimelineGradient)"
                strokeWidth="3"
                strokeDasharray="8 4"
                className="opacity-60"
              />
              
              {/* Orbe animado principal */}
              <circle r="6" fill="white" filter="url(#leisGlow)">
                <animateMotion
                  dur="5s"
                  repeatCount="indefinite"
                  path={generateCurvedPath()}
                />
                <animate 
                  attributeName="opacity" 
                  values="0.3;1;0.3" 
                  dur="2s" 
                  repeatCount="indefinite" 
                />
              </circle>
              
              {/* Orbe secundário com delay */}
              <circle r="4" fill="#f59e0b" filter="url(#leisGlow)">
                <animateMotion
                  dur="5s"
                  repeatCount="indefinite"
                  begin="2.5s"
                  path={generateCurvedPath()}
                />
                <animate 
                  attributeName="opacity" 
                  values="0.5;1;0.5" 
                  dur="1.5s" 
                  repeatCount="indefinite" 
                />
              </circle>
            </svg>

            {/* Cards da timeline */}
            <div className="relative z-10 space-y-5" style={{ contain: 'content' }}>
              {categoriasVadeMecum.map((categoria, index) => {
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
                      onClick={() => navigate(categoria.route)}
                      className="w-[65%] sm:w-[55%] bg-card/95 backdrop-blur-sm rounded-2xl border-2 border-white/20 cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 relative overflow-hidden shadow-xl group"
                      style={{
                        borderLeftColor: categoria.color,
                        borderLeftWidth: '4px',
                        transform: 'translateZ(0)',
                        willChange: 'transform',
                        minHeight: '100px'
                      }}
                    >
                      {/* Hover glow effect */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `radial-gradient(circle at center, ${categoria.color}20 0%, transparent 70%)`
                        }}
                      />
                      
                      {/* Conteúdo do card - Ícone em cima, título embaixo */}
                      <div className="flex flex-col items-center justify-center gap-2 relative z-10 h-full py-4 px-3">
                        <div 
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${categoria.iconBg}`}
                          style={{ boxShadow: `0 4px 20px ${categoria.color}40` }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        
                        <h3 className="text-sm font-semibold text-foreground text-center leading-tight">{categoria.title}</h3>
                      </div>
                      
                      {/* Chevron */}
                      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Menu de Rodapé */}
      <LeisBottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Estilos para animação */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) translateZ(0);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateZ(0);
          }
        }
      `}</style>
    </div>
  );
});

MobileLeisHome.displayName = 'MobileLeisHome';

export default MobileLeisHome;
