import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, FileText, Check, Eye, Sparkles, AlertCircle, Clock, CheckCircle2, Upload, Wand2, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LeiPush {
  id: string;
  numero_lei: string;
  ementa: string | null;
  data_publicacao: string | null;
  url_planalto: string;
  texto_bruto: string | null;
  texto_formatado: string | null;
  artigos: any[];
  status: 'pendente' | 'aprovado' | 'publicado';
  areas_direito: string[];
  tabela_destino: string | null;
  created_at: string;
  updated_at: string;
}

export default function LeisPush() {
  const navigate = useNavigate();
  const [leis, setLeis] = useState<LeiPush[]>([]);
  const [loading, setLoading] = useState(true);
  const [raspando, setRaspando] = useState(false);
  const [formatando, setFormatando] = useState<string | null>(null);
  const [selectedLei, setSelectedLei] = useState<LeiPush | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('pendente');

  useEffect(() => {
    fetchLeis();
  }, []);

  const fetchLeis = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leis_push_2025')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar leis:', error);
      toast.error('Erro ao carregar leis');
    } else {
      setLeis((data as LeiPush[]) || []);
    }
    setLoading(false);
  };

  const rasparNovasLeis = async () => {
    setRaspando(true);
    try {
      const { data, error } = await supabase.functions.invoke('raspar-leis-push', {
        body: { year: new Date().getFullYear() }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`${data.novas_leis} novas leis encontradas!`);
        fetchLeis();
      } else {
        toast.error(data.error || 'Erro ao raspar leis');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao raspar novas leis');
    }
    setRaspando(false);
  };

  const formatarLei = async (leiId: string, metodo: number = 1) => {
    setFormatando(leiId);
    try {
      const { data, error } = await supabase.functions.invoke('formatar-lei-push', {
        body: { leiId, metodo }
      });

      if (error) throw error;

      if (data.success) {
        const metodoNome = metodo === 1 ? 'Regras detalhadas' : 'IA livre + limpeza';
        toast.success(`Lei formatada (${metodoNome})! ${data.artigos_extraidos} artigos extraídos`);
        fetchLeis();
      } else {
        toast.error(data.error || 'Erro ao formatar lei');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao formatar lei');
    }
    setFormatando(null);
  };

  const aprovarLei = async (leiId: string) => {
    const { error } = await supabase
      .from('leis_push_2025')
      .update({ status: 'aprovado', updated_at: new Date().toISOString() })
      .eq('id', leiId);

    if (error) {
      toast.error('Erro ao aprovar lei');
    } else {
      toast.success('Lei aprovada!');
      fetchLeis();
    }
  };

  const publicarLei = async (leiId: string) => {
    const { error } = await supabase
      .from('leis_push_2025')
      .update({ status: 'publicado', updated_at: new Date().toISOString() })
      .eq('id', leiId);

    if (error) {
      toast.error('Erro ao publicar lei');
    } else {
      toast.success('Lei publicada!');
      fetchLeis();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'aprovado': return <Check className="w-4 h-4 text-blue-500" />;
      case 'publicado': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pendente</Badge>;
      case 'aprovado': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Aprovado</Badge>;
      case 'publicado': return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Publicado</Badge>;
      default: return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const leisFiltradas = leis.filter(lei => lei.status === activeTab);
  const contadores = {
    pendente: leis.filter(l => l.status === 'pendente').length,
    aprovado: leis.filter(l => l.status === 'aprovado').length,
    publicado: leis.filter(l => l.status === 'publicado').length
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Leis Push</h1>
            <p className="text-sm text-muted-foreground">Gerenciamento de novas leis ordinárias</p>
          </div>
          <Button 
            onClick={rasparNovasLeis} 
            disabled={raspando}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${raspando ? 'animate-spin' : ''}`} />
            {raspando ? 'Raspando...' : 'Buscar Novas Leis'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{contadores.pendente}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{contadores.aprovado}</div>
              <div className="text-sm text-muted-foreground">Aprovadas</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{contadores.publicado}</div>
              <div className="text-sm text-muted-foreground">Publicadas</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pendente" className="gap-2">
              <Clock className="w-4 h-4" />
              Pendentes
            </TabsTrigger>
            <TabsTrigger value="aprovado" className="gap-2">
              <Check className="w-4 h-4" />
              Aprovadas
            </TabsTrigger>
            <TabsTrigger value="publicado" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Publicadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Carregando leis...</p>
              </div>
            ) : leisFiltradas.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Nenhuma lei {activeTab === 'pendente' ? 'pendente' : activeTab === 'aprovado' ? 'aprovada' : 'publicada'}</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {leisFiltradas.map((lei) => (
                    <Card key={lei.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(lei.status)}
                              <span className="font-semibold">{lei.numero_lei}</span>
                              {getStatusBadge(lei.status)}
                            </div>
                            {lei.ementa && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {lei.ementa}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {lei.data_publicacao && (
                                <span>Publicada em: {new Date(lei.data_publicacao).toLocaleDateString('pt-BR')}</span>
                              )}
                              {lei.artigos && lei.artigos.length > 0 && (
                                <span>{lei.artigos.length} artigos</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Ver texto */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedLei(lei);
                                setShowPreview(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* Ações por status */}
                            {lei.status === 'pendente' && (
                              <>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={formatando === lei.id}
                                      className="gap-1"
                                    >
                                      <Sparkles className={`w-4 h-4 ${formatando === lei.id ? 'animate-pulse' : ''}`} />
                                      {formatando === lei.id ? 'Formatando...' : 'Formatar IA'}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => formatarLei(lei.id, 1)} className="gap-2">
                                      <Wand2 className="w-4 h-4" />
                                      <div>
                                        <div className="font-medium">Método 1: Regras Detalhadas</div>
                                        <div className="text-xs text-muted-foreground">Formatação com markdown estruturado</div>
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => formatarLei(lei.id, 2)} className="gap-2">
                                      <Eraser className="w-4 h-4" />
                                      <div>
                                        <div className="font-medium">Método 2: IA Livre + Limpeza</div>
                                        <div className="text-xs text-muted-foreground">Remove caracteres estranhos, texto puro</div>
                                      </div>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => aprovarLei(lei.id)}
                                  disabled={!lei.texto_formatado}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              </>
                            )}

                            {lei.status === 'aprovado' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => publicarLei(lei.id)}
                                className="gap-1"
                              >
                                <Upload className="w-4 h-4" />
                                Publicar
                              </Button>
                            )}

                            {lei.status === 'publicado' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/novas-leis/${lei.id}`)}
                              >
                                Ver Publicação
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedLei?.numero_lei}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {selectedLei && (
                <div className="space-y-4">
                  {selectedLei.ementa && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Ementa</h4>
                      <p className="text-sm">{selectedLei.ementa}</p>
                    </div>
                  )}

                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>{' '}
                      {getStatusBadge(selectedLei.status)}
                    </div>
                    {selectedLei.data_publicacao && (
                      <div>
                        <span className="text-muted-foreground">Data:</span>{' '}
                        {new Date(selectedLei.data_publicacao).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {selectedLei.texto_formatado ? (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Texto Formatado</h4>
                      <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap font-mono">
                        {selectedLei.texto_formatado}
                      </div>
                    </div>
                  ) : selectedLei.texto_bruto ? (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Texto Bruto</h4>
                      <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap">
                        {selectedLei.texto_bruto}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>Texto ainda não raspado</p>
                    </div>
                  )}

                  <div>
                    <a 
                      href={selectedLei.url_planalto} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Ver no Planalto →
                    </a>
                  </div>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
