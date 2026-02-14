import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileAreaTrilha } from "@/components/mobile/MobileAreaTrilha";

const AreaTrilhaPage = () => {
  const { area } = useParams<{ area: string }>();
  const navigate = useNavigate();
  const decodedArea = decodeURIComponent(area || "");

  // Count livros for progress display
  const { data: livros } = useQuery({
    queryKey: ["area-trilha-livros-count", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("id")
        .eq("Área", decodedArea);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const totalTemas = livros?.length || 0;

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
                <p className="text-white font-semibold text-sm">Nível 1</p>
                <p className="text-white/40 text-[10px]">Iniciante</p>
              </div>
            </div>
            <span className="text-white/50 text-xs">0%</span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: "0%" }}
            />
          </div>
          <p className="text-white/30 text-[10px] mt-1.5 text-center">
            0/{totalTemas} temas concluídos
          </p>
        </div>
      </div>

      {/* Trilha */}
      <div className="pb-24 pt-2">
        <MobileAreaTrilha area={decodedArea} />
      </div>
    </div>
  );
};

export default AreaTrilhaPage;
