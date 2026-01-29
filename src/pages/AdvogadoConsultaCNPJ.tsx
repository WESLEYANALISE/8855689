import { useState } from "react";
import { ArrowLeft, Search, Loader2, Building2, MapPin, Calendar, Users, BadgeCheck, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmpresaData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  data_inicio_atividade: string;
  cnae_fiscal_principal: {
    codigo: string;
    descricao: string;
  };
  natureza_juridica: string;
  porte: string;
  capital_social: number;
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  telefone: string;
  email: string;
  socios: Array<{
    nome: string;
    qualificacao: string;
  }>;
}

const AdvogadoConsultaCNPJ = () => {
  const navigate = useNavigate();
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const formatarCNPJ = (valor: string) => {
    const numeros = valor.replace(/\D/g, "");
    if (numeros.length <= 14) {
      return numeros
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return valor;
  };

  const buscarCNPJ = async () => {
    const cnpjLimpo = cnpj.replace(/\D/g, "");
    
    if (cnpjLimpo.length !== 14) {
      toast.error("CNPJ inválido. Digite os 14 dígitos.");
      return;
    }

    setLoading(true);
    setErro(null);
    setEmpresa(null);

    try {
      const { data, error } = await supabase.functions.invoke("consultar-cnpj", {
        body: { cnpj: cnpjLimpo }
      });

      if (error) throw error;

      if (data?.error) {
        setErro(data.error);
      } else if (data) {
        setEmpresa(data);
      }
    } catch (error) {
      console.error("Erro ao consultar CNPJ:", error);
      setErro("Erro ao consultar CNPJ. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(valor);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-4 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/advogado")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Consultar CNPJ</h1>
            <p className="text-sm text-muted-foreground">Dados completos de empresas brasileiras</p>
          </div>
        </div>

        {/* Busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Digite o CNPJ (apenas números ou formatado)"
                value={cnpj}
                onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && buscarCNPJ()}
                className="flex-1 text-lg"
                maxLength={18}
              />
              <Button onClick={buscarCNPJ} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Consultar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultado */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : erro ? (
          <Card className="border-destructive">
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
              <p className="text-destructive font-medium">{erro}</p>
            </CardContent>
          </Card>
        ) : empresa ? (
          <div className="space-y-4">
            {/* Dados Principais */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{empresa.razao_social}</CardTitle>
                    {empresa.nome_fantasia && (
                      <p className="text-muted-foreground">{empresa.nome_fantasia}</p>
                    )}
                  </div>
                  <Badge 
                    variant={empresa.situacao_cadastral === "ATIVA" ? "default" : "destructive"}
                    className="gap-1"
                  >
                    <BadgeCheck className="w-3 h-3" />
                    {empresa.situacao_cadastral}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">CNPJ:</span>
                    <p className="font-mono font-medium">{empresa.cnpj}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Natureza Jurídica:</span>
                    <p>{empresa.natureza_juridica}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Porte:</span>
                    <p>{empresa.porte}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Capital Social:</span>
                    <p className="font-medium">{formatarMoeda(empresa.capital_social)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Início da Atividade:</span>
                    <p>{empresa.data_inicio_atividade}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Situação desde:</span>
                    <p>{empresa.data_situacao_cadastral}</p>
                  </div>
                </div>

                {empresa.cnae_fiscal_principal && (
                  <div className="pt-3 border-t">
                    <span className="text-muted-foreground text-sm">Atividade Principal (CNAE):</span>
                    <p className="mt-1">
                      <Badge variant="outline" className="mr-2">{empresa.cnae_fiscal_principal.codigo}</Badge>
                      {empresa.cnae_fiscal_principal.descricao}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Endereço */}
            {empresa.endereco && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Endereço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    {empresa.endereco.logradouro}, {empresa.endereco.numero}
                    {empresa.endereco.complemento && ` - ${empresa.endereco.complemento}`}
                  </p>
                  <p>{empresa.endereco.bairro}</p>
                  <p>
                    {empresa.endereco.municipio}/{empresa.endereco.uf} - CEP: {empresa.endereco.cep}
                  </p>
                  {empresa.telefone && <p className="mt-2">Tel: {empresa.telefone}</p>}
                  {empresa.email && <p>Email: {empresa.email}</p>}
                </CardContent>
              </Card>
            )}

            {/* Sócios */}
            {empresa.socios && empresa.socios.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Quadro Societário ({empresa.socios.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {empresa.socios.map((socio, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="font-medium">{socio.nome}</span>
                        <Badge variant="secondary">{socio.qualificacao}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Digite um CNPJ para consultar</p>
              <p className="text-sm text-muted-foreground mt-1">
                Dados da Receita Federal atualizados
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvogadoConsultaCNPJ;
