import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, ExternalLink, Calendar, MapPin, Briefcase, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Concurso {
  id: string;
  titulo: string;
  descricao: string | null;
  conteudo: string | null;
  imagem: string | null;
  link: string;
  data_publicacao: string | null;
  regiao: string | null;
  estado: string | null;
  status: string | null;
  created_at: string;
}

const regioes = [
  { id: 'nacional', label: 'Nacional' },
  { id: 'sudeste', label: 'Sudeste' },
  { id: 'sul', label: 'Sul' },
  { id: 'norte', label: 'Norte' },
  { id: 'nordeste', label: 'Nordeste' },
  { id: 'centrooeste', label: 'Centro-Oeste' },
];

const statusColors: Record<string, string> = {
  'aberto': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'prorrogado': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'suspenso': 'bg-red-500/20 text-red-400 border-red-500/30',
  'reaberto': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'cancelado': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

export default function ConcursosAbertos() {
  const navigate = useNavigate();
  const [regiaoSelecionada, setRegiaoSelecionada] = useState('nacional');
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [concursoSelecionado, setConcursoSelecionado] = useState<Concurso | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRaspando, setIsRaspando] = useState(false);

  // Carregar concursos do banco
  const carregarConcursos = async (regiao: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('CONCURSOS_ABERTOS')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (regiao !== 'nacional') {
        query = query.eq('regiao', regiao);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar concursos:', error);
        toast.error('Erro ao carregar concursos');
        return;
      }

      setConcursos(data || []);
      if (data && data.length > 0) {
        setConcursoSelecionado(data[0]);
      } else {
        setConcursoSelecionado(null);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Raspar novos concursos
  const rasparConcursos = async () => {
    setIsRaspando(true);
    try {
      toast.info('Buscando novos concursos...');
      
      const { data, error } = await supabase.functions.invoke('raspar-concursos-abertos', {
        body: { regiao: regiaoSelecionada },
      });

      if (error) {
        console.error('Erro ao raspar:', error);
        toast.error('Erro ao buscar concursos');
        return;
      }

      if (data?.success) {
        toast.success(data.message || 'Concursos atualizados!');
        await carregarConcursos(regiaoSelecionada);
      } else {
        toast.error(data?.error || 'Erro ao buscar concursos');
      }
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setIsRaspando(false);
    }
  };

  useEffect(() => {
    carregarConcursos(regiaoSelecionada);
  }, [regiaoSelecionada]);

  const formatarData = (data: string | null) => {
    if (!data) return 'Data não informada';
    try {
      return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return data;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ferramentas')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Concursos Abertos</h1>
          <p className="text-xs text-muted-foreground">Últimas notícias de concursos públicos</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={rasparConcursos}
          disabled={isRaspando}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRaspando ? 'animate-spin' : ''}`} />
          {isRaspando ? 'Buscando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Filtros de Região */}
      <div className="px-4 py-3 border-b border-border">
        <Tabs value={regiaoSelecionada} onValueChange={setRegiaoSelecionada}>
          <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 gap-1 h-auto p-1">
            {regioes.map((regiao) => (
              <TabsTrigger 
                key={regiao.id} 
                value={regiao.id}
                className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {regiao.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Lista de Concursos */}
        <div className="w-full md:w-1/3 border-r border-border">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-3 space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando concursos...
                </div>
              ) : concursos.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhum concurso encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique em "Atualizar" para buscar novos concursos
                  </p>
                </div>
              ) : (
                concursos.map((concurso) => (
                  <Card
                    key={concurso.id}
                    className={`p-3 cursor-pointer transition-all hover:bg-muted/50 ${
                      concursoSelecionado?.id === concurso.id ? 'ring-2 ring-primary bg-muted/50' : ''
                    }`}
                    onClick={() => setConcursoSelecionado(concurso)}
                  >
                    <div className="flex gap-3">
                      {concurso.imagem && (
                        <img
                          src={concurso.imagem}
                          alt=""
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-foreground line-clamp-2">
                          {concurso.titulo}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {concurso.status && (
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1.5 py-0 ${statusColors[concurso.status] || ''}`}
                            >
                              {concurso.status}
                            </Badge>
                          )}
                          {concurso.estado && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {concurso.estado}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatarData(concurso.data_publicacao)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Prévia do Concurso */}
        <div className="flex-1 hidden md:block">
          <ScrollArea className="h-[calc(100vh-200px)]">
            {concursoSelecionado ? (
              <div className="p-6">
                {/* Imagem */}
                {concursoSelecionado.imagem && (
                  <div className="mb-6">
                    <img
                      src={concursoSelecionado.imagem}
                      alt=""
                      className="w-full max-h-64 object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Título */}
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {concursoSelecionado.titulo}
                </h2>

                {/* Badges de info */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {concursoSelecionado.status && (
                    <Badge 
                      variant="outline" 
                      className={`${statusColors[concursoSelecionado.status] || ''}`}
                    >
                      <Briefcase className="w-3 h-3 mr-1" />
                      {concursoSelecionado.status.charAt(0).toUpperCase() + concursoSelecionado.status.slice(1)}
                    </Badge>
                  )}
                  {concursoSelecionado.estado && (
                    <Badge variant="secondary">
                      <MapPin className="w-3 h-3 mr-1" />
                      {concursoSelecionado.estado}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatarData(concursoSelecionado.data_publicacao)}
                  </Badge>
                  {concursoSelecionado.regiao && (
                    <Badge variant="outline">
                      <Building2 className="w-3 h-3 mr-1" />
                      {regioes.find(r => r.id === concursoSelecionado.regiao)?.label || concursoSelecionado.regiao}
                    </Badge>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                  {concursoSelecionado.conteudo?.split('\n').map((paragrafo, i) => (
                    <p key={i} className="text-muted-foreground mb-3">
                      {paragrafo}
                    </p>
                  ))}
                </div>

                {/* Botão para abrir link original */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(concursoSelecionado.link, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver no PCI Concursos
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Briefcase className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    Selecione um concurso para ver os detalhes
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Mobile: Modal/Sheet para detalhes */}
        {concursoSelecionado && (
          <div className="md:hidden fixed inset-x-0 bottom-0 bg-card border-t border-border rounded-t-xl max-h-[60vh] overflow-hidden shadow-xl">
            <ScrollArea className="h-full max-h-[60vh]">
              <div className="p-4">
                <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
                
                {concursoSelecionado.imagem && (
                  <img
                    src={concursoSelecionado.imagem}
                    alt=""
                    className="w-full h-32 object-cover rounded-lg mb-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}

                <h3 className="font-bold text-foreground mb-2">{concursoSelecionado.titulo}</h3>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {concursoSelecionado.status && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${statusColors[concursoSelecionado.status] || ''}`}
                    >
                      {concursoSelecionado.status}
                    </Badge>
                  )}
                  {concursoSelecionado.estado && (
                    <Badge variant="secondary" className="text-xs">{concursoSelecionado.estado}</Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-4 line-clamp-6">
                  {concursoSelecionado.descricao}
                </p>

                <Button
                  variant="default"
                  className="w-full"
                  size="sm"
                  onClick={() => window.open(concursoSelecionado.link, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver no PCI Concursos
                </Button>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
