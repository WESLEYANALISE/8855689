import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, Loader2, Copy, Upload, RefreshCw, Database, Search, ChevronRight, ChevronDown, Check, X, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Categorias de tabelas de leis
const CATEGORIAS_TABELAS = {
  "📜 Constituição": [
    "CF - Constituição Federal"
  ],
  "📕 Códigos": [
    "CP - Código Penal",
    "CC - Código Civil",
    "CPP – Código de Processo Penal",
    "CPC – Código de Processo Civil",
    "CLT – Consolidação das Leis do Trabalho",
    "CTN – Código Tributário Nacional",
    "CTB – Código de Trânsito Brasileiro",
    "CDC – Código de Defesa do Consumidor",
    "CE – Código Eleitoral",
    "CPM – Código Penal Militar",
    "CPPM – Código de Processo Penal Militar",
    "CA - Código de Águas",
    "CBA Código Brasileiro de Aeronáutica",
    "CBT Código Brasileiro de Telecomunicações",
    "CC - Código de Caça",
    "CCOM – Código Comercial",
    "CDM – Código de Minas",
    "CDUS - Código de Defesa do Usuário"
  ],
  "📗 Estatutos": [
    "ECA – Estatuto da Criança e do Adolescente",
    "Estatuto da Cidade",
    "Estatuto da Igualdade Racial",
    "Estatuto da Juventude",
    "Estatuto da Pessoa com Deficiência",
    "Estatuto da Terra",
    "Estatuto de Defesa do Torcedor",
    "Estatuto do Desarmamento",
    "Estatuto do Estrangeiro",
    "Estatuto do Idoso",
    "Estatuto do Índio",
    "Estatuto do Ministério Público da União",
    "Estatuto do Refugiado",
    "Estatuto dos Advogados (OAB)",
    "Estatuto dos Funcionários Públicos Civis da União",
    "Estatuto dos Militares",
    "Estatuto dos Museus"
  ],
  "📘 Leis Especiais": [
    "LAI – Lei de Acesso à Informação",
    "LDB – Lei de Diretrizes e Bases da Educação",
    "Lei Anticorrupção",
    "Lei Brasileira de Inclusão",
    "Lei Carolina Dieckmann",
    "Lei da Ação Civil Pública",
    "Lei da Ação Popular",
    "Lei da Alienação Parental",
    "Lei da Anistia",
    "Lei da Ficha Limpa",
    "Lei da Guarda Compartilhada",
    "Lei da Liberdade Econômica",
    "Lei da Reforma Tributária",
    "Lei das Contravenções Penais",
    "Lei das Duplicatas",
    "Lei das Eleições",
    "Lei das Organizações Criminosas",
    "Lei das Sociedades Anônimas",
    "Lei de Abuso de Autoridade",
    "Lei de Biossegurança",
    "Lei de Drogas",
    "Lei de Execução Penal",
    "Lei de Falências",
    "Lei de Improbidade Administrativa",
    "Lei de Interceptação Telefônica",
    "Lei de Lavagem de Dinheiro",
    "Lei de Licitações",
    "Lei de Proteção à Testemunha",
    "Lei de Tortura",
    "Lei do Feminicídio",
    "Lei do Inquilinato",
    "Lei do Mandado de Segurança",
    "Lei do Meio Ambiente",
    "Lei dos Crimes Hediondos",
    "Lei dos Juizados Especiais",
    "Lei Geral de Proteção de Dados",
    "Lei Maria da Penha",
    "Lei Orgânica da Magistratura Nacional",
    "LINDB – Lei de Introdução às Normas do Direito Brasileiro",
    "Marco Civil da Internet",
    "Marco Legal das Startups",
    "RISTF – Regimento Interno do STF"
  ],
  "📙 Leis Complementares": [
    "LC 95 – Lei Complementar de Técnica Legislativa",
    "LC 123 – Estatuto da Microempresa",
    "LC 64 – Lei das Inelegibilidades"
  ],
  "⚖️ Súmulas": [
    "Súmulas do STF",
    "Súmulas do STJ",
    "Súmulas do TST",
    "Súmulas do TSE",
    "Súmulas do TNU",
    "Súmulas Vinculantes",
    "Súmulas do CARF"
  ],
  "📋 Enunciados": [
    "Enunciados das Jornadas de Direito Civil",
    "Enunciados do FONAJE"
  ]
};

interface ValidationResult {
  isValid: boolean;
  score: number;
  checks: {
    name: string;
    status: 'success' | 'warning' | 'error';
    message: string;
    details?: string[];
  }[];
  artigos: {
    numero: string;
    texto: string;
  }[];
  totalArtigos: number;
  duplicatas: string[];
  lacunas: string[];
}

