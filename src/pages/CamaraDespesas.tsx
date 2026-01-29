import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { DespesaCard } from "@/components/DespesaCard";

const CamaraDespesas = () => {
  const [idDeputado, setIdDeputado] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [mes, setMes] = useState("");
  const [loading, setLoading] = useState(false);
  const [despesas, setDespesas] = useState<any[]>([]);
  const { toast } = useToast();

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const meses = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const handleBuscar = async () => {
    if (!idDeputado) {
      toast({
        title: "Preencha o ID do deputado",
        description: "Informe o ID do deputado para buscar despesas",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "deputado-despesas",
        { body: { idDeputado, ano: parseInt(ano), mes: mes ? parseInt(mes) : undefined } }
      );

      if (error) throw error;
      setDespesas(data.despesas || []);
      
      if (data.despesas?.length === 0) {
        toast({
          title: "Nenhuma despesa encontrada",
          description: "Tente outro período",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Despesas</h1>
        <p className="text-sm text-muted-foreground">Transparência nos gastos parlamentares</p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle>Buscar Despesas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idDeputado">ID do Deputado</Label>
            <Input
              id="idDeputado"
              placeholder="Ex: 220639"
              value={idDeputado}
              onChange={(e) => setIdDeputado(e.target.value)}
              type="number"
            />
            <p className="text-xs text-muted-foreground">
              Dica: Busque primeiro o deputado na aba "Deputados" para obter o ID
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <select
                id="ano"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {anos.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mes">Mês (Opcional)</Label>
              <select
                id="mes"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {meses.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleBuscar} className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Buscar Despesas
          </Button>
        </CardContent>
      </Card>

      {loading && <ContentGenerationLoader message="Buscando despesas..." />}

      {despesas.length > 0 && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{despesas.length} despesa(s) encontrada(s)</p>
          {despesas.map((despesa, idx) => (
            <DespesaCard key={idx} despesa={despesa} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CamaraDespesas;