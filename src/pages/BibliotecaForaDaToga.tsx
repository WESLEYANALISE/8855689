import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LivroCard } from "@/components/LivroCard";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useInstantCache } from "@/hooks/useInstantCache";
import { useContentLimit } from "@/hooks/useContentLimit";
import { LockedContentListItem } from "@/components/LockedContentCard";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { BibliotecaSortToggle, BibliotecaSortMode } from "@/components/biblioteca/BibliotecaSortToggle";
import { BibliotecaSobreCard, BIBLIOTECA_SOBRE_TEXTS } from "@/components/biblioteca/BibliotecaSobreCard";

interface BibliotecaItem {
  id: number;
  area: string | null;
  livro: string | null;
  autor: string | null;
  link: string | null;
  "capa-livro": string | null;
  sobre: string | null;
  download: string | null;
  "capa-area": string | null;
}

interface CapaBiblioteca {
  Biblioteca: string;
  capa: string;
  sobre?: string;
}

const BibliotecaForaDaToga = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  const [sortMode, setSortMode] = useState<BibliotecaSortMode>("recomendada");

  // Cache instantâneo para capa
  const { data: capa } = useInstantCache<CapaBiblioteca>({
    cacheKey: "capa-biblioteca-fora-da-toga",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*")
        .eq("Biblioteca", "Biblioteca Fora da Toga")
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Cache instantâneo para livros com preload de capas
  const { data: items, isLoading } = useInstantCache<BibliotecaItem[]>({
    cacheKey: "biblioteca-fora-da-toga-livros",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-FORA-DA-TOGA")
        .select("*")
        .order("id");

      if (error) throw error;
      return data as BibliotecaItem[];
    },
    preloadImages: true,
    imageExtractor: (data) => data.map(item => item["capa-livro"]).filter(Boolean) as string[],
  });

  // Filtrar e ordenar livros com useMemo
  const livrosFiltrados = useMemo(() => {
    if (!items) return [];
    
    let filtered = items;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = items.filter(
        (livro) =>
          (livro.livro || "").toLowerCase().includes(searchLower) ||
          (livro.autor || "").toLowerCase().includes(searchLower)
      );
    }

    if (sortMode === "alfabetica") {
      filtered = [...filtered].sort((a, b) => 
        (a.livro || "").localeCompare(b.livro || "", 'pt-BR')
      );
    }

    return filtered;
  }, [items, searchTerm, sortMode]);

  // Aplicar limite de conteúdo premium (10% para Fora da Toga)
  const { visibleItems, lockedItems, isPremiumRequired } = useContentLimit(livrosFiltrados, 'fora-da-toga');

  // Loading só aparece na primeira visita (sem cache)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent" />
      </div>
    );
  }

  const sobreTexts = BIBLIOTECA_SOBRE_TEXTS["fora-da-toga"];

  return (
    <div className="min-h-screen pb-20">
      {/* Header com Capa - mais compacto */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        {/* Imagem de fundo */}
        {capa?.capa && (
          <img
            src={capa.capa}
            alt="Biblioteca Fora da Toga"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
          />
        )}
        
        {/* Gradiente escuro para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
        {/* Conteúdo sobre a imagem */}
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/90 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Biblioteca Fora da Toga</h1>
              <p className="text-sm text-white/90 mt-1">
                {items?.length} {items?.length === 1 ? "livro disponível" : "livros disponíveis"}
                {isPremiumRequired && (
                  <span className="text-amber-400 ml-2">
                    • {visibleItems.length} liberados
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-3 py-6 max-w-4xl mx-auto animate-fade-in">
        {/* Barra de Pesquisa */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar livro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-base"
              />
              <Button variant="outline" size="icon" className="shrink-0">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Toggle de Ordenação */}
        <div className="mb-6">
          <BibliotecaSortToggle mode={sortMode} setMode={setSortMode} />
        </div>

        {/* Conteúdo baseado no modo */}
        {sortMode === "sobre" ? (
          <BibliotecaSobreCard {...sobreTexts} />
        ) : (
          <div className="space-y-4">
            {/* Livros visíveis */}
            {visibleItems.map((livro) => (
              <LivroCard
                key={livro.id}
                titulo={livro.livro || "Sem título"}
                autor={livro.autor || undefined}
                capaUrl={livro["capa-livro"]}
                sobre={livro.sobre}
                onClick={() => navigate(`/biblioteca-fora-da-toga/${livro.id}`)}
              />
            ))}
            
            {/* Livros bloqueados */}
            {lockedItems.map((livro) => (
              <LockedContentListItem
                key={livro.id}
                title={livro.livro || "Sem título"}
                subtitle={livro.autor || undefined}
                imageUrl={livro["capa-livro"] || undefined}
                onClick={() => setShowPremiumCard(true)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Premium Card */}
      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
        title="Conteúdo Premium"
        description="Desbloqueie todos os livros desta biblioteca assinando um dos nossos planos."
      />
    </div>
  );
};

export default BibliotecaForaDaToga;
