import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

const MeuBrasilBusca = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (queryParam) {
      buscar(queryParam);
    }
  }, [queryParam]);

  const buscar = async (termo: string) => {
    if (!termo.trim()) return;

    try {
      setLoading(true);
      setResults([]);

      const { data, error } = await supabase.functions.invoke('buscar-artigo-wikipedia', {
        body: {
          action: 'search',
          query: termo
        }
      });

      if (error) throw error;

      setResults(data.results || []);

      if (data.results?.length === 0) {
        toast.info('Nenhum resultado encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar:', error);
      toast.error('Erro ao realizar busca');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/meu-brasil/busca?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/meu-brasil")}
        className="mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
          <Search className="w-6 h-6" />
          Buscar no Meu Brasil
        </h1>
        <p className="text-sm text-muted-foreground">
          Pesquise em todas as categorias
        </p>
      </div>

      {/* Busca */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Digite sua busca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-muted-foreground">Buscando...</p>
        </div>
      )}

      {/* Resultados */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
          </p>

          {results.map((result) => (
            <button
              key={result.pageid}
              onClick={() => navigate(`/meu-brasil/artigo/${encodeURIComponent(result.title)}`)}
              className="w-full bg-card border border-border rounded-lg p-4 text-left hover:border-accent transition-colors"
            >
              <h3 className="font-bold text-base mb-2">{result.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {stripHtml(result.snippet)}...
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Sem resultados */}
      {!loading && results.length === 0 && queryParam && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum resultado encontrado para "{queryParam}"
          </p>
        </div>
      )}
    </div>
  );
};

export default MeuBrasilBusca;
