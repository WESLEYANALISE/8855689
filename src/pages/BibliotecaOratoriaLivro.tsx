import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Loader2, BookOpen, Video, FileText, Crown } from "lucide-react";
import BibliotecaFavoritoButton from "@/components/biblioteca/BibliotecaFavoritoButton";
import { useState } from "react";
import PDFViewerModal from "@/components/PDFViewerModal";
import PDFReaderModeSelector from "@/components/PDFReaderModeSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "@/components/VideoPlayer";
import LivroResumoPlayer from "@/components/biblioteca/LivroResumoPlayer";
import { toast } from "sonner";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";

const BibliotecaOratoriaLivro = () => {
  const { livroId } = useParams();
  const navigate = useNavigate();
  const [showPDF, setShowPDF] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'vertical'>('normal');
  const [activeTab, setActiveTab] = useState("sobre");
  const [showResumo, setShowResumo] = useState(false);
  const [isLoadingResumo, setIsLoadingResumo] = useState(false);
  const [resumoData, setResumoData] = useState<any>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium } = useSubscription();

  const { data: livro, isLoading, refetch } = useQuery({
    queryKey: ["biblioteca-oratoria-livro", livroId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-ORATORIA")
        .select("*")
        .eq("id", livroId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleReadClick = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setShowModeSelector(true);
  };

  const handleDownloadClick = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    if (livro?.download) {
      window.open(livro.download, "_blank");
    }
  };

  const handleOpenResumo = async () => {
    if (!livro) return;

    if (livro.resumo_capitulos && livro.questoes_resumo) {
      setResumoData({
        resumo_capitulos: livro.resumo_capitulos,
        questoes_resumo: livro.questoes_resumo
      });
      setShowResumo(true);
      return;
    }

    setShowResumo(true);
    setIsLoadingResumo(true);

    try {
      const response = await supabase.functions.invoke('gerar-resumo-livro', {
        body: {
          livroId: parseInt(livroId || "0"),
          biblioteca: 'oratoria',
          titulo: livro.livro,
          autor: livro.autor,
          sobre: livro.sobre
        }
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        setResumoData({
          resumo_capitulos: response.data.resumo_capitulos,
          questoes_resumo: response.data.questoes_resumo
        });
        refetch();
      } else {
        throw new Error(response.data?.error || 'Erro ao gerar resumo');
      }
    } catch (error: any) {
      console.error('Erro ao gerar resumo:', error);
      toast.error('Erro ao gerar resumo. Tente novamente.');
      setShowResumo(false);
    } finally {
      setIsLoadingResumo(false);
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
        <Button onClick={() => navigate('/biblioteca-oratoria')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 pb-20 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center">
          {/* Capa com Badge Premium */}
          <div className="relative w-56 md:w-72 mb-8 rounded-xl overflow-hidden shadow-2xl hover:shadow-accent/50 transition-shadow duration-300">
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
            {/* Badge Premium */}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white text-[10px] font-semibold shadow-lg">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          </div>

          <div className="w-full max-w-2xl text-center space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{livro.livro}</h1>
              {livro.autor && (
                <p className="text-lg text-muted-foreground">{livro.autor}</p>
              )}
            </div>

            <div className="flex justify-center gap-3 mb-6">
              {livro.link && (
                <Button
                  onClick={handleReadClick}
                  size="lg"
                  className="shadow-lg hover:shadow-accent/50 transition-all"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Ler agora
                </Button>
              )}
              <BibliotecaFavoritoButton
                itemId={livro.id}
                titulo={livro.livro || ""}
                bibliotecaTabela="BIBLIOTECA-ORATORIA"
                capaUrl={livro.imagem}
              />
              <Button
                onClick={handleOpenResumo}
                size="lg"
                variant="outline"
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground shadow-lg transition-all"
              >
                <FileText className="w-5 h-5 mr-2" />
                Resumo
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="sobre">Sobre</TabsTrigger>
                <TabsTrigger value="aula" disabled={!livro.aula}>Aula</TabsTrigger>
                <TabsTrigger value="download" disabled={!livro.download}>Download</TabsTrigger>
              </TabsList>

              <TabsContent value="sobre">
                <div className="space-y-4">
                  {livro.sobre && (
                    <div className="text-left bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-accent/20">
                      <h2 className="text-xl font-semibold mb-4">Sobre o livro</h2>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {livro.sobre}
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
                        Assista à aula completa sobre este livro
                      </p>
                    </div>
                  </div>
                )}
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
                      <Button
                        onClick={handleDownloadClick}
                        size="lg"
                        className="min-w-[200px]"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Baixar Agora
                      </Button>
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
        </div>
      </div>

      <PDFReaderModeSelector
        isOpen={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        onSelectMode={(mode) => {
          if (mode === 'dinamica') return;
          setViewMode(mode);
          setShowModeSelector(false);
          setShowPDF(true);
        }}
        bookTitle={livro?.livro || ''}
      />

      {livro?.link && (
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
        livroId={livro.id}
        biblioteca="oratoria"
        onImagemGerada={() => refetch()}
      />

      <PremiumUpgradeModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        featureName="Este livro"
      />
    </div>
  );
};

export default BibliotecaOratoriaLivro;
