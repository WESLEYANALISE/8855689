import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Book, BookOpen, Monitor, Download, Crown, Lock } from 'lucide-react';
import { buscarDetalhesLivro } from '@/lib/googleBooksApi';
import PDFViewerModal from '@/components/PDFViewerModal';
import PDFReaderModeSelector from '@/components/PDFReaderModeSelector';
import { toast } from 'sonner';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal';

export default function PoliticaLivroDetalhe() {
  const { livroId } = useParams<{ livroId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isPremium } = useSubscription();
  const [activeTab, setActiveTab] = useState('sobre');
  
  // Verificar se é acesso gratuito (primeiro livro - não pode baixar)
  const isFreeAccess = location.state?.isFreeAccess === true;
  
  // Estados para leitura
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'vertical'>('normal');

  // Buscar dados do livro na nova tabela BIBLIOTECA-POLITICA
  const { data: livro, isLoading: loadingLivro } = useQuery({
    queryKey: ['biblioteca-politica-livro', livroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BIBLIOTECA-POLITICA')
        .select('*')
        .eq('id', Number(livroId))
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!livroId,
  });

  // Buscar detalhes do Google Books (apenas se não tiver capa salva)
  const { data: googleBook } = useQuery({
    queryKey: ['google-book-politica', livro?.livro, livro?.autor],
    queryFn: async () => {
      if (!livro?.livro) return null;
      return buscarDetalhesLivro(livro.livro, livro.autor || undefined);
    },
    enabled: !!livro?.livro && !livro?.imagem,
    staleTime: 1000 * 60 * 60,
  });

  // Salvar capa no banco se veio do Google Books
  React.useEffect(() => {
    if (googleBook?.thumbnail && livro?.id && !livro?.imagem) {
      supabase
        .from('BIBLIOTECA-POLITICA')
        .update({ imagem: googleBook.thumbnail })
        .eq('id', livro.id)
        .then(() => console.log('Capa salva no banco'));
    }
  }, [googleBook?.thumbnail, livro?.id, livro?.imagem]);

  const handleSelectMode = (mode: 'normal' | 'vertical' | 'dinamica') => {
    setShowModeSelector(false);
    
    if (mode === 'normal') {
      toast.info('Modo paginação em breve!');
      return;
    }
    
    if (mode === 'vertical') {
      if (!livro?.link) {
        toast.error('Link de leitura não disponível');
        return;
      }
      setViewMode('vertical');
      setShowPDF(true);
    }
  };

  if (loadingLivro) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-10 w-40 mb-6" />
        <Skeleton className="aspect-[2/3] w-48 mx-auto mb-6" />
        <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
        <Skeleton className="h-4 w-1/2 mx-auto mb-6" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!livro) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
        <Book className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Livro não encontrado</p>
        <Button variant="link" onClick={() => navigate('/politica')}>
          Voltar
        </Button>
      </div>
    );
  }

  const capa = livro.imagem || googleBook?.thumbnail;
  const temLinkLeitura = !!livro.link;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-background/95 backdrop-blur-sm border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-sm truncate">Detalhes do Livro</h1>
      </div>

      <div className="px-4 py-6">
        {/* Capa do livro */}
        <div className="flex justify-center mb-6">
          {capa ? (
            <img
              src={capa}
              alt={livro.livro || ''}
              className="w-48 aspect-[2/3] object-cover rounded-lg shadow-2xl shadow-black/50"
            />
          ) : (
            <div className="w-48 aspect-[2/3] bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
              <Book className="w-16 h-16 text-primary/40" />
            </div>
          )}
        </div>

        {/* Título e autor */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">{livro.livro}</h1>
          {livro.autor && (
            <p className="text-muted-foreground">{livro.autor}</p>
          )}
        </div>

        {/* Botão Ler Agora - Premium Only */}
        <div className="flex justify-center mb-6">
          {temLinkLeitura && (
            isPremium ? (
              <Button
                onClick={() => setShowModeSelector(true)}
                size="lg"
                className="shadow-lg hover:shadow-accent/50 transition-all"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Ler agora
              </Button>
            ) : (
              <Button
                onClick={() => setShowPremiumModal(true)}
                size="lg"
                className="shadow-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                <Lock className="w-5 h-5 mr-2" />
                Desbloquear Leitura
              </Button>
            )
          )}
        </div>

        {/* Tabs: Sobre, Desktop, Download */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="sobre">Sobre</TabsTrigger>
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
            <TabsTrigger value="download" disabled={!livro.download}>Download</TabsTrigger>
          </TabsList>

          <TabsContent value="sobre">
            <div className="text-left bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-accent/20">
              <h2 className="text-xl font-semibold mb-4">Sobre o livro</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {livro.sobre || googleBook?.description || 'Descrição não disponível.'}
              </p>
              
              {livro.beneficios && (
                <>
                  <h3 className="text-lg font-semibold mt-6 mb-3">Benefícios da leitura</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {livro.beneficios}
                  </p>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="desktop">
            <div className="text-center bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-accent/20">
              <Monitor className="w-16 h-16 mx-auto mb-4 text-accent" />
              <h2 className="text-xl font-semibold mb-4">Acesso Desktop</h2>
              <p className="text-muted-foreground mb-6">
                Leia este livro diretamente no seu computador através do nosso sistema desktop
              </p>
              <Button
                onClick={() => navigate("/acesso-desktop")}
                size="lg"
                className="min-w-[200px]"
              >
                <Monitor className="w-5 h-5 mr-2" />
                Acessar Desktop
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="download">
            <div className="text-center bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-accent/20">
              {livro.download ? (
                <>
                  <Download className="w-16 h-16 mx-auto mb-4 text-accent" />
                  <h2 className="text-xl font-semibold mb-4">Download do Livro</h2>
                  <p className="text-muted-foreground mb-6">
                    Faça o download do livro para ler offline
                  </p>
                  {isPremium && !isFreeAccess ? (
                    <Button
                      onClick={() => window.open(livro.download!, "_blank")}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Baixar Agora
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-amber-500/90">
                        {isFreeAccess 
                          ? 'Este livro está disponível para leitura gratuita, mas o download é exclusivo para assinantes Premium'
                          : 'O download de livros é exclusivo para assinantes Premium'
                        }
                      </p>
                      <Button
                        onClick={() => navigate('/assinatura')}
                        size="lg"
                        className="min-w-[200px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                      >
                        <Crown className="w-5 h-5 mr-2" />
                        Premium
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Download className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl font-semibold mb-4">Em breve</h2>
                  <p className="text-muted-foreground">
                    Download estará disponível em breve
                  </p>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal seletor de modo de leitura */}
      <PDFReaderModeSelector
        isOpen={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        onSelectMode={handleSelectMode}
        bookTitle={livro.livro || ''}
        hasLeituraDinamica={false}
      />

      {/* Viewer do PDF */}
      {livro.link && (
        <PDFViewerModal
          isOpen={showPDF}
          onClose={() => setShowPDF(false)}
          normalModeUrl={livro.link}
          verticalModeUrl={livro.link}
          title={livro.livro || ''}
          viewMode={viewMode}
        />
      )}

      {/* Modal Premium */}
      <PremiumUpgradeModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        featureName="Leitura de livros de política"
      />
    </div>
  );
}
