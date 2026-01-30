import { useNavigate, useSearchParams } from "react-router-dom";
import { Scale, Search, RefreshCw, ArrowDownAZ, ListOrdered, CheckSquare, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useQuestoesTemas } from "@/hooks/useQuestoesTemas";

const QuestoesTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [modo, setModo] = useState<"cronologica" | "alfabetica" | "selecionar">("cronologica");
  const [temasSelecionados, setTemasSelecionados] = useState<string[]>([]);

  // Redireciona para seleção de área se não houver área definida
  useEffect(() => {
    if (!area) {
      navigate("/ferramentas/questoes", { replace: true });
    }
  }, [area, navigate]);

  // Hook com cache instantâneo via IndexedDB
  const { temas, isLoading, isFetching } = useQuestoesTemas(area);

  const filteredTemas = temas.filter(item =>
    item.tema.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !item.tema.toLowerCase().includes("peça prática")
  ).sort((a, b) => 
    modo === "alfabetica" 
      ? a.tema.localeCompare(b.tema) 
      : a.ordem - b.ordem
  );

  const toggleTemaSelecionado = (tema: string) => {
    setTemasSelecionados(prev => 
      prev.includes(tema) 
        ? prev.filter(t => t !== tema) 
        : [...prev, tema]
    );
  };

  const iniciarQuestoesSelecionadas = () => {
    if (temasSelecionados.length > 0) {
      const temasParam = temasSelecionados.join(",");
      navigate(`/ferramentas/questoes/resolver?area=${encodeURIComponent(area)}&temas=${encodeURIComponent(temasParam)}&autoplay=true`);
    }
  };

  const navegarParaTema = (tema: string) => {
    navigate(`/ferramentas/questoes/resolver?area=${encodeURIComponent(area)}&tema=${encodeURIComponent(tema)}&autoplay=true`);
  };

  const temPendentes = temas.some(t => !t.temQuestoes);

  // Cor primária para as questões
  const primaryColor = "hsl(142, 71%, 45%)"; // Verde esmeralda

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold line-clamp-1">{area}</h1>
              <p className="text-sm text-muted-foreground">
                {temas.length > 0 ? `${temas.reduce((acc, t) => acc + t.totalQuestoes, 0)} questões disponíveis` : 'Carregando...'}
              </p>
            </div>
            {/* Indicador de atualização automática */}
            {temPendentes && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizando</span>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Toggle de ordenação */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Modo:</span>
          <ToggleGroup 
            type="single" 
            value={modo} 
            onValueChange={(value) => {
              if (value) {
                setModo(value as "cronologica" | "alfabetica" | "selecionar");
                if (value !== "selecionar") {
                  setTemasSelecionados([]);
                }
              }
            }}
            className="bg-muted/50 rounded-lg p-1"
          >
            <ToggleGroupItem 
              value="cronologica" 
              aria-label="Ordem cronológica"
              className="text-xs px-3 py-1.5 h-auto data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400 data-[state=on]:shadow-sm"
            >
              <ListOrdered className="w-3.5 h-3.5 mr-1.5" />
              Cronológica
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="alfabetica" 
              aria-label="Ordem alfabética"
              className="text-xs px-3 py-1.5 h-auto data-[state=on]:bg-purple-500/20 data-[state=on]:text-purple-400 data-[state=on]:shadow-sm"
            >
              <ArrowDownAZ className="w-3.5 h-3.5 mr-1.5" />
              Alfabética
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="selecionar" 
              aria-label="Selecionar temas"
              className="text-xs px-3 py-1.5 h-auto data-[state=on]:bg-emerald-500/20 data-[state=on]:text-emerald-400 data-[state=on]:shadow-sm"
            >
              <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
              Selecionar
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Lista de Temas */}
        <div className={`flex flex-col gap-3 ${modo === "selecionar" && temasSelecionados.length > 0 ? "pb-20" : ""}`}>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : filteredTemas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum tema encontrado
            </div>
          ) : (
            filteredTemas.map((item, index) => (
              <Card
                key={item.tema}
                onClick={() => {
                  if (modo === "selecionar") {
                    toggleTemaSelecionado(item.tema);
                  } else {
                    navegarParaTema(item.tema);
                  }
                }}
                className={`cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-l-4 bg-gradient-to-r from-card to-card/80 group overflow-hidden animate-fade-in ${
                  modo === "selecionar" && temasSelecionados.includes(item.tema) 
                    ? "ring-2 ring-emerald-500" 
                    : ""
                }`}
                style={{ 
                  borderLeftColor: primaryColor,
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'backwards'
                }}
              >
                <CardContent className="p-4 flex items-center gap-4 min-h-[72px]">
                  <div className="bg-emerald-500/10 rounded-full p-3 shrink-0">
                    <Scale className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-base line-clamp-1">{item.tema}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.temQuestoes 
                        ? `${item.totalQuestoes} questões disponíveis` 
                        : item.parcial 
                        ? `${item.subtemasGerados}/${item.totalSubtemas} subtemas gerados`
                        : `0/${item.totalSubtemas} subtemas`}
                    </p>
                    
                    {/* Barra de progresso só aparece durante geração (parcial) */}
                    {item.parcial && (
                      <div className="w-full mt-2">
                        <Progress 
                          value={item.progressoPercent} 
                          className="h-1.5 transition-all duration-500 [&>div]:bg-blue-500"
                        />
                      </div>
                    )}
                  </div>
                  {modo === "selecionar" && (
                    <Checkbox 
                      checked={temasSelecionados.includes(item.tema)}
                      className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 shrink-0"
                    />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Botão fixo na parte inferior quando em modo seleção */}
      {modo === "selecionar" && temasSelecionados.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t z-50">
          <Button 
            onClick={iniciarQuestoesSelecionadas}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-base"
          >
            <Play className="w-5 h-5 mr-2" />
            Iniciar com {temasSelecionados.length} {temasSelecionados.length === 1 ? 'tema selecionado' : 'temas selecionados'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestoesTemas;
