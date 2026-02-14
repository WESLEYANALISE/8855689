import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Scale, Footprints, Search, X, Check, Lock, Star, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { UniversalImage } from "@/components/ui/universal-image";
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { InstantBackground } from "@/components/ui/instant-background";

const SCROLL_KEY = "area-trilha-scroll";

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
  { bg: "from-green-500 to-green-700", border: "border-green-500", stroke: "rgba(34,197,94,0.4)", strokeBg: "rgba(34,197,94,0.15)", badge: "bg-green-600", label: "Iniciante", shadow: "shadow-green-500/40" },
  { bg: "from-teal-400 to-teal-600", border: "border-teal-400", stroke: "rgba(45,212,191,0.4)", strokeBg: "rgba(45,212,191,0.15)", badge: "bg-teal-500", label: "Básico", shadow: "shadow-teal-400/40" },
  { bg: "from-blue-500 to-blue-700", border: "border-blue-500", stroke: "rgba(59,130,246,0.4)", strokeBg: "rgba(59,130,246,0.15)", badge: "bg-blue-600", label: "Fundamentos", shadow: "shadow-blue-500/40" },
  { bg: "from-indigo-500 to-indigo-700", border: "border-indigo-500", stroke: "rgba(99,102,241,0.4)", strokeBg: "rgba(99,102,241,0.15)", badge: "bg-indigo-600", label: "Intermediário", shadow: "shadow-indigo-500/40" },
  { bg: "from-purple-500 to-purple-700", border: "border-purple-500", stroke: "rgba(168,85,247,0.4)", strokeBg: "rgba(168,85,247,0.15)", badge: "bg-purple-600", label: "Avançando", shadow: "shadow-purple-500/40" },
  { bg: "from-pink-500 to-pink-700", border: "border-pink-500", stroke: "rgba(236,72,153,0.4)", strokeBg: "rgba(236,72,153,0.15)", badge: "bg-pink-600", label: "Aprofundando", shadow: "shadow-pink-500/40" },
  { bg: "from-red-500 to-red-700", border: "border-red-500", stroke: "rgba(239,68,68,0.4)", strokeBg: "rgba(239,68,68,0.15)", badge: "bg-red-600", label: "Avançado", shadow: "shadow-red-500/40" },
  { bg: "from-orange-500 to-orange-700", border: "border-orange-500", stroke: "rgba(249,115,22,0.4)", strokeBg: "rgba(249,115,22,0.15)", badge: "bg-orange-600", label: "Expert", shadow: "shadow-orange-500/40" },
  { bg: "from-amber-500 to-amber-700", border: "border-amber-500", stroke: "rgba(245,158,11,0.4)", strokeBg: "rgba(245,158,11,0.15)", badge: "bg-amber-600", label: "Especialista", shadow: "shadow-amber-500/40" },
  { bg: "from-yellow-400 to-yellow-600", border: "border-yellow-400", stroke: "rgba(250,204,21,0.4)", strokeBg: "rgba(250,204,21,0.15)", badge: "bg-yellow-500", label: "Mestre", shadow: "shadow-yellow-400/40" },
];

interface NivelGroup {
  nivel: number;
  materias: any[];
}

interface SerpentineMateriasProps {
  livros: any[];
  area: string;
  topicosCount: Record<string, number>;
  onNavigate: (path: string) => void;
}

// Banner component for each level
const NivelBanner = ({ nivel, label, colorBg, isLocked, lineColor }: { nivel: number; label: string; colorBg: string; isLocked: boolean; lineColor: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
    className="flex items-center gap-3 mb-6"
  >
    {/* Left line */}
    <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${lineColor})` }} />
    <div className={`relative flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r ${colorBg} shadow-lg`}>
      {isLocked ? (
        <Lock className="w-4 h-4 text-white/80" />
      ) : nivel >= 9 ? (
        <Trophy className="w-4 h-4 text-white" />
      ) : (
        <Star className="w-4 h-4 text-white/90" />
      )}
      <span className="text-white font-bold text-sm tracking-wide">Nível {nivel}</span>
      <span className="text-white/70 text-xs">· {label}</span>
    </div>
    {/* Right line */}
    <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${lineColor})` }} />
  </motion.div>
);

