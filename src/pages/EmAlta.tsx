import { Flame, ArrowRight, GraduationCap, ClipboardCheck, Layers, FileCheck2, Brain, Video, Eye, Wrench, Compass, Clock, FileText, BookOpen, MapPin, Award, Library, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ADMIN_EMAIL = "wn7corporation@gmail.com";
const ITENS_RESTRITOS = ["ferramentas"];

type ItemEmAlta = { id: string; titulo: string; subtitulo: string; icon: LucideIcon; route: string };

// Itens da aba FERRAMENTAS
const itensFerramentas: ItemEmAlta[] = [
  {
    id: "se-aprofunde",
    titulo: "Se Aprofunde",
    subtitulo: "STF, Câmara, Senado e mais",
    icon: Compass,
    route: "/se-aprofunde"
  },
  {
    id: "tcc",
    titulo: "Pesquisa de TCCs",
    subtitulo: "Dissertações e teses acadêmicas",
    icon: FileText,
    route: "/ferramentas/tcc"
  },
  {
    id: "dicionario",
    titulo: "Dicionário Jurídico",
    subtitulo: "Consulte termos jurídicos",
    icon: BookOpen,
    route: "/dicionario"
  },
  {
    id: "localizador",
    titulo: "Localizador Jurídico",
    subtitulo: "Encontre serviços jurídicos",
    icon: MapPin,
    route: "/localizador-juridico"
  },
  {
    id: "ranking-faculdades",
    titulo: "Ranking de Faculdades",
    subtitulo: "Melhores faculdades de Direito",
    icon: Award,
    route: "/ranking-faculdades"
  },
  {
    id: "mapa-mental",
    titulo: "Mapa Mental",
    subtitulo: "Conecte conceitos",
    icon: Brain,
    route: "/mapa-mental/temas"
  },
  {
    id: "plano-estudos",
    titulo: "Plano de Estudos",
    subtitulo: "Organize sua preparação",
    icon: ClipboardCheck,
    route: "/plano-estudos"
  },
  {
    id: "cursos",
    titulo: "Iniciando o Direito",
    subtitulo: "Sua jornada começa aqui",
    icon: GraduationCap,
    route: "/iniciando-direito/todos"
  },
  {
    id: "simulados",
    titulo: "Simulados",
    subtitulo: "Provas de concursos públicos",
    icon: ClipboardCheck,
    route: "/simulados"
  },
  {
    id: "politica",
    titulo: "Política",
    subtitulo: "Estou te vendo 👁️",
    icon: Eye,
    route: "/politica"
  },
];

// Itens da aba ESTUDOS
const itensEstudos: ItemEmAlta[] = [
  {
    id: "biblioteca",
    titulo: "Biblioteca",
    subtitulo: "Acervo completo de livros",
    icon: Library,
    route: "/bibliotecas"
  },
  {
    id: "resumos",
    titulo: "Resumos Jurídicos",
    subtitulo: "Conteúdo objetivo",
    icon: FileCheck2,
    route: "/resumos-juridicos/prontos"
  },
  {
    id: "flashcards",
    titulo: "Flashcards",
    subtitulo: "Memorização eficiente",
    icon: Layers,
    route: "/flashcards/areas"
  },
  {
    id: "videoaulas",
    titulo: "Videoaulas",
    subtitulo: "Aulas em vídeo",
    icon: Video,
    route: "/videoaulas/playlists"
  },
  {
    id: "questoes",
    titulo: "Questões",
    subtitulo: "Pratique com questões reais",
    icon: HelpCircle,
    route: "/questoes"
  },
];

const EmAlta = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [activeTab, setActiveTab] = useState<"ferramentas" | "estudos">("estudos");

  const itensAtivos = activeTab === "ferramentas" ? itensFerramentas : itensEstudos;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-background to-background pointer-events-none" />

      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-6 relative">
        {/* Header */}
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-3 shadow-lg ring-2 ring-red-500/30"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Flame className="w-6 h-6 text-red-400" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Em Alta</h1>
            <p className="text-muted-foreground text-sm">Os recursos mais acessados</p>
          </div>
        </motion.div>

        {/* Tabs de alternância */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ferramentas" | "estudos")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger 
                value="estudos"
                className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg font-medium transition-all"
              >
                <Library className="w-4 h-4 mr-2" />
                Estudos
              </TabsTrigger>
              <TabsTrigger 
                value="ferramentas" 
                className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg font-medium transition-all"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Ferramentas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Lista vertical de funcionalidades */}
        <motion.div 
          className="space-y-3"
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === "ferramentas" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {itensAtivos.map((item, index) => {
            const isRestricted = ITENS_RESTRITOS.includes(item.id) && !isAdmin;
            
            const handleClick = () => {
              if (isRestricted) {
                toast("🚀 Em Breve!", { description: "Esta funcionalidade estará disponível em breve. Aguarde novidades!" });
                return;
              }
              navigate(item.route);
            };
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 + index * 0.05 }}
              >
                <Card 
                  className={`overflow-hidden cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all border-border/50 hover:border-red-500/30 ${isRestricted ? 'opacity-60' : ''}`}
                  onClick={handleClick}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 h-16">
                      {/* Ícone */}
                      <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-red-500/20 rounded-l-lg">
                        <item.icon className="w-6 h-6 text-red-400" />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {item.titulo}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.subtitulo}
                        </p>
                      </div>

                      {/* Badge Em Breve ou Seta */}
                      <div className="pr-4">
                        {isRestricted ? (
                          <span className="bg-amber-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            Em Breve
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default EmAlta;
