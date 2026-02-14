import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Scale, Footprints, Sparkles, Search, X, FileText, RefreshCw, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useCategoriasAutoGeneration } from "@/hooks/useCategoriasAutoGeneration";
import { CategoriasPdfProcessorModal } from "@/components/categorias/CategoriasPdfProcessorModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const AreaMateriaTrilhaPage = () => {
  const { area, livroId } = useParams<{ area: string; livroId: string }>();
  const areaDecoded = area ? decodeURIComponent(area) : "";
  const parsedLivroId = livroId ? parseInt(livroId) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [createdMateriaId, setCreatedMateriaId] = useState<number | null>(null);
  const [createdMateriaNome, setCreatedMateriaNome] = useState<string>("");

  // Buscar livro da BIBLIOTECA-ESTUDOS
  const { data: livro, isLoading: loadingLivro } = useQuery({
    queryKey: ["area-materia-livro", parsedLivroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("*")
        .eq("id", parsedLivroId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!parsedLivroId,
    staleTime: Infinity,
  });

  // Buscar ou identificar categorias_materias vinculada a este livro
  const { data: categoriaMateria, isLoading: loadingMateria } = useQuery({
    queryKey: ["area-categoria-materia", areaDecoded, parsedLivroId],
    queryFn: async () => {
      // Buscar pelo nome do livro + categoria = area
      const nomeMateria = livro?.Tema || "";
      const { data, error } = await supabase
        .from("categorias_materias")
        .select("*")
        .eq("categoria", areaDecoded)
        .eq("nome", nomeMateria)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!livro && !!areaDecoded,
    staleTime: Infinity,
  });

  // Buscar tópicos da matéria
  const { data: topicos, isLoading: loadingTopicos } = useQuery({
    queryKey: ["area-categoria-topicos", categoriaMateria?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_topicos")
        .select("*")
        .eq("materia_id", categoriaMateria!.id)
        .order("ordem");
      if (error) throw error;
      return data || [];
    },
    enabled: !!categoriaMateria?.id,
    staleTime: Infinity,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasGenerating = data?.some((t: any) => t.status === "gerando" || t.status === "na_fila");
      return hasGenerating ? 5000 : false;
    },
  });

  // Auto-generation
  const {
    isGenerating,
    currentGeneratingTitle,
    currentProgress,
    totalTopicos: totalTopicosGerados,
    concluidos,
    pendentes,
    percentualGeral,
    getTopicoStatus,
  } = useCategoriasAutoGeneration({
    materiaId: categoriaMateria?.id || null,
    topicos: topicos?.map(t => ({
      id: t.id,
      titulo: t.titulo,
      status: t.status,
      progresso: t.progresso,
      ordem: t.ordem,
      posicao_fila: t.posicao_fila,
    })),
    enabled: !!categoriaMateria?.id,
  });

  // Criar registro em categorias_materias se não existe (admin only)
  const criarMateria = async () => {
    if (!livro || !areaDecoded) return null;
    try {
      const { data, error } = await supabase
        .from("categorias_materias")
        .insert({
          categoria: areaDecoded,
          nome: livro.Tema || "Sem título",
          descricao: livro.Sobre || "",
          capa_url: livro["Capa-livro"] || null,
          ordem: livro.Ordem || 1,
          ativo: true,
          status_processamento: "pendente",
        })
        .select()
        .single();
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["area-categoria-materia"] });
      return data;
    } catch (err) {
      console.error("Erro ao criar matéria:", err);
      toast.error("Erro ao criar registro da matéria");
      return null;
    }
  };

  const handleAddPdf = async () => {
    if (!categoriaMateria) {
      const newMateria = await criarMateria();
      if (newMateria) {
        setCreatedMateriaId(newMateria.id);
        setCreatedMateriaNome(newMateria.nome);
        setShowPdfModal(true);
      }
    } else {
      setShowPdfModal(true);
    }
  };

  const activeMateriaId = categoriaMateria?.id || createdMateriaId;
  const activeMateriaNome = categoriaMateria?.nome || createdMateriaNome;

  const titulo = livro?.Tema || "Carregando...";
  const capaUrl = livro?.["Capa-livro"];
  const totalTopicos = topicos?.length || 0;
  const isLoading = loadingLivro || loadingMateria;

  const filteredTopicos = useMemo(() => {
    if (!topicos) return [];
    if (!searchTerm.trim()) return topicos;
    const term = searchTerm.toLowerCase().trim();
    return topicos.filter(t => t.titulo.toLowerCase().includes(term));
  }, [topicos, searchTerm]);

  // For non-admin: only show completed topics
  const visibleTopicos = useMemo(() => {
    if (isAdmin) return filteredTopicos;
    return filteredTopicos.filter(t => t.status === "concluido");
  }, [filteredTopicos, isAdmin]);

  return (
    <div className="min-h-screen bg-[#0d0d14] relative overflow-hidden">
      {/* Header */}
      <div className="pt-6 pb-4 px-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate(`/aulas/area/${encodeURIComponent(areaDecoded)}`)}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start gap-4">
              {capaUrl ? (
                <img src={capaUrl} alt={titulo} className="w-14 h-14 rounded-xl object-cover shadow-lg flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Scale className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <span className="text-xs font-mono text-red-400">{areaDecoded}</span>
                <h1 className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {titulo}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {totalTopicos} tópico{totalTopicos !== 1 ? 's' : ''}
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
            <span>{totalTopicos} tópicos</span>
          </div>
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-yellow-400" />
            <span>{concluidos} concluídos</span>
          </div>
        </div>

        {/* Generation banner */}
        {isGenerating && currentGeneratingTitle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 bg-gradient-to-r from-amber-900/40 to-amber-800/30 border border-amber-500/30 rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-sm text-white truncate">Gerando: {currentGeneratingTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={currentProgress} className="h-2 flex-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500" />
              <span className="text-sm font-bold text-amber-400 min-w-[40px] text-right">{currentProgress}%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{concluidos} de {totalTopicosGerados} concluídos • {pendentes} pendentes</p>
          </motion.div>
        )}
      </div>

      {/* Admin: Add PDF button */}
      {isAdmin && (
        <div className="px-4 pb-4">
          <div className="max-w-lg mx-auto">
            <Button onClick={handleAddPdf} className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
              <Plus className="w-4 h-4 mr-2" />
              {categoriaMateria ? "Reprocessar PDF" : "Adicionar PDF"}
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      {totalTopicos > 0 && (
        <div className="px-4 pb-4">
          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar tópico..."
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
      )}

      {/* Timeline */}
      {isLoading || loadingTopicos ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : visibleTopicos.length > 0 ? (
        <div className="px-4 pb-32 pt-4">
          <div className="max-w-lg mx-auto relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
              <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
              <motion.div
                className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
                animate={{ y: ["0%", "300%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div className="space-y-6">
              {visibleTopicos.map((topico, index) => {
                const isLeft = index % 2 === 0;
                const status = getTopicoStatus(topico.id);

                return (
                  <motion.div
                    key={topico.id}
                    initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative flex items-center ${isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'}`}
                  >
                    {/* Center marker */}
                    <div className="absolute left-1/2 -translate-x-1/2 z-10">
                      <motion.div
                        animate={{
                          scale: [1, 1.15, 1],
                          boxShadow: ["0 0 0 0 rgba(239, 68, 68, 0.4)", "0 0 0 10px rgba(239, 68, 68, 0)", "0 0 0 0 rgba(239, 68, 68, 0.4)"]
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/40"
                      >
                        <Footprints className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>

                    {/* Card */}
                    <div className="w-full">
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (topico.status === "concluido") {
                            navigate(`/categorias/topico/${topico.id}`);
                          }
                        }}
                        className={`cursor-pointer rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border transition-all overflow-hidden min-h-[140px] flex flex-col ${
                          topico.status === "concluido" ? "border-white/10 hover:border-red-500/50" : "border-white/5 opacity-70"
                        }`}
                      >
                        {/* Cover */}
                        <div className="h-16 w-full overflow-hidden relative flex-shrink-0">
                          {topico.capa_url ? (
                            <>
                              <img src={topico.capa_url} alt={topico.titulo} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                            </>
                          ) : capaUrl ? (
                            <>
                              <img src={capaUrl} alt={topico.titulo} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center">
                              <Scale className="w-6 h-6 text-white/30" />
                            </div>
                          )}
                          {/* Status badge */}
                          {status.status === "gerando" && (
                            <div className="absolute top-1 right-1 px-2 py-0.5 bg-amber-500/80 rounded-full text-[9px] font-bold text-white">
                              Gerando {status.progresso}%
                            </div>
                          )}
                          {status.status === "concluido" && (
                            <div className="absolute top-1 right-1 px-2 py-0.5 bg-green-500/80 rounded-full text-[9px] font-bold text-white">
                              ✓ Pronto
                            </div>
                          )}
                          {status.status === "pendente" && (
                            <div className="absolute top-1 right-1 px-2 py-0.5 bg-gray-500/60 rounded-full text-[9px] font-bold text-white">
                              Pendente
                            </div>
                          )}
                          <div className="absolute bottom-1 left-2">
                            <p className="text-[10px] text-red-400 font-semibold drop-shadow-lg">Tópico {topico.ordem}</p>
                          </div>
                        </div>

                        <div className="p-2.5 flex-1 flex flex-col">
                          <h3 className="font-medium text-xs leading-snug text-white line-clamp-2">{topico.titulo}</h3>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ) : !categoriaMateria ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <FileText className="w-16 h-16 text-red-500/30 mb-4" />
          <p className="text-gray-400 mb-2">Nenhum conteúdo disponível</p>
          {isAdmin && <p className="text-sm text-gray-500">Use o botão acima para adicionar um PDF</p>}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <Scale className="w-16 h-16 text-red-500/30 mb-4" />
          <p className="text-gray-400 mb-2">Nenhum tópico encontrado</p>
          {isAdmin && <p className="text-sm text-gray-500">Reprocesse o PDF para extrair os tópicos</p>}
        </div>
      )}

      {/* Floating reprocess button */}
      {isAdmin && categoriaMateria && topicos && topicos.length > 0 && (
        <div className="fixed bottom-20 right-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowPdfModal(true)}
            className="rounded-full w-12 h-12 bg-[#12121a]/90 border-red-500/30 hover:border-red-500 hover:bg-red-500/10"
            title="Reprocessar PDF"
          >
            <RefreshCw className="w-5 h-5 text-red-400" />
          </Button>
        </div>
      )}

      {/* PDF Modal */}
      {activeMateriaId && (
        <CategoriasPdfProcessorModal
          open={showPdfModal}
          onOpenChange={setShowPdfModal}
          materiaId={activeMateriaId}
          materiaNome={activeMateriaNome}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["area-categoria-topicos"] });
            queryClient.invalidateQueries({ queryKey: ["area-categoria-materia"] });
          }}
        />
      )}
    </div>
  );
};

export default AreaMateriaTrilhaPage;
