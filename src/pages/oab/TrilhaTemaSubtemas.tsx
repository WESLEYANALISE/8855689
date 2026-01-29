import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Loader2, Footprints } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SubtemaResumo {
  id: number;
  subtema: string;
  ordem: number | null;
  tem_conteudo_gerado: boolean;
}

export default function TrilhaTemaSubtemas() {
  const navigate = useNavigate();
  const { area, tema } = useParams<{ area: string; tema: string }>();
  const decodedArea = area ? decodeURIComponent(area) : "";
  const decodedTema = tema ? decodeURIComponent(tema) : "";
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar subtemas do tema
  const { data: subtemas, isLoading } = useQuery({
    queryKey: ['trilhas-aprovacao-subtemas', decodedArea, decodedTema],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('RESUMO')
        .select('id, subtema, conteudo_gerado')
        .eq('area', decodedArea)
        .eq('tema', decodedTema)
        .not('subtema', 'is', null);

      if (error) throw error;

      return data?.map((row: any): SubtemaResumo => ({
        id: row.id,
        subtema: row.subtema || "",
        ordem: row["ordem subtema"],
        tem_conteudo_gerado: !!row.conteudo_gerado
      })) || [];
    },
    enabled: !!decodedArea && !!decodedTema
  });

  // Filtrar subtemas pelo termo de busca
  const subtemasFiltrados = useMemo(() => {
    if (!subtemas) return [];
    if (!searchTerm.trim()) return subtemas;
    
    const termo = searchTerm.toLowerCase();
    return subtemas.filter(s => s.subtema.toLowerCase().includes(termo));
  }, [subtemas, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 pb-24">
      {/* Header com estilo Em Alta vermelho mais claro */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-background via-background/98 to-background/95 backdrop-blur-md border-b border-red-500/20">
        <div className="px-4 py-5">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(`/oab/trilhas-aprovacao/${encodeURIComponent(decodedArea)}`)}
              className="p-2.5 rounded-xl bg-red-500/12 hover:bg-red-500/22 transition-all duration-300 border border-red-500/30"
            >
              <ArrowLeft className="w-5 h-5 text-red-400" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{decodedArea}</p>
              <h1 className="text-lg font-bold text-foreground truncate">{decodedTema}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {subtemas?.length || 0} conteúdos disponíveis
              </p>
            </div>
          </div>

          {/* Busca com estilo vermelho */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 bg-card/50 border-red-500/20 focus:border-red-400/50 rounded-xl h-11"
            />
          </div>
        </div>
      </div>

      {/* Timeline de Subtemas */}
      <div className="relative py-10 px-4">
        {/* Linha vertical central vermelho claro */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/40 via-red-500/20 to-transparent" />
          <motion.div
            className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-red-400 via-red-400/60 to-transparent rounded-full"
            animate={{ y: ["0%", "300%", "0%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            style={{ filter: "blur(2px)" }}
          />
        </div>

        {/* Cards dos subtemas */}
        <div className="space-y-6">
          {subtemasFiltrados.map((subtema, index) => {
            const isLeft = index % 2 === 0;
            const subtemaNumero = index + 1;
            
            return (
              <motion.div
                key={subtema.id}
                className="relative flex items-center"
                initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
              >
                {/* Card esquerdo */}
                <div className={`w-[44%] h-[130px] ${isLeft ? 'mr-auto pr-2' : 'invisible pointer-events-none'}`}>
                  {isLeft && (
                    <motion.div
                      onClick={() => navigate(`/oab/trilhas-aprovacao/${encodeURIComponent(decodedArea)}/${encodeURIComponent(decodedTema)}/${subtema.id}`)}
                      whileHover={{ scale: 1.03, x: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="cursor-pointer rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 shadow-lg shadow-red-900/25 transition-all duration-300 border border-red-500/40 hover:shadow-xl hover:shadow-red-600/20 h-full flex flex-col overflow-hidden"
                    >
                      {/* Label do subtema */}
                      <div className="px-4 py-2 bg-white/10 border-b border-white/10 shrink-0 text-center">
                        <span className="text-[11px] font-bold tracking-wide text-white/90 uppercase">Subtema {subtemaNumero}</span>
                      </div>
                      {/* Conteúdo */}
                      <div className="px-3 py-2 flex-1 flex items-center justify-center text-center">
                        <h3 className="text-sm font-medium text-white leading-snug">
                          {subtema.subtema}
                        </h3>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Marcador central - Pegadas */}
                <div className="w-[12%] shrink-0 flex items-center justify-center">
                  <motion.div 
                    className="p-1.5 rounded-full bg-red-500/18 border border-red-400/40"
                    whileHover={{ scale: 1.2 }}
                    animate={{ 
                      boxShadow: ["0 0 0 0 rgba(239, 68, 68, 0.25)", "0 0 0 6px rgba(239, 68, 68, 0)", "0 0 0 0 rgba(239, 68, 68, 0.25)"]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ transform: isLeft ? 'scaleX(-1)' : 'scaleX(1)' }}
                  >
                    <Footprints className="w-4 h-4 text-red-400" />
                  </motion.div>
                </div>

                {/* Card direito */}
                <div className={`w-[44%] h-[130px] ${!isLeft ? 'ml-auto pl-2' : 'invisible pointer-events-none'}`}>
                  {!isLeft && (
                    <motion.div
                      onClick={() => navigate(`/oab/trilhas-aprovacao/${encodeURIComponent(decodedArea)}/${encodeURIComponent(decodedTema)}/${subtema.id}`)}
                      whileHover={{ scale: 1.03, x: 4 }}
                      whileTap={{ scale: 0.97 }}
                      className="cursor-pointer rounded-2xl bg-gradient-to-bl from-red-600 via-red-700 to-red-800 shadow-lg shadow-red-900/25 transition-all duration-300 border border-red-500/40 hover:shadow-xl hover:shadow-red-600/20 h-full flex flex-col overflow-hidden"
                    >
                      {/* Label do subtema */}
                      <div className="px-4 py-2 bg-white/10 border-b border-white/10 shrink-0 text-center">
                        <span className="text-[11px] font-bold tracking-wide text-white/90 uppercase">Subtema {subtemaNumero}</span>
                      </div>
                      {/* Conteúdo */}
                      <div className="px-3 py-2 flex-1 flex items-center justify-center text-center">
                        <h3 className="text-sm font-medium text-white leading-snug">
                          {subtema.subtema}
                        </h3>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {subtemasFiltrados.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum conteúdo encontrado para "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
