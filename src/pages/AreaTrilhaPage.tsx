import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Scale, Footprints, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { UniversalImage } from "@/components/ui/universal-image";
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { InstantBackground } from "@/components/ui/instant-background";

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

        {/* Timeline de Matérias */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : filteredLivros.length > 0 ? (
          <div className="px-4 pb-24 pt-4">
            <div className="max-w-lg mx-auto relative">
              {/* Linha central da timeline */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
                <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
                <motion.div
                  className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
                  animate={{ y: ["0%", "300%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="space-y-6">
                {filteredLivros.map((livro, index) => {
                  const isLeft = index % 2 === 0;
                  const capaUrl = livro["Capa-livro"];
                  const titulo = livro["Tema"] || "Sem título";
                  const aulasCount = topicosCount?.[titulo] || 0;

                  return (
                    <motion.div
                      key={livro.id}
                      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative flex items-center ${isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'}`}
                    >
                      {/* Marcador central */}
                      <div className="absolute left-1/2 -translate-x-1/2 z-10">
                        <motion.div
                          animate={{
                            scale: [1, 1.15, 1],
                            boxShadow: ["0 0 0 0 rgba(239, 68, 68, 0.4)", "0 0 0 10px rgba(239, 68, 68, 0)", "0 0 0 0 rgba(239, 68, 68, 0.4)"]
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/40"
                        >
                          <Footprints className="w-5 h-5 text-white" />
                        </motion.div>
                      </div>

                      {/* Card da Matéria */}
                      <div className="w-full">
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigateWithScroll(`/aulas/area/${encodeURIComponent(decodedArea)}/materia/${livro.id}`)}
                          className="cursor-pointer rounded-2xl backdrop-blur-sm border transition-all overflow-hidden min-h-[180px] flex flex-col bg-[#12121a]/90 border-white/10 hover:border-red-500/50"
                        >
                          {/* Capa */}
                          <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
                            {capaUrl ? (
                              <>
                                <img src={capaUrl} alt={titulo} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                              </>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center">
                                <Scale className="w-6 h-6 text-white/30" />
                              </div>
                            )}
                            <div className="absolute bottom-1 left-2">
                              <p className="text-[10px] text-red-400 font-semibold drop-shadow-lg">Matéria {index + 1}</p>
                            </div>
                          </div>

                          <div className="p-3 flex-1 flex flex-col">
                            <h3 className="font-semibold text-sm text-white leading-snug line-clamp-2 mb-1">
                              {titulo}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-auto">
                              <BookOpen className="w-3.5 h-3.5 text-red-400" />
                              <span>{aulasCount} aulas</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">0% concluído</p>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
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
