import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Scale, Search, BookOpen, Gavel, FileText, Briefcase, Shield, 
  DollarSign, Car, Droplets, Plane, Radio, Building2, Mountain, 
  Sword, Siren, Loader2, TrendingUp 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFlashcardsArtigosCount, getCountByArea } from "@/hooks/useFlashcardsArtigosCount";

// Mapeamento de áreas do banco para as siglas
const areaToDbName: Record<string, string> = {
  "CC": "Código Civil",
  "CP": "Código Penal",
  "CPC": "Código de Processo Civil",
  "CPP": "Código de Processo Penal",
  "CLT": "CLT",
  "CDC": "Código de Defesa do Consumidor",
  "CTN": "Código Tributário Nacional",
  "CTB": "Código de Trânsito Brasileiro",
  "CE": "Código Eleitoral",
  "CA": "Código de Águas",
  "CBA": "Código Brasileiro de Aeronáutica",
  "CBT": "Código Brasileiro de Telecomunicações",
  "CCOM": "Código Comercial",
  "CDM": "Código de Minas",
  "CPM": "Código Penal Militar",
  "CPPM": "Código de Processo Penal Militar"
};

// Códigos organizados por categoria
const categorias = [
  {
    titulo: "Códigos Principais",
    icone: Scale,
    cor: "hsl(217,91%,60%)",
    items: [
      {
        id: "cc",
        abbr: "CC",
        title: "Código Civil",
        icon: Scale,
        glowColor: "hsl(217,91%,60%)",
        iconBg: "bg-blue-500"
      },
      {
        id: "cp",
        abbr: "CP",
        title: "Código Penal",
        icon: Gavel,
        glowColor: "hsl(24,95%,53%)",
        iconBg: "bg-orange-500"
      },
      {
        id: "cpc",
        abbr: "CPC",
        title: "Código de Processo Civil",
        icon: FileText,
        glowColor: "hsl(217,91%,60%)",
        iconBg: "bg-blue-600"
      },
      {
        id: "cpp",
        abbr: "CPP",
        title: "Código de Processo Penal",
        icon: Sword,
        glowColor: "hsl(271,76%,53%)",
        iconBg: "bg-purple-500"
      }
    ]
  },
  {
    titulo: "Trabalho e Consumidor",
    icone: Briefcase,
    cor: "hsl(43,96%,56%)",
    items: [
      {
        id: "clt",
        abbr: "CLT",
        title: "Consolidação das Leis do Trabalho",
        icon: Briefcase,
        glowColor: "hsl(43,96%,56%)",
        iconBg: "bg-yellow-500"
      },
      {
        id: "cdc",
        abbr: "CDC",
        title: "Código de Defesa do Consumidor",
        icon: Shield,
        glowColor: "hsl(160,84%,39%)",
        iconBg: "bg-emerald-500"
      }
    ]
  },
  {
    titulo: "Tributário e Eleitoral",
    icone: DollarSign,
    cor: "hsl(38,92%,50%)",
    items: [
      {
        id: "ctn",
        abbr: "CTN",
        title: "Código Tributário Nacional",
        icon: DollarSign,
        glowColor: "hsl(38,92%,50%)",
        iconBg: "bg-amber-500"
      },
      {
        id: "ce",
        abbr: "CE",
        title: "Código Eleitoral",
        icon: Scale,
        glowColor: "hsl(239,84%,67%)",
        iconBg: "bg-indigo-500"
      }
    ]
  },
  {
    titulo: "Trânsito e Infraestrutura",
    icone: Car,
    cor: "hsl(330,81%,60%)",
    items: [
      {
        id: "ctb",
        abbr: "CTB",
        title: "Código de Trânsito",
        icon: Car,
        glowColor: "hsl(330,81%,60%)",
        iconBg: "bg-pink-500"
      },
      {
        id: "ca",
        abbr: "CA",
        title: "Código de Águas",
        icon: Droplets,
        glowColor: "hsl(189,94%,43%)",
        iconBg: "bg-cyan-500"
      },
      {
        id: "cba",
        abbr: "CBA",
        title: "Código de Aeronáutica",
        icon: Plane,
        glowColor: "hsl(199,89%,48%)",
        iconBg: "bg-sky-500"
      },
      {
        id: "cbt",
        abbr: "CBT",
        title: "Código de Telecomunicações",
        icon: Radio,
        glowColor: "hsl(258,90%,66%)",
        iconBg: "bg-violet-500"
      },
      {
        id: "cdm",
        abbr: "CDM",
        title: "Código de Minas",
        icon: Mountain,
        glowColor: "hsl(66,70%,54%)",
        iconBg: "bg-lime-500"
      }
    ]
  },
  {
    titulo: "Comercial",
    icone: Building2,
    cor: "hsl(160,84%,39%)",
    items: [
      {
        id: "ccom",
        abbr: "CCOM",
        title: "Código Comercial",
        icon: Building2,
        glowColor: "hsl(160,84%,39%)",
        iconBg: "bg-teal-500"
      }
    ]
  },
  {
    titulo: "Militar",
    icone: Siren,
    cor: "hsl(15,86%,53%)",
    items: [
      {
        id: "cpm",
        abbr: "CPM",
        title: "Código Penal Militar",
        icon: Shield,
        glowColor: "hsl(15,86%,53%)",
        iconBg: "bg-orange-600"
      },
      {
        id: "cppm",
        abbr: "CPPM",
        title: "Código de Processo Penal Militar",
        icon: Siren,
        glowColor: "hsl(345,82%,48%)",
        iconBg: "bg-rose-600"
      }
    ]
  }
];

