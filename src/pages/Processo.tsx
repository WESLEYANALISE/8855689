import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ProcessoCard from "@/components/ProcessoCard";

interface Processo {
  numeroProcesso: string;
  tribunal: string;
  orgaoJulgador: string;
  dataAjuizamento: string;
  classeProcessual: string;
  assunto: string;
  situacao: string;
  partes: Array<{
    nome: string;
    tipo: string;
  }>;
  tipoParticipacao?: string;
}

const Processo = () => {
  const [tipoBusca, setTipoBusca] = useState<"nome" | "cpf" | "numero">("nome");
  const [valorBusca, setValorBusca] = useState("");
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatarCPF = (cpf: string) => {
    const numeros = cpf.replace(/\D/g, "");
    return numeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    if (tipoBusca === "cpf") {
      setValorBusca(formatarCPF(valor));
    } else {
      setValorBusca(valor);
    }
  };

  const validarCPF = (cpf: string): boolean => {
    const numeros = cpf.replace(/\D/g, "");
    return numeros.length === 11;
  };

  const buscarProcessos = async () => {
    if (!valorBusca.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite um valor para buscar",
        variant: "destructive",
      });
      return;
    }

    if (tipoBusca === "cpf" && !validarCPF(valorBusca)) {
      toast({
        title: "CPF inválido",
        description: "Digite um CPF válido com 11 dígitos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Iniciando busca de processos:', { tipo: tipoBusca, valor: valorBusca });
      
      // Para CPF, enviar apenas dígitos. Para nome e número, enviar como está
      const valorEnvio = tipoBusca === "cpf" 
        ? valorBusca.replace(/\D/g, "") 
        : valorBusca.trim();
      
      const { data, error } = await supabase.functions.invoke("buscar-processos-pessoa", {
        body: JSON.stringify({
          tipo: tipoBusca,
          valor: valorEnvio,
        }),
      });

      console.log('Resposta da função:', { data, error });

      if (error) {
        console.error('Erro da função:', error);
        throw error;
      }

      if (data?.processos && data.processos.length > 0) {
        setProcessos(data.processos);
        toast({
          title: "Busca realizada",
          description: `${data.processos.length} processo(s) encontrado(s)`,
        });
      } else {
        setProcessos([]);
        toast({
          title: "Nenhum processo encontrado",
          description: "Tente buscar por número de processo para resultados mais precisos",
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar processos:", error);
      toast({
        title: "Erro na busca",
        description: error.message || "Não foi possível realizar a busca",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-4 max-w-6xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Consulta de Processos</h1>
        <p className="text-sm text-muted-foreground">
          Busque processos judiciais por nome, CPF ou número
        </p>
      </div>

      <Card className="mb-6 bg-card border-border">
        <CardHeader>
          <CardTitle>Buscar Processo</CardTitle>
          <CardDescription>
            Utilize a API pública DataJud do CNJ para consultar processos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tipoBusca} onValueChange={(v) => setTipoBusca(v as any)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="nome">Nome</TabsTrigger>
              <TabsTrigger value="cpf">CPF</TabsTrigger>
              <TabsTrigger value="numero">Nº Processo</TabsTrigger>
            </TabsList>

            <TabsContent value="nome" className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Pessoa</Label>
                <Input
                  id="nome"
                  placeholder="Digite o nome completo"
                  value={valorBusca}
                  onChange={(e) => setValorBusca(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarProcessos()}
                />
              </div>
            </TabsContent>

            <TabsContent value="cpf" className="space-y-4">
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={valorBusca}
                  onChange={handleCPFChange}
                  maxLength={14}
                  onKeyDown={(e) => e.key === "Enter" && buscarProcessos()}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Atenção: CPFs podem estar protegidos por privacidade
                </p>
              </div>
            </TabsContent>

            <TabsContent value="numero" className="space-y-4">
              <div>
                <Label htmlFor="numero">Número do Processo</Label>
                <Input
                  id="numero"
                  placeholder="0000000-00.0000.0.00.0000"
                  value={valorBusca}
                  onChange={(e) => setValorBusca(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarProcessos()}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Busca mais precisa e confiável
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={buscarProcessos}
            disabled={loading}
            className="w-full mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar Processos
              </>
            )}
          </Button>

          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Importante:</strong> Esta consulta utiliza dados públicos do CNJ.
              Processos sigilosos não aparecem. A busca por número de processo é mais precisa.
            </p>
          </div>
        </CardContent>
      </Card>

      {processos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {processos.length} processo(s) encontrado(s)
            </h2>
          </div>
          {processos.map((processo, index) => (
            <ProcessoCard key={index} processo={processo} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Processo;
