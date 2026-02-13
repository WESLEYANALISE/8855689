import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, RefreshCw, ArrowLeft, ChevronRight, Crown } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LivroCard } from "@/components/LivroCard";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import capaOabRevisao from "@/assets/capa-biblioteca-oab-revisao.webp";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";

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
}

const BibliotecaOABRevisao = () => {
  const navigate = useNavigate();
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: items, isLoading } = useQuery({
    queryKey: ["biblioteca-oab-revisao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBILIOTECA-OAB")
        .select("*")
        .order("Ordem", { ascending: true });
      if (error) throw error;
      // Para revisão, vamos filtrar materiais que tenham "resumo", "revisão", "síntese" no tema
      return (data as BibliotecaItem[]).filter(item => {
        const tema = (item.Tema || "").toLowerCase();
        return tema.includes("resumo") || tema.includes("revis") || tema.includes("síntese") || tema.includes("sintese") || tema.includes("esquema");
      });
    },
    staleTime: 1000 * 60 * 60,
  });

  // Agrupar por área
  const areaGroups = useMemo(() => {
    return items?.reduce((acc, item) => {
      const area = item.Área || "Sem Área";
      if (!acc[area]) {
        acc[area] = { capa: item["Capa-area"], livros: [] };
      }
      acc[area].livros.push(item);
      return acc;
    }, {} as Record<string, { capa: string | null; livros: BibliotecaItem[] }>);
  }, [items]);

  // Filtrar áreas
  const areasFiltradas = useMemo(() => {
    if (!areaGroups) return [];
    const searchLower = debouncedSearch.toLowerCase();
    
    return Object.entries(areaGroups)
      .map(([area, data]) => {
        const livrosFiltrados = data.livros.filter(livro =>
          (livro.Tema?.toLowerCase() || '').includes(searchLower)
        );
        const incluirArea = area.toLowerCase().includes(searchLower) || livrosFiltrados.length > 0;
        return incluirArea ? [area, { ...data, livros: debouncedSearch ? livrosFiltrados : data.livros }] as const : null;
      })
      .filter((item): item is [string, typeof areaGroups[string]] => item !== null)
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
  }, [areaGroups, debouncedSearch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Área selecionada - mostrar livros
  if (selectedArea && areaGroups) {
    const areaData = areaGroups[selectedArea];
    const livrosFiltrados = areaData.livros.filter(livro => 
      (livro.Tema || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20 animate-fade-in">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => { setSelectedArea(null); setSearchTerm(""); }} className="mb-4">
            ← Voltar às Áreas
          </Button>
          <h1 className="text-xl md:text-2xl font-bold mb-1">{selectedArea}</h1>
          <p className="text-sm text-muted-foreground">
            {areaData.livros.length} {areaData.livros.length === 1 ? "material de revisão" : "materiais de revisão"}
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Buscar material..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="text-base" />
              <Button variant="outline" size="icon" className="shrink-0">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {livrosFiltrados.map((livro, idx) => (
            <LivroCard 
              key={idx} 
              titulo={livro.Tema || "Sem título"} 
              subtitulo={selectedArea} 
              capaUrl={livro["Capa-livro"]} 
              sobre={livro.Sobre} 
              onClick={() => navigate(`/biblioteca-oab/${livro.id}`)} 
            />
          ))}
        </div>
      </div>
    );
  }

  // Tela principal - lista de áreas
  return (
    <div className="min-h-screen pb-20">
      {/* Header com Capa */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        <img src={capaOabRevisao} alt="Revisão OAB" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
        <Button variant="ghost" size="icon" onClick={() => navigate('/biblioteca-oab')} className="absolute top-4 left-4 text-white hover:bg-white/20 z-10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/90 rounded-lg">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Revisão OAB</h1>
              <p className="text-sm text-white/90 mt-1">Resumos e materiais de revisão</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 py-6 max-w-7xl mx-auto animate-fade-in">
        <Card className="mb-6 mx-1">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Buscar área ou material..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="text-base" />
              <Button variant="outline" size="icon" className="shrink-0">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Áreas */}
        <div className="space-y-3 px-2">
          {areasFiltradas.length > 0 ? (
            areasFiltradas.map(([area, data], index) => (
              <Card
                key={area}
                onClick={() => {
                  if (!isPremium && !loadingSubscription) {
                    setShowPremiumModal(true);
                  } else {
                    setSelectedArea(area);
                  }
                }}
                className="cursor-pointer group overflow-hidden bg-secondary/40 hover:bg-secondary/60 border border-accent/20 hover:border-accent/60 transition-all duration-300"
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    {data.capa ? (
                      <img src={data.capa} alt={area} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-emerald-400" />
                      </div>
                    )}
                    
                    {/* Selo Premium - visível apenas para não-assinantes */}
                    {!isPremium && !loadingSubscription && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 z-10">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1 text-foreground">{area}</h3>
                    <p className="text-sm text-muted-foreground">
                      {data.livros.length} {data.livros.length === 1 ? 'material' : 'materiais'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent flex-shrink-0" />
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum material de revisão encontrado</p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                Os materiais de revisão são filtrados automaticamente com base nos temas
              </p>
            </div>
          )}
        </div>
        
        {/* Modal Premium */}
        <PremiumUpgradeModal
          open={showPremiumModal}
          onOpenChange={setShowPremiumModal}
          featureName="Biblioteca OAB - Revisão"
        />
      </div>
    </div>
  );
};

export default BibliotecaOABRevisao;
