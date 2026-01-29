import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Play, RefreshCw, AlertCircle, CheckCircle2, Clock, Loader2, StopCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProgressBar } from "@/components/ProgressBar";

interface Peticao {
  id: string;
  nome_arquivo: string;
  categoria: string;
  texto_extraido_status: string | null;
  texto_extraido_at: string | null;
}

interface Estatisticas {
  total: number;
  extraidas: number;
  pendentes: number;
  erros: number;
  processando: number;
}

interface JobAtivo {
  id: string;
  status: string;
  total_pendentes: number;
  total_processadas: number;
  total_sucesso: number;
  total_erros: number;
  ultimo_erro: string | null;
  created_at: string;
}

const BATCH_SIZES = [50, 100, 200, 500];

const AdminExtracaoPeticoes = () => {
  const navigate = useNavigate();
  const [peticoes, setPeticoes] = useState<Peticao[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    total: 0,
    extraidas: 0,
    pendentes: 0,
    erros: 0,
    processando: 0
  });
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "pendentes" | "sucesso" | "erro">("todas");
  const [tamanhoLote, setTamanhoLote] = useState(100);
  const [jobAtivo, setJobAtivo] = useState<JobAtivo | null>(null);
  const tempoInicioRef = useRef<number | null>(null);

  // Carregar petições e estatísticas
  const carregarDados = async () => {
    setCarregando(true);
    try {
      // Buscar estatísticas
      const { count: totalCount } = await supabase
        .from("peticoes_modelos")
        .select("*", { count: "exact", head: true });

      const { count: extraidasCount } = await supabase
        .from("peticoes_modelos")
        .select("*", { count: "exact", head: true })
        .eq("texto_extraido_status", "sucesso");

      const { count: pendentesCount } = await supabase
        .from("peticoes_modelos")
        .select("*", { count: "exact", head: true })
        .is("texto_extraido_status", null);

      const { count: errosCount } = await supabase
        .from("peticoes_modelos")
        .select("*", { count: "exact", head: true })
        .eq("texto_extraido_status", "erro");

      const { count: processandoCount } = await supabase
        .from("peticoes_modelos")
        .select("*", { count: "exact", head: true })
        .eq("texto_extraido_status", "processando");

      setEstatisticas({
        total: totalCount || 0,
        extraidas: extraidasCount || 0,
        pendentes: pendentesCount || 0,
        erros: errosCount || 0,
        processando: processandoCount || 0
      });

      // Buscar job ativo
      const { data: jobs } = await supabase
        .from("extracao_jobs")
        .select("*")
        .eq("status", "processando")
        .order("created_at", { ascending: false })
        .limit(1);

      if (jobs && jobs.length > 0) {
        setJobAtivo(jobs[0] as JobAtivo);
        if (!tempoInicioRef.current) {
          tempoInicioRef.current = new Date(jobs[0].created_at).getTime();
        }
      } else {
        setJobAtivo(null);
        tempoInicioRef.current = null;
      }

      // Buscar lista de petições
      let query = supabase
        .from("peticoes_modelos")
        .select("id, nome_arquivo, categoria, texto_extraido_status, texto_extraido_at")
        .order("nome_arquivo", { ascending: true })
        .range(0, 499);

      if (filtro === "pendentes") {
        query = query.is("texto_extraido_status", null);
      } else if (filtro === "sucesso") {
        query = query.eq("texto_extraido_status", "sucesso");
      } else if (filtro === "erro") {
        query = query.eq("texto_extraido_status", "erro");
      }

      const { data } = await query;
      setPeticoes((data || []) as Peticao[]);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtro]);

  // Escutar atualizações do job em tempo real
  useEffect(() => {
    const channel = supabase
      .channel("extracao-jobs-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "extracao_jobs"
        },
        (payload) => {
          const updated = payload.new as JobAtivo;
          
          if (updated.status === "processando") {
            setJobAtivo(updated);
          } else if (updated.status === "concluido" || updated.status === "pausado" || updated.status === "erro") {
            setJobAtivo(null);
            tempoInicioRef.current = null;
            
            if (updated.status === "concluido") {
              toast.success(`Extração concluída! ${updated.total_sucesso} sucesso, ${updated.total_erros} erros`);
            } else if (updated.status === "pausado") {
              toast.info("Processamento pausado");
            } else {
              toast.error(`Erro no processamento: ${updated.ultimo_erro}`);
            }
            
            // Recarregar estatísticas
            carregarDados();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Atualizar estatísticas periodicamente enquanto há job ativo
  useEffect(() => {
    if (!jobAtivo) return;

    const interval = setInterval(() => {
      carregarDados();
    }, 5000);

    return () => clearInterval(interval);
  }, [jobAtivo]);

  // Calcular tempo restante estimado
  const calcularTempoRestante = () => {
    if (!jobAtivo || !tempoInicioRef.current || jobAtivo.total_processadas === 0) return null;
    
    const tempoDecorrido = Date.now() - tempoInicioRef.current;
    const taxaPorItem = tempoDecorrido / jobAtivo.total_processadas;
    const itensRestantes = jobAtivo.total_pendentes - jobAtivo.total_processadas;
    const tempoRestanteMs = taxaPorItem * itensRestantes;
    
    const minutos = Math.floor(tempoRestanteMs / 60000);
    const horas = Math.floor(minutos / 60);
    
    if (horas > 0) return `~${horas}h ${minutos % 60}min restantes`;
    if (minutos > 0) return `~${minutos}min restantes`;
    return "Quase lá...";
  };

  // Iniciar processamento em background
  const iniciarProcessamentoBackground = async () => {
    try {
      toast.info("Iniciando processamento em background...");
      tempoInicioRef.current = Date.now();

      const { data, error } = await supabase.functions.invoke("extrair-texto-peticao", {
        body: { 
          acao: "iniciar_background",
          modo: "pendentes",
          limite: tamanhoLote
        }
      });

      if (error) throw error;

      toast.success(`Processamento iniciado! Job ID: ${data.jobId}`);
      
      // Atualizar dados
      await carregarDados();

    } catch (error: any) {
      console.error("Erro ao iniciar processamento:", error);
      toast.error(`Erro: ${error.message}`);
    }
  };

  // Pausar processamento
  const pausarProcessamento = async () => {
    if (!jobAtivo) return;

    try {
      const { error } = await supabase.functions.invoke("extrair-texto-peticao", {
        body: { 
          acao: "pausar",
          jobId: jobAtivo.id
        }
      });

      if (error) throw error;

      toast.info("Pausando processamento...");

    } catch (error: any) {
      console.error("Erro ao pausar:", error);
      toast.error(`Erro: ${error.message}`);
    }
  };

  // Extrair uma petição específica
  const extrairPeticao = async (peticaoId: string) => {
    try {
      toast.info("Extraindo texto...");

      const { data, error } = await supabase.functions.invoke("extrair-texto-peticao", {
        body: { peticaoId }
      });

      if (error) throw error;

      if (data?.sucesso > 0) {
        toast.success("Texto extraído com sucesso!");
      } else if (data?.erros?.length > 0) {
        toast.error(`Erro: ${data.erros[0]}`);
      } else if (data?.error) {
        toast.error(`Erro: ${data.error}`);
      } else {
        toast.error("Erro: nenhum texto foi extraído");
      }

      await carregarDados();

    } catch (error: any) {
      console.error("Erro ao extrair:", error);
      toast.error(`Erro: ${error?.message || "Erro desconhecido"}`);
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "sucesso":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "erro":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "processando":
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case "sucesso": return "Extraído";
      case "erro": return "Erro";
      case "processando": return "Processando";
      default: return "Pendente";
    }
  };

  const progressoPercent = jobAtivo && jobAtivo.total_pendentes > 0 
    ? Math.min(100, Math.round((jobAtivo.total_processadas / jobAtivo.total_pendentes) * 100))
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Extração de Petições</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Extrair texto das petições para banco de conhecimento da IA
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{estatisticas.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{estatisticas.extraidas.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Extraídas</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{estatisticas.pendentes.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{estatisticas.erros.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{estatisticas.processando.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Processando</p>
          </div>
        </div>

        {/* Progresso do Job Ativo */}
        {jobAtivo && (
          <div className="bg-card border border-green-500/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                <span className="font-medium text-green-500">Processamento em andamento</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Você pode sair da página - o processamento continua no servidor
              </span>
            </div>
            
            <ProgressBar
              progress={progressoPercent}
              message={`Processando petições...`}
              subMessage={`${jobAtivo.total_processadas.toLocaleString()} de ${jobAtivo.total_pendentes.toLocaleString()} (${jobAtivo.total_sucesso} sucesso, ${jobAtivo.total_erros} erros)`}
            />
            
            <div className="flex items-center justify-between">
              {calcularTempoRestante() && (
                <p className="text-xs text-muted-foreground">{calcularTempoRestante()}</p>
              )}
              {jobAtivo.ultimo_erro && (
                <p className="text-xs text-red-400 truncate max-w-[300px]">
                  Último erro: {jobAtivo.ultimo_erro}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Controles de lote */}
        <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tamanho do lote:</span>
            <Select
              value={tamanhoLote.toString()}
              onValueChange={(v) => setTamanhoLote(parseInt(v))}
              disabled={!!jobAtivo}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BATCH_SIZES.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-border hidden md:block" />

          {!jobAtivo ? (
            <Button
              onClick={iniciarProcessamentoBackground}
              disabled={estatisticas.pendentes === 0}
              variant="default"
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Zap className="h-4 w-4" />
              Processar Tudo ({estatisticas.pendentes.toLocaleString()})
            </Button>
          ) : (
            <Button
              onClick={pausarProcessamento}
              variant="destructive"
              className="gap-2"
            >
              <StopCircle className="h-4 w-4" />
              Parar Processamento
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={carregarDados}
            disabled={carregando}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {(["todas", "pendentes", "sucesso", "erro"] as const).map((f) => (
            <Button
              key={f}
              variant={filtro === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Lista de petições */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            {carregando ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : peticoes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma petição encontrada
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Arquivo</th>
                    <th className="text-left p-3 text-sm font-medium">Categoria</th>
                    <th className="text-center p-3 text-sm font-medium">Status</th>
                    <th className="text-right p-3 text-sm font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {peticoes.map((peticao) => (
                    <tr key={peticao.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate max-w-[200px] md:max-w-[300px]">
                            {peticao.nome_arquivo}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {peticao.categoria}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getStatusIcon(peticao.texto_extraido_status)}
                          <span className="text-xs">{getStatusText(peticao.texto_extraido_status)}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => extrairPeticao(peticao.id)}
                          disabled={peticao.texto_extraido_status === "processando"}
                        >
                          {peticao.texto_extraido_status === "sucesso" ? "Re-extrair" : "Extrair"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExtracaoPeticoes;
