import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Crown, ImageIcon, Footprints, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const DominandoArea = () => {
  const { areaNome } = useParams<{ areaNome: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  
  const decodedAreaNome = areaNome ? decodeURIComponent(areaNome) : null;

  // Buscar info da área
  const { data: areaInfo } = useQuery({
    queryKey: ["dominando-area-info", decodedAreaNome],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dominando_areas")
        .select("*")
        .eq("nome", decodedAreaNome!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!decodedAreaNome,
  });

  // Buscar disciplinas (livros) da área da BIBLIOTECA-ESTUDOS
  const { data: disciplinas, isLoading } = useQuery({
    queryKey: ["dominando-disciplinas", decodedAreaNome],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("*")
        .eq("Área", decodedAreaNome!)
        .order("Ordem", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!decodedAreaNome,
  });

  // Buscar total de áreas
  const { data: totalAreas } = useQuery({
    queryKey: ["dominando-total-areas"],
    queryFn: async () => {
      const { count } = await supabase
        .from("dominando_areas")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true);
      return count || 0;
    },
  });

  const handleGerarCapa = async (disciplinaId: number, tema: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingId(disciplinaId);
    
    try {
      const { data, error } = await supabase.functions.invoke('gerar-capa-dominando-area', {
        body: { 
          disciplinaId,
          disciplinaNome: tema,
          areaNome: decodedAreaNome
        }
      });
      
      if (error) throw error;
      
      toast.success("Capa gerada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["dominando-disciplinas", decodedAreaNome] });
    } catch (err: any) {
      console.error("Erro ao gerar capa:", err);
      toast.error("Erro ao gerar capa: " + (err.message || "Tente novamente"));
    } finally {
      setGeneratingId(null);
    }
  };

  const totalDisciplinas = disciplinas?.length || 0;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0d0d14]">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-red-950/30 via-[#0d0d14] to-[#0d0d14]" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button 
              onClick={() => navigate('/dominando/trilhas')}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            
            {areaInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-red-400">
                      Área {areaInfo.ordem} de {totalAreas || '...'}
                    </span>
                    <h1 className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                      {areaInfo.nome}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                      {totalDisciplinas} disciplinas
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-400" />
              <span>{totalDisciplinas} disciplinas</span>
            </div>
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-yellow-400" />
              <span>Estude na ordem</span>
            </div>
          </div>
        </div>

        {/* Timeline de Disciplinas */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : disciplinas && disciplinas.length > 0 ? (
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
                {disciplinas.map((disciplina, index) => {
                  const isLeft = index % 2 === 0;
                  const temCapa = !!(disciplina.url_capa_gerada || disciplina["Capa-livro"]);
                  const capaUrl = disciplina.url_capa_gerada || disciplina["Capa-livro"];
                  const isGenerating = generatingId === disciplina.id;
                  
                  return (
                    <motion.div
                      key={disciplina.id}
                      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative flex items-center ${
                        isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                      }`}
                    >
                      {/* Marcador Pegada no centro */}
                      <div className="absolute left-1/2 -translate-x-1/2 z-10">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.15, 1],
                            boxShadow: [
                              "0 0 0 0 rgba(239, 68, 68, 0.4)",
                              "0 0 0 10px rgba(239, 68, 68, 0)",
                              "0 0 0 0 rgba(239, 68, 68, 0.4)"
                            ]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: index * 0.2
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/40"
                        >
                          <Footprints className="w-5 h-5 text-white" />
                        </motion.div>
                      </div>
                      
                      {/* Card da Disciplina */}
                      <div className="w-full">
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/dominando/estudo/${disciplina.id}`)}
                          className="cursor-pointer rounded-2xl backdrop-blur-sm border transition-all overflow-hidden min-h-[180px] flex flex-col bg-[#12121a]/90 border-white/10 hover:border-red-500/50"
                        >
                          {/* Capa */}
                          <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
                            {temCapa ? (
                              <>
                                <img 
                                  src={capaUrl!} 
                                  alt={disciplina.Tema || ''}
                                  className="w-full h-full object-cover"
                                  loading="eager"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800 to-red-900">
                                <button
                                  onClick={(e) => handleGerarCapa(disciplina.id, disciplina.Tema || '', e)}
                                  disabled={isGenerating}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-xs font-medium transition-colors disabled:opacity-50 bg-red-600/80 hover:bg-red-600"
                                >
                                  {isGenerating ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Gerando...
                                    </>
                                  ) : (
                                    <>
                                      <ImagePlus className="w-4 h-4" />
                                      Gerar Capa
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                            
                            {/* Badge */}
                            <div className="absolute bottom-2 left-3">
                              <p className="text-xs font-semibold drop-shadow-lg text-red-400">
                                Disciplina {disciplina.Ordem || index + 1}
                              </p>
                            </div>
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="flex-1 p-3 flex flex-col">
                            <h3 className="font-medium text-[13px] leading-snug text-white">
                              {disciplina.Tema}
                            </h3>
                            
                            {disciplina.Sobre && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {disciplina.Sobre}
                              </p>
                            )}
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
          <div className="text-center py-12 text-gray-400 px-4">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50 text-red-400" />
            <p className="text-lg font-medium text-white">Nenhuma disciplina encontrada</p>
            <p className="text-xs text-gray-500 mt-1">Esta área ainda não possui disciplinas cadastradas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DominandoArea;
