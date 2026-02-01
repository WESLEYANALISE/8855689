import { useState, useEffect, useRef, useMemo, useTransition, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, MessageSquare, GraduationCap, Lightbulb, BookOpen, Bookmark, Plus, Minus, ArrowUp, BookMarked, FileQuestion, X, Share2, Loader2, Scale, CheckCircle, Volume2 } from "lucide-react";
import { BuscaCompacta } from "@/components/BuscaCompacta";
import { ArtigoListaCompacta } from "@/components/ArtigoListaCompacta";
import { ArtigoFullscreenDrawer } from "@/components/ArtigoFullscreenDrawer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows, fetchInitialRows } from "@/lib/fetchAllRows";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { sortArticles } from "@/lib/articleSorter";
import InlineAudioButton from "@/components/InlineAudioButton";
import AudioCommentButton from "@/components/AudioCommentButton";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import TermosModal from "@/components/TermosModal";
import QuestoesModal from "@/components/QuestoesModal";
import PerguntaModal from "@/components/PerguntaModal";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { formatTextWithUppercase } from "@/lib/textFormatter";
import { CopyButton } from "@/components/CopyButton";
import { VadeMecumTabsInline } from "@/components/VadeMecumTabsInline";
import { VadeMecumPlaylist } from "@/components/VadeMecumPlaylist";
import { VadeMecumRanking } from "@/components/VadeMecumRanking";
import { useArticleTracking } from "@/hooks/useArticleTracking";
import { ArtigoActionsMenu } from "@/components/ArtigoActionsMenu";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";
import { useProgressiveArticles } from "@/hooks/useProgressiveArticles";
import { getCodigoFromTable } from "@/lib/codigoMappings";
import { AulaArtigoSlidesViewer } from "@/components/AulaArtigoSlidesViewer";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { LeiHeader } from "@/components/LeiHeader";
import { ModoVisualizacaoArtigos } from "@/components/ModoVisualizacaoArtigos";
import { useDeviceType } from "@/hooks/use-device-type";
import { VadeMecumDesktopLayout } from "@/components/vade-mecum/VadeMecumDesktopLayout";


interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
  // Campos de explicação diretamente na tabela do código
  explicacao_resumido?: string | null;
  explicacao_tecnico?: string | null;
  exemplo?: string | null;
  termos?: any | null;
}
const CodigoView = () => {
  const navigate = useNavigate();
  const {
    id
  } = useParams();
  const [searchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const firstResultRef = useRef<HTMLDivElement>(null);
  
  // Detectar tipo de dispositivo
  const { isDesktop } = useDeviceType();
  
  const [fontSize, setFontSize] = useState(15);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [targetArticleNumber, setTargetArticleNumber] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [displayLimit, setDisplayLimit] = useState(100);
  const [stickyPlayerOpen, setStickyPlayerOpen] = useState(false);
  const [currentAudio, setCurrentAudio] = useState({
    url: "",
    title: "",
    isComment: false
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    artigo: "",
    numeroArtigo: "",
    tipo: "explicacao" as "explicacao" | "exemplo",
    nivel: "tecnico" as "tecnico" | "simples"
  });
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalData, setVideoModalData] = useState({
    videoUrl: "",
    artigo: "",
    numeroArtigo: ""
  });
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
  const [flashcardsData, setFlashcardsData] = useState<any[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [termosModalOpen, setTermosModalOpen] = useState(false);
  const [termosData, setTermosData] = useState({ artigo: "", numeroArtigo: "" });
  const [questoesModalOpen, setQuestoesModalOpen] = useState(false);
  const [questoesData, setQuestoesData] = useState({ artigo: "", numeroArtigo: "" });
  const [perguntaModalOpen, setPerguntaModalOpen] = useState(false);
  const [perguntaData, setPerguntaData] = useState({ artigo: "", numeroArtigo: "" });
  
  // Aula Artigo state
  const [aulaArtigoModalOpen, setAulaArtigoModalOpen] = useState(false);
  const [aulaArtigoData, setAulaArtigoData] = useState({ artigo: "", numeroArtigo: "" });
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<'artigos' | 'playlist' | 'ranking'>('artigos');
  
  // Modo de visualização: numérico ou capítulos
  const [modoVisualizacao, setModoVisualizacao] = useState<'numerico' | 'capitulos'>('numerico');
  const [capituloSelecionado, setCapituloSelecionado] = useState<string>('');
  
  // View mode state - now always "lista" style with drawer
  const [viewMode, setViewMode] = useState<'lista' | 'expandido'>('lista');
  const [artigoExpandido, setArtigoExpandido] = useState<number | null>(null);
  
  // Show scroll to top button after scrolling past article 7
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Estado para controlar artigos com narração (sem geração automática)
  const [artigosComNarracao, setArtigosComNarracao] = useState<Set<number>>(new Set());
  
  // Ref for ScrollArea to enable smooth scroll to top
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Callback when user scrolls past article 7
  const handleScrollPastArticle7 = useCallback((isPast: boolean) => {
    setShowScrollTop(isPast);
  }, []);
  
  // Scroll to top function that targets ScrollArea viewport
  const scrollToTopSmooth = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);
  
  // Drawer state for fullscreen article view
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const codeNames: {
    [key: string]: string;
  } = {
    cc: "Código Civil",
    cp: "Código Penal",
    cpc: "Código de Processo Civil",
    cpp: "Código de Processo Penal",
    cf: "Constituição Federal",
    clt: "Consolidação das Leis do Trabalho",
    cdc: "Código de Defesa do Consumidor",
    ctn: "Código Tributário Nacional",
    ctb: "Código de Trânsito Brasileiro",
    ce: "Código Eleitoral",
    ca: "Código de Águas",
    cba: "Código Brasileiro de Aeronáutica",
    cbt: "Código Brasileiro de Telecomunicações",
    ccom: "Código Comercial",
    cdm: "Código de Minas",
    cpm: "Código Penal Militar",
    cppm: "Código de Processo Penal Militar",
    cflorestal: "Código Florestal",
    ccaca: "Código de Caça",
    cpesca: "Código de Pesca",
    cpi: "Código de Propriedade Industrial",
    cdus: "Código de Defesa do Usuário",
    "lei-beneficios": "Lei de Benefícios da Previdência Social",
    "lei-custeio": "Lei de Custeio da Previdência Social",
    "lei-improbidade": "Lei de Improbidade Administrativa",
    "lei-acesso-informacao": "Lei de Acesso à Informação",
    "lei-anticorrupcao": "Lei Anticorrupção",
    "lei-mediacao": "Lei de Mediação",
    "lei-lgpd": "Lei Geral de Proteção de Dados",
    "lei-lrf": "Lei de Responsabilidade Fiscal",
    "lei-licitacoes": "Lei de Licitações e Contratos",
    "lei-acao-popular": "Lei da Ação Popular",
    "lei-registros-publicos": "Lei de Registros Públicos",
    "lei-acao-civil-publica": "Lei da Ação Civil Pública",
    "lei-juizados-civeis": "Lei dos Juizados Especiais",
    "lei-legislacao-tributaria": "Lei da Legislação Tributária",
    "lei-processo-administrativo": "Lei do Processo Administrativo",
    "lei-adi-adc": "Lei da ADI e ADC"
  };
  
  const tableNames: {
    [key: string]: string;
  } = {
    cc: "CC - Código Civil",
    cp: "CP - Código Penal",
    cpc: "CPC – Código de Processo Civil",
    cpp: "CPP – Código de Processo Penal",
    cf: "CF - Constituição Federal",
    clt: "CLT - Consolidação das Leis do Trabalho",
    cdc: "CDC – Código de Defesa do Consumidor",
    ctn: "CTN – Código Tributário Nacional",
    ctb: "CTB Código de Trânsito Brasileiro",
    ce: "CE – Código Eleitoral",
    ca: "CA - Código de Águas",
    cba: "CBA Código Brasileiro de Aeronáutica",
    cbt: "CBT Código Brasileiro de Telecomunicações",
    ccom: "CCOM – Código Comercial",
    cdm: "CDM – Código de Minas",
    cpm: "CPM – Código Penal Militar",
    cppm: "CPPM – Código de Processo Penal Militar",
    cflorestal: "CF - Código Florestal",
    ccaca: "CC - Código de Caça",
    cpesca: "CP - Código de Pesca",
    cpi: "CPI - Código de Propriedade Industrial",
    cdus: "CDUS - Código de Defesa do Usuário",
    "lei-beneficios": "LEI 8213 - Benefícios",
    "lei-custeio": "LEI 8212 - Custeio",
    "lei-improbidade": "LEI 8429 - IMPROBIDADE",
    "lei-acesso-informacao": "LEI 12527 - ACESSO INFORMACAO",
    "lei-anticorrupcao": "LEI 12846 - ANTICORRUPCAO",
    "lei-mediacao": "LEI 13140 - MEDIACAO",
    "lei-lgpd": "LEI 13709 - LGPD",
    "lei-lrf": "LC 101 - LRF",
    "lei-licitacoes": "LEI 14133 - LICITACOES",
    "lei-acao-popular": "LEI 4717 - ACAO POPULAR",
    "lei-registros-publicos": "LEI 6015 - REGISTROS PUBLICOS",
    "lei-acao-civil-publica": "LEI 7347 - ACAO CIVIL PUBLICA",
    "lei-juizados-civeis": "LEI 9099 - JUIZADOS CIVEIS",
    "lei-legislacao-tributaria": "LEI 9430 - LEGISLACAO TRIBUTARIA",
    "lei-processo-administrativo": "LEI 9784 - PROCESSO ADMINISTRATIVO",
    "lei-adi-adc": "LEI 9868 - ADI E ADC"
  };

  // Mapeamento para número da lei (subtítulo)
  const lawNumbers: {
    [key: string]: string;
  } = {
    cc: "Lei nº 10.406/2002",
    cp: "Decreto-Lei nº 2.848/1940",
    cpc: "Lei nº 13.105/2015",
    cpp: "Decreto-Lei nº 3.689/1941",
    cf: "de 5 de outubro de 1988",
    clt: "Decreto-Lei nº 5.452/1943",
    cdc: "Lei nº 8.078/1990",
    ctn: "Lei nº 5.172/1966",
    ctb: "Lei nº 9.503/1997",
    ce: "Lei nº 4.737/1965",
    ca: "Decreto nº 24.643/1934",
    cba: "Lei nº 7.565/1986",
    cbt: "Lei nº 4.117/1962",
    ccom: "Lei nº 556/1850",
    cdm: "Decreto-Lei nº 227/1967",
    cpm: "Decreto-Lei nº 1.001/1969",
    cppm: "Decreto-Lei nº 1.002/1969",
    cflorestal: "Lei nº 12.651/2012",
    ccaca: "Lei nº 5.197/1967",
    cpesca: "Lei nº 11.959/2009",
    cpi: "Lei nº 9.279/1996",
    cdus: "Lei nº 13.460/2017",
    "lei-beneficios": "Lei nº 8.213/1991",
    "lei-custeio": "Lei nº 8.212/1991",
    "lei-improbidade": "Lei nº 8.429/1992",
    "lei-acesso-informacao": "Lei nº 12.527/2011",
    "lei-anticorrupcao": "Lei nº 12.846/2013",
    "lei-mediacao": "Lei nº 13.140/2015",
    "lei-lgpd": "Lei nº 13.709/2018",
    "lei-lrf": "LC nº 101/2000",
    "lei-licitacoes": "Lei nº 14.133/2021",
    "lei-acao-popular": "Lei nº 4.717/1965",
    "lei-registros-publicos": "Lei nº 6.015/1973",
    "lei-acao-civil-publica": "Lei nº 7.347/1985",
    "lei-juizados-civeis": "Lei nº 9.099/1995",
    "lei-legislacao-tributaria": "Lei nº 9.430/1996",
    "lei-processo-administrativo": "Lei nº 9.784/1999",
    "lei-adi-adc": "Lei nº 9.868/1999"
  };
  
  // Verificar se o ID é um nome de tabela direto ou um slug
  const decodedId = decodeURIComponent(id || '');
  const allTableValues = Object.values(tableNames);
  const isDirectTableName = allTableValues.includes(decodedId);
  
  const finalTableName = isDirectTableName ? decodedId : (tableNames[id as string] || "CP - Código Penal");
  const codeName = isDirectTableName 
    ? (Object.entries(codeNames).find(([key]) => tableNames[key] === decodedId)?.[1] || "Código")
    : (codeNames[id as string] || "Código");
  const tableName = finalTableName;
  
  // Obter o número da lei para o subtítulo
  const lawNumber = isDirectTableName 
    ? (Object.entries(lawNumbers).find(([key]) => tableNames[key] === decodedId)?.[1] || "")
    : (lawNumbers[id as string] || "");

  // Use progressive loading: primeiros 50 instantâneos, resto em background
  const { 
    articles, 
    isLoadingInitial: isLoading, 
    isLoadingMore: isLoadingFull,
    isComplete,
    totalLoaded 
  } = useProgressiveArticles<Article>({
    tableName,
    initialChunk: 50,       // Primeiros 50 artigos instantâneos
    backgroundChunk: 100,   // Carregar 100 por vez em background
    delayBetweenChunks: 200 // 200ms entre cada chunk
  });
  
  // Função placeholder para updateArticle (se necessário no futuro)
  const updateArticle = useCallback((id: number, updates: Partial<Article>) => {
    // Progressive articles não suporta update inline por ora
    console.log('updateArticle called', id, updates);
  }, []);
  // Usar todos os artigos (não filtrar mais)
  const filteredArticles = useMemo(() => articles, [articles]);
  
  const displayedArticles = useMemo(() => {
    return filteredArticles.slice(0, displayLimit);
  }, [filteredArticles, displayLimit]);

  // Handler para iniciar busca animada
  const handleAnimatedSearch = useCallback(() => {
    if (!searchInput.trim()) return;
    setTargetArticleNumber(searchInput.trim());
    setSearchQuery(searchInput.trim());
  }, [searchInput]);

  // Limpar busca
  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setTargetArticleNumber(null);
    setArtigoExpandido(null);
  }, []);

  // Navegação entre artigos no drawer
  const currentArticleIndex = useMemo(() => {
    if (!selectedArticle) return -1;
    return articles.findIndex(a => a.id === selectedArticle.id);
  }, [selectedArticle, articles]);

  // Navegação circular - vai para o último se estiver no primeiro, e vice-versa
  const handlePreviousArticle = useCallback(() => {
    if (articles.length === 0) return;
    if (currentArticleIndex <= 0) {
      // Se está no primeiro, vai para o último
      setSelectedArticle(articles[articles.length - 1]);
    } else {
      setSelectedArticle(articles[currentArticleIndex - 1]);
    }
  }, [currentArticleIndex, articles]);

  const handleNextArticle = useCallback(() => {
    if (articles.length === 0) return;
    if (currentArticleIndex >= articles.length - 1) {
      // Se está no último, vai para o primeiro
      setSelectedArticle(articles[0]);
    } else {
      setSelectedArticle(articles[currentArticleIndex + 1]);
    }
  }, [currentArticleIndex, articles]);

  // Filter articles with audio for playlist
  const articlesWithAudio = useMemo(() => {
    return articles.filter(article => 
      article["Narração"] && 
      article["Narração"].trim() !== "" &&
      article["Número do Artigo"] &&
      article["Número do Artigo"].trim() !== ""
    ) as any[];
  }, [articles]);

  // Contar artigos únicos por número (incluindo variações como 1-A, 1-B)
  const uniqueArticleCount = useMemo(() => {
    const uniqueNumbers = new Set<string>();
    articles.forEach(article => {
      const numero = article["Número do Artigo"];
      if (numero && numero.trim() !== "") {
        uniqueNumbers.add(numero.trim());
      }
    });
    return uniqueNumbers.size;
  }, [articles]);

  // Inicializar set de artigos com narração
  useEffect(() => {
    if (articles.length > 0) {
      const withNarration = new Set<number>();
      articles.forEach(art => {
        if (art["Narração"] && art["Narração"].trim() !== "") {
          withNarration.add(art.id);
        }
      });
      setArtigosComNarracao(withNarration);
    }
  }, [articles]);

  // Auto-search based on URL parameter
  useEffect(() => {
    const artigoParam = searchParams.get('artigo');
    if (artigoParam) {
      setSearchInput(artigoParam);
      setTargetArticleNumber(artigoParam);
      setSearchQuery(artigoParam);
    }
  }, [searchParams]);

  // Infinite scroll handler
  useEffect(() => {
    const element = contentRef.current;
    if (!searchQuery && element) {
      const handleScroll = () => {
        if (!element) return;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        if (scrollTop + clientHeight >= scrollHeight - 500 && displayLimit < filteredArticles.length) {
          setDisplayLimit(prev => Math.min(prev + 100, filteredArticles.length));
        }
      };
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [displayLimit, filteredArticles.length, searchQuery]);
  const increaseFontSize = () => {
    if (fontSize < 24) setFontSize(fontSize + 2);
  };
  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };
  // Formata conteúdo do artigo usando formatador da Constituição
  const formatArticleContent = (content: string) => {
    return formatTextWithUppercase(content || "Conteúdo não disponível");
  };

  const handlePlayComment = (audioUrl: string, title: string) => {
    setCurrentAudio({
      url: audioUrl,
      title,
      isComment: true
    });
    setStickyPlayerOpen(true);
  };
  const handleOpenAula = (article: Article) => {
    if (article.Aula && article["Artigo"] && article["Número do Artigo"]) {
      setVideoModalData({
        videoUrl: article.Aula,
        artigo: article["Artigo"],
        numeroArtigo: article["Número do Artigo"]
      });
      setVideoModalOpen(true);
    }
  };
  const handleOpenExplicacao = (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => {
    setModalData({
      artigo,
      numeroArtigo,
      tipo,
      nivel: nivel || "tecnico"
    });
    setModalOpen(true);
  };
  
  const handleGenerateFlashcards = async (artigo: string, numeroArtigo: string) => {
    setLoadingFlashcards(true);
    try {
      // Usar mapeamento universal centralizado
      const codigo = getCodigoFromTable(tableName);

      console.log('🔍 [Debug FlashcardsModal]', {
        codigoEnviado: codigo,
        tabelaMapeada: tableName,
        numeroArtigo: numeroArtigo
      });

      const response = await supabase.functions.invoke('gerar-flashcards', {
        body: { 
          content: `Art. ${numeroArtigo}\n${artigo}`,
          codigo: codigo,
          numeroArtigo: numeroArtigo,
          tipo: 'artigo'
        }
      });
      
      if (response.error) throw response.error;
      
      setFlashcardsData(response.data.flashcards || []);
      setFlashcardsModalOpen(true);
      
      // Edge function já salva no cache, mas mantemos backup local
      if (response.data.flashcards && Array.isArray(response.data.flashcards) && !response.data.cached) {
        try {
          const { error: updateError } = await supabase
            .from(tableName as any)
            .update({ 
              flashcards: response.data.flashcards,
              ultima_atualizacao: new Date().toISOString()
            })
            .eq('Número do Artigo', numeroArtigo);
          
          if (updateError) {
            console.error('Erro ao salvar flashcards:', updateError);
          }
        } catch (saveError) {
          console.error('Erro ao salvar flashcards:', saveError);
        }
      }
    } catch (error) {
      console.error('Erro ao gerar flashcards:', error);
    } finally {
      setLoadingFlashcards(false);
    }
  };
  const scrollToTop = () => {
    contentRef.current?.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleArticleClick = (numeroArtigo: string) => {
    setActiveTab('artigos');
    setSearchQuery(numeroArtigo);
  };

  // Registrar visualização quando buscar um artigo
  const registrarVisualizacao = async (numeroArtigo: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('artigos_visualizacoes')
        .insert({
          tabela_codigo: tableName,
          numero_artigo: numeroArtigo,
          user_id: user?.id || null,
          origem: 'busca'
        });
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  };

  // Registrar visualização quando buscar um artigo específico
  useEffect(() => {
    if (searchQuery && filteredArticles.length > 0) {
      const primeiroArtigo = filteredArticles[0];
      if (primeiroArtigo["Número do Artigo"]) {
        registrarVisualizacao(primeiroArtigo["Número do Artigo"]);
      }
    }
  }, [searchQuery]);

  // Disparar geração automática de aulas em background ao acessar o código
  useEffect(() => {
    const gerarAulasBackground = async () => {
      try {
        // Disparar em background - não bloqueia a UI
        supabase.functions.invoke('processar-aulas-background', {
          body: { codigoTabela: tableName }
        }).then(response => {
          if (response.data?.status === 'generated') {
            console.log(`[Background] Aula gerada para artigo ${response.data.artigo}`);
          }
        }).catch(error => {
          console.error('[Background] Erro ao processar aulas:', error);
        });
      } catch (error) {
        console.error('[Background] Erro:', error);
      }
    };

    // Executar após um pequeno delay para não competir com carregamento inicial
    const timeout = setTimeout(gerarAulasBackground, 3000);
    return () => clearTimeout(timeout);
  }, [tableName]);

  // Renderizar modais compartilhados
  const renderModals = () => (
    <>
      <StickyAudioPlayer 
        isOpen={stickyPlayerOpen} 
        onClose={() => setStickyPlayerOpen(false)} 
        audioUrl={currentAudio.url} 
        title={currentAudio.title}
      />

      <ExplicacaoModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        artigo={modalData.artigo} 
        numeroArtigo={modalData.numeroArtigo} 
        tipo={modalData.tipo} 
        nivel={modalData.nivel}
        codigo={id}
        codigoTabela={tableName}
      />

      <VideoAulaModal 
        isOpen={videoModalOpen} 
        onClose={() => setVideoModalOpen(false)} 
        videoUrl={videoModalData.videoUrl} 
        artigo={videoModalData.artigo} 
        numeroArtigo={videoModalData.numeroArtigo} 
      />

      <TermosModal 
        isOpen={termosModalOpen} 
        onClose={() => setTermosModalOpen(false)} 
        artigo={termosData.artigo} 
        numeroArtigo={termosData.numeroArtigo}
        codigoTabela={tableName}
        codigo={getCodigoFromTable(tableName)}
      />

      <QuestoesModal 
        isOpen={questoesModalOpen} 
        onClose={() => setQuestoesModalOpen(false)} 
        artigo={questoesData.artigo} 
        numeroArtigo={questoesData.numeroArtigo}
        codigoTabela={tableName}
        codigo={getCodigoFromTable(tableName)}
      />

      <PerguntaModal 
        isOpen={perguntaModalOpen} 
        onClose={() => setPerguntaModalOpen(false)} 
        artigo={perguntaData.artigo} 
        numeroArtigo={perguntaData.numeroArtigo} 
      />

      <AulaArtigoSlidesViewer
        isOpen={aulaArtigoModalOpen}
        onClose={() => setAulaArtigoModalOpen(false)}
        codigoTabela={tableName}
        codigoNome={codeName}
        numeroArtigo={aulaArtigoData.numeroArtigo}
        conteudoArtigo={aulaArtigoData.artigo}
      />

      {flashcardsModalOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-[hsl(45,93%,58%)]">Flashcards</h2>
              <button onClick={() => setFlashcardsModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FlashcardViewer flashcards={flashcardsData} />
            </div>
          </div>
        </div>
      )}
    </>
  );

  // LAYOUT DESKTOP - 3 colunas
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {renderModals()}
        
        <VadeMecumDesktopLayout
          tableName={tableName}
          codeName={codeName}
          lawNumber={lawNumber}
          articles={articles}
          isLoading={isLoading}
          selectedArticle={selectedArticle}
          onSelectArticle={(article) => setSelectedArticle(article as Article)}
          onCloseDetail={() => setSelectedArticle(null)}
          onPlayAudio={handlePlayComment}
          onOpenExplicacao={handleOpenExplicacao}
          onOpenAula={handleOpenAula}
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
          onOpenAulaArtigo={(artigo, numeroArtigo) => {
            setAulaArtigoData({ artigo, numeroArtigo });
            setAulaArtigoModalOpen(true);
          }}
          onGenerateFlashcards={handleGenerateFlashcards}
          loadingFlashcards={loadingFlashcards}
          targetArticle={targetArticleNumber}
          header={
            <LeiHeader 
              titulo={codeName.toUpperCase()} 
              subtitulo={lawNumber}
            />
          }
        />
      </div>
    );
  }

  // LAYOUT MOBILE/TABLET - Original
  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {renderModals()}

      {/* Header com Brasão - sempre visível quando na aba artigos */}
      {activeTab === 'artigos' && (
        <LeiHeader 
          titulo={codeName.toUpperCase()}
          subtitulo={lawNumber}
        />
      )}

      {/* Search Bar - only show on artigos tab */}
      {activeTab === 'artigos' && (
        <BuscaCompacta
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleAnimatedSearch}
          onClear={handleClearSearch}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            if (mode === 'lista') setArtigoExpandido(null);
          }}
          resultCount={articles.length}
        />
      )}

      {/* Tabs Inline - Playlist e Em Alta - apenas quando NÃO está nos artigos */}
      {activeTab !== 'artigos' && (
        <VadeMecumTabsInline 
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as any)}
        />
      )}

      {/* Artigo Fullscreen Drawer */}
      <ArtigoFullscreenDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedArticle(null);
        }}
        article={selectedArticle}
        codeName={codeName}
        onPlayComment={handlePlayComment}
        onOpenAula={handleOpenAula}
        onOpenExplicacao={handleOpenExplicacao}
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
        onOpenAulaArtigo={(artigo, numeroArtigo) => {
          setAulaArtigoData({ artigo, numeroArtigo });
          setAulaArtigoModalOpen(true);
        }}
        loadingFlashcards={loadingFlashcards}
        currentAudio={currentAudio}
        stickyPlayerOpen={stickyPlayerOpen}
        onPreviousArticle={handlePreviousArticle}
        onNextArticle={handleNextArticle}
        totalArticles={articles.length}
        skipInitialAnimation={true}
      />

      {/* Content with slide animation */}
      <div ref={contentRef} className="animate-fade-in">
        
        {/* Playlist Tab */}
        {activeTab === 'playlist' && (
          <div className="px-4 max-w-4xl mx-auto pb-20">
            <VadeMecumPlaylist 
              articles={articlesWithAudio}
              codigoNome={codeName}
            />
          </div>
        )}

        {/* Ranking Tab */}
        {activeTab === 'ranking' && (
          <div className="px-4 max-w-4xl mx-auto pb-20">
            <VadeMecumRanking 
              tableName={tableName}
              codigoNome={codeName}
              onArticleClick={handleArticleClick}
            />
          </div>
        )}

        {/* Articles Tab - Exibição instantânea sem loading bloqueante */}
        {activeTab === 'artigos' && (
          <div>
            {articles.length === 0 && isLoading ? (
              // Só mostra skeleton se não tem NENHUM artigo (primeira carga sem cache)
              <div className="space-y-6 px-4 max-w-4xl mx-auto pb-20">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                    <Skeleton className="h-8 w-32 mb-3" />
                    <Skeleton className="h-6 w-48 mb-4" />
                    <Skeleton className="h-24 w-full mb-6" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map(j => <Skeleton key={j} className="h-10 w-full" />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                {searchQuery ? "Nenhum artigo encontrado para sua busca." : "Nenhum artigo disponível."}
              </div>
            ) : (
              <ArtigoListaCompacta
                articles={articles}
                onArtigoClick={(article) => {
                  setSelectedArticle(article);
                  setDrawerOpen(true);
                  // Registrar visualização
                  if (article["Número do Artigo"]) {
                    registrarVisualizacao(article["Número do Artigo"]);
                  }
                }}
                searchQuery={searchQuery}
                onScrollPastArticle7={handleScrollPastArticle7}
                scrollAreaRef={scrollAreaRef}
                targetArticleNumber={targetArticleNumber}
                onScrollComplete={() => setTargetArticleNumber(null)}
                artigosComNarracao={artigosComNarracao}
                tabelaLei={tableName}
                codigoNome={codeName}
              />
            )}
          </div>
        )}
      </div>

      {/* Floating Scroll to Top Button - Right side - only shows after scrolling past article 7 */}
      {activeTab === 'artigos' && articles.length > 0 && showScrollTop && (
        <button 
          onClick={scrollToTopSmooth} 
          className="fixed bottom-20 right-4 bg-amber-500 hover:bg-amber-600 text-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default CodigoView;