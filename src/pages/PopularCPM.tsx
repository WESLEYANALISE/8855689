import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import { toast } from "sonner";

export default function PopularCPM() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const executarPopulacao = async () => {
    setLoading(true);
    setResultado(null);

    try {
      toast.info("Iniciando extração do CPM...", {
        description: "Isso pode levar alguns minutos. Por favor, aguarde."
      });

      const { data, error } = await supabase.functions.invoke('popular-cpm');

      if (error) throw error;

      setResultado(data);
      
      if (data.sucesso) {
        toast.success("CPM populado com sucesso!", {
          description: `${data.inseridos} itens inseridos de ${data.total} totais.`
        });
      } else {
        toast.error("Erro ao popular CPM", {
          description: data.erro || "Erro desconhecido"
        });
      }
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error("Erro ao executar função", {
        description: error.message
      });
      setResultado({ erro: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-6 w-6" />
            Popular CPM - Código Penal Militar
          </CardTitle>
          <CardDescription>
            Processa o documento completo do CPM (410 artigos) e insere na base de dados
            em lotes de 100 registros com estrutura hierárquica completa (PARTE, LIVRO, TÍTULO, CAPÍTULO, SEÇÃO).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">O que será feito:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Limpar tabela atual do CPM</li>
              <li>Extrair cabeçalho da lei</li>
              <li>Extrair estrutura completa (PARTE GERAL, PARTE ESPECIAL, LIVROS, TÍTULOS, CAPÍTULOS, SEÇÕES)</li>
              <li>Extrair todos os 410 artigos com prefixo "Art. X -"</li>
              <li>Inserir todos os dados formatados corretamente</li>
            </ul>
          </div>

          <Button 
            onClick={executarPopulacao} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Extraindo artigos do CPM...
              </>
            ) : (
              'Executar População do CPM'
            )}
          </Button>

          {resultado && (
            <Card className={resultado.sucesso ? "border-green-500" : "border-red-500"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {resultado.sucesso ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Sucesso
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      Erro
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resultado.sucesso ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Total de itens:</span> {resultado.total}
                    </p>
                    {resultado.artigos !== undefined && (
                      <p className="text-sm">
                        <span className="font-medium">Artigos extraídos:</span> {resultado.artigos} / 410
                      </p>
                    )}
                    {resultado.estruturas !== undefined && (
                      <p className="text-sm">
                        <span className="font-medium">Estruturas extraídas:</span> {resultado.estruturas}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-medium">Inseridos com sucesso:</span> {resultado.inseridos}
                    </p>
                   {resultado.erros > 0 && (
                     <p className="text-sm text-red-500">
                       <span className="font-medium">Erros:</span> {resultado.erros}
                     </p>
                   )}
                   {resultado.lotes && (
                     <p className="text-sm">
                       <span className="font-medium">Lotes processados:</span> {resultado.lotes}
                     </p>
                   )}
                   {resultado.detalhes && resultado.detalhes.length > 0 && (
                     <details className="mt-4">
                       <summary className="text-sm font-medium cursor-pointer">
                         Ver detalhes dos {resultado.lotes} lotes
                       </summary>
                       <div className="mt-2 space-y-1 max-h-64 overflow-auto">
                         {resultado.detalhes.map((item: any, idx: number) => (
                           <div key={idx} className={`text-xs p-2 rounded ${item.status === 'sucesso' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                             <span className="font-medium">Lote {item.lote}/{resultado.lotes}:</span> {item.itens} itens (#{item.inicio} - #{item.fim}) - 
                             <span className={item.status === 'sucesso' ? 'text-green-600' : 'text-red-600'}> {item.status}</span>
                             {item.mensagem && <div className="text-red-600 mt-1">{item.mensagem}</div>}
                           </div>
                         ))}
                       </div>
                     </details>
                   )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-red-500">
                      {resultado.erro || 'Erro desconhecido'}
                    </p>
                    {resultado.detalhes && (
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
                        {resultado.detalhes}
                      </pre>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
