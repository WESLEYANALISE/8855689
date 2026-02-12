import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HandCoins, Calculator, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import brasaoRepublica from "@/assets/brasao-republica.png";
import { LegislacaoBackground } from "@/components/LegislacaoBackground";
import { GerenciadorBackgroundModal } from "@/components/GerenciadorBackgroundModal";
import { useBackgroundImage } from "@/hooks/useBackgroundImage";
import { LeisToggleMenu, FilterMode } from "@/components/LeisToggleMenu";
import { useLeisFavoritas, useLeisRecentes, useToggleFavorita, useRegistrarAcesso } from "@/hooks/useLeisFavoritasRecentes";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumBadge } from "@/components/PremiumBadge";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";

interface LeiCard {
  id: string;
  sigla: string;
  titulo: string;
  numero: string;
  descricao: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  route: string;
}

const leis: LeiCard[] = [
  {
    id: "beneficios",
    sigla: "LB",
    titulo: "Lei de Benefícios da Previdência Social",
    numero: "Lei 8.213/1991",
    descricao: "Dispõe sobre os Planos de Benefícios da Previdência Social",
    icon: HandCoins,
    color: "#22c55e",
    iconBg: "bg-green-500",
    route: "/lei-previdenciaria/beneficios"
  },
  {
    id: "custeio",
    sigla: "LC",
    titulo: "Lei de Custeio da Previdência Social",
    numero: "Lei 8.212/1991",
    descricao: "Dispõe sobre a organização da Seguridade Social e Plano de Custeio",
    icon: Calculator,
    color: "#3b82f6",
    iconBg: "bg-blue-500",
    route: "/lei-previdenciaria/custeio"
  }
];

const CATEGORIA = 'previdenciario' as const;

const Previdenciario = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const { backgroundUrl, opacity, isGenerating, generateNew, deleteImage, setOpacity } = useBackgroundImage('previdenciario');
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

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
        .filter((lei): lei is LeiCard => lei !== undefined);
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lei => 
        lei.sigla.toLowerCase().includes(query) || 
        lei.titulo.toLowerCase().includes(query) ||
        lei.numero.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, filterMode, favoritas, recentes]);

  // Previdenciário tem apenas 2 leis, ambas gratuitas
  const FREE_LEIS_PREV = ['beneficios', 'custeio'];
  const isFreeLei = (id: string) => FREE_LEIS_PREV.includes(id);

  const handleCardClick = (lei: LeiCard) => {
    if (!isPremium && !loadingSubscription && !isFreeLei(lei.id)) {
      setPremiumModalOpen(true);
      return;
    }
    registrarAcesso.mutate({
      lei_id: lei.id, titulo: lei.titulo, sigla: lei.sigla, cor: lei.color, route: lei.route,
    });
    navigate(lei.route);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PremiumUpgradeModal open={premiumModalOpen} onOpenChange={setPremiumModalOpen} featureName="Previdenciário" />
      {/* Header com brasão e background */}
      <LegislacaoBackground 
        imageUrl={backgroundUrl} 
        opacity={opacity}
        className="border-b border-border/30"
      >
        <div className="px-4 py-6 flex flex-col items-center text-center bg-gradient-to-b from-card/80 to-background">
          {/* Botão de gerenciamento */}
          <div className="absolute top-3 right-3 z-20">
            <GerenciadorBackgroundModal
              backgroundUrl={backgroundUrl}
              opacity={opacity}
              isGenerating={isGenerating}
              onGenerate={generateNew}
              onDelete={deleteImage}
              onOpacityChange={setOpacity}
            />
          </div>
          
          <img 
            src={brasaoRepublica} 
            alt="Brasão da República" 
            className="w-20 h-20 object-contain mb-3"
          />
          <h1 className="text-xl font-bold text-foreground">PREVIDENCIÁRIO</h1>
          <p className="text-sm text-amber-400 mt-1">Leis de Benefícios e Custeio da Previdência Social</p>
        </div>
      </LegislacaoBackground>

      {/* Barra de busca */}
      <div className="px-4 py-4 border-b border-border/30 bg-card/50 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lei..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50"
          />
          <Button variant="secondary" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">
            Buscar
          </Button>
        </div>
        
        {/* Toggle Menu */}
        <LeisToggleMenu
          value={filterMode}
          onChange={setFilterMode}
          favoritosCount={favoritas.length}
          recentesCount={recentes.length}
        />
      </div>

      {/* Lista de leis */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3 pb-24">
          {filteredLeis.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {filterMode === 'favoritos' ? 'Nenhum favorito ainda' : 
                 filterMode === 'recentes' ? 'Nenhum acesso recente' : 
                 'Nenhuma lei encontrada'}
              </p>
            </div>
          ) : (
            filteredLeis.map((lei, index) => {
              const Icon = lei.icon;
              const isLocked = !isPremium && !loadingSubscription && !isFreeLei(lei.id);
              return (
                <div
                  key={lei.id}
                  onClick={() => handleCardClick(lei)}
                  className="bg-card rounded-xl p-4 cursor-pointer hover:bg-accent/10 hover:scale-[1.02] transition-all border-l-4 group shadow-lg relative"
                  style={{ 
                    borderLeftColor: lei.color,
                    opacity: 0,
                    transform: 'translateY(-20px) translateZ(0)',
                    animation: `slideDown 0.5s ease-out ${index * 0.08}s forwards`,
                    willChange: 'transform, opacity'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${lei.iconBg} rounded-lg p-2.5 shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{lei.sigla}</h3>
                        <span 
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${lei.color}20`, color: lei.color }}
                        >
                          {lei.numero}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{lei.titulo}</p>
                    </div>
                    {isLocked && <PremiumBadge position="top-right" size="sm" className="relative top-auto right-auto" />}
                    {!isLocked && <CheckCircle className="w-5 h-5 text-amber-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Previdenciario;
