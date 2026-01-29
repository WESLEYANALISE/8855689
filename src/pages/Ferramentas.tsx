import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MonitorSmartphone, GraduationCap, Wrench,
  Scale, ChevronRight, Settings, MapPin, Globe, ExternalLink, Link2, BookOpen
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHero } from "@/components/PageHero";
import { useAuth } from "@/contexts/AuthContext";
// Preload da imagem
import heroFerramentas from "@/assets/hero-ferramentas.webp";
const preloadedImage = new Image();
preloadedImage.src = heroFerramentas;

interface FerramentaCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  color: string;
  route: string;
}

// ABA FERRAMENTAS - Simplificada
const ferramentasLista: FerramentaCard[] = [
  {
    id: "acesso-desktop",
    title: "Acesso Desktop",
    description: "Acesse a plataforma no computador",
    icon: MonitorSmartphone,
    iconBg: "bg-slate-500",
    color: "#64748b",
    route: "/acesso-desktop"
  },
  {
    id: "localizador-juridico",
    title: "Localizador Jurídico",
    description: "Tribunais, cartórios e OAB próximos",
    icon: MapPin,
    iconBg: "bg-teal-500",
    color: "#14b8a6",
    route: "/ferramentas/locais-juridicos"
  },
  {
    id: "ranking-faculdades",
    title: "Ranking de Faculdades",
    description: "Melhores faculdades de Direito do Brasil",
    icon: GraduationCap,
    iconBg: "bg-emerald-500",
    color: "#10b981",
    route: "/ranking-faculdades"
  },
  {
    id: "buscar-livros",
    title: "Biblioteca Digital",
    description: "Busque livros em acervos digitais",
    icon: BookOpen,
    iconBg: "bg-amber-500",
    color: "#f59e0b",
    route: "/ferramentas/buscar-livros"
  }
];

// Ferramentas de Admin (visível apenas para admin)
const ferramentasAdmin: FerramentaCard[] = [
  {
    id: "admin",
    title: "Administração",
    description: "Ferramentas de gestão do sistema",
    icon: Settings,
    iconBg: "bg-red-500",
    color: "#ef4444",
    route: "/admin"
  }
];

// Interface para links úteis
interface LinkUtilCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  color: string;
  url: string;
}

// ABA: LINKS ÚTEIS / PORTAIS JURÍDICOS
const linksUteis: LinkUtilCard[] = [
  {
    id: "stf",
    title: "STF",
    description: "Portal oficial do Supremo Tribunal Federal",
    icon: Scale,
    iconBg: "bg-red-600",
    color: "#dc2626",
    url: "https://portal.stf.jus.br/"
  },
  {
    id: "stj",
    title: "STJ",
    description: "Portal oficial do Superior Tribunal de Justiça",
    icon: Scale,
    iconBg: "bg-green-600",
    color: "#16a34a",
    url: "https://www.stj.jus.br/"
  },
  {
    id: "cnj",
    title: "CNJ",
    description: "Conselho Nacional de Justiça",
    icon: Scale,
    iconBg: "bg-blue-600",
    color: "#2563eb",
    url: "https://www.cnj.jus.br/"
  },
  {
    id: "tst",
    title: "TST",
    description: "Tribunal Superior do Trabalho",
    icon: Scale,
    iconBg: "bg-amber-600",
    color: "#d97706",
    url: "https://www.tst.jus.br/"
  },
  {
    id: "tse",
    title: "TSE",
    description: "Tribunal Superior Eleitoral",
    icon: Scale,
    iconBg: "bg-purple-600",
    color: "#9333ea",
    url: "https://www.tse.jus.br/"
  },
  {
    id: "planalto",
    title: "Planalto",
    description: "Legislação brasileira oficial",
    icon: Globe,
    iconBg: "bg-emerald-600",
    color: "#059669",
    url: "https://www.planalto.gov.br/legislacao"
  },
  {
    id: "oab",
    title: "OAB Nacional",
    description: "Ordem dos Advogados do Brasil",
    icon: Scale,
    iconBg: "bg-slate-700",
    color: "#334155",
    url: "https://www.oab.org.br/"
  },
  {
    id: "conjur",
    title: "ConJur",
    description: "Portal de notícias jurídicas",
    icon: Globe,
    iconBg: "bg-orange-500",
    color: "#f97316",
    url: "https://www.conjur.com.br/"
  },
  {
    id: "migalhas",
    title: "Migalhas",
    description: "Informativo jurídico diário",
    icon: Globe,
    iconBg: "bg-rose-500",
    color: "#f43f5e",
    url: "https://www.migalhas.com.br/"
  },
  {
    id: "jota",
    title: "JOTA",
    description: "Jornalismo e dados sobre o sistema de Justiça",
    icon: Globe,
    iconBg: "bg-cyan-600",
    color: "#0891b2",
    url: "https://www.jota.info/"
  }
];

const CategoryList = ({ categorias, keyPrefix }: { categorias: FerramentaCard[], keyPrefix: string }) => {
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

const LinksUteisList = ({ links }: { links: LinkUtilCard[] }) => {
  const handleClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      {links.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={`link-${card.id}`}
            onClick={() => handleClick(card.url)}
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
              <ExternalLink className="w-5 h-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const EMAIL_ADMIN = "wn7corporation@gmail.com";

const Ferramentas = () => {
  const { user } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState("ferramentas");
  
  const isAdmin = user?.email === EMAIL_ADMIN;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Background FIXO com imagem */}
      <div className="fixed inset-0 z-0">
        <img
          src={heroFerramentas}
          alt="Ferramentas"
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
      <div className="relative z-10">
        {/* PageHero com tema roxo */}
        <PageHero
          title="Ferramentas"
          subtitle="Todas as ferramentas úteis em um só lugar"
          icon={Wrench}
          iconGradient="from-purple-500/20 to-purple-600/10"
          iconColor="text-purple-400"
          lineColor="via-purple-500"
          showBackButton={true}
          backPath="/"
        />

        {/* Sistema de Tabs - 2 abas apenas */}
        <div className="px-4 pt-2 pb-24">
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-card/80 backdrop-blur-md border border-border/50 h-auto p-1">
              <TabsTrigger 
                value="ferramentas" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
              >
                <Wrench className="w-4 h-4" />
                <span>Ferramentas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="links" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
              >
                <Link2 className="w-4 h-4" />
                <span>Links Úteis</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="ferramentas" className="mt-0">
                <CategoryList categorias={ferramentasLista} keyPrefix="ferr" />
                
                {/* Seção Admin - apenas para email autorizado */}
                {isAdmin && (
                  <div className="mt-6 pt-4 border-t border-border/30">
                    <p className="text-xs text-muted-foreground mb-3 px-1">Administração</p>
                    <CategoryList categorias={ferramentasAdmin} keyPrefix="admin" />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="links" className="mt-0">
                <LinksUteisList links={linksUteis} />
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

export default Ferramentas;
