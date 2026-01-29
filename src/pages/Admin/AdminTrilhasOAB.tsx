import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload, RefreshCw, CheckCircle2, Clock, Loader2, FileText, Play, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function AdminTrilhasOAB() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [progressInfo, setProgressInfo] = useState<{
    etapa: string;
    paginaAtual: number;
    totalPaginas: number;
    mensagem: string;
  } | null>(null);
  const cancelRef = useRef(false);

  const { data: areas, isLoading, refetch } = useQuery({
    queryKey: ['admin-trilhas-areas'],
    queryFn: async () => {
      const { data: areasData, error } = await supabase
        .from('oab_trilhas_areas')
        .select('*')
        .order('ordem');
      if (error) throw error;
      
      // Buscar contagem de temas por área e status para calcular progresso
      const { data: temasStats } = await supabase
        .from('oab_trilhas_temas')
        .select('area, status');
      
      // Calcular progresso de formatação por área
      const progressoFormatacao: Record<string, { concluidos: number; total: number }> = {};
      if (temasStats) {
        temasStats.forEach(tema => {
          if (!progressoFormatacao[tema.area]) {
            progressoFormatacao[tema.area] = { concluidos: 0, total: 0 };
          }
          progressoFormatacao[tema.area].total++;
          if (tema.status === 'concluido') {
            progressoFormatacao[tema.area].concluidos++;
          }
        });
      }
      
      return areasData?.map(area => ({
        ...area,
        temas_concluidos: progressoFormatacao[area.area]?.concluidos || 0,
        temas_total: progressoFormatacao[area.area]?.total || 0,
      }));
    },
    refetchInterval: processing ? 3000 : 10000, // Atualiza mais rápido durante processamento
  });

  const processarPDF = useMutation({
    mutationFn: async ({ area, pdfUrl }: { area: string; pdfUrl: string }) => {
      setProcessing(area);
      cancelRef.current = false;
      
      // ===== ETAPA 1: Extrair PDF com Mistral OCR (uma única chamada) =====
      setProgressInfo({ etapa: 'Extração', paginaAtual: 0, totalPaginas: 0, mensagem: 'Extraindo com Mistral OCR...' });
      
      const { data: extractData, error: extractError } = await supabase.functions.invoke('processar-pdf-trilha-oab', {
        body: { area, pdfUrl },
      });
      
      if (extractError) {
        console.error('Erro na extração:', extractError);
        throw new Error(`Erro na extração: ${extractError.message}`);
      }

      if (!extractData?.success) {
        throw new Error(extractData?.error || 'Erro desconhecido na extração');
      }

      const totalPaginas = extractData.totalPaginas || 0;
      const totalExtraidas = extractData.paginasComConteudo || 0;
      
      setProgressInfo({
        etapa: 'Extração',
        paginaAtual: totalPaginas,
        totalPaginas,
        mensagem: `${totalExtraidas} páginas extraídas`
      });
      
      toast.success(`Extração concluída! ${totalExtraidas} páginas.`);

      // ===== ETAPA 2: Analisar estrutura =====
      if (cancelRef.current) throw new Error('Processamento cancelado');
      
      setProgressInfo({ etapa: 'Análise', paginaAtual: 0, totalPaginas: 0, mensagem: 'Identificando temas e capítulos...' });
      
      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke('analisar-estrutura-trilha-oab', {
        body: { area },
      });

      if (analyzeError) throw new Error(`Erro na análise: ${analyzeError.message}`);
      toast.success(`${analyzeData.totalTemas} temas identificados!`);

      // ===== ETAPA 3: Formatar cada tema =====
      if (cancelRef.current) throw new Error('Processamento cancelado');

      const { data: temas } = await supabase
        .from('oab_trilhas_temas')
        .select('id, titulo')
        .eq('area', area)
        .eq('status', 'pendente')
        .order('ordem');

      if (temas && temas.length > 0) {
        for (let i = 0; i < temas.length; i++) {
          if (cancelRef.current) throw new Error('Processamento cancelado');
          
          const tema = temas[i];
          setProgressInfo({
            etapa: 'Formatação',
            paginaAtual: i + 1,
            totalPaginas: temas.length,
            mensagem: `Processando: ${tema.titulo}`
          });

          const { error: formatError } = await supabase.functions.invoke('formatar-tema-trilha-oab', {
            body: { 
              temaId: tema.id, 
              area
            },
          });

          if (formatError) {
            console.error(`Erro ao formatar tema ${tema.titulo}:`, formatError);
            // Continua para o próximo tema
          }

          // Pausa entre formatações
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      return { success: true, totalPaginas, totalTemas: temas?.length || 0 };
    },
    onSuccess: (data) => {
      toast.success(`Processamento concluído! ${data.totalPaginas} páginas, ${data.totalTemas} temas.`);
      queryClient.invalidateQueries({ queryKey: ['admin-trilhas-areas'] });
      setSelectedArea(null);
      setPdfUrl('');
      setProcessing(null);
      setProgressInfo(null);
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
      setProcessing(null);
      setProgressInfo(null);
      refetch();
    },
  });

  // Mutation para continuar formatação de temas pendentes
  const continuarFormatacao = useMutation({
    mutationFn: async (area: string) => {
      setProcessing(area);
      cancelRef.current = false;

      const { data: temas } = await supabase
        .from('oab_trilhas_temas')
        .select('id, titulo, pagina_inicial, pagina_final')
        .eq('area', area)
        .eq('status', 'pendente')
        .order('ordem');

      if (!temas || temas.length === 0) {
        throw new Error('Não há temas pendentes para formatar');
      }

      for (let i = 0; i < temas.length; i++) {
        if (cancelRef.current) throw new Error('Processamento cancelado');
        
        const tema = temas[i];
        setProgressInfo({
          etapa: 'Formatação',
          paginaAtual: i + 1,
          totalPaginas: temas.length,
          mensagem: `Processando: ${tema.titulo}`
        });

        const { error: formatError } = await supabase.functions.invoke('formatar-tema-trilha-oab', {
          body: { 
            temaId: tema.id, 
            area,
            paginaInicial: tema.pagina_inicial,
            paginaFinal: tema.pagina_final
          },
        });

        if (formatError) {
          console.error(`Erro ao formatar tema ${tema.titulo}:`, formatError);
        }

        await new Promise(r => setTimeout(r, 2000));
      }

      return { success: true, totalTemas: temas.length };
    },
    onSuccess: (data) => {
      toast.success(`Formatação concluída! ${data.totalTemas} temas processados.`);
      queryClient.invalidateQueries({ queryKey: ['admin-trilhas-areas'] });
      setProcessing(null);
      setProgressInfo(null);
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
      setProcessing(null);
      setProgressInfo(null);
      refetch();
    },
  });

  const cancelarProcessamento = () => {
    cancelRef.current = true;
    toast.info('Cancelando processamento...');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'formatando':
      case 'analisando':
      case 'extraindo':
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Badge className="bg-green-500/20 text-green-400">Concluído</Badge>;
      case 'formatando':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Formatando</Badge>;
      case 'analisando':
        return <Badge className="bg-blue-500/20 text-blue-400">Analisando</Badge>;
      case 'extraindo':
        return <Badge className="bg-orange-500/20 text-orange-400">Extraindo</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getProgressPercent = () => {
    if (!progressInfo) return 0;
    if (progressInfo.etapa === 'Extração') {
      return progressInfo.totalPaginas > 0 
        ? Math.round((progressInfo.paginaAtual / progressInfo.totalPaginas) * 33) 
        : 10;
    }
    if (progressInfo.etapa === 'Análise') return 40;
    if (progressInfo.etapa === 'Formatação') {
      return 50 + (progressInfo.totalPaginas > 0 
        ? Math.round((progressInfo.paginaAtual / progressInfo.totalPaginas) * 50)
        : 0);
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Trilhas OAB - Admin</h1>
            <p className="text-sm text-muted-foreground">Gerenciar conteúdo das trilhas</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Progress Card quando processando */}
        {processing && progressInfo && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">Processando: {processing}</p>
                    <p className="text-sm text-muted-foreground">{progressInfo.mensagem}</p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={cancelarProcessamento}>
                  <StopCircle className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
              <Progress value={getProgressPercent()} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Etapa: {progressInfo.etapa}</span>
                <span>{getProgressPercent()}%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{areas?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total de Áreas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">
                {areas?.filter(a => a.status === 'concluido').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Concluídas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-500">
                {areas?.filter(a => ['extraindo', 'analisando', 'formatando'].includes(a.status)).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Em Processo</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-muted-foreground">
                {areas?.filter(a => a.status === 'pendente').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Áreas */}
        <div className="grid gap-4">
          {areas?.map((area) => (
            <Card key={area.id} className="overflow-hidden">
              <div className="flex items-center p-4 gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(area.status)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{area.area}</h3>
                    {getStatusBadge(area.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{area.total_paginas} páginas</span>
                    <span>{area.total_temas} temas</span>
                  </div>
                  {area.pdf_url && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <FileText className="h-3 w-3" />
                      <span className="truncate max-w-xs">{area.pdf_url}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {processing === area.area ? (
                    <Button disabled variant="outline">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </Button>
                  ) : processing ? (
                    <Button disabled variant="ghost">
                      Aguarde...
                    </Button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant={area.status === 'concluido' ? 'outline' : 'default'}
                          onClick={() => {
                            setSelectedArea(area.area);
                            setPdfUrl(area.pdf_url || '');
                          }}
                        >
                          {area.status === 'concluido' ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reprocessar
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Processar PDF
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Processar PDF - {area.area}</DialogTitle>
                          <DialogDescription>
                            Cole o link do PDF do Google Drive para extrair e processar o conteúdo.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>URL do PDF (Google Drive)</Label>
                            <Input
                              placeholder="https://drive.google.com/file/d/..."
                              value={pdfUrl}
                              onChange={(e) => setPdfUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              O PDF será processado em lotes de 10 páginas para evitar timeout.
                            </p>
                          </div>
                          <Button 
                            className="w-full"
                            onClick={() => processarPDF.mutate({ area: area.area, pdfUrl })}
                            disabled={!pdfUrl || processarPDF.isPending}
                          >
                            {processarPDF.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Iniciar Processamento
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* Progress bar for processing with percentage */}
              {['extraindo', 'analisando', 'formatando'].includes(area.status) && processing !== area.area && (
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Progress value={
                      area.status === 'extraindo' ? 20 :
                      area.status === 'analisando' ? 40 : 
                      area.temas_total > 0 ? 40 + Math.round((area.temas_concluidos / area.temas_total) * 60) : 50
                    } className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                      {area.status === 'formatando' && area.temas_total > 0 
                        ? `${area.temas_concluidos}/${area.temas_total}`
                        : area.status === 'extraindo' ? '20%' 
                        : area.status === 'analisando' ? '40%' : ''}
                    </span>
                  </div>
                  
                  {/* Botão para continuar formatação parada */}
                  {area.status === 'formatando' && area.temas_concluidos < area.temas_total && (
                    <Button 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={() => continuarFormatacao.mutate(area.area)}
                      disabled={continuarFormatacao.isPending}
                    >
                      {continuarFormatacao.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Continuando...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Continuar Formatação ({area.temas_total - area.temas_concluidos} restantes)
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
