import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Scale, ArrowDownAZ, Clock, FileText, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

const ResumosProntos = () => {
  const navigate = useNavigate();
  const { area: areaFromUrl } = useParams<{ area: string }>();
  const areaSelecionada = areaFromUrl ? decodeURIComponent(areaFromUrl) : null;
  const [searchTema, setSearchTema] = useState("");
  const [ordenacaoTemas, setOrdenacaoTemas] = useState<"cronologica" | "alfabetica">("cronologica");
  const debouncedSearch = useDebounce(searchTema, 300);

  useEffect(() => {
    if (!areaFromUrl) navigate('/resumos-juridicos/prontos', { replace: true });
  }, [areaFromUrl, navigate]);

  const { data: temas, isLoading } = useQuery({
    queryKey: ["resumos-temas-hub", areaSelecionada],
    queryFn: async () => {
      if (!areaSelecionada) return [];

      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("RESUMO")
          .select("tema, \"ordem Tema\"")
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

      const temaMap = new Map<string, { tema: string; ordem: string; count: number }>();
      allData.forEach((item: any) => {
        if (item.tema) {
          const existing = temaMap.get(item.tema);
          if (existing) {
            existing.count++;
          } else {
            temaMap.set(item.tema, {
              tema: item.tema,
              ordem: item["ordem Tema"] || "0",
              count: 1,
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
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const temasFiltrados = useMemo(() => {
    if (!temas) return [];
    let filtered = temas;
    if (debouncedSearch.trim()) {
      filtered = filtered.filter(t => t.tema.toLowerCase().includes(debouncedSearch.toLowerCase()));
    }
    if (ordenacaoTemas === "alfabetica") {
      return [...filtered].sort((a, b) => a.tema.localeCompare(b.tema));
    }
    return filtered;
  }, [temas, debouncedSearch, ordenacaoTemas]);

  const totalResumos = temas?.reduce((acc, t) => acc + t.count, 0) || 0;

  if (!areaSelecionada) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="px-4 pt-4 pb-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <button onClick={() => navigate('/resumos-juridicos/prontos')} className="hover:text-red-500 transition-colors">
              Resumos
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium truncate">{areaSelecionada}</span>
          </div>

          <div className="mb-3">
            <h1 className="text-lg font-bold text-foreground truncate">{areaSelecionada}</h1>
            <p className="text-xs text-muted-foreground">
              {totalResumos} resumos · {temasFiltrados.length} temas
            </p>
          </div>

          {/* Busca */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar temas..."
              value={searchTema}
              onChange={(e) => setSearchTema(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50 rounded-xl h-10 text-sm"
            />
          </div>

          {/* Ordenação */}
          <div className="flex gap-1 bg-secondary/50 p-0.5 rounded-lg">
            <button
              onClick={() => setOrdenacaoTemas("cronologica")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-all ${
                ordenacaoTemas === "cronologica"
                  ? "bg-red-600 text-white font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Cronológica
            </button>
            <button
              onClick={() => setOrdenacaoTemas("alfabetica")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-all ${
                ordenacaoTemas === "alfabetica"
                  ? "bg-red-600 text-white font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              Alfabética
            </button>
          </div>
        </div>
      </div>

      {/* Lista de temas - Cards cinza com ícone vermelho */}
      <div className="px-4 pt-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-red-500" />
          </div>
        ) : temasFiltrados.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Nenhum tema encontrado
          </div>
        ) : (
          <div className="space-y-2">
            {temasFiltrados.map((tema, index) => {
              const ordemNum = parseInt(tema.ordem) || (index + 1);
              return (
                <button
                  key={tema.tema}
                  onClick={() => navigate(`/resumos-juridicos/prontos/${encodeURIComponent(areaSelecionada)}/${encodeURIComponent(tema.tema)}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-red-500/30 hover:bg-accent/30 transition-all duration-200 active:scale-[0.98] group"
                >
                  {/* Ícone vermelho com badge */}
                  <div className="relative w-12 h-12 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0">
                    <Scale className="w-6 h-6 text-red-500" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-md bg-red-600 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">
                        {String(ordemNum).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                      {tema.tema}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {tema.count} {tema.count === 1 ? "resumo" : "resumos"}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-red-500 transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumosProntos;
