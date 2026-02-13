import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Play, Loader2, Search, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import videoaulasBackground from "@/assets/videoaulas-oab-background.webp";

interface AreaData {
  area: string;
  thumb: string | null;
  count: number;
}

// Função para simplificar nome da área
const simplificarNomeArea = (area: string): string => {
  return area
    .replace(/^2ª\s*Fase\s+/i, '')
    .replace(/^Segunda\s*Fase\s+/i, '')
    .trim();
};

const VideoaulasOAB = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: areas, isLoading } = useQuery({
    queryKey: ["videoaulas-oab-areas"],
    queryFn: async () => {
      // Buscar vídeos da OAB 2ª Fase (categoria "2° Fase OAB" ou áreas com "2ª Fase")
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO" as any)
        .select("area, thumb")
        .or('categoria.eq.2° Fase OAB,categoria.ilike.%Fase OAB%,area.ilike.%2ª Fase%,area.ilike.%Segunda Fase%');

      if (error) throw error;

      const areaMap = new Map<string, AreaData>();

      (data as any[] || []).forEach((item: any) => {
        if (!item.area) return;

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

  // Filtrar pelo termo de pesquisa
  const filteredAreas = areas?.filter((area) =>
    area.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${videoaulasBackground})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />

      {/* Content */}
      <div className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm pb-4">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => navigate("/videoaulas")}
              className="p-2.5 rounded-xl bg-red-700/15 hover:bg-red-700/25 transition-all duration-300 border border-red-700/40"
            >
              <ArrowLeft className="w-5 h-5 text-red-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Videoaulas OAB - 2ª Fase</h1>
              <p className="text-sm text-white/70">Preparação para a segunda fase</p>
            </div>
          </div>

          {/* Barra de pesquisa */}
          <div className="px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Pesquisar área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-black/50 border-red-700/30 text-white placeholder:text-white/40 focus:border-red-500/50"
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative py-10 px-4">
          {/* Linha vertical central vermelho */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2">
            <div className="absolute inset-0 bg-gradient-to-b from-red-700/50 via-red-700/30 to-transparent" />
            <motion.div
              className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-red-600 via-red-600/70 to-transparent rounded-full"
              animate={{ y: ["0%", "300%", "0%"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: "blur(2px)" }}
            />
          </div>

          {/* Cards */}
          <div className="space-y-6">
            {filteredAreas?.map((area, index) => {
              const isLeft = index % 2 === 0;

              return (
                <motion.div
                  key={area.area}
                  className="relative flex items-center"
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  {/* Card esquerdo */}
                  <div className={`w-[44%] ${isLeft ? 'mr-auto pr-2' : 'invisible pointer-events-none'}`}>
                    {isLeft && (
                      <motion.div
                        onClick={() => navigate(`/videoaulas/oab/${encodeURIComponent(area.area)}`)}
                        whileHover={{ scale: 1.03, x: -4 }}
                        whileTap={{ scale: 0.97 }}
                        className="cursor-pointer rounded-xl bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 shadow-lg transition-all duration-300 overflow-hidden"
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
                          
                          {/* Badge "Área X" */}
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
                            Área {index + 1}
                          </div>
                          
                          {/* Play button */}
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

                        {/* Nome - fundo cinza */}
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-foreground text-center">
                            {simplificarNomeArea(area.area)}
                          </h3>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Marcador central - Pegadas */}
                  <div className="w-[12%] shrink-0 flex items-center justify-center">
                    <motion.div 
                      className="p-1.5 rounded-full bg-red-700/25 border border-red-600/50"
                      animate={{ 
                        scale: [1, 1.15, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(220, 38, 38, 0)",
                          "0 0 8px 4px rgba(220, 38, 38, 0.3)",
                          "0 0 0 0 rgba(220, 38, 38, 0)"
                        ]
                      }}
                      transition={{ 
                        duration: 2.5,
                        repeat: Infinity,
                        delay: index * 0.25
                      }}
                    >
                      <Footprints className="w-5 h-5 text-red-500" />
                    </motion.div>
                  </div>

                  {/* Card direito */}
                  <div className={`w-[44%] ${!isLeft ? 'ml-auto pl-2' : 'invisible pointer-events-none'}`}>
                    {!isLeft && (
                      <motion.div
                        onClick={() => navigate(`/videoaulas/oab/${encodeURIComponent(area.area)}`)}
                        whileHover={{ scale: 1.03, x: 4 }}
                        whileTap={{ scale: 0.97 }}
                        className="cursor-pointer rounded-xl bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 shadow-lg transition-all duration-300 overflow-hidden"
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
                          
                          {/* Badge "Área X" */}
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
                            Área {index + 1}
                          </div>
                          
                          {/* Play button */}
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

                        {/* Nome - fundo cinza */}
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-foreground text-center">
                            {simplificarNomeArea(area.area)}
                          </h3>
                        </div>
                      </motion.div>
                    )}
                  </div>
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
              <div className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full border border-red-600/30">
                <p className="text-xs text-white/70">
                  Escolha uma área para começar
                </p>
              </div>
            </motion.div>
          )}

          {/* Mensagem se nenhum resultado */}
          {filteredAreas?.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p className="text-white/60">
                Nenhuma área encontrada para "{searchTerm}"
              </p>
            </div>
          )}

          {/* Mensagem se vazio */}
          {filteredAreas?.length === 0 && !searchTerm && (
            <div className="text-center py-12">
              <p className="text-white/60">
                Nenhuma área disponível
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoaulasOAB;
