import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Book, Scale, Mic, Users, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstantCache } from "@/hooks/useInstantCache";

interface CapaBiblioteca {
  Biblioteca: string | null;
  capa: string | null;
}

const bibliotecasItems = [
  {
    id: "estudos",
    title: "Estudos",
    description: "Materiais de estudo organizados por área do Direito",
    icon: GraduationCap,
    color: "#10b981",
    route: "/biblioteca-estudos",
    bibliotecaName: "Biblioteca de Estudos",
    key: "estudos",
    lado: 'left' as const
  },
  {
    id: "classicos",
    title: "Clássicos",
    description: "Clássicos da literatura jurídica para enriquecer seus conhecimentos",
    icon: Book,
    color: "#f59e0b",
    route: "/biblioteca-classicos",
    bibliotecaName: "Biblioteca Clássicos",
    key: "classicos",
    lado: 'right' as const
  },
  {
    id: "oab",
    title: "OAB",
    description: "Acesse a biblioteca oficial da OAB com materiais jurídicos essenciais",
    icon: Scale,
    color: "#3b82f6",
    route: "/biblioteca-oab",
    bibliotecaName: "Biblioteca da OAB",
    key: "oab",
    lado: 'left' as const
  },
  {
    id: "oratoria",
    title: "Oratória",
    description: "Domine a arte da comunicação e persuasão jurídica",
    icon: Mic,
    color: "#a855f7",
    route: "/biblioteca-oratoria",
    bibliotecaName: "Biblioteca de Oratória",
    key: "oratoria",
    lado: 'right' as const
  },
  {
    id: "lideranca",
    title: "Liderança",
    description: "Desenvolva habilidades de liderança e gestão para sua carreira",
    icon: Users,
    color: "#6366f1",
    route: "/biblioteca-lideranca",
    bibliotecaName: "Biblioteca de Liderança",
    key: "lideranca",
    lado: 'left' as const
  },
  {
    id: "fora",
    title: "Fora da Toga",
    description: "Leituras complementares para ampliar sua visão jurídica",
    icon: Briefcase,
    color: "#ec4899",
    route: "/biblioteca-fora-da-toga",
    bibliotecaName: "Biblioteca Fora da Toga",
    key: "fora",
    lado: 'right' as const
  }
];

