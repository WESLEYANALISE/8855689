import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, Scroll, Brain, Calendar, Play, FileText, GraduationCap, Map } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const estudosItems = [
  {
    id: "jornada",
    title: "Jornada Jurídica",
    description: "Domine o Direito em 365 dias com trilhas personalizadas",
    icon: Map,
    route: "/jornada-juridica",
    adminOnly: true
  },
  {
    id: "cursos",
    title: "Cursos",
    description: "Aprenda do básico ao avançado",
    icon: GraduationCap,
    route: "/iniciando-direito/todos"
  },
  {
    id: "resumos",
    title: "Resumos",
    description: "Principais matérias do Direito resumidas",
    icon: Scroll,
    route: "/resumos-juridicos"
  },
  {
    id: "flashcards",
    title: "Flashcards",
    description: "Fixe conceitos jurídicos com cartões de memorização",
    icon: Sparkles,
    route: "/flashcards"
  },
  {
    id: "mapa-mental",
    title: "Mapa Mental",
    description: "Conecte institutos jurídicos visualmente",
    icon: Brain,
    route: "/mapa-mental"
  },
  {
    id: "videoaulas",
    title: "Videoaulas",
    description: "Aulas de matérias jurídicas em vídeo",
    icon: Play,
    route: "/videoaulas"
  },
  {
    id: "plano-estudos",
    title: "Plano de Estudos",
    description: "Organize sua preparação de forma eficiente",
    icon: Calendar,
    route: "/plano-estudos"
  },
  {
    id: "tcc",
    title: "Pesquisa de TCCs",
    description: "Busque dissertações e teses acadêmicas",
    icon: FileText,
    route: "/ferramentas/tcc"
  },
  {
    id: "dicionario",
    title: "Dicionário Jurídico",
    description: "Consulte termos e conceitos jurídicos",
    icon: BookOpen,
    route: "/dicionario"
  }
];

