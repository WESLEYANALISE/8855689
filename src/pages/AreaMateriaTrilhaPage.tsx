import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Scale, ChevronRight, CheckCircle, Search, X, FileText, RefreshCw, Plus, ImageIcon, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
    staleTime: 5000,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasGenerating = data?.some((t: any) => t.status === "gerando" || t.status === "na_fila" || t.status === "pendente");
      return hasGenerating ? 5000 : false;
    },
  });

  // Buscar progresso do usuário para cada tópico
  const { data: progressoUsuario } = useQuery({
    queryKey: ["categorias-progresso-all", categoriaMateria?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !topicos) return {};
      const topicoIds = topicos.map(t => t.id);
      const { data, error } = await supabase
        .from("categorias_progresso")
        .select("topico_id, leitura_concluida, flashcards_concluidos, questoes_concluidas")
        .eq("user_id", user.id)
        .in("topico_id", topicoIds);
      if (error) return {};
      const map: Record<number, { leitura: boolean; flashcards: boolean; questoes: boolean }> = {};
      data?.forEach(p => {
        map[p.topico_id] = {
          leitura: p.leitura_concluida || false,
          flashcards: p.flashcards_concluidos || false,
          questoes: p.questoes_concluidas || false,
        };
      });
      return map;
    },
    enabled: !!user?.id && !!topicos && topicos.length > 0,
    staleTime: 1000 * 30,
  });

  // Auto-generation
  const {
    isGenerating,
    currentGeneratingTitle,
    currentProgress,
    totalTopicos: totalTopicosGerados,
    concluidos,
    pendentes,
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

  // Calcular totais de progresso
  const totalPaginas = topicos?.reduce((acc, t) => {
    if (!t.conteudo_gerado) return acc;
    const conteudo = typeof t.conteudo_gerado === 'string' ? JSON.parse(t.conteudo_gerado) : t.conteudo_gerado;
    return acc + (conteudo?.secoes?.reduce((a: number, s: any) => a + (s.slides?.length || 0), 0) || 0);
  }, 0) || 0;

  const topicosConcluidosUsuario = Object.values(progressoUsuario || {}).filter(p => p.leitura).length;

  if (isLoading && !livro) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Header sticky */}
      <div className="sticky top-0 z-20 bg-[#0d0d14]/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <button
            onClick={() => navigate(`/aulas/area/${encodeURIComponent(areaDecoded)}`)}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>
      </div>

      {/* Header com Capa de Fundo */}
      <div className="relative">
        <div className="absolute inset-0 h-48 overflow-hidden">
          {capaUrl ? (
            <img src={capaUrl} alt={titulo} className="w-full h-full object-cover" loading="eager" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-900 to-red-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d14]/60 via-[#0d0d14]/80 to-[#0d0d14]" />
        </div>

        <div className="relative z-10 px-4 pt-6 pb-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/30 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <BookOpen className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-mono text-red-400">{areaDecoded}</span>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {titulo}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{totalTopicos} aulas</span>
                  <span className="text-gray-600">•</span>
                  <div className="flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    <span>{totalPaginas} páginas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info - Progresso */}
            <div className="rounded-xl p-3 bg-neutral-800/80 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-red-400" />
                    <span>{totalTopicos} aulas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>{topicosConcluidosUsuario} concluídos</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{totalTopicos - topicosConcluidosUsuario} restantes</span>
              </div>

              <Progress
                value={totalTopicos > 0 ? (topicosConcluidosUsuario / totalTopicos) * 100 : 0}
                className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-rose-500"
              />

            </div>
          </div>
        </div>
      </div>

      {/* Banner de geração */}
      {isGenerating && currentGeneratingTitle && (
        <div className="px-4 py-2">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/30 border border-red-500/30">
              <Loader2 className="w-4 h-4 animate-spin text-red-400" />
              <span className="text-xs text-gray-300 truncate">Gerando: {currentGeneratingTitle}</span>
            </div>
          </div>
        </div>
      )}


      {/* Label Conteúdo */}
      <div className="px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2 text-gray-400">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">Conteúdo Programático</span>
        </div>
      </div>

      {/* Lista de Tópicos */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto space-y-3">
          {loadingTopicos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : topicos && topicos.length > 0 ? (
            topicos.map((topico, index) => {
              const status = getTopicoStatus(topico.id);
              const progresso = progressoUsuario?.[topico.id];
              const leituraCompleta = progresso?.leitura || false;
              const hasConteudo = status.status === "concluido";
              const isGerando = status.status === "gerando";

              return (
                <motion.button
                  key={topico.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => navigate(`/categorias/topico/${topico.id}`)}
                  className={`w-full text-left bg-neutral-800 rounded-xl border overflow-hidden transition-all group ${
                    isGerando
                      ? "border-red-500/50 bg-red-900/20"
                      : "border-white/10 hover:border-red-500/30"
                  }`}
                >
                  <div className="flex items-center">
                    {/* Capa */}
                    <div className="w-20 h-20 flex-shrink-0 relative bg-neutral-900 overflow-hidden rounded-l-xl">
                      {topico.capa_url ? (
                        <img src={topico.capa_url} alt={topico.titulo} className="absolute inset-[-10%] w-[120%] h-[120%] object-cover" loading="eager" />
                      ) : capaUrl ? (
                        <img src={capaUrl} alt={topico.titulo} className="absolute inset-[-10%] w-[120%] h-[120%] object-cover" loading="eager" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/50 to-rose-900/50">
                          <ImageIcon className="w-6 h-6 text-red-500/50" />
                        </div>
                      )}
                      {/* Badge do número */}
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-xs font-bold bg-red-600 text-white">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      {/* Indicador de geração */}
                      {isGerando && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-red-400" />
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 p-3 flex flex-col justify-center min-h-[80px] relative">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-white transition-colors text-sm flex-1 pr-2 line-clamp-2 group-hover:text-red-400">
                          {topico.titulo?.toLowerCase().replace(/(?:^|\s)\S/g, (l) => l.toUpperCase())}
                        </h3>
                        {leituraCompleta ? (
                          <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 flex-shrink-0 text-red-500/50" />
                        )}
                      </div>

                      {/* Progresso geral */}
                      {hasConteudo && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">progresso</span>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all bg-gradient-to-r from-red-500 to-rose-500"
                              style={{ width: `${Math.round(((progresso?.leitura ? 1 : 0) + (progresso?.flashcards ? 1 : 0) + (progresso?.questoes ? 1 : 0)) / 3 * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500">{Math.round(((progresso?.leitura ? 1 : 0) + (progresso?.flashcards ? 1 : 0) + (progresso?.questoes ? 1 : 0)) / 3 * 100)}%</span>
                        </div>
                      )}

                      {/* Status de geração */}
                      {isGerando && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                          <span className="text-[10px] text-amber-400">Gerando {status.progresso}%</span>
                        </div>
                      )}
                      {status.status === "pendente" && (
                        <span className="text-[10px] text-gray-500 mt-1">Pendente</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })
          ) : !categoriaMateria ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-16 h-16 text-red-500/30 mb-4" />
              <p className="text-gray-400 mb-2">Nenhum conteúdo disponível</p>
              {isAdmin && (
                <div className="flex items-center gap-3 mt-4">
                  <Button onClick={handleAddPdf} className="bg-red-600 hover:bg-red-700 gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar PDF
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Scale className="w-16 h-16 text-red-500/30 mb-4" />
              <p className="text-gray-400 mb-2">Nenhum tópico encontrado</p>
              {isAdmin && (
                <div className="flex items-center gap-3 mt-4">
                  <Button onClick={() => setShowPdfModal(true)} className="bg-red-600 hover:bg-red-700 gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Reprocessar PDF
                  </Button>
                  <Button onClick={handleAddPdf} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2">
                    <Plus className="w-4 h-4" />
                    Novo PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
