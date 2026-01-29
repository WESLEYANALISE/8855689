import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, AlertTriangle, Plus, Minus, Edit, History, ExternalLink, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { URLS_PLANALTO } from '@/lib/urlsPlanalto';

interface HistoricoAlteracao {
  id: string;
  tabela_codigo: string;
  tipo_alteracao: string;
  artigo_afetado: string;
  detalhes: {
    novos?: any[];
    removidos?: any[];
    alterados?: any[];
    resumo?: string;
    data_verificacao?: string;
  };
  created_at: string;
}

export default function AlteracoesLegislativas() {
  const navigate = useNavigate();
  const [tabSelecionada, setTabSelecionada] = useState('todas');

  const { data: alteracoes, isLoading } = useQuery({
    queryKey: ['historico-alteracoes-legislativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_alteracoes')
        .select('*')
        .eq('tipo_alteracao', 'atualizacao_legislativa')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return (data || []) as unknown as HistoricoAlteracao[];
    }
  });

  const { data: leisComAlteracoes } = useQuery({
    queryKey: ['leis-com-alteracoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monitoramento_leis')
        .select('*')
        .eq('status', 'com_alteracoes')
        .order('ultima_alteracao_detectada', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Agrupar por lei
  const alteracoesPorLei = alteracoes?.reduce((acc, alt) => {
    const lei = alt.tabela_codigo;
    if (!acc[lei]) acc[lei] = [];
    acc[lei].push(alt);
    return acc;
  }, {} as Record<string, HistoricoAlteracao[]>) || {};

  const leisUnicas = Object.keys(alteracoesPorLei);

  const alteracoesFiltradas = tabSelecionada === 'todas' 
    ? alteracoes 
    : alteracoes?.filter(a => a.tabela_codigo === tabSelecionada);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            Alterações Legislativas
          </h1>
          <p className="text-muted-foreground">
            Histórico de atualizações detectadas nas leis
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-primary">{alteracoes?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total de Alterações</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-amber-500">{leisComAlteracoes?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Leis Afetadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-green-500">
              {alteracoes?.reduce((acc, a) => acc + (a.detalhes?.novos?.length || 0), 0) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Artigos Novos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-blue-500">
              {alteracoes?.reduce((acc, a) => acc + (a.detalhes?.alterados?.length || 0), 0) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Artigos Modificados</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de filtro por lei */}
      <Tabs value={tabSelecionada} onValueChange={setTabSelecionada}>
        <ScrollArea className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="todas">Todas</TabsTrigger>
            {leisUnicas.map(lei => (
              <TabsTrigger key={lei} value={lei} className="whitespace-nowrap">
                {lei.split(' - ')[0]}
                <Badge variant="secondary" className="ml-2">
                  {alteracoesPorLei[lei].length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        <TabsContent value={tabSelecionada} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : alteracoesFiltradas?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">Nenhuma alteração encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  O monitoramento automático detectará futuras alterações
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alteracoesFiltradas?.map(alt => {
                const urlPlanalto = URLS_PLANALTO[alt.tabela_codigo];
                const detalhes = alt.detalhes || {};
                const totalNovos = detalhes.novos?.length || 0;
                const totalAlterados = detalhes.alterados?.length || 0;
                const totalRemovidos = detalhes.removidos?.length || 0;

                return (
                  <Card key={alt.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {alt.tabela_codigo}
                          </CardTitle>
                          <CardDescription>
                            {formatDistanceToNow(new Date(alt.created_at), { 
                              locale: ptBR, 
                              addSuffix: true 
                            })}
                            {' • '}
                            {format(new Date(alt.created_at), "dd/MM/yyyy 'às' HH:mm")}
                          </CardDescription>
                        </div>
                        {urlPlanalto && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={urlPlanalto} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Planalto
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Stats da alteração */}
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {totalNovos > 0 && (
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                            <Plus className="w-3 h-3 mr-1" />
                            {totalNovos} novos
                          </Badge>
                        )}
                        {totalAlterados > 0 && (
                          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                            <Edit className="w-3 h-3 mr-1" />
                            {totalAlterados} alterados
                          </Badge>
                        )}
                        {totalRemovidos > 0 && (
                          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                            <Minus className="w-3 h-3 mr-1" />
                            {totalRemovidos} removidos
                          </Badge>
                        )}
                      </div>

                      {/* Resumo */}
                      {detalhes.resumo && (
                        <div className="p-3 rounded-lg bg-muted/50 mb-4">
                          <p className="text-sm">{detalhes.resumo}</p>
                        </div>
                      )}

                      {/* Detalhes das alterações */}
                      {totalAlterados > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Artigos alterados:</h4>
                          <div className="grid gap-2">
                            {detalhes.alterados?.slice(0, 5).map((art: any, idx: number) => (
                              <div key={idx} className="p-2 rounded border text-sm">
                                <div className="font-medium">Art. {art.numero}</div>
                                {art.resumo && (
                                  <p className="text-muted-foreground mt-1">{art.resumo}</p>
                                )}
                              </div>
                            ))}
                            {(detalhes.alterados?.length || 0) > 5 && (
                              <p className="text-sm text-muted-foreground">
                                +{(detalhes.alterados?.length || 0) - 5} mais alterações
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
