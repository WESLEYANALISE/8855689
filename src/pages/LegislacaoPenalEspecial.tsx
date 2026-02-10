import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Scale, Heart, Skull, Zap, Phone, Users, Search, AlertTriangle, FileText, Banknote, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import brasaoRepublica from "@/assets/brasao-republica.png";
import { LeisToggleMenu, FilterMode } from "@/components/LeisToggleMenu";
import { LeiFavoritaButton } from "@/components/LeiFavoritaButton";
import { useLeisFavoritas, useLeisRecentes, useToggleFavorita, useRegistrarAcesso } from "@/hooks/useLeisFavoritasRecentes";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumBadge } from "@/components/PremiumBadge";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";

interface LeiCard {
  id: string;
  sigla: string;
  titulo: string;
  numero: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  route: string;
}

const leis: LeiCard[] = [
  { id: "crimes-democraticos", sigla: "LCD", titulo: "Crimes Contra o Estado Democrático", numero: "Lei 14.197/2021", icon: Scale, color: "#3b82f6", iconBg: "bg-blue-500", route: "/lei-penal/crimes-democraticos" },
  { id: "abuso-autoridade", sigla: "LAA", titulo: "Abuso de Autoridade", numero: "Lei 13.869/2019", icon: AlertTriangle, color: "#f59e0b", iconBg: "bg-amber-500", route: "/lei-penal/abuso-autoridade" },
  { id: "pacote-anticrime", sigla: "PAC", titulo: "Pacote Anticrime", numero: "Lei 13.964/2019", icon: FileText, color: "#8b5cf6", iconBg: "bg-violet-500", route: "/lei-penal/pacote-anticrime" },
  { id: "lep", sigla: "LEP", titulo: "Lei de Execução Penal", numero: "Lei 7.210/1984", icon: Shield, color: "#22c55e", iconBg: "bg-green-500", route: "/lei-penal/lep" },
  { id: "juizados", sigla: "JEC", titulo: "Juizados Especiais", numero: "Lei 9.099/1995", icon: Scale, color: "#06b6d4", iconBg: "bg-cyan-500", route: "/lei-penal/juizados-especiais" },
  { id: "drogas", sigla: "LD", titulo: "Lei de Drogas", numero: "Lei 11.343/2006", icon: Shield, color: "#ef4444", iconBg: "bg-red-500", route: "/lei-penal/lei-drogas" },
  { id: "maria-penha", sigla: "LMP", titulo: "Maria da Penha", numero: "Lei 11.340/2006", icon: Heart, color: "#ec4899", iconBg: "bg-pink-500", route: "/lei-penal/maria-da-penha" },
  { id: "hediondos", sigla: "LCH", titulo: "Crimes Hediondos", numero: "Lei 8.072/1990", icon: Skull, color: "#dc2626", iconBg: "bg-red-600", route: "/lei-penal/crimes-hediondos" },
  { id: "tortura", sigla: "LT", titulo: "Lei de Tortura", numero: "Lei 9.455/1997", icon: Zap, color: "#f97316", iconBg: "bg-orange-500", route: "/lei-penal/tortura" },
  { id: "interceptacao", sigla: "LIT", titulo: "Interceptação Telefônica", numero: "Lei 9.296/1996", icon: Phone, color: "#6366f1", iconBg: "bg-indigo-500", route: "/lei-penal/interceptacao-telefonica" },
  { id: "org-criminosas", sigla: "LOC", titulo: "Organizações Criminosas", numero: "Lei 12.850/2013", icon: Users, color: "#a855f7", iconBg: "bg-purple-500", route: "/lei-penal/organizacoes-criminosas" },
  { id: "lavagem-dinheiro", sigla: "LLD", titulo: "Lavagem de Dinheiro", numero: "Lei 9.613/1998", icon: Banknote, color: "#14b8a6", iconBg: "bg-teal-500", route: "/lei-penal/lavagem-dinheiro" },
  { id: "falencia", sigla: "LRF", titulo: "Recuperação e Falência", numero: "Lei 11.101/2005", icon: Banknote, color: "#84cc16", iconBg: "bg-lime-500", route: "/lei-penal/falencia" },
  { id: "crimes-ambientais", sigla: "LCA", titulo: "Crimes Ambientais", numero: "Lei 9.605/1998", icon: Shield, color: "#10b981", iconBg: "bg-emerald-500", route: "/lei-penal/crimes-ambientais" },
  { id: "feminicidio", sigla: "LF", titulo: "Feminicídio", numero: "Lei 13.104/2015", icon: Heart, color: "#be185d", iconBg: "bg-pink-700", route: "/lei-penal/feminicidio" },
  { id: "antiterrorismo", sigla: "LAT", titulo: "Antiterrorismo", numero: "Lei 13.260/2016", icon: AlertTriangle, color: "#b91c1c", iconBg: "bg-red-700", route: "/lei-penal/antiterrorismo" },
  { id: "crimes-financeiro", sigla: "LCF", titulo: "Crimes Sistema Financeiro", numero: "Lei 7.492/1986", icon: Banknote, color: "#0891b2", iconBg: "bg-cyan-600", route: "/lei-penal/crimes-financeiro" },
  { id: "crimes-tributario", sigla: "LCT", titulo: "Crimes Ordem Tributária", numero: "Lei 8.137/1990", icon: Banknote, color: "#ca8a04", iconBg: "bg-yellow-600", route: "/lei-penal/crimes-tributario" },
  { id: "ficha-limpa", sigla: "FL", titulo: "Ficha Limpa", numero: "LC 135/2010", icon: FileText, color: "#7c3aed", iconBg: "bg-violet-600", route: "/lei-penal/ficha-limpa" },
  { id: "crimes-responsabilidade", sigla: "LCR", titulo: "Crimes de Responsabilidade", numero: "Lei 1.079/1950", icon: AlertTriangle, color: "#e11d48", iconBg: "bg-rose-600", route: "/lei-penal/crimes-responsabilidade" },
  { id: "crimes-transnacionais", sigla: "LCTr", titulo: "Crimes Transnacionais", numero: "Lei 5.015/2004", icon: Users, color: "#4f46e5", iconBg: "bg-indigo-600", route: "/lei-penal/crimes-transnacionais" }
];

