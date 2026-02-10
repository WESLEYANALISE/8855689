import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Scale, Shield, Database, Key, ClipboardCheck, Eye, DollarSign, FileCheck, BookMarked, Users, AlertTriangle, Handshake, Gavel, Search, CheckCircle } from "lucide-react";
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

interface LeiItem {
  id: string;
  abbr: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  route: string;
}

const leis: LeiItem[] = [
  { id: "improbidade", abbr: "8.429/92", title: "Improbidade Administrativa", description: "Lei 8.429/1992", icon: Shield, color: "#dc2626", iconBg: "bg-red-500", route: "/leis-ordinarias/improbidade" },
  { id: "licitacoes-nova", abbr: "14.133/21", title: "Nova Lei de Licitações", description: "Lei 14.133/2021", icon: FileCheck, color: "#2563eb", iconBg: "bg-blue-500", route: "/leis-ordinarias/licitacoes" },
  { id: "acao-civil-publica", abbr: "7.347/85", title: "Ação Civil Pública", description: "Lei 7.347/1985", icon: Users, color: "#16a34a", iconBg: "bg-green-500", route: "/leis-ordinarias/acao-civil-publica" },
  { id: "lgpd", abbr: "13.709/18", title: "LGPD", description: "Lei 13.709/2018", icon: Database, color: "#9333ea", iconBg: "bg-purple-500", route: "/leis-ordinarias/lgpd" },
  { id: "lrf", abbr: "LC 101/00", title: "Lei de Responsabilidade Fiscal", description: "LC 101/2000", icon: DollarSign, color: "#059669", iconBg: "bg-emerald-500", route: "/leis-ordinarias/lrf" },
  { id: "processo-administrativo", abbr: "9.784/99", title: "Processo Administrativo", description: "Lei 9.784/1999", icon: ClipboardCheck, color: "#ea580c", iconBg: "bg-orange-500", route: "/leis-ordinarias/processo-administrativo" },
  { id: "acesso-informacao", abbr: "12.527/11", title: "Acesso à Informação", description: "Lei 12.527/2011", icon: Eye, color: "#0891b2", iconBg: "bg-cyan-500", route: "/leis-ordinarias/acesso-informacao" },
  { id: "legislacao-tributaria", abbr: "9.430/96", title: "Legislação Tributária", description: "Lei 9.430/1996", icon: Scale, color: "#ca8a04", iconBg: "bg-yellow-500", route: "/leis-ordinarias/legislacao-tributaria" },
  { id: "registros-publicos", abbr: "6.015/73", title: "Registros Públicos", description: "Lei 6.015/1973", icon: BookMarked, color: "#4f46e5", iconBg: "bg-indigo-500", route: "/leis-ordinarias/registros-publicos" },
  { id: "juizados-civeis", abbr: "9.099/95", title: "Juizados Especiais Cíveis", description: "Lei 9.099/1995", icon: Gavel, color: "#0d9488", iconBg: "bg-teal-500", route: "/leis-ordinarias/juizados-civeis" },
  { id: "acao-popular", abbr: "4.717/65", title: "Ação Popular", description: "Lei 4.717/1965", icon: Users, color: "#db2777", iconBg: "bg-pink-500", route: "/leis-ordinarias/acao-popular" },
  { id: "anticorrupcao", abbr: "12.846/13", title: "Lei Anticorrupção", description: "Lei 12.846/2013", icon: AlertTriangle, color: "#e11d48", iconBg: "bg-rose-500", route: "/leis-ordinarias/anticorrupcao" },
  { id: "mediacao", abbr: "13.140/15", title: "Lei de Mediação", description: "Lei 13.140/2015", icon: Handshake, color: "#d97706", iconBg: "bg-amber-500", route: "/leis-ordinarias/mediacao" },
  { id: "adi-adc", abbr: "9.868/99", title: "ADI e ADC", description: "Lei 9.868/1999", icon: Key, color: "#7c3aed", iconBg: "bg-violet-500", route: "/leis-ordinarias/adi-adc" },
  { id: "lindb", abbr: "4.657/42", title: "LINDB", description: "Lei 4.657/1942", icon: FileText, color: "#475569", iconBg: "bg-slate-500", route: "/codigo/lindb" },
  { id: "mandado-seguranca", abbr: "12.016/09", title: "Mandado de Segurança", description: "Lei 12.016/2009", icon: Shield, color: "#0284c7", iconBg: "bg-sky-500", route: "/codigo/mandadoseguranca" },
  { id: "habeas-data", abbr: "9.507/97", title: "Habeas Data", description: "Lei 9.507/1997", icon: Database, color: "#c026d3", iconBg: "bg-fuchsia-500", route: "/codigo/habeasdata" },
  { id: "pregao", abbr: "10.520/02", title: "Pregão", description: "Lei 10.520/2002", icon: FileCheck, color: "#65a30d", iconBg: "bg-lime-500", route: "/codigo/pregao" },
  { id: "marco-civil-internet", abbr: "12.965/14", title: "Marco Civil da Internet", description: "Lei 12.965/2014", icon: Database, color: "#06b6d4", iconBg: "bg-cyan-500", route: "/codigo/marcocivilinternet" },
  { id: "arbitragem", abbr: "9.307/96", title: "Arbitragem", description: "Lei 9.307/1996", icon: Handshake, color: "#f97316", iconBg: "bg-orange-500", route: "/codigo/arbitragem" },
  { id: "inquilinato", abbr: "8.245/91", title: "Inquilinato", description: "Lei 8.245/1991", icon: Scale, color: "#78716c", iconBg: "bg-stone-500", route: "/codigo/inquilinato" },
  { id: "desapropriacao", abbr: "3.365/41", title: "Desapropriação", description: "Lei 3.365/1941", icon: Scale, color: "#ef4444", iconBg: "bg-red-500", route: "/codigo/desapropriacao" },
  { id: "meio-ambiente", abbr: "6.938/81", title: "Política Nacional do Meio Ambiente", description: "Lei 6.938/1981", icon: FileText, color: "#22c55e", iconBg: "bg-green-500", route: "/codigo/meioambiente" }
];

