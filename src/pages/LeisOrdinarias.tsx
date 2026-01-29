import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Scale, Shield, Database, Key, ClipboardCheck, Eye, DollarSign, FileCheck, BookMarked, Users, AlertTriangle, Handshake, Gavel, ChevronRight, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import tribunalBackground from "@/assets/advogado-discursando-vertical.webp";
import { LeisToggleMenu, FilterMode } from "@/components/LeisToggleMenu";
import { LeiFavoritaButton } from "@/components/LeiFavoritaButton";
import { useLeisFavoritas, useLeisRecentes, useToggleFavorita, useRegistrarAcesso } from "@/hooks/useLeisFavoritasRecentes";

interface LeiItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  route: string;
}

const leis: LeiItem[] = [
  { id: "improbidade", title: "Lei 8.429/1992", subtitle: "Improbidade Administrativa", icon: Shield, color: "#dc2626", route: "/leis-ordinarias/improbidade" },
  { id: "licitacoes-nova", title: "Lei 14.133/2021", subtitle: "Nova Lei de Licitações", icon: FileCheck, color: "#2563eb", route: "/leis-ordinarias/licitacoes" },
  { id: "acao-civil-publica", title: "Lei 7.347/1985", subtitle: "Ação Civil Pública", icon: Users, color: "#16a34a", route: "/leis-ordinarias/acao-civil-publica" },
  { id: "lgpd", title: "Lei 13.709/2018", subtitle: "LGPD", icon: Database, color: "#9333ea", route: "/leis-ordinarias/lgpd" },
  { id: "lrf", title: "LC 101/2000", subtitle: "Lei de Responsabilidade Fiscal", icon: DollarSign, color: "#059669", route: "/leis-ordinarias/lrf" },
  { id: "processo-administrativo", title: "Lei 9.784/1999", subtitle: "Processo Administrativo", icon: ClipboardCheck, color: "#ea580c", route: "/leis-ordinarias/processo-administrativo" },
  { id: "acesso-informacao", title: "Lei 12.527/2011", subtitle: "Acesso à Informação", icon: Eye, color: "#0891b2", route: "/leis-ordinarias/acesso-informacao" },
  { id: "legislacao-tributaria", title: "Lei 9.430/1996", subtitle: "Legislação Tributária", icon: Scale, color: "#ca8a04", route: "/leis-ordinarias/legislacao-tributaria" },
  { id: "registros-publicos", title: "Lei 6.015/1973", subtitle: "Registros Públicos", icon: BookMarked, color: "#4f46e5", route: "/leis-ordinarias/registros-publicos" },
  { id: "juizados-civeis", title: "Lei 9.099/1995", subtitle: "Juizados Especiais Cíveis", icon: Gavel, color: "#0d9488", route: "/leis-ordinarias/juizados-civeis" },
  { id: "acao-popular", title: "Lei 4.717/1965", subtitle: "Ação Popular", icon: Users, color: "#db2777", route: "/leis-ordinarias/acao-popular" },
  { id: "anticorrupcao", title: "Lei 12.846/2013", subtitle: "Lei Anticorrupção", icon: AlertTriangle, color: "#e11d48", route: "/leis-ordinarias/anticorrupcao" },
  { id: "mediacao", title: "Lei 13.140/2015", subtitle: "Lei de Mediação", icon: Handshake, color: "#d97706", route: "/leis-ordinarias/mediacao" },
  { id: "adi-adc", title: "Lei 9.868/1999", subtitle: "ADI e ADC", icon: Key, color: "#7c3aed", route: "/leis-ordinarias/adi-adc" },
  { id: "lindb", title: "Lei 4.657/1942", subtitle: "LINDB", icon: FileText, color: "#475569", route: "/codigo/lindb" },
  { id: "mandado-seguranca", title: "Lei 12.016/2009", subtitle: "Mandado de Segurança", icon: Shield, color: "#0284c7", route: "/codigo/mandadoseguranca" },
  { id: "habeas-data", title: "Lei 9.507/1997", subtitle: "Habeas Data", icon: Database, color: "#c026d3", route: "/codigo/habeasdata" },
  { id: "pregao", title: "Lei 10.520/2002", subtitle: "Pregão", icon: FileCheck, color: "#65a30d", route: "/codigo/pregao" },
  { id: "marco-civil-internet", title: "Lei 12.965/2014", subtitle: "Marco Civil da Internet", icon: Database, color: "#06b6d4", route: "/codigo/marcocivilinternet" },
  { id: "arbitragem", title: "Lei 9.307/1996", subtitle: "Arbitragem", icon: Handshake, color: "#f97316", route: "/codigo/arbitragem" },
  { id: "inquilinato", title: "Lei 8.245/1991", subtitle: "Inquilinato", icon: Scale, color: "#78716c", route: "/codigo/inquilinato" },
  { id: "desapropriacao", title: "Lei 3.365/1941", subtitle: "Desapropriação", icon: Scale, color: "#ef4444", route: "/codigo/desapropriacao" },
  { id: "meio-ambiente", title: "Lei 6.938/1981", subtitle: "Política Nacional do Meio Ambiente", icon: FileText, color: "#22c55e", route: "/codigo/meioambiente" }
];

