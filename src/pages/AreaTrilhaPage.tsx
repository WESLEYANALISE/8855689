import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trophy, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MobileAreaTrilha } from "@/components/mobile/MobileAreaTrilha";
import { OABPdfProcessorModal } from "@/components/oab/OABPdfProcessorModal";
import { Button } from "@/components/ui/button";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const AreaTrilhaPage = () => {
  const { area } = useParams<{ area: string }>();
  const navigate = useNavigate();
  const decodedArea = decodeURIComponent(area || "");
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [showPdfModal, setShowPdfModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch matérias from categorias_materias for this area
  const { data: materias } = useQuery({
    queryKey: ["area-trilha-materias", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_materias")
        .select("*")
        .eq("categoria", decodedArea)
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return data || [];
    },
    enabled: !!decodedArea,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch tópicos for progress calculation
  const { data: topicos } = useQuery({
    queryKey: ["area-trilha-topicos", decodedArea],
    queryFn: async () => {
      if (!materias || materias.length === 0) return [];
      const ids = materias.map((m) => m.id);
      const { data, error } = await supabase
        .from("categorias_topicos")
        .select("id, materia_id, status")
        .in("materia_id", ids);
      if (error) throw error;
      return data || [];
    },
    enabled: !!materias && materias.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const totalTopicos = topicos?.length || 0;
  const concluidos = topicos?.filter((t) => t.status === "concluido").length || 0;
  const progressPercent = totalTopicos > 0 ? Math.round((concluidos / totalTopicos) * 100) : 0;

  const getNivelInfo = (percent: number) => {
    if (percent >= 80) return { nivel: "Nível 5", label: "Mestre" };
    if (percent >= 60) return { nivel: "Nível 4", label: "Avançado" };
    if (percent >= 40) return { nivel: "Nível 3", label: "Intermediário" };
    if (percent >= 20) return { nivel: "Nível 2", label: "Aprendiz" };
    return { nivel: "Nível 1", label: "Iniciante" };
  };

  const nivelInfo = getNivelInfo(progressPercent);

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0a12]/95 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-white">{decodedArea}</h1>
            <p className="text-[10px] text-white/50">Trilha de estudos</p>
          </div>
        </div>
      </div>

      {/* Progress Level Bar */}
      <div className="px-4 pt-4 pb-2 max-w-lg mx-auto">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{nivelInfo.nivel}</p>
                <p className="text-white/40 text-[10px]">{nivelInfo.label}</p>
              </div>
            </div>
            <span className="text-white/50 text-xs">{progressPercent}%</span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-white/30 text-[10px] mt-1.5 text-center">
            {concluidos}/{totalTopicos} tópicos concluídos
          </p>
        </div>
      </div>

      {/* Admin: Add PDF */}
      {isAdmin && (
        <div className="px-4 pb-2 max-w-lg mx-auto">
          <Button
            onClick={() => setShowPdfModal(true)}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Matéria (PDF)
          </Button>
        </div>
      )}

      {/* Trilha */}
      <div className="pb-24 pt-2">
        <MobileAreaTrilha area={decodedArea} />
      </div>

      {/* PDF Modal */}
      {showPdfModal && (
        <OABPdfProcessorModal
          open={showPdfModal}
          onOpenChange={setShowPdfModal}
          materiaId={0}
          materiaNome={decodedArea}
          onComplete={async () => {
            setShowPdfModal(false);
            queryClient.invalidateQueries({ queryKey: ["area-trilha-materias", decodedArea] });
            queryClient.invalidateQueries({ queryKey: ["area-trilha-topicos", decodedArea] });
          }}
        />
      )}
    </div>
  );
};

export default AreaTrilhaPage;
