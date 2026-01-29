import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Search, Crown, Gavel, Shield, HandCoins, BookText, Loader2, HelpCircle, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuestoesArtigosCount } from "@/hooks/useQuestoesArtigosCount";

const QuestoesArtigosLei = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: questoesCounts, isLoading, totalQuestoes } = useQuestoesArtigosCount();

  const categories = [
    {
      id: "constituicao",
      title: "Constituição",
      getQuestoesCount: () => questoesCounts?.constituicao || 0,
      icon: Crown,
      iconBg: "bg-orange-500",
      glowColor: "hsl(25, 95%, 53%)",
      route: "/questoes/artigos-lei/temas?codigo=cf",
    },
    {
      id: "codigos",
      title: "Códigos e Leis",
      getQuestoesCount: () => questoesCounts?.codigos || 0,
      icon: Scale,
      iconBg: "bg-red-500",
      glowColor: "hsl(0, 84%, 60%)",
      route: "/questoes/artigos-lei/codigos",
    },
    {
      id: "legislacao-penal",
      title: "Legislação Penal",
      getQuestoesCount: () => questoesCounts?.["legislacao-penal"] || 0,
      icon: Shield,
      iconBg: "bg-red-600",
      glowColor: "hsl(0, 72%, 51%)",
      route: "/questoes/artigos-lei/legislacao-penal",
    },
    {
      id: "estatutos",
      title: "Estatutos",
      getQuestoesCount: () => questoesCounts?.estatutos || 0,
      icon: Gavel,
      iconBg: "bg-purple-500",
      glowColor: "hsl(271, 76%, 53%)",
      route: "/questoes/artigos-lei/estatutos",
    },
    {
      id: "previdenciario",
      title: "Previdenciário",
      getQuestoesCount: () => questoesCounts?.previdenciario || 0,
      icon: HandCoins,
      iconBg: "bg-emerald-500",
      glowColor: "hsl(160, 84%, 39%)",
      route: "/questoes/artigos-lei/previdenciario",
    },
    {
      id: "sumulas",
      title: "Súmulas",
      getQuestoesCount: () => questoesCounts?.sumulas || 0,
      icon: BookText,
      iconBg: "bg-blue-500",
      glowColor: "hsl(217, 91%, 60%)",
      route: "/questoes/artigos-lei/sumulas",
    }
  ];

  const filteredCategories = categories.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-600 shadow-lg shadow-amber-500/50">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Questões por Artigo</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Carregando...' : `${totalQuestoes.toLocaleString('pt-BR')} questões disponíveis`}
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

      {/* Categorias */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Questões Disponíveis
          {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
        </h2>
        
        {filteredCategories.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredCategories.map((category, index) => {
              const Icon = category.icon;
              const questoesCount = category.getQuestoesCount();
              return (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-l-4 bg-gradient-to-r from-card to-card/80 animate-fade-in"
                  style={{ 
                    borderLeftColor: category.glowColor,
                    animationDelay: `${index * 0.05}s` 
                  }}
                  onClick={() => navigate(category.route)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`${category.iconBg} rounded-full p-3 shrink-0 shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base">{category.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin inline" />
                        ) : questoesCount > 0 ? (
                          `${questoesCount.toLocaleString("pt-BR")} questões disponíveis`
                        ) : (
                          "Sem questões ainda"
                        )}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
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

export default QuestoesArtigosLei;
