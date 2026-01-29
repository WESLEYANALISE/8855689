import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { ProposicaoCard } from "@/components/ProposicaoCard";

const CamaraProposicoesLista = () => {
  const { tipo } = useParams();
  const navigate = useNavigate();
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [mes, setMes] = useState((new Date().getMonth() + 1).toString());
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposicoes, setProposicoes] = useState<any[]>([]);
  const { toast } = useToast();

  const anos = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
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

  useEffect(() => {
    if (tipo) {
      handleBuscar();
    }
  }, [tipo]);

  const handleBuscar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "buscar-proposicoes",
        {
          body: { 
            siglaTipo: tipo,
            ano: ano || undefined,
            mes: mes || undefined,
            keywords: keywords || undefined
          },
        }
      );

      if (error) throw error;
      setProposicoes(data.proposicoes || []);
      
      if (data.proposicoes?.length === 0) {
        toast({
          title: "Nenhuma proposição encontrada",
          description: "Tente ajustar os filtros",
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
    <div className="px-3 sm:px-4 md:px-6 py-4 max-w-6xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2">{tipo}</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Busque e explore proposições do tipo {tipo}
        </p>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Filtros de Busca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Mês</Label>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {meses.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Ano</Label>
              <select
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {anos.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="keywords" className="text-sm">Palavras-chave</Label>
            <Input
              id="keywords"
              placeholder="Ex: educação, saúde, segurança..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="text-sm"
            />
          </div>

          <Button onClick={handleBuscar} className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Buscando...' : 'Buscar Proposições'}
          </Button>
        </CardContent>
      </Card>

      {loading && <ContentGenerationLoader message="Buscando proposições..." />}

      {proposicoes.length > 0 && !loading && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <p className="text-sm md:text-base font-medium text-foreground">
              {proposicoes.length} {proposicoes.length === 1 ? 'proposição encontrada' : 'proposições encontradas'}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Ordenado por data de apresentação
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {proposicoes.map((proposicao) => (
              <ProposicaoCard 
                key={proposicao.id} 
                proposicao={proposicao}
                onClick={() => navigate(`/camara-deputados/proposicao/${proposicao.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {proposicoes.length === 0 && !loading && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 sm:p-12 text-center">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Nenhuma proposição encontrada</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Tente ajustar os filtros de busca para encontrar outras proposições
            </p>
            <Button onClick={handleBuscar} variant="outline" className="mt-2">
              <Search className="w-4 h-4 mr-2" />
              Buscar Novamente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CamaraProposicoesLista;