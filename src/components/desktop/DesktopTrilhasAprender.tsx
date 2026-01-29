import { useNavigate } from "react-router-dom";
import { Landmark, Footprints, Scale, Library, Sparkles, Target, Video, BookOpen, Brain, ChevronRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface TrilhaCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  delay?: number;
}

const TrilhaCard = ({ title, subtitle, description, icon, onClick, delay = 0 }: TrilhaCardProps) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    onClick={onClick}
    className="group relative w-64 h-80 rounded-2xl bg-gradient-to-br from-red-950/90 to-red-900/80 backdrop-blur-sm border border-amber-500/20 shadow-xl hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center gap-4 p-6"
  >
    {/* Glow effect */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    {/* Icon */}
    <div className="relative z-10 p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 group-hover:border-amber-400/50 transition-all">
      {icon}
    </div>
    
    {/* Text */}
    <div className="relative z-10 text-center">
      <h3 className="font-cinzel text-xl font-semibold text-amber-100 group-hover:text-amber-50 transition-colors">
        {title}
      </h3>
      <p className="text-base text-amber-200/80 mt-1 font-medium">{subtitle}</p>
      <p className="text-sm text-amber-200/60 mt-2 max-w-[180px]">{description}</p>
    </div>

    {/* Bottom accent */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
  </motion.button>
);

const ConnectorLine = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    initial={{ scaleX: 0, opacity: 0 }}
    animate={{ scaleX: 1, opacity: 1 }}
    transition={{ duration: 0.4, delay }}
    className="w-16 h-0.5 bg-gradient-to-r from-red-600/60 via-amber-500/60 to-red-600/60"
  />
);

// Recurso card menor
interface RecursoCardProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  delay?: number;
}

const RecursoCard = ({ title, icon, onClick, delay = 0 }: RecursoCardProps) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    onClick={onClick}
    className="group flex items-center gap-3 px-5 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all"
  >
    <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
      {icon}
    </div>
    <span className="text-white font-medium text-sm">{title}</span>
    <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white/80 ml-auto transition-colors" />
  </motion.button>
);

export const DesktopTrilhasAprender = () => {
  const navigate = useNavigate();

  const trilhas = [
    {
      title: "Conceitos",
      subtitle: "Bases do Direito",
      description: "Fundamentos essenciais para iniciar sua jornada jurídica",
      icon: <Landmark className="w-10 h-10 text-amber-400" />,
      onClick: () => navigate("/primeiros-passos"),
    },
    {
      title: "Dominando",
      subtitle: "Profundidade",
      description: "Aprofunde seu conhecimento em áreas específicas",
      icon: <Footprints className="w-10 h-10 text-amber-400" />,
      onClick: () => navigate("/dominando"),
    },
    {
      title: "Temática",
      subtitle: "Por Área",
      description: "Explore o Direito por ramos e especialidades",
      icon: <Scale className="w-10 h-10 text-amber-400" />,
      onClick: () => navigate("/biblioteca-tematica"),
    },
  ];

  const recursos = [
    { title: "Flashcards", icon: <Brain className="w-5 h-5 text-amber-300" />, onClick: () => navigate("/flashcards/areas") },
    { title: "Questões", icon: <Target className="w-5 h-5 text-amber-300" />, onClick: () => navigate("/questoes") },
    { title: "Videoaulas", icon: <Video className="w-5 h-5 text-amber-300" />, onClick: () => navigate("/tela") },
    { title: "Biblioteca", icon: <Library className="w-5 h-5 text-amber-300" />, onClick: () => navigate("/bibliotecas") },
  ];

  // Função para voltar ao Destaque
  const handleBack = () => {
    window.dispatchEvent(new CustomEvent('header-nav-tab-click', { detail: { tab: 'destaque' } }));
  };

  return (
    <div className="relative py-12 flex flex-col items-center justify-center min-h-[70vh]">
      {/* Botão Voltar */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleBack}
        className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-black/70 hover:text-white transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Voltar</span>
      </motion.button>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h2 className="font-cinzel text-4xl font-bold text-amber-100 mb-3">
          Jornada de Estudos
        </h2>
        <p className="text-amber-200/70 text-lg">Escolha sua trilha de aprendizado</p>
      </motion.div>

      {/* Horizontal Trail */}
      <div className="flex items-center justify-center gap-6 mb-12">
        {trilhas.map((trilha, index) => (
          <div key={trilha.title} className="flex items-center gap-6">
            <TrilhaCard
              title={trilha.title}
              subtitle={trilha.subtitle}
              description={trilha.description}
              icon={trilha.icon}
              onClick={trilha.onClick}
              delay={index * 0.15}
            />
            {index < trilhas.length - 1 && (
              <ConnectorLine delay={index * 0.15 + 0.2} />
            )}
          </div>
        ))}
      </div>

      {/* Recursos Complementares */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full max-w-3xl"
      >
        <h3 className="text-center text-white/80 text-sm font-medium mb-4 uppercase tracking-wide">
          Recursos Complementares
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {recursos.map((recurso, index) => (
            <RecursoCard
              key={recurso.title}
              title={recurso.title}
              icon={recurso.icon}
              onClick={recurso.onClick}
              delay={0.6 + index * 0.05}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
