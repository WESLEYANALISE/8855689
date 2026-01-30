import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Share2, Loader2, ImagePlus, ChevronUp, Clock, Volume2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { PoliticaComentariosSection } from '@/components/politica';
// Background music URL (hosted externally to reduce bundle size)
const backgroundMusic = "https://cdn.pixabay.com/audio/2024/02/14/audio_3d0ab4d36e.mp3";

const getOrientacaoConfig = (orientacao: string) => {
  switch (orientacao) {
    case 'esquerda':
      return { 
        label: 'Esquerda', 
        color: 'from-red-600 to-red-900', 
        badge: 'bg-red-500/20 text-red-300 border-red-500/30',
        accent: 'text-red-400',
        progressColor: 'bg-red-500',
      };
    case 'centro':
      return { 
        label: 'Centro', 
        color: 'from-yellow-600 to-yellow-900', 
        badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        accent: 'text-yellow-400',
        progressColor: 'bg-yellow-500',
      };
    case 'direita':
      return { 
        label: 'Direita', 
        color: 'from-blue-600 to-blue-900', 
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        accent: 'text-blue-400',
        progressColor: 'bg-blue-500',
      };
    default:
      return { 
        label: orientacao, 
        color: 'from-neutral-600 to-neutral-800', 
        badge: 'bg-neutral-500/20 text-neutral-300',
        accent: 'text-primary',
        progressColor: 'bg-primary',
      };
  }
};

// Calcular tempo de leitura
const calcularTempoLeitura = (conteudo: string | null): number => {
  if (!conteudo) return 5;
  const palavras = conteudo.split(/\s+/).length;
  return Math.max(3, Math.ceil(palavras / 200));
};

