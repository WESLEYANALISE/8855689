import { useNavigate } from "react-router-dom";
import { Sparkles, BookOpen, Scale, FileEdit, ChevronRight } from "lucide-react";
import { FlashcardsEmAltaCarousel } from "@/components/FlashcardsEmAltaCarousel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import heroFlashcards from "@/assets/hero-flashcards.webp";

interface FlashcardOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  color: string;
  path: string;
}

const opcoes: FlashcardOption[] = [
  {
    id: "artigos",
    title: "Artigos da Lei",
    description: "Vade Mecum artigo por artigo com flashcards interativos",
    icon: Scale,
    iconBg: "bg-orange-500",
    color: "#f97316",
    path: "/flashcards/artigos-lei",
  },
  {
    id: "areas",
    title: "Áreas do Direito",
    description: "Flashcards organizados por área e tema jurídico",
    icon: BookOpen,
    iconBg: "bg-red-500",
    color: "#ef4444",
    path: "/flashcards/areas",
  },
  {
    id: "complete-lei",
    title: "Complete a Lei",
    description: "Preencha os espaços em branco dos artigos",
    icon: FileEdit,
    iconBg: "bg-yellow-500",
    color: "#eab308",
    path: "/flashcards/complete-lei",
  }
];

const FlashcardsEscolha = () => {
  const navigate = useNavigate();

  // Buscar total de flashcards (áreas do direito + artigos de lei)
  const { data: totalFlashcards } = useQuery({
    queryKey: ["total-flashcards-count-combined"],
    queryFn: async () => {
      const { count: countAreas, error: errorAreas } = await supabase
        .from("FLASHCARDS_GERADOS" as any)
        .select("*", { count: "exact", head: true });
      if (errorAreas) throw errorAreas;
      
      const { count: countArtigos, error: errorArtigos } = await supabase
        .from("FLASHCARDS - ARTIGOS LEI")
        .select("*", { count: "exact", head: true });
      if (errorArtigos) throw errorArtigos;
      
      return (countAreas || 0) + (countArtigos || 0);
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleCardClick = (option: FlashcardOption) => {
    navigate(option.path);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background FIXO */}
      <div className="fixed inset-0 z-0">
        <img
          src={heroFlashcards}
          alt="Flashcards jurídicos"
          className="w-full h-full object-cover opacity-60"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              hsl(var(--background) / 0) 0%,
              hsl(var(--background) / 0.15) 40%,
              hsl(var(--background) / 0.4) 70%,
              hsl(var(--background) / 0.85) 100%
            )`
          }}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header com botão voltar */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-border/30">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">VOLTAR</span>
              <span className="text-sm font-medium text-foreground">Início</span>
            </div>
          </button>
        </div>

        {/* Header estilizado */}
        <div className="px-4 pt-16 pb-4">
          <div className="mx-auto max-w-sm">
            <div className="bg-background/40 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="bg-accent/20 rounded-xl p-3 flex-shrink-0">
                  <Sparkles className="w-8 h-8 text-accent" />
                </div>
                <div className="text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground drop-shadow-lg">Flashcards</h1>
                  <p className="text-white/90 text-xs sm:text-sm mt-1 drop-shadow-md">Escolha como deseja estudar</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Curva com os cards */}
        <div className="flex-1 px-4 pb-4 mt-4">
          <div className="relative max-w-md mx-auto">
            {/* Linha curva SVG de fundo com animação de luz - 3 cards */}
            <svg 
              className="absolute left-0 top-0 w-full h-full pointer-events-none"
              viewBox="0 0 400 450"
              preserveAspectRatio="none"
              style={{ zIndex: 0 }}
            >
              <defs>
                <linearGradient id="timelineGradientFlash" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                
                {/* Filtro de glow */}
                <filter id="glowFlash" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Linha base curva - 3 cards */}
              <path
                d="M 50 30 
                   Q 350 30, 350 150
                   Q 350 270, 50 270
                   Q -50 270, 50 390
                   Q 350 390, 350 450"
                fill="none"
                stroke="url(#timelineGradientFlash)"
                strokeWidth="3"
                strokeDasharray="8 4"
                className="opacity-60"
              />
              
              {/* Luz animada percorrendo o caminho */}
              <circle r="6" fill="white" filter="url(#glowFlash)">
                <animateMotion
                  dur="4s"
                  repeatCount="indefinite"
                  path="M 50 30 
                        Q 350 30, 350 150
                        Q 350 270, 50 270
                        Q -50 270, 50 390
                        Q 350 390, 350 450"
                />
                <animate 
                  attributeName="opacity" 
                  values="0.3;1;0.3" 
                  dur="2s" 
                  repeatCount="indefinite" 
                />
              </circle>
              
              {/* Segunda luz com delay */}
              <circle r="4" fill="#f97316" filter="url(#glowFlash)">
                <animateMotion
                  dur="4s"
                  repeatCount="indefinite"
                  begin="2s"
                  path="M 50 30 
                        Q 350 30, 350 150
                        Q 350 270, 50 270
                        Q -50 270, 50 390
                        Q 350 390, 350 450"
                />
                <animate 
                  attributeName="opacity" 
                  values="0.5;1;0.5" 
                  dur="1.5s" 
                  repeatCount="indefinite" 
                />
              </circle>
            </svg>

            {/* Cards da timeline com animação de entrada */}
            <div className="relative z-10 space-y-6">
              {opcoes.map((opcao, index) => {
                const Icon = opcao.icon;
                const isEven = index % 2 === 0;
                
                return (
                  <div
                    key={opcao.id}
                    className={`flex ${isEven ? 'justify-start' : 'justify-end'}`}
                    style={{ 
                      opacity: 0,
                      transform: 'translateY(-20px)',
                      animation: `slideDownFlash 0.5s ease-out ${index * 0.1}s forwards`
                    }}
                  >
                    <div
                      onClick={() => handleCardClick(opcao)}
                      className={`
                        w-[80%] sm:w-[65%]
                        bg-card
                        rounded-2xl p-3
                        border-2 border-border/50
                        cursor-pointer
                        hover:scale-[1.02] hover:shadow-2xl
                        transition-all duration-300
                        relative overflow-hidden
                        shadow-xl
                        group
                        h-[90px]
                      `}
                      style={{
                        borderLeftColor: isEven ? opcao.color : undefined,
                        borderLeftWidth: isEven ? '4px' : undefined,
                        borderRightColor: !isEven ? opcao.color : undefined,
                        borderRightWidth: !isEven ? '4px' : undefined,
                      }}
                    >
                      {/* Glow effect que pulsa */}
                      <div 
                        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
                        style={{ 
                          backgroundColor: opcao.color,
                          animation: `pulse 3s ease-in-out infinite ${index * 0.5}s`
                        }}
                      />
                      
                      {/* Conteúdo */}
                      <div className="relative z-10 flex items-center gap-3 h-full">
                        {/* Ícone */}
                        <div 
                          className={`w-14 h-16 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden ${opcao.iconBg}`}
                          style={{
                            animation: `pulse 2s ease-in-out infinite ${index * 0.75}s`
                          }}
                        >
                          {/* Brilho no ícone */}
                          <div 
                            className="absolute inset-0 bg-white/30"
                            style={{
                              animation: `shimmerFlash 3s ease-in-out infinite ${index * 0.5}s`
                            }}
                          />
                          <Icon className="w-7 h-7 text-white relative z-10" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight line-clamp-1">{opcao.title}</h3>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">{opcao.description}</p>
                        </div>

                        {/* Seta */}
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                      </div>

                      {/* Dot indicator com glow */}
                      <div 
                        className={`
                          absolute top-1/2 -translate-y-1/2
                          w-4 h-4 rounded-full
                          border-2 border-background
                          shadow-lg
                          ${isEven ? '-right-2' : '-left-2'}
                        `}
                        style={{ 
                          backgroundColor: opcao.color,
                          boxShadow: `0 0 10px ${opcao.color}, 0 0 20px ${opcao.color}40`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Seção Flashcards em Alta */}
        <div className="relative z-10 px-4 pb-4">
          <div className="max-w-md mx-auto">
            <FlashcardsEmAltaCarousel />
          </div>
        </div>

        {/* Total de Flashcards */}
        {totalFlashcards && (
          <div className="relative z-10 py-6 bg-card/80 backdrop-blur-sm border-t border-border/30">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-6 h-6 text-accent" />
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{totalFlashcards.toLocaleString('pt-BR')}</span>
                <span className="text-sm text-muted-foreground">flashcards disponíveis</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS para animações */}
      <style>{`
        @keyframes slideDownFlash {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmerFlash {
          0%, 100% {
            opacity: 0;
            transform: translateX(-100%);
          }
          50% {
            opacity: 0.5;
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default FlashcardsEscolha;
