import { useNavigate } from "react-router-dom";
import { Landmark, Scale, ChevronRight, Footprints } from "lucide-react";
import { motion } from "framer-motion";

interface TrilhaCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  delay?: number;
  color: string;
}

const TrilhaCard = ({ title, subtitle, icon, onClick, delay = 0 }: TrilhaCardProps) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    onClick={onClick}
    whileTap={{ scale: 0.98 }}
    className="w-full h-[100px] bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-2xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-2xl shadow-xl border border-red-800/30 flex items-center gap-3"
  >
    <div className="bg-white/15 rounded-xl p-2.5">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="font-cinzel text-sm font-bold text-white">{title}</h3>
      <p className="text-xs text-white/70 mt-1">{subtitle}</p>
    </div>
    <ChevronRight className="w-5 h-5 text-white/50" />
  </motion.button>
);

export const MobileTrilhasAprender = () => {
  const navigate = useNavigate();

  const trilhas = [
    {
      title: "Conceitos",
      subtitle: "Bases do Direito",
      icon: <Landmark className="w-6 h-6 text-amber-400" />,
      onClick: () => navigate("/primeiros-passos"),
      position: 'left' as const,
      color: "#f59e0b",
    },
    {
      title: "Temática",
      subtitle: "Por Área",
      icon: <Scale className="w-6 h-6 text-amber-400" />,
      onClick: () => navigate("/biblioteca-tematica"),
      position: 'right' as const,
      color: "#8b5cf6",
    },
  ];

  return (
    <div className="relative py-4 flex flex-col items-center">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-5"
      >
        <h2 className="font-cinzel text-xl font-bold text-amber-100 mb-1">
          Jornada de Estudos
        </h2>
        <p className="text-amber-200/70 text-xs">Escolha sua trilha de aprendizado</p>
      </motion.div>

      {/* Cards das Trilhas - Layout Timeline igual OAB */}
      <div className="w-full px-2 relative">
        {/* Linha central da timeline - mesma espessura e estilo da OAB */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
          <div className="w-full h-full bg-gradient-to-b from-amber-500/80 via-amber-600/60 to-amber-700/40 rounded-full" />
          {/* Animação de fluxo elétrico igual OAB */}
          <motion.div
            className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-amber-300/30 to-transparent rounded-full"
            animate={{ y: ["0%", "300%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="space-y-6 relative z-10">
          {trilhas.map((trilha, index) => {
            const isLeft = trilha.position === 'left';
            
            return (
              <motion.div
                key={trilha.title}
                initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className={`relative flex items-center ${
                  isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                }`}
              >
                {/* Marcador Pegadas no centro - Animação igual OAB */}
                <div className="absolute left-1/2 -translate-x-1/2 z-10">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.15, 1],
                      boxShadow: [
                        `0 0 0 0 ${trilha.color}66`,
                        `0 0 0 10px ${trilha.color}00`,
                        `0 0 0 0 ${trilha.color}66`
                      ]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      delay: index * 0.3
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                    style={{ 
                      background: `linear-gradient(to bottom right, ${trilha.color}, ${trilha.color}dd)`,
                      boxShadow: `0 4px 20px ${trilha.color}40`
                    }}
                  >
                    <Footprints className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
                
                {/* Card */}
                <div className="w-full">
                  <TrilhaCard
                    title={trilha.title}
                    subtitle={trilha.subtitle}
                    icon={trilha.icon}
                    onClick={trilha.onClick}
                    delay={index * 0.15}
                    color={trilha.color}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
