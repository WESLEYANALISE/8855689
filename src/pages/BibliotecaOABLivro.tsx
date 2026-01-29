import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";
import { Download, Loader2, BookOpen, Monitor, Video } from "lucide-react";
import { useState } from "react";
import PDFViewerModal from "@/components/PDFViewerModal";
import PDFReaderModeSelector from "@/components/PDFReaderModeSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "@/components/VideoPlayer";

const BibliotecaOABLivro = () => {
  const { livroId } = useParams();
  const navigate = useNavigate();
  const { goBack } = useHierarchicalNavigation();
  const [showPDF, setShowPDF] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'vertical'>('normal');
  const [activeTab, setActiveTab] = useState("");

  const { data: livro, isLoading } = useQuery({
    queryKey: ["biblioteca-oab-livro", livroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBILIOTECA-OAB")
        .select("*")
        .eq("id", parseInt(livroId || "0"))
        .single();

      if (error) throw error;
      
      if (data && !activeTab) {
        if (data.aula) {
          setActiveTab("aula");
        } else {
          setActiveTab("sobre");
        }
      }
      
      return data;
    },
  });

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
        <Button onClick={goBack}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 pb-20 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center">
          <div className="w-56 md:w-72 mb-8 rounded-xl overflow-hidden shadow-2xl hover:shadow-accent/50 transition-shadow duration-300">
            {livro["Capa-livro"] ? (
              <div className="w-full aspect-[2/3]">
                <img
                  src={livro["Capa-livro"]}
                  alt={livro.Tema || ""}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            ) : (
              <div className="w-full aspect-[2/3] bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <BookOpen className="w-24 h-24 text-accent/50" />
              </div>
            )}
          </div>

          <div className="w-full max-w-2xl text-center space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{livro.Tema}</h1>
              {livro.Área && (
                <p className="text-lg text-muted-foreground">{livro.Área}</p>
              )}
            </div>

            {livro.Link && (
              <div className="flex justify-center mb-6">
                <Button
                  onClick={() => setShowModeSelector(true)}
                  size="lg"
                  className="min-w-[200px] shadow-lg hover:shadow-accent/50 transition-all"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Ler agora
                </Button>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="sobre">Sobre</TabsTrigger>
                <TabsTrigger value="aula" disabled={!livro.aula}>Aula</TabsTrigger>
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

              <TabsContent value="aula">
                {livro.aula && (
                  <div className="bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden border border-accent/20">
                    <div className="aspect-video">
                      <VideoPlayer src={livro.aula} autoPlay={false} />
                    </div>
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Videoaula sobre {livro.Tema}
                      </h2>
                      <p className="text-muted-foreground">
                        Assista à aula completa sobre este material
                      </p>
                    </div>
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
                      <Button
                        onClick={() => window.open(livro.Download!, "_blank")}
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

export default BibliotecaOABLivro;
