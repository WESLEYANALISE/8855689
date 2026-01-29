import { useState, useMemo, useCallback, CSSProperties, ReactElement } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, FileText, ChevronRight, FolderOpen, ArrowLeft } from "lucide-react";
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

// Cores para as categorias
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Cache instantâneo para modelos
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

  // Extrair categorias únicas com contagem
  const categoriesWithCount = useMemo(() => {
    if (!modelos) return [];
    const categoryMap = new Map<string, number>();
    
    modelos.forEach(m => {
      const count = categoryMap.get(m.categoria) || 0;
      categoryMap.set(m.categoria, count + 1);
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [modelos]);

  // Filtrar categorias por busca
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categoriesWithCount;
    const term = searchTerm.toLowerCase();
    return categoriesWithCount.filter(cat => 
      cat.name.toLowerCase().includes(term)
    );
  }, [categoriesWithCount, searchTerm]);

  // Filtrar modelos da categoria selecionada
  const filteredModelos = useMemo(() => {
    if (!modelos || !selectedCategory) return [];
    
    let filtered = modelos.filter(m => m.categoria === selectedCategory);
    
    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.nome_arquivo.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [modelos, selectedCategory, searchTerm]);

  const handleOpenLink = useCallback((link: string) => {
    window.open(link, "_blank", "noopener,noreferrer");
  }, []);

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setSearchTerm("");
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setSearchTerm("");
  };

  // Componente de item para virtualização
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

  // Visualização de áreas/categorias
  if (!selectedCategory) {
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
          title="Modelos de Petições"
          subtitle="Selecione uma área"
          backPath="/peticoes"
          position="fixed"
        />
        
        {/* Content */}
        <div className="relative z-10 pt-20 px-4 pb-24">
          <div className="max-w-lg mx-auto">
            {/* Busca */}
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar área..."
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
              <div className="space-y-3">
                {filteredCategories.map((category, index) => (
                  <motion.button
                    key={category.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelectCategory(category.name)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#12121a]/80 border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/10 transition-all group text-left"
                  >
                    {/* Ícone com gradiente */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}`}>
                      <FolderOpen className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white text-sm leading-snug">
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {category.count} {category.count === 1 ? "modelo" : "modelos"}
                      </p>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-amber-400 transition-colors" />
                  </motion.button>
                ))}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-12">
                    <FolderOpen className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">
                      Nenhuma área encontrada
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Visualização de modelos da categoria selecionada
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
        title={selectedCategory}
        subtitle={`${filteredModelos.length} modelos`}
        onBack={handleBack}
        position="fixed"
      />
      
      {/* Content */}
      <div className="relative z-10 pt-20 px-4 pb-24">
        <div className="max-w-lg mx-auto">
          {/* Busca */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#12121a]/80 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>

          {filteredModelos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">
                {searchTerm ? "Nenhum modelo encontrado" : "Nenhum modelo disponível"}
              </p>
            </div>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden bg-[#12121a]/40">
              <List
                style={{ height: Math.min(filteredModelos.length * ITEM_HEIGHT, 600) }}
                rowCount={filteredModelos.length}
                rowHeight={ITEM_HEIGHT}
                rowComponent={RowComponent}
                rowProps={{}}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvogadoModelos;
