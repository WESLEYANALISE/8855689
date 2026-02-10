import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Gavel, FileText, Sword, Briefcase, Shield, DollarSign, Droplets, Plane, Radio, Building2, Mountain, Car, Search, CheckCircle } from "lucide-react";
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

interface CodeCard {
  id: string;
  abbr: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
}

// Códigos gratuitos: apenas CC e CP
const FREE_CODES = ['cc', 'cp'];

const codes: CodeCard[] = [
  { id: "cc", abbr: "CC", title: "Código Civil", description: "Lei 10.406/2002", icon: Scale, color: "#f97316", iconBg: "bg-orange-500" },
  { id: "cp", abbr: "CP", title: "Código Penal", description: "Decreto-Lei 2.848/1940", icon: Gavel, color: "#ef4444", iconBg: "bg-red-500" },
  { id: "cpc", abbr: "CPC", title: "Código de Processo Civil", description: "Lei 13.105/2015", icon: FileText, color: "#3b82f6", iconBg: "bg-blue-500" },
  { id: "cpp", abbr: "CPP", title: "Código de Processo Penal", description: "Decreto-Lei 3.689/1941", icon: Sword, color: "#dc2626", iconBg: "bg-red-600" },
  { id: "clt", abbr: "CLT", title: "Consolidação das Leis do Trabalho", description: "Decreto-Lei 5.452/1943", icon: Briefcase, color: "#8b5cf6", iconBg: "bg-violet-500" },
  { id: "cdc", abbr: "CDC", title: "Código de Defesa do Consumidor", description: "Lei 8.078/1990", icon: Shield, color: "#10b981", iconBg: "bg-emerald-500" },
  { id: "ctn", abbr: "CTN", title: "Código Tributário Nacional", description: "Lei 5.172/1966", icon: DollarSign, color: "#f59e0b", iconBg: "bg-amber-500" },
  { id: "ctb", abbr: "CTB", title: "Código de Trânsito Brasileiro", description: "Lei 9.503/1997", icon: Car, color: "#06b6d4", iconBg: "bg-cyan-500" },
  { id: "ce", abbr: "CE", title: "Código Eleitoral", description: "Lei 4.737/1965", icon: Scale, color: "#a855f7", iconBg: "bg-purple-500" },
  { id: "ca", abbr: "CA", title: "Código de Águas", description: "Decreto 24.643/1934", icon: Droplets, color: "#0ea5e9", iconBg: "bg-sky-500" },
  { id: "cba", abbr: "CBA", title: "Código Brasileiro de Aeronáutica", description: "Lei 7.565/1986", icon: Plane, color: "#14b8a6", iconBg: "bg-teal-500" },
  { id: "cbt", abbr: "CBT", title: "Código Brasileiro de Telecomunicações", description: "Lei 4.117/1962", icon: Radio, color: "#6366f1", iconBg: "bg-indigo-500" },
  { id: "ccom", abbr: "CCOM", title: "Código Comercial", description: "Lei 556/1850", icon: Building2, color: "#84cc16", iconBg: "bg-lime-500" },
  { id: "cdm", abbr: "CDM", title: "Código de Minas", description: "Decreto-Lei 227/1967", icon: Mountain, color: "#78716c", iconBg: "bg-stone-500" },
  { id: "cpm", abbr: "CPM", title: "Código Penal Militar", description: "Decreto-Lei 1.001/1969", icon: Shield, color: "#22c55e", iconBg: "bg-green-500" },
  { id: "cppm", abbr: "CPPM", title: "Código de Processo Penal Militar", description: "Decreto-Lei 1.002/1969", icon: Shield, color: "#16a34a", iconBg: "bg-green-600" },
  { id: "cflorestal", abbr: "CF", title: "Código Florestal", description: "Lei 12.651/2012", icon: Mountain, color: "#22c55e", iconBg: "bg-green-500" },
  { id: "ccaca", abbr: "CC", title: "Código de Caça", description: "Lei 5.197/1967", icon: Shield, color: "#eab308", iconBg: "bg-yellow-500" },
  { id: "cpesca", abbr: "CP", title: "Código de Pesca", description: "Decreto-Lei 221/1967", icon: Droplets, color: "#0284c7", iconBg: "bg-sky-600" },
  { id: "cpi", abbr: "CPI", title: "Código de Propriedade Industrial", description: "Lei 9.279/1996", icon: Building2, color: "#7c3aed", iconBg: "bg-violet-600" },
  { id: "cdus", abbr: "CDUS", title: "Código de Defesa do Usuário", description: "Lei 13.460/2017", icon: Shield, color: "#ec4899", iconBg: "bg-pink-500" }
];

