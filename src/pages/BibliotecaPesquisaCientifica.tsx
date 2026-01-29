import { supabase } from "@/integrations/supabase/client";
import { Search, BookOpen, ChevronLeft, FileSearch } from "lucide-react";
import { useState, useMemo } from "react";
import { LivroCard } from "@/components/LivroCard";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useInstantCache } from "@/hooks/useInstantCache";
import { Loader2 } from "lucide-react";
import { useContentLimit } from "@/hooks/useContentLimit";
import { LockedContentListItem } from "@/components/LockedContentCard";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { Button } from "@/components/ui/button";
import { BibliotecaSortToggle, BibliotecaSortMode } from "@/components/biblioteca/BibliotecaSortToggle";
import { BibliotecaSobreCard, BIBLIOTECA_SOBRE_TEXTS } from "@/components/biblioteca/BibliotecaSobreCard";

interface BibliotecaItem {
  id: number;
  area: string | null;
  livro: string | null;
  autor: string | null;
  imagem: string | null;
  sobre: string | null;
  link: string | null;
  download: string | null;
}

interface CapaBiblioteca {
  Biblioteca: string;
  capa: string;
}

const BibliotecaPesquisaCientifica = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  const [sortMode, setSortMode] = useState<BibliotecaSortMode>("recomendada");

  // Cache instantâneo para capa
  const { data: capa } = useInstantCache<CapaBiblioteca>({
    cacheKey: "capa-biblioteca-pesquisa",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*")
        .eq("Biblioteca", "Biblioteca de Pesquisa Científica")
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Cache instantâneo para livros
  const { data: items, isLoading } = useInstantCache<BibliotecaItem[]>({
    cacheKey: "biblioteca-pesquisa-livros",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-PESQUISA-CIENTIFICA")
        .select("*")
        .order("id");

      if (error) throw error;
      return data as BibliotecaItem[];
    },
    preloadImages: true,
    imageExtractor: (data) => data.map(item => item.imagem).filter(Boolean) as string[],
  });

  // Filtrar e ordenar livros
  const livrosFiltrados = useMemo(() => {
    if (!items) return [];
    const searchLower = searchTerm.toLowerCase();
    let filtered = items.filter(livro => 
      (livro.livro?.toLowerCase() || '').includes(searchLower) ||
      (livro.autor?.toLowerCase() || '').includes(searchLower)
    );

    if (sortMode === "alfabetica") {
      filtered = [...filtered].sort((a, b) => 
        (a.livro || "").localeCompare(b.livro || "", 'pt-BR')
      );
    }

    return filtered;
  }, [items, searchTerm, sortMode]);

  // Aplicar limite de conteúdo premium
  const { visibleItems, lockedItems, isPremiumRequired } = useContentLimit(livrosFiltrados, 'pesquisa');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const sobreTexts = BIBLIOTECA_SOBRE_TEXTS.pesquisa;

  return (
    <div className="min-h-screen pb-20">
      {/* Header Compacto com Capa */}
      <div className="relative h-32 md:h-40 overflow-hidden">
        {capa?.capa && (
          <img
            src={capa.capa}
            alt="Biblioteca de Pesquisa Científica"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            decoding="sync"
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-background" />
        
        {/* Botão voltar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/biblioteca-faculdade")}
          className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="absolute bottom-4 left-4 right-4 text-white text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/90 rounded-xl shadow-lg">
              <FileSearch className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h1 className="text-xl md:text-2xl font-bold text-left">Pesquisa Científica</h1>
              <p className="text-xs text-white/80 text-left">
                {items?.length || 0} livros disponíveis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-4 py-4 max-w-4xl mx-auto">
        {/* Barra de Pesquisa */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar livro ou autor..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="pl-11 h-12 text-base bg-secondary/50 border-border/50 rounded-xl focus:bg-secondary/80 transition-colors" 
          />
        </div>

        {/* Toggle de Ordenação */}
        <div className="mb-6">
          <BibliotecaSortToggle mode={sortMode} setMode={setSortMode} />
        </div>

        {/* Conteúdo baseado no modo */}
        {sortMode === "sobre" ? (
          <BibliotecaSobreCard {...sobreTexts} />
        ) : (
          <div className="space-y-4">
            {visibleItems.map((livro, idx) => (
              <LivroCard 
                key={livro.id} 
                titulo={livro.livro || "Sem título"} 
                autor={livro.autor || undefined}
                capaUrl={livro.imagem} 
                sobre={livro.sobre} 
                numero={idx + 1}
                onClick={() => navigate(`/biblioteca-pesquisa-cientifica/${livro.id}`)} 
              />
            ))}
            
            {/* Livros bloqueados */}
            {lockedItems.map((livro) => (
              <LockedContentListItem
                key={livro.id}
                title={livro.livro || "Sem título"}
                subtitle={livro.autor || undefined}
                imageUrl={livro.imagem || undefined}
                sobre={livro.sobre || undefined}
                onClick={() => setShowPremiumCard(true)}
              />
            ))}

            {livrosFiltrados.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum livro encontrado</p>
                <p className="text-sm">Em breve adicionaremos mais conteúdo!</p>
              </div>
            )}
          </div>
        )}

        {/* Premium Card */}
        <PremiumFloatingCard
          isOpen={showPremiumCard}
          onClose={() => setShowPremiumCard(false)}
          title="Conteúdo Premium"
          description="Desbloqueie todos os livros assinando um dos nossos planos."
        />
      </div>
    </div>
  );
};

export default BibliotecaPesquisaCientifica;
