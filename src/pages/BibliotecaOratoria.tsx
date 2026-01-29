import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Search, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LivroCard } from "@/components/LivroCard";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  imagem: string | null;
  sobre: string | null;
  beneficios: string | null;
  download: string | null;
  "Capa-area": string | null;
}

const BibliotecaOratoria = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  const [sortMode, setSortMode] = useState<BibliotecaSortMode>("recomendada");

  const { data: capa } = useQuery({
    queryKey: ["capa-biblioteca-oratoria"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*")
        .eq("Biblioteca", "Biblioteca de Oratória")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["biblioteca-oratoria"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-ORATORIA")
        .select("*")
        .order("id");

      if (error) throw error;
      return data as BibliotecaItem[];
    },
  });

  // Filtrar e ordenar livros
  const livrosFiltrados = useMemo(() => {
    if (!items) return [];
    
    let filtered = items.filter(
      (item) =>
        (item.livro || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.autor || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortMode === "alfabetica") {
      filtered = [...filtered].sort((a, b) => 
        (a.livro || "").localeCompare(b.livro || "", 'pt-BR')
      );
    }

    return filtered;
  }, [items, searchTerm, sortMode]);

  // Aplicar limite de conteúdo premium (20%)
  const { visibleItems, lockedItems, isPremiumRequired } = useContentLimit(livrosFiltrados, 'oratoria');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const sobreTexts = BIBLIOTECA_SOBRE_TEXTS.oratoria;

  return (
    <div className="min-h-screen pb-20">
      {/* Header com Capa - mais compacto */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        {/* Imagem de fundo */}
        {capa?.capa && (
          <img
            src={capa.capa}
            alt="Biblioteca de Oratória"
            className="absolute inset-0 w-full h-full object-cover"
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
              <h1 className="text-2xl md:text-3xl font-bold">Biblioteca de Oratória</h1>
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
            {visibleItems.map((item) => (
              <LivroCard
                key={item.id}
                titulo={item.livro || "Sem título"}
                autor={item.autor || undefined}
                capaUrl={item.imagem}
                sobre={item.sobre}
                onClick={() => navigate(`/biblioteca-oratoria/${item.id}`)}
              />
            ))}
            
            {/* Livros bloqueados */}
            {lockedItems.map((item) => (
              <LockedContentListItem
                key={item.id}
                title={item.livro || "Sem título"}
                subtitle={item.autor || undefined}
                imageUrl={item.imagem || undefined}
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

export default BibliotecaOratoria;
