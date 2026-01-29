import { useState, useMemo } from "react";
import { Book, Loader2, Lightbulb } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDebounce } from "@/hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import { PageHero } from "@/components/PageHero";
import { DicionarioLetterGrid, DicionarioSearchBar, normalizeToBaseLetter } from "@/components/dicionario";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface DicionarioTermo {
  Letra: string | null;
  Palavra: string | null;
  Significado: string | null;
  "Exemplo de Uso 1": string | null;
  "Exemplo de Uso 2": string | null;
  exemplo_pratico?: string | null;
}

interface LetterCount {
  letter: string;
  count: number;
}

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const Dicionario = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTermo, setSelectedTermo] = useState<DicionarioTermo | null>(null);
  const [exemploPratico, setExemploPratico] = useState<string>("");
  const [loadingExemplo, setLoadingExemplo] = useState(false);
  const { toast } = useToast();

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Buscar contagem de termos por letra (agrupando acentuadas)
  const { data: letterCounts = [], isLoading: isLoadingLetters } = useQuery({
    queryKey: ["dicionario-letter-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("DICIONARIO" as any)
        .select("Letra")
        .not("Letra", "is", null);

      if (error) throw error;

      // Agrupar letras acentuadas e contar
      const countMap = new Map<string, number>();
      
      (data as any[]).forEach((item) => {
        const baseLetter = normalizeToBaseLetter(item.Letra || "");
        if (baseLetter && /^[A-Z]$/.test(baseLetter)) {
          countMap.set(baseLetter, (countMap.get(baseLetter) || 0) + 1);
        }
      });

      return ALFABETO.map((letter) => ({
        letter,
        count: countMap.get(letter) || 0,
        available: (countMap.get(letter) || 0) > 0,
      }));
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  // Busca global sem limite (para autocomplete)
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["dicionario-search", debouncedSearch],
    queryFn: async () => {
      const termo = debouncedSearch.trim();
      if (!termo || termo.length < 2) return [];

      const { data, error } = await supabase
        .from("DICIONARIO" as any)
        .select("*")
        .or(`Palavra.ilike.%${termo}%,Significado.ilike.%${termo}%`)
        .order("Palavra", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Ordenar priorizando matches exatos e início de palavra
      return ((data || []) as unknown as DicionarioTermo[]).sort((a, b) => {
        const palavraA = (a.Palavra || "").toLowerCase();
        const palavraB = (b.Palavra || "").toLowerCase();
        const searchTerm = termo.toLowerCase();

        const exatoA = palavraA === searchTerm;
        const exatoB = palavraB === searchTerm;
        if (exatoA && !exatoB) return -1;
        if (!exatoA && exatoB) return 1;

        const comecaA = palavraA.startsWith(searchTerm);
        const comecaB = palavraB.startsWith(searchTerm);
        if (comecaA && !comecaB) return -1;
        if (!comecaA && comecaB) return 1;

        return palavraA.localeCompare(palavraB);
      });
    },
    enabled: debouncedSearch.trim().length >= 2,
  });

  const handleSearchResultClick = (palavra: string) => {
    const termo = searchResults.find((t) => t.Palavra === palavra);
    if (termo) {
      setSelectedTermo(termo);
      setExemploPratico("");
    }
  };

  const handleGerarExemplo = async () => {
    if (!selectedTermo?.Palavra || !selectedTermo?.Significado) return;

    if (exemploPratico) {
      setExemploPratico("");
      return;
    }

    if (selectedTermo.exemplo_pratico) {
      setExemploPratico(selectedTermo.exemplo_pratico);
      return;
    }

    setLoadingExemplo(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-exemplo-pratico", {
        body: { palavra: selectedTermo.Palavra, significado: selectedTermo.Significado },
      });

      if (error) throw error;
      setExemploPratico(data.exemplo);

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
      setLoadingExemplo(false);
    }
  };

  const closeTermoDetail = () => {
    setSelectedTermo(null);
    setExemploPratico("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-amber-950/10 to-neutral-950 pb-24">
      <PageHero
        title="Dicionário Jurídico"
        subtitle="Consulte termos e definições do direito"
        icon={Book}
        iconGradient="from-amber-500/20 to-amber-600/10"
        iconColor="text-amber-400"
        lineColor="via-amber-500"
        pageKey="dicionario"
        showGenerateButton={true}
      />

      <div className="px-4 max-w-5xl mx-auto">
        {/* Search Bar */}
        <DicionarioSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          results={searchResults.map((r) => ({
            Palavra: r.Palavra || "",
            Significado: r.Significado || "",
          }))}
          isSearching={isSearching}
          onResultClick={handleSearchResultClick}
          placeholder="Buscar termo jurídico..."
          className="mb-8"
        />

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Navegue pelo alfabeto
          </h2>
          <span className="text-sm text-muted-foreground">
            {letterCounts.reduce((acc, l) => acc + l.count, 0).toLocaleString()} termos
          </span>
        </div>

        {/* Letter Grid */}
        {isLoadingLetters ? (
          <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-13 gap-2">
            {Array.from({ length: 26 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : (
          <DicionarioLetterGrid lettersData={letterCounts} />
        )}

        {/* Empty state */}
        {!searchQuery && !selectedTermo && (
          <div className="text-center py-12 mt-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 mb-4">
              <Book className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">
              Dicionário Jurídico Completo
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Busque por termos ou selecione uma letra para navegar por todas as definições
            </p>
          </div>
        )}
      </div>

      {/* Term Detail Modal */}
      <AnimatePresence>
        {selectedTermo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={closeTermoDetail}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto border border-border/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-3">
                  {selectedTermo.Palavra}
                </h2>
                <p className="text-foreground/90 leading-relaxed mb-4">
                  {selectedTermo.Significado}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="mb-4 border-border/50 hover:border-amber-500/50"
                  onClick={handleGerarExemplo}
                  disabled={loadingExemplo}
                >
                  {loadingExemplo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {exemploPratico ? "Fechar" : "Ver"} Exemplo Prático
                    </>
                  )}
                </Button>

                <AnimatePresence>
                  {exemploPratico && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20"
                    >
                      <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-3 h-3" />
                        Exemplo Prático (IA)
                      </p>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {exemploPratico}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {(selectedTermo["Exemplo de Uso 1"] || selectedTermo["Exemplo de Uso 2"]) && (
                  <div className="pt-4 border-t border-border/30 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Exemplos de uso:
                    </p>
                    {selectedTermo["Exemplo de Uso 1"] && (
                      <p className="text-sm text-muted-foreground italic">
                        • {selectedTermo["Exemplo de Uso 1"]}
                      </p>
                    )}
                    {selectedTermo["Exemplo de Uso 2"] && (
                      <p className="text-sm text-muted-foreground italic">
                        • {selectedTermo["Exemplo de Uso 2"]}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="w-full mt-6"
                  onClick={closeTermoDetail}
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dicionario;
