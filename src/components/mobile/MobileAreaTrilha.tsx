import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Footprints, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface MobileAreaTrilhaProps {
  area: string;
}

export const MobileAreaTrilha = ({ area }: MobileAreaTrilhaProps) => {
  const navigate = useNavigate();

  const { data: livros, isLoading } = useQuery({
    queryKey: ["area-trilha-livros", area],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("*")
        .eq("Área", area)
        .order("Ordem", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!livros || livros.length === 0) {
    return (
      <div className="text-center py-10 text-white/50 text-sm">
        Nenhum tema encontrado para esta área.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Info Stats */}
      <div className="flex items-center justify-center gap-4 text-xs text-white/80 mb-6">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-red-400" />
          <span>{livros.length} temas</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="w-full px-4">
        <div className="max-w-lg mx-auto relative">
          {/* Linha central */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
            <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
            <motion.div
              className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
              animate={{ y: ["0%", "300%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="space-y-6">
            {livros.map((livro, index) => {
              const isLeft = index % 2 === 0;
              const capaUrl = livro["Capa-livro"];
              const titulo = livro["Tema"] || "Sem título";

              return (
                <motion.div
                  key={livro.id}
                  initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className={`relative flex items-center ${
                    isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                  }`}
                >
                  {/* Marcador central */}
                  <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <motion.div
                      animate={{
                        scale: [1, 1.15, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(239, 68, 68, 0.4)",
                          "0 0 0 10px rgba(239, 68, 68, 0)",
                          "0 0 0 0 rgba(239, 68, 68, 0)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/40"
                    >
                      <Footprints className="w-5 h-5 text-white" />
                    </motion.div>
                  </div>

                  {/* Card */}
                  <div className="w-full">
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border border-white/10 hover:border-red-500/50 transition-all overflow-hidden min-h-[180px] flex flex-col"
                    >
                      {/* Capa */}
                      <div className="h-16 w-full overflow-hidden relative flex-shrink-0">
                        {capaUrl ? (
                          <>
                            <img src={capaUrl} alt={titulo} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-800 to-red-900" />
                        )}
                        <div className="absolute bottom-1 left-2">
                          <p className="text-[10px] text-red-400 font-semibold drop-shadow-lg">
                            Tema {livro["Ordem"] || index + 1}
                          </p>
                        </div>
                      </div>

                      {/* Conteúdo clicável */}
                      <button
                        onClick={() => navigate(`/biblioteca/estudos/${livro.id}`)}
                        className="flex-1 p-2.5 text-left flex flex-col"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-xs leading-snug text-white line-clamp-2">
                            {titulo}
                          </h3>
                          <div className="flex items-center gap-1 mt-1.5">
                            <BookOpen className="w-3 h-3 text-yellow-400" />
                            <span className="text-[10px] text-yellow-400 font-medium">
                              Livro {livro["Ordem"] || index + 1}
                            </span>
                          </div>
                        </div>

                        {/* Barra de progresso */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] text-gray-500">Progresso</span>
                            <span className="text-[9px] text-green-400 font-medium">0%</span>
                          </div>
                          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: '0%' }} />
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
