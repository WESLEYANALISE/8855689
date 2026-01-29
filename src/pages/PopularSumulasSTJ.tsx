import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const PopularSumulasSTJ = () => {
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });

  const popularLote = async (inicio: number, fim: number) => {
    try {
      setLoading(true);
      setResultados([]);
      setProgresso({ atual: 0, total: fim - inicio + 1 });
      
      toast.info(`Buscando súmulas ${inicio} a ${fim}...`);

      const { data, error } = await supabase.functions.invoke('popular-sumulas-stj', {
        body: { 
          inicio,
          fim
        }
      });

      if (error) throw error;

      setResultados(data.resultados || []);
      
      const sucesso = data.resultados?.filter((r: any) => r.sucesso).length || 0;
      const total = data.resultados?.length || 0;
      
      toast.success(`Concluído! ${sucesso}/${total} súmulas processadas com sucesso`);
    } catch (error) {
      console.error('Erro ao popular:', error);
      toast.error('Erro ao popular súmulas');
    } finally {
      setLoading(false);
    }
  };

  const verificarProgresso = async () => {
    const { data, error } = await supabase
      .from("SUMULAS STJ")
      .select("id", { count: "exact" });
    
    if (!error && data) {
      toast.info(`Total de súmulas no banco: ${data.length}/676`);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">
          🚀 Popular Súmulas STJ
        </h1>
        <p className="text-sm text-muted-foreground">
          Ferramenta para popular o banco com as 676 súmulas do STJ em lotes de 50
        </p>
      </div>

      <div className="space-y-4">
        {/* Status Atual */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-3">📊 Status Atual</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Atualmente temos 116 súmulas inseridas (1-100 e 661-676).
            Faltam 560 súmulas (101-660).
          </p>
          <Button onClick={verificarProgresso} variant="outline">
            Verificar Progresso
          </Button>
        </Card>

        {/* Lotes para Popular */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-3">📝 Popular por Lote</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Clique para popular cada lote de 50 súmulas:
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button
              onClick={() => popularLote(101, 150)}
              disabled={loading}
              size="sm"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              101-150
            </Button>
            
            <Button
              onClick={() => popularLote(151, 200)}
              disabled={loading}
              size="sm"
            >
              151-200
            </Button>
            
            <Button
              onClick={() => popularLote(201, 250)}
              disabled={loading}
              size="sm"
            >
              201-250
            </Button>
            
            <Button
              onClick={() => popularLote(251, 300)}
              disabled={loading}
              size="sm"
            >
              251-300
            </Button>
            
            <Button
              onClick={() => popularLote(301, 350)}
              disabled={loading}
              size="sm"
            >
              301-350
            </Button>
            
            <Button
              onClick={() => popularLote(351, 400)}
              disabled={loading}
              size="sm"
            >
              351-400
            </Button>
            
            <Button
              onClick={() => popularLote(401, 450)}
              disabled={loading}
              size="sm"
            >
              401-450
            </Button>
            
            <Button
              onClick={() => popularLote(451, 500)}
              disabled={loading}
              size="sm"
            >
              451-500
            </Button>
            
            <Button
              onClick={() => popularLote(501, 550)}
              disabled={loading}
              size="sm"
            >
              501-550
            </Button>
            
            <Button
              onClick={() => popularLote(551, 600)}
              disabled={loading}
              size="sm"
            >
              551-600
            </Button>
            
            <Button
              onClick={() => popularLote(601, 650)}
              disabled={loading}
              size="sm"
            >
              601-650
            </Button>
            
            <Button
              onClick={() => popularLote(651, 660)}
              disabled={loading}
              size="sm"
            >
              651-660
            </Button>
          </div>
        </Card>

        {/* Avisos */}
        <Card className="p-6 bg-muted/50">
          <h3 className="font-bold mb-2">⚠️ Avisos Importantes:</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Cada lote leva ~2 minutos para processar (50 súmulas × 2 segundos)</li>
            <li>• As súmulas são buscadas automaticamente via web scraping</li>
            <li>• Fonte: tesesesumulas.com.br (dados oficiais do STJ)</li>
            <li>• Os dados são salvos permanentemente no banco</li>
            <li>• Faça um lote por vez e aguarde a conclusão</li>
            <li>• Use "Verificar Progresso" para acompanhar</li>
          </ul>
        </Card>

        {/* Resultados */}
        {resultados.length > 0 && (
          <Card className="p-6">
            <h3 className="font-bold mb-3">📊 Resultados do Processamento</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {resultados.map((resultado, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 p-3 rounded border ${
                    resultado.sucesso 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : 'bg-red-500/10 border-red-500/20'
                  }`}
                >
                  {resultado.sucesso ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Súmula {resultado.numero}</p>
                    {resultado.erro && (
                      <p className="text-xs text-red-500">{resultado.erro}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Info */}
        <Card className="p-6 bg-accent/10">
          <h3 className="font-bold mb-2">💡 Como funciona (Web Scraping Automático):</h3>
          <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
            <li>Acessa tesesesumulas.com.br para cada súmula individualmente</li>
            <li>Extrai automaticamente: número, texto completo e data de publicação</li>
            <li>Valida os dados extraídos antes de inserir</li>
            <li>Salva no banco de dados do Supabase</li>
            <li>Aguarda 2 segundos entre cada requisição (para não sobrecarregar o site)</li>
            <li>Retorna o resultado detalhado para acompanhamento</li>
          </ol>
          <div className="mt-4 p-3 bg-background rounded border">
            <p className="text-xs font-medium">🕐 Tempo estimado por lote:</p>
            <p className="text-xs text-muted-foreground">50 súmulas × 2 segundos = ~2 minutos por lote</p>
            <p className="text-xs text-muted-foreground mt-1">Total para 560 súmulas: ~22 minutos</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PopularSumulasSTJ;
