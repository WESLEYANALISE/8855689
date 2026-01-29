import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Scale, ChevronRight, Crown, Shield, Gavel, HandCoins, 
  BookText, FileCheck, GraduationCap, ScrollText, Target, Users,
  ArrowLeft, Lock, BarChart3
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuestoesAreasCache } from "@/hooks/useQuestoesAreasCache";
import { useQuestoesArtigosCount } from "@/hooks/useQuestoesArtigosCount";
import questoesBackground from "@/assets/questoes-background-new.webp";
import { toast } from "sonner";
import EstatisticasQuestoesModal from "@/components/questoes/EstatisticasQuestoesModal";

// Preload da imagem
const preloadedImage = new Image();
preloadedImage.src = questoesBackground;

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
// Cores para bordas laterais (estilo artigo)
const areaGlowColors = [
  "hsl(0, 84%, 60%)",    // red
  "hsl(25, 95%, 53%)",   // orange
  "hsl(160, 84%, 39%)",  // emerald
  "hsl(45, 93%, 47%)",   // amber
  "hsl(217, 91%, 60%)",  // blue
  "hsl(330, 81%, 60%)",  // pink
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

// ABA 3: SIMULADOS
const categoriasSimulados: (CategoryCard & { emBreve?: boolean })[] = [
  {
    id: "oab-exames",
    title: "Exames OAB",
    description: "Provas completas da OAB",
    icon: GraduationCap,
    iconBg: "bg-blue-600",
    color: "#2563eb",
    route: "/simulados/exames"
  },
  {
    id: "simulado-personalizado",
    title: "Simulado Personalizado",
    description: "Monte sua prova ideal",
    icon: Target,
    iconBg: "bg-purple-500",
    color: "#a855f7",
    route: "",
    emBreve: true
  },
  {
    id: "tjsp",
    title: "Concursos TJSP",
    description: "Provas de escrevente e oficial",
    icon: ScrollText,
    iconBg: "bg-emerald-500",
    color: "#10b981",
    route: "/ferramentas/simulados/escrevente"
  },
  {
    id: "concursos-federais",
    title: "Concursos Federais",
    description: "Tribunais e órgãos federais",
    icon: FileCheck,
    iconBg: "bg-amber-500",
    color: "#f59e0b",
    route: "",
    emBreve: true
  },
  {
    id: "defensoria",
    title: "Defensoria Pública",
    description: "Provas de DPE e DPU",
    icon: Users,
    iconBg: "bg-rose-500",
    color: "#f43f5e",
    route: "",
    emBreve: true
  }
];

const CategoryList = ({ categorias, keyPrefix }: { categorias: (CategoryCard & { emBreve?: boolean })[], keyPrefix: string }) => {
  const navigate = useNavigate();

  const handleClick = (card: CategoryCard & { emBreve?: boolean }) => {
    if (card.emBreve) {
      toast.info("Em breve", {
        description: `${card.title} estará disponível em breve!`
      });
      return;
    }
    navigate(card.route);
  };

  return (
    <div className="space-y-3">
      {categorias.map((card, index) => {
        const Icon = card.icon;
        const isEmBreve = card.emBreve;
        return (
          <div
            key={`${keyPrefix}-${card.id}`}
            onClick={() => handleClick(card)}
            className={`bg-card/90 backdrop-blur-sm rounded-xl p-4 cursor-pointer transition-all border-l-4 group shadow-lg ${
              isEmBreve ? "opacity-60" : "hover:bg-accent/10 hover:scale-[1.02]"
            }`}
            style={{ 
              borderLeftColor: isEmBreve ? "#6b7280" : card.color,
              opacity: 0,
              transform: 'translateY(-20px) translateZ(0)',
              animation: `slideDown 0.5s ease-out ${index * 0.08}s forwards`,
              willChange: 'transform, opacity'
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`${isEmBreve ? "bg-gray-500" : card.iconBg} rounded-lg p-2.5 shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground">{card.title}</h3>
                  {isEmBreve && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Em breve</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{card.description}</p>
              </div>
              {isEmBreve ? (
                <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
              )}
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
            onClick={() => navigate(`/ferramentas/questoes/temas-hub?area=${encodeURIComponent(item.area)}`)}
            className="bg-card/90 backdrop-blur-sm rounded-xl p-4 cursor-pointer transition-all border-l-4 group shadow-lg hover:bg-muted/80 hover:translate-x-1"
            style={{ 
              borderLeftColor: glowColor,
              boxShadow: `inset 4px 0 12px -4px ${glowColor}40`,
              opacity: 0,
              transform: 'translateY(-20px) translateZ(0)',
              animation: `slideDown 0.5s ease-out ${index * 0.08}s forwards`,
              willChange: 'transform, opacity'
            }}
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
  
  // Total combinado
  const totalQuestoes = questoesTema + questoesArtigos;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background FIXO com imagem */}
      <div className="fixed inset-0 z-0">
        <img
          src={questoesBackground}
          alt="Questões"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="sync"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              hsl(var(--background) / 0.7) 0%,
              hsl(var(--background) / 0.75) 30%,
              hsl(var(--background) / 0.8) 60%,
              hsl(var(--background) / 0.9) 100%
            )`
          }}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex flex-col pb-24">
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-4 pt-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <div className="inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-600/10">
                <Target className="w-5 h-5 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Questões</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEstatisticas(true)}
              className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
            >
              <BarChart3 className="w-5 h-5 text-white" />
            </Button>
          </div>
          <p className="text-muted-foreground text-sm ml-11">
            <span className="text-red-400 font-semibold">{totalQuestoes.toLocaleString('pt-BR')}</span> questões disponíveis
          </p>
        </div>

        {/* Sistema de Tabs */}
        <div className="px-4 pt-4">
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-card/80 backdrop-blur-md border border-border/50 h-auto p-1">
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

            <div className="mt-4 pb-24">
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
      </div>

      {/* CSS para animações */}
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

      {/* Modal de Estatísticas */}
      <EstatisticasQuestoesModal 
        open={showEstatisticas} 
        onOpenChange={setShowEstatisticas} 
      />
    </div>
  );
};

export default QuestoesHub;
