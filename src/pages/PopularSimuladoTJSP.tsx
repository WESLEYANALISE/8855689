import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const PopularSimuladoTJSP = () => {
  const [loading, setLoading] = useState(false);
  const [inicio, setInicio] = useState(1);
  const [fim, setFim] = useState(100);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState<any>(null);
  const { toast } = useToast();

  const popularQuestoes = async () => {
    setLoading(true);
    setProgresso(0);
    setResultado(null);

    try {
      const lotes = Math.ceil((fim - inicio + 1) / 10);
      let totalInseridas = 0;
      let totalErros = 0;

      for (let i = 0; i < lotes; i++) {
        const inicioLote = inicio + (i * 10);
        const fimLote = Math.min(inicioLote + 9, fim);

        console.log(`Processando lote ${i + 1}/${lotes}: questões ${inicioLote}-${fimLote}`);

        const { data, error } = await supabase.functions.invoke('popular-simulado-tjsp', {
          body: { inicio: inicioLote, fim: fimLote }
        });

        if (error) {
          throw error;
        }

        if (data) {
          totalInseridas += data.inseridas || 0;
          totalErros += data.erros || 0;
        }

        setProgresso(((i + 1) / lotes) * 100);
      }

      setResultado({
        inseridas: totalInseridas,
        erros: totalErros,
        total: fim - inicio + 1
      });

      toast({
        title: "✅ Questões populadas com sucesso!",
        description: `${totalInseridas} questões inseridas, ${totalErros} erros`,
      });

    } catch (error: any) {
      console.error("Erro ao popular questões:", error);
      toast({
        title: "❌ Erro ao popular questões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Popular Simulado TJSP</h1>
          <p className="text-muted-foreground">
            Inserir questões da prova TJSP 2024 no banco de dados
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Configuração do Lote
            </CardTitle>
            <CardDescription>
              Defina o intervalo de questões a serem inseridas (1-100)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inicio">Questão Inicial</Label>
                <Input
                  id="inicio"
                  type="number"
                  min={1}
                  max={100}
                  value={inicio}
                  onChange={(e) => setInicio(parseInt(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fim">Questão Final</Label>
                <Input
                  id="fim"
                  type="number"
                  min={1}
                  max={100}
                  value={fim}
                  onChange={(e) => setFim(parseInt(e.target.value))}
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              onClick={popularQuestoes}
              disabled={loading || inicio > fim}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Populando questões...
                </>
              ) : (
                "Iniciar População"
              )}
            </Button>

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{Math.round(progresso)}%</span>
                </div>
                <Progress value={progresso} />
              </div>
            )}
          </CardContent>
        </Card>

        {resultado && (
          <Card className="border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Resultado da População
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-green-600">{resultado.inseridas}</p>
                  <p className="text-sm text-muted-foreground">Inseridas</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-600">{resultado.erros}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{resultado.total}</p>
                  <p className="text-sm text-muted-foreground">Total Processadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• Esta ferramenta insere questões da prova TJSP 2024 no banco de dados</p>
            <p>• As questões são processadas em lotes de 10 para evitar sobrecarga</p>
            <p>• Questões duplicadas são automaticamente ignoradas</p>
            <p>• Total de questões disponíveis: 100</p>
            <p>• Áreas: Português, Matemática, Atualidades, Direito, Informática, Conhecimentos Específicos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PopularSimuladoTJSP;