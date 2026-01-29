import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Crown, 
  BookOpen, 
  FileText, 
  Scale,
  Shield,
  GraduationCap,
  Video,
  Headphones,
  Layers,
  ClipboardList,
  Library,
  Users,
  Megaphone,
  Coffee,
  Gavel,
  Brain,
  Newspaper,
  Film,
  BookText,
  Flame,
  FileCheck2,
  MessageCircle,
  ClipboardCheck,
  Calculator,
  Sparkles,
  User,
  Landmark,
  BarChart3,
  Briefcase,
  FileSignature,
  Building2,
  Calendar,
  FileSearch,
  ScrollText,
  TrendingUp,
  Mail,
  Clock,
  Settings,
  Route
} from "lucide-react";
import { toast } from "sonner";

const ADMIN_EMAIL = "wn7corporation@gmail.com";
const ITENS_RESTRITOS_MUNDO_JURIDICO = ["/justica-em-numeros"];
const ITENS_RESTRITOS_BOLETINS = ["/carreira/advogado"];
import { cn } from "@/lib/utils";
import { ProfessoraChatDesktop } from "./ProfessoraChatDesktop";
import { supabase } from "@/integrations/supabase/client";
import { format, parse, isValid } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface AppSidebarProps {
  onClose?: () => void;
}

interface Novidade {
  id: number;
  "Atualização": string;
  "Área": string;
  "Dia": string;
  created_at: string;
}