const CATEGORIA = 'codigos' as const;

const Codigos = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const { backgroundUrl, opacity, isGenerating, generateNew, deleteImage, setOpacity } = useBackgroundImage('codigos');
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  
  // Hooks de favoritos e recentes
  const { data: favoritas = [] } = useLeisFavoritas(CATEGORIA);
  const { data: recentes = [] } = useLeisRecentes(CATEGORIA);
  const { toggle: toggleFavorita, isLoading: isTogglingFavorita } = useToggleFavorita(CATEGORIA);
  const registrarAcesso = useRegistrarAcesso(CATEGORIA);

  const isFreeCode = (id: string) => FREE_CODES.includes(id);

  // Filtrar códigos baseado no modo e busca
  const filteredCodes = useMemo(() => {
    let result = codes;

    if (filterMode === 'favoritos') {
      const favoritasIds = favoritas.map(f => f.lei_id);
      result = codes.filter(code => favoritasIds.includes(code.id));
    } else if (filterMode === 'recentes') {
      const recentesIds = recentes.map(r => r.lei_id);
      result = recentesIds
        .map(id => codes.find(code => code.id === id))
        .filter((code): code is CodeCard => code !== undefined);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(code => 
        code.abbr.toLowerCase().includes(query) || 
        code.title.toLowerCase().includes(query) ||
        code.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, filterMode, favoritas, recentes]);

  const handleCardClick = (code: CodeCard) => {
    // Se não é Premium e o código não é gratuito, mostrar modal
    if (!isPremium && !loadingSubscription && !isFreeCode(code.id)) {
      setPremiumModalOpen(true);
      return;
    }
    
    registrarAcesso.mutate({
      lei_id: code.id,
      titulo: code.title,
      sigla: code.abbr,
      cor: code.color,
      route: `/codigo/${code.id}`,
    });
    navigate(`/codigo/${code.id}`);
  };

  const handleFavoritaClick = (e: React.MouseEvent, code: CodeCard) => {
    e.stopPropagation();
    const isFavorita = favoritas.some(f => f.lei_id === code.id);
    toggleFavorita({
      lei_id: code.id,
      titulo: code.title,
      sigla: code.abbr,
      cor: code.color,
      route: `/codigo/${code.id}`,
    }, isFavorita);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PremiumUpgradeModal open={premiumModalOpen} onOpenChange={setPremiumModalOpen} featureName="este código" />

      {/* Header com brasão e background */}
      <LegislacaoBackground 
        imageUrl={backgroundUrl} 
        opacity={opacity}
        className="border-b border-border/30"
      >
        <div className="px-4 py-6 flex flex-col items-center text-center bg-gradient-to-b from-card/80 to-background">
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
          <h1 className="text-xl font-bold text-foreground">CÓDIGOS & LEIS</h1>
          <p className="text-sm text-amber-400 mt-1">Legislação brasileira compilada</p>
        </div>
      </LegislacaoBackground>

      {/* Barra de busca */}
      <div className="px-4 py-4 border-b border-border/30 bg-card/50 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50"
          />
          <Button variant="secondary" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">
            Buscar
          </Button>
        </div>
        
        <LeisToggleMenu
          value={filterMode}
          onChange={setFilterMode}
          favoritosCount={favoritas.length}
          recentesCount={recentes.length}
        />
      </div>

      {/* Lista de códigos */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3 pb-24">
          {filteredCodes.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {filterMode === 'favoritos' ? 'Nenhum favorito ainda' : 
                 filterMode === 'recentes' ? 'Nenhum acesso recente' : 
                 'Nenhum código encontrado'}
              </p>
            </div>
          ) : (
            filteredCodes.map((code, index) => {
              const Icon = code.icon;
              const isLocked = !isPremium && !loadingSubscription && !isFreeCode(code.id);
              return (
                <div
                  key={code.id}
                  onClick={() => handleCardClick(code)}
                  className="bg-card rounded-xl p-4 cursor-pointer hover:bg-accent/10 hover:scale-[1.02] transition-all border-l-4 group shadow-lg relative"
                  style={{ 
                    borderLeftColor: code.color,
                    opacity: 0,
                    transform: 'translateY(-20px) translateZ(0)',
                    animation: `slideDown 0.5s ease-out ${index * 0.08}s forwards`,
                    willChange: 'transform, opacity'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${code.iconBg} rounded-lg p-2.5 shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{code.abbr}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{code.title}</p>
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

export default Codigos;
