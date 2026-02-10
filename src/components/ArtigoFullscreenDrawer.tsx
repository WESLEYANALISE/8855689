import { X, Share2, Plus, Minus, Volume2, Pause, Sparkles, ChevronLeft, ChevronRight, Clock, FileText, Lightbulb, BookOpen, BookMarked, AlertCircle, Scale, Loader2, Eye, EyeOff, Star, Highlighter, MoreVertical, Type, StickyNote, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import brasaoRepublica from "@/assets/brasao-republica.png";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatTextWithUppercase } from "@/lib/textFormatter";
import { ArtigoActionsMenu } from "@/components/ArtigoActionsMenu";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useNarrationPlayer } from "@/contexts/NarrationPlayerContext";
import { Badge } from "@/components/ui/badge";
import JurisprudenciaListaCompacta from "@/components/jurisprudencia/JurisprudenciaListaCompacta";
import JurisprudenciaDrawer from "@/components/jurisprudencia/JurisprudenciaDrawer";
import { useArtigoFavorito } from "@/hooks/useArtigoFavorito";
import { useArtigoGrifos } from "@/hooks/useArtigoGrifos";
import { useArtigoAnotacoes } from "@/hooks/useArtigoAnotacoes";
import { ArticleHighlighter } from "@/components/ArticleHighlighter";
import { HighlightColorPicker } from "@/components/HighlightColorPicker";
import { AnotacaoDrawer } from "@/components/vade-mecum/AnotacaoDrawer";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isNarrationAllowed, getNarrationBlockedMessage, isArticleFeatureAllowed, getFeatureBlockedMessage } from "@/lib/utils/premiumNarration";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";

// Função para parsear URLs de narração (suporta string simples ou JSON array)
const parseNarracaoUrls = (narracao: string | null): string[] => {
  if (!narracao) return [];
  try {
    const parsed = JSON.parse(narracao);
    return Array.isArray(parsed) ? parsed : [narracao];
  } catch {
    return [narracao];
  }
};

// Mapeamento de codeName para area na tabela RESUMOS_ARTIGOS_LEI
const codeNameToArea: Record<string, string> = {
  "CF/88": "Constituição Federal",
  "Constituição Federal": "Constituição Federal",
  "CF - Constituição Federal": "Constituição Federal",
  "CP": "Código Penal",
  "Código Penal": "Código Penal",
  "CP - Código Penal": "Código Penal",
  "CC": "Código Civil",
  "Código Civil": "Código Civil",
  "CC - Código Civil": "Código Civil",
  "CPC": "Código de Processo Civil",
  "Código de Processo Civil": "Código de Processo Civil",
  "CPC – Código de Processo Civil": "Código de Processo Civil",
  "CPP": "Código de Processo Penal",
  "Código de Processo Penal": "Código de Processo Penal",
  "CPP – Código de Processo Penal": "Código de Processo Penal",
  "CDC": "Código de Defesa do Consumidor",
  "Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
  "CDC – Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
  "CTN": "Código Tributário Nacional",
  "Código Tributário Nacional": "Código Tributário Nacional",
  "CTN – Código Tributário Nacional": "Código Tributário Nacional",
  "CTB": "Código de Trânsito Brasileiro",
  "Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
  "CTB Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
  "CLT": "CLT",
  "CLT - Consolidação das Leis do Trabalho": "CLT",
  "ECA": "ECA",
  "Estatuto da Criança e do Adolescente": "ECA",
  "Estatuto do Idoso": "Estatuto do Idoso",
  "Estatuto da OAB": "Estatuto da OAB",
  "Estatuto da Cidade": "Estatuto da Cidade",
  "Estatuto da Igualdade Racial": "Estatuto da Igualdade Racial",
  "Estatuto da Pessoa com Deficiência": "Estatuto da Pessoa com Deficiência",
  "Estatuto do Desarmamento": "Estatuto do Desarmamento",
  "Estatuto do Torcedor": "Estatuto do Torcedor",
  "Lei Maria da Penha": "Lei Maria da Penha",
  "Lei de Drogas": "Lei de Drogas",
  "Lei de Execução Penal": "Lei de Execução Penal",
  "Lei de Tortura": "Lei de Tortura",
  "Crimes Hediondos": "Crimes Hediondos",
  "Abuso de Autoridade": "Abuso de Autoridade",
  "Interceptação Telefônica": "Interceptação Telefônica",
  "Juizados Especiais": "Juizados Especiais",
  "Lavagem de Dinheiro": "Lavagem de Dinheiro",
  "Organizações Criminosas": "Organizações Criminosas",
  "Código de Minas": "Código de Minas",
  "CDM – Código de Minas": "Código de Minas",
};

