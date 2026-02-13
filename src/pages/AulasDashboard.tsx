import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, BookOpen, PlayCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

const AulasDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: progressoConceitos } = useQuery({
    queryKey: ["dashboard-progresso-conceitos", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("conceitos_topicos_progresso")
        .select("*, conceitos_topicos(titulo, materia_id, conceitos_materias(nome))")
        .eq("user_id", user.id)
        .eq("leitura_completa", false)
        .gt("progresso_porcentagem", 0)
        .order("updated_at", { ascending: false });
      return (data || []).map((item: any) => ({
        id: item.id,
        nome: item.conceitos_topicos?.titulo || "Tópico",
        area: "Conceitos",
        materia: item.conceitos_topicos?.conceitos_materias?.nome || "",
        progresso: item.progresso_porcentagem || 0,
        tipo: "conceitos" as const,
        topicoId: item.topico_id,
      }));
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!user?.id,
  });

  const { data: progressoAulas } = useQuery({
    queryKey: ["dashboard-progresso-aulas", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("aulas_progresso")
        .select("*, aulas_interativas(titulo, area, tema)")
        .eq("user_id", user.id)
        .eq("concluida", false)
        .gt("progresso_percentual", 0)
        .order("updated_at", { ascending: false });
      return (data || []).map((item: any) => ({
        id: item.id,
        nome: item.aulas_interativas?.titulo || "Aula",
        area: item.aulas_interativas?.area || "",
        materia: item.aulas_interativas?.tema || "",
        progresso: item.progresso_percentual || 0,
        tipo: "aula" as const,
        aulaId: item.aula_id,
      }));
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!user?.id,
  });

  const todos = [...(progressoConceitos || []), ...(progressoAulas || [])];

  const handleClick = (item: any) => {
    if (item.tipo === "conceitos") {
      navigate(`/conceitos/topico/${item.topicoId}`);
    } else {
      navigate(`/aula/${item.aulaId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/?tab=aulas")} className="p-1">
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <h1 className="font-semibold text-base">Seu Progresso</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-3">
        {todos.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-sm">Nenhuma aula em andamento</p>
            <p className="text-white/25 text-xs mt-1">Comece uma aula para acompanhar seu progresso aqui</p>
          </div>
        ) : (
          todos.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleClick(item)}
              className="w-full bg-white/5 border border-white/8 rounded-2xl p-4 text-left hover:bg-white/8 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="bg-amber-500/20 rounded-xl p-2 mt-0.5">
                  <PlayCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-white line-clamp-2">{item.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full">{item.area}</span>
                    {item.materia && (
                      <span className="text-[10px] text-white/40 truncate">{item.materia}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2.5">
                    <Progress
                      value={item.progresso}
                      className="h-1.5 flex-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500"
                    />
                    <span className="text-xs text-amber-400 font-semibold w-10 text-right">
                      {Math.round(item.progresso)}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

export default AulasDashboard;
