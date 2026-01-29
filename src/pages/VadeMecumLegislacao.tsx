import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, FileText, Calendar, ExternalLink, Filter, ChevronRight, Loader2, BookOpen, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LegislacaoItem {
  id: string;
  numero_lei: string;
  tipo_ato: string;
  ementa: string | null;
  data_publicacao: string | null;
  url_planalto?: string;
  artigos: Array<{ numero: string; texto: string }>;
  tabela_origem: string;
}

const tiposLegislacao = [
  { value: 'todos', label: 'Todos os Tipos', tabela: null },
  { value: 'decretos', label: 'Decretos', tabela: 'DECRETOS_VADEMECUM' },
  { value: 'leis_ordinarias', label: 'Leis Ordinárias', tabela: 'LEIS_ORDINARIAS_VADEMECUM' },
  { value: 'leis_complementares', label: 'Leis Complementares', tabela: 'LEIS_COMPLEMENTARES_VADEMECUM' },
  { value: 'medidas_provisorias', label: 'Medidas Provisórias', tabela: 'MEDIDAS_PROVISORIAS_VADEMECUM' },
  { value: 'pl', label: 'Projetos de Lei', tabela: 'PL_VADEMECUM' },
  { value: 'plp', label: 'PLPs', tabela: 'PLP_VADEMECUM' },
  { value: 'pec', label: 'PECs', tabela: 'PEC_VADEMECUM' },
];

export default function VadeMecumLegislacao() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [legislacoes, setLegislacoes] = useState<LegislacaoItem[]>([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroAno, setFiltroAno] = useState('todos');
  const [busca, setBusca] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const anosDisponiveis = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

  useEffect(() => {
    fetchLegislacao();
  }, [filtroTipo, filtroAno]);

  const fetchLegislacao = async () => {
    setLoading(true);
    const resultados: LegislacaoItem[] = [];

    try {
      const tabelas = filtroTipo === 'todos' 
        ? tiposLegislacao.filter(t => t.tabela).map(t => t.tabela!)
        : [tiposLegislacao.find(t => t.value === filtroTipo)?.tabela].filter(Boolean) as string[];

      for (const tabela of tabelas) {
        let query = supabase
          .from(tabela as any)
          .select('id, numero_lei, tipo_ato, ementa, data_publicacao, url_planalto, artigos')
          .order('data_publicacao', { ascending: false })
          .limit(50);

        if (filtroAno !== 'todos') {
          query = query.gte('data_publicacao', `${filtroAno}-01-01`)
            .lte('data_publicacao', `${filtroAno}-12-31`);
        }

        const { data, error } = await query;

        if (!error && data) {
          resultados.push(...data.map((item: any) => ({
            ...item,
            artigos: item.artigos || [],
            tabela_origem: tabela
          })));
        }
      }

      // Ordenar por data
      resultados.sort((a, b) => {
        const dateA = a.data_publicacao ? new Date(a.data_publicacao).getTime() : 0;
        const dateB = b.data_publicacao ? new Date(b.data_publicacao).getTime() : 0;
        return dateB - dateA;
      });

      setLegislacoes(resultados);
    } catch (error) {
      console.error('Erro ao buscar legislação:', error);
      toast.error('Erro ao carregar legislação');
    } finally {
      setLoading(false);
    }
  };

  const legislacoesFiltradas = legislacoes.filter(l => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      l.numero_lei?.toLowerCase().includes(termo) ||
      l.ementa?.toLowerCase().includes(termo) ||
      l.tipo_ato?.toLowerCase().includes(termo)
    );
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não informada';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'decreto': return 'bg-blue-500';
      case 'lei ordinária': return 'bg-green-500';
      case 'lei complementar': return 'bg-purple-500';
      case 'medida provisória': return 'bg-orange-500';
      case 'projeto de lei': return 'bg-cyan-500';
      case 'projeto de lei complementar': return 'bg-indigo-500';
      case 'proposta de emenda constitucional': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vade-mecum')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Pesquisa de Legislação</h1>
              <p className="text-sm text-muted-foreground">
                {legislacoesFiltradas.length} resultados
              </p>
            </div>
          </div>

          {/* Barra de Busca */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, ementa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-primary text-primary-foreground' : ''}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Filtros Expansíveis */}
          {showFilters && (
            <div className="mt-4 flex gap-2 flex-wrap">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposLegislacao.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroAno} onValueChange={setFiltroAno}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Legislação */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="container mx-auto px-4 py-6 space-y-3">
          {loading && legislacoes.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : legislacoesFiltradas.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="p-8 text-center">
                <Scale className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma legislação encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou termos de busca
                </p>
              </CardContent>
            </Card>
          ) : (
            legislacoesFiltradas.map((lei) => (
              <Card 
                key={`${lei.tabela_origem}-${lei.id}`}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/vade-mecum/legislacao/${lei.tabela_origem}/${lei.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`${getTipoColor(lei.tipo_ato)} rounded-full p-2 flex-shrink-0`}>
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm">{lei.numero_lei}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          {lei.tipo_ato}
                        </Badge>
                        {lei.artigos?.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {lei.artigos.length} artigos
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {lei.ementa || 'Sem ementa disponível'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(lei.data_publicacao)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
