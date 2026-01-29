import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Search, Crown, Gavel, Shield, HandCoins, BookText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFlashcardsArtigosCount, useVadeMecumCounts, getTotalFlashcards, categorizeAreas } from "@/hooks/useFlashcardsArtigosCount";

const FlashcardsArtigosLei = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: flashcardCounts, isLoading } = useFlashcardsArtigosCount();
  const { data: vadeMecumCounts, isLoading: isLoadingVadeMecum } = useVadeMecumCounts();

  const loading = isLoading || isLoadingVadeMecum;
  const totalFlashcards = flashcardCounts ? getTotalFlashcards(flashcardCounts) : 0;
  const categoryCounts = flashcardCounts ? categorizeAreas(flashcardCounts, vadeMecumCounts) : null;

  // Total incluindo artigos do Vade Mecum
  const totalGeral = totalFlashcards + (vadeMecumCounts?.legislacaoPenal || 0) + 
    (vadeMecumCounts?.previdenciario || 0) + (vadeMecumCounts?.sumulas || 0);

  // Categorias hierárquicas iguais ao Vade Mecum com contagem dinâmica
  const categories = [
    {
      id: "constituicao",
      title: "Constituição",
      getDescription: () => categoryCounts ? `${categoryCounts.constituicao.toLocaleString("pt-BR")} flashcards` : "Constituição Federal",
      icon: Crown,
      iconBg: "bg-orange-500",
      glowColor: "hsl(25, 95%, 53%)",
      route: "/flashcards/artigos-lei/temas?codigo=cf",
      disabled: false
    },
    {
      id: "codigos",
      title: "Códigos e Leis",
      getDescription: () => categoryCounts ? `${categoryCounts.codigos.toLocaleString("pt-BR")} flashcards` : "CP, CC, CPC, CPP, CLT, CDC, CTN...",
      icon: Scale,
      iconBg: "bg-red-500",
      glowColor: "hsl(0, 84%, 60%)",
      route: "/flashcards/artigos-lei/codigos",
      disabled: false
    },
    {
      id: "legislacao-penal",
      title: "Legislação Penal",
      getDescription: () => categoryCounts ? `${categoryCounts.legislacaoPenal.toLocaleString("pt-BR")} artigos` : "Leis Penais Especiais",
      icon: Shield,
      iconBg: "bg-red-600",
      glowColor: "hsl(0, 72%, 51%)",
      route: "/flashcards/artigos-lei/legislacao-penal",
      disabled: false
    },
    {
      id: "estatutos",
      title: "Estatutos",
      getDescription: () => categoryCounts ? `${categoryCounts.estatutos.toLocaleString("pt-BR")} flashcards` : "ECA, OAB, Idoso, Cidade...",
      icon: Gavel,
      iconBg: "bg-purple-500",
      glowColor: "hsl(271, 76%, 53%)",
      route: "/flashcards/artigos-lei/estatutos",
      disabled: false
    },
    {
      id: "previdenciario",
      title: "Previdenciário",
      getDescription: () => categoryCounts ? `${categoryCounts.previdenciario.toLocaleString("pt-BR")} artigos` : "Custeio e Benefícios",
      icon: HandCoins,
      iconBg: "bg-emerald-500",
      glowColor: "hsl(160, 84%, 39%)",
      route: "/flashcards/artigos-lei/previdenciario",
      disabled: false
    },
    {
      id: "sumulas",
      title: "Súmulas",
      getDescription: () => categoryCounts ? `${categoryCounts.sumulas.toLocaleString("pt-BR")} súmulas` : "STF, STJ, TST, TSE...",
      icon: BookText,
      iconBg: "bg-blue-500",
      glowColor: "hsl(217, 91%, 60%)",
      route: "/flashcards/artigos-lei/sumulas",
      disabled: false
    }
  ];

  const filteredCategories = categories.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 shadow-lg shadow-emerald-500/50">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Artigos da Lei</h1>
            <p className="text-sm text-muted-foreground">
              Escolha uma categoria para estudar
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar categoria..."
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

      {/* Total de Flashcards */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Flashcards Disponíveis
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin ml-1" />
          ) : (
            <span className="text-muted-foreground font-normal">
              ({totalGeral.toLocaleString("pt-BR")})
            </span>
          )}
        </h2>
        
        {filteredCategories.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in ${category.disabled ? 'opacity-60' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => !category.disabled && navigate(category.route)}
                >
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 opacity-80"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${category.glowColor}, transparent)`,
                      boxShadow: `0 0 20px ${category.glowColor}`
                    }}
                  />
                  
                  <CardContent className="p-4 flex flex-col items-center text-center min-h-[140px] justify-center">
                    <div className={`${category.iconBg} rounded-full p-3 mb-2 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-sm mb-1">{category.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {loading ? (
                        <Loader2 className="w-3 h-3 animate-spin inline" />
                      ) : (
                        category.getDescription()
                      )}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsArtigosLei;
