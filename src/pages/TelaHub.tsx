import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Clapperboard, Video, BookOpen, Flame, Users, Heart, Footprints, Scale, FileText, Loader2, Play, Search, History, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import telaBackground from "@/assets/tela-background.jpg";

// Thumbnails geradas para cada categoria de videoaulas
import conceitosThumb from "@/assets/thumbnails/conceitos-thumb.jpg";
import areasThumb from "@/assets/thumbnails/areas-thumb.jpg";
import oabPrimeiraThumb from "@/assets/thumbnails/oab-primeira-fase-thumb.jpg";
import oabSegundaThumb from "@/assets/thumbnails/oab-segunda-fase-thumb.jpg";

// Mapa de thumbnails estáticas para videoaulas
const videoaulasThumbnails: Record<string, string> = {
  conceitos: conceitosThumb,
  areas: areasThumb,
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

type ContentTabType = "videoaulas" | "documentarios";
type MainTabType = "videos" | "historico";

interface HistoricoVideo {
  id: string;
  video_id?: string;
  titulo: string;
  thumbnail?: string | null;
  assistido_em: string;
  progresso_segundos: number;
  duracao_total?: number;
  tipo: 'iniciante' | 'oab' | 'faculdade' | 'area';
  rota: string;
}

const VideoaulasHub = () => {
  const navigate = useNavigate();
  const [activeContentTab, setActiveContentTab] = useState<ContentTabType>("videoaulas");
  const [mainTab, setMainTab] = useState<MainTabType>("videos");
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar histórico de vídeos assistidos
  const { data: historico, isLoading: loadingHistorico } = useQuery({
    queryKey: ['videoaulas-historico'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('videoaulas_progresso')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }

      // Buscar detalhes de cada vídeo
      const historicoFormatado: HistoricoVideo[] = [];

      for (const item of data || []) {
        // Tentar buscar em videoaulas_iniciante
          if (item.video_id) {
            const { data: inicianteData } = await supabase
              .from('videoaulas_iniciante')
              .select('id, titulo, thumbnail, video_id')
              .eq('video_id', item.video_id)
              .maybeSingle();

            if (inicianteData) {
              historicoFormatado.push({
                id: item.id,
                video_id: item.video_id,
                titulo: inicianteData.titulo,
                thumbnail: inicianteData.thumbnail || `https://img.youtube.com/vi/${item.video_id}/mqdefault.jpg`,
                assistido_em: item.updated_at,
                progresso_segundos: item.tempo_atual || 0,
                duracao_total: item.duracao_total || undefined,
                tipo: 'iniciante',
                rota: `/videoaulas/iniciante/${inicianteData.id}`
              });
              continue;
            }

            // Se não encontrou, adiciona com dados básicos
            historicoFormatado.push({
              id: item.id,
              video_id: item.video_id,
              titulo: 'Vídeo assistido',
              thumbnail: `https://img.youtube.com/vi/${item.video_id}/mqdefault.jpg`,
              assistido_em: item.updated_at,
              progresso_segundos: item.tempo_atual || 0,
              duracao_total: item.duracao_total || undefined,
              tipo: 'area',
              rota: '#'
            });
          }
        }

      return historicoFormatado;
    },
    enabled: mainTab === 'historico',
    staleTime: 1000 * 60 * 2,
  });

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
    { id: "conceitos", title: "Videoaulas para Iniciantes", icon: BookOpen, route: "/videoaulas/iniciante" },
    { id: "areas", title: "Áreas", icon: Scale, route: "/videoaulas/oab-primeira-fase" },
    { id: "oab-primeira", title: "OAB 1ª Fase", icon: Scale, route: "/videoaulas-oab-1fase" },
    { id: "oab-segunda", title: "OAB 2ª Fase", icon: FileText, route: "/videoaulas/oab" },
  ], []);

  const categoriasDocumentarios = useMemo(() => [
    { id: "destaques", title: "Destaques", icon: Flame, route: "/ferramentas/documentarios-juridicos?aba=destaques" },
    { id: "familiares", title: "Familiares", icon: Users, route: "/ferramentas/documentarios-juridicos?aba=familiares" },
    { id: "passionais", title: "Passionais", icon: Heart, route: "/ferramentas/documentarios-juridicos?aba=passionais" },
  ], []);

  // Filtrar categorias por busca
  const categoriasFiltradas = useMemo(() => {
    const categorias = activeContentTab === "videoaulas" ? categoriasVideoaulas : categoriasDocumentarios;
    if (!searchQuery.trim()) return categorias;
    return categorias.filter(cat => 
      cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeContentTab, categoriasVideoaulas, categoriasDocumentarios, searchQuery]);

  const currentThumbnails = activeContentTab === "videoaulas" ? videoaulasThumbnails : (docThumbnails || {});

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Formatar data relativa
  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

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
              <h1 className="text-xl font-bold text-white">Videoaulas</h1>
              <p className="text-sm text-white/70">Conteúdo audiovisual</p>
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="px-4 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                type="text"
                placeholder="Buscar videoaulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-neutral-900/80 border-red-700/30 text-white placeholder:text-white/50 focus:border-red-600 h-11"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
              )}
            </div>
          </div>

          {/* Main Tabs - Vídeos / Histórico */}
          <div className="px-4">
            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTabType)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-neutral-900/80 border border-red-700/30 p-1 h-12">
                <TabsTrigger 
                  value="videos"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-white/70 gap-2"
                >
                  <Video className="w-4 h-4" />
                  Vídeos
                </TabsTrigger>
                <TabsTrigger 
                  value="historico"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-white/70 gap-2"
                >
                  <History className="w-4 h-4" />
                  Histórico
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content based on main tab */}
        {mainTab === "videos" && (
          <>
            {/* Content Toggle Tabs */}
            <div className="px-4 pt-2 pb-2">
              <div className="flex gap-2 p-1 bg-neutral-900/80 rounded-full border border-red-700/30">
                <button
                  onClick={() => setActiveContentTab("videoaulas")}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-300",
                    activeContentTab === "videoaulas"
                      ? "bg-gradient-to-r from-red-700 to-red-800 text-white shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  Videoaulas
                </button>
                <button
                  onClick={() => setActiveContentTab("documentarios")}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-300",
                    activeContentTab === "documentarios"
                      ? "bg-gradient-to-r from-red-700 to-red-800 text-white shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  Documentários
                </button>
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
                  {categoriasFiltradas.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-white/50">Nenhuma categoria encontrada</p>
                    </div>
                  ) : (
                    categoriasFiltradas.map((categoria, index) => {
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
                                  <h3 className="text-xs font-semibold text-white leading-snug line-clamp-2">
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
                                  <h3 className="text-xs font-semibold text-white leading-snug line-clamp-2">
                                    {categoria.title}
                                  </h3>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Histórico Tab */}
        {mainTab === "historico" && (
          <div className="px-4 pt-4">
            {loadingHistorico ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              </div>
            ) : !historico || historico.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-white/30 mb-4" />
                <p className="text-white/50 text-lg font-medium mb-2">Nenhum vídeo assistido</p>
                <p className="text-white/40 text-sm">Os vídeos que você assistir aparecerão aqui</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-3 pb-8">
                  {historico.map((video) => (
                    <motion.button
                      key={video.id}
                      onClick={() => video.rota !== '#' && navigate(video.rota)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 rounded-xl p-2.5 flex gap-3 items-start transition-all group"
                    >
                      {/* Thumbnail com progresso */}
                      <div className="shrink-0 relative w-28 aspect-video rounded-lg overflow-hidden bg-neutral-800">
                        <img 
                          src={video.thumbnail || ''} 
                          alt={video.titulo}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Play icon overlay */}
                        <div className="absolute inset-0 bg-black/15 flex items-center justify-center group-hover:bg-black/25 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-red-600/70 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-600/90 transition-all">
                            <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
                          </div>
                        </div>
                        {/* Barra de progresso */}
                        {video.duracao_total && video.duracao_total > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                            <div 
                              className="h-full bg-red-600"
                              style={{ width: `${Math.min((video.progresso_segundos / video.duracao_total) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 text-left min-w-0 py-0.5">
                        <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">
                          {video.titulo}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-white/50">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeDate(video.assistido_em)}</span>
                          {video.progresso_segundos > 0 && (
                            <>
                              <span>•</span>
                              <span>{formatTime(video.progresso_segundos)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoaulasHub;
