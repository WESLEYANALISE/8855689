import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileQuestion,
  Building2,
  Calendar,
  BookOpen,
  Play,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CARGOS = [
  "Delegado de Polícia",
  "Procurador",
  "Promotor de Justiça",
  "Juiz de Direito",
  "Defensor Público",
  "Advogado",
  "Analista Judiciário",
  "Técnico Judiciário",
  "Escrivão de Polícia",
  "Agente de Polícia",
];

const DISCIPLINAS = [
  "Direito Constitucional",
  "Direito Administrativo",
  "Direito Civil",
  "Direito Penal",
  "Direito Processual Civil",
  "Direito Processual Penal",
  "Direito do Trabalho",
  "Direito Tributário",
  "Direito Empresarial",
  "Direito Eleitoral",
  "Direito Previdenciário",
  "Direito Ambiental",
  "Direitos Humanos",
  "Ética Profissional"
];

const BANCAS = [
  "CESPE/CEBRASPE",
  "FCC",
  "FGV",
  "VUNESP",
  "IBFC",
  "AOCP",
  "FUNDEP",
  "IADES",
  "CONSULPLAN",
  "QUADRIX"
];

const ANOS = Array.from({ length: 10 }, (_, i) => (2025 - i).toString());

interface RaspagemResultado {
  success: boolean;
  total: number;
  inseridas: number;
  duplicadas: number;
  erros?: string[];
  filtros: {
    cargo?: string;
    disciplina?: string;
    assunto?: string;
    banca?: string;
    ano?: number;
  };
}

interface QuestaoRaspada {
  id: number;
  id_origem: string;
  disciplina: string | null;
  assunto: string | null;
  ano: number | null;
  banca: string | null;
  orgao: string | null;
  cargo: string | null;
  prova: string | null;
  enunciado: string;
  alternativa_a: string | null;
  alternativa_b: string | null;
  alternativa_c: string | null;
  alternativa_d: string | null;
  alternativa_e: string | null;
  resposta_correta: string | null;
  url_questao: string | null;
  tipo_questao?: string | null;
  created_at: string;
}

