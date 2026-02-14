import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Check, Lock, Loader2, Sparkles } from "lucide-react";
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

  // Fetch matérias from categorias_materias
  const { data: materias, isLoading } = useQuery({
    queryKey: ["area-trilha-materias", area],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_materias")
        .select("*")
        .eq("categoria", area)
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch tópicos for all matérias to show status
  const { data: topicos } = useQuery({
    queryKey: ["area-trilha-topicos-status", area],
    queryFn: async () => {
      if (!materias || materias.length === 0) return [];
      const ids = materias.map((m) => m.id);
      const { data, error } = await supabase
        .from("categorias_topicos")
        .select("id, materia_id, status")
        .in("materia_id", ids);
      if (error) throw error;
      return data || [];
    },
    enabled: !!materias && materias.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const NODE_SIZE = 110;
  const VERTICAL_SPACING = 160;
  const CONTAINER_WIDTH = 340;

  const nodes = useMemo(() => {
    if (!materias) return [];
    return materias.map((materia, index) => ({
      x: (getNodeX(index) / 100) * CONTAINER_WIDTH,
      y: index * VERTICAL_SPACING + NODE_SIZE / 2 + 30,
      materia,
      index,
    }));
  }, [materias]);

  const svgPath = useMemo(() => {
    if (nodes.length < 2) return "";
    let d = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) {
      d += ` L ${nodes[i].x} ${nodes[i].y}`;
    }
    return d;
  }, [nodes]);

  const totalHeight = nodes.length * VERTICAL_SPACING + 60;

  // Helper to get materia progress
  const getMateriaProgress = (materiaId: number) => {
    const materiaTopicos = topicos?.filter((t) => t.materia_id === materiaId) || [];
    const total = materiaTopicos.length;
    const concluidos = materiaTopicos.filter((t) => t.status === "concluido").length;
    const gerando = materiaTopicos.some((t) => t.status === "gerando" || t.status === "na_fila");
    return { total, concluidos, percent: total > 0 ? Math.round((concluidos / total) * 100) : 0, gerando };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!materias || materias.length === 0) {
    return (
      <div className="text-center py-10 text-white/50 text-sm">
        Nenhuma matéria encontrada para esta área.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Info */}
      <div className="flex items-center justify-center gap-4 text-xs text-white/80 mb-6">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-red-400" />
          <span>{materias.length} matérias</span>
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
          {nodes.map(({ x, y, materia, index }) => {
            const capaUrl = materia.capa_url;
            const titulo = materia.nome || "Sem título";
            const ordem = materia.ordem || index + 1;
            const progress = getMateriaProgress(materia.id);
            const isCompleted = progress.percent === 100 && progress.total > 0;
            const isGenerating = progress.gerando;
            const isCurrent = index === 0 && !isCompleted;

            return (
              <motion.div
                key={materia.id}
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
                  onClick={() => navigate(`/categorias/materia/${materia.id}`)}
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

                  {/* Generating pulse */}
                  {isGenerating && (
                    <motion.div
                      className="absolute -inset-2.5 rounded-full border-2 border-yellow-500/60"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}

                  {/* Main circle */}
                  <div
                    className={`w-[100px] h-[100px] rounded-full overflow-hidden flex items-center justify-center shadow-xl transition-transform active:scale-95 ${
                      isCompleted
                        ? "border-[3px] border-green-500 shadow-green-500/30"
                        : isGenerating
                        ? "border-[3px] border-yellow-500 shadow-yellow-500/30"
                        : isCurrent
                        ? "border-[3px] border-red-500 shadow-red-500/50"
                        : "border-2 border-white/20"
                    }`}
                  >
                    {capaUrl ? (
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

                  {/* Generating badge */}
                  {isGenerating && !isCompleted && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center border-2 border-[#0a0a12]">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Order badge */}
                  {!isCompleted && !isGenerating && (
                    <div className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center border-2 border-[#0a0a12] text-xs font-bold text-white shadow-lg">
                      {ordem}
                    </div>
                  )}
                </button>

                {/* Title + progress below */}
                <p className="mt-2.5 text-xs text-white/80 text-center leading-tight line-clamp-2 w-28 font-medium">
                  {titulo}
                </p>
                {progress.total > 0 && (
                  <div className="w-20 mt-1">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-white/40 text-center mt-0.5">
                      {progress.concluidos}/{progress.total}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
