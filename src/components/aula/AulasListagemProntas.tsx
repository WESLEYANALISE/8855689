import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, TrendingUp, Eye } from "lucide-react";
import { toast } from "sonner";

interface AulaPronta {
  id: string;
  area: string;
  tema: string;
  titulo: string;
  descricao: string;
  visualizacoes: number;
  aproveitamento_medio: number | null;
  created_at: string;
  estrutura_completa: any;
}

interface AulasListagemProntasProps {
  onSelecionarAula: (estrutura: any, aulaId: string) => void;
}

export const AulasListagemProntas = ({ onSelecionarAula }: AulasListagemProntasProps) => {
  const [aulas, setAulas] = useState<AulaPronta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  useEffect(() => {
    carregarAulas();
  }, []);

  const carregarAulas = async () => {
    try {
      const { data, error } = await supabase
        .from('aulas_interativas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAulas(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar aulas:', error);
      toast.error('Erro ao carregar aulas prontas');
    } finally {
      setIsLoading(false);
    }
  };

  const incrementarVisualizacao = async (aulaId: string) => {
    try {
      const aula = aulas.find(a => a.id === aulaId);
      if (!aula) return;

      await supabase
        .from('aulas_interativas')
        .update({ visualizacoes: (aula.visualizacoes || 0) + 1 })
        .eq('id', aulaId);
    } catch (error) {
      console.error('Erro ao incrementar visualização:', error);
    }
  };

  const handleSelecionarAula = (aula: AulaPronta) => {
    incrementarVisualizacao(aula.id);
    onSelecionarAula(aula.estrutura_completa, aula.id);
  };

  const aulasFiltradas = aulas.filter(aula => {
    const matchSearch = aula.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       aula.tema.toLowerCase().includes(searchTerm.toLowerCase());
    const matchArea = !areaFilter || aula.area === areaFilter;
    return matchSearch && matchArea;
  });

  const areas = Array.from(new Set(aulas.map(a => a.area)));

  const getAreaColor = (area: string) => {
    const colors: Record<string, string> = {
      "Direito Penal": "bg-red-500/10 text-red-700 dark:text-red-400",
      "Direito Civil": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      "Direito Constitucional": "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      "Direito Administrativo": "bg-green-500/10 text-green-700 dark:text-green-400",
    };
    return colors[area] || "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tema ou título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={areaFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setAreaFilter(null)}
          >
            Todas
          </Button>
          {areas.map(area => (
            <Button
              key={area}
              variant={areaFilter === area ? "default" : "outline"}
              size="sm"
              onClick={() => setAreaFilter(area)}
            >
              {area}
            </Button>
          ))}
        </div>
      </div>

      {aulasFiltradas.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchTerm || areaFilter 
              ? "Nenhuma aula encontrada com os filtros selecionados"
              : "Nenhuma aula disponível ainda. Crie a primeira!"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {aulasFiltradas.map((aula) => (
            <Card key={aula.id} className="p-5 hover:border-primary/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getAreaColor(aula.area)}>
                        📚 {aula.area}
                      </Badge>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-medium text-primary">{aula.tema}</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight">{aula.titulo}</h3>
                    {aula.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {aula.descricao}
                      </p>
                    )}
                  </div>
                  <Button onClick={() => handleSelecionarAula(aula)} className="shrink-0">
                    Iniciar
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{aula.visualizacoes || 0} visualizações</span>
                  </div>
                  {aula.aproveitamento_medio && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{aula.aproveitamento_medio.toFixed(1)}% aproveitamento</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
