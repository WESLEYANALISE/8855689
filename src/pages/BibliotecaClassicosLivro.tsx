import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Loader2, BookOpen, Video, FileText, Microscope } from "lucide-react";
import { useState, useEffect } from "react";
import PDFViewerModal from "@/components/PDFViewerModal";
import PDFReaderModeSelector from "@/components/PDFReaderModeSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "@/components/VideoPlayer";
import LivroResumoPlayer from "@/components/biblioteca/LivroResumoPlayer";
import LeituraDinamicaReader from "@/components/biblioteca/LeituraDinamicaReader";
import LeituraDinamicaSetup from "@/components/biblioteca/LeituraDinamicaSetup";
import { toast } from "sonner";


const BibliotecaClassicosLivro = () => {
  const { livroId } = useParams();
  const navigate = useNavigate();
  const [showPDF, setShowPDF] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'vertical'>('normal');
  const [searchParams] = useSearchParams();
  const fromSearch = searchParams.get('fromSearch') === 'true';
  const [activeTab, setActiveTab] = useState("sobre");
  const [showResumo, setShowResumo] = useState(false);
  const [isLoadingResumo, setIsLoadingResumo] = useState(false);
  const [resumoData, setResumoData] = useState<any>(null);
  const [showLeituraDinamica, setShowLeituraDinamica] = useState(false);
  const [showLeituraDinamicaSetup, setShowLeituraDinamicaSetup] = useState(false);
  const [hasLeituraDinamica, setHasLeituraDinamica] = useState(false);
  const [tituloLeituraDinamica, setTituloLeituraDinamica] = useState<string>("");

  const { data: livro, isLoading, refetch } = useQuery({
    queryKey: ["biblioteca-classicos-livro", livroId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-CLASSICOS")
        .select("*")
        .eq("id", livroId)
        .single();

      if (error) throw error;
      
      return data;
    },
  });

  // Verificar se tem conteúdo de leitura dinâmica
  useEffect(() => {
    const checkLeituraDinamica = async () => {
      if (!livro?.livro) return;
      
      const tituloLivro = livro.livro;
      
      // Extrair palavras principais (sem artigos, preposições)
      const palavrasChave = tituloLivro
        .toLowerCase()
        .replace(/[^a-záàâãéèêíïóôõöúç\s]/gi, ' ')
        .split(/\s+/)
        .filter((p: string) => p.length > 3 && !['das', 'dos', 'para', 'com', 'por'].includes(p))
        .slice(0, 2);
      
      // Buscar por cada palavra-chave
      for (const palavra of palavrasChave) {
        const { data, error } = await (supabase as any)
          .from("BIBLIOTECA-LEITURA-DINAMICA")
          .select("\"Titulo da Obra\"")
          .ilike("Titulo da Obra", `%${palavra}%`)
          .limit(1);
        
        if (!error && data && data.length > 0) {
          setHasLeituraDinamica(true);
          setTituloLeituraDinamica(data[0]["Titulo da Obra"] || "");
          return;
        }
      }
    };
    
    checkLeituraDinamica();
  }, [livro?.livro]);
  const [loteAtual, setLoteAtual] = useState(0);
  const [capitulosGerados, setCapitulosGerados] = useState(0);
  const [totalCapitulos, setTotalCapitulos] = useState(0);
  const [etapaGeracao, setEtapaGeracao] = useState<'pesquisando' | 'descoberto' | 'gerando' | 'concluido'>('pesquisando');
  const [capitulosInfo, setCapitulosInfo] = useState<Array<{numero: number; titulo: string; status: 'pendente' | 'gerando' | 'concluido'}>>([]);

  const handleOpenResumo = async () => {
    if (!livro) return;

    // Verificar se já tem resumo completo no banco
    if (livro.resumo_capitulos && livro.questoes_resumo) {
      const totalCaps = livro.total_capitulos || livro.resumo_capitulos?.capitulos?.length || 0;
      const capsGerados = livro.capitulos_gerados || totalCaps;
      
      setCapitulosGerados(capsGerados);
      setTotalCapitulos(totalCaps);
      setEtapaGeracao(capsGerados >= totalCaps ? 'concluido' : 'gerando');
      
      // Criar info dos capítulos
      const caps = livro.resumo_capitulos?.capitulos || [];
      setCapitulosInfo(caps.map((c: any, i: number) => ({
        numero: i + 1,
        titulo: c.titulo || `Capítulo ${i + 1}`,
        status: i < capsGerados ? 'concluido' : 'pendente'
      })));
      
      setResumoData({
        resumo_capitulos: livro.resumo_capitulos,
        questoes_resumo: livro.questoes_resumo
      });
      setShowResumo(true);
      
      // Se ainda há capítulos para gerar, continuar do lote apropriado
      if (capsGerados < totalCaps) {
        const proximoLote = Math.floor(capsGerados / 5);
        setLoteAtual(proximoLote);
      }
      return;
    }

    // Gerar resumo (lote 0)
    setEtapaGeracao('pesquisando');
    setCapitulosInfo([]);
    await gerarLoteResumo(0);
  };

  const gerarLoteResumo = async (lote: number) => {
    if (!livro) return;
    
    setShowResumo(true);
    setIsLoadingResumo(true);
    
    if (lote === 0) {
      setEtapaGeracao('pesquisando');
    } else {
      setEtapaGeracao('gerando');
    }

    try {
      const response = await supabase.functions.invoke('gerar-resumo-livro', {
        body: {
          livroId: parseInt(livroId || "0"),
          biblioteca: 'classicos',
          titulo: livro.livro,
          autor: livro.autor,
          sobre: livro.sobre,
          lote: lote,
          totalCapitulosEsperado: 20
        }
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        const caps = response.data.resumo_capitulos?.capitulos || [];
        const capsGerados = response.data.capitulos_gerados || 0;
        const totalCaps = response.data.total_capitulos || 0;
        
        // Atualizar etapa
        if (lote === 0) {
          setEtapaGeracao('descoberto');
          // Pequeno delay para mostrar a descoberta
          await new Promise(r => setTimeout(r, 1500));
          setEtapaGeracao('gerando');
        }
        
        // Atualizar info dos capítulos
        setCapitulosInfo(caps.map((c: any, i: number) => ({
          numero: i + 1,
          titulo: c.titulo || `Capítulo ${i + 1}`,
          status: i < capsGerados ? 'concluido' : (i === capsGerados ? 'gerando' : 'pendente')
        })));
        
        setResumoData({
          resumo_capitulos: response.data.resumo_capitulos,
          questoes_resumo: response.data.questoes_resumo
        });
        setCapitulosGerados(capsGerados);
        setTotalCapitulos(totalCaps);
        setLoteAtual(response.data.proximo_lote ?? lote);
        
        if (response.data.loteCompleto || capsGerados >= totalCaps) {
          setEtapaGeracao('concluido');
          // Atualizar todos como concluídos
          setCapitulosInfo(prev => prev.map(c => ({ ...c, status: 'concluido' as const })));
        }
        
        refetch();
        
        if (!response.data.loteCompleto) {
          toast.success(`Capítulos ${capsGerados} de ${totalCaps} gerados!`);
        } else {
          toast.success("Resumo completo gerado!");
        }
      } else {
        throw new Error(response.data?.error || 'Erro ao gerar resumo');
      }
    } catch (error: any) {
      console.error('Erro ao gerar resumo:', error);
      toast.error('Erro ao gerar resumo. Tente novamente.');
      if (lote === 0) setShowResumo(false);
    } finally {
      setIsLoadingResumo(false);
    }
  };

  const handleGerarProximoLote = () => {
    if (capitulosGerados < totalCapitulos) {
      const proximoLote = Math.floor(capitulosGerados / 5);
      gerarLoteResumo(proximoLote);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!livro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Livro não encontrado</p>
        <Button onClick={() => navigate('/biblioteca-classicos')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 pb-20 animate-fade-in">
      {fromSearch && (
        <div className="bg-accent/10 border-b border-accent/20 py-2 px-4 text-sm text-muted-foreground animate-fade-in">
          🔍 Busca → Bibliotecas → Clássicos → {livro?.livro}
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col items-center">
          <div className={`w-56 md:w-72 mb-8 rounded-xl overflow-hidden shadow-2xl transition-all duration-500 animate-scale-in ${fromSearch ? 'animate-pulse ring-4 ring-accent/50' : 'hover:shadow-accent/50'}`}>
            {livro.imagem ? (
              <img
                src={livro.imagem}
                alt={livro.livro || ""}
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <BookOpen className="w-24 h-24 text-accent/50" />
              </div>
            )}
          </div>

          <div className="w-full max-w-2xl text-center space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{livro.livro}</h1>
              {livro.autor && (
                <p className="text-lg text-muted-foreground">{livro.autor}</p>
              )}
            </div>

            {/* Botões principais */}
            <div className="flex justify-center gap-3 mb-6">
              {livro.link && (
                <Button
                  onClick={() => setShowModeSelector(true)}
                  size="lg"
                  className="shadow-lg hover:shadow-accent/50 transition-all"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Ler agora
                </Button>
              )}
              <Button
                onClick={() => navigate(`/biblioteca-classicos/${livroId}/analise`)}
                size="lg"
                className="bg-purple-600/80 hover:bg-purple-600 text-white shadow-lg transition-all"
              >
                <Microscope className="w-5 h-5 mr-2" />
                Análise
              </Button>
            </div>

            {/* Tabs de Conteúdo */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="sobre">Sobre</TabsTrigger>
                <TabsTrigger value="aula" disabled={!livro.aula}>Aula</TabsTrigger>
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="download" disabled={!livro.download}>Download</TabsTrigger>
              </TabsList>

              <TabsContent value="sobre">
                <div className="space-y-4">
                  {livro.sobre ? (
                    <div className="text-left bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-accent/20">
                      <h2 className="text-xl font-semibold mb-4">Sobre o livro</h2>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {livro.sobre}
                      </p>
                    </div>
                  ) : !hasLeituraDinamica ? (
                    <div className="text-center bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-amber-500/20">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-amber-500" />
                        </div>
                      </div>
                      <h2 className="text-xl font-semibold mb-2">Conteúdo em preparação</h2>
                      <p className="text-muted-foreground mb-6">
                        Clique para processar o PDF e preparar para leitura dinâmica.
                      </p>
                      <Button
                        onClick={() => setShowLeituraDinamicaSetup(true)}
                        size="lg"
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        Processar Conteúdo
                      </Button>
                    </div>
                  ) : (
                    <div className="text-left bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-accent/20">
                      <p className="text-muted-foreground">
                        Informações não disponíveis para este livro.
                      </p>
                    </div>
                  )}

                  {livro.beneficios && (
                    <div className="text-left bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-accent/20">
                      <h2 className="text-xl font-semibold mb-4">Benefícios</h2>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {livro.beneficios}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="aula">
                {livro.aula && (
                  <div className="bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden border border-accent/20">
                    <div className="aspect-video">
                      <VideoPlayer src={livro.aula} autoPlay={false} />
                    </div>
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Videoaula sobre {livro.livro}
                      </h2>
                      <p className="text-muted-foreground">
                        Assista à aula completa sobre este clássico jurídico
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>


              <TabsContent value="resumo">
                <div className="text-center bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-accent/20">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-accent" />
                  <h2 className="text-xl font-semibold mb-4">Resumo do Livro</h2>
                  <p className="text-muted-foreground mb-6">
                    Resumo completo gerado por IA com questões para revisão
                  </p>
                  <Button
                    onClick={handleOpenResumo}
                    size="lg"
                    className="min-w-[200px]"
                    disabled={isLoadingResumo}
                  >
                    {isLoadingResumo ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 mr-2" />
                        {resumoData ? 'Ver Resumo' : 'Gerar Resumo'}
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="download">
                <div className="text-center bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-accent/20">
                  <Download className="w-16 h-16 mx-auto mb-4 text-accent" />
                  <h2 className="text-xl font-semibold mb-4">Download do Livro</h2>
                  <p className="text-muted-foreground mb-6">
                    Faça o download do livro para ler offline
                  </p>
                  {livro.download && (
                    <Button
                      onClick={() => window.open(livro.download!, "_blank")}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Baixar Agora
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <PDFReaderModeSelector
        isOpen={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        onSelectMode={(mode) => {
          setShowModeSelector(false);
          if (mode === 'dinamica') {
            if (hasLeituraDinamica) {
              setShowLeituraDinamica(true);
            } else {
              setShowLeituraDinamicaSetup(true);
            }
          } else {
            setViewMode(mode);
            setShowPDF(true);
          }
        }}
        bookTitle={livro?.livro || ''}
        hasLeituraDinamica={hasLeituraDinamica}
      />

      <LeituraDinamicaSetup
        isOpen={showLeituraDinamicaSetup}
        onClose={() => setShowLeituraDinamicaSetup(false)}
        livroId={parseInt(livroId || '0')}
        tituloLivro={livro?.livro || ''}
        downloadUrl={livro?.download || ''}
        onComplete={() => {
          setShowLeituraDinamicaSetup(false);
          setHasLeituraDinamica(true);
          setTituloLeituraDinamica(livro?.livro || '');
          setShowLeituraDinamica(true);
        }}
      />

      {showPDF && livro.link && (
        <PDFViewerModal
          isOpen={showPDF}
          onClose={() => setShowPDF(false)}
          normalModeUrl={livro.link}
          verticalModeUrl={livro.download || livro.link}
          title={livro.livro || "Livro"}
          viewMode={viewMode}
        />
      )}

      <LivroResumoPlayer
        isOpen={showResumo}
        onClose={() => {
          setShowResumo(false);
          setIsLoadingResumo(false);
        }}
        tituloLivro={livro.livro || ''}
        autorLivro={livro.autor}
        resumoCapitulos={resumoData?.resumo_capitulos || null}
        questoesResumo={resumoData?.questoes_resumo || null}
        isLoading={isLoadingResumo}
        etapaGeracao={etapaGeracao}
        capitulosGerados={capitulosGerados}
        totalCapitulos={totalCapitulos}
        capitulosInfo={capitulosInfo}
        onGerarProximoLote={handleGerarProximoLote}
        livroId={livro.id}
        biblioteca="classicos"
        onImagemGerada={() => refetch()}
      />

      <LeituraDinamicaReader
        isOpen={showLeituraDinamica}
        onClose={() => setShowLeituraDinamica(false)}
        tituloLivro={livro.livro || ''}
        tituloLeituraDinamica={tituloLeituraDinamica}
        imagemCapa={livro.imagem}
        autorLivro={livro.autor}
      />
    </div>
  );
};

export default BibliotecaClassicosLivro;
