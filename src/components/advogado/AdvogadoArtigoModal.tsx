import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, BookOpen, ImagePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MultiAudioPlayer } from '@/components/resumos/MultiAudioPlayer';

interface Artigo {
  id: number;
  ordem: number;
  titulo: string;
  descricao_curta: string | null;
  url_capa: string | null;
  conteudo_gerado: string | null;
  fonte_url: string | null;
  url_audio: string | null;
}

interface AdvogadoArtigoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artigo: Artigo | null;
}

export const AdvogadoArtigoModal = ({ open, onOpenChange, artigo }: AdvogadoArtigoModalProps) => {
  const [conteudo, setConteudo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [urlCapa, setUrlCapa] = useState<string | null>(null);
  const [isGeneratingCapa, setIsGeneratingCapa] = useState(false);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = 'unset';
      return;
    }
    
    document.body.style.overflow = 'hidden';
    
    // Resetar URL da capa
    setUrlCapa(artigo?.url_capa || null);
    
    if (artigo?.conteudo_gerado) {
      setConteudo(artigo.conteudo_gerado);
      setLoading(false);
    } else if (artigo) {
      gerarArtigo();
    }

    // Carregar URL de áudio se existir
    if (artigo?.url_audio) {
      setAudioUrls([artigo.url_audio]);
    } else {
      setAudioUrls([]);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open, artigo]);

  const gerarArtigo = async () => {
    if (!artigo) return;
    
    setLoading(true);
    setGerando(true);

    try {
      const { data, error } = await supabase.functions.invoke('gerar-artigo-advogado', {
        body: { ordem: artigo.ordem }
      });

      if (error) throw error;

      if (data?.conteudo) {
        setConteudo(data.conteudo);
        toast.success('Artigo gerado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar artigo:', error);
      toast.error('Erro ao gerar artigo. Tente novamente.');
    } finally {
      setLoading(false);
      setGerando(false);
    }
  };

  const gerarNarracao = async () => {
    if (!artigo || !conteudo) return;

    setIsGeneratingAudio(true);
    toast.info('Gerando narração...', { duration: 5000 });

    try {
      const { data, error } = await supabase.functions.invoke('gerar-narracao-advogado', {
        body: { 
          texto: conteudo,
          ordem: artigo.ordem
        }
      });

      if (error) throw error;

      if (data?.audioUrls && data.audioUrls.length > 0) {
        setAudioUrls(data.audioUrls);
        toast.success('Narração gerada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar narração:', error);
      toast.error('Erro ao gerar narração. Tente novamente.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const gerarCapa = async () => {
    if (!artigo) return;
    setIsGeneratingCapa(true);
    toast.info('Gerando capa com IA...', { duration: 8000 });

    try {
      const { data, error } = await supabase.functions.invoke('gerar-capa-advogado', {
        body: { artigoId: artigo.id, titulo: artigo.titulo }
      });

      if (error) throw error;
      setUrlCapa(data.imagem_url);

      if (!data.fromCache) {
        toast.success('Capa gerada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar capa:', error);
      toast.error('Erro ao gerar capa');
    } finally {
      setIsGeneratingCapa(false);
    }
  };

  if (!open || !artigo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-sm truncate flex-1">{artigo.titulo}</h2>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Imagem de capa com botão de gerar */}
        <div className="aspect-video rounded-xl overflow-hidden mb-8 bg-gradient-to-br from-red-500/20 to-red-600/10">
          {urlCapa ? (
            <img
              src={urlCapa}
              alt={artigo.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <BookOpen className="w-16 h-16 text-red-400/50" />
              <Button
                onClick={gerarCapa}
                disabled={isGeneratingCapa}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isGeneratingCapa ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando capa...
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-4 h-4" />
                    Gerar capa com IA
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Título - fonte menor e mais espaçamento como no blog jurídico */}
        <h1 className="text-xl font-bold mb-2 leading-tight text-foreground">{artigo.titulo}</h1>
        {artigo.descricao_curta && (
          <p className="text-muted-foreground mb-6">{artigo.descricao_curta}</p>
        )}

        {/* Player de áudio */}
        {!loading && conteudo && (
          <div className="mb-8">
            <MultiAudioPlayer
              audioUrls={audioUrls}
              onGenerate={gerarNarracao}
              isLoading={isGeneratingAudio}
              label="Ouvir narração"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {gerando && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando artigo com IA...</span>
              </div>
            )}
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-9/12" />
            <Skeleton className="h-4 w-11/12" />
          </div>
        )}

        {/* Conteúdo gerado - mesma estrutura do blog jurídico */}
        {!loading && conteudo && (
          <article className="prose prose-invert prose-slate max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold text-foreground mt-8 mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold text-foreground mt-6 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="text-muted-foreground mb-4 leading-relaxed text-sm">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 text-muted-foreground mb-4 space-y-2 text-sm">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 text-muted-foreground mb-4 space-y-2 text-sm">{children}</ol>,
                li: ({ children }) => <li className="text-muted-foreground [&>p]:inline [&>p]:m-0 text-sm">{children}</li>,
                strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-red-500 pl-4 italic text-muted-foreground my-4">
                    {children}
                  </blockquote>
                )
              }}
            >
              {conteudo}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
};
