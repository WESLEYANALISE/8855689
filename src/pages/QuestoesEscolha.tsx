import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  HelpCircle, ChevronRight, BookMarked, Layers, FileCheck,
  Crown, Scale, Shield, Gavel, HandCoins, BookText,
  Target, ClipboardList, ArrowLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuestoesArtigosCount } from "@/hooks/useQuestoesArtigosCount";
import { useQuestoesAreasCache } from "@/hooks/useQuestoesAreasCache";

// Preload da imagem
import questoesBackground from "@/assets/questoes-background.webp";
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

// ABA 1: ARTIGOS (Questões por Lei)
const categoriasArtigo: CategoryCard[] = [
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
const categoriasSimulados: CategoryCard[] = [
  {
    id: "simulados-oab",
    title: "Exames da OAB",
    description: "Provas anteriores completas",
    icon: ClipboardList,
    iconBg: "bg-amber-500",
    color: "#f59e0b",
    route: "/simulados/exames"
  },
  {
    id: "simulado-personalizado",
    title: "Simulado Personalizado",
    description: "Monte sua prova ideal",
    icon: Target,
    iconBg: "bg-rose-500",
    color: "#f43f5e",
    route: "/simulados/personalizado"
  },
  {
    id: "simulados-concurso",
    title: "Concursos Públicos",
    description: "TJSP, Escrevente e mais",
    icon: FileCheck,
    iconBg: "bg-blue-600",
    color: "#2563eb",
    route: "/ferramentas/simulados"
  }
];

// Cores vibrantes para os cards de área (tema)
const areaCardColors = [
  { bg: "from-rose-600/30 to-red-900/50", glow: "rgba(244, 63, 94, 0.4)" },
  { bg: "from-violet-600/30 to-purple-900/50", glow: "rgba(139, 92, 246, 0.4)" },
  { bg: "from-emerald-600/30 to-green-900/50", glow: "rgba(16, 185, 129, 0.4)" },
  { bg: "from-amber-600/30 to-yellow-900/50", glow: "rgba(245, 158, 11, 0.4)" },
  { bg: "from-cyan-600/30 to-blue-900/50", glow: "rgba(6, 182, 212, 0.4)" },
  { bg: "from-fuchsia-600/30 to-pink-900/50", glow: "rgba(217, 70, 239, 0.4)" },
];

const CategoryList = ({ categorias, keyPrefix }: { categorias: CategoryCard[], keyPrefix: string }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {categorias.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={`${keyPrefix}-${card.id}`}
            onClick={() => navigate(card.route)}
            className="bg-card/90 backdrop-blur-sm rounded-xl p-4 cursor-pointer hover:bg-accent/10 hover:scale-[1.02] transition-all border-l-4 group shadow-lg"
            style={{ 
              borderLeftColor: card.color,
              opacity: 0,
              transform: 'translateY(-20px) translateZ(0)',
              animation: `slideDown 0.5s ease-out ${index * 0.08}s forwards`,
              willChange: 'transform, opacity'
            }}
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
        const colors = areaCardColors[index % areaCardColors.length];
        return (
          <div
            key={item.area}
            onClick={() => navigate(`/ferramentas/questoes/temas?area=${encodeURIComponent(item.area)}`)}
            className="relative rounded-xl overflow-hidden cursor-pointer group"
            style={{ 
              opacity: 0,
              transform: 'translateY(-20px) translateZ(0)',
              animation: `slideDown 0.5s ease-out ${index * 0.08}s forwards`,
              willChange: 'transform, opacity',
              boxShadow: `0 10px 25px -10px ${colors.glow}`
            }}
          >
            {/* Gradiente de fundo */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
            
            {/* Conteúdo */}
            <div className="relative z-10 p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base">{item.area}</h3>
                <p className="text-sm text-white/70">{item.totalQuestoes.toLocaleString('pt-BR')} questões</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70 shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const QuestoesEscolha = () => {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("tema");
  const { data: questoesCounts, totalQuestoes: totalArtigos } = useQuestoesArtigosCount();
  const { areas, totalQuestoes: totalTemas, isLoading: areasLoading } = useQuestoesAreasCache();
  
  const totalGeral = totalTemas + totalArtigos;

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
        {/* Header sticky com blur - padrão unificado */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-600/10">
                  <HelpCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Questões</h1>
                  <p className="text-muted-foreground text-sm">
                    <span className="text-red-400 font-semibold">{totalGeral.toLocaleString('pt-BR')}</span> questões disponíveis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sistema de Tabs */}
        <div className="px-4 pt-4">
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-card/80 backdrop-blur-md border border-border/50 h-auto p-1">
              <TabsTrigger 
                value="tema" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
              >
                <Layers className="w-4 h-4" />
                <span>Tema</span>
              </TabsTrigger>
              <TabsTrigger 
                value="artigo" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
              >
                <BookMarked className="w-4 h-4" />
                <span>Artigos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="simulados" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
              >
                <FileCheck className="w-4 h-4" />
                <span>Simulados</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 pb-24">
              <TabsContent value="tema" className="mt-0">
                <AreasList areas={areas || []} isLoading={areasLoading} />
              </TabsContent>
              
              <TabsContent value="artigo" className="mt-0">
                <CategoryList categorias={categoriasArtigo} keyPrefix="art" />
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
    </div>
  );
};

export default QuestoesEscolha;
