import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, ChevronRight, BookOpen, ArrowLeft, Loader2, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const FaculdadeDisciplina = () => {
  const {
    codigo
  } = useParams<{
    codigo: string;
  }>();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();

  // Buscar disciplina
  const {
    data: disciplina,
    isLoading: loadingDisciplina
  } = useQuery({
    queryKey: ["faculdade-disciplina", codigo],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("faculdade_disciplinas").select("*").eq("codigo", codigo).single();
      if (error) throw error;
      return data;
    }
  });

  // Buscar tópicos
  const {
    data: topicos,
    isLoading: loadingTopicos
  } = useQuery({
    queryKey: ["faculdade-topicos", disciplina?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("faculdade_topicos").select("*").eq("disciplina_id", disciplina!.id).order("ordem");
      if (error) throw error;
      return data;
    },
    enabled: !!disciplina?.id
  });

  // Buscar progresso do usuário
  const {
    data: progresso
  } = useQuery({
    queryKey: ["faculdade-progresso", user?.id, topicos?.map(t => t.id)],
    queryFn: async () => {
      if (!user?.id || !topicos) return [];
      const {
        data,
        error
      } = await supabase.from("faculdade_progresso").select("topico_id, concluido").eq("user_id", user.id).in("topico_id", topicos.map(t => t.id));
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!topicos && topicos.length > 0
  });
  const progressoMap = new Map(progresso?.map(p => [p.topico_id, p.concluido]) || []);
  const concluidosCount = progresso?.filter(p => p.concluido).length || 0;
  const totalTopicos = topicos?.length || 0;
  const percentualProgresso = totalTopicos > 0 ? Math.round(concluidosCount / totalTopicos * 100) : 0;
  const isLoading = loadingDisciplina || loadingTopicos;
  
  return <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header local da página */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <button 
            onClick={() => navigate(disciplina?.semestre ? `/faculdade/semestre/${disciplina.semestre}` : '/faculdade')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-wider opacity-70">Voltar</span>
              <span className="text-sm font-medium text-foreground">{disciplina?.semestre ? `${disciplina.semestre}º Semestre` : 'Faculdade'}</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Header - reduced top padding */}
      <div className="pt-4 pb-4 px-4">
        <div className="max-w-lg mx-auto">
          
          
          {disciplina && <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg flex-shrink-0">
                  <GraduationCap className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {disciplina.codigo}
                  </span>
                  <h1 className="text-lg font-bold mt-1">{disciplina.nome}</h1>
                </div>
              </div>
              
              {/* Barra de progresso */}
              {totalTopicos > 0 && <div className="bg-card rounded-xl p-4 border border-border mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Seu progresso</span>
                    <span className="text-sm font-medium">{concluidosCount}/{totalTopicos}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{
                width: 0
              }} animate={{
                width: `${percentualProgresso}%`
              }} transition={{
                duration: 0.5
              }} className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full" />
                  </div>
                </div>}
              
              {disciplina.ementa && <p className="text-sm text-muted-foreground line-clamp-2">
                  {disciplina.ementa}
                </p>}
            </motion.div>}
        </div>
      </div>

      {/* Lista de Tópicos */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Conteúdo Programático
          </h2>
          
          {isLoading ? <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div> : <div className="space-y-2">
              {topicos?.map((topico, index) => {
            const concluido = progressoMap.get(topico.id) || false;
            const temConteudo = topico.status === "concluido";
            return <motion.button key={topico.id} initial={{
              opacity: 0,
              y: 10
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: index * 0.02
            }} onClick={() => navigate(`/faculdade/topico/${topico.id}`)} className={`w-full text-left p-4 rounded-xl border transition-all min-h-[88px] ${concluido ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:border-primary/50"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${concluido ? "bg-primary text-primary-foreground" : "bg-red-900/40 text-red-400 border border-red-700/50"}`}>
                        {concluido ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{topico.ordem}</span>}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-medium leading-snug ${concluido ? "text-primary" : ""}`}>
                          {topico.titulo}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          {temConteudo ? <span className="text-xs text-green-500 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Conteúdo disponível
                            </span> : <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Gerar ao acessar
                            </span>}
                        </div>
                      </div>
                      
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </motion.button>;
          })}
            </div>}
          
          {!isLoading && (!topicos || topicos.length === 0) && <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum tópico encontrado</p>
            </div>}
        </div>
      </div>
    </div>;
};
export default FaculdadeDisciplina;