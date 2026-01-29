import { supabase } from "@/integrations/supabase/client";
import { Search, BookOpen, ChevronRight, Clock, SortAsc, ImageIcon, X, Lock, Crown, GraduationCap, ChevronLeft } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LivroCard } from "@/components/LivroCard";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBibliotecaCapasAutoGeneration } from "@/hooks/useBibliotecaCapasAutoGeneration";
import { useInstantCache, preloadImages } from "@/hooks/useInstantCache";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useContentLimit } from "@/hooks/useContentLimit";
import { LockedContentListItem } from "@/components/LockedContentCard";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";

interface BibliotecaItem {
  id: number;
  Área: string | null;
  Ordem: number | null;
  Tema: string | null;
  Download: string | null;
  Link: string | null;
  "Capa-area": string | null;
  "Capa-livro": string | null;
  Sobre: string | null;
  url_capa_gerada?: string | null;
}

interface CapaBiblioteca {
  Biblioteca: string;
  capa: string;
  sobre?: string;
}

const BibliotecaEstudos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordenacao, setOrdenacao] = useState<"cronologica" | "alfabetica">("cronologica");
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Hook de geração automática de capas
  const {
    isGenerating,
    currentLivro,
    processados,
    total,
    livrosSemCapa,
    cancelar
  } = useBibliotecaCapasAutoGeneration({
    area: selectedArea,
    enabled: !!selectedArea
  });

  // Invalidar cache quando geração atualiza
  useEffect(() => {
    if (processados > 0) {
      queryClient.invalidateQueries({ queryKey: ["biblioteca-estudos"] });
    }
  }, [processados, queryClient]);

  // Verificar se veio com uma área selecionada via state
  useEffect(() => {
    if (location.state?.selectedArea) {
      setSelectedArea(location.state.selectedArea);
    }
  }, [location.state]);

  // Cache instantâneo para capa
  const { data: capa } = useInstantCache<CapaBiblioteca>({
    cacheKey: "capa-biblioteca-estudos",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*")
        .eq("Biblioteca", "Biblioteca de Estudos")
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Cache instantâneo para livros com preload de capas
  const { data: items, isLoading } = useInstantCache<BibliotecaItem[]>({
    cacheKey: "biblioteca-estudos-livros",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-ESTUDOS")
        .select("*")
        .order("Ordem");

      if (error) throw error;
      return data as BibliotecaItem[];
    },
    preloadImages: true,
    imageExtractor: (data) => {
      // Preload de TODAS as capas geradas + capas de livro como fallback
      const capas: string[] = [];
      
      data.forEach(item => {
        const capa = item.url_capa_gerada || item["Capa-livro"];
        if (capa && !capas.includes(capa)) {
          capas.push(capa);
        }
      });
      
      return capas.slice(0, 50); // Limitar para performance
    },
  });


  // Agrupar por área com useMemo e limitar para carrossel
  const areaGroups = useMemo(() => {
    return items?.reduce((acc, item) => {
      const area = item.Área || "Sem Área";
      if (!acc[area]) {
        acc[area] = {
          capa: null,
          livros: [],
          livrosCarrossel: []
        };
      }
      acc[area].livros.push(item);
      
      // Se ainda não tem capa da área, usar a primeira capa de livro disponível
      if (!acc[area].capa) {
        const capaLivro = item.url_capa_gerada || item["Capa-livro"];
        if (capaLivro) {
          acc[area].capa = capaLivro;
        }
      }
      
      return acc;
    }, {} as Record<string, {
      capa: string | null;
      livros: BibliotecaItem[];
      livrosCarrossel: BibliotecaItem[];
    }>);
  }, [items]);

  // Criar versão limitada para carrosséis (performance)
  const areaGroupsWithLimit = useMemo(() => {
    if (!areaGroups) return areaGroups;
    
    const limited = { ...areaGroups };
    Object.keys(limited).forEach(area => {
      limited[area] = {
        ...limited[area],
        livrosCarrossel: limited[area].livros.slice(0, 20) // Apenas primeiros 20
      };
    });
    return limited;
  }, [areaGroups]);

  // Função para remover acentuação
  const removerAcentuacao = (texto: string) => {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Filtrar e ordenar áreas - SEMPRE em ordem alfabética na listagem de áreas
  const areasFiltradas = useMemo(() => {
    if (!areaGroupsWithLimit) return [];
    
    const searchLower = removerAcentuacao(debouncedSearch.toLowerCase());
    
    return Object.entries(areaGroupsWithLimit)
      .map(([area, data]) => {
        // Filtrar livros que correspondem à busca (sem acentuação)
        const livrosFiltrados = data.livros.filter(livro =>
          removerAcentuacao(livro.Tema?.toLowerCase() || '').includes(searchLower)
        );
        
        // Incluir área se nome da área OU algum livro corresponder (sem acentuação)
        const incluirArea = 
          removerAcentuacao(area.toLowerCase()).includes(searchLower) ||
          livrosFiltrados.length > 0;
        
        return incluirArea 
          ? [area, { 
              ...data, 
              livros: debouncedSearch ? livrosFiltrados : data.livros,
              livrosCarrossel: debouncedSearch ? livrosFiltrados.slice(0, 20) : data.livrosCarrossel
            }] as const
          : null;
      })
      .filter((item): item is [string, typeof areaGroupsWithLimit[string]] => item !== null)
      // Áreas SEMPRE em ordem alfabética
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [areaGroupsWithLimit, debouncedSearch]);

  // Ordenar livros dentro de uma área
  const ordenarLivros = (livros: BibliotecaItem[]) => {
    if (ordenacao === "alfabetica") {
      return [...livros].sort((a, b) => 
        (a.Tema || "").localeCompare(b.Tema || "", 'pt-BR', { sensitivity: 'base' })
      );
    }
    // Cronológica: manter ordem original (por Ordem)
    return [...livros].sort((a, b) => (a.Ordem || 0) - (b.Ordem || 0));
  };

  // Preparar livros da área selecionada (se houver) - ANTES do early return
  const livrosDaAreaSelecionada = useMemo(() => {
    if (!selectedArea || !areaGroups) return [];
    const areaData = areaGroups[selectedArea];
    if (!areaData) return [];
    
    const filtrados = areaData.livros.filter(livro => 
      removerAcentuacao((livro.Tema || "").toLowerCase()).includes(removerAcentuacao(searchTerm.toLowerCase()))
    );
    return ordenarLivros(filtrados);
  }, [selectedArea, areaGroups, searchTerm, ordenacao]);

  // Aplicar limite de conteúdo premium - SEMPRE chamado incondicionalmente
  const { visibleItems, lockedItems, isPremiumRequired } = useContentLimit(livrosDaAreaSelecionada, 'estudos');

  // Loading só aparece na primeira visita (sem cache)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Se uma área foi selecionada, mostrar os livros dessa área
  if (selectedArea && areaGroups) {
    const areaData = areaGroups[selectedArea];
    
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold mb-1">{selectedArea}</h1>
          <p className="text-sm text-muted-foreground">
            {areaData.livros.length} {areaData.livros.length === 1 ? "livro disponível" : "livros disponíveis"}
            {isPremiumRequired && (
              <span className="text-amber-500 ml-2">
                • {visibleItems.length} liberados
              </span>
            )}
          </p>
        </div>

        {/* Banner de Geração Automática de Capas */}
        {(isGenerating || livrosSemCapa > 0) && (
          <Card className="mb-4 border-border/50 bg-secondary/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  {!isGenerating && livrosSemCapa > 0 && <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm text-foreground">
                      {isGenerating 
                        ? `Gerando capa: ${currentLivro}` 
                        : `${livrosSemCapa} capas pendentes`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {processados}/{total} processados
                    </p>
                  </div>
                </div>
                {isGenerating && (
                  <Button variant="ghost" size="icon" onClick={cancelar} className="h-8 w-8">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {/* Progress bar */}
              {total > 0 && (
                <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-muted-foreground/50 transition-all duration-500"
                    style={{ width: `${(processados / total) * 100}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Barra de Pesquisa de Livros */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Buscar livro..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="text-base" />
              <Button variant="outline" size="icon" className="shrink-0">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Toggle de Ordenação - Aparece APENAS dentro de uma área */}
        <div className="flex justify-center mb-4">
          <ToggleGroup
            type="single"
            value={ordenacao}
            onValueChange={(value) => {
              if (value) setOrdenacao(value as "cronologica" | "alfabetica");
            }}
            className="bg-secondary/50 rounded-lg p-1"
          >
            <ToggleGroupItem 
              value="cronologica" 
              aria-label="Ordem cronológica"
              className="text-xs px-3 py-1.5 h-auto data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400 data-[state=on]:shadow-sm gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              Cronológica
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="alfabetica" 
              aria-label="Ordem alfabética"
              className="text-xs px-3 py-1.5 h-auto data-[state=on]:bg-purple-500/20 data-[state=on]:text-purple-400 data-[state=on]:shadow-sm gap-1.5"
            >
              <SortAsc className="w-3.5 h-3.5" />
              Alfabética
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-4">
          {/* Livros visíveis */}
          {visibleItems.map((livro, idx) => (
            <LivroCard 
              key={livro.id} 
              titulo={livro.Tema || "Sem título"} 
              subtitulo={selectedArea} 
              capaUrl={livro.url_capa_gerada || livro["Capa-livro"]} 
              sobre={livro.Sobre} 
              numero={livro.Ordem || idx + 1} 
              ano={2026} 
              onClick={() => navigate(`/biblioteca-estudos/${livro.id}`)} 
            />
          ))}
          
          {/* Livros bloqueados */}
          {lockedItems.map((livro, index) => (
            <LockedContentListItem
              key={livro.id}
              title={livro.Tema || "Sem título"}
              subtitle={selectedArea}
              imageUrl={livro.url_capa_gerada || livro["Capa-livro"] || undefined}
              sobre={livro.Sobre || undefined}
              onClick={() => setShowPremiumCard(true)}
            />
          ))}
        </div>

        {/* Premium Card */}
        <PremiumFloatingCard
          isOpen={showPremiumCard}
          onClose={() => setShowPremiumCard(false)}
          title="Conteúdo Premium"
          description="Desbloqueie todos os livros desta área assinando um dos nossos planos."
        />
      </div>
    );
  }

  // Mostrar tela principal com lista de áreas
  return (
    <div className="min-h-screen pb-20">
      {/* Header Compacto com Capa */}
      <div className="relative h-32 md:h-40 overflow-hidden">
        {/* Imagem de fundo */}
        {capa?.capa && (
          <img
            src={capa.capa}
            alt="Biblioteca de Estudos"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            decoding="sync"
          />
        )}
        
        {/* Gradiente escuro para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-background" />
        
        {/* Botão voltar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/biblioteca-faculdade")}
          className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        {/* Conteúdo sobre a imagem */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/90 rounded-xl shadow-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Estudos</h1>
              <p className="text-xs text-white/80">
                {items?.length || 0} livros disponíveis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-4 py-4 max-w-4xl mx-auto">
        {/* Barra de Pesquisa Integrada */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar área ou livro..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="pl-11 h-12 text-base bg-secondary/50 border-border/50 rounded-xl focus:bg-secondary/80 transition-colors" 
          />
        </div>

        {/* Lista de áreas */}
        <div className="space-y-2">
          {areasFiltradas.length > 0 ? (
            areasFiltradas.map(([area, data], index) => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className="w-full group"
              >
                <div className="flex items-center gap-4 p-3 rounded-xl bg-card/50 hover:bg-card border border-border/30 hover:border-accent/40 transition-all duration-200 hover:shadow-lg">
                  <div className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                    {data.capa ? (
                      <img
                        src={data.capa}
                        alt={area}
                        loading={index < 6 ? "eager" : "lazy"}
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-accent/70" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-semibold text-base text-foreground leading-tight truncate group-hover:text-accent transition-colors">
                      {area}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.livros.length} {data.livros.length === 1 ? 'livro' : 'livros'}
                    </p>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                Nenhum resultado encontrado para "{debouncedSearch}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BibliotecaEstudos;