// Mapeamento de codeName para código do Corpus927
const codeNameToCorpus927: Record<string, string> = {
  // Código Penal
  "CP": "cp-40",
  "cp": "cp-40",
  "Código Penal": "cp-40",
  "CP - Código Penal": "cp-40",
  "CP – Código Penal": "cp-40",
  // Código de Processo Penal
  "CPP": "cpp-41",
  "cpp": "cpp-41",
  "Código de Processo Penal": "cpp-41",
  "CPP - Código de Processo Penal": "cpp-41",
  "CPP – Código de Processo Penal": "cpp-41",
  // Código Civil
  "CC": "cc-02",
  "cc": "cc-02",
  "Código Civil": "cc-02",
  "CC - Código Civil": "cc-02",
  "CC – Código Civil": "cc-02",
  // Código de Processo Civil
  "CPC": "cpc-15",
  "cpc": "cpc-15",
  "Código de Processo Civil": "cpc-15",
  "CPC - Código de Processo Civil": "cpc-15",
  "CPC – Código de Processo Civil": "cpc-15",
  // Código Tributário Nacional
  "CTN": "ctn-66",
  "ctn": "ctn-66",
  "Código Tributário Nacional": "ctn-66",
  "CTN - Código Tributário Nacional": "ctn-66",
  "CTN – Código Tributário Nacional": "ctn-66",
  // Código de Defesa do Consumidor
  "CDC": "cdc-90",
  "cdc": "cdc-90",
  "Código de Defesa do Consumidor": "cdc-90",
  "CDC - Código de Defesa do Consumidor": "cdc-90",
  "CDC – Código de Defesa do Consumidor": "cdc-90",
  // CLT
  "CLT": "clt-43",
  "clt": "clt-43",
  "CLT - Consolidação das Leis do Trabalho": "clt-43",
  "CLT – Consolidação das Leis do Trabalho": "clt-43",
  // Constituição Federal
  "CF/88": "cf-88",
  "cf/88": "cf-88",
  "Constituição Federal": "cf-88",
  "CF - Constituição Federal": "cf-88",
  "CF – Constituição Federal": "cf-88",
};

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

interface ResumoData {
  resumo_markdown: string | null;
  exemplos: string | null;
  termos: string | null;
}

interface JurisprudenciaItem {
  tipo: string;
  titulo: string;
  texto: string;
  ementa?: string;
  tese?: string;
  tribunal?: string;
  numero?: string;
  data?: string;
  relator?: string;
  link?: string;
  resumo?: string;
}

interface ArtigoFullscreenDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  codeName: string;
  onPlayComment?: (audioUrl: string, title: string) => void;
  onOpenAula?: (article: Article) => void;
  onOpenExplicacao?: (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => void;
  onGenerateFlashcards?: (artigo: string, numeroArtigo: string) => void;
  onOpenTermos?: (artigo: string, numeroArtigo: string) => void;
  onOpenQuestoes?: (artigo: string, numeroArtigo: string) => void;
  onPerguntar?: (artigo: string, numeroArtigo: string) => void;
  onOpenAulaArtigo?: (artigo: string, numeroArtigo: string) => void;
  loadingFlashcards?: boolean;
  currentAudio?: { url: string; title: string; isComment: boolean };
  stickyPlayerOpen?: boolean;
  onPreviousArticle?: () => void;
  onNextArticle?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  totalArticles?: number;
  skipInitialAnimation?: boolean;
}

