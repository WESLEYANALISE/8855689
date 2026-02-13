import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Search, BookOpen, Scale, PenTool, Scroll, 
  Crown, Shield, Gavel, HandCoins, BookText, FileText, FileUp, Image,
  BookMarked, Loader2, ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/useDebounce";

// Paleta de cores rotativas estilo Vade Mecum
const CARD_COLORS = [
  { bg: "from-red-600 to-red-800", badge: "bg-red-900/60" },
  { bg: "from-amber-600 to-amber-800", badge: "bg-amber-900/60" },
  { bg: "from-emerald-600 to-emerald-800", badge: "bg-emerald-900/60" },
  { bg: "from-blue-600 to-blue-800", badge: "bg-blue-900/60" },
  { bg: "from-purple-600 to-purple-800", badge: "bg-purple-900/60" },
  { bg: "from-rose-600 to-rose-800", badge: "bg-rose-900/60" },
  { bg: "from-teal-600 to-teal-800", badge: "bg-teal-900/60" },
  { bg: "from-orange-600 to-orange-800", badge: "bg-orange-900/60" },
  { bg: "from-indigo-600 to-indigo-800", badge: "bg-indigo-900/60" },
  { bg: "from-cyan-600 to-cyan-800", badge: "bg-cyan-900/60" },
];

// ABA 2: ARTIGOS DE LEI
const categoriasArtigos = [
  { id: "constituicao", title: "Constituição", description: "CF/88 - Lei Fundamental", icon: Crown, route: "/resumos-juridicos/artigos-lei/temas?codigo=CF - Constituição Federal" },
  { id: "codigos", title: "Códigos e Leis", description: "CP, CC, CPC, CPP, CLT, CDC, CTN", icon: Scale, route: "/resumos-juridicos/artigos-lei/codigos" },
  { id: "legislacao-penal", title: "Legislação Penal", description: "Leis Penais Especiais", icon: Shield, route: "/resumos-juridicos/artigos-lei/legislacao-penal" },
  { id: "estatutos", title: "Estatutos", description: "ECA, OAB, Idoso, Cidade", icon: Gavel, route: "/resumos-juridicos/artigos-lei/estatutos" },
  { id: "previdenciario", title: "Previdenciário", description: "Custeio e Benefícios", icon: HandCoins, route: "/resumos-juridicos/artigos-lei/previdenciario" },
  { id: "sumulas", title: "Súmulas", description: "STF, STJ, TST, TSE", icon: BookText, route: "/resumos-juridicos/artigos-lei/sumulas" },
];

// ABA 3: PERSONALIZADO
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

  const artigosFiltrados = useMemo(() => {
    if (!debouncedSearch.trim()) return categoriasArtigos;
    return categoriasArtigos.filter(a => a.title.toLowerCase().includes(debouncedSearch.toLowerCase()));
  }, [debouncedSearch]);

  const customFiltrados = useMemo(() => {
    if (!debouncedSearch.trim()) return categoriasPersonalizado;
    return categoriasPersonalizado.filter(a => a.title.toLowerCase().includes(debouncedSearch.toLowerCase()));
  }, [debouncedSearch]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 transition-colors border border-red-600/20"
            >
              <ArrowLeft className="w-5 h-5 text-red-500" />
            </button>
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

          {/* Tabs */}
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-secondary/60 h-9 p-0.5">
              <TabsTrigger value="materia" className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white gap-1">
                <BookMarked className="w-3.5 h-3.5" />
                Matéria
              </TabsTrigger>
              <TabsTrigger value="artigos" className="text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white gap-1">
                <Scale className="w-3.5 h-3.5" />
                Artigos
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
            {/* ABA MATÉRIA - Cards coloridos sem imagem */}
            {abaAtiva === "materia" && (
              <div className="space-y-2.5">
                {areasFiltradas.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">
                    Nenhuma matéria encontrada
                  </div>
                ) : (
                  areasFiltradas.map((item, index) => {
                    const color = CARD_COLORS[index % CARD_COLORS.length];
                    return (
                      <button
                        key={item.area}
                        onClick={() => navigate(`/resumos-juridicos/prontos/${encodeURIComponent(item.area)}`)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${color.bg} hover:opacity-90 transition-all duration-200 active:scale-[0.98] group shadow-lg`}
                      >
                        {/* Ícone com badge */}
                        <div className="relative w-12 h-12 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                          <Scale className="w-6 h-6 text-white/90" />
                          <div className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-md ${color.badge} flex items-center justify-center border border-white/20`}>
                            <span className="text-[9px] font-bold text-white">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left min-w-0">
                          <h3 className="text-sm font-semibold text-white line-clamp-2">
                            {item.area}
                          </h3>
                          <p className="text-xs text-white/70 mt-0.5">
                            {item.count.toLocaleString('pt-BR')} resumos
                          </p>
                        </div>

                        <ChevronRight className="w-4 h-4 text-white/60 shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* ABA ARTIGOS */}
            {abaAtiva === "artigos" && (
              <div className="space-y-2.5">
                {artigosFiltrados.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">Nenhum resultado</div>
                ) : (
                  artigosFiltrados.map((item, index) => {
                    const Icon = item.icon;
                    const color = CARD_COLORS[(index + 3) % CARD_COLORS.length];
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.route)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${color.bg} hover:opacity-90 transition-all duration-200 active:scale-[0.98] group shadow-lg`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                          <Icon className="w-6 h-6 text-white/90" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h3 className="text-sm font-semibold text-white line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-white/70 mt-0.5">{item.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/60 shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* ABA PERSONALIZADO */}
            {abaAtiva === "personalizado" && (
              <div className="space-y-2.5">
                {customFiltrados.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">Nenhum resultado</div>
                ) : (
                  customFiltrados.map((item, index) => {
                    const Icon = item.icon;
                    const color = CARD_COLORS[(index + 5) % CARD_COLORS.length];
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.route)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${color.bg} hover:opacity-90 transition-all duration-200 active:scale-[0.98] group shadow-lg`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                          <Icon className="w-6 h-6 text-white/90" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h3 className="text-sm font-semibold text-white line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-white/70 mt-0.5">{item.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/60 shrink-0" />
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