const AtualizacaoLeiFinal = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [textoOriginal, setTextoOriginal] = useState("");
  const [textoFormatado, setTextoFormatado] = useState("");
  const [isFormatando, setIsFormatando] = useState(false);
  const [isValidando, setIsValidando] = useState(false);
  const [isPopulando, setIsPopulando] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [tabelaSelecionada, setTabelaSelecionada] = useState<string | null>(null);
  const [searchTabela, setSearchTabela] = useState("");
  const [categoriasAbertas, setCategoriasAbertas] = useState<string[]>(["📕 Códigos"]);
  const [progressoFormatacao, setProgressoFormatacao] = useState(0);
  const [artigosExtraidos, setArtigosExtraidos] = useState<{ numero: string; texto: string }[]>([]);

  const contarLinhas = useCallback((texto: string) => {
    return texto.split('\n').length;
  }, []);

  // Simular progresso durante formatação
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isFormatando && progressoFormatacao < 90) {
      interval = setInterval(() => {
        setProgressoFormatacao(prev => {
          const increment = Math.random() * 8 + 2;
          return Math.min(prev + increment, 90);
        });
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFormatando, progressoFormatacao]);

  const handleFormatar = async () => {
    if (!textoOriginal.trim()) {
      toast.error("Cole o texto da lei primeiro");
      return;
    }

    setIsFormatando(true);
    setProgressoFormatacao(5);
    try {
      const { data, error } = await supabase.functions.invoke('formatar-lei-final', {
        body: { texto: textoOriginal }
      });

      if (error) throw error;

      setProgressoFormatacao(100);
      setTextoFormatado(data.textoFormatado);
      setArtigosExtraidos(data.artigos || []);
      setStep(2);
      toast.success(`Texto formatado! ${data.totalArtigos || 0} artigos extraídos`);
    } catch (error) {
      console.error("Erro ao formatar:", error);
      toast.error("Erro ao formatar o texto");
    } finally {
      setIsFormatando(false);
      setProgressoFormatacao(0);
    }
  };

  const handleValidar = async () => {
    if (!textoFormatado.trim()) {
      toast.error("Formate o texto primeiro");
      return;
    }

    setIsValidando(true);
    try {
      const { data, error } = await supabase.functions.invoke('validar-lei-completa', {
        body: { texto: textoFormatado }
      });

      if (error) throw error;

      setValidationResult(data);
      setStep(3);
      
      if (data.isValid) {
        toast.success(`Validação aprovada! Score: ${data.score}%`);
      } else {
        toast.warning(`Validação com problemas. Score: ${data.score}%`);
      }
    } catch (error) {
      console.error("Erro ao validar:", error);
      toast.error("Erro ao validar o texto");
    } finally {
      setIsValidando(false);
    }
  };

  const handlePopular = async () => {
    if (!tabelaSelecionada) {
      toast.error("Selecione uma tabela");
      return;
    }

    if (!validationResult?.artigos?.length) {
      toast.error("Nenhum artigo para inserir");
      return;
    }

    setIsPopulando(true);
    try {
      const { data, error } = await supabase.functions.invoke('popular-tabela-lei', {
        body: { 
          tabela: tabelaSelecionada,
          artigos: validationResult.artigos,
          textoCompleto: textoFormatado
        }
      });

      if (error) throw error;

      toast.success(`${data.inseridos} artigos inseridos na tabela ${tabelaSelecionada}!`);
      
      // Reset
      setStep(1);
      setTextoOriginal("");
      setTextoFormatado("");
      setValidationResult(null);
      setTabelaSelecionada(null);
    } catch (error) {
      console.error("Erro ao popular:", error);
      toast.error("Erro ao inserir na tabela");
    } finally {
      setIsPopulando(false);
    }
  };

  const toggleCategoria = (categoria: string) => {
    setCategoriasAbertas(prev => 
      prev.includes(categoria) 
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    );
  };

  const tabelasFiltradas = Object.entries(CATEGORIAS_TABELAS).reduce((acc, [categoria, tabelas]) => {
    const filtered = tabelas.filter(t => 
      t.toLowerCase().includes(searchTabela.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[categoria] = filtered;
    }
    return acc;
  }, {} as Record<string, string[]>);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ferramentas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Atualização de Lei Final</h1>
            <p className="text-xs text-muted-foreground">Formate, valide e popule tabelas de leis</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-between px-4 pb-4">
          {[
            { num: 1, label: "Texto" },
            { num: 2, label: "Formatação" },
            { num: 3, label: "Validação" },
            { num: 4, label: "Popular" }
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  step === s.num 
                    ? 'bg-primary text-primary-foreground' 
                    : step > s.num 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={`ml-2 text-xs ${step === s.num ? 'font-medium' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
              {i < 3 && <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Step 1: Cole o texto */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cole o Texto da Lei
              </CardTitle>
              <CardDescription>
                Cole o texto bruto da lei para formatação. Todo o conteúdo será preservado, exceto texto entre parênteses 
                (a menos que contenha "revogado", "revogada" ou "vetado").
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Cole o texto completo da lei aqui..."
                value={textoOriginal}
                onChange={(e) => setTextoOriginal(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>📊 {textoOriginal.length.toLocaleString()} caracteres | {contarLinhas(textoOriginal)} linhas</span>
                <Button onClick={() => setTextoOriginal("")} variant="ghost" size="sm" disabled={!textoOriginal}>
                  Limpar
                </Button>
              </div>
              
              {/* Barra de progresso durante formatação */}
              {isFormatando && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Formatando com IA...</span>
                    <span className="font-medium text-primary">{Math.round(progressoFormatacao)}%</span>
                  </div>
                  <Progress value={progressoFormatacao} className="h-2" />
                </div>
              )}
              
              <Button 
                onClick={handleFormatar} 
                className="w-full" 
                size="lg"
                disabled={!textoOriginal.trim() || isFormatando}
              >
                {isFormatando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Formatando... {Math.round(progressoFormatacao)}%
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Formatar com IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* Tabela de Artigos Extraídos */}
            {artigosExtraidos.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Table2 className="h-4 w-4 text-primary" />
                      Artigos Extraídos
                    </CardTitle>
                    <Badge className="bg-primary/20 text-primary">
                      {artigosExtraidos.length} artigos
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[350px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Número</TableHead>
                          <TableHead>Texto do Artigo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {artigosExtraidos.map((artigo, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-bold text-primary align-top">
                              {artigo.numero}
                            </TableCell>
                            <TableCell className="text-sm">
                              {artigo.texto.substring(0, 300)}{artigo.texto.length > 300 ? '...' : ''}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Texto Original</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                      {textoOriginal}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-green-600">Texto Formatado</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(textoFormatado)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {textoFormatado}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={handleValidar} 
                className="flex-1"
                disabled={isValidando}
              >
                {isValidando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Validar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Validação */}
        {step === 3 && validationResult && (
          <div className="space-y-4">
            {/* Score Card */}
            <Card className={validationResult.isValid ? "border-green-500" : "border-yellow-500"}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-yellow-500" />
                    )}
                    Resultado da Validação
                  </CardTitle>
                  <Badge 
                    variant={validationResult.isValid ? "default" : "secondary"}
                    className={validationResult.isValid ? "bg-green-500" : "bg-yellow-500"}
                  >
                    Score: {validationResult.score}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Checks */}
                <div className="space-y-2">
                  {validationResult.checks.map((check, i) => (
                    <div 
                      key={i} 
                      className={`flex items-start gap-2 p-2 rounded-lg ${
                        check.status === 'success' ? 'bg-green-500/10' :
                        check.status === 'warning' ? 'bg-yellow-500/10' :
                        'bg-red-500/10'
                      }`}
                    >
                      {check.status === 'success' ? (
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : check.status === 'warning' ? (
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{check.name}</p>
                        <p className="text-xs text-muted-foreground">{check.message}</p>
                        {check.details && check.details.length > 0 && (
                          <ul className="mt-1 text-xs text-muted-foreground list-disc list-inside">
                            {check.details.slice(0, 5).map((d, j) => (
                              <li key={j}>{d}</li>
                            ))}
                            {check.details.length > 5 && (
                              <li>... e mais {check.details.length - 5} itens</li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{validationResult.totalArtigos}</p>
                    <p className="text-xs text-muted-foreground">Artigos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-500">{validationResult.lacunas.length}</p>
                    <p className="text-xs text-muted-foreground">Lacunas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{validationResult.duplicatas.length}</p>
                    <p className="text-xs text-muted-foreground">Duplicatas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={() => setStep(4)} 
                className="flex-1"
                disabled={!validationResult.isValid}
              >
                <Database className="h-4 w-4 mr-2" />
                Popular Tabela
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Popular tabela */}
        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Selecione a Tabela
                </CardTitle>
                <CardDescription>
                  Escolha em qual tabela os {validationResult?.totalArtigos || 0} artigos serão inseridos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tabela..."
                    value={searchTabela}
                    onChange={(e) => setSearchTabela(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Categories */}
                <ScrollArea className="h-[350px]">
                  <div className="space-y-2">
                    {Object.entries(tabelasFiltradas).map(([categoria, tabelas]) => (
                      <Collapsible 
                        key={categoria}
                        open={categoriasAbertas.includes(categoria) || searchTabela.length > 0}
                      >
                        <CollapsibleTrigger 
                          onClick={() => toggleCategoria(categoria)}
                          className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-lg"
                        >
                          <span className="font-medium">{categoria}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{tabelas.length}</Badge>
                            {categoriasAbertas.includes(categoria) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-4 space-y-1 mt-1">
                          {tabelas.map((tabela) => (
                            <button
                              key={tabela}
                              onClick={() => setTabelaSelecionada(tabela)}
                              className={`w-full text-left p-2 text-sm rounded-lg transition-colors ${
                                tabelaSelecionada === tabela 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {tabela}
                            </button>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>

                {tabelaSelecionada && (
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium">Tabela selecionada:</p>
                    <p className="text-lg font-bold text-primary">{tabelaSelecionada}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={handlePopular} 
                className="flex-1"
                disabled={!tabelaSelecionada || isPopulando}
              >
                {isPopulando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Inserindo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Inserir {validationResult?.totalArtigos || 0} Artigos
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AtualizacaoLeiFinal;
