import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Loader2, BookOpen, Monitor, Sparkles, Crown } from "lucide-react";
import BibliotecaFavoritoButton from "@/components/biblioteca/BibliotecaFavoritoButton";
import { useState } from "react";
import PDFViewerModal from "@/components/PDFViewerModal";
import PDFReaderModeSelector from "@/components/PDFReaderModeSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useSubscription } from "@/contexts/SubscriptionContext";

const BibliotecaEstudosLivro = () => {
  const { livroId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPDF, setShowPDF] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'vertical'>('normal');
  const [activeTab, setActiveTab] = useState("sobre");
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const { isPremium } = useSubscription();

  const { data: livro, isLoading, refetch } = useQuery({
    queryKey: ["biblioteca-estudos-livro", livroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("*")
        .eq("id", parseInt(livroId || "0"))
        .single();

      if (error) throw error;
      return data;
    },
  });


  const handleGenerateCover = async () => {
    if (!livro) return;
    
    setIsGeneratingCover(true);
    toast.info("Gerando capa com IA...", { duration: 5000 });

    try {
      const response = await supabase.functions.invoke('gerar-capa-biblioteca', {
        body: {
          livroId: livro.id,
          titulo: livro.Tema,
          area: livro.Área
        }
      });

      if (response.error) throw response.error;

      if (response.data?.url_capa) {
        toast.success("Capa gerada com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["biblioteca-estudos"] });
        refetch();
      } else {
        throw new Error(response.data?.error || 'Erro ao gerar capa');
      }
    } catch (error: any) {
      console.error('Erro ao gerar capa:', error);
      toast.error(error.message || 'Erro ao gerar capa. Tente novamente.');
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const capaUrl = livro?.["Capa-livro"] || livro?.url_capa_gerada;
  const podeGerarCapa = !capaUrl && livro;

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
        <Button onClick={() => navigate('/biblioteca-estudos')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 pb-20 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center">
          <div className="relative w-40 md:w-48 mb-8 rounded-xl overflow-hidden shadow-2xl hover:shadow-accent/50 transition-shadow duration-300">
            {capaUrl ? (
              <div className="w-full aspect-[2/3]">
                <img
                  src={capaUrl}
                  alt={livro.Tema || ""}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            ) : (
              <div className="w-full aspect-[2/3] bg-gradient-to-br from-accent/20 to-primary/20 flex flex-col items-center justify-center gap-4 p-4">
                <BookOpen className="w-16 h-16 text-accent/50" />
                {podeGerarCapa && (
                  <Button
                    onClick={handleGenerateCover}
                    disabled={isGeneratingCover}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    {isGeneratingCover ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-1" />
                        Gerar Capa
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            <div className="absolute bottom-0 left-0 bg-primary/90 text-white text-sm font-bold px-2 py-1 rounded-tr-lg">
              {String(livro.Ordem || livro.id).padStart(2, '0')}
            </div>
            <div className="absolute bottom-0 right-0 bg-black/80 text-white/90 text-xs font-medium px-2 py-1 rounded-tl-lg">
              2026
            </div>
          </div>

          <div className="w-full max-w-2xl text-center space-y-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-2">{livro.Tema}</h1>
              {livro.Área && (
                <p className="text-lg text-muted-foreground">{livro.Área}</p>
              )}
            </div>

            <div className="flex justify-center gap-3 mb-6">
              {livro.Link && (
                <Button
                  onClick={() => setShowModeSelector(true)}
                  size="lg"
                  className="shadow-lg hover:shadow-accent/50 transition-all"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Ler agora
                </Button>
              )}
              <BibliotecaFavoritoButton
                itemId={livro.id}
                titulo={livro.Tema || ""}
                bibliotecaTabela="BIBLIOTECA-ESTUDOS"
                capaUrl={livro["Capa-livro"]}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="sobre">Sobre</TabsTrigger>
                <TabsTrigger value="desktop">Desktop</TabsTrigger>
                <TabsTrigger value="download" disabled={!livro.Download}>Download</TabsTrigger>
              </TabsList>

              <TabsContent value="sobre">
                {livro.Sobre && (
                  <div className="text-left bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-accent/20">
                    <h2 className="text-xl font-semibold mb-4">Sobre o livro</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {livro.Sobre}
                    </p>
                  </div>
                )}
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
                  {livro.Download ? (
                    <>
                      <Download className="w-16 h-16 mx-auto mb-4 text-accent" />
                      <h2 className="text-xl font-semibold mb-4">Download do Livro</h2>
                      <p className="text-muted-foreground mb-6">
                        Faça o download do livro para ler offline
                      </p>
                      {isPremium ? (
                        <Button
                          onClick={() => window.open(livro.Download!, "_blank")}
                          size="lg"
                          className="min-w-[200px]"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Baixar Agora
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-amber-500/90">
                            O download de livros é exclusivo para assinantes Premium
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
        bookTitle={livro?.Tema || ''}
      />

      {livro?.Link && (
        <PDFViewerModal
          isOpen={showPDF}
          onClose={() => setShowPDF(false)}
          normalModeUrl={livro.Link}
          verticalModeUrl={livro.Download || livro.Link}
          title={livro.Tema || "Livro"}
          viewMode={viewMode}
        />
      )}
    </div>
  );
};

export default BibliotecaEstudosLivro;