const SerpentineMaterias = ({ livros, area, topicosCount, onNavigate }: SerpentineMateriasProps) => {
  // Group materias into levels
  const niveis = useMemo<NivelGroup[]>(() => {
    const materiasPorNivel = Math.ceil(livros.length / TOTAL_NIVEIS);
    const groups: NivelGroup[] = [];
    for (let i = 0; i < TOTAL_NIVEIS; i++) {
      const start = i * materiasPorNivel;
      const end = Math.min(start + materiasPorNivel, livros.length);
      if (start < livros.length) {
        groups.push({ nivel: i + 1, materias: livros.slice(start, end) });
      }
    }
    return groups;
  }, [livros]);

  // Build all nodes with positions, accounting for banners
  const { allNodes, totalHeight, bannerPositions } = useMemo(() => {
    const nodes: { x: number; y: number; livro: any; globalIndex: number; nivelIndex: number; color: typeof NIVEL_COLORS[0] }[] = [];
    const banners: { y: number; nivel: number; color: typeof NIVEL_COLORS[0] }[] = [];
    let currentY = 0;
    let globalIdx = 0;

    for (const group of niveis) {
      const color = NIVEL_COLORS[(group.nivel - 1) % NIVEL_COLORS.length];
      // Banner position
      banners.push({ y: currentY, nivel: group.nivel, color });
      currentY += 70; // banner height + gap

      for (let i = 0; i < group.materias.length; i++) {
        const x = (getNodeX(i) / 100) * CONTAINER_WIDTH;
        nodes.push({
          x, y: currentY + NODE_SIZE / 2,
          livro: group.materias[i],
          globalIndex: globalIdx,
          nivelIndex: group.nivel,
          color,
        });
        currentY += VERTICAL_SPACING;
        globalIdx++;
      }
      currentY += 20; // gap between levels
    }

    return { allNodes: nodes, totalHeight: currentY + 60, bannerPositions: banners };
  }, [niveis]);

  // Build SVG paths per level
  const svgPaths = useMemo(() => {
    const paths: { d: string; stroke: string; strokeBg: string }[] = [];
    for (const group of niveis) {
      const color = NIVEL_COLORS[(group.nivel - 1) % NIVEL_COLORS.length];
      const levelNodes = allNodes.filter(n => n.nivelIndex === group.nivel);
      if (levelNodes.length < 2) continue;
      let d = `M ${levelNodes[0].x} ${levelNodes[0].y}`;
      for (let i = 1; i < levelNodes.length; i++) {
        d += ` L ${levelNodes[i].x} ${levelNodes[i].y}`;
      }
      paths.push({ d, stroke: color.stroke, strokeBg: color.strokeBg });
    }
    return paths;
  }, [allNodes, niveis]);

  // Current level (placeholder - nivel 1 for now)
  const currentNivel = 1;
  const progressPercent = 0; // placeholder

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
        {/* SVG connector lines per level */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${CONTAINER_WIDTH} ${totalHeight}`} fill="none">
          {svgPaths.map((p, i) => (
            <g key={i}>
              <motion.path d={p.d} stroke={p.strokeBg} strokeWidth="8" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: i * 0.2, ease: "easeOut" }} />
              <motion.path d={p.d} stroke={p.stroke} strokeWidth="3" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: i * 0.2, ease: "easeOut" }} />
            </g>
          ))}
        </svg>

        {/* Level banners */}
        {bannerPositions.map((b) => (
          <div key={b.nivel} className="absolute left-0 right-0" style={{ top: b.y }}>
            <NivelBanner nivel={b.nivel} label={b.color.label} colorBg={b.color.bg} isLocked={b.nivel > 1} lineColor={b.color.stroke} />
          </div>
        ))}

        {/* Nodes */}
        {allNodes.map(({ x, y, livro, globalIndex, color }) => {
          const capaUrl = livro["Capa-livro"];
          const titulo = livro["Tema"] || "Sem título";
          const ordem = livro["Ordem"] || globalIndex + 1;
          const aulasCount = topicosCount[titulo] || 0;
          const isCurrent = globalIndex === 0;
          const size = isCurrent ? CURRENT_NODE_SIZE : NODE_SIZE;
          const circleSize = isCurrent ? 130 : 100;
          const materiaProgress = 0; // placeholder

          return (
            <motion.div
              key={livro.id}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: globalIndex * 0.06, type: "spring", stiffness: 180, damping: 15 }}
              className="absolute flex flex-col items-center"
              style={{ left: x - size / 2, top: y - size / 2, width: size }}
            >
              <button
                onClick={() => onNavigate(`/aulas/area/${encodeURIComponent(area)}/materia/${livro.id}`)}
                className="relative group"
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
                <div className={`relative rounded-full overflow-hidden flex items-center justify-center shadow-xl transition-transform active:scale-95 ${
                  isCurrent ? `border-[3px] ${color.border} ${color.shadow}` : "border-2 border-white/20"
                }`} style={{ width: circleSize, height: circleSize }}>
                  {capaUrl ? (
                    <img src={capaUrl} alt={titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${color.bg} flex items-center justify-center`}>
                      <span className="text-white font-bold text-xl">{ordem}</span>
                    </div>
                  )}
                  {/* Percentage overlay inside the circle */}
                  <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-full">
                    <span className="text-white font-bold text-xs mb-2 drop-shadow-lg">{materiaProgress}%</span>
                  </div>
                </div>
                <div className={`absolute -top-1 -left-1 rounded-full ${color.badge} flex items-center justify-center border-2 border-[#0a0a12] font-bold text-white shadow-lg ${
                  isCurrent ? "w-8 h-8 text-sm" : "w-7 h-7 text-xs"
                }`}>
                  {ordem}
                </div>
              </button>
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
};

