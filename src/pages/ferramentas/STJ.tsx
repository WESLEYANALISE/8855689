import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, ExternalLink, Scale, FileText, Repeat, BookOpen, Search, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
interface Informativo {
  id: number;
  numero: number;
  data_publicacao: string | null;
  titulo: string | null;
  processo: string | null;
  ramo_direito: string | null;
  ministro: string | null;
  tese: string | null;
  destaque: string | null;
  link: string | null;
}
interface Tese {
  id: number;
  edicao: number;
  numero_tese: number | null;
  titulo_edicao: string | null;
  ramo_direito: string | null;
  tese: string;
  acordaos_vinculados: string[] | null;
  link: string | null;
}
interface Repetitivo {
  id: number;
  tema: number;
  processo: string | null;
  ministro: string | null;
  ramo_direito: string | null;
  situacao: string | null;
  questao_submetida: string | null;
  tese_firmada: string | null;
  link: string | null;
}
const situacaoColors: Record<string, string> = {
  'Afetado': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Julgado': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Trânsito em Julgado': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Desafetado': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
};
export default function STJ() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('informativos');
  const [busca, setBusca] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRaspando, setIsRaspando] = useState(false);

  // Dados
  const [informativos, setInformativos] = useState<Informativo[]>([]);
  const [teses, setTeses] = useState<Tese[]>([]);
  const [repetitivos, setRepetitivos] = useState<Repetitivo[]>([]);

  // Selecionados
  const [informativoSelecionado, setInformativoSelecionado] = useState<Informativo | null>(null);
  const [teseSelecionada, setTeseSelecionada] = useState<Tese | null>(null);
  const [repetitivoSelecionado, setRepetitivoSelecionado] = useState<Repetitivo | null>(null);

  // Carregar dados
  const carregarInformativos = async () => {
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('STJ_INFORMATIVOS').select('*').order('numero', {
        ascending: false
      }).limit(100);
      if (error) throw error;
      setInformativos(data || []);
      if (data && data.length > 0) {
        setInformativoSelecionado(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar informativos:', err);
    } finally {
      setIsLoading(false);
    }
  };
  const carregarTeses = async () => {
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('STJ_TESES').select('*').order('edicao', {
        ascending: false
      }).limit(100);
      if (error) throw error;
      setTeses(data || []);
      if (data && data.length > 0) {
        setTeseSelecionada(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar teses:', err);
    } finally {
      setIsLoading(false);
    }
  };
  const carregarRepetitivos = async () => {
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('STJ_REPETITIVOS').select('*').order('tema', {
        ascending: false
      }).limit(100);
      if (error) throw error;
      setRepetitivos(data || []);
      if (data && data.length > 0) {
        setRepetitivoSelecionado(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar repetitivos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Raspar dados
  const rasparDados = async () => {
    setIsRaspando(true);
    try {
      toast.info('Buscando dados do STJ...');
      const functionName = abaAtiva === 'informativos' ? 'raspar-stj-informativos' : abaAtiva === 'teses' ? 'raspar-stj-teses' : 'raspar-stj-repetitivos';
      const {
        data,
        error
      } = await supabase.functions.invoke(functionName);
      if (error) {
        console.error('Erro ao raspar:', error);
        toast.error('Erro ao buscar dados do STJ');
        return;
      }
      if (data?.success) {
        toast.success(data.message || 'Dados atualizados!');
        if (abaAtiva === 'informativos') await carregarInformativos();else if (abaAtiva === 'teses') await carregarTeses();else await carregarRepetitivos();
      } else {
        toast.error(data?.error || 'Erro ao buscar dados');
      }
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setIsRaspando(false);
    }
  };
  useEffect(() => {
    if (abaAtiva === 'informativos') carregarInformativos();else if (abaAtiva === 'teses') carregarTeses();else carregarRepetitivos();
  }, [abaAtiva]);

  // Filtrar por busca
  const informativosFiltrados = informativos.filter(i => i.tese?.toLowerCase().includes(busca.toLowerCase()) || i.processo?.toLowerCase().includes(busca.toLowerCase()) || i.ministro?.toLowerCase().includes(busca.toLowerCase()) || String(i.numero).includes(busca));
  const tesesFiltradas = teses.filter(t => t.tese.toLowerCase().includes(busca.toLowerCase()) || t.titulo_edicao?.toLowerCase().includes(busca.toLowerCase()) || String(t.edicao).includes(busca));
  const repetitivosFiltrados = repetitivos.filter(r => r.tese_firmada?.toLowerCase().includes(busca.toLowerCase()) || r.questao_submetida?.toLowerCase().includes(busca.toLowerCase()) || r.processo?.toLowerCase().includes(busca.toLowerCase()) || String(r.tema).includes(busca));
  return <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Portal STJ
          </h1>
          <p className="text-xs text-muted-foreground">Informativos, Teses e Repetitivos</p>
        </div>
        <Button variant="outline" size="sm" onClick={rasparDados} disabled={isRaspando}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRaspando ? 'animate-spin' : ''}`} />
          {isRaspando ? 'Buscando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <TabsList className="grid w-full grid-cols-3 gap-1">
            <TabsTrigger value="informativos" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Informativos
            </TabsTrigger>
            <TabsTrigger value="teses" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              Teses
            </TabsTrigger>
            <TabsTrigger value="repetitivos" className="text-xs">
              <Repeat className="w-3 h-3 mr-1" />
              Repetitivos
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Busca */}
        <div className="px-4 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por termo, número, ministro..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Lista */}
          <div className="w-full md:w-1/3 border-r border-border">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="p-3 space-y-2">
                {isLoading ? <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div> : abaAtiva === 'informativos' ? informativosFiltrados.length === 0 ? <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Nenhum informativo encontrado</p>
                      <p className="text-xs text-muted-foreground mt-1">Clique em "Atualizar" para buscar</p>
                    </div> : informativosFiltrados.map(item => <Card key={item.id} className={`p-3 cursor-pointer transition-all hover:bg-muted/50 ${informativoSelecionado?.id === item.id ? 'ring-2 ring-primary bg-muted/50' : ''}`} onClick={() => setInformativoSelecionado(item)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                Nº {item.numero}
                              </Badge>
                              {item.ramo_direito && <Badge variant="outline" className="text-xs truncate max-w-[100px]">
                                  {item.ramo_direito}
                                </Badge>}
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">
                              {item.tese || item.destaque || 'Sem descrição'}
                            </p>
                            {item.processo && <p className="text-xs text-muted-foreground mt-1">{item.processo}</p>}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Card>) : abaAtiva === 'teses' ? tesesFiltradas.length === 0 ? <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Nenhuma tese encontrada</p>
                      <p className="text-xs text-muted-foreground mt-1">Clique em "Atualizar" para buscar</p>
                    </div> : tesesFiltradas.map(item => <Card key={item.id} className={`p-3 cursor-pointer transition-all hover:bg-muted/50 ${teseSelecionada?.id === item.id ? 'ring-2 ring-primary bg-muted/50' : ''}`} onClick={() => setTeseSelecionada(item)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                Ed. {item.edicao}
                              </Badge>
                              {item.ramo_direito && <Badge variant="outline" className="text-xs truncate max-w-[100px]">
                                  {item.ramo_direito}
                                </Badge>}
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">
                              {item.titulo_edicao || item.tese}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Card>) : repetitivosFiltrados.length === 0 ? <div className="text-center py-8">
                      <Repeat className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Nenhum repetitivo encontrado</p>
                      <p className="text-xs text-muted-foreground mt-1">Clique em "Atualizar" para buscar</p>
                    </div> : repetitivosFiltrados.map(item => <Card key={item.id} className={`p-3 cursor-pointer transition-all hover:bg-muted/50 ${repetitivoSelecionado?.id === item.id ? 'ring-2 ring-primary bg-muted/50' : ''}`} onClick={() => setRepetitivoSelecionado(item)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                Tema {item.tema}
                              </Badge>
                              {item.situacao && <Badge variant="outline" className={`text-xs ${situacaoColors[item.situacao] || ''}`}>
                                  {item.situacao}
                                </Badge>}
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">
                              {item.questao_submetida || item.tese_firmada || 'Sem descrição'}
                            </p>
                            {item.processo && <p className="text-xs text-muted-foreground mt-1">{item.processo}</p>}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Card>)}
              </div>
            </ScrollArea>
          </div>

          {/* Detalhes */}
          <div className="flex-1 hidden md:block">
            <ScrollArea className="h-[calc(100vh-280px)]">
              {abaAtiva === 'informativos' && informativoSelecionado ? <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Informativo nº {informativoSelecionado.numero}
                    </Badge>
                    {informativoSelecionado.ramo_direito && <Badge variant="outline">{informativoSelecionado.ramo_direito}</Badge>}
                  </div>

                  {informativoSelecionado.processo && <p className="text-sm font-medium text-foreground mb-2">
                      {informativoSelecionado.processo}
                    </p>}

                  {informativoSelecionado.ministro && <p className="text-sm text-muted-foreground mb-4">
                      Ministro(a): {informativoSelecionado.ministro}
                    </p>}

                  {informativoSelecionado.tese && <div className="mb-4">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Tese</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {informativoSelecionado.tese}
                      </p>
                    </div>}

                  {informativoSelecionado.destaque && <div className="mb-4">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Destaque</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {informativoSelecionado.destaque}
                      </p>
                    </div>}

                  {informativoSelecionado.link && <Button variant="outline" className="w-full" onClick={() => window.open(informativoSelecionado.link!, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver no STJ
                    </Button>}
                </div> : abaAtiva === 'teses' && teseSelecionada ? <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Edição {teseSelecionada.edicao}
                    </Badge>
                    {teseSelecionada.ramo_direito && <Badge variant="outline">{teseSelecionada.ramo_direito}</Badge>}
                  </div>

                  {teseSelecionada.titulo_edicao && <h2 className="text-lg font-bold text-foreground mb-4">
                      {teseSelecionada.titulo_edicao}
                    </h2>}

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Tese</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {teseSelecionada.tese}
                    </p>
                  </div>

                  {teseSelecionada.acordaos_vinculados && teseSelecionada.acordaos_vinculados.length > 0 && <div className="mb-4">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Acórdãos Vinculados</h3>
                      <div className="flex flex-wrap gap-1">
                        {teseSelecionada.acordaos_vinculados.map((acordao, i) => <Badge key={i} variant="secondary" className="text-xs">
                            {acordao}
                          </Badge>)}
                      </div>
                    </div>}

                  {teseSelecionada.link && <Button variant="outline" className="w-full" onClick={() => window.open(teseSelecionada.link!, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver no STJ
                    </Button>}
                </div> : abaAtiva === 'repetitivos' && repetitivoSelecionado ? <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Tema {repetitivoSelecionado.tema}
                    </Badge>
                    {repetitivoSelecionado.situacao && <Badge variant="outline" className={situacaoColors[repetitivoSelecionado.situacao] || ''}>
                        {repetitivoSelecionado.situacao}
                      </Badge>}
                    {repetitivoSelecionado.ramo_direito && <Badge variant="outline">{repetitivoSelecionado.ramo_direito}</Badge>}
                  </div>

                  {repetitivoSelecionado.processo && <p className="text-sm font-medium text-foreground mb-2">
                      {repetitivoSelecionado.processo}
                    </p>}

                  {repetitivoSelecionado.ministro && <p className="text-sm text-muted-foreground mb-4">
                      Ministro(a): {repetitivoSelecionado.ministro}
                    </p>}

                  {repetitivoSelecionado.questao_submetida && <div className="mb-4">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Questão Submetida</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {repetitivoSelecionado.questao_submetida}
                      </p>
                    </div>}

                  {repetitivoSelecionado.tese_firmada && <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Tese Firmada</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {repetitivoSelecionado.tese_firmada}
                      </p>
                    </div>}

                  {repetitivoSelecionado.link && <Button variant="outline" className="w-full" onClick={() => window.open(repetitivoSelecionado.link!, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver no STJ
                    </Button>}
                </div> : <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Scale className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">
                      Selecione um item para ver os detalhes
                    </p>
                  </div>
                </div>}
            </ScrollArea>
          </div>
        </div>
      </Tabs>

      {/* Mobile: Detalhes em modal */}
      {((abaAtiva === 'informativos' && informativoSelecionado) || 
        (abaAtiva === 'teses' && teseSelecionada) || 
        (abaAtiva === 'repetitivos' && repetitivoSelecionado)) && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Header do modal */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {abaAtiva === 'informativos' && informativoSelecionado && `Informativo nº ${informativoSelecionado.numero}`}
                {abaAtiva === 'teses' && teseSelecionada && `Edição ${teseSelecionada.edicao}`}
                {abaAtiva === 'repetitivos' && repetitivoSelecionado && `Tema ${repetitivoSelecionado.tema}`}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setInformativoSelecionado(null);
                  setTeseSelecionada(null);
                  setRepetitivoSelecionado(null);
                }}
              >
                Fechar
              </Button>
            </div>
            
            {/* Conteúdo do modal */}
            <ScrollArea className="flex-1 p-4">
              {abaAtiva === 'informativos' && informativoSelecionado && (
                <div className="space-y-4">
                  {informativoSelecionado.ramo_direito && (
                    <Badge variant="outline">{informativoSelecionado.ramo_direito}</Badge>
                  )}
                  
                  {informativoSelecionado.processo && (
                    <p className="text-sm font-medium text-foreground">
                      {informativoSelecionado.processo}
                    </p>
                  )}
                  
                  {informativoSelecionado.ministro && (
                    <p className="text-sm text-muted-foreground">
                      Ministro(a): {informativoSelecionado.ministro}
                    </p>
                  )}
                  
                  {informativoSelecionado.tese && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Tese</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {informativoSelecionado.tese}
                      </p>
                    </div>
                  )}
                  
                  {informativoSelecionado.destaque && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Destaque</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {informativoSelecionado.destaque}
                      </p>
                    </div>
                  )}
                  
                  {informativoSelecionado.link && (
                    <Button 
                      variant="default" 
                      className="w-full" 
                      onClick={() => window.open(informativoSelecionado.link!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver no STJ
                    </Button>
                  )}
                </div>
              )}

              {abaAtiva === 'teses' && teseSelecionada && (
                <div className="space-y-4">
                  {teseSelecionada.ramo_direito && (
                    <Badge variant="outline">{teseSelecionada.ramo_direito}</Badge>
                  )}
                  
                  {teseSelecionada.titulo_edicao && (
                    <h2 className="text-lg font-bold text-foreground">
                      {teseSelecionada.titulo_edicao}
                    </h2>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Tese</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {teseSelecionada.tese}
                    </p>
                  </div>
                  
                  {teseSelecionada.link && (
                    <Button 
                      variant="default" 
                      className="w-full" 
                      onClick={() => window.open(teseSelecionada.link!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver no STJ
                    </Button>
                  )}
                </div>
              )}

              {abaAtiva === 'repetitivos' && repetitivoSelecionado && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {repetitivoSelecionado.situacao && (
                      <Badge variant="outline" className={situacaoColors[repetitivoSelecionado.situacao] || ''}>
                        {repetitivoSelecionado.situacao}
                      </Badge>
                    )}
                    {repetitivoSelecionado.ramo_direito && (
                      <Badge variant="outline">{repetitivoSelecionado.ramo_direito}</Badge>
                    )}
                  </div>
                  
                  {repetitivoSelecionado.processo && (
                    <p className="text-sm font-medium text-foreground">
                      {repetitivoSelecionado.processo}
                    </p>
                  )}
                  
                  {repetitivoSelecionado.ministro && (
                    <p className="text-sm text-muted-foreground">
                      Ministro(a): {repetitivoSelecionado.ministro}
                    </p>
                  )}
                  
                  {repetitivoSelecionado.questao_submetida && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Questão Submetida</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {repetitivoSelecionado.questao_submetida}
                      </p>
                    </div>
                  )}
                  
                  {repetitivoSelecionado.tese_firmada && (
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Tese Firmada</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {repetitivoSelecionado.tese_firmada}
                      </p>
                    </div>
                  )}
                  
                  {repetitivoSelecionado.link && (
                    <Button 
                      variant="default" 
                      className="w-full" 
                      onClick={() => window.open(repetitivoSelecionado.link!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver no STJ
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>;
}