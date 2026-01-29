import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Play, CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Livro {
  id: number;
  livro: string;
  download: string | null;
  autor: string | null;
}

interface Verificacao {
  id: number;
  livro_id: number;
  livro_titulo: string;
  pagina: number;
  texto_original: string | null;
  texto_novo_ocr: string | null;
  diferenca_percentual: number | null;
  status: string;
  erros_detectados: string[] | null;
  criado_em: string;
}

export default function AdminVerificarOcr() {
  const navigate = useNavigate();
  const [livros, setLivros] = useState<Livro[]>([]);
  const [verificacoes, setVerificacoes] = useState<Verificacao[]>([]);
  const [selectedLivro, setSelectedLivro] = useState<Livro | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVerificacao, setSelectedVerificacao] = useState<Verificacao | null>(null);

  useEffect(() => {
    carregarLivros();
  }, []);

  const carregarLivros = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('BIBLIOTECA-CLASSICOS')
        .select('id, livro, download, autor')
        .not('download', 'is', null)
        .order('livro');

      if (error) throw error;
      setLivros(data || []);
    } catch (error) {
      console.error('Erro ao carregar livros:', error);
      toast.error('Erro ao carregar lista de livros');
    } finally {
      setLoading(false);
    }
  };

  const carregarVerificacoes = async (livroId: number) => {
    try {
      const { data, error } = await supabase
        .from('ocr_verificacao')
        .select('*')
        .eq('livro_id', livroId)
        .order('pagina');

      if (error) throw error;
      setVerificacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar verificações:', error);
    }
  };

  const iniciarVerificacaoOcr = async (livro: Livro) => {
    setSelectedLivro(livro);
    setProcessando(true);
    setProgresso(10);

    try {
      toast.info('Iniciando verificação OCR...', { duration: 3000 });
      setProgresso(30);

      const { data, error } = await supabase.functions.invoke('verificar-ocr-livro', {
        body: { livroId: livro.id }
      });

      setProgresso(70);

      if (error) {
        throw error;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setProgresso(90);

      // Carregar verificações atualizadas
      await carregarVerificacoes(livro.id);

      setProgresso(100);
      toast.success(`OCR concluído! ${data?.paginasProcessadas || 0} páginas processadas`);
    } catch (error) {
      console.error('Erro na verificação OCR:', error);
      toast.error('Erro ao processar OCR');
    } finally {
      setProcessando(false);
      setProgresso(0);
    }
  };

  const compararOcr = async (livro: Livro) => {
    setSelectedLivro(livro);
    setProcessando(true);

    try {
      toast.info('Comparando textos...', { duration: 2000 });

      const { data, error } = await supabase.functions.invoke('comparar-ocr-livro', {
        body: { livroId: livro.id }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      await carregarVerificacoes(livro.id);

      const stats = data?.estatisticas;
      toast.success(
        `Comparação concluída! ${stats?.paginasComProblema || 0} páginas com diferenças significativas`
      );
    } catch (error) {
      console.error('Erro na comparação:', error);
      toast.error('Erro ao comparar textos');
    } finally {
      setProcessando(false);
    }
  };

  const aplicarCorrecao = async (verificacaoId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('aplicar-correcao-ocr', {
        body: { verificacaoId }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Correção aplicada com sucesso!');
        if (selectedLivro) {
          await carregarVerificacoes(selectedLivro.id);
        }
      } else {
        toast.error(data?.error || 'Erro ao aplicar correção');
      }
    } catch (error) {
      console.error('Erro ao aplicar correção:', error);
      toast.error('Erro ao aplicar correção');
    }
  };

  const aplicarTodasCorrecoes = async () => {
    if (!selectedLivro) return;

    try {
      const { data, error } = await supabase.functions.invoke('aplicar-correcao-ocr', {
        body: { livroId: selectedLivro.id, aplicarTodas: true }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data.totalCorrigidas} correções aplicadas!`);
        await carregarVerificacoes(selectedLivro.id);
      }
    } catch (error) {
      console.error('Erro ao aplicar correções:', error);
      toast.error('Erro ao aplicar correções');
    }
  };

  const livrosFiltrados = livros.filter(l => 
    l.livro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.autor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, diferenca: number | null) => {
    if (status === 'corrigido') {
      return <Badge className="bg-green-500">Corrigido</Badge>;
    }
    if (diferenca !== null && diferenca > 30) {
      return <Badge variant="destructive">Alto ({diferenca.toFixed(0)}%)</Badge>;
    }
    if (diferenca !== null && diferenca > 10) {
      return <Badge className="bg-yellow-500">Médio ({diferenca.toFixed(0)}%)</Badge>;
    }
    return <Badge variant="secondary">OK</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Verificação OCR de Livros</h1>
            <p className="text-muted-foreground">Compare e corrija textos extraídos dos PDFs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Livros */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Livros Disponíveis</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar livro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {livrosFiltrados.map((livro) => (
                    <div
                      key={livro.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedLivro?.id === livro.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setSelectedLivro(livro);
                        carregarVerificacoes(livro.id);
                      }}
                    >
                      <p className="font-medium text-sm line-clamp-2">{livro.livro}</p>
                      {livro.autor && (
                        <p className="text-xs text-muted-foreground mt-1">{livro.autor}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Painel de Verificação */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {selectedLivro ? selectedLivro.livro : 'Selecione um livro'}
                </CardTitle>
                {selectedLivro && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => iniciarVerificacaoOcr(selectedLivro)}
                      disabled={processando}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Extrair OCR
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => compararOcr(selectedLivro)}
                      disabled={processando}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Comparar
                    </Button>
                    {verificacoes.filter(v => v.status === 'verificado').length > 0 && (
                      <Button
                        size="sm"
                        onClick={aplicarTodasCorrecoes}
                        disabled={processando}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aplicar Todas
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {processando && (
                <Progress value={progresso} className="mt-2" />
              )}
            </CardHeader>
            <CardContent>
              {!selectedLivro ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione um livro na lista para iniciar a verificação</p>
                </div>
              ) : verificacoes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma verificação realizada ainda</p>
                  <p className="text-sm mt-2">Clique em "Extrair OCR" para começar</p>
                </div>
              ) : (
                <ScrollArea className="h-[450px]">
                  <div className="space-y-3">
                    {verificacoes.map((v) => (
                      <div
                        key={v.id}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Página {v.pagina}</span>
                          {getStatusBadge(v.status, v.diferenca_percentual)}
                        </div>
                        
                        {v.erros_detectados && v.erros_detectados.length > 0 && (
                          <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                            {v.erros_detectados.slice(0, 2).map((erro, i) => (
                              <p key={i} className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {erro}
                              </p>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedVerificacao(v);
                              setDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalhes
                          </Button>
                          {v.status !== 'corrigido' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => aplicarCorrecao(v.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aplicar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog de Detalhes */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Comparação - Página {selectedVerificacao?.pagina}
              </DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="original" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="original">Texto Original</TabsTrigger>
                <TabsTrigger value="ocr">Texto OCR Novo</TabsTrigger>
              </TabsList>
              <TabsContent value="original">
                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm">
                    {selectedVerificacao?.texto_original || 'Nenhum texto original disponível'}
                  </pre>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="ocr">
                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm">
                    {selectedVerificacao?.texto_novo_ocr || 'Nenhum texto OCR disponível'}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