export const ArtigoFullscreenDrawer = ({
  isOpen,
  onClose,
  article,
  codeName,
  onPlayComment,
  onOpenAula,
  onOpenExplicacao,
  onGenerateFlashcards,
  onOpenTermos,
  onOpenQuestoes,
  onPerguntar,
  onOpenAulaArtigo,
  loadingFlashcards,
  currentAudio,
  stickyPlayerOpen,
  onPreviousArticle,
  onNextArticle,
  hasPrevious = false,
  hasNext = false,
  totalArticles = 0,
  skipInitialAnimation = false,
}: ArtigoFullscreenDrawerProps) => {
  // Estado para controlar se é a primeira abertura
  const [hasAnimated, setHasAnimated] = useState(skipInitialAnimation);
  
  // Marcar como animado após primeira abertura
  useEffect(() => {
    if (isOpen && !hasAnimated) {
      // Esperar um pouco para garantir que não anima na primeira vez
      setTimeout(() => setHasAnimated(true), 50);
    }
  }, [isOpen, hasAnimated]);
  const [fontSize, setFontSize] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [durations, setDurations] = useState<number[]>([]);
  const [showRecursos, setShowRecursos] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [activeTab, setActiveTab] = useState<string>("artigo");
  const [activeExemploIndex, setActiveExemploIndex] = useState(0);
  const [resumoData, setResumoData] = useState<ResumoData | null>(null);
  const [loadingResumo, setLoadingResumo] = useState(false);
  
  // Estados para Jurisprudência
  const [jurisprudencias, setJurisprudencias] = useState<JurisprudenciaItem[]>([]);
  const [loadingJurisprudencia, setLoadingJurisprudencia] = useState(false);
  const [jurisprudenciaCarregada, setJurisprudenciaCarregada] = useState(false);
  const [etapaBusca, setEtapaBusca] = useState<string>('');
  
  // Estados para drawer de jurisprudência selecionada
  const [jurisprudenciaSelecionada, setJurisprudenciaSelecionada] = useState<JurisprudenciaItem | null>(null);
  const [jurisprudenciaIndex, setJurisprudenciaIndex] = useState(0);
  const [drawerJurisAberto, setDrawerJurisAberto] = useState(false);
  
  // Estado para ocultar/mostrar anotações legais (oculto por padrão)
  const [hideAnnotations, setHideAnnotations] = useState(true);
  
  // Estado para menu flutuante de opções extras
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  
  // Estado para drawer de anotações
  const [anotacaoOpen, setAnotacaoOpen] = useState(false);
  
  // Estado para premium card
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  
  // Estado para mensagem do premium card
  const [premiumCardMessage, setPremiumCardMessage] = useState<{ title: string; description: string }>({
    title: '',
    description: ''
  });
  
  // Subscription context
  const { isPremium } = useSubscription();

  // Função para dividir exemplos em partes
  const parseExemplos = (exemplos: string | null): string[] => {
    if (!exemplos) return [];
    // Divide por "## Exemplo" mantendo o delimitador
    const parts = exemplos.split(/(?=## Exemplo \d)/i);
    return parts.filter(part => part.trim().length > 0);
  };

  const exemplosArray = resumoData?.exemplos ? parseExemplos(resumoData.exemplos) : [];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const { playNarration, stopNarration } = useNarrationPlayer();

  // Reset audio quando artigo muda
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentIndex(0);
    setActiveTab("artigo");
    setActiveExemploIndex(0);
    setResumoData(null);
    // Resetar jurisprudência quando muda de artigo
    setJurisprudencias([]);
    setJurisprudenciaCarregada(false);
    setEtapaBusca('');
  }, [article?.id]);

  // Buscar dados do resumo quando tab mudar para explicação/exemplo/termos
  useEffect(() => {
    const fetchResumoData = async () => {
      if (!article || activeTab === "artigo") return;
      
      const area = codeNameToArea[codeName] || codeName;
      const numeroArtigo = article["Número do Artigo"] || "";
      
      // Normalizar o número do artigo para busca - remover º, ° e espaços
      const numeroLimpo = numeroArtigo.replace(/[°º]/g, "").trim();
      
      setLoadingResumo(true);
      
      try {
        // Tentar primeiro sem o grau
        let { data } = await supabase
          .from("RESUMOS_ARTIGOS_LEI")
          .select("resumo_markdown, exemplos, termos")
          .eq("area", area)
          .eq("tema", numeroLimpo)
          .maybeSingle();
        
        // Se não encontrou, tentar com º (ordinal masculino - formato comum na tabela)
        if (!data) {
          const result = await supabase
            .from("RESUMOS_ARTIGOS_LEI")
            .select("resumo_markdown, exemplos, termos")
            .eq("area", area)
            .eq("tema", numeroLimpo + "º")
            .maybeSingle();
          data = result.data;
        }
        
        // Se não encontrou, tentar com ° (símbolo de grau)
        if (!data) {
          const result = await supabase
            .from("RESUMOS_ARTIGOS_LEI")
            .select("resumo_markdown, exemplos, termos")
            .eq("area", area)
            .eq("tema", numeroLimpo + "°")
            .maybeSingle();
          data = result.data;
        }
        
        // Se ainda não encontrou, tentar com o número original
        if (!data && numeroArtigo !== numeroLimpo) {
          const result = await supabase
            .from("RESUMOS_ARTIGOS_LEI")
            .select("resumo_markdown, exemplos, termos")
            .eq("area", area)
            .eq("tema", numeroArtigo)
            .maybeSingle();
          data = result.data;
        }
        
        setResumoData(data);
      } catch (error) {
        console.error("Erro ao buscar resumo:", error);
        setResumoData(null);
      } finally {
        setLoadingResumo(false);
      }
    };

    fetchResumoData();
  }, [activeTab, article?.id, codeName]);

  // Buscar jurisprudência quando tab mudar para jurisprudencia
  const buscarJurisprudencia = useCallback(async () => {
    if (!article || jurisprudenciaCarregada || loadingJurisprudencia) return;
    
    const numeroArt = article["Número do Artigo"] || "";
    
    // Limpar número do artigo - remover º, ° e espaços extras
    const numeroLimpo = numeroArt.replace(/[°º]/g, "").replace(/\s+/g, " ").trim();
    
    // Obter código do Corpus927 - tentar diferentes variações
    let codigoCorpus = codeNameToCorpus927[codeName];
    
    // Se não encontrou, tentar extrair apenas a sigla (ex: "CP - Código Penal" -> "CP")
    if (!codigoCorpus) {
      const sigla = codeName.split(/\s*[-–]\s*/)[0].trim();
      codigoCorpus = codeNameToCorpus927[sigla];
    }
    
    console.log('Busca jurisprudência:', { codeName, codigoCorpus, numeroLimpo });
    
    setLoadingJurisprudencia(true);
    setEtapaBusca('🔍 Iniciando busca de jurisprudência...');
    
    try {
      setEtapaBusca('📦 Buscando no cache...');
      await new Promise(r => setTimeout(r, 300));
      
      if (codigoCorpus) {
        // Buscar diretamente do cache do Supabase
        const { data: cacheData, error: cacheError } = await supabase
          .from('jurisprudencias_corpus927')
          .select('jurisprudencias')
          .eq('legislacao', codigoCorpus)
          .eq('artigo', numeroLimpo)
          .maybeSingle();
        
        console.log('Cache result:', { cacheData, cacheError });
        
        if (!cacheError && cacheData?.jurisprudencias) {
          setEtapaBusca('📋 Processando resultados...');
          const juris = Array.isArray(cacheData.jurisprudencias) 
            ? (cacheData.jurisprudencias as unknown as JurisprudenciaItem[]) 
            : [];
          setJurisprudencias(juris);
          setEtapaBusca(`✅ ${juris.length} jurisprudência(s) encontrada(s)`);
          setJurisprudenciaCarregada(true);
          setTimeout(() => setEtapaBusca(''), 1500);
          setLoadingJurisprudencia(false);
          return;
        }
      }
      
      // Se não encontrou no cache, tentar pela edge function
      setEtapaBusca('🌐 Conectando à API dos Tribunais...');
      
      const { data, error } = await supabase.functions.invoke('buscar-jurisprudencia-corpus927', {
        body: {
          legislacao: codeName,
          artigo: numeroLimpo,
          forcarAtualizacao: false
        }
      });
      
      if (error) throw error;
      
      setEtapaBusca('📋 Processando resultados...');
      
      if (data?.success && data?.data?.jurisprudencias) {
        setJurisprudencias(data.data.jurisprudencias);
        setEtapaBusca(`✅ ${data.data.jurisprudencias.length} jurisprudência(s) encontrada(s)`);
      } else if (data?.jurisprudencias && Array.isArray(data.jurisprudencias)) {
        setJurisprudencias(data.jurisprudencias);
      } else {
        setJurisprudencias([]);
      }
      
      setJurisprudenciaCarregada(true);
    } catch (error) {
      console.error('Erro ao buscar jurisprudência:', error);
      setEtapaBusca('❌ Erro ao buscar jurisprudência');
      setJurisprudencias([]);
      setJurisprudenciaCarregada(true);
    } finally {
      setLoadingJurisprudencia(false);
      setTimeout(() => setEtapaBusca(''), 1500);
    }
  }, [article, codeName, jurisprudenciaCarregada, loadingJurisprudencia]);

  // Trigger busca quando mudar para tab jurisprudencia
  useEffect(() => {
    if (activeTab === 'jurisprudencia' && !jurisprudenciaCarregada && !loadingJurisprudencia) {
      buscarJurisprudencia();
    }
  }, [activeTab, buscarJurisprudencia, jurisprudenciaCarregada, loadingJurisprudencia]);

  // IMPORTANTE: Os hooks devem ser chamados ANTES de qualquer return condicional
  const numeroArtigo = article?.["Número do Artigo"] || "";
  const conteudo = article?.["Artigo"] || "";
  const artigoId = article?.id || 0;

  // Hook de favoritos
  const { isFavorito, toggleFavorito, isLoading: isLoadingFavorito } = useArtigoFavorito({
    tabelaCodigo: codeName,
    numeroArtigo: numeroArtigo,
    artigoId: artigoId,
    conteudoPreview: conteudo?.substring(0, 200)
  });

  // Hook de grifos
  const {
    highlights,
    isEditing: isHighlightMode,
    setIsEditing: setIsHighlightMode,
    selectedColor,
    setSelectedColor,
    addHighlight,
    removeHighlightAtPosition,
    clearHighlights
  } = useArtigoGrifos({
    tabelaCodigo: codeName,
    numeroArtigo: numeroArtigo,
    artigoId: artigoId
  });

  // Hook de anotações
  const { hasAnotacao } = useArtigoAnotacoes({
    tabelaCodigo: codeName,
    numeroArtigo: numeroArtigo,
    artigoId: artigoId
  });

  // Agora podemos fazer o return condicional
  if (!article) return null;

  const narracaoUrls = parseNarracaoUrls(article["Narração"]);
  const hasNarracao = narracaoUrls.length > 0;
  
  // Verificar se narração é permitida para este artigo
  const numeroArtigoStr = article["Número do Artigo"] || "";
  const canPlayNarration = isNarrationAllowed(numeroArtigoStr, isPremium, codeName);
  const narrationBlocked = hasNarracao && !canPlayNarration;
  
  // Verificar se recursos do artigo são permitidos (favoritar, grifo, anotações, recursos)
  const canUseArticleFeatures = isArticleFeatureAllowed(numeroArtigoStr, isPremium, codeName);
  
  // Handlers que verificam premium antes de executar ação
  const handleFavoritoClick = () => {
    if (!canUseArticleFeatures) {
      const msg = getFeatureBlockedMessage('favorito');
      setPremiumCardMessage(msg);
      setShowPremiumCard(true);
      return;
    }
    toggleFavorito();
  };
  
  const handleHighlightClick = () => {
    if (!canUseArticleFeatures) {
      const msg = getFeatureBlockedMessage('grifo');
      setPremiumCardMessage(msg);
      setShowPremiumCard(true);
      return;
    }
    setIsHighlightMode(!isHighlightMode);
  };
  
  const handleAnotacaoClick = () => {
    if (!canUseArticleFeatures) {
      const msg = getFeatureBlockedMessage('anotacao');
      setPremiumCardMessage(msg);
      setShowPremiumCard(true);
      return;
    }
    setAnotacaoOpen(true);
  };
  
  const handleRecursosBlockedClick = () => {
    const msg = getFeatureBlockedMessage('recurso');
    setPremiumCardMessage(msg);
    setShowPremiumCard(true);
  };
  
  // Handler para interceptar mudança de tabs premium
  const handleTabChange = (newTab: string) => {
    // Tabs premium: explicação, exemplo, termos
    const premiumTabs = ['explicacao', 'exemplo', 'termos'];
    
    if (premiumTabs.includes(newTab) && !canUseArticleFeatures) {
      // Mostrar PremiumFloatingCard com mensagem específica
      const msg = getFeatureBlockedMessage(newTab as 'explicacao' | 'exemplo' | 'termos');
      setPremiumCardMessage(msg);
      setShowPremiumCard(true);
      return; // Não muda de tab
    }
    
    setActiveTab(newTab);
  };

  const increaseFontSize = () => {
    if (fontSize < 24) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  const handleNarracaoClick = async () => {
    // Verificar se artigo é bloqueado para não-premium (art. 6+)
    if (!canPlayNarration) {
      const msg = getNarrationBlockedMessage();
      setPremiumCardMessage(msg);
      setShowPremiumCard(true);
      return;
    }
    
    if (!hasNarracao) {
      // Mostrar toast "Em breve" para artigos sem narração
      toast("Em breve", {
        description: "A narração deste artigo estará disponível em breve",
        icon: <Clock className="w-4 h-4" />,
        duration: 2000,
      });
      return;
    }

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const playCurrentAudio = async () => {
      if (!audioRef.current) {
        audioRef.current = new Audio(narracaoUrls[currentIndex]);
        
        audioRef.current.addEventListener('loadedmetadata', () => {
          setDuration(audioRef.current?.duration || 0);
        });
        
        audioRef.current.addEventListener('timeupdate', () => {
          setCurrentTime(audioRef.current?.currentTime || 0);
        });
        
        audioRef.current.addEventListener('ended', () => {
          // Ir para próximo áudio se houver
          if (currentIndex < narracaoUrls.length - 1) {
            audioRef.current = null;
            setCurrentIndex(prev => prev + 1);
            // Tocar próximo automaticamente
            setTimeout(async () => {
              const nextAudio = new Audio(narracaoUrls[currentIndex + 1]);
              audioRef.current = nextAudio;
              try {
                await playNarration(nextAudio);
              } catch (e) {
                console.error('Erro ao tocar próximo áudio:', e);
              }
            }, 100);
          } else {
            setIsPlaying(false);
            setCurrentTime(0);
            setCurrentIndex(0);
          }
        });
      }

      try {
        // Usar playNarration do contexto para iniciar o áudio de fundo junto
        await playNarration(audioRef.current);
        setIsPlaying(true);
      } catch (e) {
        console.error('Erro ao tocar narração:', e);
      }
    };

    await playCurrentAudio();
  };

  const handlePrevious = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopNarration();
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentIndex(0);
    setSlideDirection('left');
    onPreviousArticle?.();
  };

  const handleNext = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopNarration();
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentIndex(0);
    setSlideDirection('right');
    onNextArticle?.();
  };

  // Check if navigation is available (circular navigation - always available if more than 1 article)
  const canNavigate = totalArticles > 1;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className={`h-[95vh] max-h-[95vh] flex flex-col ${skipInitialAnimation && !hasAnimated ? '[&[data-state=open]]:!duration-0 [&[data-state=open]]:!animate-none' : ''}`}>
        {/* Wrapper para centralizar no desktop */}
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
          {/* Header com controles de fonte */}
          <DrawerHeader className="border-b border-border px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg font-bold text-amber-500">
                Art. {numeroArtigo}
              </DrawerTitle>
              <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
                {/* Botão de ocultar/mostrar anotações */}
                <button
                  onClick={() => setHideAnnotations(!hideAnnotations)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    !hideAnnotations 
                      ? 'text-amber-500 bg-amber-500/20' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                  }`}
                  title={hideAnnotations ? "Revelar anotações legais" : "Ocultar anotações legais"}
                >
                  {hideAnnotations ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                
                {/* Botão de Favorito */}
                <button
                  onClick={handleFavoritoClick}
                  disabled={isLoadingFavorito}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isFavorito 
                      ? 'text-amber-500 bg-amber-500/20' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                  }`}
                  title={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Star className={`w-4 h-4 ${isFavorito ? 'fill-amber-500' : ''}`} />
                </button>

                {/* Botão de Grifo/Destaque */}
                <button
                  onClick={handleHighlightClick}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isHighlightMode 
                      ? 'text-amber-500 bg-amber-500/20' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                  }`}
                  title={isHighlightMode ? "Sair do modo destaque" : "Modo destaque"}
                >
                  <Highlighter className="w-4 h-4" />
                </button>

                {/* Botão de Anotações */}
                <button
                  onClick={handleAnotacaoClick}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    hasAnotacao 
                      ? 'text-amber-500 bg-amber-500/20' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                  }`}
                  title={hasAnotacao ? "Ver anotações" : "Adicionar anotação"}
                >
                  <StickyNote className="w-4 h-4" />
                </button>
                
                {/* Separador */}
                <div className="w-px h-5 bg-border/50 mx-0.5" />
                
                {/* Fechar */}
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-destructive/20 hover:text-destructive transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DrawerHeader>

          {/* Botões flutuantes discretos - fonte e compartilhar */}
          <div className="fixed right-2 bottom-28 z-50">
            <div className="flex flex-col items-center gap-2">
              {/* Botão Aumentar Fonte */}
              <button
                onClick={increaseFontSize}
                disabled={fontSize >= 24}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-30"
                title="Aumentar fonte"
              >
                <Plus className="w-4 h-4" />
              </button>
              
              {/* Botão Compartilhar */}
              <button
                onClick={() => {
                  const textoFormatado = `📜 *${codeName}*\n\n📌 *Artigo ${numeroArtigo}*\n\n${conteudo}\n\n_Enviado via Direito Premium_`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(textoFormatado)}`, '_blank');
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                title="Compartilhar no WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Tabs de alternância */}
        <div className="border-b border-border/50 px-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full h-10 bg-muted/30 p-1 grid grid-cols-4 gap-1">
              <TabsTrigger 
                value="artigo" 
                className="text-xs rounded-md data-[state=active]:bg-amber-600/80 data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                <FileText className="w-3 h-3 mr-1" />
                Artigo
              </TabsTrigger>
              <TabsTrigger 
                value="explicacao" 
                className="text-xs rounded-md data-[state=active]:bg-amber-600/80 data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                <Lightbulb className="w-3 h-3 mr-1" />
                Explicação
              </TabsTrigger>
              <TabsTrigger 
                value="exemplo" 
                className="text-xs rounded-md data-[state=active]:bg-amber-600/80 data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                <BookOpen className="w-3 h-3 mr-1" />
                Exemplo
              </TabsTrigger>
              <TabsTrigger 
                value="termos" 
                className="text-xs rounded-md data-[state=active]:bg-amber-600/80 data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                <BookMarked className="w-3 h-3 mr-1" />
                Termos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conteúdo scrollável - sem animações pesadas */}
        <div className="flex-1 relative overflow-hidden">
          {/* Brasão como marca d'água fixa */}
          {activeTab === "artigo" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <img 
                src={brasaoRepublica} 
                alt="" 
                className="w-80 h-80 object-contain opacity-[0.06]"
                aria-hidden="true"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
            </div>
          )}
          
          <div className="h-full relative z-10">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="px-4 py-6 pb-28">
                  {/* Tab Artigo */}
                  {activeTab === "artigo" && (
                    <div>
                      <ArticleHighlighter
                        content={conteudo || "Conteúdo não disponível"}
                        highlights={highlights}
                        isEditing={isHighlightMode}
                        selectedColor={selectedColor}
                        onAddHighlight={addHighlight}
                        onRemoveHighlightAtPosition={removeHighlightAtPosition}
                        fontSize={fontSize}
                        hideAnnotations={hideAnnotations}
                      />
                    </div>
                  )}

                  {/* Tab Explicação */}
                  {activeTab === "explicacao" && (
                    <div style={{ fontSize: `${fontSize}px` }}>
                      {loadingResumo ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                        </div>
                      ) : resumoData?.resumo_markdown ? (
                        <div className="resumo-content space-y-4">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => <h1 className="text-2xl font-bold text-amber-300 mb-4">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xl font-bold text-amber-300 mt-6 mb-3">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-lg font-semibold text-amber-300 mt-4 mb-2">{children}</h3>,
                              p: ({ children }) => <p className="text-foreground/90 leading-relaxed mb-4">{children}</p>,
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-amber-300/50 pl-4 py-2 my-4 bg-amber-300/5 rounded-r-lg italic text-foreground/80">
                                  {children}
                                </blockquote>
                              ),
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4 text-foreground/90">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground/90">{children}</ol>,
                              li: ({ children }) => <li className="text-foreground/90">{children}</li>,
                              strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                              em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                            }}
                          >
                            {resumoData.resumo_markdown}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-center">Explicação não disponível para este artigo</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab Exemplo */}
                  {activeTab === "exemplo" && (
                    <div style={{ fontSize: `${fontSize}px` }}>
                      {loadingResumo ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                        </div>
                      ) : resumoData?.exemplos ? (
                        <div className="resumo-content space-y-4">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => <h1 className="text-2xl font-bold text-amber-300 mb-4">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xl font-bold text-amber-300 mt-6 mb-3">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-lg font-semibold text-amber-300 mt-4 mb-2">{children}</h3>,
                              p: ({ children }) => <p className="text-foreground/90 leading-relaxed mb-4">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4 text-foreground/90">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground/90">{children}</ol>,
                              li: ({ children }) => <li className="text-foreground/90">{children}</li>,
                              strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                            }}
                          >
                            {resumoData.exemplos}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-center">Exemplo não disponível para este artigo</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab Termos */}
                  {activeTab === "termos" && (
                    <div style={{ fontSize: `${fontSize}px` }}>
                      {loadingResumo ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                        </div>
                      ) : resumoData?.termos ? (
                        <div className="resumo-content space-y-4">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => <h1 className="text-2xl font-bold text-amber-300 mb-4">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xl font-bold text-amber-300 mt-6 mb-3">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-lg font-semibold text-amber-300 mt-4 mb-2">{children}</h3>,
                              p: ({ children }) => <p className="text-foreground/90 leading-relaxed mb-4">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4 text-foreground/90">{children}</ul>,
                              strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                            }}
                          >
                            {resumoData.termos}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <BookMarked className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-center">Termos não disponíveis para este artigo</p>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Rodapé fixo com Narração e Recursos */}
        <div className="flex-shrink-0 border-t border-border/50 bg-gradient-to-t from-background via-background to-background/95 backdrop-blur-md p-3 pb-6 safe-area-bottom">
          <div className="flex items-center gap-2 h-12">
            {/* Botões: Narração e Recursos */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              {/* Botão Narração - sempre clicável, mostra toast se não tem áudio */}
              <button
                onClick={handleNarracaoClick}
                className={`
                  group relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 overflow-hidden
                  ${hasNarracao 
                    ? 'bg-amber-600/90 text-white border border-amber-500/50 hover:bg-amber-500/90'
                    : 'bg-amber-700/60 text-amber-200 border border-amber-600/40 hover:bg-amber-600/70'
                  }
                `}
              >
                {/* Barra de progresso que preenche o botão */}
                {isPlaying && duration > 0 && (
                  <div 
                    className="absolute inset-y-0 left-0 bg-amber-400 transition-all duration-200 ease-linear"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                )}
                
                {/* Ícone com animação quando tocando */}
                <div className="relative z-10 flex items-center gap-1">
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 text-white" />
                      {/* Barras de som animadas */}
                      <div className="flex items-end gap-0.5 h-4 ml-1">
                        <div className="w-0.5 bg-white rounded-full animate-pulse" style={{ height: '40%', animationDelay: '0ms' }} />
                        <div className="w-0.5 bg-white rounded-full animate-pulse" style={{ height: '70%', animationDelay: '150ms' }} />
                        <div className="w-0.5 bg-white rounded-full animate-pulse" style={{ height: '100%', animationDelay: '300ms' }} />
                        <div className="w-0.5 bg-white rounded-full animate-pulse" style={{ height: '50%', animationDelay: '450ms' }} />
                      </div>
                    </>
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </div>
                
                <span className={`text-sm relative z-10 ${isPlaying ? 'text-white font-semibold' : 'text-white'}`}>
                  {narracaoUrls.length > 1 && isPlaying ? `Parte ${currentIndex + 1}/${narracaoUrls.length}` : 'Narração'}
                </span>
              </button>

              {/* Botão Recursos - vermelho claro */}
              <button
                onClick={() => setShowRecursos(true)}
                className="group relative flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium overflow-hidden transition-all duration-300 bg-rose-500/90 hover:bg-rose-400/90 border border-rose-400/50"
              >
                {/* Efeito de brilho animado */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite',
                  }}
                />
                {/* Brilho sutil constante */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
                  }}
                />
                <Sparkles className="w-4 h-4 text-white relative z-10" />
                <span className="text-sm text-white relative z-10 font-medium">Recursos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dialog de Recursos (ArtigoActionsMenu) */}
        <AnimatePresence>
          {showRecursos && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[55] flex items-end justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowRecursos(false)}
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg bg-card rounded-t-2xl p-4 pb-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recursos do Artigo</h3>
                  <Button
                    onClick={() => setShowRecursos(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <ArtigoActionsMenu
                  article={article}
                  codigoNome={codeName}
                  onPlayComment={(audioUrl, title) => {
                    setShowRecursos(false);
                    onPlayComment?.(audioUrl, title);
                  }}
                  onOpenAula={() => {
                    setShowRecursos(false);
                    onOpenAula?.(article);
                  }}
                  onOpenExplicacao={(tipo) => {
                    setShowRecursos(false);
                    onOpenExplicacao?.(conteudo, numeroArtigo, tipo);
                  }}
                  onGenerateFlashcards={() => {
                    setShowRecursos(false);
                    onGenerateFlashcards?.(conteudo, numeroArtigo);
                  }}
                  onOpenTermos={() => {
                    setShowRecursos(false);
                    onOpenTermos?.(conteudo, numeroArtigo);
                  }}
                  onOpenQuestoes={() => {
                    setShowRecursos(false);
                    onOpenQuestoes?.(conteudo, numeroArtigo);
                  }}
                  onPerguntar={() => {
                    setShowRecursos(false);
                    onPerguntar?.(conteudo, numeroArtigo);
                  }}
                  onOpenAulaArtigo={() => {
                    setShowRecursos(false);
                    onOpenAulaArtigo?.(conteudo, numeroArtigo);
                  }}
                  loadingFlashcards={loadingFlashcards || false}
                  isCommentPlaying={
                    stickyPlayerOpen && 
                    currentAudio?.isComment && 
                    currentAudio.title.includes(numeroArtigo)
                  }
                  isEmbedded={true}
                  onShowPremiumCard={() => {
                    setShowRecursos(false);
                    setShowPremiumCard(true);
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div> {/* Fecha wrapper max-w-4xl */}
      </DrawerContent>

      {/* Drawer de Jurisprudência */}
      <JurisprudenciaDrawer
        isOpen={drawerJurisAberto}
        onClose={() => setDrawerJurisAberto(false)}
        item={jurisprudenciaSelecionada}
        currentIndex={jurisprudenciaIndex}
        totalItems={jurisprudencias.length}
        onNavigate={(direction) => {
          if (direction === 'prev' && jurisprudenciaIndex > 0) {
            const newIndex = jurisprudenciaIndex - 1;
            setJurisprudenciaIndex(newIndex);
            setJurisprudenciaSelecionada(jurisprudencias[newIndex]);
          } else if (direction === 'next' && jurisprudenciaIndex < jurisprudencias.length - 1) {
            const newIndex = jurisprudenciaIndex + 1;
            setJurisprudenciaIndex(newIndex);
            setJurisprudenciaSelecionada(jurisprudencias[newIndex]);
          }
        }}
      />

      {/* Color Picker para modo destaque */}
      {isHighlightMode && activeTab === "artigo" && (
        <HighlightColorPicker
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          onClearAll={clearHighlights}
          onClose={() => setIsHighlightMode(false)}
          hasHighlights={highlights.length > 0}
        />
      )}

      {/* Drawer de Anotações */}
      <AnotacaoDrawer
        open={anotacaoOpen}
        onClose={() => setAnotacaoOpen(false)}
        tabelaCodigo={codeName}
        numeroArtigo={numeroArtigo}
        artigoId={artigoId}
        codeName={codeName}
      />

      {/* Card Premium para recursos bloqueados - Portal para evitar conflito com Drawer */}
      {showPremiumCard && createPortal(
        <PremiumFloatingCard
          isOpen={showPremiumCard}
          onClose={() => setShowPremiumCard(false)}
          title={premiumCardMessage.title || getNarrationBlockedMessage().title}
          description={premiumCardMessage.description || getNarrationBlockedMessage().description}
        />,
        document.body
      )}
    </Drawer>
  );
};
