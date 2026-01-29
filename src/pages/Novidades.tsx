import { Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parse, isSameDay, isValid } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGenericCache } from "@/hooks/useGenericCache";

interface Novidade {
  id: number;
  "Atualização": string;
  "Área": string;
  "Dia": string;
  created_at: string;
}

const Novidades = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { data: novidades, isLoading: loading } = useGenericCache<Novidade[]>({
    cacheKey: 'novidades-list',
    fetchFn: async () => {
      const { data, error } = await (supabase as any).from("NOVIDADES").select("*");
      if (error) throw error;

      return (data || []).sort((a: Novidade, b: Novidade) => {
        try {
          const dateA = parse(a.Dia, "dd/MM/yyyy", new Date());
          const dateB = parse(b.Dia, "dd/MM/yyyy", new Date());
          if (!isValid(dateA) || !isValid(dateB)) return 0;
          return dateB.getTime() - dateA.getTime();
        } catch {
          return 0;
        }
      });
    },
  });

  const getDatesWithNovidades = () => {
    return (novidades || []).map(nov => {
      try {
        const parsedDate = parse(nov.Dia, "dd/MM/yyyy", new Date());
        return isValid(parsedDate) ? parsedDate : null;
      } catch {
        return null;
      }
    }).filter(date => date !== null) as Date[];
  };

  const getNovidadesForDate = (date: Date) => {
    return (novidades || []).filter(nov => {
      try {
        const novDate = parse(nov.Dia, "dd/MM/yyyy", new Date());
        return isValid(novDate) && isSameDay(novDate, date);
      } catch {
        return false;
      }
    });
  };

  const selectedNovidades = selectedDate ? getNovidadesForDate(selectedDate) : [];

  return (
    <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-4xl lg:max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-secondary">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Novidades</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Acompanhe todas as atualizações e melhorias
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 sm:py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent mx-auto"></div>
        </div>
      ) : (
        <>
          <Card className="mb-6 sm:mb-8 bg-card border-border" />

          {selectedDate && selectedNovidades.length > 0 && (
            <Card className="mb-6 sm:mb-8 bg-card border-border">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                    <CardTitle className="text-base sm:text-lg">
                      {format(selectedDate, "dd/MM/yyyy")}
                    </CardTitle>
                  </div>
                  <Badge variant="destructive" className="text-xs sm:text-sm">
                    {selectedNovidades.length} {selectedNovidades.length === 1 ? 'novidade' : 'novidades'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {selectedNovidades.map(novidade => (
                  <div key={novidade.id} className="p-4 sm:p-5 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        {novidade["Área"]}
                      </Badge>
                    </div>
                    <p className="text-sm sm:text-base leading-relaxed">
                      {novidade["Atualização"]}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="mb-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Todas as Novidades</h2>
            </div>
            
            {(novidades || []).length === 0 ? (
              <div className="text-center py-16 sm:py-20">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-secondary mb-3">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Nenhuma novidade no momento
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {(novidades || []).map(novidade => (
                  <Card key={novidade.id} className="bg-card border-border hover:border-accent/50 transition-colors">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                          <span className="text-sm sm:text-base font-medium">
                            {novidade.Dia}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs sm:text-sm">
                          {novidade["Área"]}
                        </Badge>
                      </div>
                      <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                        {novidade["Atualização"]}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Novidades;
