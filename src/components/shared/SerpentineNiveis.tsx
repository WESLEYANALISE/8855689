import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Star, Trophy, Check } from "lucide-react";

// Serpentine positions: zigzag left-center-right
const SERPENTINE_X = [50, 78, 50, 22, 50, 78, 50, 22];
const getNodeX = (idx: number) => SERPENTINE_X[idx % SERPENTINE_X.length];
const NODE_SIZE = 110;
const CURRENT_NODE_SIZE = 140;
const VERTICAL_SPACING = 180;
const CONTAINER_WIDTH = 340;
const TOTAL_NIVEIS = 10;

// Level color themes
const NIVEL_COLORS = [
  { bg: "from-green-500 to-green-700", border: "border-green-500", stroke: "rgba(34,197,94,0.4)", strokeBg: "rgba(34,197,94,0.15)", badge: "bg-green-600", label: "Iniciante", shadow: "shadow-green-500/40", hex: "#22c55e" },
  { bg: "from-teal-400 to-teal-600", border: "border-teal-400", stroke: "rgba(45,212,191,0.4)", strokeBg: "rgba(45,212,191,0.15)", badge: "bg-teal-500", label: "Básico", shadow: "shadow-teal-400/40", hex: "#2dd4bf" },
  { bg: "from-blue-500 to-blue-700", border: "border-blue-500", stroke: "rgba(59,130,246,0.4)", strokeBg: "rgba(59,130,246,0.15)", badge: "bg-blue-600", label: "Fundamentos", shadow: "shadow-blue-500/40", hex: "#3b82f6" },
  { bg: "from-indigo-500 to-indigo-700", border: "border-indigo-500", stroke: "rgba(99,102,241,0.4)", strokeBg: "rgba(99,102,241,0.15)", badge: "bg-indigo-600", label: "Intermediário", shadow: "shadow-indigo-500/40", hex: "#6366f1" },
  { bg: "from-purple-500 to-purple-700", border: "border-purple-500", stroke: "rgba(168,85,247,0.4)", strokeBg: "rgba(168,85,247,0.15)", badge: "bg-purple-600", label: "Avançando", shadow: "shadow-purple-500/40", hex: "#a855f7" },
  { bg: "from-pink-500 to-pink-700", border: "border-pink-500", stroke: "rgba(236,72,153,0.4)", strokeBg: "rgba(236,72,153,0.15)", badge: "bg-pink-600", label: "Aprofundando", shadow: "shadow-pink-500/40", hex: "#ec4899" },
  { bg: "from-red-500 to-red-700", border: "border-red-500", stroke: "rgba(239,68,68,0.4)", strokeBg: "rgba(239,68,68,0.15)", badge: "bg-red-600", label: "Avançado", shadow: "shadow-red-500/40", hex: "#ef4444" },
  { bg: "from-orange-500 to-orange-700", border: "border-orange-500", stroke: "rgba(249,115,22,0.4)", strokeBg: "rgba(249,115,22,0.15)", badge: "bg-orange-600", label: "Expert", shadow: "shadow-orange-500/40", hex: "#f97316" },
  { bg: "from-amber-500 to-amber-700", border: "border-amber-500", stroke: "rgba(245,158,11,0.4)", strokeBg: "rgba(245,158,11,0.15)", badge: "bg-amber-600", label: "Especialista", shadow: "shadow-amber-500/40", hex: "#f59e0b" },
  { bg: "from-yellow-400 to-yellow-600", border: "border-yellow-400", stroke: "rgba(250,204,21,0.4)", strokeBg: "rgba(250,204,21,0.15)", badge: "bg-yellow-500", label: "Mestre", shadow: "shadow-yellow-400/40", hex: "#facc15" },
];

interface NivelGroup {
  nivel: number;
  items: any[];
}