export const AppSidebar = ({ onClose }: AppSidebarProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [professoraModalOpen, setProfessoraModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'novidades'>('menu');
  const [novidades, setNovidades] = useState<Novidade[]>([]);
  const [loadingNovidades, setLoadingNovidades] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch user avatar
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        });
    }
  }, [user]);

  // Fetch novidades quando aba for selecionada
  useEffect(() => {
    if (activeTab === 'novidades') {
      fetchNovidades();
    }
  }, [activeTab]);

  const isActive = (path: string) => location.pathname === path;

  // Fetch novidades (can be removed if no longer needed)
  const fetchNovidades = async () => {
    setLoadingNovidades(true);
    try {
      const { data, error } = await (supabase as any).from("NOVIDADES").select("*");
      if (error) throw error;

      const sortedData = (data || []).sort((a: Novidade, b: Novidade) => {
        try {
          const dateA = parse(a.Dia, "dd/MM/yyyy", new Date());
          const dateB = parse(b.Dia, "dd/MM/yyyy", new Date());
          if (!isValid(dateA) || !isValid(dateB)) return 0;
          return dateB.getTime() - dateA.getTime();
        } catch {
          return 0;
        }
      });
      setNovidades(sortedData);
    } catch (error) {
      console.error("Erro ao buscar novidades:", error);
    } finally {
      setLoadingNovidades(false);
    }
  };

  // EM ALTA - Funções populares
  const emAltaSections = [
    { title: "Vade Mecum", icon: BookOpen, path: "/vade-mecum" },
    { title: "Biblioteca", icon: Library, path: "/bibliotecas" },
    { title: "Resumos", icon: FileCheck2, path: "/resumos-juridicos" },
    { title: "Videoaulas", icon: Video, path: "/videoaulas" },
    { title: "Flashcards", icon: Layers, path: "/flashcards" },
    { title: "Questões", icon: ClipboardCheck, path: "/ferramentas/questoes" },
  ];

  // LEIS
  const leisSections = [
    { title: "Constituição", icon: Crown, path: "/constituicao" },
    { title: "Códigos e Leis", icon: BookOpen, path: "/codigos" },
    { title: "Estatutos", icon: FileText, path: "/estatutos" },
    { title: "Lei Penal Especial", icon: Shield, path: "/legislacao-penal-especial" },
    { title: "Súmulas", icon: Scale, path: "/sumulas" },
  ];

  // APRENDER
  const aprenderSections = [
    { title: "Conceitos", icon: Landmark, path: "/primeiros-passos" },
    { title: "Dominando", icon: Route, path: "/dominando" },
    { title: "Temática", icon: BookText, path: "/biblioteca-tematica" },
  ];

  // OAB
  const oabSections = [
    { title: "Primeira Fase", icon: ScrollText, path: "/oab-trilhas" },
    { title: "Segunda Fase", icon: Scale, path: "/oab/segunda-fase" },
    { title: "Carreira", icon: Briefcase, path: "/advogado" },
  ];

  // BIBLIOTECAS
  const bibliotecasSections = [
    { title: "Clássicos", icon: Library, path: "/biblioteca-classicos" },
    { title: "Estudos", icon: BookOpen, path: "/biblioteca-estudos" },
    { title: "Liderança", icon: Users, path: "/biblioteca-lideranca" },
    { title: "Oratória", icon: Megaphone, path: "/biblioteca-oratoria" },
    { title: "Fora da Toga", icon: Coffee, path: "/biblioteca-fora-da-toga" },
  ];


  return (
    <div className="flex flex-col h-full bg-card border-r border-border lg:h-auto">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-primary rounded-md p-1.5">
            <Scale className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Menu</h2>
        </div>

        
        {/* Toggle Menu/Novidades - Responsivo */}
        <div className="flex bg-secondary rounded-md p-0.5">
          <button
            onClick={() => setActiveTab('menu')}
            className={cn(
              "flex-1 px-2 py-2 md:py-1.5 rounded text-sm md:text-xs font-medium transition-all",
              activeTab === 'menu'
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Menu
          </button>
          <button
            onClick={() => setActiveTab('novidades')}
            className={cn(
              "flex-1 px-2 py-2 md:py-1.5 rounded text-sm md:text-xs font-medium transition-all flex items-center justify-center gap-1",
              activeTab === 'novidades'
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 md:w-3 md:h-3" />
            Novidades
          </button>
        </div>
      </div>

      {/* Scrollable content area - flex-1 with overflow for mobile/tablet */}
      <div className="flex-1 overflow-y-auto lg:overflow-visible">
        {activeTab === 'novidades' ? (
          /* Novidades Content */
          <div className="py-4 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold">Novidades</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Acompanhe as atualizações do app
            </p>

            {loadingNovidades ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : novidades.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma novidade ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {novidades.slice(0, 20).map((novidade) => (
                  <div
                    key={novidade.id}
                    className="p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {novidade["Área"]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {novidade.Dia}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      {novidade["Atualização"]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Menu Content */
          <div className="py-2">
          {/* Em Alta Section */}
          <div className="px-3 space-y-0.5 mb-4">
            <h3 className="px-2 text-[11px] md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 md:w-3 md:h-3 text-orange-500" />
              Em Alta
            </h3>
            {emAltaSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.path}
                  onClick={() => {
                    navigate(section.path);
                    onClose?.();
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 md:gap-2 px-2.5 md:px-2 py-2.5 md:py-2 rounded-md transition-colors text-left",
                    isActive(section.path)
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="text-sm md:text-xs">{section.title}</span>
                </button>
              );
            })}
          </div>

          {/* Leis Section */}
          <div className="px-3 space-y-0.5 mb-4">
            <h3 className="px-2 text-[11px] md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Leis
            </h3>
            {leisSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.path}
                  onClick={() => {
                    navigate(section.path);
                    onClose?.();
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 md:gap-2 px-2.5 md:px-2 py-2.5 md:py-2 rounded-md transition-colors text-left",
                    isActive(section.path)
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="text-sm md:text-xs">{section.title}</span>
                </button>
              );
            })}
          </div>

          {/* Aprender Section */}
          <div className="px-3 space-y-0.5 mb-4">
            <h3 className="px-2 text-[11px] md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Aprender
            </h3>
            {aprenderSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.path}
                  onClick={() => {
                    navigate(section.path);
                    onClose?.();
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 md:gap-2 px-2.5 md:px-2 py-2.5 md:py-2 rounded-md transition-colors text-left",
                    isActive(section.path)
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="text-sm md:text-xs">{section.title}</span>
                </button>
              );
            })}
          </div>

          {/* OAB Section */}
          <div className="px-3 space-y-0.5 mb-4">
            <h3 className="px-2 text-[11px] md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              OAB
            </h3>
            {oabSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.path}
                  onClick={() => {
                    navigate(section.path);
                    onClose?.();
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 md:gap-2 px-2.5 md:px-2 py-2.5 md:py-2 rounded-md transition-colors text-left",
                    isActive(section.path)
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="text-sm md:text-xs">{section.title}</span>
                </button>
              );
            })}
          </div>

          {/* Bibliotecas Section */}
          <div className="px-3 space-y-0.5 mb-4">
            <h3 className="px-2 text-[11px] md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Bibliotecas
            </h3>
            {bibliotecasSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.path}
                  onClick={() => {
                    navigate(section.path);
                    onClose?.();
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 md:gap-2 px-2.5 md:px-2 py-2.5 md:py-2 rounded-md transition-colors text-left",
                    isActive(section.path)
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="text-sm md:text-xs">{section.title}</span>
                </button>
              );
            })}
          </div>


          {/* Administração - Apenas para admin */}
          {isAdmin && (
            <div className="px-3 space-y-0.5 mb-4">
              <h3 className="px-2 text-[11px] md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Settings className="w-3 h-3 text-primary" />
                Administração
              </h3>
              <button
                onClick={() => {
                  navigate("/admin/geracao");
                  onClose?.();
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 md:gap-2 px-2.5 md:px-2 py-2.5 md:py-2 rounded-md transition-colors text-left",
                  location.pathname === "/admin/geracao"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <Settings className="w-5 h-5 md:w-4 md:h-4" />
                <span className="text-sm md:text-xs">Central de Geração IA</span>
              </button>
              <button
                onClick={() => {
                  navigate("/admin/trilhas-oab");
                  onClose?.();
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 md:gap-2 px-2.5 md:px-2 py-2.5 md:py-2 rounded-md transition-colors text-left",
                  location.pathname === "/admin/trilhas-oab"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <Route className="w-5 h-5 md:w-4 md:h-4" />
                <span className="text-sm md:text-xs">Trilhas OAB</span>
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Bottom - Perfil + Premium (apenas Mobile/Tablet) - FIXO */}
      {user && onClose && (
        <div className="flex-shrink-0 border-t border-border p-3 bg-card">
          <div className="grid grid-cols-2 gap-2">
            {/* Botão Premium */}
            <button
              onClick={() => {
                navigate('/assinatura');
                onClose?.();
              }}
              className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-md text-sm font-medium transition-all bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-500 border border-amber-500/30"
            >
              <Crown className="w-4 h-4" />
              <span>Premium</span>
            </button>
            
            {/* Botão Meu Perfil */}
            <button
              onClick={() => {
                navigate('/perfil');
                onClose?.();
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-md text-sm font-medium transition-all",
                location.pathname === '/perfil'
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span>Meu Perfil</span>
            </button>
          </div>
        </div>
      )}

      <ProfessoraChatDesktop 
        isOpen={professoraModalOpen} 
        onClose={() => setProfessoraModalOpen(false)} 
      />
    </div>
  );
};
