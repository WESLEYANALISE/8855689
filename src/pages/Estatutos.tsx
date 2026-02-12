import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Scale, Users, Accessibility, Shield, Gavel, ScrollText, Flag, Search, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface EstatutoCard {
  id: string;
  abbr: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const estatutos: EstatutoCard[] = [
  { id: "oab", abbr: "OAB", title: "Estatuto da OAB", description: "Lei 8.906/1994", icon: Gavel, color: "hsl(160,84%,39%)" },
  { id: "cidade", abbr: "Cidade", title: "Estatuto da Cidade", description: "Lei 10.257/2001", icon: Scale, color: "hsl(217,91%,60%)" },
  { id: "desarmamento", abbr: "Desarmamento", title: "Estatuto do Desarmamento", description: "Lei 10.826/2003", icon: Shield, color: "hsl(24,95%,53%)" },
  { id: "eca", abbr: "ECA", title: "Estatuto da Criança e do Adolescente", description: "Lei 8.069/1990", icon: Users, color: "hsl(262,83%,58%)" },
  { id: "idoso", abbr: "Idoso", title: "Estatuto do Idoso", description: "Lei 10.741/2003", icon: Accessibility, color: "hsl(271,76%,53%)" },
  { id: "igualdade-racial", abbr: "Igualdade Racial", title: "Estatuto da Igualdade Racial", description: "Lei 12.288/2010", icon: Flag, color: "hsl(43,96%,56%)" },
  { id: "pessoa-deficiencia", abbr: "Pessoa com Deficiência", title: "Estatuto da Pessoa com Deficiência", description: "Lei 13.146/2015", icon: Accessibility, color: "hsl(38,92%,50%)" },
  { id: "torcedor", abbr: "Torcedor", title: "Estatuto do Torcedor", description: "Lei 10.671/2003", icon: ScrollText, color: "hsl(330,81%,60%)" },
  { id: "militares", abbr: "Militares", title: "Estatuto dos Militares", description: "Lei 6.880/1980", icon: Shield, color: "hsl(200,80%,45%)" },
  { id: "terra", abbr: "Terra", title: "Estatuto da Terra", description: "Lei 4.504/1964", icon: Flag, color: "hsl(120,50%,40%)" },
  { id: "migracao", abbr: "Migração", title: "Estatuto da Migração", description: "Lei 13.445/2017", icon: Users, color: "hsl(180,60%,45%)" },
  { id: "juventude", abbr: "Juventude", title: "Estatuto da Juventude", description: "Lei 12.852/2013", icon: Users, color: "hsl(280,70%,55%)" },
  { id: "indio", abbr: "Índio", title: "Estatuto do Índio", description: "Lei 6.001/1973", icon: Users, color: "hsl(30,70%,50%)" },
  { id: "refugiado", abbr: "Refugiado", title: "Estatuto do Refugiado", description: "Lei 9.474/1997", icon: Users, color: "hsl(350,70%,50%)" },
  { id: "metropole", abbr: "Metrópole", title: "Estatuto da Metrópole", description: "Lei 13.089/2015", icon: Scale, color: "hsl(220,70%,55%)" },
  { id: "desporto", abbr: "Desporto", title: "Estatuto do Desporto", description: "Lei 9.615/1998", icon: ScrollText, color: "hsl(150,60%,45%)" },
  { id: "mpe", abbr: "Micro e Pequena Empresa", title: "Estatuto da Micro e Pequena Empresa", description: "LC 123/2006", icon: Scale, color: "hsl(45,80%,50%)" },
  { id: "seguranca-privada", abbr: "Segurança Privada", title: "Estatuto da Segurança Privada", description: "Lei 7.102/1983", icon: Shield, color: "hsl(0,70%,50%)" },
  { id: "magisterio", abbr: "Magistério Superior", title: "Estatuto do Magistério Superior", description: "Lei 5.540/1968", icon: Gavel, color: "hsl(250,60%,55%)" },
  { id: "cancer", abbr: "Pessoa com Câncer", title: "Estatuto da Pessoa com Câncer", description: "Lei 14.238/2021", icon: Accessibility, color: "hsl(340,70%,55%)" },
];

const CATEGORIA = 'estatutos' as const;

const Estatutos = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const { backgroundUrl, opacity, isGenerating, generateNew, deleteImage, setOpacity } = useBackgroundImage('estatutos');
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  const { data: favoritas = [] } = useLeisFavoritas(CATEGORIA);
  const { data: recentes = [] } = useLeisRecentes(CATEGORIA);
  const { toggle: toggleFavorita, isLoading: isTogglingFavorita } = useToggleFavorita(CATEGORIA);
  const registrarAcesso = useRegistrarAcesso(CATEGORIA);

  const filteredEstatutos = useMemo(() => {
    let result = estatutos;
    if (filterMode === 'favoritos') {
      const favoritasIds = favoritas.map(f => f.lei_id);
      result = estatutos.filter(e => favoritasIds.includes(e.id));
    } else if (filterMode === 'recentes') {
      const recentesIds = recentes.map(r => r.lei_id);
      result = recentesIds.map(id => estatutos.find(e => e.id === id)).filter((e): e is EstatutoCard => e !== undefined);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => e.abbr.toLowerCase().includes(query) || e.title.toLowerCase().includes(query));
    }
    return result;
  }, [searchQuery, filterMode, favoritas, recentes]);

  // Primeiros 2 estatutos são gratuitos
  const FREE_ESTATUTOS = ['oab', 'cidade'];
  const isFreeEstatuto = (id: string) => FREE_ESTATUTOS.includes(id);

  const handleCardClick = (estatuto: EstatutoCard) => {
    if (!isPremium && !loadingSubscription && !isFreeEstatuto(estatuto.id)) {
      setPremiumModalOpen(true);
      return;
    }
    registrarAcesso.mutate({
      lei_id: estatuto.id, titulo: estatuto.title, sigla: estatuto.abbr, cor: estatuto.color, route: `/estatuto/${estatuto.id}`,
    });
    navigate(`/estatuto/${estatuto.id}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PremiumUpgradeModal open={premiumModalOpen} onOpenChange={setPremiumModalOpen} featureName="Estatutos" />

      <LegislacaoBackground imageUrl={backgroundUrl} opacity={opacity} className="border-b border-border/30">
        <div className="px-4 py-6 flex flex-col items-center text-center bg-gradient-to-b from-card/80 to-background">
          <div className="absolute top-3 right-3 z-20">
            <GerenciadorBackgroundModal backgroundUrl={backgroundUrl} opacity={opacity} isGenerating={isGenerating} onGenerate={generateNew} onDelete={deleteImage} onOpacityChange={setOpacity} />
          </div>
          <img src={brasaoRepublica} alt="Brasão da República" className="w-20 h-20 object-contain mb-3" />
          <h1 className="text-xl font-bold text-foreground">ESTATUTOS</h1>
          <p className="text-sm text-amber-400 mt-1">Legislação brasileira especial</p>
        </div>
      </LegislacaoBackground>

      <div className="px-4 py-4 border-b border-border/30 bg-card/50 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar estatuto..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-background/50" />
          <Button variant="secondary" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">Buscar</Button>
        </div>
        <LeisToggleMenu value={filterMode} onChange={setFilterMode} favoritosCount={favoritas.length} recentesCount={recentes.length} />
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3 pb-24">
          {filteredEstatutos.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {filterMode === 'favoritos' ? 'Nenhum favorito ainda' : filterMode === 'recentes' ? 'Nenhum acesso recente' : 'Nenhum estatuto encontrado'}
              </p>
            </div>
          ) : (
            filteredEstatutos.map((estatuto, index) => {
              const Icon = estatuto.icon;
              const isLocked = !isPremium && !loadingSubscription && !isFreeEstatuto(estatuto.id);
              return (
                <div
                  key={estatuto.id}
                  onClick={() => handleCardClick(estatuto)}
                  className="bg-card rounded-xl p-4 cursor-pointer hover:bg-accent/10 hover:scale-[1.02] transition-all border-l-4 group shadow-lg relative"
                  style={{ borderLeftColor: estatuto.color, opacity: 0, transform: 'translateY(-20px) translateZ(0)', animation: `slideDown 0.5s ease-out ${index * 0.08}s forwards`, willChange: 'transform, opacity' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2.5 shrink-0" style={{ backgroundColor: estatuto.color }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{estatuto.abbr}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{estatuto.title}</p>
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

export default Estatutos;
