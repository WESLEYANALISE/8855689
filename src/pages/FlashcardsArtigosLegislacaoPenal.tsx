import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, Shield, Siren, AlertTriangle, 
  Scale, Loader2, TrendingUp, Ban, Gavel, 
  Target, Skull, Flame, AlertOctagon, ShieldAlert,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFlashcardsArtigosCount, getCountByArea } from "@/hooks/useFlashcardsArtigosCount";

// Mapeamento de áreas do banco para as siglas - usar nomes EXATOS da tabela FLASHCARDS - ARTIGOS LEI
const areaToDbName: Record<string, string> = {
  "LEP": "Lei 7.210 de 1984 - Lei de Execução Penal",
  "LCP": "LCP - Lei das Contravenções Penais",
  "DROGAS": "Lei 11.343 de 2006 - Lei de Drogas",
  "MARIA": "Lei 11.340 de 2006 - Maria da Penha",
  "HEDIONDOS": "Lei 8.072 de 1990 - Crimes Hediondos",
  "TORTURA": "Lei 9.455 de 1997 - Tortura",
  "ORCRIM": "Lei 12.850 de 2013 - Organizações Criminosas",
  "LAVAGEM": "LLD - Lei de Lavagem de Dinheiro",
  "INTERCEPT": "Lei 9.296 de 1996 - Interceptação Telefônica",
  "ABUSO": "Lei 13.869 de 2019 - Abuso de Autoridade",
  "JUIZESP": "Lei 9.099 de 1995 - Juizados Especiais",
  "ARMAS": "ESTATUTO - DESARMAMENTO"
};

const leis = [
  {
    id: "lep",
    abbr: "LEP",
    title: "Lei de Execução Penal",
    icon: Siren,
    color: "hsl(24,95%,53%)"
  },
  {
    id: "lcp",
    abbr: "LCP",
    title: "Lei das Contravenções Penais",
    icon: AlertTriangle,
    color: "hsl(43,96%,56%)"
  },
  {
    id: "drogas",
    abbr: "DROGAS",
    title: "Lei de Drogas",
    icon: Ban,
    color: "hsl(271,76%,53%)"
  },
  {
    id: "maria-da-penha",
    abbr: "MARIA",
    title: "Lei Maria da Penha",
    icon: Shield,
    color: "hsl(330,81%,60%)"
  },
  {
    id: "crimes-hediondos",
    abbr: "HEDIONDOS",
    title: "Crimes Hediondos",
    icon: Skull,
    color: "hsl(0,72%,51%)"
  },
  {
    id: "tortura",
    abbr: "TORTURA",
    title: "Lei de Tortura",
    icon: Flame,
    color: "hsl(15,86%,53%)"
  },
  {
    id: "organizacoes-criminosas",
    abbr: "ORCRIM",
    title: "Organizações Criminosas",
    icon: Target,
    color: "hsl(345,82%,48%)"
  },
  {
    id: "lavagem-dinheiro",
    abbr: "LAVAGEM",
    title: "Lavagem de Dinheiro",
    icon: Scale,
    color: "hsl(38,92%,50%)"
  },
  {
    id: "interceptacao-telefonica",
    abbr: "INTERCEPT",
    title: "Interceptação Telefônica",
    icon: ShieldAlert,
    color: "hsl(217,91%,60%)"
  },
  {
    id: "abuso-autoridade",
    abbr: "ABUSO",
    title: "Abuso de Autoridade",
    icon: AlertOctagon,
    color: "hsl(239,84%,67%)"
  },
  {
    id: "juizados-especiais-criminais",
    abbr: "JUIZESP",
    title: "Juizados Especiais Criminais",
    icon: Gavel,
    color: "hsl(160,84%,39%)"
  },
  {
    id: "estatuto-desarmamento",
    abbr: "ARMAS",
    title: "Estatuto do Desarmamento",
    icon: AlertOctagon,
    color: "hsl(199,89%,48%)"
  }
];

const FlashcardsArtigosLegislacaoPenal = () => {
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
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50">
            <Siren className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Legislação Penal</h1>
            <p className="text-sm text-muted-foreground">
              Flashcards das leis penais especiais
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

      {/* Leis Penais */}
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
          <div className="flex flex-col gap-3">
            {filteredLeis.map((lei) => {
              const Icon = lei.icon;
              const count = getFlashcardCount(lei.abbr);
              
              return (
                <Card
                  key={lei.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4"
                  style={{ borderLeftColor: lei.color }}
                  onClick={() => navigate(`/flashcards/artigos-lei/temas?codigo=${encodeURIComponent(lei.id)}`)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${lei.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: lei.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base">{lei.abbr}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {lei.title} • {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin inline" />
                        ) : (
                          `${count.toLocaleString("pt-BR")} flashcards`
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

export default FlashcardsArtigosLegislacaoPenal;
