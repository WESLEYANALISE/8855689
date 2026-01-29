import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, FileUp, ChevronRight, ChevronLeft, FileText, Upload, Download, Copy, RotateCcw } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PeticaoBottomNav, 
  peticaoSteps,
  PeticaoPartesDados,
  DadosParteCompleto,
  dadosParteVazio,
  PeticaoJurisBusca,
  JurisprudenciaItem,
  PeticaoEditorWYSIWYG,
} from "@/components/peticao";

const AdvogadoCriar = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Passo 1: Descrição do caso
  const [metodoDescricao, setMetodoDescricao] = useState<"digitar" | "importar" | null>(null);
  const [descricaoCaso, setDescricaoCaso] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Passo 2: Área do direito
  const [areaDireito, setAreaDireito] = useState("");
  
  // Passo 3: Tipo de petição
  const [tipoPeticao, setTipoPeticao] = useState("");
  
  // Passo 4: Dados das partes
  const [dadosAutor, setDadosAutor] = useState<DadosParteCompleto>(dadosParteVazio);
  const [dadosReu, setDadosReu] = useState<DadosParteCompleto>(dadosParteVazio);
  const [qualificacaoAutorInserida, setQualificacaoAutorInserida] = useState("");
  const [qualificacaoReuInserida, setQualificacaoReuInserida] = useState("");
  
  // Passo 5: Jurisprudências
  const [jurisprudenciasSelecionadas, setJurisprudenciasSelecionadas] = useState<JurisprudenciaItem[]>([]);
  const [citacoesInseridas, setCitacoesInseridas] = useState<string[]>([]);
  
  // Passo 6: Preview/Editor
  const [peticaoConteudo, setPeticaoConteudo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dados do advogado (carregados do perfil)
  const [dadosAdvogado, setDadosAdvogado] = useState({
    nome: "",
    oabNumero: "",
    oabEstado: "",
    endereco: "",
    telefone: "",
    email: "",
    assinaturaUrl: "",
  });

  // Carregar dados do advogado do perfil
  useEffect(() => {
    const carregarDadosAdvogado = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nome, oab_numero, oab_estado, endereco_escritorio, telefone_escritorio, email_escritorio, assinatura_url')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setDadosAdvogado({
            nome: data.nome || "",
            oabNumero: data.oab_numero || "",
            oabEstado: data.oab_estado || "",
            endereco: data.endereco_escritorio || "",
            telefone: data.telefone_escritorio || "",
            email: data.email_escritorio || "",
            assinaturaUrl: data.assinatura_url || "",
          });
        }
      } catch (error) {
        console.log("Perfil não encontrado ou sem dados profissionais");
      }
    };
    
    carregarDadosAdvogado();
  }, [user]);

  // Controle dos passos
  const steps = peticaoSteps.map((step) => ({
    ...step,
    concluido: step.id < currentStep,
  }));

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
      setMetodoDescricao("importar");
      toast({
        title: "Arquivo carregado",
        description: file.name,
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const gerarPeticaoIA = async () => {
    setIsGenerating(true);
    
    try {
      // Montar contexto com todos os dados coletados
      const contexto = {
        descricaoCaso,
        areaDireito,
        tipoPeticao,
        qualificacaoAutor: qualificacaoAutorInserida,
        qualificacaoReu: qualificacaoReuInserida,
        jurisprudencias: jurisprudenciasSelecionadas.map(j => ({
          tribunal: j.tribunal,
          numero: j.numeroProcesso,
          ementa: j.ementa.substring(0, 500),
        })),
        citacoes: citacoesInseridas,
      };

      // Gerar todas as 3 etapas
      const resultados = [];
      
      for (let etapa = 1; etapa <= 3; etapa++) {
        const contextoAnterior = resultados.join('\n\n');
        
        const { data, error } = await supabase.functions.invoke("gerar-peticao", {
          body: {
            descricaoCaso,
            areaDireito,
            tipoPeticao,
            pdfTexto: uploadedFile ? "Documento PDF anexado" : "",
            etapa,
            contextoAnterior,
            dadosAutor: qualificacaoAutorInserida,
            dadosReu: qualificacaoReuInserida,
            jurisprudencias: jurisprudenciasSelecionadas,
          },
        });

        if (error) throw error;
        resultados.push(data.conteudo);
      }

      // Converter para HTML básico para o editor
      const conteudoCompleto = resultados.join('\n\n');
      const conteudoHTML = conteudoCompleto
        .split('\n')
        .map(p => p.trim())
        .filter(p => p)
        .map(p => `<p>${p}</p>`)
        .join('');
      
      setPeticaoConteudo(conteudoHTML);
      setCurrentStep(6);
      
      toast({
        title: "Petição gerada com sucesso!",
        description: "Edite o conteúdo conforme necessário",
      });
    } catch (error) {
      console.error("Erro ao gerar petição:", error);
      toast({
        title: "Erro ao gerar petição",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProximoPasso = () => {
    // Validações por passo
    if (currentStep === 1) {
      if (!metodoDescricao) {
        toast({ title: "Escolha um método", description: "Selecione como deseja descrever o caso", variant: "destructive" });
        return;
      }
      if (metodoDescricao === "digitar" && !descricaoCaso.trim()) {
        toast({ title: "Campo obrigatório", description: "Digite a descrição do caso", variant: "destructive" });
        return;
      }
      if (metodoDescricao === "importar" && !uploadedFile) {
        toast({ title: "Arquivo não importado", description: "Faça upload do PDF", variant: "destructive" });
        return;
      }
    }

    if (currentStep === 2 && !areaDireito) {
      toast({ title: "Campo obrigatório", description: "Selecione a área do direito", variant: "destructive" });
      return;
    }

    if (currentStep === 3 && !tipoPeticao) {
      toast({ title: "Campo obrigatório", description: "Selecione o tipo de petição", variant: "destructive" });
      return;
    }

    // Se está no passo 5, gerar a petição
    if (currentStep === 5) {
      gerarPeticaoIA();
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handleExportarPDF = async () => {
    try {
      toast({
        title: "Gerando PDF...",
        description: "Isso pode levar alguns segundos",
      });

      // Converter HTML do editor para texto
      const textoPlano = peticaoConteudo
        .replace(/<[^>]*>/g, '\n')
        .replace(/\n+/g, '\n')
        .trim();

      const { data, error } = await supabase.functions.invoke("exportar-peticao-pdf", {
        body: {
          titulo: `${tipoPeticao} - ${areaDireito}`,
          conteudo: {
            etapa1: textoPlano.split('\n\n')[0] || textoPlano,
            etapa2: textoPlano.split('\n\n')[1] || "",
            etapa3: textoPlano.split('\n\n')[2] || "",
          },
          jurisprudencias: jurisprudenciasSelecionadas,
          dadosPessoais: {
            nomeAdvogado: dadosAdvogado.nome,
            oabNumero: dadosAdvogado.oabNumero,
            oabEstado: dadosAdvogado.oabEstado,
            assinaturaNome: dadosAdvogado.nome,
            assinaturaUrl: dadosAdvogado.assinaturaUrl,
          },
        },
      });

      if (error) throw error;

      if (data?.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
        toast({
          title: "PDF exportado com sucesso!",
          description: "Link válido por 24 horas",
        });
      }
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const handleCopiarTexto = () => {
    const textoPlano = peticaoConteudo
      .replace(/<[^>]*>/g, '\n')
      .replace(/\n+/g, '\n')
      .trim();
    navigator.clipboard.writeText(textoPlano);
    toast({ title: "Texto copiado!" });
  };

  const resetarFormulario = () => {
    setCurrentStep(1);
    setMetodoDescricao(null);
    setDescricaoCaso("");
    setUploadedFile(null);
    setAreaDireito("");
    setTipoPeticao("");
    setDadosAutor(dadosParteVazio);
    setDadosReu(dadosParteVazio);
    setQualificacaoAutorInserida("");
    setQualificacaoReuInserida("");
    setJurisprudenciasSelecionadas([]);
    setCitacoesInseridas([]);
    setPeticaoConteudo("");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Como você deseja descrever o caso?</CardTitle>
              <CardDescription>Escolha a forma mais conveniente para você</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    metodoDescricao === "digitar" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setMetodoDescricao("digitar")}
                >
                  <CardContent className="p-6 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">Digitar Descrição</h3>
                    <p className="text-sm text-muted-foreground">
                      Descreva o caso diretamente no campo de texto
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    metodoDescricao === "importar" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setMetodoDescricao("importar")}
                >
                  <CardContent className="p-6 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">Importar PDF</h3>
                    <p className="text-sm text-muted-foreground">
                      Faça upload de um documento com a descrição
                    </p>
                  </CardContent>
                </Card>
              </div>

              {metodoDescricao === "digitar" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição Detalhada do Caso *</label>
                  <Textarea
                    placeholder="Descreva os fatos relevantes, partes envolvidas, histórico do caso e objetivo da petição..."
                    value={descricaoCaso}
                    onChange={(e) => setDescricaoCaso(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Quanto mais detalhes, melhor será a petição gerada
                  </p>
                </div>
              )}

              {metodoDescricao === "importar" && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  {uploadedFile ? (
                    <div>
                      <p className="font-medium mb-1">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium mb-1">Arraste um PDF ou clique para selecionar</p>
                      <p className="text-sm text-muted-foreground">Máximo 5MB</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Selecione a Área do Direito</CardTitle>
              <CardDescription>Escolha a área jurídica relacionada ao caso</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={areaDireito} onValueChange={setAreaDireito}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a área..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="civil">Direito Civil</SelectItem>
                  <SelectItem value="penal">Direito Penal</SelectItem>
                  <SelectItem value="trabalhista">Direito Trabalhista</SelectItem>
                  <SelectItem value="tributario">Direito Tributário</SelectItem>
                  <SelectItem value="administrativo">Direito Administrativo</SelectItem>
                  <SelectItem value="consumidor">Direito do Consumidor</SelectItem>
                  <SelectItem value="familia">Direito de Família</SelectItem>
                  <SelectItem value="empresarial">Direito Empresarial</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Selecione o Tipo de Petição</CardTitle>
              <CardDescription>Escolha qual documento você precisa gerar</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={tipoPeticao} onValueChange={setTipoPeticao}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petição Inicial">Petição Inicial</SelectItem>
                  <SelectItem value="Contestação">Contestação</SelectItem>
                  <SelectItem value="Recurso">Recurso</SelectItem>
                  <SelectItem value="Agravo">Agravo</SelectItem>
                  <SelectItem value="Apelação">Apelação</SelectItem>
                  <SelectItem value="Embargos de Declaração">Embargos de Declaração</SelectItem>
                  <SelectItem value="Mandado de Segurança">Mandado de Segurança</SelectItem>
                  <SelectItem value="Habeas Corpus">Habeas Corpus</SelectItem>
                  <SelectItem value="Reclamação Trabalhista">Reclamação Trabalhista</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <PeticaoPartesDados
            dadosAutor={dadosAutor}
            dadosReu={dadosReu}
            onDadosAutorChange={setDadosAutor}
            onDadosReuChange={setDadosReu}
            onInserirQualificacao={(tipo, texto) => {
              if (tipo === 'autor') {
                setQualificacaoAutorInserida(texto);
              } else {
                setQualificacaoReuInserida(texto);
              }
            }}
          />
        );

      case 5:
        return (
          <PeticaoJurisBusca
            areaDireito={areaDireito}
            tipoPeticao={tipoPeticao}
            descricaoCaso={descricaoCaso}
            jurisprudenciasSelecionadas={jurisprudenciasSelecionadas}
            onJurisprudenciasChange={setJurisprudenciasSelecionadas}
            onInserirCitacao={(citacao) => {
              setCitacoesInseridas([...citacoesInseridas, citacao]);
            }}
          />
        );

      case 6:
        return (
          <>
            {isGenerating ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-medium mb-2">Gerando sua petição...</p>
                    <p className="text-sm text-muted-foreground">Isso pode levar alguns instantes</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PeticaoEditorWYSIWYG
                conteudo={peticaoConteudo}
                onConteudoChange={setPeticaoConteudo}
                dadosAutor={dadosAutor}
                dadosReu={dadosReu}
                dadosAdvogado={dadosAdvogado}
                jurisprudencias={jurisprudenciasSelecionadas}
              />
            )}
          </>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Petição Concluída!</CardTitle>
              <CardDescription>Sua petição está pronta. Exporte em PDF ou copie o texto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Tipo:</span>
                  <span className="text-sm">{tipoPeticao}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Área:</span>
                  <span className="text-sm capitalize">{areaDireito}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Jurisprudências:</span>
                  <span className="text-sm">{jurisprudenciasSelecionadas.length} selecionadas</span>
                </div>
                {dadosAutor.nome && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Autor:</span>
                    <span className="text-sm">{dadosAutor.nome}</span>
                  </div>
                )}
                {(dadosReu.nome || dadosReu.razaoSocial) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Réu:</span>
                    <span className="text-sm">{dadosReu.nome || dadosReu.razaoSocial}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" size="lg" onClick={handleCopiarTexto} className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Texto
                </Button>
                <Button size="lg" onClick={handleExportarPDF} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>

              <Button variant="ghost" className="w-full" onClick={resetarFormulario}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Criar Nova Petição
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Criar Petição com IA</h1>
              <p className="text-sm text-muted-foreground">
                Passo {currentStep} de 7: {steps[currentStep - 1]?.nome}
              </p>
            </div>
            {currentStep > 1 && currentStep < 7 && (
              <Badge variant="outline">
                {Math.round(((currentStep - 1) / 6) * 100)}% concluído
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {renderStepContent()}

        {/* Botões de Navegação */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || isGenerating}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {currentStep < 7 && (
            <Button onClick={handleProximoPasso} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : currentStep === 5 ? (
                <>
                  Gerar Petição
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              ) : currentStep === 6 ? (
                <>
                  Finalizar
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Menu de Rodapé Fixo */}
      <PeticaoBottomNav
        currentStep={currentStep}
        steps={steps}
        onStepClick={setCurrentStep}
        disabled={isGenerating}
      />
    </div>
  );
};

export default AdvogadoCriar;