const CATEGORIA = 'leis_ordinarias' as const;

const LeisOrdinarias = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const { backgroundUrl, opacity, isGenerating, generateNew, deleteImage, setOpacity } = useBackgroundImage('leis-ordinarias');
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  
  // Hooks de favoritos e recentes
  const { data: favoritas = [] } = useLeisFavoritas(CATEGORIA);
  const { data: recentes = [] } = useLeisRecentes(CATEGORIA);
  const { toggle: toggleFavorita, isLoading: isTogglingFavorita } = useToggleFavorita(CATEGORIA);
  const registrarAcesso = useRegistrarAcesso(CATEGORIA);

  // Filtrar leis baseado no modo e busca
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
        const abbr = lei.abbr.toLowerCase().replace(/\./g, '');
        const title = lei.title.toLowerCase();
        const description = lei.description.toLowerCase();
        return abbr.includes(query) || title.includes(query) || description.includes(query);
      });
    }

    return result;
  }, [searchQuery, filterMode, favoritas, recentes]);

  const handleCardClick = (lei: LeiItem) => {
    if (!isPremium && !loadingSubscription) {
      setPremiumModalOpen(true);
      return;
    }
    registrarAcesso.mutate({
      lei_id: lei.id, titulo: lei.title, sigla: lei.abbr, cor: lei.color, route: lei.route,
    });
    navigate(lei.route);
  };

  const handleFavoritaClick = (e: React.MouseEvent, lei: LeiItem) => {
    e.stopPropagation();
    const isFavorita = favoritas.some(f => f.lei_id === lei.id);
    toggleFavorita({
      lei_id: lei.id,
      titulo: lei.title,
      sigla: lei.abbr,
      cor: lei.color,
      route: lei.route,
    }, isFavorita);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PremiumUpgradeModal open={premiumModalOpen} onOpenChange={setPremiumModalOpen} featureName="Leis Ordinárias" />
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
          <h1 className="text-xl font-bold text-foreground">LEIS ORDINÁRIAS</h1>
          <p className="text-sm text-cyan-400 mt-1">Legislação federal ordinária</p>
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
                        <h3 className="font-bold text-foreground">{lei.abbr}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{lei.title}</p>
                    </div>
                    {!isPremium && !loadingSubscription ? (
                      <PremiumBadge position="top-right" size="sm" className="relative top-auto right-auto" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
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

export default LeisOrdinarias;
