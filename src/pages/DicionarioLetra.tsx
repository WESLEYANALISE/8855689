import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Book, Search, ArrowLeft, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { DicionarioVirtualList, DicionarioAlphabetNav, normalizeToBaseLetter } from "@/components/dicionario";

interface DicionarioTermo {
  Letra: string | null;
  Palavra: string | null;
  Significado: string | null;
  "Exemplo de Uso 1": string | null;
  "Exemplo de Uso 2": string | null;
  exemplo_pratico?: string | null;
}

const DicionarioLetra = () => {
  const { letra } = useParams<{ letra: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [exemploPratico, setExemploPratico] = useState<Record<string, string>>({});
  const [loadingExemplo, setLoadingExemplo] = useState<Record<string, boolean>>({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 200);

  // Buscar termos da letra (incluindo acentuadas)
  const { data: termos = [], isLoading } = useQuery({
    queryKey: ["dicionario-letra", letra],
    queryFn: async () => {
      if (!letra) return [];

      const baseLetter = letra.toUpperCase();
      
      // Buscar todas as variantes acentuadas da letra
      const accentVariants: Record<string, string[]> = {
        'A': ['A', 'Á', 'À', 'Ã', 'Â'],
        'E': ['E', 'É', 'Ê'],
        'I': ['I', 'Í', 'Î'],
        'O': ['O', 'Ó', 'Ô', 'Õ'],
        'U': ['U', 'Ú', 'Û'],
        'C': ['C', 'Ç'],
      };

      const variants = accentVariants[baseLetter] || [baseLetter];
      
      const { data, error } = await supabase
        .from("DICIONARIO" as any)
        .select("*")
        .in("Letra", variants)
        .order("Palavra", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as DicionarioTermo[];
    },
    enabled: !!letra,
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  // Filtrar termos pela busca
  const termosFiltrados = useMemo(() => {
    if (!debouncedSearch.trim()) return termos;

    const termo = debouncedSearch.trim().toLowerCase();

    return termos
      .filter((t) => {
        const palavra = t.Palavra?.toLowerCase() || "";
        const significado = t.Significado?.toLowerCase() || "";
        return palavra.includes(termo) || significado.includes(termo);
      })
      .sort((a, b) => {
        const palavraA = a.Palavra?.toLowerCase() || "";
        const palavraB = b.Palavra?.toLowerCase() || "";
        const comecaA = palavraA.startsWith(termo);
        const comecaB = palavraB.startsWith(termo);

        if (comecaA && !comecaB) return -1;
        if (!comecaA && comecaB) return 1;
        return 0;
      });
  }, [termos, debouncedSearch]);

  // Letras disponíveis para navegação
  const availableLetters = useMemo(() => {
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  }, []);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGerarExemplo = useCallback(async (
    palavra: string,
    significado: string,
    existente?: string | null
  ) => {
    if (exemploPratico[palavra]) {
      setExemploPratico((prev) => {
        const novo = { ...prev };
        delete novo[palavra];
        return novo;
      });
      return;
    }

    if (existente) {
      setExemploPratico((prev) => ({ ...prev, [palavra]: existente }));
      return;
    }

    setLoadingExemplo((prev) => ({ ...prev, [palavra]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("gerar-exemplo-pratico", {
        body: { palavra, significado },
      });

      if (error) throw error;
      setExemploPratico((prev) => ({ ...prev, [palavra]: data.exemplo }));

      if (!data.cached) {
        toast({
          title: "Exemplo gerado!",
          description: "Salvo para consultas futuras.",
        });
      }
    } catch (error) {
      console.error("Erro ao gerar exemplo:", error);
      toast({
        title: "Erro ao gerar exemplo",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingExemplo((prev) => ({ ...prev, [palavra]: false }));
    }
  }, [exemploPratico, toast]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-neutral-950 via-amber-950/10 to-neutral-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/30">
        <div className="px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate("/dicionario")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">
                Letra {letra?.toUpperCase()}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "Carregando..." : `${termosFiltrados.length} de ${termos.length} termos`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-5xl mx-auto pt-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Filtrar termos..."
            className="pl-10 h-11 bg-card/80 backdrop-blur-sm border-border/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Alphabet Navigation (horizontal on mobile) */}
        <div className="mb-4 overflow-x-auto pb-2 -mx-4 px-4">
          <DicionarioAlphabetNav
            letters={availableLetters}
            currentLetter={letra?.toUpperCase()}
            onLetterClick={(l) => navigate(`/dicionario/${l}`)}
            className="min-w-max"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : termosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card mb-4">
              <Book className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">
              Nenhum termo encontrado
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `Não há resultados para "${searchQuery}"`
                : `Não há termos para a letra ${letra?.toUpperCase()}`}
            </p>
          </div>
        ) : (
          <DicionarioVirtualList
            termos={termosFiltrados}
            exemploPratico={exemploPratico}
            loadingExemplo={loadingExemplo}
            onGerarExemplo={handleGerarExemplo}
            height={typeof window !== 'undefined' ? window.innerHeight - 200 : 600}
          />
        )}
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center hover:bg-amber-600 transition-all animate-scale-in"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default DicionarioLetra;
