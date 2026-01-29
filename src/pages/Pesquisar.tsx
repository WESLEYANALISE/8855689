import { Search, X, Sparkles, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useBuscaGlobal } from "@/hooks/useBuscaGlobal";
import { CategoriaCard } from "@/components/pesquisa/CategoriaCard";
import { BuscaGlobalSkeleton } from "@/components/pesquisa/BuscaGlobalSkeleton";

// Sugestões de busca populares
const sugestoesBusca = [
  { termo: "princípios penais", icon: "⚖️" },
  { termo: "constituição", icon: "📜" },
  { termo: "direito civil", icon: "📚" },
  { termo: "processo penal", icon: "⚡" },
  { termo: "trabalhista", icon: "💼" },
  { termo: "contratos", icon: "📝" },
];

const Pesquisar = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  
  const { resultados, isSearching, totalResults, error } = useBuscaGlobal(query, true);

  const hasSearched = query.length >= 3;
  const showResults = hasSearched && !isSearching && resultados.length > 0;
  const showEmpty = hasSearched && !isSearching && resultados.length === 0;
  const showInitial = !hasSearched && !isSearching;

  // Contagem por tipo de conteúdo
  const categoriasComResultados = useMemo(() => {
    return resultados.filter(r => r.count > 0).length;
  }, [resultados]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-4 max-w-4xl mx-auto">
          <div className="mb-4">
            <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
              <Search className="w-6 h-6 text-primary" />
              Pesquisar
            </h1>
            <p className="text-sm text-muted-foreground">
              Busque em todas as categorias do app
            </p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Digite pelo menos 3 caracteres..." 
              className="pl-10 pr-10 h-12 text-base rounded-xl border-2 focus:border-primary transition-colors" 
              value={query}
              onChange={(e) => setQuery(e.target.value)} 
              autoFocus 
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Results Summary */}
          {showResults && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                <Sparkles className="w-3.5 h-3.5" />
                {totalResults} resultados
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
                <TrendingUp className="w-3.5 h-3.5" />
                {categoriasComResultados} categorias
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* Initial State - Search Suggestions */}
        {showInitial && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">
                {query.length === 0 ? 'O que você procura?' : `Digite mais ${3 - query.length} caractere${3 - query.length > 1 ? 's' : ''}`}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Busque em artigos de lei, videoaulas, cursos, flashcards, bibliotecas, dicionário e muito mais
              </p>
            </div>

            {/* Popular Searches */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Buscas populares
              </h3>
              <div className="flex flex-wrap gap-2">
                {sugestoesBusca.map((sugestao) => (
                  <button
                    key={sugestao.termo}
                    onClick={() => setQuery(sugestao.termo)}
                    className="px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <span>{sugestao.icon}</span>
                    {sugestao.termo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <BuscaGlobalSkeleton />
        )}

        {/* Empty State */}
        {showEmpty && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Tente buscar por outros termos ou verifique a ortografia
            </p>
          </div>
        )}

        {/* Results - Category Cards */}
        {showResults && (
          <div className="space-y-4">
            {resultados.map((categoria) => (
              <CategoriaCard 
                key={categoria.id} 
                categoria={categoria} 
                searchTerm={query}
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <X className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Erro na busca</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pesquisar;
