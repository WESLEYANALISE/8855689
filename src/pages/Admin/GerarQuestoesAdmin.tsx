import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Play, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AreaInfo {
  area: string;
  total_temas: number;
}

export default function GerarQuestoesAdmin() {
  const [areas, setAreas] = useState<AreaInfo[]>([]);
  const [areasSelecionadas, setAreasSelecionadas] = useState<string[]>([]);
  const [questoesPorTema, setQuestoesPorTema] = useState(3);
  const [gerando, setGerando] = useState(false);
  const [loteAtual, setLoteAtual] = useState<any>(null);
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    carregarAreas();
  }, []);

  useEffect(() => {
    if (loteAtual && loteAtual.status === 'processando') {
      const interval = setInterval(() => {
        atualizarProgresso();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [loteAtual]);

  const carregarAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('RESUMO')
        .select('area');

      if (error) throw error;

      const areaCount = data.reduce((acc: { [key: string]: number }, item) => {
        acc[item.area] = (acc[item.area] || 0) + 1;
        return acc;
      }, {});

      const areasArray = Object.entries(areaCount).map(([area, total]) => ({
        area,
        total_temas: total as number
      })).sort((a, b) => b.total_temas - a.total_temas);

      setAreas(areasArray);
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
      toast.error('Erro ao carregar áreas');
    }
  };

  const atualizarProgresso = async () => {
    if (!loteAtual) return;

    try {
      const { data, error } = await supabase
        .from('QUESTOES_LOTE' as any)
        .select('*')
        .eq('id', loteAtual.id)
        .single();

      if (error) throw error;

      const loteData = data as any;
      setLoteAtual(loteData);
      setProgresso(loteData?.progresso_percentual || 0);

      if (loteData?.status === 'concluido') {
        setGerando(false);
        toast.success(`Geração concluída! ${loteData?.total_questoes_geradas} questões criadas.`);
      } else if (loteData?.status === 'erro') {
        setGerando(false);
        toast.error('Erro na geração de questões');
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
    }
  };

  const toggleArea = (area: string) => {
    setAreasSelecionadas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const iniciarGeracao = async () => {
    if (areasSelecionadas.length === 0) {
      toast.error('Selecione pelo menos uma área');
      return;
    }

    try {
      setGerando(true);
      setProgresso(0);

      // Criar registro do lote
      const { data: lote, error: loteError } = await supabase
        .from('QUESTOES_LOTE' as any)
        .insert({
          areas_selecionadas: areasSelecionadas,
          questoes_por_tema: questoesPorTema,
          status: 'processando',
          iniciado_em: new Date().toISOString()
        } as any)
        .select()
        .single();

      if (loteError) throw loteError;

      const loteData = lote as any;
      setLoteAtual(loteData);

      // Chamar edge function
      const { error: functionError } = await supabase.functions.invoke('gerar-questoes-lote', {
        body: {
          areas: areasSelecionadas,
          questoesPorTema,
          loteId: loteData.id
        }
      });

      if (functionError) throw functionError;

      toast.info('Geração iniciada! Acompanhe o progresso abaixo.');

    } catch (error) {
      console.error('Erro ao iniciar geração:', error);
      toast.error('Erro ao iniciar geração');
      setGerando(false);
    }
  };

  const totalTemas = areas
    .filter(a => areasSelecionadas.includes(a.area))
    .reduce((sum, a) => sum + a.total_temas, 0);

  const questoesEstimadas = totalTemas * questoesPorTema;
  const tokensEstimados = questoesEstimadas * 500;
  const custoEstimado = (tokensEstimados / 1000000) * 0.30;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Geração de Questões (Admin)</h1>
          </div>
          <p className="text-purple-100">Gere questões automaticamente usando IA</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Configuração */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Configuração da Geração</h2>

          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Questões por tema</label>
            <Select value={questoesPorTema.toString()} onValueChange={(v) => setQuestoesPorTema(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 questão</SelectItem>
                <SelectItem value="2">2 questões</SelectItem>
                <SelectItem value="3">3 questões</SelectItem>
                <SelectItem value="5">5 questões</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Selecionar Áreas</label>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {areas.map((area) => (
                <div key={area.area} className="flex items-center space-x-2 p-3 border rounded hover:bg-accent/50">
                  <Checkbox
                    id={area.area}
                    checked={areasSelecionadas.includes(area.area)}
                    onCheckedChange={() => toggleArea(area.area)}
                  />
                  <label
                    htmlFor={area.area}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {area.area} ({area.total_temas} temas)
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Estimativa */}
          {areasSelecionadas.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">Estimativa:</h3>
              <ul className="text-sm space-y-1">
                <li>• {totalTemas} temas × {questoesPorTema} questões = <strong>{questoesEstimadas} questões</strong></li>
                <li>• Tokens estimados: ~{tokensEstimados.toLocaleString()}</li>
                <li>• Custo estimado: ~${custoEstimado.toFixed(2)} USD</li>
                <li>• Tempo estimado: ~{Math.ceil(totalTemas / 10)} minutos</li>
              </ul>
            </div>
          )}

          <Button
            onClick={iniciarGeracao}
            disabled={gerando || areasSelecionadas.length === 0}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {gerando ? 'Gerando...' : 'Iniciar Geração'}
          </Button>
        </Card>

        {/* Progresso */}
        {loteAtual && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Progresso Atual</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progresso</span>
                  <span>{progresso.toFixed(1)}%</span>
                </div>
                <Progress value={progresso} className="h-2" />
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-accent/50 p-3 rounded">
                  <div className="text-muted-foreground mb-1">Resumos processados</div>
                  <div className="text-xl font-bold">{loteAtual.total_resumos_processados || 0}</div>
                </div>
                <div className="bg-accent/50 p-3 rounded">
                  <div className="text-muted-foreground mb-1">Questões geradas</div>
                  <div className="text-xl font-bold">{loteAtual.total_questoes_geradas || 0}</div>
                </div>
                <div className="bg-accent/50 p-3 rounded">
                  <div className="text-muted-foreground mb-1">Status</div>
                  <div className="text-xl font-bold capitalize">{loteAtual.status}</div>
                </div>
              </div>

              {loteAtual.status === 'concluido' && (
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">Geração Concluída!</h3>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {loteAtual.total_questoes_geradas} questões foram geradas e estão disponíveis para uso.
                    </p>
                  </div>
                </div>
              )}

              {loteAtual.log_erros && loteAtual.log_erros.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                        {loteAtual.log_erros.length} erros durante a geração
                      </h3>
                      <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 max-h-40 overflow-y-auto">
                        {loteAtual.log_erros.map((erro: any, idx: number) => (
                          <div key={idx}>• {erro.area} - {erro.tema}: {erro.erro}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
