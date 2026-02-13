import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { BibliotecaTopNav } from "@/components/biblioteca/BibliotecaTopNav";

interface ResultItem {
  id: number;
  titulo: string;
  area?: string;
  capa?: string;
  biblioteca: string;
  bibliotecaLabel: string;
}

const BIBLIOTECAS = [
  { tabela: "BIBLIOTECA-ESTUDOS", label: "Estudos", campoTitulo: "Tema", campoCapa: "Capa-livro", campoArea: "Área" },
  { tabela: "BIBLIOTECA-CLASSICOS", label: "Clássicos", campoTitulo: "livro", campoCapa: "imagem", campoArea: "area" },
  { tabela: "BIBLIOTECA-FORA-DA-TOGA", label: "Fora da Toga", campoTitulo: "livro", campoCapa: "capa-livro", campoArea: "area" },
  { tabela: "BIBLIOTECA-ORATORIA", label: "Oratória", campoTitulo: "livro", campoCapa: "imagem", campoArea: "area" },
  { tabela: "BIBLIOTECA-LIDERANÇA", label: "Liderança", campoTitulo: "livro", campoCapa: "imagem", campoArea: "area" },
  { tabela: "BIBLIOTECA-PORTUGUES", label: "Português", campoTitulo: "livro", campoCapa: "imagem", campoArea: "area" },
  { tabela: "BIBLIOTECA-PESQUISA-CIENTIFICA", label: "Pesquisa Científica", campoTitulo: "livro", campoCapa: "imagem", campoArea: "area" },
  { tabela: "BIBLIOTECA-POLITICA", label: "Política", campoTitulo: "livro", campoCapa: "imagem", campoArea: "area" },
  { tabela: "BIBILIOTECA-OAB", label: "OAB", campoTitulo: "Tema", campoCapa: "Capa-livro", campoArea: "Área" },
] as const;

const SUGESTOES = ["Direito Civil", "Constitucional", "Penal", "Liderança", "Oratória", "Português"];

const BibliotecaBusca = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const buscar = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);

    const promises = BIBLIOTECAS.map(async (bib) => {
      try {
        const { data } = await supabase
          .from(bib.tabela as any)
          .select("*")
          .ilike(bib.campoTitulo, `%${searchQuery}%`)
          .limit(10);

        if (!data) return [];
        return (data as any[]).map((item: any) => ({
          id: item.id,
          titulo: item[bib.campoTitulo] || "Sem título",
          area: item[bib.campoArea] || undefined,
          capa: item[bib.campoCapa] || undefined,
          biblioteca: bib.tabela,
          bibliotecaLabel: bib.label,
        }));
      } catch {
        return [];
      }
    });

    const allResults = await Promise.allSettled(promises);
    const merged: ResultItem[] = [];
    for (const r of allResults) {
      if (r.status === "fulfilled") merged.push(...r.value);
    }

    setResults(merged);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    buscar(query);
  };

  const grouped = results.reduce<Record<string, ResultItem[]>>((acc, item) => {
    if (!acc[item.bibliotecaLabel]) acc[item.bibliotecaLabel] = [];
    acc[item.bibliotecaLabel].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background pb-8">
      <BibliotecaTopNav activeTab="acervo" />
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-950/30 to-background px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Search className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Buscar Livros</h1>
            <p className="text-xs text-muted-foreground">Pesquise em todas as bibliotecas</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite o título ou tema..."
            className="pl-10 pr-4 h-12 bg-card border-amber-900/20 focus:border-amber-500/50 rounded-xl"
            autoFocus
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </form>

        {/* Sugestões */}
        {!searched && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Sugestões
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); buscar(s); }}
                  className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resultados */}
      <div className="px-4 mt-2">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum livro encontrado</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Tente outra palavra-chave</p>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([label, items]) => (
          <div key={label} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-foreground">{label}</h2>
              <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={`${item.biblioteca}-${item.id}`}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30 hover:border-amber-500/30 hover:bg-card/80 transition-all text-left"
                  onClick={() => {
                    const routeMap: Record<string, string> = {
                      "BIBLIOTECA-ESTUDOS": "/biblioteca-estudos",
                      "BIBLIOTECA-CLASSICOS": `/biblioteca-classicos/${item.id}`,
                      "BIBLIOTECA-FORA-DA-TOGA": `/biblioteca-fora-da-toga/${item.id}`,
                      "BIBLIOTECA-ORATORIA": `/biblioteca-oratoria/${item.id}`,
                      "BIBLIOTECA-LIDERANÇA": `/biblioteca-lideranca/${item.id}`,
                      "BIBLIOTECA-PORTUGUES": `/biblioteca-portugues/${item.id}`,
                      "BIBLIOTECA-PESQUISA-CIENTIFICA": `/biblioteca-pesquisa-cientifica`,
                      "BIBLIOTECA-POLITICA": `/biblioteca-politica`,
                      "BIBILIOTECA-OAB": "/biblioteca-oab",
                    };
                    navigate(routeMap[item.biblioteca] || "/bibliotecas");
                  }}
                >
                  {item.capa ? (
                    <img src={item.capa} alt={item.titulo} className="w-10 h-14 rounded-md object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-14 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-amber-500/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{item.titulo}</p>
                    {item.area && <p className="text-xs text-muted-foreground line-clamp-1">{item.area}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      
    </div>
  );
};

export default BibliotecaBusca;
