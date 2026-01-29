import { useNavigate } from "react-router-dom";
import { Scale, ScrollText, Briefcase, FileQuestion, ChevronRight, Target, Library, Video, BookOpen, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface PhaseCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  onClick: () => void;
  delay?: number;
  isPrimary?: boolean;
}

const PhaseCard = ({ title, subtitle, description, icon, features, onClick, delay = 0, isPrimary = false }: PhaseCardProps) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    onClick={onClick}
    className={`group relative flex-1 rounded-3xl bg-gradient-to-br from-red-950/90 to-red-900/80 backdrop-blur-sm border shadow-xl hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02] flex flex-col p-8 ${
      isPrimary ? 'border-amber-500/40' : 'border-amber-500/20'
    }`}
  >
    {/* Glow effect */}
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    {/* Header */}
    <div className="relative z-10 flex items-start gap-4 mb-6">
      <div className={`p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 group-hover:border-amber-400/50 transition-all ${isPrimary ? 'ring-2 ring-amber-400/30' : ''}`}>
        {icon}
      </div>
      <div className="text-left">
        <h3 className="font-cinzel text-2xl font-bold text-amber-100 group-hover:text-amber-50 transition-colors">
          {title}
        </h3>
        <p className="text-lg text-amber-200/80 mt-1">{subtitle}</p>
      </div>
    </div>

    {/* Description */}
    <p className="relative z-10 text-amber-200/70 text-sm text-left mb-6">
      {description}
    </p>

    {/* Features */}
    <ul className="relative z-10 space-y-2 mb-6 flex-1">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2 text-left text-sm text-amber-100/80">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {feature}
        </li>
      ))}
    </ul>

    {/* CTA */}
    <div className="relative z-10 flex items-center justify-between mt-auto pt-4 border-t border-amber-500/20">
      <span className="text-amber-300 font-semibold text-sm">Estudar Agora</span>
      <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
    </div>
  </motion.button>
);

// Recurso OAB card
interface RecursoOABCardProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  delay?: number;
}

const RecursoOABCard = ({ title, icon, onClick, delay = 0 }: RecursoOABCardProps) => (
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

export const DesktopTrilhasOAB = () => {
  const navigate = useNavigate();

  const recursos = [
    { title: "Carreira de Advogado", icon: <Briefcase className="w-5 h-5 text-amber-300" />, onClick: () => navigate("/advogado") },
    { title: "Simulados", icon: <FileQuestion className="w-5 h-5 text-amber-300" />, onClick: () => navigate("/ferramentas/simulados") },
    { title: "Questões OAB", icon: <Target className="w-5 h-5 text-amber-300" />, onClick: () => navigate("/ferramentas/questoes") },
    { title: "Biblioteca OAB", icon: <Library className="w-5 h-5 text-amber-300" />, onClick: () => navigate("/biblioteca-oab") },
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
          Exame de Ordem
        </h2>
        <p className="text-amber-200/70 text-lg">Sua jornada para a aprovação na OAB</p>
      </motion.div>

      {/* Two Phase Cards */}
      <div className="flex gap-8 w-full max-w-5xl mb-12">
        <PhaseCard
          title="1ª Fase"
          subtitle="Prova Objetiva"
          description="80 questões de múltipla escolha sobre todas as áreas do Direito. Domine cada tema com conteúdo atualizado."
          icon={<ScrollText className="w-10 h-10 text-amber-400" />}
          features={[
            "80 questões objetivas",
            "17 disciplinas do Direito",
            "4 horas de prova",
            "Mínimo 50% de acerto",
          ]}
          onClick={() => navigate("/oab-trilhas")}
          delay={0.1}
          isPrimary={true}
        />
        
        <PhaseCard
          title="2ª Fase"
          subtitle="Prova Prático-Profissional"
          description="Peça processual e questões discursivas na área escolhida. Prepare-se com modelos e técnicas avançadas."
          icon={<Scale className="w-10 h-10 text-amber-400" />}
          features={[
            "Peça profissional",
            "4 questões discursivas",
            "5 horas de prova",
            "Escolha sua área",
          ]}
          onClick={() => navigate("/oab/segunda-fase")}
          delay={0.2}
        />
      </div>

      {/* Recursos OAB */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full max-w-4xl"
      >
        <h3 className="text-center text-white/80 text-sm font-medium mb-4 uppercase tracking-wide">
          Recursos para OAB
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {recursos.map((recurso, index) => (
            <RecursoOABCard
              key={recurso.title}
              title={recurso.title}
              icon={recurso.icon}
              onClick={recurso.onClick}
              delay={0.5 + index * 0.05}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
