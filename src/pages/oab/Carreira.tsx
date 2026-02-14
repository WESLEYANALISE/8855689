import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase } from "lucide-react";
import { OabCarreiraBlogList } from "@/components/oab/OabCarreiraBlogList";

const Carreira = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/?tab=jornada')} 
            className="p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Carreira</h1>
              <p className="text-sm text-muted-foreground">Guia para advogados iniciantes</p>
            </div>
          </div>
        </div>

        {/* Guia Content */}
        <OabCarreiraBlogList />
      </div>
    </div>
  );
};

export default Carreira;
