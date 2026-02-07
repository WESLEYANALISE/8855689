import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Scale, ChevronRight, Crown, Shield, Gavel, HandCoins, 
  BookText, FileCheck, GraduationCap, Target,
  ArrowLeft, BarChart3
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuestoesAreasCache } from "@/hooks/useQuestoesAreasCache";
import { useQuestoesArtigosCount } from "@/hooks/useQuestoesArtigosCount";
import EstatisticasQuestoesModal from "@/components/questoes/EstatisticasQuestoesModal";

interface CategoryCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  color: string;
  route: string;
}

// ABA 1: TEMA (Áreas do Direito)
const areaGlowColors = [
  "hsl(0, 84%, 60%)",
  "hsl(25, 95%, 53%)",
  "hsl(160, 84%, 39%)",
  "hsl(45, 93%, 47%)",
  "hsl(217, 91%, 60%)",
  "hsl(330, 81%, 60%)",
];

// ABA 2: ARTIGOS (Questões por Lei)
const categoriasArtigos: CategoryCard[] = [
  {
    id: "constituicao",
    title: "Constituição",
    description: "Constituição Federal 1988",
    icon: Crown,
    iconBg: "bg-orange-500",
    color: "#f97316",
    route: "/questoes/artigos-lei/temas?codigo=cf"
  },
  {
    id: "codigos",
    title: "Códigos e Leis",
    description: "CP, CC, CPC, CPP, CLT, CDC, CTN",
    icon: Scale,
    iconBg: "bg-red-500",
    color: "#ef4444",
    route: "/questoes/artigos-lei/codigos"
  },
  {
    id: "legislacao-penal",
    title: "Legislação Penal",
    description: "Leis Penais Especiais",
    icon: Shield,
    iconBg: "bg-red-600",
    color: "#dc2626",
    route: "/questoes/artigos-lei/legislacao-penal"
  },
  {
    id: "estatutos",
    title: "Estatutos",
    description: "ECA, OAB, Idoso, Cidade",
    icon: Gavel,
    iconBg: "bg-purple-500",
    color: "#a855f7",
    route: "/questoes/artigos-lei/estatutos"
  },
  {
    id: "previdenciario",
    title: "Previdenciário",
    description: "Custeio e Benefícios",
    icon: HandCoins,
    iconBg: "bg-emerald-500",
    color: "#10b981",
    route: "/questoes/artigos-lei/previdenciario"
  },
  {
    id: "sumulas",
    title: "Súmulas",
    description: "STF, STJ, TST, TSE",
    icon: BookText,
    iconBg: "bg-blue-500",
    color: "#3b82f6",
    route: "/questoes/artigos-lei/sumulas"
  }
];

// ABA 3: SIMULADOS - Apenas OAB
const categoriasSimulados: CategoryCard[] = [
  {
    id: "oab-exames",
    title: "Exames OAB",
    description: "Provas completas da OAB",
    icon: GraduationCap,
    iconBg: "bg-blue-600",
    color: "#2563eb",
    route: "/simulados/exames"
  }
];

const CategoryList = ({ categorias, keyPrefix }: { categorias: CategoryCard[], keyPrefix: string }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {categorias.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={`${keyPrefix}-${card.id}`}
            onClick={() => navigate(card.route)}
            className="bg-card rounded-xl p-4 cursor-pointer transition-colors border-l-4 group hover:bg-accent/10"
            style={{ borderLeftColor: card.color }}
          >
            <div className="flex items-center gap-3">
              <div className={`${card.iconBg} rounded-lg p-2.5 shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{card.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface AreaItem {
  area: string;
  totalQuestoes: number;
  totalTemas: number;
}

const AreasList = ({ areas, isLoading }: { areas: AreaItem[], isLoading: boolean }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-card/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!areas || areas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma área encontrada</p>
        <p className="text-sm mt-2">Carregando questões...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {areas.map((item, index) => {
        const glowColor = areaGlowColors[index % areaGlowColors.length];
        return (
          <div
            key={item.area}
            onClick={() => navigate(`/ferramentas/questoes/temas?area=${encodeURIComponent(item.area)}`)}
            className="bg-card rounded-xl p-4 cursor-pointer transition-colors border-l-4 group hover:bg-accent/10"
            style={{ borderLeftColor: glowColor }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="rounded-lg p-2.5 shrink-0"
                style={{ backgroundColor: `${glowColor}25` }}
              >
                <Target className="w-5 h-5" style={{ color: glowColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-base">{item.area}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.totalQuestoes.toLocaleString('pt-BR')} questões • {item.totalTemas} temas
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const QuestoesHub = () => {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("tema");
  const [showEstatisticas, setShowEstatisticas] = useState(false);
  const { areas, totalQuestoes: questoesTema, isLoading: areasLoading } = useQuestoesAreasCache();
  const { totalQuestoes: questoesArtigos } = useQuestoesArtigosCount();
  
  const totalQuestoes = questoesTema + questoesArtigos;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header sticky */}
      <div className="sticky top-0 z-20 bg-background border-b border-border/30">
        <div className="h-[env(safe-area-inset-top)] bg-background" />
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0 bg-black/80 hover:bg-black border border-white/20 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <div className="inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-600/10">
                <Target className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Questões</h1>
                <p className="text-muted-foreground text-xs">
                  <span className="text-red-400 font-semibold">{totalQuestoes.toLocaleString('pt-BR')}</span> disponíveis
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEstatisticas(true)}
              className="shrink-0 bg-black/80 hover:bg-black border border-white/20 rounded-full"
            >
              <BarChart3 className="w-5 h-5 text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sistema de Tabs */}
      <div className="flex-1 px-4 pt-4 pb-24">
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-card border border-border/50 h-auto p-1">
            <TabsTrigger 
              value="tema" 
              className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
            >
              <Scale className="w-4 h-4" />
              <span>Tema</span>
            </TabsTrigger>
            <TabsTrigger 
              value="artigos" 
              className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
            >
              <Gavel className="w-4 h-4" />
              <span>Artigos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="simulados" 
              className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
            >
              <FileCheck className="w-4 h-4" />
              <span>Simulados</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="tema" className="mt-0">
              <AreasList areas={areas || []} isLoading={areasLoading} />
            </TabsContent>
            
            <TabsContent value="artigos" className="mt-0">
              <CategoryList categorias={categoriasArtigos} keyPrefix="art" />
            </TabsContent>
            
            <TabsContent value="simulados" className="mt-0">
              <CategoryList categorias={categoriasSimulados} keyPrefix="sim" />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Modal de Estatísticas */}
      <EstatisticasQuestoesModal 
        open={showEstatisticas} 
        onOpenChange={setShowEstatisticas} 
      />
    </div>
  );
};

export default QuestoesHub;
