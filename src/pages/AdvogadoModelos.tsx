import { useState, useMemo, useCallback, CSSProperties, ReactElement } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, FileText, ChevronRight, FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstantCache } from "@/hooks/useInstantCache";
import { List } from "react-window";
import { motion } from "framer-motion";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import heroFerramentas from "@/assets/hero-ferramentas.webp";

interface PeticaoModelo {
  id: string;
  categoria: string;
  nome_arquivo: string;
  link_direto: string;
  tipo_arquivo: string | null;
}

const ITEM_HEIGHT = 64;

const CATEGORY_COLORS = [
  "from-amber-600/50 to-orange-700/40",
  "from-blue-600/50 to-indigo-700/40",
  "from-emerald-600/50 to-teal-700/40",
  "from-purple-600/50 to-violet-700/40",
  "from-rose-600/50 to-pink-700/40",
  "from-cyan-600/50 to-sky-700/40",
  "from-lime-600/50 to-green-700/40",
  "from-fuchsia-600/50 to-purple-700/40",
];

const AdvogadoModelos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [navigationPath, setNavigationPath] = useState<string[]>([]);

  const { data: modelos, isLoading } = useInstantCache<PeticaoModelo[]>({
    cacheKey: "advogado-peticoes-modelos-v2",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peticoes_modelos")
        .select("id, categoria, nome_arquivo, link_direto, tipo_arquivo")
        .order("categoria", { ascending: true })
        .order("nome_arquivo", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Get subcategories or models for current navigation path
  const { subcategories, currentModelos, isLeaf } = useMemo(() => {
    if (!modelos) return { subcategories: [], currentModelos: [], isLeaf: false };

    const prefix = navigationPath.join(" > ");
    
    // Filter models matching current path
    const matching = prefix
      ? modelos.filter(m => m.categoria === prefix || m.categoria.startsWith(prefix + " > "))
      : modelos;

    // Extract next level
    const nextLevelMap = new Map<string, number>();
    const directModels: PeticaoModelo[] = [];

    matching.forEach(m => {
      const parts = m.categoria.split(" > ");
      const depth = navigationPath.length;

      if (parts.length > depth) {
        const nextPart = parts[depth];
        nextLevelMap.set(nextPart, (nextLevelMap.get(nextPart) || 0) + 1);
      }
      
      // Models at exactly this level (categoria matches prefix exactly)
      if (prefix && m.categoria === prefix) {
        directModels.push(m);
      }
    });

    // If there are subcategories, show them
    if (nextLevelMap.size > 0) {
      const subs = Array.from(nextLevelMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return { subcategories: subs, currentModelos: directModels, isLeaf: false };
    }

    // Leaf: show direct models
    return { subcategories: [], currentModelos: directModels, isLeaf: true };
  }, [modelos, navigationPath]);

  // Filter by search
  const filteredSubcategories = useMemo(() => {
    if (!searchTerm.trim()) return subcategories;
    const term = searchTerm.toLowerCase();
    return subcategories.filter(s => s.name.toLowerCase().includes(term));
  }, [subcategories, searchTerm]);

  const filteredModelos = useMemo(() => {
    if (!searchTerm.trim()) return currentModelos;
    const term = searchTerm.toLowerCase();
    return currentModelos.filter(m => m.nome_arquivo.toLowerCase().includes(term));
  }, [currentModelos, searchTerm]);

  const handleOpenLink = useCallback((link: string) => {
    window.open(link, "_blank", "noopener,noreferrer");
  }, []);

  const handleNavigate = (subcategory: string) => {
    setNavigationPath(prev => [...prev, subcategory]);
    setSearchTerm("");
  };

  const handleBack = () => {
    if (navigationPath.length > 0) {
      setNavigationPath(prev => prev.slice(0, -1));
      setSearchTerm("");
    }
  };

  // Row for virtualized model list
  const RowComponent = useCallback(({ 
    index, 
    style,
    ariaAttributes 
  }: { 
    index: number; 
    style: CSSProperties;
    ariaAttributes: {
      "aria-posinset": number;
      "aria-setsize": number;
      role: "listitem";
    };
  }): ReactElement => {
    const modelo = filteredModelos[index];

    return (
      <div style={style} className="px-1" {...ariaAttributes}>
        <button
          onClick={() => handleOpenLink(modelo.link_direto)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-[#12121a]/80 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all group text-left h-[56px]"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-600/20 flex-shrink-0 group-hover:bg-amber-600/30 transition-colors">
            <FileText className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block font-medium text-sm text-white truncate">
              {modelo.nome_arquivo}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-amber-400 transition-colors flex-shrink-0">
            <ExternalLink className="w-4 h-4" />
          </div>
        </button>
      </div>
    );
  }, [filteredModelos, handleOpenLink]);

  const currentTitle = navigationPath.length > 0 
    ? navigationPath[navigationPath.length - 1] 
    : "Modelos de Petições";

  const currentSubtitle = navigationPath.length > 0
    ? (isLeaf ? `${filteredModelos.length} modelos` : `${filteredSubcategories.length} subcategorias`)
    : "Selecione uma área";

  const searchPlaceholder = navigationPath.length === 0 
    ? "Buscar área..." 
    : isLeaf 
      ? "Buscar modelo..." 
      : "Buscar subcategoria...";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0">
        <img 
          src={heroFerramentas}
          alt="Background"
          className="w-full h-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
      </div>
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]" />
      
      {/* Standard Header */}
      <StandardPageHeader 
        title={currentTitle}
        subtitle={currentSubtitle}
        {...(navigationPath.length > 0 
          ? { onBack: handleBack } 
          : { backPath: "/peticoes" }
        )}
        position="fixed"
      />
      
      {/* Content */}
      <div className="relative z-10 pt-20 px-4 pb-24">
        <div className="max-w-lg mx-auto">
          {/* Breadcrumb */}
          {navigationPath.length > 0 && (
            <div className="mb-4 flex items-center gap-1 flex-wrap text-xs text-gray-400">
              <button onClick={() => { setNavigationPath([]); setSearchTerm(""); }} className="hover:text-amber-400 transition-colors">
                Áreas
              </button>
              {navigationPath.map((part, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  <button 
                    onClick={() => { setNavigationPath(navigationPath.slice(0, i + 1)); setSearchTerm(""); }}
                    className={`hover:text-amber-400 transition-colors ${i === navigationPath.length - 1 ? 'text-amber-400' : ''}`}
                  >
                    {part.replace(/^\d+\.\s*/, '')}
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#12121a]/80 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-[#12121a]/60 border border-white/10">
                  <Skeleton className="h-12 w-12 rounded-xl bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-white/10" />
                    <Skeleton className="h-3 w-1/3 bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Subcategories list */}
              {filteredSubcategories.length > 0 && (
                <div className="space-y-3">
                  {filteredSubcategories.map((sub, index) => (
                    <motion.button
                      key={sub.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.02, 0.5) }}
                      onClick={() => handleNavigate(sub.name)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#12121a]/80 border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/10 transition-all group text-left"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}`}>
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm leading-snug">
                          {sub.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {sub.count} {sub.count === 1 ? "modelo" : "modelos"}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-amber-400 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Models list (when leaf or direct models exist) */}
              {filteredModelos.length > 0 && (
                <div className={`border border-white/10 rounded-xl overflow-hidden bg-[#12121a]/40 ${filteredSubcategories.length > 0 ? 'mt-6' : ''}`}>
                  <List
                    style={{ height: Math.min(filteredModelos.length * ITEM_HEIGHT, 600) }}
                    rowCount={filteredModelos.length}
                    rowHeight={ITEM_HEIGHT}
                    rowComponent={RowComponent}
                    rowProps={{}}
                  />
                </div>
              )}

              {/* Empty state */}
              {filteredSubcategories.length === 0 && filteredModelos.length === 0 && (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">
                    {searchTerm ? "Nenhum resultado encontrado" : "Nenhum conteúdo disponível"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvogadoModelos;
