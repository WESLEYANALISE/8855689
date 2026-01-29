import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Heart, Clock, Youtube, Eye, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentarioReacoes } from '@/components/politica/DocumentarioReacoes';
import { DocumentarioComentarios } from '@/components/politica/DocumentarioComentarios';
import ReactMarkdown from 'react-markdown';

const PoliticaDocumentarioDetalhe = () => {
  const { documentarioId } = useParams<{ documentarioId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sobre');
  const [isFavorito, setIsFavorito] = useState(false);
  const [sobreGerado, setSobreGerado] = useState<string | null>(null);
  const [analiseGerada, setAnaliseGerada] = useState<string | null>(null);
  const [gerandoSobre, setGerandoSobre] = useState(false);
  const [gerandoAnalise, setGerandoAnalise] = useState(false);

  // Buscar documentário
  const { data: documentario, isLoading } = useQuery({
    queryKey: ['politica-documentario', documentarioId],
    queryFn: async () => {
      if (!documentarioId) throw new Error('ID não encontrado');
      
      const { data, error } = await supabase
        .from('politica_documentarios')
        .select('*')
        .eq('id', documentarioId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!documentarioId,
  });

  // Realtime para comentários
  useEffect(() => {
    if (!documentarioId) return;

    const channel = supabase
      .channel('documentario-comentarios-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'politica_documentarios_comentarios',
          filter: `documentario_id=eq.${documentarioId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['documentario-comentarios', documentarioId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentarioId, queryClient]);

  // Carregar conteúdo gerado
  useEffect(() => {
    if (documentario) {
      setSobreGerado(documentario.sobre_gerado || null);
      setAnaliseGerada(documentario.analise_gerada || null);
    }
  }, [documentario]);

  const gerarConteudo = async (tipo: 'sobre' | 'analise') => {
    if (!documentarioId) return;
    
    if (tipo === 'sobre') {
      setGerandoSobre(true);
    } else {
      setGerandoAnalise(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('gerar-analise-documentario', {
        body: { documentarioId, tipo }
      });

      if (error) throw error;

      if (tipo === 'sobre') {
        setSobreGerado(data.content);
      } else {
        setAnaliseGerada(data.content);
      }

      if (!data.cached) {
        toast.success(`${tipo === 'sobre' ? 'Sobre' : 'Análise'} gerado com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      toast.error('Erro ao gerar conteúdo');
    } finally {
      if (tipo === 'sobre') {
        setGerandoSobre(false);
      } else {
        setGerandoAnalise(false);
      }
    }
  };

  // Gerar sobre automaticamente ao carregar a aba
  useEffect(() => {
    if (activeTab === 'sobre' && documentario && !sobreGerado && !gerandoSobre) {
      gerarConteudo('sobre');
    }
    if (activeTab === 'analise' && documentario && !analiseGerada && !gerandoAnalise) {
      gerarConteudo('analise');
    }
  }, [activeTab, documentario, sobreGerado, analiseGerada]);

  const handleFavoritar = () => {
    if (!user) {
      toast.error('Faça login para favoritar');
      navigate('/auth');
      return;
    }
    setIsFavorito(!isFavorito);
    toast.success(isFavorito ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
  };

  const getOrientacaoConfig = (orientacao: string) => {
    switch (orientacao) {
      case 'esquerda':
        return { color: 'bg-red-500', textColor: 'text-red-400' };
      case 'centro':
        return { color: 'bg-yellow-500', textColor: 'text-yellow-400' };
      case 'direita':
        return { color: 'bg-blue-500', textColor: 'text-blue-400' };
      default:
        return { color: 'bg-primary', textColor: 'text-primary' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 pb-20">
        <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-neutral-900/95 backdrop-blur-sm border-b border-white/5">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 flex-1 rounded-lg" />
        </div>
        <Skeleton className="w-full aspect-video" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!documentario) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Documentário não encontrado</p>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const config = getOrientacaoConfig(documentario.orientacao);

  return (
    <div className="min-h-screen bg-neutral-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 p-4 bg-neutral-900/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="flex-shrink-0 hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-sm truncate">{documentario.titulo}</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFavoritar}
          className="hover:bg-white/10"
        >
          <Heart className={`h-5 w-5 transition-colors ${isFavorito ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </div>

      {/* Video Player */}
      <div className="w-full aspect-video bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${documentario.video_id}?rel=0`}
          title={documentario.titulo}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Reações */}
      <DocumentarioReacoes documentarioId={documentario.id} />

      {/* Tabs */}
      <div className="px-4 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-card/50">
            <TabsTrigger value="sobre" className="flex items-center gap-2 text-xs">
              <Eye className="w-4 h-4" />
              Sobre
            </TabsTrigger>
            <TabsTrigger value="comentarios" className="flex items-center gap-2 text-xs">
              <MessageSquare className="w-4 h-4" />
              Comentários
              {documentario.total_comentarios > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 rounded-full">
                  {documentario.total_comentarios}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analise" className="flex items-center gap-2 text-xs">
              <Sparkles className="w-4 h-4" />
              Análise
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sobre" className="mt-4 space-y-4">
            {/* Título */}
            <h2 className="text-lg font-bold text-white">{documentario.titulo}</h2>
            
            {/* Metadados */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Youtube className="w-4 h-4 text-red-500" />
                <span>{documentario.canal}</span>
              </div>
              {documentario.duracao && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{documentario.duracao}</span>
                </div>
              )}
              {documentario.visualizacoes && (
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{documentario.visualizacoes} views</span>
                </div>
              )}
            </div>

            {/* Badge de orientação */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${config.color}/20 ${config.textColor}`}>
              <div className={`w-2 h-2 rounded-full ${config.color}`} />
              {documentario.orientacao.charAt(0).toUpperCase() + documentario.orientacao.slice(1)}
            </div>

            {/* Sobre gerado pela IA */}
            <div className="space-y-2">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Sobre o Documentário
              </h3>
              {gerandoSobre ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gerando análise com IA...</span>
                </div>
              ) : sobreGerado ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{sobreGerado}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Clique para gerar uma descrição detalhada com IA.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comentarios" className="mt-4">
            <DocumentarioComentarios documentarioId={documentario.id} />
          </TabsContent>

          <TabsContent value="analise" className="mt-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-white">Análise Crítica com IA</h3>
            </div>

            {gerandoAnalise ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Gerando análise crítica com IA...</span>
              </div>
            ) : analiseGerada ? (
              <div className="prose prose-sm prose-invert max-w-none bg-card/30 rounded-lg p-4">
                <ReactMarkdown>{analiseGerada}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  A análise crítica será gerada automaticamente.
                </p>
                <Button onClick={() => gerarConteudo('analise')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Análise
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PoliticaDocumentarioDetalhe;
