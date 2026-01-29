import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, FileText, Download, Eye, Filter, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ModeloContrato {
  id: string;
  titulo: string;
  categoria: string;
  subcategoria: string;
  descricao: string;
  conteudo: string;
  downloads: number;
  atualizado: string;
}

const AdvogadoContratosModelos = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [busca, setBusca] = useState(searchParams.get("busca") || "");
  const [categoria, setCategoria] = useState(searchParams.get("categoria") || "todos");
  const [modeloSelecionado, setModeloSelecionado] = useState<ModeloContrato | null>(null);

  // Modelos de exemplo
  const modelos: ModeloContrato[] = [
    {
      id: "1",
      titulo: "Contrato de Locação Residencial",
      categoria: "imobiliario",
      subcategoria: "Locação",
      descricao: "Modelo completo de contrato de locação residencial conforme Lei do Inquilinato",
      conteudo: `CONTRATO DE LOCAÇÃO RESIDENCIAL

LOCADOR(A): [NOME COMPLETO], [nacionalidade], [estado civil], [profissão], inscrito(a) no CPF sob nº [CPF], portador(a) da Cédula de Identidade RG nº [RG], residente e domiciliado(a) em [ENDEREÇO COMPLETO].

LOCATÁRIO(A): [NOME COMPLETO], [nacionalidade], [estado civil], [profissão], inscrito(a) no CPF sob nº [CPF], portador(a) da Cédula de Identidade RG nº [RG], residente e domiciliado(a) em [ENDEREÇO COMPLETO].

As partes acima qualificadas têm, entre si, justo e acertado o presente CONTRATO DE LOCAÇÃO RESIDENCIAL, que se regerá pelas cláusulas e condições seguintes:

CLÁUSULA PRIMEIRA - DO OBJETO
O LOCADOR dá em locação ao LOCATÁRIO o imóvel situado em [ENDEREÇO DO IMÓVEL], destinado exclusivamente para fins residenciais.

CLÁUSULA SEGUNDA - DO PRAZO
O prazo da locação é de [PRAZO] meses, iniciando-se em [DATA INÍCIO] e terminando em [DATA FIM], independentemente de aviso, notificação ou interpelação judicial ou extrajudicial.

CLÁUSULA TERCEIRA - DO ALUGUEL
O aluguel mensal é de R$ [VALOR] ([VALOR POR EXTENSO]), que deverá ser pago até o dia [DIA] de cada mês.

CLÁUSULA QUARTA - DO REAJUSTE
O aluguel será reajustado anualmente pelo índice [IGP-M/IPCA], ou outro que venha a substituí-lo.

CLÁUSULA QUINTA - DAS OBRIGAÇÕES DO LOCADOR
I - Entregar o imóvel em estado de servir ao uso a que se destina;
II - Garantir o uso pacífico do imóvel;
III - Manter a forma e o destino do imóvel;
IV - Responder pelos vícios ou defeitos anteriores à locação.

CLÁUSULA SEXTA - DAS OBRIGAÇÕES DO LOCATÁRIO
I - Pagar pontualmente o aluguel e encargos;
II - Servir-se do imóvel para uso residencial;
III - Restituir o imóvel ao final da locação no estado em que recebeu;
IV - Comunicar ao LOCADOR qualquer dano ou defeito.

CLÁUSULA SÉTIMA - DA MULTA
Em caso de infração contratual, a parte infratora pagará multa equivalente a [NÚMERO] aluguéis vigentes.

CLÁUSULA OITAVA - DO FORO
Fica eleito o foro da Comarca de [COMARCA] para dirimir quaisquer dúvidas oriundas deste contrato.

[LOCAL], [DATA]

_________________________
LOCADOR

_________________________
LOCATÁRIO

_________________________
TESTEMUNHA 1

_________________________
TESTEMUNHA 2`,
      downloads: 15420,
      atualizado: "2024-01-15",
    },
    {
      id: "2",
      titulo: "Contrato de Prestação de Serviços",
      categoria: "empresarial",
      subcategoria: "Serviços",
      descricao: "Modelo genérico de contrato de prestação de serviços entre pessoas jurídicas ou físicas",
      conteudo: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATANTE: [RAZÃO SOCIAL/NOME], inscrita no CNPJ/CPF sob nº [NÚMERO], com sede em [ENDEREÇO].

CONTRATADA: [RAZÃO SOCIAL/NOME], inscrita no CNPJ/CPF sob nº [NÚMERO], com sede em [ENDEREÇO].

CLÁUSULA PRIMEIRA - DO OBJETO
A CONTRATADA se obriga a prestar os seguintes serviços: [DESCRIÇÃO DETALHADA DOS SERVIÇOS].

CLÁUSULA SEGUNDA - DO PRAZO
O presente contrato terá vigência de [PRAZO], iniciando em [DATA] e terminando em [DATA].

CLÁUSULA TERCEIRA - DO VALOR E PAGAMENTO
Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor de R$ [VALOR], da seguinte forma: [FORMA DE PAGAMENTO].

CLÁUSULA QUARTA - DAS OBRIGAÇÕES DA CONTRATADA
[LISTAR OBRIGAÇÕES]

CLÁUSULA QUINTA - DAS OBRIGAÇÕES DA CONTRATANTE
[LISTAR OBRIGAÇÕES]

CLÁUSULA SEXTA - DA RESCISÃO
O presente contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio de [PRAZO] dias.

CLÁUSULA SÉTIMA - DA CONFIDENCIALIDADE
As partes se comprometem a manter sigilo sobre informações confidenciais.

CLÁUSULA OITAVA - DO FORO
Fica eleito o foro de [COMARCA] para dirimir questões oriundas deste contrato.

[LOCAL], [DATA]

_________________________
CONTRATANTE

_________________________
CONTRATADA`,
      downloads: 12350,
      atualizado: "2024-02-20",
    },
    {
      id: "3",
      titulo: "Contrato de Honorários Advocatícios",
      categoria: "trabalho",
      subcategoria: "Honorários",
      descricao: "Modelo de contrato de honorários entre advogado e cliente",
      conteudo: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS

CONTRATANTE: [NOME], [qualificação completa]

CONTRATADO: [NOME DO ADVOGADO], inscrito na OAB/[UF] sob nº [NÚMERO]

CLÁUSULA PRIMEIRA - DO OBJETO
O CONTRATADO se compromete a prestar serviços advocatícios ao CONTRATANTE, consistentes em [DESCRIÇÃO DO SERVIÇO].

CLÁUSULA SEGUNDA - DOS HONORÁRIOS
Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO:
a) Honorários contratuais: R$ [VALOR] ou [PERCENTUAL]% sobre o proveito econômico;
b) Forma de pagamento: [ESPECIFICAR]

CLÁUSULA TERCEIRA - DAS DESPESAS
As despesas processuais e extrajudiciais correrão por conta do CONTRATANTE.

CLÁUSULA QUARTA - DA EXTINÇÃO
Este contrato se extingue com o término do serviço ou pela revogação do mandato.

[LOCAL], [DATA]

_________________________
CONTRATANTE

_________________________
CONTRATADO (Advogado)`,
      downloads: 8920,
      atualizado: "2024-03-10",
    },
    {
      id: "4",
      titulo: "Termo de Confidencialidade (NDA)",
      categoria: "empresarial",
      subcategoria: "Confidencialidade",
      descricao: "Non-Disclosure Agreement para proteção de informações sigilosas",
      conteudo: `TERMO DE CONFIDENCIALIDADE E SIGILO (NDA)

PARTE REVELADORA: [IDENTIFICAÇÃO]
PARTE RECEPTORA: [IDENTIFICAÇÃO]

CLÁUSULA PRIMEIRA - OBJETO
O presente termo tem por objetivo estabelecer as condições de confidencialidade das informações compartilhadas entre as partes.

CLÁUSULA SEGUNDA - INFORMAÇÕES CONFIDENCIAIS
São consideradas confidenciais todas as informações técnicas, comerciais, financeiras e estratégicas reveladas.

CLÁUSULA TERCEIRA - OBRIGAÇÕES
A PARTE RECEPTORA se compromete a:
a) Manter sigilo absoluto;
b) Utilizar as informações apenas para os fins acordados;
c) Limitar o acesso às informações;
d) Não copiar ou reproduzir sem autorização.

CLÁUSULA QUARTA - PRAZO
A obrigação de confidencialidade permanecerá por [PRAZO] anos após o término da relação.

CLÁUSULA QUINTA - PENALIDADES
O descumprimento sujeitará a parte infratora ao pagamento de multa de R$ [VALOR], sem prejuízo de indenização por perdas e danos.

[LOCAL], [DATA]

_________________________
PARTE REVELADORA

_________________________
PARTE RECEPTORA`,
      downloads: 7650,
      atualizado: "2024-01-28",
    },
    {
      id: "5",
      titulo: "Contrato de Compra e Venda de Veículo",
      categoria: "veiculos",
      subcategoria: "Compra e Venda",
      descricao: "Modelo para transação de compra e venda de automóveis",
      conteudo: `CONTRATO DE COMPRA E VENDA DE VEÍCULO

VENDEDOR: [QUALIFICAÇÃO]
COMPRADOR: [QUALIFICAÇÃO]

CLÁUSULA PRIMEIRA - DO OBJETO
O VENDEDOR vende ao COMPRADOR o veículo:
Marca/Modelo: [ESPECIFICAR]
Ano: [ANO]
Cor: [COR]
Placa: [PLACA]
Renavam: [NÚMERO]
Chassi: [NÚMERO]

CLÁUSULA SEGUNDA - DO PREÇO
O preço ajustado é de R$ [VALOR], a ser pago [FORMA DE PAGAMENTO].

CLÁUSULA TERCEIRA - DA TRANSFERÊNCIA
O VENDEDOR se compromete a fornecer todos os documentos necessários à transferência.

CLÁUSULA QUARTA - DAS DECLARAÇÕES
O VENDEDOR declara que o veículo está livre de ônus, multas e débitos.

CLÁUSULA QUINTA - DA ENTREGA
A entrega do veículo será feita em [DATA/LOCAL].

[LOCAL], [DATA]

_________________________
VENDEDOR

_________________________
COMPRADOR`,
      downloads: 6230,
      atualizado: "2024-02-05",
    },
    {
      id: "6",
      titulo: "Distrato de Contrato",
      categoria: "geral",
      subcategoria: "Distrato",
      descricao: "Modelo genérico de distrato para encerramento consensual de contratos",
      conteudo: `INSTRUMENTO PARTICULAR DE DISTRATO

PARTE A: [QUALIFICAÇÃO]
PARTE B: [QUALIFICAÇÃO]

As partes acima qualificadas, de comum acordo, resolvem DISTRATAR o contrato firmado em [DATA], nos seguintes termos:

CLÁUSULA PRIMEIRA - DO DISTRATO
As partes declaram rescindido o contrato original, dando-se mutuamente plena e irrevogável quitação.

CLÁUSULA SEGUNDA - DAS OBRIGAÇÕES PENDENTES
[ESPECIFICAR SE HÁ OBRIGAÇÕES PENDENTES E COMO SERÃO TRATADAS]

CLÁUSULA TERCEIRA - DA QUITAÇÃO
As partes declaram nada mais ter a reclamar uma da outra.

[LOCAL], [DATA]

_________________________
PARTE A

_________________________
PARTE B`,
      downloads: 5890,
      atualizado: "2024-03-01",
    },
  ];

  const categorias = [
    { value: "todos", label: "Todas as categorias" },
    { value: "imobiliario", label: "Imobiliário" },
    { value: "empresarial", label: "Empresarial" },
    { value: "trabalho", label: "Trabalho" },
    { value: "consumidor", label: "Consumidor" },
    { value: "familia", label: "Família" },
    { value: "veiculos", label: "Veículos" },
    { value: "geral", label: "Geral" },
  ];

  const modelosFiltrados = modelos.filter((m) => {
    const matchBusca = busca === "" || 
      m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      m.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoria === "todos" || m.categoria === categoria;
    return matchBusca && matchCategoria;
  });

  const copiarModelo = (conteudo: string) => {
    navigator.clipboard.writeText(conteudo);
    toast.success("Modelo copiado para a área de transferência!");
  };

  const baixarModelo = (modelo: ModeloContrato) => {
    const blob = new Blob([modelo.conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${modelo.titulo.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Modelo baixado com sucesso!");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/advogado/contratos")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Modelos de Contratos</h1>
            <p className="text-sm text-muted-foreground">{modelosFiltrados.length} modelos disponíveis</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar modelo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de modelos */}
        <div className="space-y-3">
          {modelosFiltrados.map((modelo) => (
            <Card key={modelo.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {modelo.titulo}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {modelo.descricao}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">
                        {modelo.subcategoria}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {modelo.downloads.toLocaleString()} downloads
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModeloSelecionado(modelo)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => baixarModelo(modelo)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {modelosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum modelo encontrado</p>
          </div>
        )}
      </div>

      {/* Modal de visualização */}
      <Dialog open={!!modeloSelecionado} onOpenChange={() => setModeloSelecionado(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {modeloSelecionado?.titulo}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[50vh] mt-4">
            <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-lg">
              {modeloSelecionado?.conteudo}
            </pre>
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => modeloSelecionado && copiarModelo(modeloSelecionado.conteudo)}>
              Copiar
            </Button>
            <Button onClick={() => modeloSelecionado && baixarModelo(modeloSelecionado)}>
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvogadoContratosModelos;
