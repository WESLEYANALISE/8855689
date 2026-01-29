import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import OABWelcomeCard from "@/components/OABWelcomeCard";
import { useGenericCache } from "@/hooks/useGenericCache";

interface Exame {
  exame: string;
  ano: number;
  banca: string;
  count: number;
}

const SimuladosExames = () => {
  const navigate = useNavigate();
  
  const { data: exames, isLoading } = useGenericCache<Exame[]>({
    cacheKey: 'simulados-exames-oab',
    fetchFn: async () => {
      const { data, error } = await supabase
        .from("SIMULADO-OAB" as any)
        .select("Exame, Ano, Banca")
        .not("Exame", "is", null)
        .not("Ano", "is", null);
      
      if (error) throw error;

      const exameMap = new Map<string, {
        exame: string;
        ano: number;
        banca: string;
        count: number;
      }>();
      
      (data || []).forEach((item: any) => {
        const key = `${item.Exame}-${item.Ano}`;
        if (!exameMap.has(key)) {
          exameMap.set(key, {
            exame: item.Exame || "",
            ano: item.Ano || 0,
            banca: item.Banca || "N/A",
            count: 0
          });
        }
        const exam = exameMap.get(key)!;
        exam.count++;
      });
      
      return Array.from(exameMap.values()).sort((a, b) => b.ano - a.ano || a.exame.localeCompare(b.exame));
    },
  });

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      <OABWelcomeCard />

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Exames da OAB</h1>
        <p className="text-sm text-muted-foreground">
          Escolha um exame completo para praticar
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(exames || []).map((exame) => (
            <Card 
              key={`${exame.exame}-${exame.ano}`} 
              className="cursor-pointer hover:scale-[1.02] transition-all border-accent/20 hover:border-accent/50 bg-card group min-h-[120px] animate-fade-in" 
              onClick={() => navigate(`/simulados/realizar?exame=${encodeURIComponent(exame.exame)}&ano=${exame.ano}`)}
            >
              <CardContent className="p-4 flex items-center gap-3 h-full">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent shrink-0">
                  <Gavel className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground mb-1 truncate">
                    {exame.exame} - {exame.ano}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    Banca: {exame.banca} • {exame.count} questões
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimuladosExames;
