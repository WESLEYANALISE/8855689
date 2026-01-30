import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Lock, BookOpen, Clock, Footprints } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import themisBackground from "@/assets/themis-estudos-background.webp";
import { InstantBackground } from "@/components/ui/instant-background";

const SEMESTRES = [
  { numero: 1, nome: "1º Semestre", disciplinas: 6, ativo: true },
  { numero: 2, nome: "2º Semestre", disciplinas: 5, ativo: true },
  { numero: 3, nome: "3º Semestre", disciplinas: 7, ativo: true },
  { numero: 4, nome: "4º Semestre", disciplinas: 6, ativo: true },
  { numero: 5, nome: "5º Semestre", disciplinas: 6, ativo: true },
  { numero: 6, nome: "6º Semestre", disciplinas: 6, ativo: true },
  { numero: 7, nome: "7º Semestre", disciplinas: 5, ativo: true },
  { numero: 8, nome: "8º Semestre", disciplinas: 3, ativo: true },
  { numero: 9, nome: "9º Semestre", disciplinas: 6, ativo: true },
  { numero: 10, nome: "10º Semestre", disciplinas: 4, ativo: true },
];

const FaculdadeInicio = () => {
  const navigate = useNavigate();

  // Buscar contagem de tópicos por semestre
  const { data: topicosCount } = useQuery({
    queryKey: ["faculdade-topicos-count-semestre"],
    queryFn: async () => {
      const counts: Record<number, number> = {};
      const semestresAtivos = SEMESTRES.filter(s => s.ativo);
      
      // Buscar todas as disciplinas ativas de uma vez
      const { data: disciplinas } = await supabase
        .from("faculdade_disciplinas")
        .select("id, semestre")
        .in("semestre", semestresAtivos.map(s => s.numero))
        .eq("ativo", true);
      
      if (!disciplinas || disciplinas.length === 0) return counts;
      
      // Buscar todos os tópicos das disciplinas
      const disciplinaIds = disciplinas.map(d => d.id);
      const { data: topicos } = await supabase
        .from("faculdade_topicos")
        .select("disciplina_id")
        .in("disciplina_id", disciplinaIds);
      
      if (!topicos) return counts;
      
      // Mapear disciplina_id para semestre
      const disciplinaSemestre = new Map(disciplinas.map(d => [d.id, d.semestre]));
      
      // Contar tópicos por semestre
      for (const topico of topicos) {
        const semestre = disciplinaSemestre.get(topico.disciplina_id);
        if (semestre) {
          counts[semestre] = (counts[semestre] || 0) + 1;
        }
      }
      
      return counts;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  return (
    <div className="min-h-screen relative">
      {/* Background Image com InstantBackground */}
      <InstantBackground
        src={themisBackground}
        alt="Themis"
        blurCategory="estudos"
        gradientClassName="bg-gradient-to-b from-black/70 via-black/60 to-black/80"
      />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
          <div className="px-4 py-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/estudos')}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Trilhas da Faculdade</h1>
              <p className="text-xs text-white/70">Grade curricular USP • 10 semestres</p>
            </div>
          </div>
        </div>

        {/* Info Stats */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-400" />
              <span>10 semestres</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400" />
              <span>5 anos</span>
            </div>
          </div>
        </div>

        {/* Timeline de Semestres */}
        <div className="px-4 pt-4 pb-24">
          <div className="max-w-lg mx-auto relative">
            {/* Linha central */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-red-600 to-red-900/50 rounded-full">
              {/* Animação de fluxo elétrico */}
              <motion.div
                className="absolute inset-0 w-full bg-gradient-to-b from-transparent via-white/30 to-transparent"
                animate={{ y: ["0%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ height: "30%" }}
              />
            </div>
            
            <div className="space-y-6">
              {SEMESTRES.map((semestre, index) => {
                const isLeft = index % 2 === 0;
                const totalTopicos = topicosCount?.[semestre.numero] || 0;
                
                return (
                  <motion.div
                    key={semestre.numero}
                    initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={`relative flex items-center ${isLeft ? 'justify-start pr-[55%]' : 'justify-end pl-[55%]'}`}
                  >
                    {/* Marcador Pegada no centro */}
                    <div className="absolute left-1/2 -translate-x-1/2 z-10">
                      <motion.div
                        animate={semestre.ativo ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          semestre.ativo 
                            ? "bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/40" 
                            : "bg-neutral-800 border border-neutral-700"
                        }`}
                      >
                        <Footprints className={`w-5 h-5 ${semestre.ativo ? 'text-white' : 'text-neutral-500'}`} />
                      </motion.div>
                    </div>
                    
                    {/* Card do Semestre */}
                    <button
                      onClick={() => semestre.ativo && navigate(`/faculdade/semestre/${semestre.numero}`)}
                      disabled={!semestre.ativo}
                      className={`w-full transition-all duration-300 ${
                        semestre.ativo
                          ? "cursor-pointer hover:scale-[1.02]"
                          : "cursor-not-allowed opacity-50"
                      }`}
                    >
                      <div 
                        className={`p-4 rounded-2xl border h-[140px] flex flex-col justify-center ${
                          semestre.ativo
                            ? "bg-gradient-to-br from-red-700 via-red-800 to-red-900 border-red-600/50 shadow-xl shadow-red-900/30"
                            : "bg-neutral-900/80 border-neutral-800"
                        }`}
                      >
                        <div className="text-center">
                          <div className={`text-3xl font-bold mb-1 ${semestre.ativo ? 'text-white' : 'text-neutral-500'}`}>
                            {semestre.numero}º
                          </div>
                          <h3 className={`font-semibold text-sm ${semestre.ativo ? 'text-white' : 'text-neutral-500'}`}>
                            Semestre
                          </h3>
                          <p className={`text-xs mt-1 ${semestre.ativo ? 'text-red-200' : 'text-neutral-600'}`}>
                            {semestre.disciplinas} disciplinas
                          </p>
                        </div>
                        
                        {semestre.ativo ? (
                          <div className="flex items-center justify-center gap-1 mt-2">
                            <BookOpen className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-yellow-400 font-medium">{totalTopicos} tópicos</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 mt-2">
                            <Lock className="w-3 h-3 text-neutral-500" />
                            <span className="text-xs text-neutral-500">Em breve</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaculdadeInicio;
