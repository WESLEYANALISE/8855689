import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Loader2, Globe, Sparkles, FileText, Eye, Code, Hash, Layers, Database, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface Alteracao {
  numero_artigo: string;
  elemento_tipo: string;
  elemento_numero: string | null;
  tipo_alteracao: string;
  lei_alteradora: string | null;
  ano_alteracao: number | null;
  texto_completo: string;
}

interface ChunkInfo {
  indice: number;
  total: number;
  tamanho: number;
  preview: string;
}

interface PainelRaspagemLeiProps {
  open: boolean;
  onClose: () => void;
  tabela: string;
  urlPlanalto: string;
  onComplete: () => void;
}

type Fase = 'aguardando' | 'raspando' | 'dividindo' | 'extraindo' | 'analisando' | 'salvando' | 'concluido' | 'populando' | 'populado' | 'erro';

const ELEMENTO_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  'artigo': { icon: '•', label: 'Art.', color: 'text-blue-500' },
  'inciso': { icon: 'I', label: 'Inciso', color: 'text-purple-500' },
  'parágrafo': { icon: '§', label: 'Parágrafo', color: 'text-green-500' },
  'alínea': { icon: 'a)', label: 'Alínea', color: 'text-orange-500' },
  'caput': { icon: '⊕', label: 'Caput', color: 'text-cyan-500' },
};

