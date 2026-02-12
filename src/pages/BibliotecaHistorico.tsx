import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, BookOpen, Loader2, ChevronRight, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { BibliotecaBottomNav } from "@/components/biblioteca/BibliotecaBottomNav";
import { format, isToday, isYesterday, isThisWeek, parseISO, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

const BIBLIOTECA_ROUTE_MAP: Record<string, string> = {
  "BIBLIOTECA-ESTUDOS": "/biblioteca-estudos",
  "BIBILIOTECA-OAB": "/biblioteca-oab",
  "BIBLIOTECA-CLASSICOS": "/biblioteca-classicos",
  "BIBLIOTECA-FORA-DA-TOGA": "/biblioteca-fora-da-toga",
  "BIBLIOTECA-LIDERANÇA": "/biblioteca-lideranca",
  "BIBLIOTECA-ORATORIA": "/biblioteca-oratoria",
  "BIBLIOTECA-PORTUGUES": "/biblioteca-portugues",
  "BIBLIOTECA-PESQUISA-CIENTIFICA": "/biblioteca-pesquisa-cientifica",
  "BIBLIOTECA-POLITICA": "/biblioteca-politica",
};

const BIBLIOTECA_LABEL_MAP: Record<string, string> = {
  "BIBLIOTECA-ESTUDOS": "Estudos",
  "BIBILIOTECA-OAB": "OAB",
  "BIBLIOTECA-CLASSICOS": "Clássicos",
  "BIBLIOTECA-FORA-DA-TOGA": "Fora da Toga",
  "BIBLIOTECA-LIDERANÇA": "Liderança",
  "BIBLIOTECA-ORATORIA": "Oratória",
  "BIBLIOTECA-PORTUGUES": "Português",
  "BIBLIOTECA-PESQUISA-CIENTIFICA": "Pesquisa",
  "BIBLIOTECA-POLITICA": "Política",
};

const BibliotecaHistorico = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sessionId = sessionStorage.getItem("biblioteca_session_id");

  const { data: acessos, isLoading } = useQuery({
    queryKey: ["biblioteca-historico", user?.id, sessionId],
    queryFn: async () => {
      let query = supabase
        .from("bibliotecas_acessos" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (user) {
        query = query.eq("user_id", user.id);
      } else if (sessionId) {
        query = query.eq("session_id", sessionId);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  // Agrupar acessos repetidos e calcular tempo
  const processedItems = useMemo(() => {
    if (!acessos || acessos.length === 0) return [];

    // Agrupar por livro (mesmo item_id + biblioteca_tabela), manter mais recente
    const bookMap = new Map<string, { item: any; count: number; totalMinutes: number; lastAccess: string }>();
    
    // Ordenar por created_at asc para calcular duração
    const sorted = [...acessos].sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime());
    
    sorted.forEach((acesso, idx) => {
      const key = `${acesso.biblioteca_tabela}-${acesso.item_id}`;
      const existing = bookMap.get(key);
      
      // Estimar duração: diferença até o próximo acesso do mesmo usuário, máximo 60min
      let minutes = 0;
      if (idx < sorted.length - 1) {
        const diff = differenceInMinutes(parseISO(sorted[idx + 1].created_at!), parseISO(acesso.created_at!));
        minutes = Math.min(diff, 60); // Cap at 60 min
      } else {
        minutes = 5; // Último acesso: estimar 5 min
      }

      if (existing) {
        existing.count += 1;
        existing.totalMinutes += minutes;
        if (new Date(acesso.created_at!) > new Date(existing.lastAccess)) {
          existing.lastAccess = acesso.created_at!;
          existing.item = acesso;
        }
      } else {
        bookMap.set(key, { item: acesso, count: 1, totalMinutes: minutes, lastAccess: acesso.created_at! });
      }
    });

    // Converter para array ordenado por último acesso
    return Array.from(bookMap.values()).sort(
      (a, b) => new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime()
    );
  }, [acessos]);

  // Stats
  const stats = useMemo(() => {
    if (!acessos) return { totalLivros: 0, totalAcessos: 0, tempoTotal: 0 };
    const livrosUnicos = new Set(acessos.map((a: any) => `${a.biblioteca_tabela}-${a.item_id}`));
    const tempoTotal = processedItems.reduce((sum, p) => sum + p.totalMinutes, 0);
    return { totalLivros: livrosUnicos.size, totalAcessos: acessos.length, tempoTotal };
  }, [acessos, processedItems]);

  // Agrupar por data
  const grouped: Record<string, typeof processedItems> = {};
  processedItems.forEach((p) => {
    const date = parseISO(p.lastAccess);
    let label: string;
    if (isToday(date)) label = "Hoje";
    else if (isYesterday(date)) label = "Ontem";
    else if (isThisWeek(date)) label = "Esta semana";
    else label = format(date, "dd 'de' MMMM", { locale: ptBR });

    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(p);
  });

  const handleNavigate = (item: any) => {
    const baseRoute = BIBLIOTECA_ROUTE_MAP[item.biblioteca_tabela];
    if (baseRoute) {
      navigate(`${baseRoute}/${item.item_id}`);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-b from-amber-950/30 to-background px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Histórico</h1>
            <p className="text-xs text-muted-foreground">Livros acessados recentemente</p>
          </div>
        </div>

        {/* Stats */}
        {stats.totalLivros > 0 && (
          <div className="flex gap-2">
            <div className="flex-1 bg-card rounded-xl p-2.5 border border-border/30 text-center">
              <p className="text-lg font-bold text-foreground">{stats.totalLivros}</p>
              <p className="text-[10px] text-muted-foreground">Livros</p>
            </div>
            <div className="flex-1 bg-card rounded-xl p-2.5 border border-border/30 text-center">
              <p className="text-lg font-bold text-foreground">{stats.totalAcessos}</p>
              <p className="text-[10px] text-muted-foreground">Acessos</p>
            </div>
            <div className="flex-1 bg-card rounded-xl p-2.5 border border-border/30 text-center">
              <p className="text-lg font-bold text-foreground">{formatDuration(stats.tempoTotal)}</p>
              <p className="text-[10px] text-muted-foreground">Tempo est.</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 mt-2">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        )}

        {!isLoading && processedItems.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum histórico ainda</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Seus livros acessados aparecerão aqui</p>
          </div>
        )}

        {Object.entries(grouped).map(([label, items]) => (
          <div key={label} className="mb-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</h2>
            <div className="space-y-2">
              {items.map((entry) => {
                const item = entry.item;
                const categoriaLabel = BIBLIOTECA_LABEL_MAP[item.biblioteca_tabela] || 
                  item.biblioteca_tabela.replace("BIBLIOTECA-", "").replace("BIBILIOTECA-", "");
                
                return (
                  <div
                    key={`${item.biblioteca_tabela}-${item.item_id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30 cursor-pointer hover:border-amber-500/30 transition-colors group"
                    onClick={() => handleNavigate(item)}
                  >
                    {item.capa_url ? (
                      <img 
                        src={item.capa_url} 
                        alt={item.livro || "Livro"} 
                        className="w-14 h-20 rounded-lg object-cover flex-shrink-0 shadow-md" 
                      />
                    ) : (
                      <div className="w-14 h-20 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-amber-500/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {item.livro || item.area || "Livro acessado"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-medium">
                          {categoriaLabel}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(parseISO(entry.lastAccess), "HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/60">
                        {entry.count > 1 && (
                          <span className="flex items-center gap-0.5">
                            <BarChart3 className="w-3 h-3" /> {entry.count}x acessado
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> ~{formatDuration(entry.totalMinutes)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <BibliotecaBottomNav activeTab="historico" />
    </div>
  );
};

export default BibliotecaHistorico;
