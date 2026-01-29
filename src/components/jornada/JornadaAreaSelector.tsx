import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Check, Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface AreaData {
  area: string;
  total_artigos: number;
}

interface JornadaAreaSelectorProps {
  areaSelecionada: string | null;
  onSelect: (area: string, totalArtigos: number) => void;
}

export const JornadaAreaSelector = ({ areaSelecionada, onSelect }: JornadaAreaSelectorProps) => {
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        // Buscar TODAS as áreas distintas usando paginação para contornar limite de 1000
        const areasMap = new Map<string, number>();
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from("RESUMOS_ARTIGOS_LEI")
            .select("area")
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) throw error;

          if (!data || data.length === 0) {
            hasMore = false;
          } else {
            data.forEach(item => {
              if (item.area) {
                areasMap.set(item.area, (areasMap.get(item.area) || 0) + 1);
              }
            });
            hasMore = data.length === pageSize;
            page++;
          }
        }

        const areasArray = Array.from(areasMap.entries())
          .map(([area, total_artigos]) => ({ area, total_artigos }))
          .sort((a, b) => b.total_artigos - a.total_artigos);

        setAreas(areasArray);
      } catch (error) {
        console.error("Erro ao buscar áreas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAreas();
  }, []);

  const areasFiltradas = areas.filter(a => 
    a.area.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center mb-2">
        <h3 className="font-semibold text-lg">Escolha uma matéria</h3>
        <p className="text-sm text-muted-foreground">
          {areas.length} áreas disponíveis
        </p>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar área..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de áreas */}
      <ScrollArea className="h-64">
        <div className="grid gap-2 pr-4">
          {areasFiltradas.map((area, index) => {
            const isSelected = areaSelecionada === area.area;

            return (
              <motion.div
                key={area.area}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => onSelect(area.area, area.total_artigos)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{area.area}</p>
                      <p className="text-xs text-muted-foreground">
                        {area.total_artigos} artigos
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          
          {areasFiltradas.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma área encontrada
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
