import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUp, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCacheFirstArticles } from "@/hooks/useCacheFirstArticles";
import { useAutoNarracaoGeneration } from "@/hooks/useAutoNarracaoGeneration";
import { BuscaCompacta } from "@/components/BuscaCompacta";
import { NarracaoGenerationCard } from "@/components/NarracaoGenerationCard";
import { ArtigoListaCompacta } from "@/components/ArtigoListaCompacta";
import { ArtigoFullscreenDrawer } from "@/components/ArtigoFullscreenDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import TermosModal from "@/components/TermosModal";
import QuestoesModal from "@/components/QuestoesModal";
import PerguntaModal from "@/components/PerguntaModal";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { VadeMecumTabs } from "@/components/VadeMecumTabs";
import { VadeMecumPlaylist } from "@/components/VadeMecumPlaylist";
import { VadeMecumRanking } from "@/components/VadeMecumRanking";

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

const PacoteAnticrimeView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [targetArticleNumber, setTargetArticleNumber] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(100);
  
  const [stickyPlayerOpen, setStickyPlayerOpen] = useState(false);
  const [currentAudio, setCurrentAudio] = useState({ url: "", title: "", isComment: false });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ artigo: "", numeroArtigo: "", tipo: "explicacao" as "explicacao" | "exemplo", nivel: "tecnico" as "tecnico" | "simples" });
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalData, setVideoModalData] = useState({ videoUrl: "", artigo: "", numeroArtigo: "" });
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
  const [flashcardsData, setFlashcardsData] = useState<any[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [termosModalOpen, setTermosModalOpen] = useState(false);
  const [termosData, setTermosData] = useState({ artigo: "", numeroArtigo: "" });
  const [questoesModalOpen, setQuestoesModalOpen] = useState(false);
  const [questoesData, setQuestoesData] = useState({ artigo: "", numeroArtigo: "" });
  const [perguntaModalOpen, setPerguntaModalOpen] = useState(false);
  const [perguntaData, setPerguntaData] = useState({ artigo: "", numeroArtigo: "" });
  const [activeTab, setActiveTab] = useState<'artigos' | 'playlist' | 'ranking'>('artigos');
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const tableName = "Lei 13.964 de 2019 - Pacote Anticrime";
  const codeName = "Pacote Anticrime";
  const abbreviation = "PAC";

  const handleScrollPastArticle7 = useCallback((isPast: boolean) => {
    setShowScrollTop(isPast);
  }, []);

  const scrollToTopSmooth = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const artigoParam = searchParams.get('artigo');
    if (artigoParam) {
      setSearchInput(artigoParam);
      setTargetArticleNumber(artigoParam);
      setSearchQuery(artigoParam);
    }
  }, [searchParams]);

  const { articles, isLoading, updateArticle } = useCacheFirstArticles<Article>({
    tableName,
    orderBy: "id"
  });

  const {
    isGeneratingNarracoes,
    currentGeneratingArtigo,
    generatedNarracoesCount,
    totalNarracoesToGenerate
  } = useAutoNarracaoGeneration({
    articles,
    isLoading,
    tableName,
    updateArticle,
    enabled: false // Desativado - geração automática pausada
  });

  const filteredArticles = useMemo(() => articles, [articles]);
  
  const displayedArticles = useMemo(() => {
    return filteredArticles.slice(0, displayLimit);
  }, [filteredArticles, displayLimit]);

  const articlesWithAudio = useMemo(() => {
    return articles.filter(article => 
      article["Narração"] && article["Narração"].trim() !== "" &&
      article["Número do Artigo"] && article["Número do Artigo"].trim() !== ""
    ) as any[];
  }, [articles]);

  const handleAnimatedSearch = useCallback(() => {
    if (!searchInput.trim()) return;
    setTargetArticleNumber(searchInput.trim());
    setSearchQuery(searchInput.trim());
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setTargetArticleNumber(null);
  }, []);

  const currentArticleIndex = useMemo(() => {
    if (!selectedArticle) return -1;
    return articles.findIndex(a => a.id === selectedArticle.id);
  }, [selectedArticle, articles]);

  const handlePreviousArticle = useCallback(() => {
    if (articles.length === 0) return;
    if (currentArticleIndex <= 0) {
      setSelectedArticle(articles[articles.length - 1]);
    } else {
      setSelectedArticle(articles[currentArticleIndex - 1]);
    }
  }, [currentArticleIndex, articles]);

  const handleNextArticle = useCallback(() => {
    if (articles.length === 0) return;
    if (currentArticleIndex >= articles.length - 1) {
      setSelectedArticle(articles[0]);
    } else {
      setSelectedArticle(articles[currentArticleIndex + 1]);
    }
  }, [currentArticleIndex, articles]);

  const handleGenerateFlashcards = async (artigo: string, numeroArtigo: string) => {
    setLoadingFlashcards(true);
    try {
      const response = await supabase.functions.invoke('gerar-flashcards', {
        body: { content: `Art. ${numeroArtigo}\n${artigo}` }
      });
      if (response.error) throw response.error;
      setFlashcardsData(response.data.flashcards || []);
      setFlashcardsModalOpen(true);
    } catch (error) {
      console.error('Erro ao gerar flashcards:', error);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <VadeMecumTabs 
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      />

      {activeTab === 'artigos' && (
        <BuscaCompacta
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleAnimatedSearch}
          onClear={handleClearSearch}
          resultCount={searchQuery ? filteredArticles.length : 0}
        />
      )}

      <StickyAudioPlayer 
        isOpen={stickyPlayerOpen} 
        onClose={() => setStickyPlayerOpen(false)} 
        audioUrl={currentAudio.url} 
        title={currentAudio.title}
      />

      <ExplicacaoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} artigo={modalData.artigo} numeroArtigo={modalData.numeroArtigo} tipo={modalData.tipo} nivel={modalData.nivel} codigo="pac" codigoTabela={tableName} />
      <VideoAulaModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} videoUrl={videoModalData.videoUrl} artigo={videoModalData.artigo} numeroArtigo={videoModalData.numeroArtigo} />
      <TermosModal isOpen={termosModalOpen} onClose={() => setTermosModalOpen(false)} artigo={termosData.artigo} numeroArtigo={termosData.numeroArtigo} codigoTabela={tableName} />
      <QuestoesModal isOpen={questoesModalOpen} onClose={() => setQuestoesModalOpen(false)} artigo={questoesData.artigo} numeroArtigo={questoesData.numeroArtigo} />
      <PerguntaModal isOpen={perguntaModalOpen} onClose={() => setPerguntaModalOpen(false)} artigo={perguntaData.artigo} numeroArtigo={perguntaData.numeroArtigo} />
      
      {flashcardsModalOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-accent">Flashcards</h2>
              <button onClick={() => setFlashcardsModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingFlashcards ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Gerando flashcards...</p>
                  </div>
                </div>
              ) : (
                <FlashcardViewer flashcards={flashcardsData} />
              )}
            </div>
          </div>
        </div>
      )}

      <ArtigoFullscreenDrawer
        article={selectedArticle}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        codeName={codeName}
        onPlayComment={(url, title) => {
          setCurrentAudio({ url, title, isComment: true });
          setStickyPlayerOpen(true);
        }}
        onOpenAula={() => {
          if (selectedArticle?.["Aula"]) {
            setVideoModalData({
              videoUrl: selectedArticle["Aula"],
              artigo: selectedArticle["Artigo"] || "",
              numeroArtigo: selectedArticle["Número do Artigo"] || ""
            });
            setVideoModalOpen(true);
          }
        }}
        onOpenExplicacao={(artigo, numeroArtigo, tipo, nivel) => {
          setModalData({
            artigo,
            numeroArtigo,
            tipo,
            nivel: nivel || "tecnico"
          });
          setModalOpen(true);
        }}
        onGenerateFlashcards={() => {
          if (selectedArticle) {
            handleGenerateFlashcards(selectedArticle["Artigo"] || "", selectedArticle["Número do Artigo"] || "");
          }
        }}
        onOpenTermos={() => {
          if (selectedArticle) {
            setTermosData({
              artigo: selectedArticle["Artigo"] || "",
              numeroArtigo: selectedArticle["Número do Artigo"] || ""
            });
            setTermosModalOpen(true);
          }
        }}
        onOpenQuestoes={() => {
          if (selectedArticle) {
            setQuestoesData({
              artigo: selectedArticle["Artigo"] || "",
              numeroArtigo: selectedArticle["Número do Artigo"] || ""
            });
            setQuestoesModalOpen(true);
          }
        }}
        onPerguntar={() => {
          if (selectedArticle) {
            setPerguntaData({
              artigo: selectedArticle["Artigo"] || "",
              numeroArtigo: selectedArticle["Número do Artigo"] || ""
            });
            setPerguntaModalOpen(true);
          }
        }}
        onPreviousArticle={handlePreviousArticle}
        onNextArticle={handleNextArticle}
        hasPrevious={currentArticleIndex > 0}
        hasNext={currentArticleIndex < articles.length - 1}
      />

      <div ref={scrollAreaRef} className="max-w-4xl mx-auto">
        {activeTab === 'artigos' && (
          <div className="p-4">
            <NarracaoGenerationCard
              isGenerating={isGeneratingNarracoes}
              currentArtigo={currentGeneratingArtigo}
              generatedCount={generatedNarracoesCount}
              totalCount={totalNarracoesToGenerate}
            />
            {isLoading ? (
              <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : (
              <ArtigoListaCompacta
                articles={displayedArticles}
                onArtigoClick={(article) => {
                  setSelectedArticle(article);
                  setDrawerOpen(true);
                }}
                searchQuery={searchQuery}
                targetArticleNumber={targetArticleNumber}
                onScrollPastArticle7={handleScrollPastArticle7}
              />
            )}
          </div>
        )}

        {activeTab === 'playlist' && (
          <div className="p-4">
            <VadeMecumPlaylist 
              articles={articlesWithAudio} 
              codigoNome={codeName}
            />
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="p-4">
            <VadeMecumRanking 
              tableName={tableName}
              codigoNome={codeName}
              onArticleClick={(numeroArtigo) => {
                setTargetArticleNumber(numeroArtigo);
                setSearchQuery(numeroArtigo);
                setActiveTab('artigos');
              }}
            />
          </div>
        )}
      </div>

      {showScrollTop && (
        <div className="fixed bottom-28 right-4 z-30 animate-fade-in">
          <button onClick={scrollToTopSmooth} className="bg-accent hover:bg-accent/90 text-accent-foreground w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110">
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PacoteAnticrimeView;
