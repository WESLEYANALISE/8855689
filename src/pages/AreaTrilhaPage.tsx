import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MobileAreaTrilha } from "@/components/mobile/MobileAreaTrilha";

const AreaTrilhaPage = () => {
  const { area } = useParams<{ area: string }>();
  const navigate = useNavigate();
  const decodedArea = decodeURIComponent(area || "");

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
          <div>
            <h1 className="text-base font-bold text-white">{decodedArea}</h1>
            <p className="text-[10px] text-white/50">Trilha de estudos</p>
          </div>
        </div>
      </div>

      {/* Trilha */}
      <div className="pb-24 pt-4">
        <MobileAreaTrilha area={decodedArea} />
      </div>
    </div>
  );
};

export default AreaTrilhaPage;
