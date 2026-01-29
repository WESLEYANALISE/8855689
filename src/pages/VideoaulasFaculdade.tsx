import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Play, Loader2, Search, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface AreaData {
  area: string;
  thumb: string | null;
  count: number;
}

type FaculdadeTab = 'areas' | 'habilidades';

// Áreas relacionadas à OAB (devem aparecer na seção OAB, não aqui)
const AREAS_OAB = [
  "2ª fase",
  "oab",
  "dicas oab",
  "estatuto da oab",
  "ética profissional",
];

// Habilidades (áreas especiais que vão na aba Habilidades)
const HABILIDADES_AREAS = [
  "comunicação",
  "oratória",
];

// Função para simplificar nome da área (remover "Direito", etc.)
const simplificarNomeArea = (area: string): string => {
  return area
    .replace(/^Direito\s+/i, '')
    .replace(/^Dir\.\s*/i, '')
    .replace(/^D\.\s*/i, '')
    .trim();
};

const VideoaulasFaculdade = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<FaculdadeTab>('areas');

  const { data: areas, isLoading } = useQuery({
    queryKey: ["videoaulas-faculdade-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO")
        .select("area, thumb")
        .not("area", "is", null)
        .order("area", { ascending: true });

      if (error) throw error;

      const areaMap = new Map<string, AreaData>();
      
      data?.forEach((item) => {
        if (!item.area) return;
        
        // Filtrar áreas da OAB
        const isOAB = AREAS_OAB.some(
          (exc) => item.area?.toLowerCase().includes(exc.toLowerCase())
        );
        if (isOAB) return;

        if (!areaMap.has(item.area)) {
          areaMap.set(item.area, {
            area: item.area,
            thumb: item.thumb,
            count: 1,
          });
        } else {
          const existing = areaMap.get(item.area)!;
          existing.count++;
        }
      });

      return Array.from(areaMap.values()).sort((a, b) =>
        a.area.localeCompare(b.area, "pt-BR")
      );
    },
  });

  // Separar áreas e habilidades
  const areasRegulares = areas?.filter((area) => 
    !HABILIDADES_AREAS.some(h => area.area.toLowerCase().includes(h))
  );
  
  const habilidadesAreas = areas?.filter((area) => 
    HABILIDADES_AREAS.some(h => area.area.toLowerCase().includes(h))
  );

  // Filtrar pelo termo de pesquisa
  const currentAreas = activeTab === 'areas' ? areasRegulares : habilidadesAreas;
  const filteredAreas = currentAreas?.filter((area) =>
    area.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-white/5">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Videoaulas para a Faculdade</h1>
            <p className="text-xs text-muted-foreground">
              Matérias para a faculdade
            </p>
          </div>
        </div>

        {/* Barra de pesquisa */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar matéria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-neutral-900/80 border-white/10 focus:border-red-500/50"
            />
          </div>
        </div>

        {/* Toggle Áreas/Habilidades */}
        <div className="px-4 pb-3">
          <div className="flex bg-neutral-800/80 rounded-full p-1 border border-white/5">
            <button
              onClick={() => setActiveTab('areas')}
              className={`flex-1 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === 'areas'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Áreas
            </button>
            <button
              onClick={() => setActiveTab('habilidades')}
              className={`flex-1 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'habilidades'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Mic className="w-3 h-3" />
              Habilidades
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative px-4 py-8">
        {/* Linha central da timeline */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/20 via-red-500/40 to-red-500/20" />
          <motion.div
            className="absolute w-full h-20 bg-gradient-to-b from-transparent via-red-500 to-transparent opacity-60"
            animate={{ y: ["0%", "400%"] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        {/* Cards da timeline */}
        <div className="relative space-y-6">
          {filteredAreas?.map((area, index) => {
            const isLeft = index % 2 === 0;

            return (
              <motion.div
                key={area.area}
                initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className={`flex items-center gap-4 ${
                  isLeft ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {/* Card */}
                <button
                  onClick={() =>
                    navigate(`/videoaulas/faculdade/${encodeURIComponent(area.area)}`)
                  }
                  className={`flex-1 max-w-[45%] md:max-w-[35%] lg:max-w-[30%] ${isLeft ? "mr-auto" : "ml-auto"}`}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 rounded-xl overflow-hidden transition-all group"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-neutral-800">
                      {area.thumb ? (
                        <img
                          src={area.thumb}
                          alt={area.area}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Badge "Área X" no topo */}
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
                        {activeTab === 'areas' ? `Área ${index + 1}` : `Habilidade ${index + 1}`}
                      </div>
                      
                      {/* Ícone de play centralizado */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600/80 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-600 transition-all">
                          <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      
                      {/* Badge de quantidade */}
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-medium rounded">
                        {area.count} {area.count === 1 ? "aula" : "aulas"}
                      </div>
                    </div>

                    {/* Nome da matéria - simplificado */}
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-red-400 transition-colors text-center">
                        {simplificarNomeArea(area.area)}
                      </h3>
                    </div>
                  </motion.div>
                </button>

                {/* Espaçador para o outro lado */}
                <div className="flex-1 max-w-[45%]" />
              </motion.div>
            );
          })}
        </div>

        {/* Indicador final */}
        {filteredAreas && filteredAreas.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: filteredAreas.length * 0.1 + 0.3 }}
            className="flex justify-center mt-8"
          >
            <div className="px-4 py-2 bg-neutral-900/80 rounded-full border border-white/10">
              <p className="text-xs text-muted-foreground">
                Escolha uma matéria para começar
              </p>
            </div>
          </motion.div>
        )}

        {/* Mensagem se nenhum resultado */}
        {filteredAreas?.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma matéria encontrada para "{searchTerm}"
            </p>
          </div>
        )}

        {/* Mensagem se aba vazia */}
        {filteredAreas?.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {activeTab === 'habilidades' 
                ? "Nenhuma habilidade disponível ainda" 
                : "Nenhuma área disponível"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoaulasFaculdade;
