import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles, BookOpen, Brain, ClipboardCheck, ArrowUp, Home } from "lucide-react";
import { toast } from "sonner";
import { useCursosCache } from "@/hooks/useCursosCache";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { QuizViewer } from "@/components/QuizViewer";
import { AulaTransitionCard } from "@/components/aula/AulaTransitionCard";
import { AulaIntroCard } from "@/components/aula/AulaIntroCard";
import { useDeviceType } from "@/hooks/use-device-type";
interface AulaData {
  tema: string;
  ordem: number;
  'aula-link': string;
  conteudo: string;
  'conteudo-final': string | null;
  'descricao-aula': string | null;
  'descricao_gerada_em': string | null;
  flashcards: Array<{
    pergunta: string;
    resposta: string;
  }> | null;
  questoes: Array<{
    enunciado: string;
    alternativas: {
      a: string;
      b: string;
      c: string;
      d: string;
    };
    correta: string;
    explicacao: string;
  }> | null;
  conteudo_gerado_em: string | null;
}
export default function IniciandoDireitoAula() {
  const navigate = useNavigate();
  const {
    area,
    tema
  } = useParams<{
    area: string;
    tema: string;
  }>();
  const [aula, setAula] = useState<AulaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [todasAulas, setTodasAulas] = useState<{
    tema: string;
    ordem: number;
  }[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mostrarTransicao, setMostrarTransicao] = useState(false);
  const [proximaAulaInfo, setProximaAulaInfo] = useState<{ numero: number; tema: string } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const aulaIniciada = searchParams.get('iniciada') === 'true';
  const conteudoRef = useRef<HTMLDivElement>(null);
  const { cursos, loading: cursosLoading, invalidateCache } = useCursosCache();
  const { isDesktop } = useDeviceType();
  
  const areaDecoded = area ? decodeURIComponent(area) : '';
  const temaDecoded = tema ? decodeURIComponent(tema) : '';
  
  useEffect(() => {
    if (!cursosLoading && areaDecoded && temaDecoded) {
      const aulaEncontrada = cursos.find(
        c => c.area === areaDecoded && c.tema === temaDecoded
      );
      if (aulaEncontrada) {
        setAula(aulaEncontrada as any);
        
        // Gerar descrição se não existir
        if (!aulaEncontrada['descricao-aula']) {
          gerarDescricao(aulaEncontrada);
        }
      }
      setLoading(false);
      
      // Carregar lista de todas as aulas
      const temasArea = cursos
        .filter(c => c.area === areaDecoded)
        .map(c => ({ tema: c.tema, ordem: c.ordem }));
      setTodasAulas(temasArea);
    }
  }, [cursosLoading, cursos, areaDecoded, temaDecoded]);

  const gerarDescricao = async (aulaData: any) => {
    try {
      console.log('Gerando descrição para:', aulaData.tema);
      const { data, error } = await supabase.functions.invoke('gerar-descricao-aula', {
        body: {
          tema: aulaData.tema,
          conteudo_base: aulaData.conteudo,
          area: areaDecoded,
          aula_link: aulaData['aula-link']
        }
      });

      if (error) {
        console.warn('Descrição não pôde ser gerada, usando fallback:', error.message);
        return;
      }
      
      if (data?.descricao) {
        // Atualizar estado local
        setAula((prev: any) => prev ? {
          ...prev,
          'descricao-aula': data.descricao,
          'descricao_gerada_em': new Date().toISOString()
        } : null);
        
        // Invalidar cache para próxima vez
        invalidateCache();
      }
    } catch (error) {
      console.warn('Descrição não pôde ser gerada, usando fallback');
    }
  };
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const gerarConteudo = async () => {
    if (!aula) return;
    setGerando(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('gerar-conteudo-aula', {
        body: {
          tema: temaDecoded,
          conteudo_base: aula.conteudo,
          area: areaDecoded,
          aula_link: aula['aula-link']
        }
      });
      if (error) throw error;
      
      // Atualiza o estado local imediatamente com o resultado
      setAula({
        ...aula,
        'conteudo-final': data.conteudo_enriquecido,
        flashcards: data.flashcards,
        questoes: data.questoes,
        conteudo_gerado_em: new Date().toISOString()
      });
      
      // Invalida o cache e recarrega cursos em background
      invalidateCache();
      
      toast.success('Conteúdo completo gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      toast.error('Erro ao gerar conteúdo. Verifique os logs.');
    } finally {
      setGerando(false);
    }
  };
  const navegarProximaAula = () => {
    const indiceAtual = todasAulas.findIndex(a => a.tema === temaDecoded);
    if (indiceAtual < todasAulas.length - 1) {
      const proximaAula = todasAulas[indiceAtual + 1];
      setProximaAulaInfo({
        numero: proximaAula.ordem,
        tema: proximaAula.tema
      });
      setMostrarTransicao(true);
    }
  };

  const completarTransicao = () => {
    if (proximaAulaInfo) {
      navigate(`/iniciando-direito/${encodeURIComponent(areaDecoded)}/${encodeURIComponent(proximaAulaInfo.tema)}`);
      setMostrarTransicao(false);
      setProximaAulaInfo(null);
    }
  };
  const navegarAulaAnterior = () => {
    const indiceAtual = todasAulas.findIndex(a => a.tema === temaDecoded);
    if (indiceAtual > 0) {
      const aulaAnterior = todasAulas[indiceAtual - 1];
      navigate(`/iniciando-direito/${encodeURIComponent(areaDecoded)}/${encodeURIComponent(aulaAnterior.tema)}`);
    }
  };
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=))([\w-]{11})/)?.[1];
    if (!videoId) return '';
    
    // Buscar duração do vídeo via API do YouTube (não precisamos fazer request, vamos usar parâmetro end genérico)
    // Como não temos a duração exata, usamos um valor alto e subtraímos 3s
    const params = new URLSearchParams({
      autoplay: '1',
      modestbranding: '1',
      rel: '0',
      iv_load_policy: '3',
      playsinline: '1',
    });
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando aula...</p>
        </div>
      </div>;
  }
  if (!aula) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Aula não encontrada</p>
          <Button onClick={() => navigate('/iniciando-direito')} className="mt-4">
            Voltar para Áreas
          </Button>
        </div>
      </div>;
  }
  const indiceAtual = todasAulas.findIndex(a => a.tema === temaDecoded);
  const temProxima = indiceAtual < todasAulas.length - 1;
  const temAnterior = indiceAtual > 0;
  
  // Mostrar tela de introdução se a aula não foi iniciada
  if (!aulaIniciada) {
    return (
      <>
        <AulaIntroCard
          area={areaDecoded}
          aulaNumero={aula.ordem}
          aulaTema={temaDecoded}
          aulaDescricao={aula['descricao-aula'] || aula.conteudo?.substring(0, 150) + '...'}
          capaUrl={(aula as any)['capa-aula']}
          onIniciar={() => setSearchParams({ iniciada: 'true' })}
          onVoltar={() => navigate('/iniciando-direito/todos')}
        />
      </>
    );
  }
  
  return <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-0">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            
          </div>
          
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {areaDecoded} • Aula {aula.ordem}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{temaDecoded}</h1>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="space-y-6">
        {/* Player de vídeo - full width no mobile */}
        {aula['aula-link'] && <div className="bg-card border-y md:border md:rounded-lg overflow-hidden md:mx-4 max-w-5xl md:mx-auto">
            <div className="aspect-video">
              <iframe 
                src={getYouTubeEmbedUrl(aula['aula-link'])} 
                className="w-full h-full" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen 
              />
            </div>
          </div>}


        {/* Conteúdo com Abas */}
        <div className="max-w-5xl mx-auto px-[5px]">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {gerando ? <div className="p-6">
                <ContentGenerationLoader message="Gerando conteúdo completo, flashcards e questões..." />
              </div> : !aula['conteudo-final'] ? <div className="p-6 text-center py-12">
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Conteúdo Completo Disponível
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Gere conteúdo educacional detalhado, flashcards para memorização 
                  e questões para testar seu conhecimento - tudo de uma vez!
                </p>
                <Button onClick={gerarConteudo} size="lg" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Gerar Conteúdo Completo
                </Button>
              </div> : <Tabs defaultValue="conteudo" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-muted/50 p-0">
                  <TabsTrigger value="conteudo" className="gap-2 data-[state=active]:bg-card">
                    <BookOpen className="w-4 h-4" />
                    Conteúdo
                  </TabsTrigger>
                  <TabsTrigger value="flashcards" className="gap-2 data-[state=active]:bg-card">
                    <Brain className="w-4 h-4" />
                    Flashcards
                  </TabsTrigger>
                  <TabsTrigger value="questoes" className="gap-2 data-[state=active]:bg-card">
                    <ClipboardCheck className="w-4 h-4" />
                    Questões
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="conteudo" className="p-6 relative pb-28">
                  <div ref={conteudoRef} className="resumo-markdown prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-li:text-muted-foreground prose-td:text-muted-foreground prose-th:text-foreground prose-table:border-border prose-thead:border-border prose-tr:border-border">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {String(aula['conteudo-final'] ?? '').replace(/```(?:markdown|md)?\n?/gi, '').replace(/\n?```/g, '').trim()}
                    </ReactMarkdown>
                  </div>
                </TabsContent>

                <TabsContent value="flashcards" className="p-6 pb-28">
                  {aula.flashcards && aula.flashcards.length > 0 ? <FlashcardViewer flashcards={aula.flashcards.map(f => ({
                front: f.pergunta,
                back: f.resposta
              }))} /> : <div className="text-center py-12 text-muted-foreground">
                      Nenhum flashcard disponível
                    </div>}
                </TabsContent>

                <TabsContent value="questoes" className="p-6 pb-28">
                  {aula.questoes && aula.questoes.length > 0 ? <QuizViewer questions={aula.questoes.map((q, idx) => {
                const letterToIndex = {
                  a: 0,
                  b: 1,
                  c: 2,
                  d: 3
                };
                return {
                  question: q.enunciado,
                  options: [q.alternativas.a, q.alternativas.b, q.alternativas.c, q.alternativas.d],
                  correctAnswer: letterToIndex[q.correta as keyof typeof letterToIndex],
                  explanation: q.explicacao
                };
              })} /> : <div className="text-center py-12 text-muted-foreground">
                      Nenhuma questão disponível
                    </div>}
                </TabsContent>
              </Tabs>}
          </div>
        </div>

        {/* Navegação entre aulas - Fixa (apenas mobile/tablet) */}
        {!isDesktop && (
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
            <div className="max-w-5xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <Button onClick={navegarAulaAnterior} disabled={!temAnterior} variant="outline" className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>

                <Button 
                  onClick={() => navigate('/iniciando-direito')} 
                  className="px-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  <Home className="w-4 h-4" />
                </Button>

                <Button 
                  onClick={navegarProximaAula} 
                  disabled={!temProxima} 
                  variant="outline"
                  className="flex-1"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Botão de voltar ao topo */}
        {showScrollTop && <Button onClick={scrollToTop} size="icon" className="fixed bottom-20 right-6 rounded-full shadow-lg z-50 animate-fade-in" aria-label="Voltar ao topo">
            <ArrowUp className="w-5 h-5" />
          </Button>}
      </div>

      {/* Transição de Aula */}
      {mostrarTransicao && proximaAulaInfo && (
        <AulaTransitionCard
          aulaNumero={proximaAulaInfo.numero}
          aulaTema={proximaAulaInfo.tema}
          onComplete={completarTransicao}
        />
      )}
    </div>;
}