const CATEGORIA = 'leis_ordinarias' as const;

const LeisOrdinarias = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');

  // Verificar se a imagem já está em cache para exibição INSTANTÂNEA
  const [imageLoaded, setImageLoaded] = useState(() => {
    const img = new Image();
    img.src = tribunalBackground;
    return img.complete;
  });

  useEffect(() => {
    if (!imageLoaded) {
      const img = new Image();
      img.src = tribunalBackground;
      img.onload = () => setImageLoaded(true);
    }
  }, [imageLoaded]);

  // Hooks de favoritos e recentes
  const { data: favoritas = [] } = useLeisFavoritas(CATEGORIA);
  const { data: recentes = [] } = useLeisRecentes(CATEGORIA);
  const { toggle: toggleFavorita, isLoading: isTogglingFavorita } = useToggleFavorita(CATEGORIA);
  const registrarAcesso = useRegistrarAcesso(CATEGORIA);

  const filteredLeis = useMemo(() => {
    let result = leis;

    // Filtrar por modo
    if (filterMode === 'favoritos') {
      const favoritasIds = favoritas.map(f => f.lei_id);
      result = leis.filter(lei => favoritasIds.includes(lei.id));
    } else if (filterMode === 'recentes') {
      const recentesIds = recentes.map(r => r.lei_id);
      result = recentesIds
        .map(id => leis.find(lei => lei.id === id))
        .filter((lei): lei is LeiItem => lei !== undefined);
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().replace(/\./g, '');
      result = result.filter(lei => {
        const title = lei.title.toLowerCase().replace(/\./g, '');
        const subtitle = lei.subtitle.toLowerCase();
        return title.includes(query) || subtitle.includes(query);
      });
    }

    return result;
  }, [searchQuery, filterMode, favoritas, recentes]);

  const handleCardClick = (lei: LeiItem) => {
    registrarAcesso.mutate({
      lei_id: lei.id,
      titulo: lei.subtitle,
      sigla: lei.title,
      cor: lei.color,
      route: lei.route,
    });
    navigate(lei.route);
  };

  const handleFavoritaClick = (e: React.MouseEvent, lei: LeiItem) => {
    e.stopPropagation();
    const isFavorita = favoritas.some(f => f.lei_id === lei.id);
    toggleFavorita({
      lei_id: lei.id,
      titulo: lei.subtitle,
      sigla: lei.title,
      cor: lei.color,
      route: lei.route,
    }, isFavorita);
  };

  // Generate SVG path based on number of leis
  const generatePath = () => {
    let path = "M 50 30";
    const itemsCount = filteredLeis.length;
    
    for (let i = 0; i < itemsCount; i++) {
      const y = 30 + (i * 120);
      const nextY = y + 120;
      
      if (i % 2 === 0) {
        path += ` Q 350 ${y}, 350 ${y + 60} Q 350 ${nextY}, 50 ${nextY}`;
      } else {
        path += ` Q -50 ${y}, 50 ${nextY}`;
      }
    }
    
    return path;
  };

  const svgPath = generatePath();
  const svgHeight = filteredLeis.length * 120 + 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background com Tribunal */}
      <div className="fixed inset-0 z-0">
        <img
          src={tribunalBackground}
          alt="Tribunal brasileiro"
          className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          onLoad={() => setImageLoaded(true)}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              hsl(var(--background) / 0.1) 0%,
              hsl(var(--background) / 0.3) 40%,
              hsl(var(--background) / 0.6) 70%,
              hsl(var(--background)) 100%
            )`
          }}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex flex-col pb-24">

        {/* Campo de Busca */}
        <div className="px-4 mt-4">
          <Card className="mb-4">
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input 
                  placeholder="Buscar por número ou nome da lei..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="text-base" 
                />
                <Button variant="outline" size="icon" className="shrink-0">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Toggle Menu */}
              <LeisToggleMenu
                value={filterMode}
                onChange={setFilterMode}
                favoritosCount={favoritas.length}
                recentesCount={recentes.length}
              />
            </CardContent>
          </Card>
        </div>

        {/* Timeline Curva com os cards */}
        <div className="flex-1 px-4 pb-8">
          {filteredLeis.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-3">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {filterMode === 'favoritos' ? 'Nenhum favorito ainda' : 
                 filterMode === 'recentes' ? 'Nenhum acesso recente' : 
                 'Nenhuma lei encontrada'}
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Linha curva SVG de fundo com animação de luz */}
              <svg 
                className="absolute left-0 top-0 w-full pointer-events-none"
                viewBox={`0 0 400 ${svgHeight}`}
                preserveAspectRatio="none"
                style={{ zIndex: 0, height: `${svgHeight}px` }}
              >
                <defs>
                  <linearGradient id="timelineGradientLeisOrd" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="15%" stopColor="#2563eb" />
                    <stop offset="30%" stopColor="#9333ea" />
                    <stop offset="45%" stopColor="#059669" />
                    <stop offset="60%" stopColor="#0891b2" />
                    <stop offset="75%" stopColor="#db2777" />
                    <stop offset="90%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                  
                  <filter id="glowLeisOrd" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <path
                  d={svgPath}
                  fill="none"
                  stroke="url(#timelineGradientLeisOrd)"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  className="opacity-60"
                />
                
                <circle r="6" fill="white" filter="url(#glowLeisOrd)">
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    path={svgPath}
                  />
                  <animate 
                    attributeName="opacity" 
                    values="0.3;1;0.3" 
                    dur="2s" 
                    repeatCount="indefinite" 
                  />
                </circle>
                
                <circle r="4" fill="#2563eb" filter="url(#glowLeisOrd)">
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    begin="3s"
                    path={svgPath}
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
              <div className="relative z-10 space-y-10">
                {filteredLeis.map((lei, index) => {
                  const Icon = lei.icon;
                  const isEven = index % 2 === 0;
                  const isFavorita = favoritas.some(f => f.lei_id === lei.id);
                  
                  return (
                    <div
                      key={lei.id}
                      className={`flex ${isEven ? 'justify-start' : 'justify-end'}`}
                      style={{ 
                        opacity: 0,
                        transform: 'translateY(-20px)',
                        animation: `slideDownLeisOrd 0.5s ease-out ${index * 0.05}s forwards`
                      }}
                    >
                      <div
                        onClick={() => handleCardClick(lei)}
                        className={`
                          w-[75%] sm:w-[60%]
                          bg-card/95 backdrop-blur-md
                          rounded-2xl p-4
                          cursor-pointer
                          hover:scale-[1.02] hover:shadow-2xl
                          transition-all duration-300
                          relative overflow-hidden
                          shadow-xl
                          group
                          h-[90px]
                        `}
                        style={{
                          borderLeftColor: lei.color,
                          borderLeftWidth: '4px'
                        }}
                      >
                        {/* Glow effect que pulsa */}
                        <div 
                          className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
                          style={{ 
                            backgroundColor: lei.color,
                            animation: `pulse 3s ease-in-out infinite ${index * 0.5}s`
                          }}
                        />
                        
                        {/* Conteúdo */}
                        <div className="relative z-10 flex items-center gap-3 h-full">
                          <div 
                            className="rounded-xl p-3 shadow-lg relative overflow-hidden shrink-0"
                            style={{
                              backgroundColor: lei.color,
                              animation: `pulse 2s ease-in-out infinite ${index * 0.75}s`
                            }}
                          >
                            <div 
                              className="absolute inset-0 bg-white/30 rounded-xl"
                              style={{
                                animation: `shimmerLeisOrd 3s ease-in-out infinite ${index * 0.5}s`
                              }}
                            />
                            <Icon className="w-6 h-6 text-white relative z-10" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-foreground">{lei.title}</h3>
                            <p className="text-sm text-foreground/80 mt-0.5 line-clamp-1">{lei.subtitle}</p>
                          </div>
                          <LeiFavoritaButton
                            isFavorita={isFavorita}
                            isLoading={isTogglingFavorita}
                            onClick={(e) => handleFavoritaClick(e, lei)}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          />
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
                            backgroundColor: lei.color,
                            boxShadow: `0 0 10px ${lei.color}, 0 0 20px ${lei.color}40`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS para animações */}
      <style>{`
        @keyframes shimmerLeisOrd {
          0%, 100% { opacity: 0; transform: translateX(-100%); }
          50% { opacity: 0.5; transform: translateX(100%); }
        }
        @keyframes slideDownLeisOrd {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LeisOrdinarias;