export const BibliotecasTimeline = () => {
  const navigate = useNavigate();

  const { data: capas } = useInstantCache<CapaBiblioteca[]>({
    cacheKey: "capas-biblioteca",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*");
      if (error) throw error;
      return data as CapaBiblioteca[];
    },
    preloadImages: true,
    imageExtractor: (data) => data.map(c => c.capa).filter(Boolean) as string[],
  });

  const { data: contagens } = useQuery({
    queryKey: ["contagens-bibliotecas"],
    queryFn: async () => {
      const [estudos, classicos, oab, oratoria, lideranca, fora] = await Promise.all([
        supabase.from("BIBLIOTECA-ESTUDOS" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-CLASSICOS" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBILIOTECA-OAB" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-ORATORIA" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-LIDERANÇA" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-FORA-DA-TOGA" as any).select("*", { count: "exact", head: true }),
      ]);
      return {
        estudos: estudos.count || 0,
        classicos: classicos.count || 0,
        oab: oab.count || 0,
        oratoria: oratoria.count || 0,
        lideranca: lideranca.count || 0,
        fora: fora.count || 0,
      };
    },
  });

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

  const getCapaUrl = (bibliotecaName: string) => {
    const target = normalize(bibliotecaName);
    const match = capas?.find((c) => c.Biblioteca && normalize(c.Biblioteca) === target) 
      || capas?.find((c) => c.Biblioteca && normalize(c.Biblioteca).includes(target)) 
      || capas?.find((c) => c.Biblioteca && target.includes(normalize(c.Biblioteca)));
    return match?.capa || null;
  };

  return (
    <div className="relative py-4 md:py-16 px-1">
      {/* Linha vertical central */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 md:w-1 -translate-x-1/2">
        <motion.div
          className="h-full bg-gradient-to-b from-emerald-500 via-purple-500 to-pink-500 rounded-full"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ transformOrigin: "top" }}
        />
      </div>

      {/* Cards das bibliotecas */}
      <div className="space-y-4 md:space-y-8">
        {bibliotecasItems.map((item, index) => {
          const Icon = item.icon;
          const isLeft = item.lado === 'left';
          const capaUrl = getCapaUrl(item.bibliotecaName);
          const count = contagens?.[item.key as keyof typeof contagens] || 0;
          
          return (
            <motion.div
              key={item.id}
              className="relative flex items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              {/* Layout Mobile */}
              <div className="flex items-center md:hidden w-full">
                {/* Card esquerdo (título) */}
                <div className="flex-1">
                  {isLeft ? (
                    <motion.div
                      onClick={() => navigate(item.route)}
                      className="cursor-pointer p-2.5 rounded-l-xl bg-neutral-800/80 backdrop-blur-md shadow-lg active:scale-[0.98] transition-all duration-200 border border-white/5 border-r-0 h-[100px] flex items-center"
                      style={{
                        boxShadow: `4px 4px 12px rgba(0,0,0,0.2), 0 0 12px ${item.color}15`,
                        borderColor: `${item.color}25`
                      }}
                    >
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-foreground">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-[10px] leading-snug line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                        <span 
                          className="text-[10px] font-semibold mt-1 inline-block"
                          style={{ color: item.color }}
                        >
                          {count} livros
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-[100px]" />
                  )}
                </div>

                {/* Capa centralizada na timeline */}
                <motion.div
                  onClick={() => navigate(item.route)}
                  className="relative z-10 w-[72px] h-[100px] overflow-hidden shrink-0 shadow-lg cursor-pointer"
                  style={{ 
                    boxShadow: `0 0 15px ${item.color}40`
                  }}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.08 + 0.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {capaUrl ? (
                    <img src={capaUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${item.color}30` }}>
                      <Icon className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                  )}
                </motion.div>

                {/* Card direito (título) */}
                <div className="flex-1">
                  {!isLeft ? (
                    <motion.div
                      onClick={() => navigate(item.route)}
                      className="cursor-pointer p-2.5 rounded-r-xl bg-neutral-800/80 backdrop-blur-md shadow-lg active:scale-[0.98] transition-all duration-200 border border-white/5 border-l-0 h-[100px] flex items-center"
                      style={{
                        boxShadow: `4px 4px 12px rgba(0,0,0,0.2), 0 0 12px ${item.color}15`,
                        borderColor: `${item.color}25`
                      }}
                    >
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-foreground">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-[10px] leading-snug line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                        <span 
                          className="text-[10px] font-semibold mt-1 inline-block"
                          style={{ color: item.color }}
                        >
                          {count} livros
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-[100px]" />
                  )}
                </div>
              </div>

              {/* Layout Desktop */}
              <div className="hidden md:flex items-center w-full">
                {/* Card esquerdo (título) */}
                <div className="flex-1">
                  {isLeft ? (
                    <motion.div
                      onClick={() => navigate(item.route)}
                      className="cursor-pointer p-5 rounded-l-2xl ml-auto max-w-xs bg-neutral-800/70 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/5 border-r-0 group h-[160px] flex items-center"
                      style={{ borderColor: `${item.color}30` }}
                      whileHover={{ scale: 1.02, boxShadow: `0 0 40px ${item.color}30` }}
                    >
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{item.description}</p>
                        <span className="text-sm font-bold mt-3 inline-block" style={{ color: item.color }}>
                          {count} {count === 1 ? "livro" : "livros"}
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-[160px]" />
                  )}
                </div>

                {/* Capa centralizada na timeline */}
                <motion.div
                  onClick={() => navigate(item.route)}
                  className="relative z-10 w-[115px] h-[160px] overflow-hidden shrink-0 shadow-xl cursor-pointer"
                  style={{ 
                    boxShadow: `0 0 25px ${item.color}50`
                  }}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {capaUrl ? (
                    <img src={capaUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${item.color}30` }}>
                      <Icon className="w-8 h-8" style={{ color: item.color }} />
                    </div>
                  )}
                </motion.div>

                {/* Card direito (título) */}
                <div className="flex-1">
                  {!isLeft ? (
                    <motion.div
                      onClick={() => navigate(item.route)}
                      className="cursor-pointer p-5 rounded-r-2xl mr-auto max-w-xs bg-neutral-800/70 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/5 border-l-0 group h-[160px] flex items-center"
                      style={{ borderColor: `${item.color}30` }}
                      whileHover={{ scale: 1.02, boxShadow: `0 0 40px ${item.color}30` }}
                    >
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{item.description}</p>
                        <span className="text-sm font-bold mt-3 inline-block" style={{ color: item.color }}>
                          {count} {count === 1 ? "livro" : "livros"}
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-[160px]" />
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
