import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Search, Scale, ArrowDownAZ, Clock, ArrowLeft, Footprints, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import themisBackground from "@/assets/themis-estudos-background.webp";

interface Area {
  area: string;
  count: number;
}

const ResumosProntos = () => {
  const navigate = useNavigate();
  const { area: areaFromUrl } = useParams<{ area: string }>();
  const [areaSelecionada, setAreaSelecionada] = useState<string | null>(null);
  const [searchArea, setSearchArea] = useState("");
  const [searchTema, setSearchTema] = useState("");
  
  const [ordenacaoTemas, setOrdenacaoTemas] = useState<"cronologica" | "alfabetica">("cronologica");
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Pré-selecionar área da URL quando disponível
  useEffect(() => {
    if (areaFromUrl) {
      setAreaSelecionada(decodeURIComponent(areaFromUrl));
    }
  }, [areaFromUrl]);

  useEffect(() => {
    setVisibleElements(new Set(['hero', 'areas-title', 'search']));
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-animate');
            if (id) {
              setVisibleElements((prev) => new Set([...prev, id]));
            }
          }
        });
      },
      { threshold: 0.05, rootMargin: '100px' }
    );

    const timer = setTimeout(() => {
      document.querySelectorAll('[data-animate]').forEach((el) => {
        observerRef.current?.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [areaSelecionada]);

  // Buscar áreas únicas
  const { data: areas, isLoading: loadingAreas } = useQuery({
    queryKey: ["resumos-areas"],
    queryFn: async () => {
      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("RESUMO")
          .select("area")
          .not("area", "is", null)
          .range(offset, offset + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const areaMap = new Map<string, number>();
      allData.forEach((item) => {
        if (item.area) {
          areaMap.set(item.area, (areaMap.get(item.area) || 0) + 1);
        }
      });

      return Array.from(areaMap.entries())
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => a.area.localeCompare(b.area));
    },
  });

  // Buscar temas da área selecionada
  const { data: temas, isLoading: loadingTemas } = useQuery({
    queryKey: ["resumos-temas", areaSelecionada],
    queryFn: async () => {
      if (!areaSelecionada) return [];

      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("RESUMO")
          .select("tema, \"ordem Tema\", url_imagem_resumo")
          .eq("area", areaSelecionada)
          .not("tema", "is", null)
          .range(offset, offset + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const temaMap = new Map<string, { tema: string; ordem: string; count: number; capa: string | null }>();
      allData.forEach((item: any) => {
        if (item.tema) {
          const existing = temaMap.get(item.tema);
          if (existing) {
            existing.count++;
            // Atualizar a capa se o item atual tiver uma e o existente não
            if (!existing.capa && item.url_imagem_resumo) {
              existing.capa = item.url_imagem_resumo;
            }
          } else {
            temaMap.set(item.tema, {
              tema: item.tema,
              ordem: item["ordem Tema"] || "0",
              count: 1,
              capa: item.url_imagem_resumo || null,
            });
          }
        }
      });

      return Array.from(temaMap.values()).sort((a, b) => {
        const ordemA = parseFloat(a.ordem) || 0;
        const ordemB = parseFloat(b.ordem) || 0;
        return ordemA - ordemB;
      });
    },
    enabled: !!areaSelecionada,
  });

  const areasFiltradas = areas?.filter(a => 
    a.area.toLowerCase().includes(searchArea.toLowerCase())
  );

  const temasFiltrados = temas
    ?.filter(t => t.tema.toLowerCase().includes(searchTema.toLowerCase()))
    ?.sort((a, b) => {
      if (ordenacaoTemas === "alfabetica") {
        return a.tema.localeCompare(b.tema);
      }
      // Ordem cronológica (por ordem do tema)
      const ordemA = parseFloat(a.ordem) || 0;
      const ordemB = parseFloat(b.ordem) || 0;
      return ordemA - ordemB;
    });

  const totalResumos = areas?.reduce((acc, area) => acc + area.count, 0) || 0;

  const areaIcons = ["📜", "⚖️", "💼", "💰", "🏛️", "📋", "📕", "📗", "📘"];
  const glowColors = [
    "rgb(239, 68, 68)",
    "rgb(249, 115, 22)",
    "rgb(16, 185, 129)",
    "rgb(245, 158, 11)",
    "rgb(59, 130, 246)",
    "rgb(236, 72, 153)",
    "rgb(168, 85, 247)",
    "rgb(6, 182, 212)",
    "rgb(34, 197, 94)",
  ];

  // Redirecionar para página de áreas se não houver área selecionada
  useEffect(() => {
    if (!areaFromUrl) {
      navigate('/resumos-juridicos/prontos', { replace: true });
    }
  }, [areaFromUrl, navigate]);

  // Se ainda não tem área, não renderiza nada (vai redirecionar)
  if (!areaSelecionada) {
    return null;
  }

  const totalResumosDaArea = areas?.find(a => a.area === areaSelecionada)?.count || 0;
  const totalTemasArea = temasFiltrados?.length || 0;

  // Página de TEMAS com TIMELINE (área selecionada)
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${themisBackground})` }}
      />
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate('/resumos-juridicos/prontos')}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {areaSelecionada}
                </h1>
                <p className="text-sm text-gray-400">
                  {totalResumosDaArea.toLocaleString('pt-BR')} resumos · {totalTemasArea} temas
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Search & Sort */}
        <div className="px-4 py-3">
          <div className="max-w-lg mx-auto space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Pesquisar tema..."
                value={searchTema}
                onChange={(e) => setSearchTema(e.target.value)}
                className="pl-10 pr-3 h-10 rounded-full border border-white/10 bg-black/40 text-white text-sm placeholder:text-gray-500"
              />
            </div>
            
            {/* Menu de ordenação */}
            <div className="flex gap-1 bg-white/5 p-0.5 rounded-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOrdenacaoTemas("cronologica")}
                className={`flex-1 h-8 text-xs rounded-full transition-all ${
                  ordenacaoTemas === "cronologica" 
                    ? "bg-red-600 text-white font-medium" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                Cronológica
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOrdenacaoTemas("alfabetica")}
                className={`flex-1 h-8 text-xs rounded-full transition-all ${
                  ordenacaoTemas === "alfabetica" 
                    ? "bg-red-600 text-white font-medium" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <ArrowDownAZ className="w-3.5 h-3.5 mr-1.5" />
                Alfabética
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline de Temas */}
        {loadingTemas ? (
          <div className="px-4 pb-24 pt-4">
            <div className="max-w-lg mx-auto space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl bg-white/10" />
              ))}
            </div>
          </div>
        ) : temasFiltrados?.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            Nenhum tema encontrado
          </div>
        ) : (
          <div className="px-4 pb-24 pt-4">
            <div className="max-w-lg mx-auto relative">
              {/* Linha central da timeline */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
                <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
                {/* Animação de fluxo elétrico */}
                <motion.div
                  className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
                  animate={{ y: ["0%", "300%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
              
              <div className="space-y-6">
                {temasFiltrados?.map((tema, index) => {
                  const isLeft = index % 2 === 0;
                  const ordemNum = parseInt(tema.ordem) || (index + 1);
                  
                  return (
                    <motion.div
                      key={tema.tema}
                      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative flex items-center ${
                        isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                      }`}
                    >
                      {/* Marcador Pegada no centro */}
                      <div className="absolute left-1/2 -translate-x-1/2 z-10">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.15, 1],
                            boxShadow: [
                              "0 0 0 0 rgba(239, 68, 68, 0.4)",
                              "0 0 0 10px rgba(239, 68, 68, 0)",
                              "0 0 0 0 rgba(239, 68, 68, 0)"
                            ]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: index * 0.2
                          }}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/40"
                        >
                          <Footprints className="w-5 h-5 text-white" />
                        </motion.div>
                      </div>
                      
                      {/* Card do Tema */}
                      <div className="w-full">
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            navigate(
                              `/resumos-juridicos/prontos/${encodeURIComponent(
                                areaSelecionada!
                              )}/${encodeURIComponent(tema.tema)}`
                            )
                          }
                          className="cursor-pointer rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border border-white/10 hover:border-red-500/50 transition-all overflow-hidden min-h-[160px] flex flex-col"
                        >
                          {/* Capa do tema */}
                          <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
                            {tema.capa ? (
                              <>
                                <img 
                                  src={tema.capa} 
                                  alt={tema.tema}
                                  className="w-full h-full object-cover"
                                />
                                {/* Gradiente escuro para destaque do texto */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                              </>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-red-800/80 to-red-900/80 flex items-center justify-center">
                                <Scale className="w-8 h-8 text-red-400/60" />
                              </div>
                            )}
                            
                            {/* Badge Tema dentro da capa */}
                            <div className="absolute bottom-2 left-3">
                              <p className="text-xs text-red-400 font-semibold drop-shadow-lg">
                                Tema {ordemNum}
                              </p>
                            </div>
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="flex-1 p-3">
                            <h3 className="font-medium text-[13px] leading-snug text-white line-clamp-2">
                              {tema.tema}
                            </h3>
                            
                            {/* Contagem de resumos */}
                            <div className="flex items-center gap-1 mt-2">
                              <FileText className="w-3 h-3 text-amber-400" />
                              <span className="text-xs text-amber-400 font-medium">
                                {tema.count} {tema.count === 1 ? "resumo" : "resumos"}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumosProntos;