export const PainelRaspagemLei = ({
  open,
  onClose,
  tabela,
  urlPlanalto,
  onComplete
}: PainelRaspagemLeiProps) => {
  const { toast } = useToast();
  const [fase, setFase] = useState<Fase>('aguardando');
  const [faseTitulo, setFaseTitulo] = useState('');
  const [progresso, setProgresso] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [textoBruto, setTextoBruto] = useState<string>('');
  const [chunks, setChunks] = useState<ChunkInfo[]>([]);
  const [chunkAtual, setChunkAtual] = useState<number>(0);
  const [alteracoes, setAlteracoes] = useState<Alteracao[]>([]);
  const [tabAtiva, setTabAtiva] = useState<string>('log');
  const [progressoPopular, setProgressoPopular] = useState(0);
  const [totalPopulados, setTotalPopulados] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date(), message, type }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const iniciarProcesso = async () => {
    setFase('raspando');
    setProgresso(0);
    setLogs([]);
    setErro(null);
    setResultado(null);
    setTextoBruto('');
    setChunks([]);
    setAlteracoes([]);
    setChunkAtual(0);

    addLog(`Iniciando extração de ${tabela}`, 'info');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/raspar-lei-planalto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ tableName: tabela, urlPlanalto, stream: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) throw new Error('Não foi possível iniciar streaming');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              processarEvento(data);
            } catch {}
          }
        }
      }
    } catch (error: any) {
      setErro(error.message || 'Erro desconhecido');
      setFase('erro');
      addLog(`Erro: ${error.message}`, 'error');
    }
  };

  const processarEvento = (data: any) => {
    // Fase
    if (data.fase) {
      setFase(data.fase);
      if (data.titulo) setFaseTitulo(data.titulo);
      
      switch (data.fase) {
        case 'raspando': setProgresso(10); break;
        case 'dividindo': setProgresso(25); break;
        case 'analisando': setProgresso(30); break;
        case 'salvando': setProgresso(90); break;
      }
    }

    // Log
    if (data.mensagem) {
      addLog(data.mensagem, data.tipo || 'info');
    }

    // Texto bruto
    if (data.texto) {
      setTextoBruto(data.texto);
    }

    // Info dos chunks
    if (data.indice !== undefined && data.tamanho !== undefined && data.preview !== undefined) {
      setChunks(prev => [...prev, {
        indice: data.indice,
        total: data.total,
        tamanho: data.tamanho,
        preview: data.preview
      }]);
    }

    // Chunk sendo processado
    if (data.progresso !== undefined && data.indice !== undefined && !data.tamanho) {
      setChunkAtual(data.indice);
      setProgresso(30 + Math.round(data.progresso * 0.55));
    }

    // Alteração encontrada
    if (data.numero_artigo !== undefined && data.tipo_alteracao !== undefined) {
      setAlteracoes(prev => [...prev, data]);
    }

    // Salvando lotes
    if (data.lote !== undefined && data.totalLotes !== undefined) {
      setProgresso(90 + Math.round((data.lote / data.totalLotes) * 10));
    }

    // Concluído
    if (data.success !== undefined) {
      setFase('concluido');
      setProgresso(100);
      setResultado(data);
      addLog('✅ Processo concluído!', 'success');
    }

    // Erro
    if (data.message && !data.success) {
      setErro(data.message);
      setFase('erro');
      addLog(`❌ ${data.message}`, 'error');
    }
  };

  useEffect(() => {
    if (open && fase === 'aguardando') {
      iniciarProcesso();
    }
  }, [open]);

  const handleClose = () => {
    if (fase === 'concluido') onComplete();
    setFase('aguardando');
    setProgresso(0);
    setLogs([]);
    setChunks([]);
    setAlteracoes([]);
    onClose();
  };

  const popularTabela = async () => {
    if (alteracoes.length === 0) return;
    
    setFase('populando');
    setFaseTitulo('Populando tabela no Supabase...');
    setProgressoPopular(0);
    setTotalPopulados(0);
    
    // Deduplicar alterações baseado na chave única (tabela_lei, numero_artigo, texto_completo)
    const alteracoesUnicas = new Map<string, Alteracao>();
    for (const alt of alteracoes) {
      const chave = `${tabela}|${alt.numero_artigo}|${alt.texto_completo}`;
      // Manter a última versão de cada chave
      alteracoesUnicas.set(chave, alt);
    }
    const alteracoesDeduplicadas = Array.from(alteracoesUnicas.values());
    
    const duplicatasRemovidas = alteracoes.length - alteracoesDeduplicadas.length;
    addLog(`Iniciando inserção de ${alteracoesDeduplicadas.length} alterações únicas para "${tabela}"`, 'info');
    if (duplicatasRemovidas > 0) {
      addLog(`${duplicatasRemovidas} duplicatas removidas antes da inserção`, 'warning');
    }
    addLog(`Tabela destino: historico_alteracoes`, 'info');

    const BATCH_SIZE = 50;
    const total = alteracoesDeduplicadas.length;
    let inseridos = 0;
    let errosCount = 0;

    try {
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = alteracoesDeduplicadas.slice(i, Math.min(i + BATCH_SIZE, total));
        
        const registros = batch.map(alt => ({
          tabela_lei: tabela,
          numero_artigo: alt.numero_artigo,
          elemento_tipo: alt.elemento_tipo,
          elemento_numero: alt.elemento_numero,
          tipo_alteracao: alt.tipo_alteracao,
          lei_alteradora: alt.lei_alteradora,
          ano_alteracao: alt.ano_alteracao,
          texto_completo: alt.texto_completo
        }));

        // Usar onConflict correto que corresponde ao índice único do banco
        // O índice é: idx_historico_alteracoes_unique (tabela_lei, numero_artigo, texto_completo)
        const { data, error } = await supabase
          .from('historico_alteracoes')
          .upsert(registros, { 
            onConflict: 'tabela_lei,numero_artigo,texto_completo',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          console.error('Erro Supabase ao popular:', error);
          addLog(`❌ Erro no lote ${Math.floor(i/BATCH_SIZE)+1}: ${error.message} (código: ${error.code})`, 'error');
          errosCount += batch.length;
        } else {
          const qtdInserida = data?.length || batch.length;
          inseridos += qtdInserida;
          addLog(`✓ Lote ${Math.floor(i/BATCH_SIZE)+1}: ${qtdInserida} registros salvos`, 'success');
        }

        const pct = Math.round(((i + batch.length) / total) * 100);
        setProgressoPopular(pct);
        setTotalPopulados(inseridos);
      }

      if (inseridos > 0) {
        setFase('populado');
        setFaseTitulo('Tabela populada com sucesso!');
        addLog(`✅ Concluído: ${inseridos} salvos, ${errosCount} erros`, 'success');
        
        toast({
          title: "Tabela Populada!",
          description: `${inseridos} alterações salvas para "${tabela}" no Supabase.`,
          duration: 5000
        });

        onComplete();
      } else {
        setFase('erro');
        setErro('Nenhum registro foi salvo. Verifique os logs.');
        addLog(`⚠️ Nenhum registro foi inserido. Verifique se há erros acima.`, 'warning');
        
        toast({
          title: "Nenhum registro salvo",
          description: "Verifique os logs para mais detalhes.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro geral ao popular:', error);
      setFase('erro');
      setErro(error.message);
      addLog(`❌ Erro crítico ao popular: ${error.message}`, 'error');
      toast({
        title: "Erro ao Popular",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getFaseIcon = () => {
    switch (fase) {
      case 'aguardando': return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
      case 'raspando': return <Globe className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'dividindo': return <Layers className="h-5 w-5 text-purple-500 animate-pulse" />;
      case 'analisando': return <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />;
      case 'salvando': return <FileText className="h-5 w-5 text-green-500 animate-pulse" />;
      case 'populando': return <Database className="h-5 w-5 text-cyan-500 animate-pulse" />;
      case 'populado': return <CheckCheck className="h-5 w-5 text-green-500" />;
      case 'concluido': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'erro': return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  // Agrupar alterações por artigo
  const alteracoesAgrupadas = alteracoes.reduce((acc, alt) => {
    if (!acc[alt.numero_artigo]) acc[alt.numero_artigo] = [];
    acc[alt.numero_artigo].push(alt);
    return acc;
  }, {} as Record<string, Alteracao[]>);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Extração com Gemini
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Nome da Lei */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">{tabela}</p>
            <p className="text-xs text-muted-foreground truncate">{urlPlanalto}</p>
          </div>

          {/* Fase Atual */}
          <div className="flex items-center gap-3">
            {getFaseIcon()}
            <div className="flex-1">
              <p className="text-sm font-medium">{faseTitulo || 'Iniciando...'}</p>
              <Progress value={fase === 'populando' ? progressoPopular : progresso} className="h-2 mt-1" />
            </div>
            <Badge variant="outline" className="text-xs tabular-nums">
              {fase === 'populando' ? `${progressoPopular}%` : `${progresso}%`}
            </Badge>
          </div>

          {/* Indicadores de Fases */}
          <div className="flex items-center gap-1 text-[10px] overflow-x-auto pb-1">
            {['raspando', 'dividindo', 'analisando', 'salvando'].map((f, i) => {
              const fases = ['raspando', 'dividindo', 'analisando', 'salvando', 'concluido'];
              const currentIdx = fases.indexOf(fase);
              const thisIdx = i;
              const isActive = fase === f;
              const isDone = currentIdx > thisIdx;
              
              return (
                <div key={f} className="flex items-center">
                  <div className={`px-2 py-1 rounded ${
                    isActive ? 'bg-amber-500/20 text-amber-500' :
                    isDone ? 'bg-green-500/20 text-green-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}. {f === 'raspando' ? 'Raspar' : f === 'dividindo' ? 'Dividir' : f === 'analisando' ? 'Gemini' : 'Salvar'}
                  </div>
                  {i < 3 && <div className="h-px w-2 bg-border" />}
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="log" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Log
              </TabsTrigger>
              <TabsTrigger value="texto" className="text-xs">
                <Code className="h-3 w-3 mr-1" />
                Texto
              </TabsTrigger>
              <TabsTrigger value="chunks" className="text-xs">
                <Layers className="h-3 w-3 mr-1" />
                Chunks ({chunks.length})
              </TabsTrigger>
              <TabsTrigger value="alteracoes" className="text-xs">
                <Hash className="h-3 w-3 mr-1" />
                Alt. ({alteracoes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="log" className="flex-1 overflow-hidden mt-2">
              <div className="border rounded-lg h-[200px] overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1 font-mono text-xs">
                    {logs.map((log, i) => (
                      <div key={i} className={`flex gap-2 ${
                        log.type === 'success' ? 'text-green-500' :
                        log.type === 'error' ? 'text-red-500' :
                        log.type === 'warning' ? 'text-yellow-500' :
                        'text-muted-foreground'
                      }`}>
                        <span className="opacity-50 shrink-0">
                          {log.timestamp.toLocaleTimeString('pt-BR')}
                        </span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                    {['raspando', 'dividindo', 'analisando', 'salvando'].includes(fase) && (
                      <div className="flex gap-2 text-muted-foreground animate-pulse">
                        <span className="opacity-50">{new Date().toLocaleTimeString('pt-BR')}</span>
                        <span>...</span>
                      </div>
                    )}
                    <div ref={logEndRef} />
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="texto" className="flex-1 overflow-hidden mt-2">
              <div className="border rounded-lg h-[200px] overflow-hidden">
                <ScrollArea className="h-full">
                  <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-words text-muted-foreground">
                    {textoBruto || 'Aguardando download...'}
                  </pre>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="chunks" className="flex-1 overflow-hidden mt-2">
              <div className="border rounded-lg h-[200px] overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-2">
                    {chunks.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Aguardando divisão...</p>
                    ) : (
                      chunks.map((chunk) => (
                        <div 
                          key={chunk.indice} 
                          className={`p-2 rounded border text-xs ${
                            chunk.indice === chunkAtual 
                              ? 'bg-amber-500/10 border-amber-500/30' 
                              : chunk.indice < chunkAtual 
                                ? 'bg-green-500/10 border-green-500/30' 
                                : 'bg-muted/50 border-border/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">Parte {chunk.indice}/{chunk.total}</span>
                            <span className="text-muted-foreground">{chunk.tamanho.toLocaleString()} chars</span>
                          </div>
                          <p className="text-muted-foreground truncate">{chunk.preview}</p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="alteracoes" className="flex-1 overflow-hidden mt-2">
              <div className="border rounded-lg h-[200px] overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-2">
                    {Object.keys(alteracoesAgrupadas).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {fase === 'analisando' ? 'Procurando alterações...' : 'Nenhuma alteração ainda'}
                      </p>
                    ) : (
                      Object.entries(alteracoesAgrupadas)
                        .sort((a, b) => {
                          // Ordenar por ano mais recente
                          const maxAnoA = Math.max(...a[1].map(x => x.ano_alteracao || 0));
                          const maxAnoB = Math.max(...b[1].map(x => x.ano_alteracao || 0));
                          return maxAnoB - maxAnoA;
                        })
                        .map(([artigo, alts]) => (
                          <div key={artigo} className="p-2 bg-muted/50 rounded border border-border/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">Art. {artigo}</span>
                              <Badge variant="secondary" className="text-xs">{alts.length}</Badge>
                            </div>
                            <div className="space-y-1">
                              {alts.map((alt, i) => {
                                const config = ELEMENTO_LABELS[alt.elemento_tipo] || ELEMENTO_LABELS['artigo'];
                                return (
                                  <div key={i} className="text-xs pl-2 border-l-2 border-amber-500/50">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className={`font-mono ${config.color}`}>{config.icon}</span>
                                      <span className={`font-medium ${
                                        alt.tipo_alteracao === 'Revogação' ? 'text-red-500' :
                                        alt.tipo_alteracao === 'Inclusão' || alt.tipo_alteracao === 'Acréscimo' ? 'text-green-500' :
                                        alt.tipo_alteracao === 'Redação' ? 'text-blue-500' :
                                        'text-amber-500'
                                      }`}>{alt.tipo_alteracao}</span>
                                      {alt.elemento_numero && (
                                        <span className={config.color}>{config.label} {alt.elemento_numero}</span>
                                      )}
                                      {alt.ano_alteracao && (
                                        <Badge variant="outline" className="text-[10px] h-4">{alt.ano_alteracao}</Badge>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                                      {alt.texto_completo}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>

          {/* Resultado */}
          {fase === 'concluido' && resultado && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-500 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium text-sm">Extração Concluída</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                <div><span className="text-muted-foreground">Chars:</span> <span className="font-bold">{resultado.caracteresRaspados?.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Chunks:</span> <span className="font-bold">{resultado.chunksProcessados}</span></div>
                <div><span className="text-muted-foreground">Alterações:</span> <span className="font-bold">{resultado.totalAlteracoes}</span></div>
              </div>
              {resultado.porElemento && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {Object.entries(resultado.porElemento as Record<string, number>)
                    .filter(([_, count]) => count > 0)
                    .map(([tipo, count]) => {
                      const config = ELEMENTO_LABELS[tipo] || ELEMENTO_LABELS['artigo'];
                      return (
                        <Badge key={tipo} variant="outline" className={`text-xs ${config.color}`}>
                          {config.icon} {config.label}: {count}
                        </Badge>
                      );
                    })}
                </div>
              )}
              {resultado.tiposEncontrados?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {resultado.tiposEncontrados.map((tipo: string) => (
                    <Badge key={tipo} variant="secondary" className="text-xs">{tipo}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Erro */}
          {fase === 'erro' && erro && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="font-medium text-sm">Erro</span>
              </div>
              <p className="text-xs text-red-400">{erro}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-2">
            {fase === 'erro' && (
              <Button variant="outline" size="sm" onClick={iniciarProcesso}>
                Tentar Novamente
              </Button>
            )}
            {fase === 'concluido' && resultado?.totalAlteracoes > 0 && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={popularTabela}
                className="bg-green-600 hover:bg-green-700"
              >
                <Database className="h-4 w-4 mr-1" />
                Popular Tabela ({resultado.totalAlteracoes})
              </Button>
            )}
            {fase === 'populando' && (
              <Button variant="outline" size="sm" disabled className="min-w-[180px]">
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Populando... {progressoPopular}% ({totalPopulados}/{alteracoes.length})
              </Button>
            )}
            {fase === 'populado' && (
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <CheckCheck className="h-4 w-4" />
                {totalPopulados} alterações salvas!
              </div>
            )}
            <Button 
              variant={fase === 'populado' || (fase === 'concluido' && !resultado?.totalAlteracoes) ? 'default' : 'outline'} 
              size="sm" 
              onClick={handleClose}
              disabled={['raspando', 'dividindo', 'analisando', 'extraindo', 'salvando', 'populando'].includes(fase)}
            >
              {fase === 'populado' ? 'Concluir' : fase === 'concluido' ? 'Fechar' : 'Cancelar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
