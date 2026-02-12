import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Loader2, BookOpen, Languages, Crown } from "lucide-react";
import BibliotecaFavoritoButton from "@/components/biblioteca/BibliotecaFavoritoButton";
import { useState } from "react";
import PDFViewerModal from "@/components/PDFViewerModal";
import PDFReaderModeSelector from "@/components/PDFReaderModeSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";

interface BibliotecaItem {
  id: number;
  area: string | null;
  livro: string | null;
  autor: string | null;
  imagem: string | null;
  sobre: string | null;
  link: string | null;
  download: string | null;
  beneficios: string | null;
  aula: string | null;
}

const BibliotecaPortuguesLivro = () => {
  const { livroId } = useParams();
  const navigate = useNavigate();
  const [showPDF, setShowPDF] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'vertical'>('normal');
  const [activeTab, setActiveTab] = useState("sobre");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium } = useSubscription();

  const { data: livro, isLoading } = useQuery({
    queryKey: ["biblioteca-portugues-livro", livroId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-PORTUGUES")
        .select("*")
        .eq("id", Number(livroId))
        .single();

      if (error) throw error;
      return data as BibliotecaItem;
    },
    enabled: !!livroId,
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
        <Button onClick={() => navigate('/biblioteca-portugues')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 pb-20 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center">
          {/* Capa do Livro com Badge Premium */}
          <div className="relative w-40 md:w-48 mb-8 rounded-xl overflow-hidden shadow-2xl hover:shadow-accent/50 transition-shadow duration-300">
            {livro.imagem ? (
              <div className="w-full aspect-[2/3]">
                <img
                  src={livro.imagem}
                  alt={livro.livro || ""}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            ) : (
              <div className="w-full aspect-[2/3] bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex flex-col items-center justify-center gap-4 p-4">
                <Languages className="w-16 h-16 text-blue-400/50" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 bg-blue-500/90 text-white text-sm font-bold px-2 py-1 rounded-tr-lg">
              {String(livro.id).padStart(2, '0')}
            </div>
            <div className="absolute bottom-0 right-0 bg-black/80 text-white/90 text-xs font-medium px-2 py-1 rounded-tl-lg">
              2026
            </div>
            {/* Badge Premium */}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white text-[10px] font-semibold shadow-lg">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          </div>

          <div className="w-full max-w-2xl text-center space-y-6">
            {/* Título e Autor */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-2">{livro.livro}</h1>
              {livro.autor && (
                <p className="text-lg text-muted-foreground">{livro.autor}</p>
              )}
            </div>

            {/* Botão Ler Agora */}
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
                bibliotecaTabela="BIBLIOTECA-PORTUGUES"
                capaUrl={livro.imagem}
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="sobre">Sobre</TabsTrigger>
                <TabsTrigger value="aula" disabled={!livro.aula}>Aula</TabsTrigger>
                <TabsTrigger value="download" disabled={!livro.download}>Download</TabsTrigger>
              </TabsList>

              <TabsContent value="sobre">
                {livro.sobre && (
                  <div className="text-left bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-accent/20">
                    <h2 className="text-xl font-semibold mb-4">Sobre o livro</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {livro.sobre}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="aula">
                {livro.aula && (
                  <div className="bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden border border-accent/20">
                    <div className="aspect-video">
                      <iframe
                        src={livro.aula}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-2">Videoaula sobre {livro.livro}</h2>
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

      <PremiumUpgradeModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        featureName="Este livro"
      />
    </div>
  );
};

export default BibliotecaPortuguesLivro;
