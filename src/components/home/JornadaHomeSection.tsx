import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, BookOpen, Footprints, Scale, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { SerpentineNiveis } from "@/components/shared/SerpentineNiveis";
import { useSubscription } from "@/contexts/SubscriptionContext";

const FREE_MATERIA_NAMES = [
  "história do direito",
  "historia do direito",
  "introdução ao estudo do direito",
  "introducao ao estudo do direito"
];

export const JornadaHomeSection = memo(() => {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();

  const { data: materias, isLoading } = useQuery({
    queryKey: ["conceitos-materias-trilhante"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_materias")
        .select("*")
        .eq("ativo", true)
        .order("area_ordem", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: topicosCount } = useQuery({
    queryKey: ["conceitos-topicos-count-materia"],
    queryFn: async () => {
      const counts: Record<number, number> = {};
      const { data: topicos } = await supabase.from("conceitos_topicos").select("materia_id");
      if (!topicos) return counts;
      for (const topico of topicos) {
        counts[topico.materia_id] = (counts[topico.materia_id] || 0) + 1;
      }
      return counts;
    },
    staleTime: 1000 * 60 * 5,
  });

  const totalMaterias = materias?.length || 0;
  const totalTopicos = Object.values(topicosCount || {}).reduce((a, b) => a + b, 0);

  const isMateriaFree = (nome: string) => FREE_MATERIA_NAMES.includes(nome.toLowerCase().trim());
  const isItemLocked = (item: any) => {
    if (isPremium) return false;
    return !isMateriaFree(item.nome);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3 px-2">
        <div className="p-2 bg-red-500/20 rounded-xl">
          <GraduationCap className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="font-playfair text-xl font-bold text-foreground tracking-tight">
            Conceitos
          </h3>
          <p className="text-xs text-muted-foreground">
            Fundamentos do Direito
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground px-2">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-red-400" />
          <span>{totalMaterias} matérias</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Footprints className="w-3.5 h-3.5 text-yellow-400" />
          <span>{totalTopicos} aulas</span>
        </div>
      </div>

      {/* Serpentine */}
      {materias && materias.length > 0 ? (
        <SerpentineNiveis
          items={materias}
          getItemCapa={(item) => item.capa_url}
          getItemTitulo={(item) => item.nome}
          getItemOrdem={(item) => item.area_ordem || 0}
          getItemAulas={(item) => topicosCount?.[item.id] || 0}
          getItemProgresso={() => 0}
          onItemClick={(item) => {
            if (isItemLocked(item)) {
              navigate('/assinatura');
              return;
            }
            navigate(`/conceitos/materia/${item.id}`);
          }}
          isItemLocked={isItemLocked}
        />
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">Nenhuma matéria encontrada.</div>
      )}
    </div>
  );
});

JornadaHomeSection.displayName = 'JornadaHomeSection';

export default JornadaHomeSection;
