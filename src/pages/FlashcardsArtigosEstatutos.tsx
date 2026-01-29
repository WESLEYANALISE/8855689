import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, Gavel, Baby, Users, Accessibility, Building, 
  Trophy, Scale, Loader2, TrendingUp 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFlashcardsArtigosCount, getCountByArea } from "@/hooks/useFlashcardsArtigosCount";

// Mapeamento de áreas do banco para as siglas
const areaToDbName: Record<string, string> = {
  "ECA": "ECA",
  "IDOSO": "Estatuto do Idoso",
  "OAB": "Estatuto da OAB",
  "PCD": "Estatuto da Pessoa com Deficiência",
  "RACIAL": "Estatuto da Igualdade Racial",
  "CIDADE": "Estatuto da Cidade",
  "TORC": "Estatuto do Torcedor"
};

// Estatutos organizados por categoria
const categorias = [
  {
    titulo: "Proteção de Grupos Vulneráveis",
    icone: Baby,
    cor: "hsl(330, 81%, 60%)",
    items: [
      {
        id: "eca",
        abbr: "ECA",
        title: "Estatuto da Criança e Adolescente",
        icon: Baby,
        glowColor: "hsl(330, 81%, 60%)",
        iconBg: "bg-pink-500"
      },
      {
        id: "estatuto-idoso",
        abbr: "IDOSO",
        title: "Estatuto do Idoso",
        icon: Users,
        glowColor: "hsl(217, 91%, 60%)",
        iconBg: "bg-blue-500"
      },
      {
        id: "estatuto-pcd",
        abbr: "PCD",
        title: "Estatuto da Pessoa com Deficiência",
        icon: Accessibility,
        glowColor: "hsl(271, 76%, 53%)",
        iconBg: "bg-purple-500"
      },
      {
        id: "estatuto-igualdade",
        abbr: "RACIAL",
        title: "Estatuto da Igualdade Racial",
        icon: Users,
        glowColor: "hsl(43, 96%, 56%)",
        iconBg: "bg-yellow-500"
      }
    ]
  },
  {
    titulo: "Profissional",
    icone: Scale,
    cor: "hsl(160, 84%, 39%)",
    items: [
      {
        id: "estatuto-oab",
        abbr: "OAB",
        title: "Estatuto da OAB",
        icon: Scale,
        glowColor: "hsl(160, 84%, 39%)",
        iconBg: "bg-emerald-500"
      }
    ]
  },
  {
    titulo: "Urbanismo e Lazer",
    icone: Building,
    cor: "hsl(189, 94%, 43%)",
    items: [
      {
        id: "estatuto-cidade",
        abbr: "CIDADE",
        title: "Estatuto da Cidade",
        icon: Building,
        glowColor: "hsl(189, 94%, 43%)",
        iconBg: "bg-cyan-500"
      },
      {
        id: "estatuto-torcedor",
        abbr: "TORC",
        title: "Estatuto do Torcedor",
        icon: Trophy,
        glowColor: "hsl(142, 71%, 45%)",
        iconBg: "bg-green-500"
      }
    ]
  }
];

// Lista plana para contagem
const allEstatutos = categorias.flatMap(cat => cat.items);

const FlashcardsArtigosEstatutos = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: flashcardCounts, isLoading } = useFlashcardsArtigosCount();

  const filteredCategorias = useMemo(() => {
    if (!searchQuery.trim()) return categorias;
    const query = searchQuery.toLowerCase();
    return categorias.map(cat => ({
      ...cat,
      items: cat.items.filter(est =>
        est.abbr.toLowerCase().includes(query) ||
        est.title.toLowerCase().includes(query)
      )
    })).filter(cat => cat.items.length > 0);
  }, [searchQuery]);

  const totalFlashcards = useMemo(() => {
    if (!flashcardCounts) return 0;
    return allEstatutos.reduce((sum, est) => {
      const dbName = areaToDbName[est.abbr];
      return sum + getCountByArea(flashcardCounts, dbName);
    }, 0);
  }, [flashcardCounts]);

  const getFlashcardCount = (abbr: string): number => {
    if (!flashcardCounts) return 0;
    const dbName = areaToDbName[abbr];
    return getCountByArea(flashcardCounts, dbName);
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50">
            <Gavel className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Estatutos</h1>
            <p className="text-sm text-muted-foreground">
              Flashcards dos estatutos especiais
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar estatuto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-base"
            />
            <Button variant="outline" size="icon" className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatutos */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Flashcards Disponíveis
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin ml-1" />
          ) : (
            <span className="text-muted-foreground font-normal">
              ({totalFlashcards.toLocaleString("pt-BR")})
            </span>
          )}
        </h2>
        
        {filteredCategorias.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-3">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum estatuto encontrado
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCategorias.map((categoria, catIndex) => {
              const CatIcon = categoria.icone;
              return (
                <div key={categoria.titulo} className="animate-fade-in" style={{ animationDelay: `${catIndex * 0.1}s` }}>
                  {/* Header da categoria */}
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="p-1.5 rounded-lg" 
                      style={{ backgroundColor: `${categoria.cor}20` }}
                    >
                      <CatIcon className="w-4 h-4" style={{ color: categoria.cor }} />
                    </div>
                    <h3 className="font-semibold text-sm" style={{ color: categoria.cor }}>
                      {categoria.titulo}
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  
                  {/* Grid de estatutos */}
                  <div className="grid grid-cols-2 gap-3">
                    {categoria.items.map((est, index) => {
                      const Icon = est.icon;
                      const count = getFlashcardCount(est.abbr);
                      
                      return (
                        <Card
                          key={est.id}
                          className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
                          style={{ animationDelay: `${(catIndex * 0.1) + (index * 0.05)}s` }}
                          onClick={() => navigate(`/flashcards/artigos-lei/temas?codigo=${encodeURIComponent(est.id)}`)}
                        >
                          {/* Glow no topo */}
                          <div 
                            className="absolute top-0 left-0 right-0 h-1 opacity-80"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${est.glowColor}, transparent)`,
                              boxShadow: `0 0 20px ${est.glowColor}`
                            }}
                          />
                          
                          {/* Sigla no canto superior esquerdo */}
                          <div 
                            className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ 
                              backgroundColor: `${est.glowColor}20`,
                              color: est.glowColor 
                            }}
                          >
                            {est.abbr}
                          </div>
                          
                          <CardContent className="p-4 pt-6 flex flex-col items-center text-center min-h-[140px] justify-center">
                            <div className={`${est.iconBg} rounded-full p-3 mb-2 shadow-lg`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-xs mb-1 line-clamp-2">{est.title}</h3>
                            <p className="text-[11px] text-muted-foreground">
                              {isLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin inline" />
                              ) : (
                                `${count.toLocaleString("pt-BR")} flashcards`
                              )}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsArtigosEstatutos;
