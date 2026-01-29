import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Loader2, Footprints } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TemaResumo {
  tema: string;
  ordem: number | null;
  total_subtemas: number;
}

export default function TrilhaAreaTemas() {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const decodedArea = area ? decodeURIComponent(area) : "";
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar temas da área
  const { data: temas, isLoading } = useQuery({
    queryKey: ['trilhas-aprovacao-temas', decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('RESUMO')
        .select('tema, "ordem Tema"')
        .eq('area', decodedArea)
        .not('tema', 'is', null);

      if (error) throw error;

      // Agrupar por tema e contar subtemas
      const temaMap = new Map<string, { ordem: number | null; count: number }>();
      
      data?.forEach((row: any) => {
        if (!row.tema) return;
        
        const ordemTema = row["ordem Tema"];
        if (!temaMap.has(row.tema)) {
          temaMap.set(row.tema, { ordem: typeof ordemTema === 'number' ? ordemTema : null, count: 0 });
        }
        
        temaMap.get(row.tema)!.count++;
      });

      // Converter para array e ordenar
      const result: TemaResumo[] = Array.from(temaMap.entries()).map(([tema, data]) => ({
        tema,
        ordem: data.ordem,
        total_subtemas: data.count
      }));

      // Ordenar por ordem ou nome
      return result.sort((a, b) => {
        if (a.ordem !== null && b.ordem !== null) return a.ordem - b.ordem;
        if (a.ordem !== null) return -1;
        if (b.ordem !== null) return 1;
        return a.tema.localeCompare(b.tema);
      });
    },
    enabled: !!decodedArea
  });

  // Filtrar temas pelo termo de busca e excluir "Peça Prática"
  const temasFiltrados = useMemo(() => {
    if (!temas) return [];
    
    // Filtrar temas que contêm "Peça Prática"
    const semPecaPratica = temas.filter(t => 
      !t.tema.toLowerCase().includes('peça prática') && 
      !t.tema.toLowerCase().includes('peca pratica')
    );
    
    if (!searchTerm.trim()) return semPecaPratica;
    
    const termo = searchTerm.toLowerCase();
    return semPecaPratica.filter(t => t.tema.toLowerCase().includes(termo));
  }, [temas, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 pb-24">
      {/* Header com estilo Em Alta vermelho claro */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-background via-background/98 to-background/95 backdrop-blur-md border-b border-red-600/25">
        <div className="px-4 py-5">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/oab')}
              className="p-2.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 transition-all duration-300 border border-red-600/35"
            >
              <ArrowLeft className="w-5 h-5 text-red-500" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{decodedArea}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {temas?.length || 0} temas disponíveis
              </p>
            </div>
          </div>

          {/* Busca com estilo vermelho */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 bg-card/50 border-red-600/25 focus:border-red-500/50 rounded-xl h-11"
            />
          </div>
        </div>
      </div>

      {/* Timeline de Temas */}
      <div className="relative py-10 px-4">
        {/* Linha vertical central vermelho */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2">
          <div className="absolute inset-0 bg-gradient-to-b from-red-600/45 via-red-600/25 to-transparent" />
          <motion.div
            className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-red-500 via-red-500/70 to-transparent rounded-full"
            animate={{ y: ["0%", "300%", "0%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            style={{ filter: "blur(2px)" }}
          />
        </div>

        {/* Cards dos temas */}
        <div className="space-y-6">
          {temasFiltrados.map((tema, index) => {
            const isLeft = index % 2 === 0;
            const temaNumero = index + 1;
            
            return (
              <motion.div
                key={tema.tema}
                className="relative flex items-center"
                initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
              >
                {/* Card esquerdo */}
                <div className={`w-[44%] h-[140px] ${isLeft ? 'mr-auto pr-2' : 'invisible pointer-events-none'}`}>
                  {isLeft && (
                    <motion.div
                      onClick={() => navigate(`/oab/trilhas-aprovacao/${encodeURIComponent(decodedArea)}/${encodeURIComponent(tema.tema)}`)}
                      whileHover={{ scale: 1.03, x: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="cursor-pointer rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 shadow-lg shadow-red-900/25 transition-all duration-300 border border-red-500/40 hover:shadow-xl hover:shadow-red-600/20 h-full flex flex-col overflow-hidden"
                    >
                      {/* Label do tema */}
                      <div className="px-4 py-2 bg-white/10 border-b border-white/10 shrink-0 text-center">
                        <span className="text-[11px] font-bold tracking-wide text-white/90 uppercase">Tema {temaNumero}</span>
                      </div>
                      {/* Conteúdo */}
                      <div className="px-3 py-2 flex-1 flex items-center justify-center text-center">
                        <h3 className="text-sm font-medium text-white leading-snug">
                          {tema.tema}
                        </h3>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Marcador central - Pegadas */}
                <div className="w-[12%] shrink-0 flex items-center justify-center">
                  <motion.div 
                    className="p-1.5 rounded-full bg-red-600/20 border border-red-500/45"
                    whileHover={{ scale: 1.2 }}
                    animate={{ 
                      boxShadow: ["0 0 0 0 rgba(220, 38, 38, 0.25)", "0 0 0 6px rgba(220, 38, 38, 0)", "0 0 0 0 rgba(220, 38, 38, 0.25)"]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ transform: isLeft ? 'scaleX(-1)' : 'scaleX(1)' }}
                  >
                    <Footprints className="w-4 h-4 text-red-500" />
                  </motion.div>
                </div>

                {/* Card direito */}
                <div className={`w-[44%] h-[140px] ${!isLeft ? 'ml-auto pl-2' : 'invisible pointer-events-none'}`}>
                  {!isLeft && (
                    <motion.div
                      onClick={() => navigate(`/oab/trilhas-aprovacao/${encodeURIComponent(decodedArea)}/${encodeURIComponent(tema.tema)}`)}
                      whileHover={{ scale: 1.03, x: 4 }}
                      whileTap={{ scale: 0.97 }}
                      className="cursor-pointer rounded-2xl bg-gradient-to-bl from-red-600 via-red-700 to-red-800 shadow-lg shadow-red-900/25 transition-all duration-300 border border-red-500/40 hover:shadow-xl hover:shadow-red-600/20 h-full flex flex-col overflow-hidden"
                    >
                      {/* Label do tema */}
                      <div className="px-4 py-2 bg-white/10 border-b border-white/10 shrink-0 text-center">
                        <span className="text-[11px] font-bold tracking-wide text-white/90 uppercase">Tema {temaNumero}</span>
                      </div>
                      {/* Conteúdo */}
                      <div className="px-3 py-2 flex-1 flex items-center justify-center text-center">
                        <h3 className="text-sm font-medium text-white leading-snug">
                          {tema.tema}
                        </h3>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {temasFiltrados.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum tema encontrado para "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
