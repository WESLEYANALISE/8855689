import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";

const EleicoesPrestacaoContas = () => {
  const [busca, setBusca] = useState("");
  const [ano, setAno] = useState("2022");
  const [tipo, setTipo] = useState("candidato");
  const [loading, setLoading] = useState(false);
  const [contas, setContas] = useState<any>(null);
  const { toast } = useToast();

  const anos = ["2024", "2022", "2020", "2018", "2016"];

  const handleConsultar = async () => {
    if (!busca) {
      toast({
        title: "Preencha o nome",
        description: "Digite o nome do candidato ou partido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "buscar-prestacao-contas",
        {
          body: { busca, ano, tipo },
        }
      );

      if (error) throw error;

      setContas(data);
      toast({
        title: "Dados encontrados",
        description: "Prestação de contas carregada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao buscar:", error);
      toast({
        title: "Erro na consulta",
        description: error.message || "Não foi possível buscar prestação de contas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Prestação de Contas</h1>
        <p className="text-sm text-muted-foreground">
          Consulte contas de campanha, doações e despesas
        </p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle>Consultar Prestação de Contas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="busca">Nome do Candidato ou Partido</Label>
            <Input
              id="busca"
              placeholder="Digite o nome"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ano da Eleição</Label>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candidato">Candidato</SelectItem>
                  <SelectItem value="partido">Partido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleConsultar} className="w-full" disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Consultar
          </Button>
        </CardContent>
      </Card>

      {loading && <ContentGenerationLoader message="Consultando prestação de contas..." />}

      {contas && !loading && (
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-muted-foreground">Receitas</span>
                  </div>
                  <p className="text-2xl font-bold text-green-500">
                    {formatarValor(contas.receitas)}
                  </p>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-muted-foreground">Despesas</span>
                  </div>
                  <p className="text-2xl font-bold text-red-500">
                    {formatarValor(contas.despesas)}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Saldo</p>
                <p className={`text-xl font-bold ${
                  (contas.receitas - contas.despesas) >= 0 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}>
                  {formatarValor(contas.receitas - contas.despesas)}
                </p>
              </div>
            </CardContent>
          </Card>

          {contas.principaisDoadores && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Principais Doadores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contas.principaisDoadores.map((doador: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-semibold">{doador.nome}</p>
                        <p className="text-xs text-muted-foreground">{doador.tipo}</p>
                      </div>
                      <p className="font-bold text-accent">{formatarValor(doador.valor)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {contas.principaisDespesas && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Principais Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contas.principaisDespesas.map((despesa: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-semibold">{despesa.categoria}</p>
                        <p className="text-xs text-muted-foreground">{despesa.fornecedor}</p>
                      </div>
                      <p className="font-bold text-red-500">{formatarValor(despesa.valor)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default EleicoesPrestacaoContas;
