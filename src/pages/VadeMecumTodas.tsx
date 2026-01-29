import { useNavigate } from "react-router-dom";
import { Crown, Gavel, FileText, BookText, Scale, Shield, HandCoins, ChevronRight, FileCheck, Users, ShieldCheck, Fingerprint, DollarSign, BookMarked, BadgeCheck, Handshake, User, AlertTriangle, Briefcase, Bell, Calendar, FileSearch, ArrowLeft, Search, Loader2, ListFilter, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import brasaoRepublica from "@/assets/brasao-republica.png";
import heroVadeMecumMenu from "@/assets/hero-vademecum-planalto.webp";
import heroVadeMecumAtualizacoes from "@/assets/vade-mecum-hero.webp";
import heroVadeMecumBusca from "@/assets/hero-vademecum-busca.webp";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import PopularProposicoesManual from "@/components/PopularProposicoesManual";
import ExplicacoesList from "@/components/lei-seca/ExplicacoesList";
import { PesquisaLegislacaoTimeline } from "@/components/PesquisaLegislacaoTimeline";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

interface MainCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  iconBg: string;
  color: string;
}

interface ResenhaItem {
  id: string;
  numero_lei: string;
  ementa: string;
  data_publicacao: string;
}

interface SearchResult {
  tableName: string;
  displayName: string;
  articleNumber: string;
  content: string;
  route: string;
  color: string;
}

