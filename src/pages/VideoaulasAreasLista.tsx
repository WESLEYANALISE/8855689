import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Search, Footprints } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import videoaulasBackground from "@/assets/videoaulas-oab-background.jpg";
import { AREAS_PLAYLISTS, AreaPlaylist } from "@/data/videoaulasAreasPlaylists";

// Função para simplificar nome da área (remove "Direito" do início)
const simplifyAreaName = (areaName: string): string => {
  const prefixesToRemove = ['Direito ', 'Legislação '];
  for (const prefix of prefixesToRemove) {
    if (areaName.startsWith(prefix)) {
      return areaName.replace(prefix, '');
    }
  }
  return areaName;
};

// Função para obter thumbnail do YouTube
const getYouTubeThumbnail = (playlistId: string): string | null => {
  // Playlists começam com PL, então não temos thumbnail direta
  // Para vídeos únicos, podemos usar a thumbnail
  if (!playlistId.startsWith('PL')) {
    return `https://img.youtube.com/vi/${playlistId}/mqdefault.jpg`;
  }
  return null;
};

const VideoaulasAreasLista = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar pelo termo de pesquisa
  const filteredAreas = AREAS_PLAYLISTS.filter((area) =>
    area.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-xl font-bold text-white">Áreas do Direito</h1>
              <p className="text-sm text-white/70">
                {AREAS_PLAYLISTS.length} áreas disponíveis
              </p>
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
              const thumbnail = getYouTubeThumbnail(area.playlistId);
              const displayName = simplifyAreaName(area.nome);

              return (
                <motion.div
                  key={area.playlistId}
                  className="relative flex items-center"
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  {/* Card esquerdo */}
                  <div className={`w-[44%] ${isLeft ? 'mr-auto pr-2' : 'invisible pointer-events-none'}`}>
                    {isLeft && (
                      <motion.div
                        onClick={() => navigate(`/videoaulas/areas/${encodeURIComponent(area.nome)}`)}
                        whileHover={{ scale: 1.03, x: -4 }}
                        whileTap={{ scale: 0.97 }}
                        className="cursor-pointer rounded-xl bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 shadow-lg transition-all duration-300 overflow-hidden"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-neutral-800">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={area.nome}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 to-background">
                              <Play className="w-8 h-8 text-red-400/50" />
                            </div>
                          )}
                          
                          {/* Play button */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-red-600/80 flex items-center justify-center shadow-lg">
                              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                            </div>
                          </div>
                          
                          {/* Badge playlist */}
                          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
                            Playlist
                          </div>
                        </div>

                        {/* Nome */}
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-white text-center leading-tight">
                            {displayName}
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
                        onClick={() => navigate(`/videoaulas/areas/${encodeURIComponent(area.nome)}`)}
                        whileHover={{ scale: 1.03, x: 4 }}
                        whileTap={{ scale: 0.97 }}
                        className="cursor-pointer rounded-xl bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 shadow-lg transition-all duration-300 overflow-hidden"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-neutral-800">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={area.nome}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 to-background">
                              <Play className="w-8 h-8 text-red-400/50" />
                            </div>
                          )}
                          
                          {/* Play button */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-red-600/80 flex items-center justify-center shadow-lg">
                              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                            </div>
                          </div>
                          
                          {/* Badge playlist */}
                          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
                            Playlist
                          </div>
                        </div>

                        {/* Nome */}
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-white text-center leading-tight">
                            {displayName}
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

export default VideoaulasAreasLista;
