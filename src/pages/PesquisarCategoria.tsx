import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getCategoriaConfig, ResultadoItem } from "@/hooks/useBuscaGlobal";
import { ResultadoPreview } from "@/components/pesquisa/ResultadoPreview";
import { 
  Scale, PlayCircle, GraduationCap, Layers, BookOpen, Newspaper, 
  BookA, Brain, Film, Headphones, Target, Scroll, Gavel, FileText 
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<any>> = {
  Scale, PlayCircle, GraduationCap, Layers, BookOpen, Newspaper,
  BookA, Brain, Film, Headphones, Target, Scroll, Gavel, FileText
};

const PesquisarCategoria = () => {
  const { categoriaId } = useParams<{ categoriaId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchTerm = searchParams.get("q") || "";
  
  const [results, setResults] = useState<ResultadoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState("");
  
  const config = categoriaId ? getCategoriaConfig(categoriaId) : undefined;
  const IconComponent = config ? iconMap[config.icon] || Scale : Scale;

  const buscarResultados = useCallback(async () => {
    if (!config || !searchTerm) return;
    
    setIsLoading(true);
    const allResults: ResultadoItem[] = [];
    
    for (const tabela of config.tabelas) {
      try {
        const orConditions = tabela.colunas.map(col => `"${col}".ilike.%${searchTerm.toLowerCase()}%`).join(',');
        
        const { data, error } = await supabase
          .from(tabela.nome as any)
          .select('*')
          .or(orConditions)
          .limit(100);
        
        if (!error && data) {
          if (config.id === 'flashcards') {
            const seen = new Set<string>();
            const uniqueData = data.filter((item: any) => {
              const key = `${item.area}-${item.tema}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            allResults.push(...uniqueData.map((item: any) => tabela.formatResult(item, tabela.nome)));
          } else {
            allResults.push(...data.map((item: any) => tabela.formatResult(item, tabela.nome)));
          }
        }
      } catch (err) {
        console.error(`Erro ao buscar em ${tabela.nome}:`, err);
      }
    }
    
    setResults(allResults);
    setIsLoading(false);
  }, [config, searchTerm]);

  useEffect(() => {
    buscarResultados();
  }, [buscarResultados]);

  const filteredResults = filterTerm
    ? results.filter(r => 
        r.titulo.toLowerCase().includes(filterTerm.toLowerCase()) ||
        r.subtitulo?.toLowerCase().includes(filterTerm.toLowerCase()) ||
        r.extra?.toLowerCase().includes(filterTerm.toLowerCase())
      )
    : results;

  if (!config) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <p className="text-center text-muted-foreground">Categoria não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="p-4 max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl bg-secondary ${config.iconColor}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{config.nome}</h1>
              <p className="text-sm text-muted-foreground">
                Resultados para "{searchTerm}"
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto text-lg font-bold px-3 py-1">
              {results.length}
            </Badge>
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrar resultados..." 
              className="pl-10 pr-10 h-10"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
            />
            {filterTerm && (
              <button
                onClick={() => setFilterTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-4 max-w-4xl mx-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card border rounded-lg p-3 flex items-start gap-3">
                <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {filterTerm ? 'Nenhum resultado encontrado com esse filtro' : 'Nenhum resultado encontrado'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResults.map((item, index) => (
              <div key={item.id || index} className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors">
                <ResultadoPreview item={item} iconColor={config.iconColor} showFullInfo />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PesquisarCategoria;
