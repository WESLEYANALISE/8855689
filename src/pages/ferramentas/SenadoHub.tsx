import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Landmark, 
  Users, 
  Vote, 
  FileText, 
  Calendar, 
  Building2, 
  ArrowRight,
  Mic
} from "lucide-react";
import senadoBg from "@/assets/senado-bg.webp";

const funcionalidades = [
  {
    id: "senadores",
    titulo: "Senadores",
    subtitulo: "81 senadores em exercício",
    icon: Users,
    cor: "amber",
  },
  {
    id: "votacoes",
    titulo: "Votações",
    subtitulo: "Votações nominais do plenário",
    icon: Vote,
    cor: "green",
  },
  {
    id: "materias",
    titulo: "Matérias",
    subtitulo: "PEC, PLS, PLP e mais",
    icon: FileText,
    cor: "blue",
  },
  {
    id: "comissoes",
    titulo: "Comissões",
    subtitulo: "Comissões permanentes e temporárias",
    icon: Building2,
    cor: "purple",
  },
  {
    id: "agenda",
    titulo: "Agenda",
    subtitulo: "Plenário e comissões",
    icon: Calendar,
    cor: "orange",
  },
];

const SenadoHub = () => {
  const navigate = useNavigate();

  const getPath = (id: string) => {
    const paths: Record<string, string> = {
      senadores: "/ferramentas/senado/senadores",
      votacoes: "/ferramentas/senado/votacoes",
      materias: "/ferramentas/senado/materias",
      comissoes: "/ferramentas/senado/comissoes",
      agenda: "/ferramentas/senado/agenda",
    };
    return paths[id] || "/ferramentas/senado";
  };

  const getColorClasses = (cor: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      amber: { bg: "bg-amber-500/20", text: "text-amber-400", border: "hover:border-amber-500/30" },
      green: { bg: "bg-green-500/20", text: "text-green-400", border: "hover:border-green-500/30" },
      blue: { bg: "bg-blue-500/20", text: "text-blue-400", border: "hover:border-blue-500/30" },
      purple: { bg: "bg-purple-500/20", text: "text-purple-400", border: "hover:border-purple-500/30" },
      orange: { bg: "bg-orange-500/20", text: "text-orange-400", border: "hover:border-orange-500/30" },
    };
    return colors[cor] || colors.amber;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0 relative">
      {/* Background image */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${senadoBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background pointer-events-none" />

      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-6 relative">
        {/* Header */}
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className="bg-amber-500/20 backdrop-blur-sm rounded-2xl p-3 shadow-lg ring-2 ring-amber-500/30"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Landmark className="w-6 h-6 text-amber-400" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Senado Federal</h1>
            <p className="text-muted-foreground text-sm">Dados Abertos • API Oficial</p>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="p-4 bg-neutral-900/90 backdrop-blur-sm border border-amber-500/20 rounded-2xl shadow-lg">
            <div className="flex items-start gap-3">
              <Mic className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm text-foreground font-medium">
                  Transparência Legislativa
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Acompanhe senadores, votações, projetos de lei e a agenda do Senado em tempo real.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Funcionalidades */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="font-semibold text-base">Explorar</h2>
          
          {funcionalidades.map((func, index) => {
            const Icon = func.icon;
            const colors = getColorClasses(func.cor);
            
            return (
              <motion.div
                key={func.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
              >
                <div
                  className={`overflow-hidden cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all bg-neutral-800/70 backdrop-blur-sm border border-white/5 ${colors.border} rounded-xl`}
                  onClick={() => navigate(getPath(func.id))}
                >
                  <div className="flex items-center gap-4 h-16">
                    {/* Ícone */}
                    <div className={`w-16 h-16 flex-shrink-0 flex items-center justify-center ${colors.bg} rounded-l-xl`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {func.titulo}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {func.subtitulo}
                      </p>
                    </div>

                    {/* Seta */}
                    <div className="pr-4">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-muted-foreground text-center"
        >
          📊 Fonte: legis.senado.leg.br/dadosabertos
        </motion.p>
      </div>
    </div>
  );
};

export default SenadoHub;
