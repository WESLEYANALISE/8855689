import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Search, Crown, Gavel, Shield, HandCoins, BookText, BookOpen, ChevronRight, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
const ResumosArtigosLei = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar contagem total de resumos disponíveis
  const {
    data: totalResumos
  } = useQuery({
    queryKey: ["total-resumos-artigos-lei"],
    queryFn: async () => {
      const {
        count,
        error
      } = await supabase.from("RESUMOS_ARTIGOS_LEI").select("*", {
        count: 'exact',
        head: true
      });
      if (error) throw error;
      return count || 0;
    }
  });

  // Esconder footer quando este componente estiver montado
  useEffect(() => {
    const footer = document.querySelector('[data-footer="main"]');
    if (footer) {
      (footer as HTMLElement).style.display = 'none';
    }
    return () => {
      if (footer) {
        (footer as HTMLElement).style.display = '';
      }
    };
  }, []);

  // Categorias hierárquicas
  const categories = [{
    id: "constituicao",
    title: "Constituição",
    description: "Constituição Federal",
    icon: Crown,
    iconBg: "bg-orange-500",
    glowColor: "hsl(25, 95%, 53%)",
    route: "/resumos-juridicos/artigos-lei/temas?codigo=cf"
  }, {
    id: "codigos",
    title: "Códigos e Leis",
    description: "CP, CC, CPC, CPP, CLT, CDC, CTN...",
    icon: Scale,
    iconBg: "bg-red-500",
    glowColor: "hsl(0, 84%, 60%)",
    route: "/resumos-juridicos/artigos-lei/codigos"
  }, {
    id: "legislacao-penal",
    title: "Legislação Penal",
    description: "Leis Penais Especiais",
    icon: Shield,
    iconBg: "bg-red-600",
    glowColor: "hsl(0, 72%, 51%)",
    route: "/resumos-juridicos/artigos-lei/legislacao-penal"
  }, {
    id: "estatutos",
    title: "Estatutos",
    description: "ECA, OAB, Idoso, Cidade...",
    icon: Gavel,
    iconBg: "bg-purple-500",
    glowColor: "hsl(271, 76%, 53%)",
    route: "/resumos-juridicos/artigos-lei/estatutos"
  }, {
    id: "previdenciario",
    title: "Previdenciário",
    description: "Custeio e Benefícios",
    icon: HandCoins,
    iconBg: "bg-emerald-500",
    glowColor: "hsl(160, 84%, 39%)",
    route: "/resumos-juridicos/artigos-lei/previdenciario"
  }, {
    id: "sumulas",
    title: "Súmulas",
    description: "STF, STJ, TST, TSE...",
    icon: BookText,
    iconBg: "bg-blue-500",
    glowColor: "hsl(217, 91%, 60%)",
    route: "/resumos-juridicos/artigos-lei/sumulas"
  }];
  const filteredCategories = categories.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
  return <div className="px-3 py-4 max-w-4xl mx-auto pb-8">
      {/* Header com botão voltar */}
      <div className="mb-6">
        

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Resumos de Artigos</h1>
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
            <Input placeholder="Buscar categoria..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="text-base" />
            <Button variant="outline" size="icon" className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumos Disponíveis */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">
          Resumos Disponíveis ({totalResumos || 0})
        </h2>
        
        {filteredCategories.length === 0 ? <Card className="p-6 text-center">
            <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
          </Card> : <div className="flex flex-col gap-2">
            {filteredCategories.map((category, index) => {
          const Icon = category.icon;
          return <Card key={category.id} className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative opacity-0" style={{
            animation: `fade-in 0.4s ease-out forwards`,
            animationDelay: `${index * 50}ms`
          }} onClick={() => navigate(category.route)}>
                  <div className="absolute top-0 left-0 right-0 h-1 opacity-80" style={{
              background: `linear-gradient(90deg, transparent, ${category.glowColor}, transparent)`,
              boxShadow: `0 0 20px ${category.glowColor}`
            }} />
                  
                  <CardContent className="py-5 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${category.iconBg} rounded-full p-2.5 shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{category.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>;
        })}
          </div>}
      </div>
    </div>;
};
export default ResumosArtigosLei;