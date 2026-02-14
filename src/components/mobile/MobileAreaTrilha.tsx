import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Check, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface MobileAreaTrilhaProps {
  area: string;
}

// Serpentine X offsets pattern (percentage of container width)
const SERPENTINE_PATTERN = [50, 75, 50, 25, 50, 75, 50, 25];

const getNodeX = (index: number) => SERPENTINE_PATTERN[index % SERPENTINE_PATTERN.length];

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

  const NODE_SIZE = 76;
  const VERTICAL_SPACING = 120;
  const CONTAINER_WIDTH = 300;

  const nodes = useMemo(() => {
    if (!livros) return [];
    return livros.map((livro, index) => ({
      x: (getNodeX(index) / 100) * CONTAINER_WIDTH,
      y: index * VERTICAL_SPACING + NODE_SIZE / 2 + 20,
      livro,
      index,
    }));
  }, [livros]);

  const svgPath = useMemo(() => {
    if (nodes.length < 2) return "";
    let d = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1];
      const curr = nodes[i];
      const cpY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [nodes]);

  const totalHeight = nodes.length * VERTICAL_SPACING + 60;

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
      {/* Info */}
      <div className="flex items-center justify-center gap-4 text-xs text-white/80 mb-4">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-red-400" />
          <span>{livros.length} temas</span>
        </div>
      </div>

      {/* Serpentine Path */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: CONTAINER_WIDTH, height: totalHeight }}>
          {/* SVG connector line */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${CONTAINER_WIDTH} ${totalHeight}`}
            fill="none"
          >
            <motion.path
              d={svgPath}
              stroke="rgba(239, 68, 68, 0.3)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="10 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>

          {/* Nodes */}
          {nodes.map(({ x, y, livro, index }) => {
            const capaUrl = livro["Capa-livro"];
            const titulo = livro["Tema"] || "Sem título";
            const ordem = livro["Ordem"] || index + 1;
            // TODO: integrate real progress
            const isCompleted = false;
            const isLocked = false;
            const isCurrent = index === 0;

            return (
              <motion.div
                key={livro.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.07, type: "spring", stiffness: 200 }}
                className="absolute flex flex-col items-center"
                style={{
                  left: x - NODE_SIZE / 2,
                  top: y - NODE_SIZE / 2,
                  width: NODE_SIZE,
                }}
              >
                {/* Circle button */}
                <button
                  onClick={() => !isLocked && navigate(`/biblioteca/estudos/${livro.id}`)}
                  disabled={isLocked}
                  className="relative group"
                >
                  {/* Pulse ring for current */}
                  {isCurrent && (
                    <motion.div
                      className="absolute -inset-2 rounded-full border-2 border-red-500/50"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* Main circle */}
                  <div
                    className={`w-[72px] h-[72px] rounded-full overflow-hidden flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                      isLocked
                        ? "bg-gray-700/80 border-2 border-gray-600"
                        : isCompleted
                        ? "border-[3px] border-green-500 shadow-green-500/30"
                        : isCurrent
                        ? "border-[3px] border-red-500 shadow-red-500/40"
                        : "border-2 border-white/20"
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="w-6 h-6 text-gray-500" />
                    ) : capaUrl ? (
                      <img src={capaUrl} alt={titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{ordem}</span>
                      </div>
                    )}
                  </div>

                  {/* Completion badge */}
                  {isCompleted && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-[#0a0a12]">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  {/* Order badge */}
                  {!isCompleted && !isLocked && (
                    <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center border-2 border-[#0a0a12] text-[10px] font-bold text-white">
                      {ordem}
                    </div>
                  )}
                </button>

                {/* Title below */}
                <p className="mt-2 text-[11px] text-white/80 text-center leading-tight line-clamp-2 w-24">
                  {titulo}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
