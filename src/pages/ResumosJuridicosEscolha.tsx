import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Search, Scale, PenTool, Scroll, 
  FileText, FileUp, Image,
  BookMarked, Loader2, ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/useDebounce";

// ABA 2: PERSONALIZADO
const categoriasPersonalizado = [
  { id: "texto", title: "Colar Texto", description: "Digite ou cole texto jurídico", icon: FileText, route: "/resumos-juridicos/personalizado?tipo=texto" },
  { id: "pdf", title: "Upload PDF", description: "Envie arquivos PDF", icon: FileUp, route: "/resumos-juridicos/personalizado?tipo=pdf" },
  { id: "imagem", title: "Foto/Imagem", description: "Envie fotos de documentos", icon: Image, route: "/resumos-juridicos/personalizado?tipo=imagem" },
];

export default function ResumosJuridicosEscolha() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("materia");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: areasData, isLoading } = useQuery({
    queryKey: ['resumos-juridicos-areas-hub'],
    queryFn: async () => {
      let allData: { area: string }[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('RESUMO')
          .select('area')
          .not('area', 'is', null)
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
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const totalResumos = useMemo(() => {
    return areasData?.reduce((acc, item) => acc + item.count, 0) || 0;
  }, [areasData]);

  const areasFiltradas = useMemo(() => {
    if (!areasData) return [];
    if (!debouncedSearch.trim()) return areasData;
    const termo = debouncedSearch.toLowerCase();
    return areasData.filter(a => a.area.toLowerCase().includes(termo));
  }, [areasData, debouncedSearch]);

  const customFiltrados = useMemo(() => {
    if (!debouncedSearch.trim()) return categoriasPersonalizado;
    return categoriasPersonalizado.filter(a => a.title.toLowerCase().includes(debouncedSearch.toLowerCase()));
  }, [debouncedSearch]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="px-4 pt-4 pb-3">
          {/* Back button */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 -ml-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Resumos Jurídicos</h1>
              <p className="text-xs text-muted-foreground">
                {totalResumos.toLocaleString('pt-BR')} resumos disponíveis
              </p>
            </div>
            <div className="p-2 rounded-xl bg-red-600/10">
              <Scroll className="w-5 h-5 text-red-500" />
            </div>
          </div>

          {/* Busca */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar área, tema ou subtema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50 rounded-xl h-10 text-sm"
            />
          </div>

          {/* Tabs - apenas Matéria e Custom */}
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-secondary/60 h-9 p-0.5">
              <TabsTrigger value="materia" className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white gap-1">
                <BookMarked className="w-3.5 h-3.5" />
                Matéria
              </TabsTrigger>
              <TabsTrigger value="personalizado" className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-1">
                <PenTool className="w-3.5 h-3.5" />
                Custom
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pt-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-red-500" />
          </div>
        ) : (
          <>
            {/* ABA MATÉRIA - Cards cinza com ícone vermelho */}
            {abaAtiva === "materia" && (
              <div className="space-y-2.5">
                {areasFiltradas.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">
                    Nenhuma matéria encontrada
                  </div>
                ) : (
                  areasFiltradas.map((item, index) => (
                    <button
                      key={item.area}
                      onClick={() => navigate(`/resumos-juridicos/prontos/${encodeURIComponent(item.area)}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-red-500/30 hover:bg-accent/30 transition-all duration-200 active:scale-[0.98] group"
                    >
                      <div className="relative w-12 h-12 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0">
                        <Scale className="w-6 h-6 text-red-500" />
                        <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-md bg-red-600 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                          {item.area}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.count.toLocaleString('pt-BR')} resumos
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-red-500 transition-colors" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* ABA PERSONALIZADO - Cards cinza com ícone vermelho */}
            {abaAtiva === "personalizado" && (
              <div className="space-y-2.5">
                {customFiltrados.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">Nenhum resultado</div>
                ) : (
                  customFiltrados.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.route)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-red-500/30 hover:bg-accent/30 transition-all duration-200 active:scale-[0.98] group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0">
                          <Icon className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-red-500 transition-colors" />
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
