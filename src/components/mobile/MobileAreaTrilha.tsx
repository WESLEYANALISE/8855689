import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Check, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface MobileAreaTrilhaProps {
  area: string;
}

// Serpentine X positions: alternates left-center-right creating a zigzag
const SERPENTINE_X = [50, 78, 50, 22, 50, 78, 50, 22];
const getNodeX = (index: number) => SERPENTINE_X[index % SERPENTINE_X.length];

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

  const NODE_SIZE = 110;
  const VERTICAL_SPACING = 160;
  const CONTAINER_WIDTH = 340;

  const nodes = useMemo(() => {
    if (!livros) return [];
    return livros.map((livro, index) => ({
      x: (getNodeX(index) / 100) * CONTAINER_WIDTH,
      y: index * VERTICAL_SPACING + NODE_SIZE / 2 + 30,
      livro,
      index,
    }));
  }, [livros]);

  // Build SVG path with straight diagonal lines between nodes
  const svgPath = useMemo(() => {
    if (nodes.length < 2) return "";
    let d = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) {
      d += ` L ${nodes[i].x} ${nodes[i].y}`;
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
      <div className="flex items-center justify-center gap-4 text-xs text-white/80 mb-6">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-red-400" />
          <span>{livros.length} temas</span>
        </div>
      </div>

      {/* Serpentine Path */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: CONTAINER_WIDTH, height: totalHeight }}>
          {/* SVG diagonal connector lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${CONTAINER_WIDTH} ${totalHeight}`}
            fill="none"
          >
            <motion.path
              d={svgPath}
              stroke="rgba(239, 68, 68, 0.4)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            {/* Glow line on top */}
            <motion.path
              d={svgPath}
              stroke="rgba(239, 68, 68, 0.15)"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
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
            const isCompleted = false;
            const isLocked = false;
            const isCurrent = index === 0;

            return (
              <motion.div
                key={livro.id}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 180, damping: 15 }}
                className="absolute flex flex-col items-center"
                style={{
                  left: x - NODE_SIZE / 2,
                  top: y - NODE_SIZE / 2,
                  width: NODE_SIZE,
                }}
              >
                {/* Circle button */}
                <button
                  onClick={() => !isLocked && navigate(`/aulas/area/${encodeURIComponent(area)}/materia/${livro.id}`)}
                  disabled={isLocked}
                  className="relative group"
                >
                  {/* Pulse ring for current */}
                  {isCurrent && (
                    <motion.div
                      className="absolute -inset-2.5 rounded-full border-2 border-red-500/60"
                      animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* Main circle */}
                  <div
                    className={`w-[100px] h-[100px] rounded-full overflow-hidden flex items-center justify-center shadow-xl transition-transform active:scale-95 ${
                      isLocked
                        ? "bg-gray-700/80 border-2 border-gray-600"
                        : isCompleted
                        ? "border-[3px] border-green-500 shadow-green-500/30"
                        : isCurrent
                        ? "border-[3px] border-red-500 shadow-red-500/50"
                        : "border-2 border-white/20"
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="w-7 h-7 text-gray-500" />
                    ) : capaUrl ? (
                      <img src={capaUrl} alt={titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">{ordem}</span>
                      </div>
                    )}
                  </div>

                  {/* Completion badge */}
                  {isCompleted && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center border-2 border-[#0a0a12]">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Order badge */}
                  {!isCompleted && !isLocked && (
                    <div className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center border-2 border-[#0a0a12] text-xs font-bold text-white shadow-lg">
                      {ordem}
                    </div>
                  )}
                </button>

                {/* Title below */}
                <p className="mt-2.5 text-xs text-white/80 text-center leading-tight line-clamp-2 w-28 font-medium">
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
