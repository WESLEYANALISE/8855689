import { useQuery } from "@tanstack/react-query";
import { Clock, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BibliotecaBottomNav } from "@/components/biblioteca/BibliotecaBottomNav";
import { format, isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const BibliotecaHistorico = () => {
  const { user } = useAuth();
  const sessionId = sessionStorage.getItem("biblioteca_session_id");

  const { data: acessos, isLoading } = useQuery({
    queryKey: ["biblioteca-historico", user?.id, sessionId],
    queryFn: async () => {
      let query = supabase
        .from("bibliotecas_acessos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (user) {
        query = query.eq("user_id", user.id);
      } else if (sessionId) {
        query = query.eq("session_id", sessionId);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Agrupar por data
  const grouped: Record<string, typeof acessos> = {};
  acessos?.forEach((a) => {
    const date = parseISO(a.created_at!);
    let label: string;
    if (isToday(date)) label = "Hoje";
    else if (isYesterday(date)) label = "Ontem";
    else if (isThisWeek(date)) label = "Esta semana";
    else label = format(date, "dd 'de' MMMM", { locale: ptBR });

    if (!grouped[label]) grouped[label] = [];
    grouped[label]!.push(a);
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-b from-amber-950/30 to-background px-4 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Histórico</h1>
            <p className="text-xs text-muted-foreground">Livros acessados recentemente</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-2">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        )}

        {!isLoading && (!acessos || acessos.length === 0) && (
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
              {items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-amber-500/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {item.livro || item.area || "Livro acessado"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.biblioteca_tabela.replace("BIBLIOTECA-", "").replace("BIBILIOTECA-", "")} · {format(parseISO(item.created_at!), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BibliotecaBottomNav activeTab="historico" />
    </div>
  );
};

export default BibliotecaHistorico;
