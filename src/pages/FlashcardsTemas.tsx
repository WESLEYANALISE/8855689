import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Search, ArrowLeft, BookOpen, FileText, Loader2, Lock, Crown, CheckCircle2, RefreshCw, ArrowDownAZ, ListOrdered } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useContentLimit } from "@/hooks/useContentLimit";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";
import { motion } from "framer-motion";
import themisBackground from "@/assets/themis-estudos-background.webp";

// Preload da imagem de fundo
const preloadImage = new Image();
preloadImage.src = themisBackground;

const FlashcardsTemas = () => {
  const navigate = useNavigate();
  const { goBack } = useHierarchicalNavigation();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [modo, setModo] = useState<"cronologica" | "alfabetica">("cronologica");

  // Redireciona para seleção de área se não houver área definida
  useEffect(() => {
    if (!area) {
      navigate("/flashcards", { replace: true });
    }
  }, [area, navigate]);

  // Função para normalizar strings
  const normalizar = (str: string) => 
    str.trim()
       .toLowerCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '')
       .replace(/\s+/g, ' ');

  const { data: temas, isLoading, isFetching } = useQuery({
    queryKey: ["flashcards-temas-progressivo", area],
    queryFn: async () => {
      // Busca temas e subtemas únicos da área do RESUMO
      const { data: resumoData, error } = await supabase
        .from("RESUMO")
        .select("id, tema, subtema")
        .eq("area", area)
        .not("tema", "is", null)
        .order("id", { ascending: true });

      if (error) throw error;

      // Agrupa subtemas por tema e preserva a ordem de aparição
      const subtemasPortema: Record<string, { nomeOriginal: string; subtemas: Set<string>; ordem: number }> = {};
      let ordemCounter = 0;
      resumoData?.forEach(r => {
        if (r.tema) {
          const temaNorm = normalizar(r.tema);
          if (!subtemasPortema[temaNorm]) {
            subtemasPortema[temaNorm] = { nomeOriginal: r.tema.trim(), subtemas: new Set(), ordem: ordemCounter++ };
          }
          if (r.subtema) {
            subtemasPortema[temaNorm].subtemas.add(normalizar(r.subtema));
          }
        }
      });

      // Busca todos os flashcards gerados com paginação completa
      let allFlashcardsData: { tema: string | null; subtema: string | null }[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: pageData } = await supabase
          .from("FLASHCARDS_GERADOS")
          .select("tema, subtema")
          .eq("area", area)
          .range(offset, offset + pageSize - 1);
        
        if (pageData && pageData.length > 0) {
          allFlashcardsData = [...allFlashcardsData, ...pageData];
          offset += pageSize;
          hasMore = pageData.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      // Agrupa subtemas com flashcards por tema
      const subtemasComFlashcards: Record<string, Set<string>> = {};
      const totalFlashcardsPortema: Record<string, number> = {};
      allFlashcardsData?.forEach(f => {
        if (f.tema) {
          const temaNorm = normalizar(f.tema);
          if (!subtemasComFlashcards[temaNorm]) {
            subtemasComFlashcards[temaNorm] = new Set();
          }
          if (!totalFlashcardsPortema[temaNorm]) {
            totalFlashcardsPortema[temaNorm] = 0;
          }
          totalFlashcardsPortema[temaNorm]++;
          if (f.subtema) {
            subtemasComFlashcards[temaNorm].add(normalizar(f.subtema));
          }
        }
      });

      return Object.entries(subtemasPortema).map(([temaNorm, { nomeOriginal, subtemas, ordem }]) => {
        const totalSubtemas = subtemas.size;
        const flashcardsDoTema = subtemasComFlashcards[temaNorm] || new Set();
        const subtemasGerados = flashcardsDoTema.size;
        const totalFlashcards = totalFlashcardsPortema[temaNorm] || 0;
        
        const temTodosSubtemas = totalSubtemas > 0 && subtemasGerados >= totalSubtemas;
        const temAlgunsSubtemas = subtemasGerados > 0 && subtemasGerados < totalSubtemas;
        const progressoPercent = totalSubtemas > 0 ? Math.round((subtemasGerados / totalSubtemas) * 100) : 0;
        
        return {
          tema: nomeOriginal,
          temFlashcards: temTodosSubtemas,
          parcial: temAlgunsSubtemas,
          subtemasGerados,
          totalSubtemas,
          totalFlashcards,
          progressoPercent,
          ordem
        };
      }).sort((a, b) => a.ordem - b.ordem);
    },
    enabled: !!area,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const temPendentes = query.state.data?.some(t => !t.temFlashcards && t.parcial);
      return temPendentes ? 5000 : false;
    }
  });

  const sortedTemas = temas?.filter(item =>
    item.tema.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => 
    modo === "alfabetica" 
      ? a.tema.localeCompare(b.tema) 
      : a.ordem - b.ordem
  );

  // Aplica limite de 10% para usuários free
  const { visibleItems, lockedItems, isPremiumRequired } = useContentLimit(sortedTemas, 'flashcards-temas');

  const navegarParaTema = (tema: string, isLocked: boolean) => {
    if (isLocked) {
      return;
    }
    navigate(`/flashcards/estudar?area=${encodeURIComponent(area)}&tema=${encodeURIComponent(tema)}`);
  };

  const temPendentes = temas?.some(t => t.parcial);
  const totalFlashcards = temas?.reduce((acc, t) => acc + t.totalFlashcards, 0) || 0;
  const totalTemas = temas?.length || 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image - sempre visível */}
      <div className="fixed inset-0">
        <img 
          src={themisBackground}
          alt="Background Flashcards"
          className="w-full h-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
      </div>
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header - sempre visível */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => goBack()}
              className="flex items-center gap-2 text-violet-400 hover:text-violet-300 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white line-clamp-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {area}
                </h1>
                <p className="text-sm text-gray-400">
                  Escolha um tema
                </p>
              </div>
              {temPendentes && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">
                  <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Loading state com fundo visível */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-8 py-6 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-4" />
              <p className="text-gray-400 text-sm">Carregando temas...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Info Stats */}
            <div className="px-4 py-2">
              <div className="flex items-center justify-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                  <span>{totalTemas} temas</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-yellow-400" />
                  <span>{totalFlashcards.toLocaleString('pt-BR')} flashcards</span>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
              <div className="max-w-lg mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Buscar tema..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-3 h-10 rounded-full border border-white/10 bg-black/40 text-white text-sm placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Toggle de ordenação */}
            <div className="px-4 pb-3">
              <div className="max-w-lg mx-auto flex items-center justify-center gap-2">
                <span className="text-xs text-gray-500">Modo:</span>
                <ToggleGroup 
                  type="single" 
                  value={modo} 
                  onValueChange={(value) => {
                    if (value) {
                      setModo(value as "cronologica" | "alfabetica");
                    }
                  }}
                  className="bg-white/5 rounded-lg p-1"
                >
                  <ToggleGroupItem 
                    value="cronologica" 
                    aria-label="Ordem cronológica"
                    className="text-xs px-3 py-1.5 h-auto data-[state=on]:bg-violet-500/20 data-[state=on]:text-violet-400 data-[state=on]:shadow-sm text-gray-400"
                  >
                    <ListOrdered className="w-3.5 h-3.5 mr-1.5" />
                    Cronológica
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="alfabetica" 
                    aria-label="Ordem alfabética"
                    className="text-xs px-3 py-1.5 h-auto data-[state=on]:bg-purple-500/20 data-[state=on]:text-purple-400 data-[state=on]:shadow-sm text-gray-400"
                  >
                    <ArrowDownAZ className="w-3.5 h-3.5 mr-1.5" />
                    Alfabética
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Lista de Temas */}
            <div className="px-4 pb-24 pt-4">
              <div className="max-w-lg mx-auto">
                {visibleItems?.length === 0 && lockedItems?.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    Nenhum tema encontrado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Temas liberados */}
                    {visibleItems?.map((item, index) => (
                      <motion.div
                        key={item.tema}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navegarParaTema(item.tema, false)}
                        className={`cursor-pointer rounded-xl bg-[#12121a]/90 backdrop-blur-sm border transition-all overflow-hidden ${
                          item.temFlashcards 
                            ? "border-green-500/30 hover:border-green-500/50"
                            : item.parcial
                            ? "border-blue-500/30 hover:border-blue-500/50"
                            : "border-white/10 hover:border-violet-500/50"
                        }`}
                      >
                        <div className="p-4 flex items-center gap-4">
                          {/* Número/Ícone */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            item.temFlashcards 
                              ? "bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30"
                              : item.parcial
                              ? "bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/30"
                              : "bg-gradient-to-br from-violet-500/20 to-violet-700/20 border border-violet-500/30"
                          }`}>
                            {item.temFlashcards ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : item.parcial ? (
                              <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                            ) : (
                              <span className="text-lg font-bold text-violet-400">{item.ordem + 1}</span>
                            )}
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold mb-0.5 ${
                              item.temFlashcards ? "text-green-400" : item.parcial ? "text-blue-400" : "text-violet-400"
                            }`}>
                              Tema {item.ordem + 1}
                            </p>
                            
                            <h3 className="font-medium text-sm leading-snug text-white line-clamp-2">
                              {item.tema}
                            </h3>
                            
                            {/* Status */}
                            <div className="flex items-center gap-1 mt-1.5">
                              <Sparkles className={`w-3 h-3 shrink-0 ${
                                item.temFlashcards ? "text-green-400" : item.parcial ? "text-blue-400" : "text-yellow-400"
                              }`} />
                              <span className={`text-xs ${
                                item.temFlashcards ? "text-green-400/80" : item.parcial ? "text-blue-400/80" : "text-yellow-400/80"
                              }`}>
                                {item.temFlashcards 
                                  ? `${item.totalFlashcards} flashcards` 
                                  : item.parcial 
                                  ? `${item.subtemasGerados}/${item.totalSubtemas} subtemas`
                                  : `${item.totalSubtemas} subtemas`}
                              </span>
                            </div>
                            
                            {/* Barra de progresso para parcial */}
                            {item.parcial && (
                              <div className="mt-2">
                                <Progress 
                                  value={item.progressoPercent} 
                                  className="h-1 bg-gray-700/50"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Temas bloqueados */}
                    {lockedItems?.map((item, index) => (
                      <motion.div
                        key={`locked-${item.tema}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (visibleItems?.length || 0) * 0.03 + index * 0.03 }}
                        onClick={() => navegarParaTema(item.tema, true)}
                        className="cursor-pointer rounded-xl bg-[#12121a]/60 backdrop-blur-sm border border-white/5 overflow-hidden relative"
                      >
                        {/* Overlay de bloqueio */}
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-10">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-amber-400" />
                            </div>
                            <span className="text-xs text-amber-400 font-medium">Premium</span>
                          </div>
                        </div>
                        
                        <div className="p-4 flex items-center gap-4 opacity-40">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-gray-500/20 to-gray-700/20 border border-gray-500/30">
                            <span className="text-lg font-bold text-gray-400">{item.ordem + 1}</span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold mb-0.5 text-gray-400">
                              Tema {item.ordem + 1}
                            </p>
                            <h3 className="font-medium text-sm leading-snug text-gray-300 line-clamp-2">
                              {item.tema}
                            </h3>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Banner Premium */}
                    {isPremiumRequired && lockedItems && lockedItems.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Crown className="w-5 h-5 text-amber-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-amber-400">
                              Desbloqueie todos os temas
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Acesse {lockedItems.length} temas adicionais com Premium
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FlashcardsTemas;
