import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Newspaper, BookOpen, FileText, Search, RefreshCw, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FeedTipo = 'noticias' | 'teses' | 'informativos' | 'pesquisa_pronta';

interface FeedItem {
  id: string;
  feed_tipo: FeedTipo;
  titulo: string;
  link: string;
  descricao: string | null;
  data_publicacao: string | null;
  categoria: string | null;
  created_at: string;
}

const FEED_CONFIG: Record<FeedTipo, { label: string; icon: React.ReactNode; color: string }> = {
  noticias: { label: 'Notícias', icon: <Newspaper className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-500' },
  teses: { label: 'Teses', icon: <BookOpen className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-500' },
  informativos: { label: 'Informativos', icon: <FileText className="h-4 w-4" />, color: 'bg-green-500/10 text-green-500' },
  pesquisa_pronta: { label: 'Pesquisa Pronta', icon: <Search className="h-4 w-4" />, color: 'bg-orange-500/10 text-orange-500' },
};

export default function AtualizacoesSTJ() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FeedTipo>('noticias');
  const [searchTerm, setSearchTerm] = useState('');
  const [sincronizando, setSincronizando] = useState(false);

  // Buscar feeds do banco
  const { data: feeds, isLoading } = useQuery({
    queryKey: ['stj-feeds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stj_feeds')
        .select('*')
        .order('data_publicacao', { ascending: false, nullsFirst: false })
        .limit(200);
      
      if (error) throw error;
      return data as FeedItem[];
    },
  });

  // Sincronizar feeds
  const sincronizarFeeds = async () => {
    setSincronizando(true);
    try {
      const { data, error } = await supabase.functions.invoke('sincronizar-feeds-stj');
      
      if (error) throw error;
      
      if (data?.success) {
        const { resultados } = data;
        const totalNovos = Object.values(resultados as Record<string, { novos: number }>).reduce(
          (acc: number, r) => acc + r.novos, 0
        );
        
        if (totalNovos > 0) {
          toast.success(`${totalNovos} novos itens sincronizados!`);
        } else {
          toast.info('Feeds já estão atualizados');
        }
        
        queryClient.invalidateQueries({ queryKey: ['stj-feeds'] });
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar feeds');
    } finally {
      setSincronizando(false);
    }
  };

  // Filtrar feeds por tipo e busca
  const filteredFeeds = feeds?.filter(feed => {
    if (feed.feed_tipo !== activeTab) return false;
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      feed.titulo.toLowerCase().includes(searchLower) ||
      feed.descricao?.toLowerCase().includes(searchLower) ||
      feed.categoria?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Contagem por tipo
  const countByType = feeds?.reduce((acc, feed) => {
    acc[feed.feed_tipo] = (acc[feed.feed_tipo] || 0) + 1;
    return acc;
  }, {} as Record<FeedTipo, number>) || {};

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "dd 'de' MMM 'de' yyyy", { locale: ptBR });
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">Atualizações STJ</h1>
                <p className="text-xs text-muted-foreground">Feeds RSS oficiais</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={sincronizarFeeds}
              disabled={sincronizando}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${sincronizando ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nos feeds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeedTipo)}>
          <TabsList className="grid w-full grid-cols-4 h-auto">
            {(Object.entries(FEED_CONFIG) as [FeedTipo, typeof FEED_CONFIG[FeedTipo]][]).map(([tipo, config]) => (
              <TabsTrigger
                key={tipo}
                value={tipo}
                className="flex flex-col gap-1 py-2 px-1 text-xs"
              >
                {config.icon}
                <span className="hidden sm:inline">{config.label}</span>
                <Badge variant="secondary" className="text-[10px] px-1">
                  {countByType[tipo] || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(FEED_CONFIG) as FeedTipo[]).map((tipo) => (
            <TabsContent key={tipo} value={tipo} className="mt-4">
              <ScrollArea className="h-[calc(100vh-280px)]">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredFeeds.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-4xl mb-4">📰</div>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum item disponível'}
                      </p>
                      {!searchTerm && (
                        <Button onClick={sincronizarFeeds} disabled={sincronizando}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${sincronizando ? 'animate-spin' : ''}`} />
                          Buscar Atualizações
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredFeeds.map((feed) => (
                      <Card
                        key={feed.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => window.open(feed.link, '_blank')}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm line-clamp-2 mb-1">
                                {feed.titulo}
                              </h3>
                              {feed.descricao && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {feed.descricao}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                {feed.categoria && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {feed.categoria}
                                  </Badge>
                                )}
                                {feed.data_publicacao && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(feed.data_publicacao)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
