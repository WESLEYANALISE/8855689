import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, Footprints, GraduationCap, Loader2, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import themisBackground from "@/assets/themis-estudos-background.webp";
import { InstantBackground } from "@/components/ui/instant-background";
import { FloatingScrollButton } from "@/components/ui/FloatingScrollButton";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { SerpentineNiveis } from "@/components/shared/SerpentineNiveis";

// Matérias gratuitas
const FREE_MATERIA_NAMES = [
  "história do direito", 
  "historia do direito",
  "introdução ao estudo do direito",
  "introducao ao estudo do direito"
];

const ConceitosTrilhante = () => {
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
    staleTime: 0,
    refetchOnMount: "always",
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
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: totalPaginas } = useQuery({
    queryKey: ["conceitos-total-paginas"],
    queryFn: async () => {
      const { data: topicos } = await supabase.from("conceitos_topicos").select("slides_json");
      if (!topicos) return 0;
      let total = 0;
      for (const topico of topicos) {
        if (topico.slides_json) {
          try {
            const slides = typeof topico.slides_json === 'string' ? JSON.parse(topico.slides_json) : topico.slides_json;
            if (slides.secoes && Array.isArray(slides.secoes)) {
              for (const secao of slides.secoes) {
                if (secao.slides && Array.isArray(secao.slides)) total += secao.slides.length;
              }
            }
          } catch { /* ignore */ }
        }
      }
      return total;
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
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d14]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <InstantBackground
        src={themisBackground}
        alt="Themis"
        blurCategory="estudos"
        gradientClassName="bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]"
      />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button onClick={() => navigate('/?tab=ferramentas')} className="flex items-center gap-2 text-red-400 hover:text-red-300 mb-6 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  Conceitos
                </h1>
                <p className="text-sm text-gray-400">Fundamentos do Direito</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-xs sm:text-sm text-white/80">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              <span>{totalMaterias} matérias</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
              <span>{totalTopicos} aulas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
              <span>{totalPaginas || 0} tópicos</span>
            </div>
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
          <div className="text-center py-10 text-white/50 text-sm">Nenhuma matéria encontrada.</div>
        )}
        
        <FloatingScrollButton />
      </div>
    </div>
  );
};

export default ConceitosTrilhante;
