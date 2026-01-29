import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Database } from "lucide-react";

interface ResultadoPopulacao {
  codigo: string;
  sucesso: boolean;
  total?: number;
  mensagem?: string;
  erro?: string;
}

export default function PopularCodigos() {
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<ResultadoPopulacao[]>([]);

  const popularCPPM = async () => {
    const toastId = toast.loading("Populando CPPM...");
    try {
      const { data, error } = await supabase.functions.invoke("popular-cppm");
      
      if (error) throw error;
      
      toast.success("CPPM populado com sucesso!", { id: toastId });
      return {
        codigo: "CPPM",
        sucesso: true,
        total: data?.total || 0,
        mensagem: data?.message
      };
    } catch (error: any) {
      toast.error(`Erro ao popular CPPM: ${error.message}`, { id: toastId });
      return {
        codigo: "CPPM",
        sucesso: false,
        erro: error.message
      };
    }
  };

  const popularEstatutoDesarmamento = async () => {
    const toastId = toast.loading("Populando Estatuto do Desarmamento...");
    try {
      const { data, error } = await supabase.functions.invoke("popular-estatuto-desarmamento");
      
      if (error) throw error;
      
      toast.success("Estatuto do Desarmamento populado!", { id: toastId });
      return {
        codigo: "Estatuto do Desarmamento",
        sucesso: true,
        total: data?.total || 0,
        mensagem: data?.message
      };
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`, { id: toastId });
      return {
        codigo: "Estatuto do Desarmamento",
        sucesso: false,
        erro: error.message
      };
    }
  };

  const popularEnunciadosCNJ = async () => {
    const toastId = toast.loading("Populando Enunciados CNJ...");
    try {
      const { data, error } = await supabase.functions.invoke("popular-enunciados-cnj");
      
      if (error) throw error;
      
      toast.info(data?.message || "CNJ preparado", { id: toastId });
      return {
        codigo: "Enunciados CNJ",
        sucesso: true,
        mensagem: data?.message
      };
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`, { id: toastId });
      return {
        codigo: "Enunciados CNJ",
        sucesso: false,
        erro: error.message
      };
    }
  };

  const popularEnunciadosCNMP = async () => {
    const toastId = toast.loading("Populando Enunciados CNMP...");
    try {
      const { data, error } = await supabase.functions.invoke("popular-enunciados-cnmp");
      
      if (error) throw error;
      
      toast.info(data?.message || "CNMP preparado", { id: toastId });
      return {
        codigo: "Enunciados CNMP",
        sucesso: true,
        mensagem: data?.message
      };
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`, { id: toastId });
      return {
        codigo: "Enunciados CNMP",
        sucesso: false,
        erro: error.message
      };
    }
  };

  const popularLeiLicitacoes = async () => {
    const toastId = toast.loading("Populando Lei de Licitações...");
    try {
      const { data, error } = await supabase.functions.invoke("popular-lei-licitacoes");
      
      if (error) throw error;
      
      toast.success("Lei de Licitações populada!", { id: toastId });
      return {
        codigo: "Lei de Licitações (14.133/2021)",
        sucesso: true,
        total: data?.total || 0,
        mensagem: data?.message
      };
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`, { id: toastId });
      return {
        codigo: "Lei de Licitações (14.133/2021)",
        sucesso: false,
        erro: error.message
      };
    }
  };

  const executarPopulacaoCompleta = async () => {
    setLoading(true);
    setResultados([]);
    
    toast.info("Iniciando população completa dos códigos...");

    const resultadosTemp: ResultadoPopulacao[] = [];

    // Executar em sequência para evitar sobrecarga
    const res1 = await popularCPPM();
    resultadosTemp.push(res1);
    setResultados([...resultadosTemp]);

    const res2 = await popularEstatutoDesarmamento();
    resultadosTemp.push(res2);
    setResultados([...resultadosTemp]);

    const res3 = await popularEnunciadosCNJ();
    resultadosTemp.push(res3);
    setResultados([...resultadosTemp]);

    const res4 = await popularEnunciadosCNMP();
    resultadosTemp.push(res4);
    setResultados([...resultadosTemp]);

    const res5 = await popularLeiLicitacoes();
    resultadosTemp.push(res5);
    setResultados([...resultadosTemp]);

    setLoading(false);
    
    const sucessos = resultadosTemp.filter(r => r.sucesso).length;
    toast.success(`População completa! ${sucessos}/${resultadosTemp.length} códigos processados com sucesso.`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          Popular Códigos
        </h1>
        <p className="text-muted-foreground">
          Ferramenta para popular códigos e enunciados vazios no banco de dados
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>População Completa</CardTitle>
          <CardDescription>
            Executa a população de todos os códigos identificados como vazios ou incompletos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={executarPopulacaoCompleta}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Executar População Completa
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={popularCPPM}
              disabled={loading}
              variant="outline"
            >
              Popular CPPM
            </Button>
            <Button
              onClick={popularEstatutoDesarmamento}
              disabled={loading}
              variant="outline"
            >
              Popular Estatuto Desarmamento
            </Button>
            <Button
              onClick={popularEnunciadosCNJ}
              disabled={loading}
              variant="outline"
            >
              Popular Enunciados CNJ
            </Button>
            <Button
              onClick={popularEnunciadosCNMP}
              disabled={loading}
              variant="outline"
            >
              Popular Enunciados CNMP
            </Button>
            <Button
              onClick={popularLeiLicitacoes}
              disabled={loading}
              variant="outline"
            >
              Popular Lei de Licitações
            </Button>
          </div>
        </CardContent>
      </Card>

      {resultados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da População</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resultados.map((resultado, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  {resultado.sucesso ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{resultado.codigo}</p>
                    {resultado.total !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Total de registros: {resultado.total}
                      </p>
                    )}
                    {resultado.mensagem && (
                      <p className="text-sm text-muted-foreground">
                        {resultado.mensagem}
                      </p>
                    )}
                    {resultado.erro && (
                      <p className="text-sm text-red-500">
                        Erro: {resultado.erro}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>CPPM:</strong> ~728 artigos do Código de Processo Penal Militar</p>
          <p><strong>Estatuto do Desarmamento:</strong> ~38 artigos da Lei 10.826/2003</p>
          <p><strong>Enunciados CNJ:</strong> Enunciados administrativos do Conselho Nacional de Justiça</p>
          <p><strong>Enunciados CNMP:</strong> Enunciados do Conselho Nacional do Ministério Público</p>
          <p><strong>Lei de Licitações:</strong> ~194 artigos da Lei 14.133/2021</p>
          <p className="pt-2 border-t">
            <strong>Nota:</strong> A população é feita a partir das fontes oficiais do Planalto.gov.br
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