// Lista plana de todos os códigos para contagem
const allCodes = categorias.flatMap(cat => cat.items);

const FlashcardsArtigosCodigosLeis = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: flashcardCounts, isLoading } = useFlashcardsArtigosCount();

  const filteredCategorias = useMemo(() => {
    if (!searchQuery.trim()) return categorias;
    const query = searchQuery.toLowerCase();
    return categorias.map(cat => ({
      ...cat,
      items: cat.items.filter(code =>
        code.abbr.toLowerCase().includes(query) ||
        code.title.toLowerCase().includes(query)
      )
    })).filter(cat => cat.items.length > 0);
  }, [searchQuery]);

  const totalFlashcards = useMemo(() => {
    if (!flashcardCounts) return 0;
    return allCodes.reduce((sum, code) => {
      const dbName = areaToDbName[code.abbr];
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
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 shadow-lg shadow-red-500/50">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Códigos e Leis</h1>
            <p className="text-sm text-muted-foreground">
              Flashcards dos principais códigos
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

      {/* Códigos */}
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
              Nenhum código encontrado
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
                  
                  {/* Grid de códigos */}
                  <div className="grid grid-cols-2 gap-3">
                    {categoria.items.map((code, index) => {
                      const Icon = code.icon;
                      const count = getFlashcardCount(code.abbr);
                      
                      return (
                        <Card
                          key={code.id}
                          className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
                          style={{ animationDelay: `${(catIndex * 0.1) + (index * 0.03)}s` }}
                          onClick={() => navigate(`/flashcards/artigos-lei/temas?codigo=${encodeURIComponent(code.id)}`)}
                        >
                          {/* Glow no topo */}
                          <div 
                            className="absolute top-0 left-0 right-0 h-1 opacity-80"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${code.glowColor}, transparent)`,
                              boxShadow: `0 0 20px ${code.glowColor}`
                            }}
                          />
                          
                          {/* Sigla no canto superior esquerdo */}
                          <div 
                            className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ 
                              backgroundColor: `${code.glowColor}20`,
                              color: code.glowColor 
                            }}
                          >
                            {code.abbr}
                          </div>
                          
                          <CardContent className="p-4 pt-6 flex flex-col items-center text-center min-h-[140px] justify-center">
                            <div className={`${code.iconBg} rounded-full p-3 mb-2 shadow-lg`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold text-xs mb-1 line-clamp-2">{code.title}</h3>
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

export default FlashcardsArtigosCodigosLeis;