const CATEGORIA = 'legislacao_penal' as const;

const LegislacaoPenalEspecial = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  const { data: favoritas = [] } = useLeisFavoritas(CATEGORIA);
  const { data: recentes = [] } = useLeisRecentes(CATEGORIA);
  const { toggle: toggleFavorita, isLoading: isTogglingFavorita } = useToggleFavorita(CATEGORIA);
  const registrarAcesso = useRegistrarAcesso(CATEGORIA);

  const filteredLeis = useMemo(() => {
    let result = leis;
    if (filterMode === 'favoritos') {
      const favoritasIds = favoritas.map(f => f.lei_id);
      result = leis.filter(lei => favoritasIds.includes(lei.id));
    } else if (filterMode === 'recentes') {
      const recentesIds = recentes.map(r => r.lei_id);
      result = recentesIds.map(id => leis.find(lei => lei.id === id)).filter((lei): lei is LeiCard => lei !== undefined);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().replace(/\./g, '');
      result = result.filter(lei => {
        const sigla = lei.sigla.toLowerCase();
        const titulo = lei.titulo.toLowerCase();
        const numero = lei.numero.toLowerCase().replace(/\./g, '');
        return sigla.includes(query) || titulo.includes(query) || numero.includes(query);
      });
    }
    return result;
  }, [searchQuery, filterMode, favoritas, recentes]);

  const handleCardClick = (lei: LeiCard) => {
    if (!isPremium && !loadingSubscription) {
      setPremiumModalOpen(true);
      return;
    }
    registrarAcesso.mutate({ lei_id: lei.id, titulo: lei.titulo, sigla: lei.sigla, cor: lei.color, route: lei.route });
    navigate(lei.route);
  };

  const handleFavoritaClick = (e: React.MouseEvent, lei: LeiCard) => {
    e.stopPropagation();
    const isFavorita = favoritas.some(f => f.lei_id === lei.id);
    toggleFavorita({ lei_id: lei.id, titulo: lei.titulo, sigla: lei.sigla, cor: lei.color, route: lei.route }, isFavorita);
  };

  const isLocked = !isPremium && !loadingSubscription;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PremiumUpgradeModal open={premiumModalOpen} onOpenChange={setPremiumModalOpen} featureName="Legislação Penal" />

      <div className="px-4 py-6 flex flex-col items-center text-center border-b border-border/30 bg-gradient-to-b from-card to-background">
        <img src={brasaoRepublica} alt="Brasão da República" className="w-20 h-20 object-contain mb-3" />
        <h1 className="text-xl font-bold text-foreground">LEGISLAÇÃO PENAL ESPECIAL</h1>
        <p className="text-sm text-amber-400 mt-1">Leis penais extravagantes</p>
      </div>

      <div className="px-4 py-4 border-b border-border/30 bg-card/50 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar lei..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-background/50" />
          <Button variant="secondary" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">Buscar</Button>
        </div>
        <LeisToggleMenu value={filterMode} onChange={setFilterMode} favoritosCount={favoritas.length} recentesCount={recentes.length} />
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3 pb-24">
          {filteredLeis.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {filterMode === 'favoritos' ? 'Nenhum favorito ainda' : filterMode === 'recentes' ? 'Nenhum acesso recente' : 'Nenhuma lei encontrada'}
              </p>
            </div>
          ) : (
            filteredLeis.map((lei, index) => {
              const Icon = lei.icon;
              const isFavorita = favoritas.some(f => f.lei_id === lei.id);
              return (
                <div
                  key={lei.id}
                  onClick={() => handleCardClick(lei)}
                  className="bg-card rounded-xl p-4 cursor-pointer hover:bg-accent/10 hover:scale-[1.02] transition-all border-l-4 group shadow-lg relative"
                  style={{ borderLeftColor: lei.color, opacity: 0, transform: 'translateY(-20px) translateZ(0)', animation: `slideDown 0.5s ease-out ${index * 0.08}s forwards`, willChange: 'transform, opacity' }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${lei.iconBg} rounded-lg p-2.5 shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{lei.sigla}</h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${lei.color}20`, color: lei.color }}>{lei.numero}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{lei.titulo}</p>
                    </div>
                    <LeiFavoritaButton isFavorita={isFavorita} isLoading={isTogglingFavorita} onClick={(e) => handleFavoritaClick(e, lei)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100" />
                    {isLocked ? (
                      <PremiumBadge position="top-right" size="sm" className="relative top-auto right-auto" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-amber-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
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

export default LegislacaoPenalEspecial;