export const EstudosTimeline = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === 'wn7corporation@gmail.com';
  
  // Filtra itens e alterna lado dinamicamente
  const visibleItems = estudosItems
    .filter(item => !item.adminOnly || isAdmin)
    .map((item, index) => ({
      ...item,
      lado: index % 2 === 0 ? 'left' : 'right'
    }));

  return (
    <div className="relative py-8 md:py-16 px-2">
      {/* Linha vertical central */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
        <motion.div
          className="h-full bg-gradient-to-b from-red-500 via-red-600 to-red-700 rounded-full"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ transformOrigin: "top" }}
        />
        
        {/* Luz animada percorrendo a linha */}
        <motion.div
          className="absolute w-3 h-3 md:w-4 md:h-4 -left-1 md:-left-1.5 rounded-full bg-white shadow-lg shadow-white/50"
          animate={{
            top: ["0%", "100%"],
            opacity: [1, 0.5, 1]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Cards dos estudos */}
      <div className="space-y-6 md:space-y-12">
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          const isLeft = item.lado === 'left';
          
          return (
            <motion.div
              key={item.id}
              className="relative flex items-start"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              {/* Layout Mobile: Alternando esquerda/direita */}
              <div className="flex items-center md:hidden w-full">
                {/* Card esquerdo */}
                <div className="flex-1 pr-3 min-h-[180px]">
                  {isLeft && (
                    <motion.div
                      onClick={() => navigate(item.route)}
                      className="cursor-pointer p-4 rounded-xl bg-neutral-800/70 backdrop-blur-md shadow-xl active:scale-[0.98] transition-all duration-200 border border-white/5 hover:border-red-500/20 h-[180px] flex flex-col items-center justify-between overflow-hidden"
                      style={{
                        boxShadow: '8px 8px 24px rgba(0,0,0,0.25), -2px -2px 12px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)'
                      }}
                    >
                      <div className="p-2.5 rounded-xl bg-red-900/20 shrink-0">
                        <Icon className="w-6 h-6 text-red-400" />
                      </div>
                      
                      <div className="text-center flex-1 flex flex-col justify-center py-2 overflow-hidden">
                        <h3 className="text-base font-bold text-foreground mb-1.5">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      </div>
                      
                      <span className="text-red-400 text-xs shrink-0">
                        Explorar →
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Ponto na timeline */}
                <motion.div
                  className="relative z-10 w-11 h-11 rounded-full shrink-0 bg-red-900/40 flex items-center justify-center shadow-lg border-2 border-neutral-950"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.08 + 0.15 }}
                >
                  <Icon className="w-5 h-5 text-red-400" />
                </motion.div>

                {/* Card direito */}
                <div className="flex-1 pl-3 min-h-[180px]">
                  {!isLeft && (
                    <motion.div
                      onClick={() => navigate(item.route)}
                      className="cursor-pointer p-4 rounded-xl bg-neutral-800/70 backdrop-blur-md shadow-xl active:scale-[0.98] transition-all duration-200 border border-white/5 hover:border-red-500/20 h-[180px] flex flex-col items-center justify-between overflow-hidden"
                      style={{
                        boxShadow: '8px 8px 24px rgba(0,0,0,0.25), -2px -2px 12px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)'
                      }}
                    >
                      <div className="p-2.5 rounded-xl bg-red-900/20 shrink-0">
                        <Icon className="w-6 h-6 text-red-400" />
                      </div>
                      
                      <div className="text-center flex-1 flex flex-col justify-center py-2 overflow-hidden">
                        <h3 className="text-base font-bold text-foreground mb-1.5">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      </div>
                      
                      <span className="text-red-400 text-xs shrink-0">
                        ← Explorar
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Layout Desktop: Alternando esquerda/direita */}
              <div className="hidden md:flex items-center w-full">
                {/* Espaço esquerdo ou card esquerdo */}
                <div className={`flex-1 ${isLeft ? 'pr-8' : ''}`}>
                  {isLeft && (
                    <motion.div
                      onClick={() => navigate(item.route)}
                      className="cursor-pointer p-5 rounded-2xl ml-auto max-w-sm bg-neutral-800/70 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/5 hover:border-red-500/20 group"
                      style={{
                        boxShadow: '8px 8px 24px rgba(0,0,0,0.25), -2px -2px 12px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)'
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: '0 0 40px rgba(239, 68, 68, 0.15)'
                      }}
                    >
                      <div className="flex items-center gap-4 flex-row-reverse">
                        <motion.div
                          className="p-3 rounded-xl bg-red-900/20"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Icon className="w-6 h-6 text-red-400" />
                        </motion.div>
                        
                        <div className="text-right">
                          <h3 className="text-lg font-bold text-foreground mb-1">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <span className="text-red-400 text-sm group-hover:underline">
                          Explorar →
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Ponto central */}
                <motion.div
                  className="relative z-10 w-14 h-14 rounded-full shrink-0 bg-red-900/40 flex items-center justify-center shadow-lg border-4 border-neutral-950"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.08 + 0.15 }}
                  whileHover={{ scale: 1.2 }}
                >
                  <Icon className="w-6 h-6 text-red-400" />
                </motion.div>

                {/* Espaço direito ou card direito */}
                <div className={`flex-1 ${!isLeft ? 'pl-8' : ''}`}>
                  {!isLeft && (
                    <motion.div
                      onClick={() => navigate(item.route)}
                      className="cursor-pointer p-5 rounded-2xl mr-auto max-w-sm bg-neutral-800/70 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/5 hover:border-red-500/20 group"
                      style={{
                        boxShadow: '8px 8px 24px rgba(0,0,0,0.25), -2px -2px 12px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)'
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: '0 0 40px rgba(239, 68, 68, 0.15)'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="p-3 rounded-xl bg-red-900/20"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Icon className="w-6 h-6 text-red-400" />
                        </motion.div>
                        
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-foreground mb-1">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <span className="text-red-400 text-sm group-hover:underline">
                          Explorar →
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
