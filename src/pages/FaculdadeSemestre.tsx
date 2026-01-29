import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, BookOpen, Clock, ArrowLeft, Loader2, Footprints, Sparkles, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import salaAulaImage from "@/assets/sala-aula-direito.webp";

// Preload image
const preloadImage = new Image();
preloadImage.src = salaAulaImage;

const DEPARTAMENTO_CORES: Record<string, { bg: string; text: string; border: string }> = {
  "Direito Civil": { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
  "Direito do Estado": { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/30" },
  "Filosofia e Teoria Geral do Direito": { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/30" },
  "Direito Econômico e Financeiro": { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" },
};

const FaculdadeSemestre = () => {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const semestreNum = parseInt(numero || "1");

  const { data: disciplinas, isLoading } = useQuery({
    queryKey: ["faculdade-disciplinas", semestreNum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculdade_disciplinas")
        .select("*")
        .eq("semestre", semestreNum)
        .eq("ativo", true)
        .order("codigo");

      if (error) throw error;
      return data;
    },
  });

  // Buscar contagem de tópicos por disciplina
  const { data: topicosCount } = useQuery({
    queryKey: ["faculdade-topicos-count", disciplinas?.map(d => d.id)],
    queryFn: async () => {
      if (!disciplinas || disciplinas.length === 0) return {};
      
      const counts: Record<number, number> = {};
      for (const disc of disciplinas) {
        const { count } = await supabase
          .from("faculdade_topicos")
          .select("*", { count: "exact", head: true })
          .eq("disciplina_id", disc.id);
        counts[disc.id] = count || 0;
      }
      return counts;
    },
    enabled: !!disciplinas && disciplinas.length > 0,
  });

  // Mutation para gerar capa
  const gerarCapaMutation = useMutation({
    mutationFn: async ({ disciplinaId, nome }: { disciplinaId: number; nome: string }) => {
      const { data, error } = await supabase.functions.invoke('gerar-capa-disciplina', {
        body: { disciplinaId, nome }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Capa gerada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['faculdade-disciplinas'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao gerar capa: ${error.message}`);
    }
  });

  const handleGerarCapa = (e: React.MouseEvent, disciplinaId: number, nome: string) => {
    e.stopPropagation();
    toast.info('Gerando capa com IA...', { duration: 5000 });
    gerarCapaMutation.mutate({ disciplinaId, nome });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${salaAulaImage})` }}
      />
      
      {/* Dark gradient overlay - less opaque to show image */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-black/75 to-black/90" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate("/faculdade/trilhas")}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                <span className="text-xl font-bold text-white">{semestreNum}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{semestreNum}º Semestre</h1>
                <p className="text-sm text-neutral-400">
                  {disciplinas?.length || 0} disciplinas
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Timeline de Disciplinas */}
        <div className="px-4 pb-24 pt-8">
          <div className="max-w-lg mx-auto relative">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : (
              <>
                {/* Linha central da timeline */}
                {disciplinas && disciplinas.length > 0 && (
                  <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
                    <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
                    {/* Animação de fluxo elétrico */}
                    <motion.div
                      className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
                      animate={{ y: ["0%", "300%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                )}

                <div className="space-y-6">
                  {disciplinas?.map((disciplina, index) => {
                    const cores = DEPARTAMENTO_CORES[disciplina.departamento || ""] || 
                      { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" };
                    const totalTopicos = topicosCount?.[disciplina.id] || 0;
                    const isLeft = index % 2 === 0;
                    
                    return (
                      <motion.div
                        key={disciplina.id}
                        initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
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
                                "0 0 0 0 rgba(239, 68, 68, 0)"
                              ]
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity,
                              delay: index * 0.3
                            }}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/40"
                          >
                            <Footprints className="w-5 h-5 text-white" />
                          </motion.div>
                        </div>
                        
                        {/* Card da Disciplina */}
                        <button
                          onClick={() => navigate(`/faculdade/disciplina/${disciplina.codigo}`)}
                          className="w-full text-left"
                        >
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="rounded-2xl bg-neutral-800/90 backdrop-blur-sm border border-neutral-700/50 hover:border-neutral-600 transition-all overflow-hidden"
                          >
                            {/* Capa da Disciplina */}
                            {disciplina.url_capa ? (
                              <div className="relative h-24 w-full">
                                <img 
                                  src={disciplina.url_capa} 
                                  alt={disciplina.nome}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-800/90 to-transparent" />
                              </div>
                            ) : (
                              <button
                                onClick={(e) => handleGerarCapa(e, disciplina.id, disciplina.nome)}
                                disabled={gerarCapaMutation.isPending}
                                className="relative h-20 w-full bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 flex items-center justify-center gap-2 hover:from-red-900/30 hover:to-neutral-800/50 transition-all group"
                              >
                                {gerarCapaMutation.isPending && gerarCapaMutation.variables?.disciplinaId === disciplina.id ? (
                                  <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                                    <span className="text-xs text-neutral-400 group-hover:text-neutral-300">Gerar capa com IA</span>
                                  </>
                                )}
                              </button>
                            )}
                            
                            <div className={`p-4 ${disciplina.url_capa ? 'pt-2' : ''}`}>
                              <span className="text-xs text-red-500 font-medium mb-1.5 block">
                                Disciplina {index + 1}
                              </span>
                              <h3 className="font-medium text-[13px] leading-snug text-white">
                                {disciplina.nome}
                              </h3>
                              <div className="flex items-center gap-3 text-xs text-neutral-400 mt-2">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {totalTopicos} tópicos
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {disciplina.carga_horaria}h
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
            
            {!isLoading && (!disciplinas || disciplinas.length === 0) && (
              <div className="text-center py-12 text-neutral-400">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma disciplina encontrada</p>
                <p className="text-sm">Execute o seed para popular os dados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaculdadeSemestre;
