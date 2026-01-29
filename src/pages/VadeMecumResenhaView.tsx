import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, ExternalLink, Copy, Share2, BookOpen, ChevronDown, Scale, Loader2, Sparkles, X, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import brasaoRepublica from '@/assets/brasao-republica.png';
import ReactMarkdown from 'react-markdown';

interface ResenhaDetalhes {
  id: string;
  numero_lei: string;
  ementa: string | null;
  data_publicacao: string;
  url_planalto: string;
  artigos: Array<{ numero: string; texto: string }>;
  areas_direito: string[];
  texto_formatado: string | null;
  explicacao_lei: string | null;
  explicacoes_artigos: Record<string, string> | null;
}

export default function VadeMecumResenhaView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [lei, setLei] = useState<ResenhaDetalhes | null>(null);
  const [explicacaoLei, setExplicacaoLei] = useState<string | null>(null);
  const [loadingExplicacao, setLoadingExplicacao] = useState(false);
  const [explicacoesArtigos, setExplicacoesArtigos] = useState<Record<number, string>>({});
  const [loadingExplicacaoArtigo, setLoadingExplicacaoArtigo] = useState<number | null>(null);
  const [processando, setProcessando] = useState(false);
  
  // Verificar se é lei de leis_push_2025
  const isPushLei = id?.startsWith('push-');
  const realId = isPushLei ? id?.replace('push-', '') : id;
  
  // Verificar se a lei está pendente (sem artigos)
  const isPendente = isPushLei && (!lei?.artigos || lei.artigos.length === 0);

  useEffect(() => {
    if (id) fetchLei();
  }, [id]);

  const fetchLei = async () => {
    setLoading(true);
    try {
      if (isPushLei) {
        // Buscar de leis_push_2025
        const { data, error } = await supabase
          .from('leis_push_2025' as any)
          .select('*')
          .eq('id', realId)
          .single();

        if (error) throw error;
        const leiData = data as unknown as ResenhaDetalhes;
        setLei(leiData);
      } else {
        // Buscar de resenha_diaria
        const { data, error } = await supabase
          .from('resenha_diaria' as any)
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        const leiData = data as unknown as ResenhaDetalhes;
        setLei(leiData);
        
        // Carregar explicações do cache se existirem
        if (leiData.explicacao_lei) {
          setExplicacaoLei(leiData.explicacao_lei);
        }
        if (leiData.explicacoes_artigos) {
          const explicacoes: Record<number, string> = {};
          Object.entries(leiData.explicacoes_artigos).forEach(([key, value]) => {
            explicacoes[parseInt(key)] = value;
          });
          setExplicacoesArtigos(explicacoes);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar lei:', error);
      toast.error('Lei não encontrada');
      navigate('/vade-mecum/resenha-diaria');
    } finally {
      setLoading(false);
    }
  };

  // Processar lei pendente sob demanda
  const processarLeiAgora = async () => {
    if (!isPushLei || !lei?.url_planalto) {
      toast.error('URL do Planalto não disponível');
      return;
    }
    
    setProcessando(true);
    try {
      console.log('🔄 Processando lei sob demanda:', realId);
      
      const { data, error } = await supabase.functions.invoke('formatar-lei-push-unica', {
        body: { leiId: realId, urlPlanalto: lei.url_planalto }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Lei processada! ${data.totalArtigos} artigos extraídos.`);
        // Recarregar dados
        await fetchLei();
      } else {
        throw new Error(data?.error || 'Falha ao processar');
      }
    } catch (error) {
      console.error('Erro ao processar lei:', error);
      toast.error('Não foi possível processar. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  // Gerar explicação da lei completa com IA
  const gerarExplicacaoLei = async () => {
    if (!lei || explicacaoLei) return;
    setLoadingExplicacao(true);
    try {
      const prompt = `Explique de forma clara e didática a seguinte lei brasileira:

**${lei.numero_lei}**
${lei.ementa || ''}

Artigos:
${lei.artigos?.map(a => `${a.numero}: ${a.texto}`).join('\n\n') || 'Sem artigos'}

Responda em português brasileiro, explicando:
1. O que esta lei faz/altera
2. Quem é afetado por ela
3. Principais mudanças práticas
4. Quando entra em vigor

Seja objetivo e use linguagem acessível.`;

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { message: prompt }
      });

      if (error) throw error;
      const explicacao = data?.response || 'Não foi possível gerar a explicação.';
      setExplicacaoLei(explicacao);
      
      // Salvar no cache do Supabase
      await supabase
        .from('resenha_diaria' as any)
        .update({ explicacao_lei: explicacao })
        .eq('id', lei.id);
        
    } catch (error) {
      console.error('Erro ao gerar explicação:', error);
      toast.error('Erro ao gerar explicação');
    } finally {
      setLoadingExplicacao(false);
    }
  };

  // Gerar explicação de artigo específico
  const gerarExplicacaoArtigo = async (index: number, artigo: { numero: string; texto: string }) => {
    if (explicacoesArtigos[index]) return;
    setLoadingExplicacaoArtigo(index);
    try {
      const prompt = `Explique de forma clara e didática o seguinte artigo de lei:

**${artigo.numero}**
${artigo.texto}

Lei: ${lei?.numero_lei}
${lei?.ementa || ''}

Explique em português brasileiro:
- O que este artigo determina
- Como afeta na prática
- Termos técnicos usados

Seja objetivo e use linguagem acessível.`;

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { message: prompt }
      });

      if (error) throw error;
      const explicacao = data?.response || 'Não foi possível gerar a explicação.';
      
      const novasExplicacoes = {
        ...explicacoesArtigos,
        [index]: explicacao
      };
      setExplicacoesArtigos(novasExplicacoes);
      
      // Salvar no cache do Supabase
      const explicacoesParaSalvar: Record<string, string> = {};
      Object.entries(novasExplicacoes).forEach(([key, value]) => {
        explicacoesParaSalvar[key] = value;
      });
      
      await supabase
        .from('resenha_diaria' as any)
        .update({ explicacoes_artigos: explicacoesParaSalvar })
        .eq('id', lei?.id);
        
    } catch (error) {
      console.error('Erro ao gerar explicação do artigo:', error);
      toast.error('Erro ao gerar explicação');
    } finally {
      setLoadingExplicacaoArtigo(null);
    }
  };

  // Formatar texto com quebras de linha
  const formatarTextoComParagrafos = (texto: string) => {
    if (!texto) return [];
    if (texto.includes('<div') || texto.includes('<table')) return [texto];
    
    let textoCorrigido = texto
      .replace(/(§\s*\d+[º°]?\.?)\s*\n+\s*/g, '$1 ')
      .replace(/([a-záéíóúâêîôûãõç])\n([a-záéíóúâêîôûãõç])/gi, '$1$2')
      .replace(/\(\n(\w)/g, '($1')
      .replace(/\(([^)]*)\n([^)]*)\)/g, '($1$2)')
      .replace(/(\w)\n([a-z]\))/gi, '$1$2');
    
    textoCorrigido = textoCorrigido
      .replace(/([.!?;:])\s*(§\s*\d)/g, '$1\n\n$2')
      .replace(/([.!?;:])\s*([IVXLCDM]+\s*[-–])/g, '$1\n\n$2')
      .replace(/([.!?;:])\s*(Parágrafo)/g, '$1\n\n$2');
    
    const partes = textoCorrigido.split(/\n\n+/).filter(part => part.trim());
    return partes.map(parte => parte.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não informada';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success('Copiado!');
  };

  const compartilhar = () => {
    if (lei) {
      const texto = `${lei.numero_lei}\n\n${lei.ementa || ''}\n\nVeja mais: ${window.location.href}`;
      if (navigator.share) {
        navigator.share({ title: lei.numero_lei, text: texto, url: window.location.href });
      } else {
        copiarTexto(texto);
      }
    }
  };

  // Extrair anexos mencionados no texto
  const extrairAnexos = () => {
    if (!lei?.artigos) return [];
    const anexos: string[] = [];
    lei.artigos.forEach(artigo => {
      const matches = artigo.texto.match(/Anexo\s+[IVXLCDM]+|Anexo\s+\d+/gi);
      if (matches) {
        matches.forEach(m => {
          if (!anexos.includes(m)) anexos.push(m);
        });
      }
    });
    return anexos;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!lei) return null;

  const anexos = extrairAnexos();

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="container mx-auto px-4 py-6 max-w-3xl pb-20">
        <Tabs defaultValue="lei" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="lei" className="gap-2">
              <Scale className="w-4 h-4" />
              Lei
            </TabsTrigger>
            <TabsTrigger value="explicacao" className="gap-2" onClick={gerarExplicacaoLei}>
              <Sparkles className="w-4 h-4" />
              Explicação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lei">
            {/* Brasão e Texto Dourado */}
            <div className="flex flex-col items-center mb-6">
              <img 
                src={brasaoRepublica} 
                alt="Brasão da República" 
                className="h-16 sm:h-20 w-auto"
              />
              <div className="text-center mt-3 text-[#8B7355] text-xs sm:text-sm font-medium">
                <p>Presidência da República</p>
                <p>Casa Civil</p>
                <p>Secretaria Especial para Assuntos Jurídicos</p>
              </div>
            </div>

            {/* Número da Lei */}
            <div className="text-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-primary uppercase tracking-wide">
                {lei.numero_lei}
              </h2>
            </div>

            {/* Ementa em vermelho */}
            {lei.ementa && (
              <p className="text-xs sm:text-sm text-red-500 italic text-center max-w-2xl mx-auto mb-4">
                {lei.ementa}
              </p>
            )}

            {/* Preâmbulo */}
            <p className="text-xs sm:text-sm font-medium text-foreground text-center mb-6">
              O PRESIDENTE DA REPÚBLICA Faço saber que o Congresso Nacional decreta e eu sanciono a seguinte Lei:
            </p>

            {/* Aviso de Lei Pendente */}
            {isPendente && (
              <Card className="bg-amber-500/10 border-amber-500/30 mb-6">
                <CardContent className="p-4 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-amber-500">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Lei em processamento</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O conteúdo desta lei ainda está sendo extraído do Planalto.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button 
                      onClick={processarLeiAgora} 
                      disabled={processando}
                      className="gap-2"
                    >
                      {processando ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Tentar processar agora
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(lei.url_planalto, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver texto oficial no Planalto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Artigos - Drawer de baixo para cima */}
            {lei.artigos?.length > 0 && (
              <div className="space-y-2 mb-6">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  Artigos ({lei.artigos.length})
                </h3>
                
                {lei.artigos.map((artigo, index) => (
                  <Drawer key={index}>
                    <DrawerTrigger asChild>
                      <Card className="cursor-pointer hover:bg-muted transition-colors border-l-4 border-l-amber-500 bg-card">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Scale className="w-5 h-5 text-amber-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-amber-500 text-sm mb-1">
                              {artigo.numero}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {artigo.texto?.substring(0, 100)}...
                            </p>
                          </div>
                          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        </CardContent>
                      </Card>
                    </DrawerTrigger>
                    <DrawerContent className="h-[85vh]">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <DrawerTitle className="flex items-center gap-2 text-amber-500">
                          <Scale className="w-5 h-5" />
                          {artigo.numero}
                        </DrawerTitle>
                        <DrawerClose asChild>
                          <Button variant="ghost" size="icon">
                            <X className="w-5 h-5" />
                          </Button>
                        </DrawerClose>
                      </div>
                      <ScrollArea className="flex-1 p-4">
                        <Tabs defaultValue="texto" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="texto">Texto</TabsTrigger>
                            <TabsTrigger value="explicacao" onClick={() => gerarExplicacaoArtigo(index, artigo)}>
                              <Sparkles className="w-3 h-3 mr-1" />
                              Explicação
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="texto">
                            <div className="text-sm leading-relaxed space-y-3">
                              {formatarTextoComParagrafos(artigo.texto).map((parte, i) => (
                                <p key={i}>
                                  {i === 0 && <span className="font-semibold text-amber-500">{artigo.numero} </span>}
                                  {parte}
                                </p>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 mt-4"
                              onClick={() => copiarTexto(`${artigo.numero}\n${artigo.texto}`)}
                            >
                              <Copy className="w-3 h-3" />
                              Copiar artigo
                            </Button>
                          </TabsContent>

                          <TabsContent value="explicacao">
                            {loadingExplicacaoArtigo === index ? (
                              <div className="flex items-center gap-2 py-8 justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-sm text-muted-foreground">Gerando explicação...</span>
                              </div>
                            ) : explicacoesArtigos[index] ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  components={{
                                    h1: ({ children }) => <h1 className="text-lg font-bold text-primary mt-4 mb-2">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-base font-semibold text-primary mt-3 mb-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-semibold text-primary/80 mt-2 mb-1">{children}</h3>,
                                    p: ({ children }) => <p className="text-sm text-foreground mb-3 leading-relaxed">{children}</p>,
                                    strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
                                    ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="text-sm text-foreground">{children}</li>,
                                  }}
                                >
                                  {explicacoesArtigos[index]}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">
                                  Clique para gerar explicação com IA
                                </p>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </ScrollArea>
                    </DrawerContent>
                  </Drawer>
                ))}
              </div>
            )}

            {/* Anexos */}
            {anexos.length > 0 && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-primary">
                  <FileText className="w-4 h-4" />
                  Anexos da Lei
                </h4>
                <div className="flex flex-wrap gap-2">
                  {anexos.map((anexo, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-primary/50 hover:bg-primary/20"
                      onClick={() => window.open(lei.url_planalto, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver {anexo}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Assinatura */}
            <div className="mt-8 pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground italic">
                Brasília, {formatDate(lei.data_publicacao).replace('de ', '').replace(' de', ' de')}
              </p>
              <p className="text-sm font-semibold uppercase mt-2">
                LUIZ INÁCIO LULA DA SILVA
              </p>
            </div>

            {/* Texto dourado - Aviso */}
            <div className="text-center py-4 mt-4">
              <p className="text-xs sm:text-sm text-[#B8860B] italic">
                Este texto não substitui o publicado no DOU de {formatDate(lei.data_publicacao).split(' de ')[0]}.{String(new Date(lei.data_publicacao).getMonth() + 1).padStart(2, '0')}.{new Date(lei.data_publicacao).getFullYear()}.
              </p>
            </div>

            {/* Link Original */}
            <Card className="bg-muted/30">
              <CardContent className="p-3 sm:p-4">
                <a
                  href={lei.url_planalto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-lg">
                      <ExternalLink className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">
                        Ver texto oficial
                      </p>
                      <p className="text-xs text-muted-foreground">Planalto.gov.br</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 rotate-[-90deg] text-muted-foreground" />
                </a>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explicacao">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">O que significa esta lei?</h3>
                </div>
                
                {loadingExplicacao ? (
                  <div className="flex items-center gap-2 py-8 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analisando a lei com IA...</span>
                  </div>
                ) : explicacaoLei ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-lg font-bold text-primary mt-4 mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold text-primary mt-3 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold text-primary/80 mt-2 mb-1">{children}</h3>,
                        p: ({ children }) => <p className="text-sm text-foreground mb-3 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm text-foreground">{children}</li>,
                      }}
                    >
                      {explicacaoLei}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground mb-4">
                      Clique para gerar uma explicação clara e didática desta lei
                    </p>
                    <Button onClick={gerarExplicacaoLei} className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Gerar Explicação
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
