import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { VotacaoCard } from "@/components/VotacaoCard";
import { useNavigate } from "react-router-dom";

const CamaraVotacoes = () => {
  const hoje = new Date().toISOString().split('T')[0];
  const quinzeDiasAtras = new Date(Date.now() - 15*24*60*60*1000).toISOString().split('T')[0];
  
  const [dataInicio, setDataInicio] = useState(quinzeDiasAtras);
  const [dataFim, setDataFim] = useState(hoje);
  const [loading, setLoading] = useState(false);
  const [votacoes, setVotacoes] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    handleBuscar();
  }, []);

  const handleBuscar = async () => {
    if (!dataInicio || !dataFim) {
      toast({
        title: "Preencha as datas",
        description: "Informe o período de busca",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "buscar-votacoes",
        { body: { dataInicio, dataFim } }
      );

      if (error) throw error;
      setVotacoes(data.votacoes || []);
      
      if (data.votacoes?.length === 0) {
        toast({
          title: "Nenhuma votação encontrada",
          description: "Tente outro período",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message || "Tente reduzir o período (máximo 15 dias recomendado)",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Votações</h1>
        <p className="text-sm text-muted-foreground">Resultados de votações do plenário</p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle>Buscar Votações</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Recomendado: períodos de até 15 dias para melhor desempenho
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleBuscar} className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Buscar Votações
          </Button>
        </CardContent>
      </Card>

      {loading && <ContentGenerationLoader message="Buscando votações..." />}

      {votacoes.length > 0 && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{votacoes.length} votação(ões) encontrada(s)</p>
          {votacoes.map((votacao) => (
            <VotacaoCard 
              key={votacao.id} 
              votacao={votacao}
              onClick={() => navigate(`/camara-deputados/votacao/${votacao.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CamaraVotacoes;
