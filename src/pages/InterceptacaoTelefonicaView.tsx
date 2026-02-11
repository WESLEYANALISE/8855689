import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, X, Plus, Minus, ArrowUp } from "lucide-react";
import { BuscaCompacta } from "@/components/BuscaCompacta";
import { ArtigoListaCompacta } from "@/components/ArtigoListaCompacta";
import { ArtigoFullscreenDrawer } from "@/components/ArtigoFullscreenDrawer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import TermosModal from "@/components/TermosModal";
import QuestoesModal from "@/components/QuestoesModal";
import PerguntaModal from "@/components/PerguntaModal";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { formatTextWithUppercase } from "@/lib/textFormatter";
import { CopyButton } from "@/components/CopyButton";
import { VadeMecumTabs } from "@/components/VadeMecumTabs";
import { VadeMecumPlaylist } from "@/components/VadeMecumPlaylist";
import { VadeMecumRanking } from "@/components/VadeMecumRanking";
import { ArtigoActionsMenu } from "@/components/ArtigoActionsMenu";
import { useArticleTracking } from "@/hooks/useArticleTracking";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";
import { useCacheFirstArticles } from "@/hooks/useCacheFirstArticles";

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

const InterceptacaoTelefonicaView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const firstResultRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(15);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(500);
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
  const [viewMode, setViewMode] = useState<'lista' | 'expandido'>('lista');
  
  // Drawer state for fullscreen article view
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const tableName = "Lei 9.296 de 1996 - Interceptação Telefônica";
  const codeName = "Lei de Interceptação Telefônica";
  const abbreviation = "LIT";

  useEffect(() => {
    const artigoParam = searchParams.get('artigo');
    if (artigoParam) {
      setSearchQuery(artigoParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const increaseFontSize = () => {
    if (fontSize < 24) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cache-first loading
  const { articles, isLoading } = useCacheFirstArticles<Article>({
    tableName,
    orderBy: 'id'
  });

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;
    const searchLower = searchQuery.toLowerCase().trim();
    return articles.filter(article => {
      const numeroArtigo = (article["Número do Artigo"] || "").toLowerCase().trim();
      const conteudoArtigo = (article["Artigo"] || "").toLowerCase();
      return numeroArtigo.includes(searchLower) || conteudoArtigo.includes(searchLower);
    });
  }, [articles, searchQuery]);

  const displayedArticles = useMemo(() => {
    return searchQuery ? filteredArticles : filteredArticles.slice(0, displayLimit);
  }, [filteredArticles, displayLimit, searchQuery]);

  const articlesWithAudio = useMemo(() => {
    return articles.filter(article => 
      article["Narração"] && article["Narração"].trim() !== "" &&
      article["Número do Artigo"] && article["Número do Artigo"].trim() !== ""
    ) as any[];
  }, [articles]);

  // Navegação entre artigos no drawer
  const currentArticleIndex = useMemo(() => {
    if (!selectedArticle) return -1;
    return articles.findIndex(a => a.id === selectedArticle.id);
  }, [selectedArticle, articles]);

  // Navegação circular - vai para o último se estiver no primeiro, e vice-versa
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

  useEffect(() => {
    if (searchQuery && filteredArticles.length > 0 && firstResultRef.current) {
      setTimeout(() => {
        firstResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [searchQuery, filteredArticles]);

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
          onSearch={() => setSearchQuery(searchInput)}
          onClear={() => {
            setSearchInput("");
            setSearchQuery("");
          }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          resultCount={filteredArticles.length}
        />
      )}

      <StickyAudioPlayer 
        isOpen={stickyPlayerOpen} 
        onClose={() => setStickyPlayerOpen(false)} 
        audioUrl={currentAudio.url} 
        title={currentAudio.title}
      />

      <ExplicacaoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} artigo={modalData.artigo} numeroArtigo={modalData.numeroArtigo} tipo={modalData.tipo} nivel={modalData.nivel} codigo="it" codigoTabela={tableName} />
      <VideoAulaModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} videoUrl={videoModalData.videoUrl} artigo={videoModalData.artigo} numeroArtigo={videoModalData.numeroArtigo} />
      <TermosModal isOpen={termosModalOpen} onClose={() => setTermosModalOpen(false)} artigo={termosData.artigo} numeroArtigo={termosData.numeroArtigo} codigoTabela={tableName} />
      <QuestoesModal isOpen={questoesModalOpen} onClose={() => setQuestoesModalOpen(false)} artigo={questoesData.artigo} numeroArtigo={questoesData.numeroArtigo} />
      <PerguntaModal isOpen={perguntaModalOpen} onClose={() => setPerguntaModalOpen(false)} artigo={perguntaData.artigo} numeroArtigo={perguntaData.numeroArtigo} />
      
      {/* Artigo Fullscreen Drawer */}
      <ArtigoFullscreenDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedArticle(null);
        }}
        article={selectedArticle}
        codeName={codeName}
        onPlayComment={(url, title) => {
          setCurrentAudio({ url, title, isComment: true });
          setStickyPlayerOpen(true);
        }}
        onOpenAula={(article) => {
          if (article["Aula"]) {
            setVideoModalData({
              videoUrl: article["Aula"],
              artigo: article["Artigo"] || "",
              numeroArtigo: article["Número do Artigo"] || ""
            });
            setVideoModalOpen(true);
          }
        }}
        onOpenExplicacao={(artigo, numeroArtigo, tipo, nivel) => {
          setModalData({ artigo, numeroArtigo, tipo, nivel: nivel || "tecnico" });
          setModalOpen(true);
        }}
        onGenerateFlashcards={handleGenerateFlashcards}
        onOpenTermos={(artigo, numeroArtigo) => {
          setTermosData({ artigo, numeroArtigo });
          setTermosModalOpen(true);
        }}
        onOpenQuestoes={(artigo, numeroArtigo) => {
          setQuestoesData({ artigo, numeroArtigo });
          setQuestoesModalOpen(true);
        }}
        onPerguntar={(artigo, numeroArtigo) => {
          setPerguntaData({ artigo, numeroArtigo });
          setPerguntaModalOpen(true);
        }}
        loadingFlashcards={loadingFlashcards}
        currentAudio={currentAudio}
        stickyPlayerOpen={stickyPlayerOpen}
        onPreviousArticle={handlePreviousArticle}
        onNextArticle={handleNextArticle}
        totalArticles={articles.length}
      />
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

      <div ref={contentRef} className="max-w-4xl mx-auto">
        {activeTab === 'artigos' && (
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
            ) : displayedArticles.length === 0 ? (
              <div className="text-center py-16"><p className="text-muted-foreground">Nenhum artigo encontrado</p></div>
            ) : (
              <ArtigoListaCompacta
                articles={displayedArticles}
                onArtigoClick={(article) => {
                  setSelectedArticle(article);
                  setDrawerOpen(true);
                }}
                searchQuery={searchQuery}
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
              const element = document.getElementById(`article-${numeroArtigo}`);
              if (element) {
                setActiveTab('artigos');
                setTimeout(() => {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }
            }}
          />
          </div>
        )}
      </div>

      {/* Floating Controls */}
      {viewMode === 'expandido' && (
        <>
          <div className="fixed bottom-28 left-4 flex flex-col gap-2 z-30 animate-fade-in">
            <button onClick={increaseFontSize} className="bg-yellow-500 hover:bg-yellow-600 text-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={decreaseFontSize} className="bg-yellow-500 hover:bg-yellow-600 text-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110">
              <Minus className="w-4 h-4" />
            </button>
            <div className="bg-card border border-border text-foreground text-xs font-medium px-2 py-1.5 rounded-full text-center shadow-lg">
              {fontSize}px
            </div>
          </div>

          {showScrollTop && (
            <div className="fixed bottom-[8.5rem] right-4 z-30 animate-fade-in">
              <button onClick={scrollToTop} className="bg-yellow-500 hover:bg-yellow-600 text-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110">
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface ArticleCardProps {
  article: Article;
  abbreviation: string;
  tableName: string;
  isFirstResult: boolean;
  fontSize: number;
  onOpenExplicacao: (tipo: "explicacao" | "exemplo", nivel: "tecnico" | "simples") => void;
  onOpenVideoAula: (videoUrl: string) => void;
  onGenerateFlashcards: () => void;
  onOpenTermos: () => void;
  onOpenQuestoes: () => void;
  onPerguntar: () => void;
  onPlayComment: (url: string, title: string) => void;
  loadingFlashcards: boolean;
}

const ArticleCard = ({
  article,
  abbreviation,
  tableName,
  isFirstResult,
  fontSize,
  onOpenExplicacao,
  onOpenVideoAula,
  onGenerateFlashcards,
  onOpenTermos,
  onOpenQuestoes,
  onPerguntar,
  onPlayComment,
  loadingFlashcards
}: ArticleCardProps) => {
  const elementRef = useArticleTracking({
    tableName,
    articleId: article.id,
    numeroArtigo: article["Número do Artigo"] || "",
    enabled: !!article["Número do Artigo"]
  });

  const hasNumber = article["Número do Artigo"] && article["Número do Artigo"].trim() !== "";

  if (!hasNumber) {
    return (
      <div key={article.id} className="text-center mb-4 mt-6 font-serif-content">
        <div 
          className="text-sm leading-tight text-muted-foreground/80 whitespace-pre-line" 
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatTextWithUppercase(article["Artigo"] || "")) }} 
        />
      </div>
    );
  }

  const shareOnWhatsApp = () => {
    const numeroArtigo = article["Número do Artigo"];
    const conteudo = article["Artigo"];
    const fullText = `*Art. ${numeroArtigo}*\n\n${conteudo}`;
    const formattedText = formatForWhatsApp(fullText);
    const encodedText = encodeURIComponent(formattedText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div 
      ref={isFirstResult ? elementRef as any : elementRef} 
      id={`article-${article["Número do Artigo"]}`}
      className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-border/50 hover:border-accent/30 transition-all duration-300 animate-fade-in hover:shadow-lg scroll-mt-4"
    >
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-accent font-bold text-xl md:text-2xl animate-scale-in">
          Art. {article["Número do Artigo"]}
        </h2>
        <div className="flex gap-2">
          <CopyButton 
            text={article["Artigo"] || ""}
            articleNumber={article["Número do Artigo"] || ""}
            narrationUrl={article["Narração"] || undefined}
          />
        </div>
      </div>

      <div
        className="article-content text-foreground/90 mb-6 whitespace-pre-line leading-relaxed font-serif-content"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: "1.7"
        }}
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(formatTextWithUppercase(article["Artigo"] || "Conteúdo não disponível"))
        }}
      />

      <div className="mb-4 animate-fade-in">
        <ArtigoActionsMenu
          article={article}
          codigoNome="Lei de Interceptação Telefônica"
          onPlayComment={(audioUrl, title) => onPlayComment(audioUrl, title)}
          onOpenAula={article["Aula"] ? () => onOpenVideoAula(article["Aula"]!) : undefined}
          onOpenExplicacao={(tipo) => onOpenExplicacao(tipo, "tecnico")}
          onGenerateFlashcards={onGenerateFlashcards}
          onOpenTermos={onOpenTermos}
          onOpenQuestoes={onOpenQuestoes}
          onPerguntar={onPerguntar}
          loadingFlashcards={loadingFlashcards}
        />
      </div>
    </div>
  );
};

export default InterceptacaoTelefonicaView;