// Banner component for each level
const NivelBanner = ({ nivel, label, colorBg, isLocked, lineColor, direction, completedCount, totalCount }: { 
  nivel: number; label: string; colorBg: string; isLocked: boolean; lineColor: string; direction: number; completedCount: number; totalCount: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: direction }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, margin: "-30px" }}
    transition={{ duration: 0.5, type: "spring", stiffness: 120, damping: 18 }}
    className="flex flex-col items-center gap-1 mb-6"
  >
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${lineColor})` }} />
      <motion.div 
        className={`relative flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r ${colorBg} shadow-lg`}
        whileHover={{ scale: 1.03 }}
        style={{ boxShadow: `0 0 20px ${lineColor}` }}
      >
        {isLocked ? (
          <Lock className="w-4 h-4 text-white/80" />
        ) : nivel >= 9 ? (
          <Trophy className="w-4 h-4 text-white" />
        ) : (
          <Star className="w-4 h-4 text-white/90" />
        )}
        <span className="text-white font-bold text-sm tracking-wide">Nível {nivel}</span>
        <span className="text-white/70 text-xs">· {label}</span>
      </motion.div>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${lineColor})` }} />
    </div>
    <span className="text-[10px] text-white/50 font-medium">
      {completedCount}/{totalCount} concluídas
    </span>
  </motion.div>
);

