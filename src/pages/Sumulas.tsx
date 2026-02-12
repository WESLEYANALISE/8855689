import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Gavel, Search, CheckCircle } from "lucide-react";
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

interface SumulaCard {
  id: string;
  abbr: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  available: boolean;
}

const sumulas: SumulaCard[] = [
  { id: "vinculantes", abbr: "SV", title: "Súmulas Vinculantes STF", description: "Efeito vinculante obrigatório para todos os tribunais", icon: Scale, color: "#f59e0b", iconBg: "bg-amber-500", available: true },
  { id: "stf", abbr: "STF", title: "Súmulas do Supremo Tribunal Federal", description: "Jurisprudência consolidada do STF", icon: Gavel, color: "#ef4444", iconBg: "bg-red-500", available: true },
  { id: "stj", abbr: "STJ", title: "Súmulas do Superior Tribunal de Justiça", description: "Jurisprudência consolidada do STJ", icon: Gavel, color: "#3b82f6", iconBg: "bg-blue-500", available: true }
];

const CATEGORIA = 'sumulas' as const;

const Sumulas = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const { backgroundUrl, opacity, isGenerating, generateNew, deleteImage, setOpacity } = useBackgroundImage('sumulas');
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  // Hooks de favoritos e recentes
  const { data: favoritas = [] } = useLeisFavoritas(CATEGORIA);
  const { data: recentes = [] } = useLeisRecentes(CATEGORIA);
  const { toggle: toggleFavorita, isLoading: isTogglingFavorita } = useToggleFavorita(CATEGORIA);
  const registrarAcesso = useRegistrarAcesso(CATEGORIA);

  const filteredSumulas = useMemo(() => {
    let result = sumulas;

    // Filtrar por modo
    if (filterMode === 'favoritos') {
      const favoritasIds = favoritas.map(f => f.lei_id);
      result = sumulas.filter(s => favoritasIds.includes(s.id));
    } else if (filterMode === 'recentes') {
      const recentesIds = recentes.map(r => r.lei_id);
      result = recentesIds
        .map(id => sumulas.find(s => s.id === id))
        .filter((s): s is SumulaCard => s !== undefined);
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(sumula => 
        sumula.abbr.toLowerCase().includes(query) || 
        sumula.title.toLowerCase().includes(query) ||
        sumula.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, filterMode, favoritas, recentes]);

  const handleCardClick = (sumula: SumulaCard) => {
    if (!sumula.available) return;
    if (!isPremium && !loadingSubscription && !isFreeSumula(sumula.id)) {
      setPremiumModalOpen(true);
      return;
    }
    registrarAcesso.mutate({
      lei_id: sumula.id, titulo: sumula.title, sigla: sumula.abbr, cor: sumula.color, route: `/sumula/${sumula.id}`,
    });
    navigate(`/sumula/${sumula.id}`);
  };

  // Primeiras 2 súmulas são gratuitas
  const FREE_SUMULAS = ['vinculantes', 'stf'];
  const isFreeSumula = (id: string) => FREE_SUMULAS.includes(id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PremiumUpgradeModal open={premiumModalOpen} onOpenChange={setPremiumModalOpen} featureName="Súmulas" />
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
          <h1 className="text-xl font-bold text-foreground">SÚMULAS & ENUNCIADOS</h1>
          <p className="text-sm text-amber-400 mt-1">Jurisprudência consolidada dos tribunais</p>
        </div>
      </LegislacaoBackground>

      {/* Barra de busca */}
      <div className="px-4 py-4 border-b border-border/30 bg-card/50 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar súmula..."
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

      {/* Lista de súmulas */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3 pb-24">
          {filteredSumulas.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {filterMode === 'favoritos' ? 'Nenhum favorito ainda' : 
                 filterMode === 'recentes' ? 'Nenhum acesso recente' : 
                 'Nenhuma súmula encontrada'}
              </p>
            </div>
          ) : (
            filteredSumulas.map((sumula, index) => {
              const Icon = sumula.icon;
              const isLocked = !isPremium && !loadingSubscription && !isFreeSumula(sumula.id);
              return (
                <div
                  key={sumula.id}
                  onClick={() => handleCardClick(sumula)}
                  className="bg-card rounded-xl p-4 cursor-pointer hover:bg-accent/10 hover:scale-[1.02] transition-all border-l-4 group shadow-lg"
                  style={{ 
                    borderLeftColor: sumula.color,
                    opacity: 0,
                    transform: 'translateY(-20px) translateZ(0)',
                    animation: `slideDown 0.5s ease-out ${index * 0.08}s forwards`,
                    willChange: 'transform, opacity'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${sumula.iconBg} rounded-lg p-2.5 shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{sumula.abbr}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{sumula.title}</p>
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

export default Sumulas;
