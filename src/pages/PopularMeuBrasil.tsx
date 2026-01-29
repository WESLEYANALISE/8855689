import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const PopularMeuBrasil = () => {
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);

  const popularJuristas = async (limite?: number) => {
    try {
      setLoading(true);
      setResultados([]);
      
      toast.info(`Iniciando população de juristas${limite ? ` (${limite} primeiros)` : ''}...`);

      const { data, error } = await supabase.functions.invoke('popular-meu-brasil', {
        body: { 
          tipo: 'juristas',
          limite: limite || null
        }
      });

      if (error) throw error;

      setResultados(data.resultados || []);
      
      const sucesso = data.resultados?.filter((r: any) => r.sucesso).length || 0;
      const total = data.resultados?.length || 0;
      
      toast.success(`Concluído! ${sucesso}/${total} juristas processados com sucesso`);
    } catch (error) {
      console.error('Erro ao popular:', error);
      toast.error('Erro ao popular dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">
          🚀 Popular Meu Brasil
        </h1>
        <p className="text-sm text-muted-foreground">
          Ferramenta para popular o banco de dados com conteúdo enriquecido
        </p>
      </div>

      <div className="space-y-4">
        {/* Card de Juristas */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-3">👨‍⚖️ Juristas Brasileiros</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Popular banco com juristas históricos, ministros do STF, advogados e professores.
            Cada jurista será buscado na Wikipedia, enriquecido com IA Gemini e salvo com foto.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => popularJuristas(3)}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Testar (3 primeiros)
            </Button>
            
            <Button
              onClick={() => popularJuristas(10)}
              disabled={loading}
              variant="secondary"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Popular 10
            </Button>
            
            <Button
              onClick={() => popularJuristas()}
              disabled={loading}
              variant="outline"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Popular Todos (~17)
            </Button>
          </div>
        </Card>

        {/* Avisos */}
        <Card className="p-6 bg-muted/50">
          <h3 className="font-bold mb-2">⚠️ Avisos Importantes:</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Cada jurista leva ~5 segundos para processar (Wikipedia + Gemini)</li>
            <li>• O processamento de todos pode levar ~2-3 minutos</li>
            <li>• Use "Testar" primeiro para verificar se está funcionando</li>
            <li>• Os dados são salvos permanentemente no banco</li>
            <li>• Consome créditos da Lovable AI (Gemini)</li>
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
                    <p className="font-medium">{resultado.jurista}</p>
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
          <h3 className="font-bold mb-2">💡 Como funciona:</h3>
          <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
            <li>Busca o artigo do jurista na Wikipedia em português</li>
            <li>Extrai foto principal e múltiplas imagens do artigo</li>
            <li>Envia o conteúdo para IA Gemini enriquecer (adaptar para estudantes)</li>
            <li>Gemini gera: resumo, contribuições, obras, curiosidades, etc</li>
            <li>Salva tudo no banco: original + melhorado + fotos</li>
            <li>Resultado: enciclopédia jurídica inteligente e didática! 🎓</li>
          </ol>
        </Card>
      </div>
    </div>
  );
};

export default PopularMeuBrasil;
