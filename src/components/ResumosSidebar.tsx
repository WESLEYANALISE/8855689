import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Search, FileText, Check, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Resumo {
  id: number;
  subtema: string;
  "ordem subtema": string;
}

export const ResumosSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { area, tema } = useParams();
  const [resumos, setResumos] = useState<Resumo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResumos = async () => {
      if (!area || !tema) {
        console.log("ResumosSidebar: área ou tema não definidos", { area, tema });
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const decodedArea = decodeURIComponent(area);
        const decodedTema = decodeURIComponent(tema);
        
        console.log("ResumosSidebar: Carregando resumos para", { decodedArea, decodedTema });
        
        const { data, error } = await supabase
          .from("RESUMO")
          .select("id, subtema, \"ordem subtema\"")
          .eq("area", decodedArea)
          .eq("tema", decodedTema)
          .not("subtema", "is", null)
          .order("ordem subtema", { ascending: true });

        if (error) {
          console.error("Erro ao carregar resumos:", error);
          setIsLoading(false);
          return;
        }

        console.log("ResumosSidebar: Resumos carregados:", data?.length || 0);
        
        if (data) {
          setResumos(data as any[]);
        }
      } catch (error) {
        console.error("Erro ao carregar resumos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadResumos();
  }, [area, tema]);

  const filteredResumos = resumos.filter(r =>
    r.subtema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate(`/resumos-juridicos/prontos/${area}`)}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-sm font-semibold">Subtemas</h3>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar subtema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Lista de subtemas */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="text-sm text-muted-foreground">Carregando...</div>
          </div>
        ) : filteredResumos.length === 0 ? (
          <div className="p-4 text-center">
            <div className="text-sm text-muted-foreground">
              {searchTerm ? "Nenhum resultado encontrado" : "Nenhum subtema disponível"}
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredResumos.map((resumo) => (
              <button
                key={resumo.id}
                onClick={() => {
                  // Trigger resumo selection via URL state or query param
                  window.dispatchEvent(new CustomEvent('selectResumo', { detail: resumo }));
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left hover:bg-secondary group"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {resumo["ordem subtema"]}
                  </span>
                </div>
                <span className="text-sm flex-1 line-clamp-2 font-medium group-hover:text-primary">
                  {resumo.subtema}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