const PoliticaArtigoView = () => {
  const { artigoId } = useParams<{ artigoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [gerandoConteudo, setGerandoConteudo] = useState(false);
  const [gerandoCapa, setGerandoCapa] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [gerandoNarracao, setGerandoNarracao] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleVoltar = () => {
    if (artigo?.orientacao) {
      navigate(`/politica/estudos/${artigo.orientacao}`);
    } else {
      navigate('/politica');
    }
  };

  const { data: artigo, isLoading, refetch } = useQuery({
    queryKey: ['politica-artigo', artigoId],
    queryFn: async () => {
      if (!artigoId) throw new Error('ID do artigo não encontrado');
      
      const { data, error } = await supabase
        .from('politica_blog_orientacao')
        .select('*')
        .eq('id', artigoId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!artigoId,
  });

  // Scroll progress handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    setScrollProgress(progress);
    setShowScrollTop(scrollTop > 300);
  }, []);

  const scrollToTop = () => {
    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
    scrollArea?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Gerar conteúdo se não existir
  useEffect(() => {
    const gerarConteudo = async () => {
      if (!artigo || artigo.conteudo || gerandoConteudo) return;
      
      setGerandoConteudo(true);
      try {
        const { data, error } = await supabase.functions.invoke('gerar-conteudo-politico', {
          body: {
            artigoId: artigo.id,
            termo: artigo.termo_wikipedia,
            titulo: artigo.titulo,
            categoria: `orientacao-${artigo.orientacao}`,
          }
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        await refetch();
        toast.success('Artigo gerado com sucesso!');
      } catch (error) {
        console.error('Erro ao gerar conteúdo:', error);
        toast.error('Erro ao gerar conteúdo. Tente novamente.');
      } finally {
        setGerandoConteudo(false);
      }
    };

    gerarConteudo();
  }, [artigo, gerandoConteudo, refetch]);

  const handleGerarCapa = async () => {
    if (!artigo || gerandoCapa) return;
    
    setGerandoCapa(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-capa-politica', {
        body: {
          artigoId: artigo.id,
          titulo: artigo.titulo,
          orientacao: artigo.orientacao,
        }
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      await refetch();
      // Invalidar cache da lista para mostrar a capa nova
      queryClient.invalidateQueries({ queryKey: ['politica-blog-orientacao'] });
      toast.success('Capa gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar capa:', error);
      toast.error('Erro ao gerar capa. Tente novamente.');
    } finally {
      setGerandoCapa(false);
    }
  };

  const handleShare = async () => {
    if (!artigo) return;
    
    try {
      await navigator.share({
        title: artigo.titulo,
        text: artigo.resumo || 'Artigo político educativo',
        url: window.location.href
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado!');
    }
  };

  // Formatar tempo em mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Gerar ou reproduzir narração
  const handleNarracao = async () => {
    if (!artigo) return;

    // URL do áudio: priorizar narracao_url salvo no banco, depois audioUrl da sessão
    const urlAudio = artigo.narracao_url || audioUrl;

    // Função auxiliar para iniciar música de fundo
    const startBackgroundMusic = () => {
      if (!backgroundAudioRef.current) {
        backgroundAudioRef.current = new Audio(backgroundMusic);
        backgroundAudioRef.current.loop = true;
      }
      backgroundAudioRef.current.volume = 0.08;
      backgroundAudioRef.current.currentTime = 0;
      backgroundAudioRef.current.play();
    };

    // Função auxiliar para parar música de fundo
    const stopBackgroundMusic = () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current.currentTime = 0;
      }
    };

    // Se já tem áudio (salvo ou gerado), toggle play/pause
    if (urlAudio) {
      if (audioElement) {
        if (isPlaying) {
          audioElement.pause();
          stopBackgroundMusic();
          setIsPlaying(false);
        } else {
          audioElement.play();
          startBackgroundMusic();
          setIsPlaying(true);
        }
        return;
      }
      
      const audio = new Audio(urlAudio);
      audio.onloadedmetadata = () => setAudioDuration(audio.duration);
      audio.ontimeupdate = () => {
        setAudioCurrentTime(audio.currentTime);
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      };
      audio.onended = () => {
        setIsPlaying(false);
        setAudioProgress(0);
        setAudioCurrentTime(0);
        stopBackgroundMusic();
      };
      setAudioElement(audio);
      audio.play();
      startBackgroundMusic();
      setIsPlaying(true);
      return;
    }

    // Se não tem áudio, gerar e salvar no Supabase
    if (!artigo.conteudo) {
      toast.error('Conteúdo ainda não disponível');
      return;
    }

    setGerandoNarracao(true);
    try {
      const textoParaNarrar = artigo.conteudo.slice(0, 4000);
      
      const { data, error } = await supabase.functions.invoke('gerar-narracao-politica', {
        body: { 
          artigoId: artigo.id,
          texto: textoParaNarrar,
          orientacao: artigo.orientacao
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.audioUrl) {
        setAudioUrl(data.audioUrl);
        await refetch(); // Atualizar artigo com narracao_url
        toast.success('Narração gerada!');
        
        const audio = new Audio(data.audioUrl);
        audio.onloadedmetadata = () => setAudioDuration(audio.duration);
        audio.ontimeupdate = () => {
          setAudioCurrentTime(audio.currentTime);
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        };
        audio.onended = () => {
          setIsPlaying(false);
          setAudioProgress(0);
          setAudioCurrentTime(0);
          // Parar música de fundo
          if (backgroundAudioRef.current) {
            backgroundAudioRef.current.pause();
            backgroundAudioRef.current.currentTime = 0;
          }
        };
        setAudioElement(audio);
        audio.play();
        
        // Iniciar música de fundo
        if (!backgroundAudioRef.current) {
          backgroundAudioRef.current = new Audio(backgroundMusic);
          backgroundAudioRef.current.loop = true;
        }
        backgroundAudioRef.current.volume = 0.08;
        backgroundAudioRef.current.currentTime = 0;
        backgroundAudioRef.current.play();
        
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Erro ao gerar narração:', error);
      toast.error('Erro ao gerar narração');
    } finally {
      setGerandoNarracao(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-neutral-900/95 backdrop-blur-sm border-b border-white/5">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 flex-1 rounded-lg" />
        </div>
        <Skeleton className="w-full aspect-[21/9]" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-1/4 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!artigo) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Artigo não encontrado</p>
          <Button variant="ghost" onClick={() => navigate('/politica')} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const config = getOrientacaoConfig(artigo.orientacao);
  const tempoLeitura = calcularTempoLeitura(artigo.conteudo);

  // Formatar conteúdo com quebras de linha
  const conteudoFormatado = artigo.conteudo
    ?.replace(/\r\n/g, '\n')
    .replace(/\n(?!\n)/g, '\n\n')
    .replace(/##\s*/g, '\n\n\n\n## ')
    .replace(/#\s+([^#\n]+)/g, '\n\n\n\n# $1')
    .replace(/\n{5,}/g, '\n\n\n\n')
    .replace(/^\n+/, '')
    .trim()
    || '';

  return (
    <div className="min-h-screen bg-neutral-900 pb-20 relative">
      {/* Barra de progresso de leitura */}
      <motion.div 
        className={`fixed top-0 left-0 h-1 ${config.progressColor} z-50`}
        style={{ width: `${scrollProgress}%` }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.1 }}
      />

      {/* Header fixo único */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 p-4 bg-neutral-900/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoltar}
            className="flex-shrink-0 hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Voltar</p>
            <h1 className="font-semibold text-sm truncate">{artigo.titulo}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${config.badge}`}>
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {tempoLeitura} min
          </span>
          <Button variant="ghost" size="icon" onClick={handleShare} className="hover:bg-white/10">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-60px)]" onScrollCapture={handleScroll}>
        {/* Capa do artigo - Hero maior */}
        {artigo.imagem_url ? (
          <div className="relative w-full aspect-video md:aspect-[21/9]">
            <img 
              src={artigo.imagem_url} 
              alt={artigo.titulo}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
            
            {/* Título sobre a imagem */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl md:text-3xl font-bold text-white mb-3 leading-tight max-w-4xl"
              >
                {artigo.titulo}
              </motion.h1>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3"
              >
                <span className={`text-sm px-3 py-1 rounded-full border ${config.badge}`}>
                  {config.label}
                </span>
                <span className="text-sm text-white/70 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {tempoLeitura} min de leitura
                </span>
              </motion.div>
            </div>
          </div>
        ) : (
          <div className={`relative w-full aspect-video md:aspect-[21/9] bg-gradient-to-br ${config.color}`}>
            {/* Botão de gerar capa centralizado com z-index alto */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20">
              <span className="text-7xl font-bold text-white/10 uppercase">
                {artigo.orientacao.charAt(0)}
              </span>
              <Button
                variant="outline"
                size="lg"
                onClick={handleGerarCapa}
                disabled={gerandoCapa}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 shadow-lg"
              >
                {gerandoCapa ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-5 h-5 mr-2" />
                    Gerar capa
                  </>
                )}
              </Button>
            </div>
            
            {/* Gradient overlay - não bloqueia cliques no centro */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-transparent pointer-events-none" />
            
            {/* Título quando não tem imagem */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 pointer-events-none">
              <h1 className="text-base md:text-xl font-bold text-white mb-3 leading-tight max-w-4xl">
                {artigo.titulo}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`text-sm px-3 py-1 rounded-full border ${config.badge}`}>
                  {config.label}
                </span>
                <span className="text-sm text-white/70 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {tempoLeitura} min de leitura
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Player de narração abaixo da capa */}
        <div className="px-4 md:px-8 pt-4 max-w-4xl mx-auto">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-4">
              {/* Botão de Play/Pause circular */}
              <button
                onClick={handleNarracao}
                disabled={gerandoNarracao}
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                  gerandoNarracao 
                    ? 'bg-white/10 cursor-not-allowed' 
                    : `bg-gradient-to-br ${config.color} hover:scale-105 active:scale-95 shadow-lg`
                }`}
              >
                {gerandoNarracao ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white ml-0.5" />
                )}
              </button>
              
              {/* Texto e barra de progresso */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {gerandoNarracao ? 'Gerando narração...' : 'Ouvir narração'}
                  </span>
                </div>
                
                {/* Barra de progresso com tempo */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {formatTime(audioCurrentTime)}
                  </span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${config.progressColor} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${audioProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">
                    {formatTime(audioDuration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 md:px-8 py-6 max-w-4xl mx-auto"
        >
          {/* Loading de geração */}
          {gerandoConteudo && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 mb-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Gerando artigo com IA...
              </span>
            </div>
          )}

          {/* Conteúdo do artigo */}
          {artigo.conteudo && (
            <div className="prose prose-invert prose-lg max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-sm md:text-base font-bold text-white mt-8 mb-3 pb-2 border-b border-white/10">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xs md:text-sm font-bold text-white mt-6 mb-3">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xs font-semibold text-white mt-5 mb-2">{children}</h3>
                    ),
                  p: ({ children }) => (
                    <p className="text-neutral-300 text-base md:text-lg mb-6 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 text-neutral-300 mb-6 space-y-3">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 text-neutral-300 mb-6 space-y-3">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-neutral-300 text-base md:text-lg">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-white font-semibold">{children}</strong>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className={`border-l-4 border-${config.accent.replace('text-', '')} pl-6 italic text-neutral-400 my-8 py-2 bg-white/5 rounded-r-lg`}>
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {conteudoFormatado}
              </ReactMarkdown>
            </div>
          )}

          {/* Separador final */}
          {artigo.conteudo && (
            <div className="mt-12 pt-8 border-t border-white/10 text-center mb-10">
              <p className="text-sm text-muted-foreground">
                Conteúdo gerado com inteligência artificial para fins educativos
              </p>
            </div>
          )}

          {/* Seção de Comentários */}
          {artigo.id && (
            <div className="mt-8">
              <PoliticaComentariosSection artigoId={typeof artigo.id === 'string' ? parseInt(artigo.id) : artigo.id} />
            </div>
          )}
        </motion.div>
      </ScrollArea>

      {/* Botão flutuante de voltar ao topo */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 right-4 z-50"
          >
            <Button
              size="icon"
              onClick={scrollToTop}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 shadow-xl"
            >
              <ChevronUp className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PoliticaArtigoView;