const AreaTrilhaPage = () => {
  const { area } = useParams<{ area: string }>();
  const navigate = useNavigate();
  const decodedArea = decodeURIComponent(area || "");
  const [searchTerm, setSearchTerm] = useState("");

  // Restaurar scroll
  useEffect(() => {
    const saved = sessionStorage.getItem(`${SCROLL_KEY}-${decodedArea}`);
    if (saved) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(saved));
        sessionStorage.removeItem(`${SCROLL_KEY}-${decodedArea}`);
      }, 100);
    }
  }, [decodedArea]);

  const navigateWithScroll = (path: string) => {
    sessionStorage.setItem(`${SCROLL_KEY}-${decodedArea}`, window.scrollY.toString());
    navigate(path);
  };

  // Buscar livros (matérias) desta área
  const { data: livros, isLoading } = useQuery({
    queryKey: ["area-trilha-livros", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("*")
        .eq("Área", decodedArea)
        .order("Ordem", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Buscar contagem de tópicos por matéria (categorias_topicos)
  const { data: topicosCount } = useQuery({
    queryKey: ["area-trilha-topicos-count", decodedArea],
    queryFn: async () => {
      if (!livros) return {};
      // Buscar todas as categorias_materias desta área
      const { data: materias } = await supabase
        .from("categorias_materias")
        .select("id, nome")
        .eq("categoria", decodedArea);
      if (!materias) return {};
      
      const counts: Record<string, number> = {};
      for (const m of materias) {
        const { count } = await supabase
          .from("categorias_topicos")
          .select("*", { count: "exact", head: true })
          .eq("materia_id", m.id);
        counts[m.nome] = count || 0;
      }
      return counts;
    },
    enabled: !!livros && livros.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Contar total de áreas únicas
  const { data: totalAreas } = useQuery({
    queryKey: ["area-trilha-total-areas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("Área");
      if (!data) return 0;
      const unique = new Set(data.map(d => d["Área"]).filter(Boolean));
      return unique.size;
    },
    staleTime: Infinity,
  });

  // Buscar ordem desta área (posição entre todas as áreas)
  const areaOrdem = useMemo(() => {
    // Simplified - just show the area name
    return null;
  }, []);

  const totalMaterias = livros?.length || 0;
  const totalTopicos = Object.values(topicosCount || {}).reduce((a, b) => a + b, 0);

  const filteredLivros = useMemo(() => {
    if (!livros) return [];
    if (!searchTerm.trim()) return livros;
    const term = searchTerm.toLowerCase().trim();
    return livros.filter(l => (l.Tema || "").toLowerCase().includes(term));
  }, [livros, searchTerm]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <InstantBackground
        src={bgAreasOab}
        alt="Áreas"
        blurCategory="oab"
        gradientClassName="bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]"
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate("/?tab=ferramentas")}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Scale className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                    {decodedArea}
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">
                    {totalMaterias} matérias · {totalTopicos} aulas
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-400" />
              <span>{totalMaterias} matérias</span>
            </div>
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-yellow-400" />
              <span>{totalTopicos} aulas</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar matéria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500/50"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Serpentine de Matérias (círculos) */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : filteredLivros.length > 0 ? (
          <SerpentineMaterias
            livros={filteredLivros}
            area={decodedArea}
            topicosCount={topicosCount || {}}
            onNavigate={navigateWithScroll}
          />
        ) : (
          <div className="text-center py-10 text-white/50 text-sm">
            Nenhuma matéria encontrada.
          </div>
        )}
      </div>
    </div>
  );
};

export default AreaTrilhaPage;
