import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";

const EleicoesSituacao = () => {
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const { toast } = useToast();

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const handleConsultar = async () => {
    if (!cpf || !dataNascimento) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o CPF e a data de nascimento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "consultar-situacao-eleitoral",
        {
          body: { cpf: cpf.replace(/\D/g, ""), dataNascimento },
        }
      );

      if (error) throw error;

      setResultado(data);
      toast({
        title: "Consulta realizada",
        description: "Dados encontrados com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao consultar:", error);
      toast({
        title: "Erro na consulta",
        description: error.message || "Não foi possível consultar a situação eleitoral",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Situação Eleitoral</h1>
        <p className="text-sm text-muted-foreground">
          Consulte a regularidade do seu título de eleitor
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Consultar Título de Eleitor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data de Nascimento</Label>
            <Input
              id="data"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleConsultar} 
            className="w-full"
            disabled={loading}
          >
            <Search className="w-4 h-4 mr-2" />
            Consultar
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <div className="mt-6">
          <ContentGenerationLoader message="Consultando dados no TSE..." />
        </div>
      )}

      {resultado && !loading && (
        <Card className="mt-6 bg-card border-border">
          <CardHeader>
            <CardTitle>Resultado da Consulta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
              {resultado.situacao === "regular" ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : resultado.situacao === "suspenso" ? (
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
              <div>
                <p className="font-bold text-lg capitalize">{resultado.situacao}</p>
                <p className="text-sm text-muted-foreground">
                  {resultado.mensagem}
                </p>
              </div>
            </div>

            {resultado.titulo && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Título</p>
                    <p className="font-semibold">{resultado.titulo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Zona</p>
                    <p className="font-semibold">{resultado.zona}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seção</p>
                    <p className="font-semibold">{resultado.secao}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Município</p>
                    <p className="font-semibold">{resultado.municipio}</p>
                  </div>
                </div>
                {resultado.localVotacao && (
                  <div>
                    <p className="text-sm text-muted-foreground">Local de Votação</p>
                    <p className="font-semibold">{resultado.localVotacao}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EleicoesSituacao;
