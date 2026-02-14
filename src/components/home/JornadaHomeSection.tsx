import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Footprints, Scale, Loader2, Target } from "lucide-react";
import { SerpentineNiveis } from "@/components/shared/SerpentineNiveis";
import { useSubscription } from "@/contexts/SubscriptionContext";

const FREE_MATERIA_NAMES = [
  "história do direito",
  "historia do direito",
  "introdução ao estudo do direito",
  "introducao ao estudo do direito"
];

type JornadaTipo = 'conceitos' | 'oab';

interface JornadaHomeSectionProps {
  jornadaAtiva: JornadaTipo;
}

export const JornadaHomeSection = memo(({ jornadaAtiva }: JornadaHomeSectionProps) => {
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
    enabled: jornadaAtiva === 'conceitos',
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
    enabled: jornadaAtiva === 'conceitos',
  });

  const totalMaterias = materias?.length || 0;
  const totalTopicos = Object.values(topicosCount || {}).reduce((a, b) => a + b, 0);

  const isMateriaFree = (nome: string) => FREE_MATERIA_NAMES.includes(nome.toLowerCase().trim());
  const isItemLocked = (item: any) => {
    if (isPremium) return false;
    return !isMateriaFree(item.nome);
  };

  if (isLoading && jornadaAtiva === 'conceitos') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="space-y-3">
        {/* Conceitos Content */}
        {jornadaAtiva === 'conceitos' && (
          <div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground px-4 pt-4">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-red-400" />
                <span>{totalMaterias} matérias</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-yellow-400" />
                <span>{totalTopicos} aulas</span>
              </div>
            </div>

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
        )}

        {/* OAB Content */}
        {jornadaAtiva === 'oab' && (
          <div className="px-4 pt-4 space-y-3">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>Selecione a fase do exame</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/trilhas-oab')}
                className="group bg-card border border-border/50 rounded-2xl p-4 text-left hover:border-red-500/30 transition-all"
              >
                <div className="p-2.5 bg-red-500/20 rounded-xl w-fit mb-3">
                  <Target className="w-5 h-5 text-red-400" />
                </div>
                <h4 className="font-playfair font-bold text-foreground text-sm">1ª Fase</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Prova objetiva</p>
              </button>
              <button
                onClick={() => navigate('/trilhas-oab-2fase')}
                className="group bg-card border border-border/50 rounded-2xl p-4 text-left hover:border-red-500/30 transition-all"
              >
                <div className="p-2.5 bg-amber-500/20 rounded-xl w-fit mb-3">
                  <Scale className="w-5 h-5 text-amber-400" />
                </div>
                <h4 className="font-playfair font-bold text-foreground text-sm">2ª Fase</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Prova prática</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

JornadaHomeSection.displayName = 'JornadaHomeSection';

export default JornadaHomeSection;
