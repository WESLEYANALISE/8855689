import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Scale, Footprints, Search, X, Check, Lock } from "lucide-react";
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
const VERTICAL_SPACING = 160;
const CONTAINER_WIDTH = 340;

interface SerpentineMateriasProps {
  livros: any[];
  area: string;
  topicosCount: Record<string, number>;
  onNavigate: (path: string) => void;
}

const SerpentineMaterias = ({ livros, area, topicosCount, onNavigate }: SerpentineMateriasProps) => {
  const nodes = useMemo(() => {
    return livros.map((livro, index) => ({
      x: (getNodeX(index) / 100) * CONTAINER_WIDTH,
      y: index * VERTICAL_SPACING + NODE_SIZE / 2 + 30,
      livro,
      index,
    }));
  }, [livros]);

  const svgPath = useMemo(() => {
    if (nodes.length < 2) return "";
    let d = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) {
      d += ` L ${nodes[i].x} ${nodes[i].y}`;
    }
    return d;
  }, [nodes]);

  const totalHeight = nodes.length * VERTICAL_SPACING + 60;

  return (
    <div className="pb-24 pt-4 flex justify-center">
      <div className="relative" style={{ width: CONTAINER_WIDTH, height: totalHeight }}>
        {/* SVG connector lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${CONTAINER_WIDTH} ${totalHeight}`} fill="none">
          <motion.path d={svgPath} stroke="rgba(239, 68, 68, 0.4)" strokeWidth="3" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} />
          <motion.path d={svgPath} stroke="rgba(239, 68, 68, 0.15)" strokeWidth="8" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} />
        </svg>

        {nodes.map(({ x, y, livro, index }) => {
          const capaUrl = livro["Capa-livro"];
          const titulo = livro["Tema"] || "Sem título";
          const ordem = livro["Ordem"] || index + 1;
          const aulasCount = topicosCount[titulo] || 0;
          const isCurrent = index === 0;

          return (
            <motion.div
              key={livro.id}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 180, damping: 15 }}
              className="absolute flex flex-col items-center"
              style={{ left: x - NODE_SIZE / 2, top: y - NODE_SIZE / 2, width: NODE_SIZE }}
            >
              <button
                onClick={() => onNavigate(`/aulas/area/${encodeURIComponent(area)}/materia/${livro.id}`)}
                className="relative group"
              >
                {isCurrent && (
                  <motion.div
                    className="absolute -inset-2.5 rounded-full border-2 border-red-500/60"
                    animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div className={`w-[100px] h-[100px] rounded-full overflow-hidden flex items-center justify-center shadow-xl transition-transform active:scale-95 ${
                  isCurrent ? "border-[3px] border-red-500 shadow-red-500/50" : "border-2 border-white/20"
                }`}>
                  {capaUrl ? (
                    <img src={capaUrl} alt={titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{ordem}</span>
                    </div>
                  )}
                </div>
                <div className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center border-2 border-[#0a0a12] text-xs font-bold text-white shadow-lg">
                  {ordem}
                </div>
              </button>
              <p className="mt-2.5 text-xs text-white/80 text-center leading-tight line-clamp-2 w-28 font-medium">
                {titulo}
              </p>
              <p className="text-[10px] text-gray-500 text-center">
                {aulasCount} aulas
              </p>
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
