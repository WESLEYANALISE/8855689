import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Loader2, CheckCircle, ChevronRight, Library } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHero } from "@/components/PageHero";
import { supabase } from "@/integrations/supabase/client";

interface LivroDisponivel {
  id: number;
  livro: string;
  autor: string;
  imagem: string;
  paginasDisponiveis: number;
}

const LeituraDinamica = () => {
  const navigate = useNavigate();
  const [livros, setLivros] = useState<LivroDisponivel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarLivros();
  }, []);

  const carregarLivros = async () => {
    try {
      // Buscar livros da biblioteca de clássicos
      const { data: livrosData, error: livrosError } = await supabase
        .from("BIBLIOTECA-CLASSICOS")
        .select("id, livro, autor, imagem")
        .order("livro");

      if (livrosError) throw livrosError;

      // Buscar páginas disponíveis na leitura dinâmica
      const { data: paginasData } = await supabase
        .from("BIBLIOTECA-LEITURA-DINAMICA")
        .select("\"Titulo da Obra\"");

      const paginasMap = new Map<string, number>();
      paginasData?.forEach((row: any) => {
        const titulo = row["Titulo da Obra"];
        if (titulo) {
          paginasMap.set(titulo, (paginasMap.get(titulo) || 0) + 1);
        }
      });

      // Filtrar apenas livros com páginas disponíveis
      const livrosDisponiveis = (livrosData || [])
        .map(livro => ({
          ...livro,
          paginasDisponiveis: paginasMap.get(livro.livro) || 0
        }))
        .filter(livro => livro.paginasDisponiveis > 0);

      setLivros(livrosDisponiveis);
    } catch (error) {
      console.error("Erro ao carregar livros:", error);
    } finally {
      setCarregando(false);
    }
  };

  const livrosFiltrados = livros.filter(livro =>
    livro.livro?.toLowerCase().includes(busca.toLowerCase()) ||
    livro.autor?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleLivroClick = (livro: LivroDisponivel) => {
    // Navegar para a página do livro na biblioteca de clássicos
    navigate(`/bibliotecas/classicos/${livro.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-amber-950/10 to-neutral-950 pb-20">
      <PageHero
        title="Leitura Dinâmica"
        subtitle="Leia livros clássicos com formatação premium para mobile"
        icon={BookOpen}
        iconGradient="from-amber-500/20 to-amber-600/10"
        iconColor="text-amber-400"
        lineColor="via-amber-500"
        pageKey="leitura-dinamica"
      />

      <div className="px-3 md:px-6 space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar livro ou autor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 bg-card/50 border-white/10"
          />
        </div>

        {/* Contagem */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Library className="w-4 h-4" />
          <span>{livros.length} livros disponíveis</span>
        </div>

        {/* Lista de livros */}
        {carregando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : livrosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {busca ? "Nenhum livro encontrado" : "Nenhum livro disponível ainda"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-2 pr-2">
              {livrosFiltrados.map(livro => (
                <div
                  key={livro.id}
                  onClick={() => handleLivroClick(livro)}
                  className="flex items-center gap-3 bg-card/50 border border-white/10 rounded-xl p-3 cursor-pointer hover:bg-card/80 hover:border-amber-500/30 transition-all"
                >
                  <img 
                    src={livro.imagem} 
                    alt={livro.livro}
                    className="w-14 h-20 object-cover rounded-lg shadow-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">
                      {livro.livro}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {livro.autor}
                    </p>
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {livro.paginasDisponiveis} páginas
                    </Badge>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default LeituraDinamica;