const VadeMecumTodas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [activeTab, setActiveTab] = useState("menu");
  const [showLegislacao, setShowLegislacao] = useState(false);
  const [resenhaItems, setResenhaItems] = useState<ResenhaItem[]>([]);
  const [isLoadingResenha, setIsLoadingResenha] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>("todos");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Pre-carregar todas as imagens de fundo
  const [imagesLoaded, setImagesLoaded] = useState({
    menu: false,
    atualizacoes: false,
    busca: false
  });

  useEffect(() => {
    // Pre-carregar imagens
    const images = [
      { key: 'menu', src: heroVadeMecumMenu },
      { key: 'atualizacoes', src: heroVadeMecumAtualizacoes },
      { key: 'busca', src: heroVadeMecumBusca }
    ];
    
    images.forEach(({ key, src }) => {
      const img = new Image();
      img.src = src;
      img.onload = () => setImagesLoaded(prev => ({ ...prev, [key]: true }));
    });
  }, []);

  // Carregar últimas atualizações da Resenha Diária quando aba ativa
  useEffect(() => {
    if (activeTab === "atualizacoes") {
      fetchResenhaItems();
    }
  }, [activeTab]);

  const fetchResenhaItems = async () => {
    setIsLoadingResenha(true);
    try {
      const { data, error } = await supabase
        .from('resenha_diaria')
        .select('id, numero_lei, ementa, data_publicacao')
        .order('data_publicacao', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setResenhaItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar resenha:', error);
    } finally {
      setIsLoadingResenha(false);
    }
  };

  // Agrupar itens por data de publicação
  const resenhaGroupedByDate = resenhaItems.reduce((acc, item) => {
    const date = item.data_publicacao;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, ResenhaItem[]>);

  // 4 Cards principais em formato de linha do tempo (Jurisprudência apenas para admin)
  const mainCards: MainCard[] = [
    {
      id: "pesquisa-legislacao",
      title: "Legislação",
      description: "Constituição, Códigos, Estatutos, Súmulas",
      icon: Scale,
      route: "",
      iconBg: "bg-blue-500",
      color: "#3b82f6"
    },
    ...(isAdmin ? [{
      id: "jurisprudencia",
      title: "Jurisprudência",
      description: "Corpus 927 - STF e STJ",
      icon: Gavel,
      route: "/jurisprudencia-corpus-927",
      iconBg: "bg-purple-500",
      color: "#a855f7"
    }] : []),
    {
      id: "resenha-diaria",
      title: "Resenha Diária",
      description: "Novas leis no Diário Oficial",
      icon: Calendar,
      route: "/vade-mecum/resenha-diaria",
      iconBg: "bg-orange-500",
      color: "#f97316"
    },
    {
      id: "push-legislacao",
      title: "Push de Legislação",
      description: "Alertas de novas leis por e-mail",
      icon: Bell,
      route: "/vade-mecum/push-legislacao",
      iconBg: "bg-emerald-500",
      color: "#10b981"
    }
  ];

  const searchCategories = [
    { id: "todos", label: "Todos", icon: ListFilter, color: "#6b7280" },
    { id: "constituicao", label: "Constituição", icon: Crown, color: "#f97316" },
    { id: "codigos", label: "Códigos", icon: Scale, color: "#ef4444" },
    { id: "penal", label: "Legislação Penal", icon: Gavel, color: "#dc2626" },
    { id: "estatutos", label: "Estatutos", icon: Shield, color: "#10b981" },
    { id: "leis", label: "Leis Ordinárias", icon: FileText, color: "#3b82f6" },
    { id: "sumulas", label: "Súmulas", icon: BookText, color: "#8b5cf6" },
  ];

  // Mapeamento de tabelas para busca
  const tabelasBusca = {
    constituicao: [
      { table: "CF - Constituição Federal", name: "Constituição Federal", route: "/constituicao", color: "#f97316" }
    ],
    codigos: [
      { table: "CC - Código Civil", name: "Código Civil", route: "/codigo/cc", color: "#ef4444" },
      { table: "CP - Código Penal", name: "Código Penal", route: "/codigo/cp", color: "#dc2626" },
      { table: "CPC - Código de Processo Civil", name: "Código de Processo Civil", route: "/codigo/cpc", color: "#b91c1c" },
      { table: "CPP – Código de Processo Penal", name: "Código de Processo Penal", route: "/codigo/cpp", color: "#991b1b" },
      { table: "CLT - Consolidação das Leis do Trabalho", name: "CLT", route: "/codigo/clt", color: "#7f1d1d" },
      { table: "CTN – Código Tributário Nacional", name: "Código Tributário Nacional", route: "/codigo/ctn", color: "#f87171" },
      { table: "CDC – Código de Defesa do Consumidor", name: "Código de Defesa do Consumidor", route: "/codigo/cdc", color: "#fca5a5" },
      { table: "CTB Código de Trânsito Brasileiro", name: "Código de Trânsito", route: "/codigo/ctb", color: "#fb923c" },
      { table: "CE – Código Eleitoral", name: "Código Eleitoral", route: "/codigo/ce", color: "#fcd34d" },
    ],
    penal: [
      { table: "CP - Código Penal", name: "Código Penal", route: "/codigo/cp", color: "#dc2626" },
      { table: "CPP – Código de Processo Penal", name: "Código de Processo Penal", route: "/codigo/cpp", color: "#991b1b" },
      { table: "Lei 7.210 de 1984 - Lei de Execução Penal", name: "Lei de Execução Penal", route: "/lei/lep", color: "#b91c1c" },
      { table: "Lei 8.072 de 1990 - Crimes Hediondos", name: "Crimes Hediondos", route: "/lei/hediondos", color: "#7f1d1d" },
      { table: "Lei 11.340 de 2006 - Maria da Penha", name: "Maria da Penha", route: "/lei/maria-penha", color: "#be123c" },
      { table: "Lei 11.343 de 2006 - Lei de Drogas", name: "Lei de Drogas", route: "/lei/drogas", color: "#9f1239" },
      { table: "Lei 12.850 de 2013 - Organizações Criminosas", name: "Organizações Criminosas", route: "/lei/org-criminosas", color: "#881337" },
    ],
    estatutos: [
      { table: "ESTATUTO - ECA", name: "Estatuto da Criança e Adolescente", route: "/estatuto/eca", color: "#10b981" },
      { table: "ESTATUTO - IDOSO", name: "Estatuto do Idoso", route: "/estatuto/idoso", color: "#059669" },
      { table: "ESTATUTO - OAB", name: "Estatuto da OAB", route: "/estatuto/oab", color: "#047857" },
      { table: "ESTATUTO - PESSOA COM DEFICIÊNCIA", name: "Estatuto da Pessoa com Deficiência", route: "/estatuto/deficiencia", color: "#065f46" },
      { table: "ESTATUTO - IGUALDADE RACIAL", name: "Estatuto da Igualdade Racial", route: "/estatuto/igualdade-racial", color: "#064e3b" },
      { table: "ESTATUTO - DESARMAMENTO", name: "Estatuto do Desarmamento", route: "/estatuto/desarmamento", color: "#14b8a6" },
      { table: "ESTATUTO - CIDADE", name: "Estatuto da Cidade", route: "/estatuto/cidade", color: "#0d9488" },
      { table: "ESTATUTO - TORCEDOR", name: "Estatuto do Torcedor", route: "/estatuto/torcedor", color: "#0f766e" },
    ],
    leis: [
      { table: "Lei 9.099 de 1995 - Juizados Especiais", name: "Juizados Especiais", route: "/lei/juizados", color: "#3b82f6" },
      { table: "Lei 9.296 de 1996 - Interceptação Telefônica", name: "Interceptação Telefônica", route: "/lei/interceptacao", color: "#2563eb" },
    ],
    sumulas: [
      { table: "SUMULAS_STF", name: "Súmulas STF", route: "/sumulas/stf", color: "#8b5cf6" },
      { table: "SUMULAS_STJ", name: "Súmulas STJ", route: "/sumulas/stj", color: "#7c3aed" },
      { table: "SUMULAS_TST", name: "Súmulas TST", route: "/sumulas/tst", color: "#6d28d9" },
    ]
  };

  // Função de busca rápida
  const executarBuscaRapida = async () => {
    if (!searchQuery.trim()) return;
    
    const numeroArtigo = searchQuery.trim();
    
    // Se categoria específica (não "todos"), navega direto
    if (selectedCategory === "constituicao") {
      navigate(`/constituicao?artigo=${numeroArtigo}`);
      return;
    }
    
    // Para "todos" ou "codigos" ou "sumulas", buscar e mostrar lista
    setIsSearching(true);
    setShowResults(false);
    setSearchResults([]);
    
    try {
      const results: SearchResult[] = [];
      
      // Determinar quais tabelas buscar
      let tabelasParaBuscar: typeof tabelasBusca.constituicao = [];
      
      if (selectedCategory === "todos") {
        tabelasParaBuscar = [
          ...tabelasBusca.constituicao,
          ...tabelasBusca.codigos,
          ...tabelasBusca.penal,
          ...tabelasBusca.estatutos,
          ...tabelasBusca.leis,
          ...tabelasBusca.sumulas
        ];
        // Remover duplicatas
        const seen = new Set<string>();
        tabelasParaBuscar = tabelasParaBuscar.filter(t => {
          if (seen.has(t.table)) return false;
          seen.add(t.table);
          return true;
        });
      } else if (selectedCategory === "codigos") {
        tabelasParaBuscar = tabelasBusca.codigos;
      } else if (selectedCategory === "penal") {
        tabelasParaBuscar = tabelasBusca.penal;
      } else if (selectedCategory === "estatutos") {
        tabelasParaBuscar = tabelasBusca.estatutos;
      } else if (selectedCategory === "leis") {
        tabelasParaBuscar = tabelasBusca.leis;
      } else if (selectedCategory === "sumulas") {
        tabelasParaBuscar = tabelasBusca.sumulas;
      }
      
      // Buscar em cada tabela
      for (const tabela of tabelasParaBuscar) {
        try {
          const { data, error } = await supabase
            .from(tabela.table as any)
            .select('"Número do Artigo", Artigo')
            .eq('"Número do Artigo"', numeroArtigo)
            .maybeSingle();
          
          if (!error && data) {
            const artigo = data as any;
            results.push({
              tableName: tabela.table,
              displayName: tabela.name,
              articleNumber: artigo["Número do Artigo"] || `Art. ${numeroArtigo}`,
              content: artigo.Artigo?.substring(0, 150) + "..." || "",
              route: `${tabela.route}?artigo=${numeroArtigo}`,
              color: tabela.color
            });
          }
        } catch (err) {
          console.log(`Tabela ${tabela.table} não encontrada ou erro:`, err);
        }
      }
      
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error("Erro na busca rápida:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMainCardClick = (card: MainCard) => {
    if (card.id === "pesquisa-legislacao") {
      setShowLegislacao(true);
    } else {
      navigate(card.route);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Se clicou em "Pesquisa de Legislação", mostra a tela animada
  if (showLegislacao) {
    return (
      <AnimatePresence mode="wait">
        <PesquisaLegislacaoTimeline onVoltar={() => setShowLegislacao(false)} />
      </AnimatePresence>
    );
  }

  // Selecionar imagem baseada na aba ativa
  const currentHeroImage = activeTab === "menu" 
    ? heroVadeMecumMenu 
    : activeTab === "atualizacoes" 
      ? heroVadeMecumAtualizacoes 
      : heroVadeMecumBusca;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden overscroll-contain" style={{ contain: 'layout style' }}>
      {/* Hero Background Full Screen FIXO - muda por aba */}
      <div className="fixed inset-0 z-0">
        {/* Menu background */}
        <img
          src={heroVadeMecumMenu}
          alt="Vade Mecum - Menu"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${activeTab === "menu" ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
          fetchPriority="high"
        />
        {/* Atualizações background */}
        <img
          src={heroVadeMecumAtualizacoes}
          alt="Vade Mecum - Atualizações"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${activeTab === "atualizacoes" ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
        />
        {/* Busca background */}
        <img
          src={heroVadeMecumBusca}
          alt="Vade Mecum - Busca"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${activeTab === "busca" ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
        />
        
        {/* Gradient Overlay - mais escuro nas abas Atualizações e Busca */}
        <div 
          className="absolute inset-0 transition-all duration-300"
          style={{
            background: activeTab === "menu" 
              ? `linear-gradient(
                  to bottom,
                  hsl(var(--background) / 0) 0%,
                  hsl(var(--background) / 0.15) 30%,
                  hsl(var(--background) / 0.4) 60%,
                  hsl(var(--background) / 0.85) 100%
                )`
              : `linear-gradient(
                  to bottom,
                  hsl(var(--background) / 0.5) 0%,
                  hsl(var(--background) / 0.65) 30%,
                  hsl(var(--background) / 0.8) 60%,
                  hsl(var(--background) / 0.92) 100%
                )`
          }}
        />
      </div>
      
      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header sticky com blur - padrão unificado */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Vade Mecum X</h1>
                <p className="text-muted-foreground text-sm">
                  Seu Vade Mecum Jurídico <span className="text-amber-400 font-semibold">2026</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sistema de Tabs - padrão Flashcards */}
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-card/80 backdrop-blur-md border border-border/50 h-auto p-1">
              <TabsTrigger 
                value="menu" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
              >
                <Scale className="w-4 h-4" />
                <span>Menu</span>
              </TabsTrigger>
              <TabsTrigger 
                value="busca" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
              >
                <Search className="w-4 h-4" />
                <span>Busca</span>
              </TabsTrigger>
              <TabsTrigger 
                value="atualizacoes" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explicação</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto">
          {/* Aba Menu - Timeline Curva */}
          {activeTab === "menu" && (
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 pt-6">
              <div className="relative">
                {/* Linha curva SVG de fundo com animação de luz */}
                <svg 
                  className="absolute left-0 top-0 w-full h-full pointer-events-none"
                  viewBox="0 0 400 600"
                  preserveAspectRatio="none"
                  style={{ zIndex: 0, willChange: 'transform', transform: 'translateZ(0)' }}
                >
                  <defs>
                    <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="25%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    
                    <linearGradient id="lightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="transparent">
                        <animate attributeName="stop-color" values="transparent;#ffffff;transparent" dur="3s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="50%" stopColor="#ffffff">
                        <animate attributeName="stop-color" values="#ffffff;transparent;#ffffff" dur="3s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%" stopColor="transparent">
                        <animate attributeName="stop-color" values="transparent;#ffffff;transparent" dur="3s" repeatCount="indefinite" />
                      </stop>
                    </linearGradient>
                    
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <path
                    d="M 50 30 
                       Q 350 30, 350 150
                       Q 350 270, 50 270
                       Q -50 270, 50 390
                       Q 150 510, 350 510"
                    fill="none"
                    stroke="url(#timelineGradient)"
                    strokeWidth="3"
                    strokeDasharray="8 4"
                    className="opacity-60"
                  />
                  
                  <circle r="6" fill="white" filter="url(#glow)">
                    <animateMotion
                      dur="4s"
                      repeatCount="indefinite"
                      path="M 50 30 
                            Q 350 30, 350 150
                            Q 350 270, 50 270
                            Q -50 270, 50 390
                            Q 150 510, 350 510"
                    />
                    <animate 
                      attributeName="opacity" 
                      values="0.3;1;0.3" 
                      dur="2s" 
                      repeatCount="indefinite" 
                    />
                  </circle>
                  
                  <circle r="4" fill="#3b82f6" filter="url(#glow)">
                    <animateMotion
                      dur="4s"
                      repeatCount="indefinite"
                      begin="2s"
                      path="M 50 30 
                            Q 350 30, 350 150
                            Q 350 270, 50 270
                            Q -50 270, 50 390
                            Q 150 510, 350 510"
                    />
                    <animate 
                      attributeName="opacity" 
                      values="0.5;1;0.5" 
                      dur="1.5s" 
                      repeatCount="indefinite" 
                    />
                  </circle>
                </svg>

                {/* Cards da timeline */}
                <div className="relative z-10 space-y-6" style={{ contain: 'content' }}>
                  {mainCards.map((card, index) => {
                    const Icon = card.icon;
                    const isEven = index % 2 === 0;
                    
                    return (
                      <div
                        key={card.id}
                        className={`flex ${isEven ? 'justify-start' : 'justify-end'}`}
                        style={{ 
                          opacity: 0,
                          transform: 'translateY(-20px) translateZ(0)',
                          animation: `slideDown 0.5s ease-out ${index * 0.15}s forwards`,
                          willChange: 'transform, opacity'
                        }}
                      >
                        <div
                          onClick={() => handleMainCardClick(card)}
                          className={`
                            w-[75%] sm:w-[60%]
                            bg-card/95 backdrop-blur-sm
                            rounded-2xl
                            border-2 border-white/20
                            cursor-pointer
                            hover:scale-[1.02] hover:shadow-2xl
                            transition-all duration-200
                            relative overflow-hidden
                            shadow-xl
                            group
                          `}
                          style={{
                            borderLeftColor: card.color,
                            borderLeftWidth: '4px',
                            transform: 'translateZ(0)',
                            willChange: 'transform',
                            height: '72px'
                          }}
                        >
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: `radial-gradient(circle at center, ${card.color}20 0%, transparent 70%)`
                            }}
                          />
                          
                          <div className="flex items-center gap-3 relative z-10 h-full px-4">
                            <div 
                              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${card.iconBg}`}
                              style={{ boxShadow: `0 4px 20px ${card.color}40` }}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-foreground truncate">{card.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.description}</p>
                            </div>
                            
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Seção especial com brasão */}
                <div 
                  className="mt-10 text-center"
                  style={{ 
                    opacity: 0,
                    animation: 'slideDown 0.6s ease-out 0.7s forwards'
                  }}
                >
                  <div className="inline-flex flex-col items-center">
                    <img 
                      src={brasaoRepublica} 
                      alt="Brasão da República Federativa do Brasil" 
                      className="w-20 h-20 object-contain mb-4 drop-shadow-lg"
                    />
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      Seu Vade Mecum Digital
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                      Acesse a legislação brasileira sempre atualizada, jurisprudências consolidadas do STF e STJ, 
                      e receba notificações sobre novas leis diretamente no seu dispositivo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aba Explicação - Artigos Educativos */}
          {activeTab === "atualizacoes" && (
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 pt-6">
              <ExplicacoesList />
            </div>
          )}

          {/* Aba Busca Rápida - Por número de artigo */}
          {activeTab === "busca" && (
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 pt-6">
              <div className="space-y-6">
                {/* Título e instrução */}
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
                    <Search className="w-5 h-5 text-blue-500" />
                    Busca Rápida por Artigo
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Digite o número do artigo e selecione onde buscar
                  </p>
                </div>
                
                {/* Campo de Busca - Número do Artigo */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Digite um número"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(false);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && executarBuscaRapida()}
                    className="h-16 bg-card/90 backdrop-blur-sm border-white/20 rounded-xl text-2xl font-bold text-center focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                
                {/* Filtros por Categoria */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Buscar em:</h3>
                  <div className="flex flex-wrap gap-2">
                    {searchCategories.map((category) => {
                      const Icon = category.icon;
                      const isSelected = selectedCategory === category.id;
                      
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setShowResults(false);
                          }}
                          className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
                            transition-all border
                            ${isSelected 
                              ? 'text-white border-transparent' 
                              : 'bg-card/80 text-foreground border-white/20 hover:border-blue-500/50'
                            }
                          `}
                          style={{
                            backgroundColor: isSelected ? category.color : undefined
                          }}
                        >
                          <Icon className="w-4 h-4" />
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Botão de Busca */}
                <Button
                  onClick={executarBuscaRapida}
                  disabled={!searchQuery.trim() || isSearching}
                  className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-xl"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Buscar Art. {searchQuery || "..."}
                    </>
                  )}
                </Button>
                
                {/* Resultados da Busca */}
                {showResults && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {searchResults.length > 0 
                        ? `${searchResults.length} resultado(s) encontrado(s)`
                        : "Nenhum resultado encontrado"
                      }
                    </h3>
                    
                    {searchResults.length === 0 ? (
                      <div 
                        className="bg-card/80 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10"
                        style={{
                          animation: 'slideUp 0.4s ease-out forwards'
                        }}
                      >
                        <FileSearch className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          Art. {searchQuery} não encontrado nas leis selecionadas
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {searchResults.map((result, index) => (
                          <div
                            key={result.tableName}
                            onClick={() => navigate(result.route)}
                            className="bg-card/90 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-blue-500/50 cursor-pointer transition-all hover:shadow-lg group"
                            style={{
                              opacity: 0,
                              animation: `slideUp 0.4s ease-out ${index * 0.1}s forwards`,
                              borderLeftWidth: '4px',
                              borderLeftColor: result.color
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${result.color}20` }}
                              >
                                <Scale className="w-5 h-5" style={{ color: result.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span 
                                    className="text-xs font-medium px-2 py-0.5 rounded"
                                    style={{ 
                                      backgroundColor: `${result.color}20`,
                                      color: result.color
                                    }}
                                  >
                                    {result.articleNumber}
                                  </span>
                                </div>
                                <h3 className="font-semibold text-sm text-foreground group-hover:text-blue-500 transition-colors">
                                  {result.displayName}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {result.content}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) translateZ(0);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateZ(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default VadeMecumTodas;
