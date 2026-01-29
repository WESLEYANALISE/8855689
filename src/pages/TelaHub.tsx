import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Clapperboard, Video, GraduationCap, BookOpen, Flame, Users, Heart, Footprints, Scale, FileText, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import telaBackground from "@/assets/tela-background.jpg";

// Thumbnails geradas para cada categoria de videoaulas
import conceitosThumb from "@/assets/thumbnails/conceitos-thumb.jpg";
import areasThumb from "@/assets/thumbnails/areas-thumb.jpg";
import faculdadeThumb from "@/assets/thumbnails/faculdade-thumb.jpg";
import oabPrimeiraThumb from "@/assets/thumbnails/oab-primeira-fase-thumb.jpg";
import oabSegundaThumb from "@/assets/thumbnails/oab-segunda-fase-thumb.jpg";
// Mapa de thumbnails estáticas para videoaulas
const videoaulasThumbnails: Record<string, string> = {
  conceitos: conceitosThumb,
  areas: areasThumb,
  faculdade: faculdadeThumb,
  'oab-primeira': oabPrimeiraThumb,
  'oab-segunda': oabSegundaThumb,
};

// Helper para extrair thumbnail do YouTube (para documentários)
const getYouTubeThumbnail = (url: string | null | undefined) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return null;
};

type TabType = "videoaulas" | "documentarios";

const TelaHub = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("videoaulas");

  // Buscar thumbnails dos documentários
  const { data: docThumbnails, isLoading } = useQuery({
    queryKey: ['tela-hub-doc-thumbnails'],
    queryFn: async () => {
      const results: Record<string, string | null> = {};

      const { data: docs } = await supabase
        .from('documentarios_juridicos')
        .select('thumbnail, categoria')
        .not('thumbnail', 'is', null)
        .limit(30);
      
      if (docs && docs.length > 0) {
        // Distribuir thumbnails para cada categoria
        const shuffled = [...docs].sort(() => Math.random() - 0.5);
        results['destaques'] = shuffled[0]?.thumbnail || null;
        results['familiares'] = shuffled[1]?.thumbnail || shuffled[0]?.thumbnail || null;
        results['passionais'] = shuffled[2]?.thumbnail || shuffled[0]?.thumbnail || null;
      }

      return results;
    },
    staleTime: 1000 * 60 * 5,
  });

  const categoriasVideoaulas = useMemo(() => [
    { id: "conceitos", title: "Conceitos", icon: BookOpen, route: "/videoaulas/iniciante" },
    { id: "areas", title: "Áreas", icon: Scale, route: "/videoaulas/oab-primeira-fase" },
    { id: "faculdade", title: "Faculdade", icon: GraduationCap, route: "/videoaulas/faculdade" },
    { id: "oab-primeira", title: "OAB 1ª Fase", icon: Scale, route: "/videoaulas/oab-primeira-fase" },
    { id: "oab-segunda", title: "OAB 2ª Fase", icon: FileText, route: "/videoaulas/oab" },
  ], []);

  const categoriasDocumentarios = useMemo(() => [
    { id: "destaques", title: "Destaques", icon: Flame, route: "/ferramentas/documentarios-juridicos?aba=destaques" },
    { id: "familiares", title: "Familiares", icon: Users, route: "/ferramentas/documentarios-juridicos?aba=familiares" },
    { id: "passionais", title: "Passionais", icon: Heart, route: "/ferramentas/documentarios-juridicos?aba=passionais" },
  ], []);

  const categorias = activeTab === "videoaulas" ? categoriasVideoaulas : categoriasDocumentarios;
  const currentThumbnails = activeTab === "videoaulas" ? videoaulasThumbnails : (docThumbnails || {});

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Background Image - estendido para cobrir tudo */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${telaBackground})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />

      {/* Content */}
      <div className="relative z-10 min-h-screen pb-32">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm pb-4">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => navigate("/")}
              className="p-2.5 rounded-xl bg-red-700/15 hover:bg-red-700/25 transition-all duration-300 border border-red-700/40"
            >
              <ArrowLeft className="w-5 h-5 text-red-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Tela</h1>
              <p className="text-sm text-white/70">Conteúdo audiovisual</p>
            </div>
          </div>

          {/* Toggle Tabs */}
          <div className="px-4">
            <div className="flex gap-2 p-1 bg-neutral-900/80 rounded-full border border-red-700/30">
              <button
                onClick={() => setActiveTab("videoaulas")}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-300",
                  activeTab === "videoaulas"
                    ? "bg-gradient-to-r from-red-700 to-red-800 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                Videoaulas
              </button>
              <button
                onClick={() => setActiveTab("documentarios")}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-300",
                  activeTab === "documentarios"
                    ? "bg-gradient-to-r from-red-700 to-red-800 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                Documentários
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        )}

        {/* Timeline */}
        {!isLoading && (
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
              {categorias.map((categoria, index) => {
                const Icon = categoria.icon;
                const isLeft = index % 2 === 0;
                const thumbnail = currentThumbnails?.[categoria.id];

                return (
                  <motion.div
                    key={categoria.id}
                    className="relative flex items-center"
                    initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                  >
                    {/* Card esquerdo */}
                    <div className={`w-[44%] h-[120px] ${isLeft ? 'mr-auto pr-2' : 'invisible pointer-events-none'}`}>
                      {isLeft && (
                        <motion.div
                          onClick={() => navigate(categoria.route)}
                          whileHover={{ scale: 1.03, x: -4 }}
                          whileTap={{ scale: 0.97 }}
                          className="cursor-pointer rounded-2xl bg-gradient-to-br from-red-700 via-red-800 to-red-900 shadow-lg shadow-red-900/30 transition-all duration-300 border border-red-600/40 hover:shadow-xl hover:shadow-red-600/25 h-full overflow-hidden relative"
                        >
                          {/* Thumbnail de fundo */}
                          {thumbnail ? (
                            <>
                              <div 
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${thumbnail})` }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-800 to-red-900" />
                          )}
                          
                          {/* Botão de Player transparente central */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/20">
                              <Play className="w-6 h-6 text-white/80 fill-white/60" />
                            </div>
                          </div>
                          
                          {/* Ícone e Título no canto inferior esquerdo */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-red-600/80 shrink-0">
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-sm font-semibold text-white leading-snug">
                              {categoria.title}
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
                    <div className={`w-[44%] h-[120px] ${!isLeft ? 'ml-auto pl-2' : 'invisible pointer-events-none'}`}>
                      {!isLeft && (
                        <motion.div
                          onClick={() => navigate(categoria.route)}
                          whileHover={{ scale: 1.03, x: 4 }}
                          whileTap={{ scale: 0.97 }}
                          className="cursor-pointer rounded-2xl bg-gradient-to-br from-red-700 via-red-800 to-red-900 shadow-lg shadow-red-900/30 transition-all duration-300 border border-red-600/40 hover:shadow-xl hover:shadow-red-600/25 h-full overflow-hidden relative"
                        >
                          {/* Thumbnail de fundo */}
                          {thumbnail ? (
                            <>
                              <div 
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${thumbnail})` }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-800 to-red-900" />
                          )}
                          
                          {/* Botão de Player transparente central */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/20">
                              <Play className="w-6 h-6 text-white/80 fill-white/60" />
                            </div>
                          </div>
                          
                          {/* Ícone e Título no canto inferior esquerdo */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-red-600/80 shrink-0">
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-sm font-semibold text-white leading-snug">
                              {categoria.title}
                            </h3>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelaHub;