export default function RasparQuestoes() {
  const navigate = useNavigate();
  const [cargo, setCargo] = useState("Delegado de Polícia");
  const [disciplina, setDisciplina] = useState("");
  const [assunto, setAssunto] = useState("");
  const [banca, setBanca] = useState("");
  const [ano, setAno] = useState("");
  const [maxQuestoes, setMaxQuestoes] = useState("20");
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<RaspagemResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Questões e preview
  const [questoesRaspadas, setQuestoesRaspadas] = useState<QuestaoRaspada[]>([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [questaoSelecionada, setQuestaoSelecionada] = useState<QuestaoRaspada | null>(null);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string>("");
  const [mostrarResposta, setMostrarResposta] = useState(false);

  const carregarQuestoes = async () => {
    setLoadingQuestoes(true);
    try {
      const { data, error } = await supabase
        .from('QUESTOES_RASPADAS')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setQuestoesRaspadas(data || []);
      
      // Selecionar primeira questão automaticamente
      if (data && data.length > 0 && !questaoSelecionada) {
        setQuestaoSelecionada(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar questões:', err);
    } finally {
      setLoadingQuestoes(false);
    }
  };

  useEffect(() => {
    carregarQuestoes();
  }, []);

  useEffect(() => {
    if (resultado && resultado.inseridas > 0) {
      carregarQuestoes();
    }
  }, [resultado]);

  // Resetar resposta quando mudar de questão
  useEffect(() => {
    setRespostaSelecionada("");
    setMostrarResposta(false);
  }, [questaoSelecionada]);

  const handleRaspar = async () => {
    if (!cargo) {
      toast.error("Selecione um cargo");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultado(null);

    try {
      toast.info("Iniciando raspagem... Isso pode levar alguns minutos.");

      const { data, error: fnError } = await supabase.functions.invoke('raspar-qconcursos', {
        body: {
          cargo,
          disciplina: disciplina || undefined,
          assunto: assunto || undefined,
          banca: banca || undefined,
          ano: ano ? parseInt(ano) : undefined,
          maxQuestoes: parseInt(maxQuestoes)
        }
      });

      if (fnError) throw fnError;

      if (data.error) {
        throw new Error(data.error);
      }

      setResultado(data);
      
      if (data.inseridas > 0) {
        toast.success(`${data.inseridas} questões novas importadas!`);
      } else if (data.total > 0) {
        toast.info(`${data.total} questões encontradas, mas todas já existiam no banco.`);
      } else {
        toast.warning("Nenhuma questão encontrada com os filtros selecionados.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("Erro na raspagem:", err);
      setError(errorMessage);
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const limparFiltros = () => {
    setCargo("Delegado de Polícia");
    setDisciplina("");
    setAssunto("");
    setBanca("");
    setAno("");
    setMaxQuestoes("20");
    setResultado(null);
    setError(null);
  };

  const navegarQuestao = (direcao: 'anterior' | 'proxima') => {
    if (!questaoSelecionada) return;
    const indexAtual = questoesRaspadas.findIndex(q => q.id === questaoSelecionada.id);
    const novoIndex = direcao === 'anterior' ? indexAtual - 1 : indexAtual + 1;
    if (novoIndex >= 0 && novoIndex < questoesRaspadas.length) {
      setQuestaoSelecionada(questoesRaspadas[novoIndex]);
    }
  };

  const getAlternativas = (questao: QuestaoRaspada) => {
    const isCertoErrado = questao.tipo_questao === 'certo_errado' || 
      (questao.alternativa_a === 'Certo' && questao.alternativa_b === 'Errado');
    
    if (isCertoErrado) {
      return [
        { letra: 'C', texto: 'Certo' },
        { letra: 'E', texto: 'Errado' }
      ];
    }
    
    const alternativas = [];
    if (questao.alternativa_a) alternativas.push({ letra: 'A', texto: questao.alternativa_a });
    if (questao.alternativa_b) alternativas.push({ letra: 'B', texto: questao.alternativa_b });
    if (questao.alternativa_c) alternativas.push({ letra: 'C', texto: questao.alternativa_c });
    if (questao.alternativa_d) alternativas.push({ letra: 'D', texto: questao.alternativa_d });
    if (questao.alternativa_e) alternativas.push({ letra: 'E', texto: questao.alternativa_e });
    return alternativas;
  };

  const indexQuestaoAtual = questaoSelecionada 
    ? questoesRaspadas.findIndex(q => q.id === questaoSelecionada.id) + 1 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Raspar Questões</h1>
            <p className="text-muted-foreground text-xs">QConcursos via Firecrawl</p>
          </div>
        </div>
      </div>

      {/* Layout de dois painéis */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-70px)]">
        
        {/* Painel Esquerdo - Filtros e Lista */}
        <div className="w-full lg:w-[380px] border-r border-border/30 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {/* Filtros de Busca */}
            <Card className="mb-4">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  Filtros de Busca
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {/* Cargo */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Cargo *
                  </Label>
                  <Select value={cargo} onValueChange={setCargo}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARGOS.map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Disciplina */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Disciplina
                  </Label>
                  <Select value={disciplina || "all"} onValueChange={(val) => setDisciplina(val === "all" ? "" : val)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Todas</SelectItem>
                      {DISCIPLINAS.map((d) => (
                        <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Banca e Ano em linha */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Banca</Label>
                    <Select value={banca || "all"} onValueChange={(val) => setBanca(val === "all" ? "" : val)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Todas</SelectItem>
                        {BANCAS.map((b) => (
                          <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ano</Label>
                    <Select value={ano || "all"} onValueChange={(val) => setAno(val === "all" ? "" : val)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Todos</SelectItem>
                        {ANOS.map((a) => (
                          <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quantidade */}
                <div className="space-y-1">
                  <Label className="text-xs">Quantidade máxima</Label>
                  <Select value={maxQuestoes} onValueChange={setMaxQuestoes}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10" className="text-xs">10 questões</SelectItem>
                      <SelectItem value="20" className="text-xs">20 questões</SelectItem>
                      <SelectItem value="30" className="text-xs">30 questões</SelectItem>
                      <SelectItem value="50" className="text-xs">50 questões</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botões */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleRaspar}
                    disabled={isLoading || !cargo}
                    size="sm"
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Raspar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={limparFiltros}
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Resultado inline */}
                {resultado && !isLoading && (
                  <div className="flex items-center gap-2 text-xs pt-2 border-t">
                    <CheckCircle2 className={cn("w-4 h-4", resultado.inseridas > 0 ? "text-green-500" : "text-muted-foreground")} />
                    <span>{resultado.total} encontradas</span>
                    <span className="text-green-500">{resultado.inseridas} novas</span>
                  </div>
                )}

                {error && !isLoading && (
                  <div className="flex items-center gap-2 text-xs pt-2 border-t text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="truncate">{error}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lista de Questões */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  Questões ({questoesRaspadas.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={carregarQuestoes}
                  disabled={loadingQuestoes}
                  className="h-7 px-2"
                >
                  {loadingQuestoes ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                </Button>
              </div>

              {loadingQuestoes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : questoesRaspadas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma questão raspada ainda.
                </div>
              ) : (
                <div className="space-y-1">
                  {questoesRaspadas.map((questao) => (
                    <button
                      key={questao.id}
                      onClick={() => setQuestaoSelecionada(questao)}
                      className={cn(
                        "w-full text-left p-2 rounded-lg border transition-colors text-xs",
                        questaoSelecionada?.id === questao.id
                          ? "bg-primary/10 border-primary/30"
                          : "bg-card hover:bg-muted/50 border-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {questao.id_origem}
                        </Badge>
                        <span className="text-muted-foreground text-[10px]">
                          {questao.ano}
                        </span>
                      </div>
                      <p className="text-foreground line-clamp-2">
                        {questao.enunciado}
                      </p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {questao.banca && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">
                            {questao.banca}
                          </Badge>
                        )}
                        {questao.disciplina && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">
                            {questao.disciplina}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Painel Direito - Prévia da Questão */}
        <div className="flex-1 flex flex-col bg-muted/20">
          {questaoSelecionada ? (
            <>
              {/* Header da Questão */}
              <div className="p-4 border-b border-border/30 bg-background">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">
                      {questaoSelecionada.id_origem}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {indexQuestaoAtual} de {questoesRaspadas.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => navegarQuestao('anterior')}
                      disabled={indexQuestaoAtual <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => navegarQuestao('proxima')}
                      disabled={indexQuestaoAtual >= questoesRaspadas.length}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Metadados */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {questaoSelecionada.banca && (
                    <Badge variant="secondary">{questaoSelecionada.banca}</Badge>
                  )}
                  {questaoSelecionada.ano && (
                    <Badge variant="secondary">{questaoSelecionada.ano}</Badge>
                  )}
                  {questaoSelecionada.orgao && (
                    <Badge variant="secondary">{questaoSelecionada.orgao}</Badge>
                  )}
                  {questaoSelecionada.disciplina && (
                    <Badge variant="outline">{questaoSelecionada.disciplina}</Badge>
                  )}
                </div>
              </div>

              {/* Conteúdo da Questão */}
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Enunciado */}
                  <div className="prose prose-sm dark:prose-invert">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {questaoSelecionada.enunciado}
                    </p>
                  </div>

                  {/* Alternativas */}
                  <div className="space-y-2">
                    <RadioGroup
                      value={respostaSelecionada}
                      onValueChange={setRespostaSelecionada}
                    >
                      {getAlternativas(questaoSelecionada).map((alt) => (
                        <label
                          key={alt.letra}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                            respostaSelecionada === alt.letra
                              ? "bg-primary/5 border-primary/30"
                              : "bg-card hover:bg-muted/50 border-border",
                            mostrarResposta && questaoSelecionada.resposta_correta === alt.letra && "bg-green-500/10 border-green-500/30"
                          )}
                        >
                          <RadioGroupItem value={alt.letra} className="mt-0.5" />
                          <div className="flex-1">
                            <span className="font-medium text-sm">{alt.letra})</span>
                            <span className="ml-2 text-sm text-foreground">{alt.texto}</span>
                          </div>
                          {mostrarResposta && questaoSelecionada.resposta_correta === alt.letra && (
                            <Check className="w-5 h-5 text-green-500" />
                          )}
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-3 pt-4 border-t">
                    {questaoSelecionada.resposta_correta && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMostrarResposta(!mostrarResposta)}
                      >
                        {mostrarResposta ? "Ocultar Resposta" : "Ver Resposta"}
                      </Button>
                    )}
                    
                    {questaoSelecionada.url_questao && (
                      <a
                        href={questaoSelecionada.url_questao}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          Ver no QConcursos
                          <ExternalLink className="w-4 h-4 ml-1" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecione uma questão para visualizar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
