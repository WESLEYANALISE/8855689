import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Search, Loader2, TrendingUp, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFlashcardsArtigosCount, getCountByArea } from "@/hooks/useFlashcardsArtigosCount";

const FlashcardsArtigosConstituicao = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: flashcardCounts, isLoading } = useFlashcardsArtigosCount();

  const cfCount = flashcardCounts ? getCountByArea(flashcardCounts, "Constituição Federal") : 0;

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Constituição Federal</h1>
            <p className="text-sm text-muted-foreground">
              Flashcards da Constituição
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar artigo..."
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

      {/* Constituição */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Flashcards Disponíveis
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin ml-1" />
          ) : (
            <span className="text-muted-foreground font-normal">
              ({cfCount.toLocaleString("pt-BR")})
            </span>
          )}
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          <Card
            className="cursor-pointer hover:scale-[1.01] hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-500/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
            onClick={() => navigate(`/flashcards/artigos-lei/temas?codigo=cf`)}
          >
            {/* Glow no topo */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 opacity-80"
              style={{
                background: `linear-gradient(90deg, transparent, hsl(25, 95%, 53%), transparent)`,
                boxShadow: `0 0 20px hsl(25, 95%, 53%)`
              }}
            />
            
            {/* Sigla no canto superior esquerdo */}
            <div 
              className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded"
              style={{ 
                backgroundColor: `hsl(25, 95%, 53%, 0.2)`,
                color: 'hsl(25, 95%, 53%)' 
              }}
            >
              CF/88
            </div>
            
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-orange-500 rounded-full p-4 shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Constituição Federal de 1988</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Lei maior do ordenamento jurídico brasileiro
                </p>
                <p className="text-sm font-medium" style={{ color: 'hsl(25, 95%, 53%)' }}>
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin inline" />
                  ) : (
                    `${cfCount.toLocaleString("pt-BR")} flashcards disponíveis`
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FlashcardsArtigosConstituicao;
