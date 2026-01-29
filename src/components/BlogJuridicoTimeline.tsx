import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Scale, Briefcase, Landmark, BookOpenCheck, Lightbulb, FileQuestion, 
  Gavel, ChevronRight, BookOpen, Layers, Star, ScrollText, Building, 
  Users, Building2, Globe, Heart, FileText, GitCompare, AlertTriangle, 
  Lock, BookMarked, ArrowLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Preload da imagem imediatamente ao carregar o módulo
import heroBlogJuridico from "@/assets/hero-fundamentos-biblioteca.webp";
const preloadedImage = new Image();
preloadedImage.src = heroBlogJuridico;

interface CategoryCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  color: string;
  route: string;
}

// ABA 1: INÍCIO (Fundamentos - sem Carreiras Jurídicas)
const categoriasFundamentos: CategoryCard[] = [
  {
    id: "iniciando",
    title: "Iniciando no Direito",
    description: "Conceitos básicos para iniciantes",
    icon: BookOpen,
    iconBg: "bg-emerald-500",
    color: "#10b981",
    route: "/blogger-juridico/artigos?categoria=iniciando"
  },
  {
    id: "termos",
    title: "Termos Jurídicos",
    description: "Vocabulário jurídico essencial",
    icon: FileQuestion,
    iconBg: "bg-cyan-500",
    color: "#06b6d4",
    route: "/blogger-juridico/artigos?categoria=termos"
  },
  {
    id: "curiosidades",
    title: "Curiosidades",
    description: "Fatos inusitados do mundo jurídico",
    icon: Lightbulb,
    iconBg: "bg-amber-500",
    color: "#f59e0b",
    route: "/blogger-juridico/artigos?categoria=curiosidades"
  },
  {
    id: "areas",
    title: "Áreas do Direito",
    description: "Civil, Penal, Trabalhista e mais",
    icon: Layers,
    iconBg: "bg-indigo-500",
    color: "#6366f1",
    route: "/blogger-juridico/artigos?categoria=areas"
  },
  {
    id: "principios",
    title: "Princípios do Direito",
    description: "Bases fundamentais da justiça",
    icon: Star,
    iconBg: "bg-yellow-500",
    color: "#eab308",
    route: "/blogger-juridico/artigos?categoria=principios"
  }
];

// ABA 2: HISTÓRIA & PENSADORES
const categoriasHistoria: CategoryCard[] = [
  {
    id: "historia",
    title: "História do Direito",
    description: "A evolução através dos séculos",
    icon: Landmark,
    iconBg: "bg-stone-600",
    color: "#57534e",
    route: "/blogger-juridico/artigos?categoria=historia"
  },
  {
    id: "filosofos",
    title: "Filósofos do Direito",
    description: "Pensadores que moldaram o Direito",
    icon: BookOpenCheck,
    iconBg: "bg-violet-600",
    color: "#7c3aed",
    route: "/blogger-juridico/artigos?categoria=filosofos"
  },
  {
    id: "casos",
    title: "Casos Famosos",
    description: "Processos históricos do Brasil",
    icon: Gavel,
    iconBg: "bg-rose-600",
    color: "#e11d48",
    route: "/blogger-juridico/artigos?categoria=casos"
  },
  {
    id: "codigos_historicos",
    title: "Códigos Históricos",
    description: "Hamurabi, Napoleão, Justiniano",
    icon: ScrollText,
    iconBg: "bg-amber-600",
    color: "#d97706",
    route: "/blogger-juridico/artigos?categoria=codigos_historicos"
  },
  {
    id: "civilizacoes",
    title: "Civilizações e Direito",
    description: "Roma, Grécia, Mesopotâmia",
    icon: Building,
    iconBg: "bg-orange-500",
    color: "#f97316",
    route: "/blogger-juridico/artigos?categoria=civilizacoes"
  },
  {
    id: "juristas_brasileiros",
    title: "Grandes Juristas Brasileiros",
    description: "Rui Barbosa, Pontes de Miranda",
    icon: Users,
    iconBg: "bg-green-600",
    color: "#16a34a",
    route: "/blogger-juridico/artigos?categoria=juristas_brasileiros"
  },
  {
    id: "julgamentos_mundiais",
    title: "Julgamentos que Mudaram o Mundo",
    description: "Nuremberg, Brown v. Board",
    icon: Scale,
    iconBg: "bg-red-600",
    color: "#dc2626",
    route: "/blogger-juridico/artigos?categoria=julgamentos_mundiais"
  }
];

