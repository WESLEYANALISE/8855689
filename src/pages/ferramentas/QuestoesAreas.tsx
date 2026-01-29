import { useNavigate } from "react-router-dom";
import { Scale, Search, Loader2, ChevronRight, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuestoesAreasCache } from "@/hooks/useQuestoesAreasCache";
import { useContentLimit } from "@/hooks/useContentLimit";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";

const QuestoesAreas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPremiumCard, setShowPremiumCard] = useState(false);

  const { areas, isLoading, totalQuestoes } = useQuestoesAreasCache();

  const filteredAreas = areas?.filter((item) =>
    item.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Aplicar limite de conteúdo premium (20%)
  const { visibleItems, lockedItems, isPremiumRequired } = useContentLimit(filteredAreas, 'questoes');

  const areaIcons = ["📜", "⚖️", "💼", "💰", "🏛️", "📋"];
  const glowColors = [
    "hsl(0, 84%, 60%)",
    "hsl(25, 95%, 53%)",
    "hsl(160, 84%, 39%)",
    "hsl(45, 93%, 47%)",
    "hsl(217, 91%, 60%)",
    "hsl(330, 81%, 60%)",
  ];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Questões por Tema</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Carregando...' : `${totalQuestoes.toLocaleString('pt-BR')} questões disponíveis`}
              {isPremiumRequired && (
                <span className="text-amber-500 ml-2">
                  • {visibleItems.length} áreas liberadas
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar área..."
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

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Questões Disponíveis
          {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
        </h2>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
            ))}
          </div>
        ) : visibleItems.length === 0 && lockedItems.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Nenhuma área encontrada</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Áreas visíveis */}
            {visibleItems.map((item, index) => (
              <Card
                key={item.area}
                className="cursor-pointer hover:bg-muted/80 transition-all border-l-4 bg-card/90 backdrop-blur-sm hover:translate-x-1"
                style={{
                  borderLeftColor: glowColors[index % glowColors.length],
                  boxShadow: `inset 4px 0 12px -4px ${glowColors[index % glowColors.length]}40`
                }}
                onClick={() =>
                  navigate(
                    `/ferramentas/questoes/temas?area=${encodeURIComponent(item.area)}`
                  )
                }
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div 
                    className="rounded-lg p-2.5 shrink-0 text-xl flex items-center justify-center border"
                    style={{
                      borderColor: `${glowColors[index % glowColors.length]}50`,
                      background: `${glowColors[index % glowColors.length]}15`
                    }}
                  >
                    {areaIcons[index % areaIcons.length]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-foreground">{item.area}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.totalQuestoes > 0 ? (
                        `${item.totalQuestoes.toLocaleString("pt-BR")} questões disponíveis`
                      ) : (
                        "Sem questões ainda"
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}

            {/* Áreas bloqueadas */}
            {lockedItems.map((item, index) => {
              const realIndex = visibleItems.length + index;
              return (
                <Card
                  key={item.area}
                  className="cursor-pointer hover:border-amber-500/40 transition-all border-l-4 bg-card/50 backdrop-blur-sm"
                  style={{
                    borderLeftColor: "hsl(45, 93%, 47%)",
                    boxShadow: `inset 4px 0 12px -4px hsl(45, 93%, 47%, 0.3)`
                  }}
                  onClick={() => setShowPremiumCard(true)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div 
                      className="rounded-lg p-2.5 shrink-0 flex items-center justify-center border border-amber-500/30 bg-amber-500/10"
                    >
                      <Lock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-muted-foreground">{item.area}</h3>
                      <p className="text-sm text-muted-foreground/70">
                        {item.totalQuestoes > 0 ? (
                          `${item.totalQuestoes.toLocaleString("pt-BR")} questões`
                        ) : (
                          "Sem questões ainda"
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-semibold">
                      <Crown className="w-3 h-3" />
                      Premium
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Premium Card */}
      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
        title="Questões Premium"
        description="Desbloqueie todas as áreas de questões assinando um dos nossos planos."
      />
    </div>
  );
};

export default QuestoesAreas;
