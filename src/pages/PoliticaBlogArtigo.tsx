import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Volume2, VolumeX, Share2, FileText, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
// Background music URL (hosted externally to reduce bundle size)
const backgroundMusic = "https://cdn.pixabay.com/audio/2024/02/14/audio_3d0ab4d36e.mp3";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PoliticaComentariosSection } from "@/components/politica/PoliticaComentariosSection";

const PoliticaBlogArtigo = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const [fontSize, setFontSize] = useState(17);
  const [activeTab, setActiveTab] = useState<'conteudo' | 'comentarios'>('conteudo');

  // Buscar artigo
  const { data: artigo, isLoading, error } = useQuery({
    queryKey: ['blogger-politico-artigo', id],
    queryFn: async () => {
      if (!id) throw new Error('ID não fornecido');
      
      const { data, error } = await supabase
        .from('BLOGGER_POLITICO' as any)
        .select('*')
        .eq('id', parseInt(id))
        .single();
      
      if (error) throw error;
      return data as any;
    },
    enabled: !!id
  });

  // Gerar conteúdo se não existir
  useEffect(() => {
    if (artigo && !artigo.conteudo_gerado && artigo.termo_wikipedia) {
      gerarConteudo();
    }
  }, [artigo]);

  const gerarConteudo = async () => {
    if (!artigo) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('gerar-conteudo-politico', {
        body: { 
          artigoId: artigo.id,
          termo: artigo.termo_wikipedia,
          titulo: artigo.titulo,
          categoria: artigo.categoria
        }
      });
      
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao gerar conteúdo:', err);
    }
  };

  const toggleAudio = () => {
    if (!artigo?.url_audio) {
      toast.error('Áudio não disponível');
      return;
    }

    if (isPlaying && audio) {
      audio.pause();
      // Parar música de fundo também
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    } else {
      const newAudio = new Audio(artigo.url_audio);
      
      // Iniciar música de fundo com volume baixo
      if (!backgroundAudioRef.current) {
        backgroundAudioRef.current = new Audio(backgroundMusic);
        backgroundAudioRef.current.loop = true;
      }
      backgroundAudioRef.current.volume = 0.15; // Volume baixo para não sobrepor a narração
      backgroundAudioRef.current.currentTime = 0;
      backgroundAudioRef.current.play();
      
      newAudio.onended = () => {
        setIsPlaying(false);
        // Parar música de fundo quando narração terminar
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.pause();
          backgroundAudioRef.current.currentTime = 0;
        }
      };
      newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);
    }
  };

  const handleShare = async () => {
    if (!artigo) return;
    
    const url = window.location.href;
    const text = `${artigo.titulo} - Direito Premium`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: artigo.titulo, text, url });
      } catch (err) {
        // User cancelled
      }
    } else {
      // Fallback para WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !artigo) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-muted-foreground">Artigo não encontrado</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header com imagem */}
      {(artigo.url_capa || artigo.imagem_wikipedia) && (
        <div className="relative h-48 md:h-64 w-full">
          <img 
            src={artigo.url_capa || artigo.imagem_wikipedia || ''}
            alt={artigo.titulo}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      )}

      <div className="px-4 py-6 max-w-3xl mx-auto">
      {/* Título */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{artigo.titulo}</h1>
          {artigo.descricao_curta && (
            <p className="text-muted-foreground mb-4">{artigo.descricao_curta}</p>
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2 mb-6">
          {artigo.url_audio && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleAudio}
              className="gap-2"
            >
              {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isPlaying ? 'Parar' : 'Ouvir'}
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
        </div>

        {/* Toggle Menu: Conteúdo / Comentários */}
        <div className="mb-6">
          <ToggleGroup 
            type="single" 
            value={activeTab} 
            onValueChange={(v) => v && setActiveTab(v as 'conteudo' | 'comentarios')}
            className="bg-muted/50 p-1 rounded-lg w-full"
          >
            <ToggleGroupItem 
              value="conteudo" 
              className="flex-1 gap-2 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md"
            >
              <FileText className="w-4 h-4" />
              Conteúdo
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="comentarios" 
              className="flex-1 gap-2 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md"
            >
              <MessageCircle className="w-4 h-4" />
              Comentários
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Conteúdo ou Comentários */}
        {activeTab === 'conteudo' ? (
          <>
            <Card>
              <CardContent className="p-4 md:p-6">
                {artigo.conteudo_gerado ? (
                  <article 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {artigo.conteudo_gerado}
                    </ReactMarkdown>
                  </article>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Gerando conteúdo...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fonte */}
            {artigo.fonte && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Fonte: {artigo.fonte === 'wikipedia' ? 'Wikipedia' : artigo.fonte}
              </p>
            )}
          </>
        ) : (
          <PoliticaComentariosSection artigoId={artigo.id} />
        )}
      </div>

      {/* Controles de fonte flutuantes */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-2 z-50">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg w-10 h-10"
          onClick={() => setFontSize(prev => Math.min(prev + 2, 24))}
        >
          A+
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg w-10 h-10"
          onClick={() => setFontSize(prev => Math.max(prev - 2, 12))}
        >
          A-
        </Button>
      </div>
    </div>
  );
};

export default PoliticaBlogArtigo;
