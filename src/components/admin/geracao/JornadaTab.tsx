import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Play, CheckCircle2, Clock, RefreshCw, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AreaStats {
  area: string;
  totalResumos: number;
  aulasGeradas: number;
}

interface ResumoItem {
  id: number;
  tema: string;
  hasAula: boolean;
}

export const JornadaTab = () => {
  const [areas, setAreas] = useState<AreaStats[]>([]);
  const [areaSelecionada, setAreaSelecionada] = useState<string>("");
  const [resumos, setResumos] = useState<ResumoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResumos, setLoadingResumos] = useState(false);
  const [gerandoId, setGerandoId] = useState<number | null>(null);
  const [gerandoLote, setGerandoLote] = useState(false);

  // Fetch areas and stats
  useEffect(() => {
    const fetchAreas = async () => {
      setLoading(true);
      try {
        // Get all areas from RESUMOS_ARTIGOS_LEI
        const { data: areasData, error } = await supabase
          .from('RESUMOS_ARTIGOS_LEI')
          .select('area')
          .not('area', 'is', null);

        if (error) throw error;

        // Count per area
        const areaCounts: Record<string, number> = {};
        areasData?.forEach(item => {
          if (item.area) {
            areaCounts[item.area] = (areaCounts[item.area] || 0) + 1;
          }
        });

        // Get cached aulas count per area
        const { data: cacheData } = await supabase
          .from('jornada_aulas_cache')
          .select('area');

        const cacheCounts: Record<string, number> = {};
        cacheData?.forEach(item => {
          cacheCounts[item.area] = (cacheCounts[item.area] || 0) + 1;
        });

        const areasStats: AreaStats[] = Object.entries(areaCounts)
          .map(([area, count]) => ({
            area,
            totalResumos: count,
            aulasGeradas: cacheCounts[area] || 0
          }))
          .sort((a, b) => a.area.localeCompare(b.area));

        setAreas(areasStats);
      } catch (error) {
        console.error('Erro ao buscar áreas:', error);
        toast.error('Erro ao carregar áreas');
      } finally {
        setLoading(false);
      }
    };

    fetchAreas();
  }, []);

  // Fetch resumos when area changes
  useEffect(() => {
    if (!areaSelecionada) {
      setResumos([]);
      return;
    }

    const fetchResumos = async () => {
      setLoadingResumos(true);
      try {
        // Get resumos for area
        const { data: resumosData, error } = await supabase
          .from('RESUMOS_ARTIGOS_LEI')
          .select('id, tema')
          .eq('area', areaSelecionada)
          .order('id', { ascending: true });

        if (error) throw error;

        // Get cached aulas for this area
        const { data: cacheData } = await supabase
          .from('jornada_aulas_cache')
          .select('resumo_id')
          .eq('area', areaSelecionada);

        const cachedIds = new Set(cacheData?.map(c => c.resumo_id));

        const resumosList: ResumoItem[] = (resumosData || []).map(r => ({
          id: r.id,
          tema: r.tema || `Resumo ${r.id}`,
          hasAula: cachedIds.has(r.id)
        }));

        setResumos(resumosList);
      } catch (error) {
        console.error('Erro ao buscar resumos:', error);
      } finally {
        setLoadingResumos(false);
      }
    };

    fetchResumos();
  }, [areaSelecionada]);

  const handleGerarAula = async (resumoId: number) => {
    setGerandoId(resumoId);
    try {
      // Get resumo data
      const { data: resumo, error } = await supabase
        .from('RESUMOS_ARTIGOS_LEI')
        .select('*')
        .eq('id', resumoId)
        .single();

      if (error || !resumo) throw error || new Error('Resumo não encontrado');

      // Call edge function
      const response = await supabase.functions.invoke('gerar-aula-jornada', {
        body: {
          area: resumo.area,
          resumoId: resumo.id,
          tema: resumo.tema,
          conteudoOriginal: resumo.resumo_markdown,
          resumoMarkdown: resumo.resumo_markdown,
          exemplos: resumo.exemplos,
          termos: resumo.termos
        }
      });

      if (response.error) throw response.error;

      toast.success(`Aula gerada para: ${resumo.tema}`);

      // Update list
      setResumos(prev => prev.map(r => 
        r.id === resumoId ? { ...r, hasAula: true } : r
      ));

      // Update area stats
      setAreas(prev => prev.map(a => 
        a.area === areaSelecionada 
          ? { ...a, aulasGeradas: a.aulasGeradas + 1 }
          : a
      ));
    } catch (error: any) {
      console.error('Erro ao gerar aula:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setGerandoId(null);
    }
  };

  const handleGerarLote = async (quantidade: number) => {
    const pendentes = resumos.filter(r => !r.hasAula).slice(0, quantidade);
    if (pendentes.length === 0) {
      toast.info('Todas as aulas já foram geradas!');
      return;
    }

    setGerandoLote(true);
    let geradas = 0;

    for (const resumo of pendentes) {
      try {
        await handleGerarAula(resumo.id);
        geradas++;
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Erro ao gerar aula ${resumo.id}:`, error);
      }
    }

    setGerandoLote(false);
    toast.success(`${geradas} aulas geradas com sucesso!`);
  };

  const areaStats = areas.find(a => a.area === areaSelecionada);
  const percentual = areaStats 
    ? Math.round((areaStats.aulasGeradas / areaStats.totalResumos) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Geração de Aulas - Jornada Jurídica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Area selector */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Área</label>
              <Select value={areaSelecionada} onValueChange={setAreaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map(area => (
                    <SelectItem key={area.area} value={area.area}>
                      {area.area} ({area.aulasGeradas}/{area.totalResumos})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          {areaStats && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Aulas geradas: {areaStats.aulasGeradas} de {areaStats.totalResumos}</span>
                <span>{percentual}%</span>
              </div>
              <Progress value={percentual} className="h-2" />
            </div>
          )}

          {/* Batch actions */}
          {areaSelecionada && (
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => handleGerarLote(10)}
                disabled={gerandoLote || gerandoId !== null}
                variant="outline"
              >
                {gerandoLote ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Gerar Próximas 10
              </Button>
              <Button
                onClick={() => handleGerarLote(50)}
                disabled={gerandoLote || gerandoId !== null}
                variant="outline"
              >
                Gerar Próximas 50
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumos list */}
      {areaSelecionada && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumos - {areaSelecionada}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingResumos ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {resumos.map((resumo, idx) => (
                    <div
                      key={resumo.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-8">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{resumo.tema}</p>
                          <p className="text-xs text-muted-foreground">ID: {resumo.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {resumo.hasAula ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Pronta
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="w-3 h-3" />
                            Pendente
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant={resumo.hasAula ? "ghost" : "default"}
                          onClick={() => handleGerarAula(resumo.id)}
                          disabled={gerandoId !== null || gerandoLote}
                        >
                          {gerandoId === resumo.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : resumo.hasAula ? (
                            <RefreshCw className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