// Circular progress ring component
const ProgressRing = ({ size, progress, color }: { size: number; progress: number; color: string }) => {
  const radius = size / 2 + 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 100) / 100);
  
  return (
    <svg
      className="absolute -inset-2 pointer-events-none"
      width={size + 8}
      height={size + 8}
      style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
    >
      {/* Background ring */}
      <circle
        cx={(size + 8) / 2}
        cy={(size + 8) / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="3"
      />
      {/* Progress ring */}
      <motion.circle
        cx={(size + 8) / 2}
        cy={(size + 8) / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        whileInView={{ strokeDashoffset: offset }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      />
    </svg>
  );
};

export interface SerpentineItem {
  id: number | string;
  [key: string]: any;
}

export interface SerpentineNiveisProps<T extends SerpentineItem> {
  items: T[];
  getItemCapa: (item: T) => string | null | undefined;
  getItemTitulo: (item: T) => string;
  getItemOrdem: (item: T) => number;
  getItemAulas: (item: T) => number;
  getItemProgresso: (item: T) => number;
  onItemClick: (item: T) => void;
  isItemLocked?: (item: T) => boolean;
}

export function SerpentineNiveis<T extends SerpentineItem>({
  items,
  getItemCapa,
  getItemTitulo,
  getItemOrdem,
  getItemAulas,
  getItemProgresso,
  onItemClick,
  isItemLocked,
}: SerpentineNiveisProps<T>) {
  // Group items into levels
  const niveis = useMemo<NivelGroup[]>(() => {
    const perLevel = Math.ceil(items.length / TOTAL_NIVEIS);
    const groups: NivelGroup[] = [];
    for (let i = 0; i < TOTAL_NIVEIS; i++) {
      const start = i * perLevel;
      const end = Math.min(start + perLevel, items.length);
      if (start < items.length) {
        groups.push({ nivel: i + 1, items: items.slice(start, end) });
      }
    }
    return groups;
  }, [items]);

  // Build all nodes with positions
  const { allNodes, totalHeight, bannerPositions } = useMemo(() => {
    const nodes: { x: number; y: number; item: T; globalIndex: number; nivelIndex: number; color: typeof NIVEL_COLORS[0] }[] = [];
    const banners: { y: number; nivel: number; color: typeof NIVEL_COLORS[0] }[] = [];
    let currentY = 0;
    let globalIdx = 0;

    for (const group of niveis) {
      const color = NIVEL_COLORS[(group.nivel - 1) % NIVEL_COLORS.length];
      banners.push({ y: currentY, nivel: group.nivel, color });
      currentY += 70;

      for (let i = 0; i < group.items.length; i++) {
        const x = (getNodeX(i) / 100) * CONTAINER_WIDTH;
        nodes.push({
          x, y: currentY + NODE_SIZE / 2,
          item: group.items[i] as T,
          globalIndex: globalIdx,
          nivelIndex: group.nivel,
          color,
        });
        currentY += VERTICAL_SPACING;
        globalIdx++;
      }
      currentY += 20;
    }

    return { allNodes: nodes, totalHeight: currentY + 60, bannerPositions: banners };
  }, [niveis]);

  // Build SVG paths per level with Bezier curves
  const svgPaths = useMemo(() => {
    const paths: { d: string; stroke: string; strokeBg: string; hex: string }[] = [];
    for (const group of niveis) {
      const color = NIVEL_COLORS[(group.nivel - 1) % NIVEL_COLORS.length];
      const levelNodes = allNodes.filter(n => n.nivelIndex === group.nivel);
      if (levelNodes.length < 2) continue;
      let d = `M ${levelNodes[0].x} ${levelNodes[0].y}`;
      for (let i = 1; i < levelNodes.length; i++) {
        const prev = levelNodes[i - 1];
        const curr = levelNodes[i];
        // Quadratic Bezier: control point at midpoint Y, averaged X with push
        const ctrlX = (prev.x + curr.x) / 2;
        const ctrlY = (prev.y + curr.y) / 2;
        d += ` Q ${ctrlX} ${ctrlY}, ${curr.x} ${curr.y}`;
      }
      paths.push({ d, stroke: color.stroke, strokeBg: color.strokeBg, hex: color.hex });
    }
    return paths;
  }, [allNodes, niveis]);

  // Calculate real progress
  const progressPercent = useMemo(() => {
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => sum + getItemProgresso(item), 0);
    return Math.round(total / items.length);
  }, [items, getItemProgresso]);

  // Stats per level
  const nivelStats = useMemo(() => {
    const stats: Record<number, { completed: number; total: number }> = {};
    for (const group of niveis) {
      let completed = 0;
      for (const item of group.items) {
        if (getItemProgresso(item as T) >= 100) completed++;
      }
      stats[group.nivel] = { completed, total: group.items.length };
    }
    return stats;
  }, [niveis, getItemProgresso]);

  // Determine current level based on progress
  const currentNivel = useMemo(() => {
    for (const group of niveis) {
      const allDone = group.items.every(item => getItemProgresso(item as T) >= 100);
      if (!allDone) return group.nivel;
    }
    return niveis.length > 0 ? niveis[niveis.length - 1].nivel : 1;
  }, [niveis, getItemProgresso]);

  return (
    <div className="pb-24 pt-2 flex flex-col items-center">
      {/* Level progress bar */}
      <div className="w-full max-w-sm px-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/60 font-medium">Progresso geral</span>
          <span className="text-xs text-white/80 font-bold">{progressPercent}%</span>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-green-500 via-teal-400 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {niveis.map((g) => {
            const c = NIVEL_COLORS[(g.nivel - 1) % NIVEL_COLORS.length];
            const isActive = g.nivel === currentNivel;
            return (
              <div key={g.nivel} className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full ${isActive ? `bg-gradient-to-r ${c.bg} ring-2 ring-white/30` : 'bg-white/20'}`} />
                {isActive && <span className="text-[8px] text-white/70 mt-0.5">{g.nivel}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative" style={{ width: CONTAINER_WIDTH, height: totalHeight }}>
        {/* SVG connector lines with Bezier curves */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${CONTAINER_WIDTH} ${totalHeight}`} fill="none">
          <defs>
            {svgPaths.map((p, i) => (
              <filter key={`glow-${i}`} id={`energy-glow-${i}`}>
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>
          {svgPaths.map((p, i) => (
            <g key={i}>
              {/* Background path */}
              <motion.path 
                d={p.d} 
                stroke={p.strokeBg} 
                strokeWidth="8" 
                strokeLinecap="round" 
                fill="none" 
                initial={{ pathLength: 0 }} 
                whileInView={{ pathLength: 1 }} 
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1.4, delay: 0.1, ease: "easeOut" }} 
              />
              {/* Foreground path */}
              <motion.path 
                d={p.d} 
                stroke={p.stroke} 
                strokeWidth="3" 
                strokeLinecap="round" 
                fill="none" 
                initial={{ pathLength: 0 }} 
                whileInView={{ pathLength: 1 }} 
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1.4, delay: 0.1, ease: "easeOut" }} 
              />
              {/* Energy dot traveling along path */}
              <circle r="5" fill={p.hex} filter={`url(#energy-glow-${i})`} opacity="0.9">
                <animateMotion dur="4s" repeatCount="indefinite" path={p.d} />
              </circle>
            </g>
          ))}
        </svg>

        {/* Level banners */}
        {bannerPositions.map((b) => {
          const stats = nivelStats[b.nivel] || { completed: 0, total: 0 };
          return (
            <div key={b.nivel} className="absolute left-0 right-0" style={{ top: b.y }}>
              <NivelBanner 
                nivel={b.nivel} 
                label={b.color.label} 
                colorBg={b.color.bg} 
                isLocked={b.nivel > currentNivel} 
                lineColor={b.color.stroke} 
                direction={b.nivel % 2 === 0 ? -30 : 30}
                completedCount={stats.completed}
                totalCount={stats.total}
              />
            </div>
          );
        })}

        {/* Nodes */}
        {allNodes.map(({ x, y, item, globalIndex, color }) => {
          const capaUrl = getItemCapa(item);
          const titulo = getItemTitulo(item);
          const ordem = getItemOrdem(item);
          const aulasCount = getItemAulas(item);
          const itemProgress = getItemProgresso(item);
          const isCurrent = globalIndex === 0;
          const locked = isItemLocked?.(item) ?? false;
          const isCompleted = itemProgress >= 100;
          const size = isCurrent ? CURRENT_NODE_SIZE : NODE_SIZE;
          const circleSize = isCurrent ? 130 : 100;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.3 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: (globalIndex % 5) * 0.08, type: "spring", stiffness: 180, damping: 15 }}
              className="absolute flex flex-col items-center"
              style={{ left: x - size / 2, top: y - size / 2, width: size }}
            >
              <motion.button
                onClick={() => onItemClick(item)}
                className={`relative group ${locked ? '' : 'cursor-pointer'}`}
                whileHover={locked ? {} : { scale: 1.06 }}
                whileTap={locked ? {} : { scale: 0.94 }}
              >
                {/* Animated pulse ring for current */}
                {isCurrent && (
                  <>
                    <motion.div
                      className={`absolute -inset-3 rounded-full border-2 ${color.border}`}
                      animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className={`absolute -inset-5 rounded-full border ${color.border}`}
                      animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    />
                  </>
                )}

                {/* Progress ring */}
                {!locked && itemProgress > 0 && (
                  <ProgressRing size={circleSize} progress={itemProgress} color={color.hex} />
                )}

                <div className={`relative rounded-full overflow-hidden flex items-center justify-center shadow-xl ${
                  isCompleted 
                    ? "border-[3px] border-yellow-400 shadow-yellow-400/30" 
                    : isCurrent 
                      ? `border-[3px] ${color.border} ${color.shadow}` 
                      : "border-2 border-white/20"
                }`} style={{ width: circleSize, height: circleSize }}>
                  {capaUrl ? (
                    <img src={capaUrl} alt={titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${color.bg} flex items-center justify-center`}>
                      <span className="text-white font-bold text-xl">{ordem}</span>
                    </div>
                  )}
                  {/* Locked overlay */}
                  {locked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                      <Lock className="w-6 h-6 text-white/80" />
                    </div>
                  )}
                  {/* Percentage overlay */}
                  {!locked && (
                    <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-full">
                      <span className="text-white font-bold text-xs mb-2 drop-shadow-lg">{itemProgress}%</span>
                    </div>
                  )}
                </div>

                {/* Completion checkmark */}
                <AnimatePresence>
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-yellow-400 border-2 border-[#0a0a12] flex items-center justify-center shadow-lg shadow-yellow-400/40"
                    >
                      <Check className="w-4 h-4 text-black" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={`absolute -top-1 -left-1 rounded-full ${color.badge} flex items-center justify-center border-2 border-[#0a0a12] font-bold text-white shadow-lg ${
                  isCurrent ? "w-8 h-8 text-sm" : "w-7 h-7 text-xs"
                }`}>
                  {ordem}
                </div>
              </motion.button>
              <p className={`mt-2 text-center leading-tight line-clamp-2 font-medium ${
                isCurrent ? "text-sm text-white w-36" : "text-xs text-white/80 w-28"
              }`}>
                {titulo}
              </p>
              <p className="text-[10px] text-gray-500 text-center">{aulasCount} aulas</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
