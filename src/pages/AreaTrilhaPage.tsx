import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Scale, Footprints, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { InstantBackground } from "@/components/ui/instant-background";
import { SerpentineNiveis } from "@/components/shared/SerpentineNiveis";

const SCROLL_KEY = "area-trilha-scroll";

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

  // Buscar contagem de tópicos por matéria
  const { data: topicosCount } = useQuery({
    queryKey: ["area-trilha-topicos-count", decodedArea],
    queryFn: async () => {
      if (!livros) return {};
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

        {/* Serpentine */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : filteredLivros.length > 0 ? (
          <SerpentineNiveis
            items={filteredLivros}
            getItemCapa={(item) => item["Capa-livro"]}
            getItemTitulo={(item) => item["Tema"] || "Sem título"}
            getItemOrdem={(item) => item["Ordem"] || 0}
            getItemAulas={(item) => (topicosCount || {})[item["Tema"]] || 0}
            getItemProgresso={() => 0}
            onItemClick={(item) => navigateWithScroll(`/aulas/area/${encodeURIComponent(decodedArea)}/materia/${item.id}`)}
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
