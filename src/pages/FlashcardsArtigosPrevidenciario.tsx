import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, Heart, DollarSign, Loader2, TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFlashcardsArtigosCount, getCountByArea } from "@/hooks/useFlashcardsArtigosCount";

// Mapeamento de áreas do banco para as siglas
const areaToDbName: Record<string, string> = {
  "LB": "Lei de Benefícios",
  "LC": "Lei de Custeio"
};

const leis = [
  {
    id: "lei-beneficios",
    abbr: "LB",
    title: "Lei de Benefícios (8.213/91)",
    icon: Heart,
    glowColor: "hsl(160,84%,39%)",
    iconBg: "bg-emerald-500"
  },
  {
    id: "lei-custeio",
    abbr: "LC",
    title: "Lei de Custeio (8.212/91)",
    icon: DollarSign,
    glowColor: "hsl(38,92%,50%)",
    iconBg: "bg-amber-500"
  }
];

const FlashcardsArtigosPrevidenciario = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: flashcardCounts, isLoading } = useFlashcardsArtigosCount();

  const filteredLeis = useMemo(() => {
    if (!searchQuery.trim()) return leis;
    const query = searchQuery.toLowerCase();
    return leis.filter(lei => 
      lei.abbr.toLowerCase().includes(query) || 
      lei.title.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const totalFlashcards = useMemo(() => {
    if (!flashcardCounts) return 0;
    return leis.reduce((sum, lei) => {
      const dbName = areaToDbName[lei.abbr];
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
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Previdenciário</h1>
            <p className="text-sm text-muted-foreground">
              Flashcards das leis previdenciárias
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por sigla ou nome..."
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

      {/* Leis Previdenciárias */}
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
        
        {filteredLeis.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-3">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhuma lei encontrada
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredLeis.map((lei, index) => {
              const Icon = lei.icon;
              const count = getFlashcardCount(lei.abbr);
              
              return (
                <Card
                  key={lei.id}
                  className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
                  style={{ animationDelay: `${index * 0.03}s` }}
                  onClick={() => navigate(`/flashcards/artigos-lei/temas?codigo=${encodeURIComponent(lei.id)}`)}
                >
                  {/* Glow no topo */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 opacity-80"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${lei.glowColor}, transparent)`,
                      boxShadow: `0 0 20px ${lei.glowColor}`
                    }}
                  />
                  
                  {/* Sigla no canto superior esquerdo */}
                  <div 
                    className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ 
                      backgroundColor: `${lei.glowColor}20`,
                      color: lei.glowColor 
                    }}
                  >
                    {lei.abbr}
                  </div>
                  
                  <CardContent className="p-4 pt-6 flex flex-col items-center text-center min-h-[140px] justify-center">
                    <div className={`${lei.iconBg} rounded-full p-3 mb-2 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-xs mb-1 line-clamp-2">{lei.title}</h3>
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
        )}
      </div>
    </div>
  );
};

export default FlashcardsArtigosPrevidenciario;
