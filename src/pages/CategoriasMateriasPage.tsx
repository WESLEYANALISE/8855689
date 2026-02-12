import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Scale, Footprints, Sparkles, Search, X, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCategoriasAutoGeneration } from "@/hooks/useCategoriasAutoGeneration";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { OABPdfProcessorModal } from "@/components/oab/OABPdfProcessorModal";
import { CategoriasBottomNav } from "@/components/categorias/CategoriasBottomNav";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const CategoriasMateriasPage = () => {
  const { categoria } = useParams<{ categoria: string }>();
  const categoriaDecoded = categoria ? decodeURIComponent(categoria) : "";
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Redirect non-admin
  useEffect(() => {
    if (user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin, navigate]);

  // Buscar matérias desta categoria
  const { data: materias, isLoading } = useQuery({
    queryKey: ["categorias-materias", categoriaDecoded],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_materias")
        .select("*")
        .eq("categoria", categoriaDecoded)
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return data || [];
    },
    enabled: !!categoriaDecoded,
    staleTime: Infinity,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasGenerating = data?.some((m: any) => m.status_processamento === "processando");
      return hasGenerating ? 5000 : false;
    },
  });

  // Buscar tópicos por matéria
  const { data: topicos } = useQuery({
    queryKey: ["categorias-topicos-all", categoriaDecoded],
    queryFn: async () => {
      if (!materias || materias.length === 0) return [];
      const ids = materias.map(m => m.id);
      const { data, error } = await supabase
        .from("categorias_topicos")
        .select("*")
        .in("materia_id", ids)
        .order("ordem");
      if (error) throw error;
      return data || [];
    },
    enabled: !!materias && materias.length > 0,
    staleTime: Infinity,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasGenerating = data?.some((t: any) => t.status === "gerando" || t.status === "na_fila");
      return hasGenerating ? 5000 : false;
    },
  });

  const filteredMaterias = useMemo(() => {
    if (!materias) return [];
    if (!searchTerm.trim()) return materias;
    const term = searchTerm.toLowerCase().trim();
    return materias.filter(m => m.nome.toLowerCase().includes(term));
  }, [materias, searchTerm]);

  const totalMaterias = materias?.length || 0;
  const totalTopicos = topicos?.length || 0;

  // Handle PDF processed - create materia
  const handlePdfProcessed = async (result: any) => {
    if (!result || !categoriaDecoded) return;
    
    try {
      const { data: newMateria, error } = await supabase
        .from("categorias_materias")
        .insert({
          categoria: categoriaDecoded,
          nome: result.titulo || "Nova Matéria",
          descricao: result.descricao || "",
          pdf_url: result.pdfUrl,
          total_paginas: result.totalPaginas,
          temas_identificados: result.temas,
          status_processamento: "processado",
          ordem: totalMaterias + 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Criar tópicos a partir dos temas identificados
      if (result.temas && Array.isArray(result.temas) && newMateria) {
        const topicosToInsert = result.temas.map((tema: any, idx: number) => ({
          materia_id: newMateria.id,
          titulo: tema.titulo || tema,
          ordem: idx + 1,
          pagina_inicial: tema.paginaInicial,
          pagina_final: tema.paginaFinal,
          status: "pendente",
        }));

        await supabase.from("categorias_topicos").insert(topicosToInsert);

        // Inserir páginas extraídas
        if (result.paginas && Array.isArray(result.paginas)) {
          const paginasToInsert = [];
          for (const topicoCriado of topicosToInsert) {
            const paginasDoTopico = result.paginas.filter(
              (p: any) => p.pagina >= (topicoCriado.pagina_inicial || 0) && p.pagina <= (topicoCriado.pagina_final || 9999)
            );
            // We need to get the actual inserted topic IDs
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["categorias-materias"] });
      queryClient.invalidateQueries({ queryKey: ["categorias-topicos-all"] });
      toast.success("Matéria adicionada com sucesso!");
    } catch (err) {
      console.error("Erro ao criar matéria:", err);
      toast.error("Erro ao criar matéria");
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0d0d14] relative overflow-hidden">
      {/* Header */}
      <div className="pt-6 pb-4 px-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/")}
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
                <span className="text-xs font-mono text-red-400">Categorias do Direito</span>
                <h1 className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {categoriaDecoded}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {totalMaterias} matéria{totalMaterias !== 1 ? 's' : ''} · {totalTopicos} tópico{totalTopicos !== 1 ? 's' : ''}
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
            <span>{totalTopicos} tópicos</span>
          </div>
        </div>
      </div>

      {/* Admin: Add PDF */}
      {isAdmin && (
        <div className="px-4 pb-4">
          <div className="max-w-lg mx-auto">
            <Button
              onClick={() => setShowPdfModal(true)}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Matéria (PDF)
            </Button>
          </div>
        </div>
      )}

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

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : filteredMaterias.length > 0 ? (
        <div className="px-4 pb-32 pt-4">
          <div className="max-w-lg mx-auto relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
              <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
              <motion.div
                className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
                animate={{ y: ["0%", "300%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div className="space-y-6">
              {filteredMaterias.map((materia, index) => {
                const isLeft = index % 2 === 0;
                const materiaTopicos = topicos?.filter(t => t.materia_id === materia.id) || [];
                const concluidos = materiaTopicos.filter(t => t.status === "concluido").length;
                const progressoPercent = materiaTopicos.length > 0 ? Math.round((concluidos / materiaTopicos.length) * 100) : 0;

                return (
                  <motion.div
                    key={materia.id}
                    initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative flex items-center ${isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'}`}
                  >
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

                    <div className="w-full">
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/categorias/materia/${materia.id}`)}
                        className="cursor-pointer rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border border-white/10 hover:border-red-500/50 transition-all overflow-hidden min-h-[160px] flex flex-col"
                      >
                        <div className="h-16 w-full overflow-hidden relative flex-shrink-0">
                          {materia.capa_url ? (
                            <>
                              <img src={materia.capa_url} alt={materia.nome} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center">
                              <Scale className="w-6 h-6 text-white/30" />
                            </div>
                          )}
                          <div className="absolute bottom-1 left-2">
                            <p className="text-[10px] text-red-400 font-semibold drop-shadow-lg">
                              Matéria {materia.ordem}
                            </p>
                          </div>
                        </div>

                        <div className="p-2.5 flex-1 flex flex-col">
                          <h3 className="font-medium text-xs leading-snug text-white line-clamp-2">{materia.nome}</h3>
                          <div className="flex items-center gap-1 mt-1.5">
                            <BookOpen className="w-3 h-3 text-yellow-400" />
                            <span className="text-[10px] text-yellow-400 font-medium">{materiaTopicos.length} tópicos</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[9px] text-gray-500">Progresso</span>
                              <span className="text-[9px] text-green-400 font-medium">{progressoPercent}%</span>
                            </div>
                            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: `${progressoPercent}%` }} />
                            </div>
                          </div>
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
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <Scale className="w-16 h-16 text-red-500/30 mb-4" />
          <p className="text-gray-400 mb-2">Nenhuma matéria cadastrada</p>
          <p className="text-sm text-gray-500">Use o botão acima para adicionar um PDF</p>
        </div>
      )}

      <CategoriasBottomNav activeTab="aulas" />

      {showPdfModal && (
      <OABPdfProcessorModal
          open={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          onProcessed={handlePdfProcessed}
          materiaName={categoriaDecoded}
        />
      )}
    </div>
  );
};

export default CategoriasMateriasPage;