// ABA 3: INSTITUIÇÕES & MUNDO
const categoriasInstituicoes: CategoryCard[] = [
  {
    id: "tribunais_brasil",
    title: "Tribunais do Brasil",
    description: "STF, STJ, TST e todos tribunais",
    icon: Building2,
    iconBg: "bg-blue-700",
    color: "#1d4ed8",
    route: "/blogger-juridico/artigos?categoria=tribunais_brasil"
  },
  {
    id: "orgaos_juridicos",
    title: "Órgãos Jurídicos",
    description: "MP, Defensoria, OAB",
    icon: Briefcase,
    iconBg: "bg-purple-600",
    color: "#9333ea",
    route: "/blogger-juridico/artigos?categoria=orgaos_juridicos"
  },
  {
    id: "sistemas_juridicos",
    title: "Sistemas Jurídicos no Mundo",
    description: "Common Law, Civil Law",
    icon: Globe,
    iconBg: "bg-teal-500",
    color: "#14b8a6",
    route: "/blogger-juridico/artigos?categoria=sistemas_juridicos"
  },
  {
    id: "direitos_humanos",
    title: "Direitos Humanos",
    description: "ONU, tratados internacionais",
    icon: Heart,
    iconBg: "bg-pink-500",
    color: "#ec4899",
    route: "/blogger-juridico/artigos?categoria=direitos_humanos"
  },
  {
    id: "constituicoes_brasil",
    title: "Constituições do Brasil",
    description: "1824 até 1988",
    icon: FileText,
    iconBg: "bg-emerald-600",
    color: "#059669",
    route: "/blogger-juridico/artigos?categoria=constituicoes_brasil"
  },
  {
    id: "direito_comparado",
    title: "Direito Comparado",
    description: "Leis pelo mundo",
    icon: GitCompare,
    iconBg: "bg-cyan-600",
    color: "#0891b2",
    route: "/blogger-juridico/artigos?categoria=direito_comparado"
  },
  {
    id: "crimes_famosos",
    title: "Crimes Famosos",
    description: "Casos criminais marcantes",
    icon: AlertTriangle,
    iconBg: "bg-red-500",
    color: "#ef4444",
    route: "/blogger-juridico/artigos?categoria=crimes_famosos"
  },
  {
    id: "prisoes_historicas",
    title: "Prisões Históricas",
    description: "Alcatraz, Ilha Grande, Carandiru",
    icon: Lock,
    iconBg: "bg-gray-600",
    color: "#4b5563",
    route: "/blogger-juridico/artigos?categoria=prisoes_historicas"
  }
];

// Timeline Card Component
const TimelineCard = ({ 
  card, 
  index, 
  isLeft 
}: { 
  card: CategoryCard; 
  index: number; 
  isLeft: boolean;
}) => {
  const navigate = useNavigate();
  const Icon = card.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="relative flex items-center mb-6"
    >
      {isLeft ? (
        <>
          {/* Card à esquerda */}
          <div className="w-1/2 pr-4 sm:pr-6">
            <button
              onClick={() => navigate(card.route)}
              className="w-full h-[90px] sm:h-[100px] bg-neutral-800/90 hover:bg-neutral-700/90 rounded-2xl p-3 sm:p-4 text-left transition-all hover:scale-[1.02] shadow-xl border border-white/10 flex items-center gap-2.5 sm:gap-3"
            >
              <div className={`${card.iconBg} rounded-xl p-2 sm:p-2.5 shrink-0`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                  {card.title}
                </h3>
              </div>
            </button>
          </div>
          <div className="w-1/2" />
        </>
      ) : (
        <>
          <div className="w-1/2" />
          {/* Card à direita */}
          <div className="w-1/2 pl-4 sm:pl-6">
            <button
              onClick={() => navigate(card.route)}
              className="w-full h-[90px] sm:h-[100px] bg-neutral-800/90 hover:bg-neutral-700/90 rounded-2xl p-3 sm:p-4 text-left transition-all hover:scale-[1.02] shadow-xl border border-white/10 flex items-center gap-2.5 sm:gap-3"
            >
              <div className={`${card.iconBg} rounded-xl p-2 sm:p-2.5 shrink-0`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                  {card.title}
                </h3>
              </div>
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};

// Timeline List Component
const TimelineList = ({ categorias }: { categorias: CategoryCard[] }) => {
  return (
    <div className="relative px-2 py-4">
      {/* Linha central da timeline */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 via-orange-500/40 to-orange-500/20" />
        <motion.div
          className="absolute w-full h-20 bg-gradient-to-b from-transparent via-orange-500 to-transparent opacity-60"
          animate={{ y: ["0%", "400%"] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Cards da timeline */}
      <div className="relative space-y-4">
        {categorias.map((card, index) => {
          const isLeft = index % 2 === 0;
          return (
            <TimelineCard
              key={card.id}
              card={card}
              index={index}
              isLeft={isLeft}
            />
          );
        })}
      </div>

      {/* Indicador final */}
      {categorias.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: categorias.length * 0.1 + 0.3 }}
          className="flex justify-center mt-6"
        >
          <div className="px-4 py-2 bg-card/80 rounded-full border border-border/50">
            <p className="text-xs text-muted-foreground">
              Escolha um tema para explorar
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export const BlogJuridicoTimeline = () => {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("fundamentos");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background FIXO com imagem */}
      <div className="fixed inset-0 z-0">
        <img
          src={heroBlogJuridico}
          alt="Fundamentos"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
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
        {/* Header sticky */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
          <div className="px-4 py-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/primeiros-passos')}
              className="rounded-full bg-card/80 hover:bg-card"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Fundamentos</h1>
              <p className="text-sm text-muted-foreground">Conhecimento essencial do Direito</p>
            </div>
          </div>
        </div>

        {/* Sistema de Tabs */}
        <div className="px-4 pt-4">
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-card/80 backdrop-blur-md border border-border/50 h-auto p-1">
              <TabsTrigger 
                value="fundamentos" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400"
              >
                <BookMarked className="w-4 h-4" />
                <span>Início</span>
              </TabsTrigger>
              <TabsTrigger 
                value="historia" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400"
              >
                <Landmark className="w-4 h-4" />
                <span>História</span>
              </TabsTrigger>
              <TabsTrigger 
                value="instituicoes" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400"
              >
                <Globe className="w-4 h-4" />
                <span>Mundo</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-2" style={{ minHeight: 'calc(100vh - 220px)' }}>
              <TabsContent value="fundamentos" className="mt-0">
                <TimelineList categorias={categoriasFundamentos} />
              </TabsContent>
              
              <TabsContent value="historia" className="mt-0">
                <TimelineList categorias={categoriasHistoria} />
              </TabsContent>
              
              <TabsContent value="instituicoes" className="mt-0">
                <TimelineList categorias={categoriasInstituicoes} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
