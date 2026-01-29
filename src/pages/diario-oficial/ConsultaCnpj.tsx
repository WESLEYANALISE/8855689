import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Search, Users, MapPin, Calendar, Loader2, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  consultarCnpj, 
  buscarSocios, 
  buscarDiarios,
  CompanyInfo, 
  Partner,
  Gazette,
  formatCnpj,
  formatDate
} from "@/lib/api/queridoDiarioApi";

const ConsultaCnpj = () => {
  const navigate = useNavigate();
  
  const [cnpjInput, setCnpjInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [mentions, setMentions] = useState<Gazette[]>([]);
  const [totalMentions, setTotalMentions] = useState(0);

  const formatCnpjInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const handleSearch = async () => {
    const cleaned = cnpjInput.replace(/\D/g, '');
    if (cleaned.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }

    setIsLoading(true);
    setCompany(null);
    setPartners([]);
    setMentions([]);

    try {
      // Buscar dados da empresa e sócios em paralelo
      const [companyData, partnersData] = await Promise.all([
        consultarCnpj(cleaned),
        buscarSocios(cleaned)
      ]);

      if (companyData) {
        setCompany(companyData);
        setPartners(partnersData || []);
        
        // Buscar menções nos diários
        const razaoSocial = companyData.razao_social;
        if (razaoSocial) {
          const mentionsData = await buscarDiarios({
            querystring: razaoSocial,
            size: 20,
            sort_by: 'descending_date'
          });
          setMentions(mentionsData.gazettes || []);
          setTotalMentions(mentionsData.total_gazettes || 0);
        }
        
        toast.success("Empresa encontrada!");
      } else {
        toast.info("Empresa não encontrada na base de dados");
      }
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro ao consultar CNPJ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/diario-oficial")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Consulta CNPJ
            </h1>
            <p className="text-sm text-muted-foreground">
              Dados cadastrais e menções em diários
            </p>
          </div>
        </div>

        {/* Busca */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Input
                placeholder="Digite o CNPJ..."
                value={cnpjInput}
                onChange={(e) => setCnpjInput(formatCnpjInput(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
                maxLength={18}
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {company && (
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="socios">
                Sócios ({partners.length})
              </TabsTrigger>
              <TabsTrigger value="mencoes">
                Menções ({totalMentions})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{company.razao_social}</CardTitle>
                  {company.nome_fantasia && (
                    <p className="text-sm text-muted-foreground">{company.nome_fantasia}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">CNPJ</p>
                      <p className="font-mono">{formatCnpj(company.cnpj)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Situação</p>
                      <p className={company.situacao_cadastral === 'ATIVA' ? 'text-green-500' : 'text-red-500'}>
                        {company.situacao_cadastral || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {company.cnae_principal && (
                    <div>
                      <p className="text-xs text-muted-foreground">CNAE Principal</p>
                      <p className="text-sm">
                        {company.cnae_principal.codigo} - {company.cnae_principal.descricao}
                      </p>
                    </div>
                  )}

                  {company.endereco && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Endereço
                      </p>
                      <p className="text-sm">
                        {company.endereco.logradouro}, {company.endereco.numero}
                        {company.endereco.complemento && ` - ${company.endereco.complemento}`}
                        <br />
                        {company.endereco.bairro} - {company.endereco.municipio}/{company.endereco.uf}
                        <br />
                        CEP: {company.endereco.cep}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {company.capital_social && (
                      <div>
                        <p className="text-xs text-muted-foreground">Capital Social</p>
                        <p>R$ {company.capital_social.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                    {company.porte && (
                      <div>
                        <p className="text-xs text-muted-foreground">Porte</p>
                        <p>{company.porte}</p>
                      </div>
                    )}
                  </div>

                  {company.data_inicio_atividade && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Início das Atividades
                      </p>
                      <p>{formatDate(company.data_inicio_atividade)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="socios" className="mt-4">
              <ScrollArea className="h-[400px]">
                {partners.length > 0 ? (
                  <div className="space-y-3">
                    {partners.map((partner, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <p className="font-medium">{partner.nome}</p>
                              {partner.qualificacao && (
                                <p className="text-sm text-muted-foreground">
                                  {partner.qualificacao}
                                </p>
                              )}
                              {partner.data_entrada && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Entrada: {formatDate(partner.data_entrada)}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum sócio encontrado
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="mencoes" className="mt-4">
              <ScrollArea className="h-[400px]">
                {mentions.length > 0 ? (
                  <div className="space-y-3">
                    {mentions.map((gazette, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="font-medium">{gazette.territory_name}</span>
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                  {gazette.state_code}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(gazette.date)}
                              </p>
                              {gazette.excerpts?.[0] && (
                                <p className="text-sm mt-2 line-clamp-2" dangerouslySetInnerHTML={{ 
                                  __html: gazette.excerpts[0].replace(/<\/?em>/g, (m) => m === '<em>' ? '<mark class="bg-yellow-200 dark:bg-yellow-800">' : '</mark>')
                                }} />
                              )}
                            </div>
                            {gazette.file_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(gazette.file_url, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma menção encontrada nos diários
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!isLoading && !company && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Digite um CNPJ para consultar dados da empresa
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultaCnpj;
