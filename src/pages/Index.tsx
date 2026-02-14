import { useNavigate, useSearchParams } from "react-router-dom";
import heroVadeMecumPlanalto from "@/assets/hero-vademecum-planalto.webp";
import heroThemisCrying from "@/assets/hero-themis-crying-realistic.webp";
import { DesktopVadeMecumHome } from "@/components/desktop/DesktopVadeMecumHome";
import themisEstudosDesktop from "@/assets/themis-estudos-desktop.webp";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Crown, Gavel, FileText, Scale, GraduationCap, BookOpen as BookOpenIcon, Library, Hammer, Target, Search, Headphones, Play, Loader2, Newspaper, ArrowRight, Sparkles, Scroll, Brain, Monitor, Video, BookOpen, Calendar, Settings, Flame, MonitorSmartphone, Users, Landmark, Clapperboard, BarChart3, Film, MessageCircle, Clock, Map, MapPin, Award, Wrench, Baby, BookText, FileCheck, ClipboardList, Layers, Route, Footprints, Briefcase, ChevronRight, ChevronDown, Compass } from "lucide-react";
import cardAulasThumb from "@/assets/card-aulas-thumb.jpg";
import bibliotecaThumb from "@/assets/biblioteca-office-sunset.webp";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import useEmblaCarousel from 'embla-carousel-react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AudioAula } from "@/types/database.types";
import BibliotecasCarousel from "@/components/BibliotecasCarousel";
import ProposicoesRecentesCarousel from "@/components/ProposicoesRecentesCarousel";
import { useFeaturedNews } from "@/hooks/useFeaturedNews";
import { Button } from "@/components/ui/button";
import { CursosCarousel } from "@/components/CursosCarousel";
import { VideoaulasOABAreasCarousel } from "@/components/VideoaulasOABAreasCarousel";
import { DocumentariosCarousel } from "@/components/DocumentariosCarousel";
import NoticiaCarouselCard from "@/components/NoticiaCarouselCard";
import { useDeviceType } from "@/hooks/use-device-type";
import { CarreirasJuridicasCarousel } from "@/components/CarreirasJuridicasCarousel";
import ResumosDisponiveisCarousel from "@/components/ResumosDisponiveisCarousel";

import BlogInicianteCarousel from "@/components/BlogInicianteCarousel";
import BussolaCarreiraCarousel from "@/components/BussolaCarreiraCarousel";
import { OabCarreiraBlogList } from "@/components/oab/OabCarreiraBlogList";
import { EmAltaSection } from "@/components/EmAltaSection";
import { CarreirasSection } from "@/components/CarreirasSection";
import { PoliticaHomeSection } from "@/components/home/PoliticaHomeSection";
import { RecomendacaoHomeSection } from "@/components/home/RecomendacaoHomeSection";
import { DesktopTrilhasAprender } from "@/components/desktop/DesktopTrilhasAprender";
import { DesktopTrilhasOAB } from "@/components/desktop/DesktopTrilhasOAB";
import { DesktopHomeDestaque } from "@/components/desktop/DesktopHomeDestaque";
import { MobileTrilhasAprender } from "@/components/mobile/MobileTrilhasAprender";
import { MobileLeisHome } from "@/components/mobile/MobileLeisHome";
import { JornadaHomeSection } from "@/components/home/JornadaHomeSection";
import { useRoutePrefetch } from "@/hooks/useRoutePrefetch";
import { WelcomeAudioPlayer } from "@/components/WelcomeAudioPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SearchBarAnimatedText from "@/components/SearchBarAnimatedText";
import { preloadImages } from "@/hooks/useInstantCache";
import IntroCarousel from "@/components/onboarding/IntroCarousel";
import PremiumCelebration from "@/components/onboarding/PremiumCelebration";

// Imagens de carreiras para preload
import carreiraAdvogado from "@/assets/carreira-advogado.webp";
import carreiraJuiz from "@/assets/carreira-juiz.webp";
import carreiraDelegado from "@/assets/carreira-delegado.webp";
import carreiraPromotor from "@/assets/carreira-promotor.webp";
import carreiraPrf from "@/assets/carreira-prf.webp";
import carreiraPf from "@/assets/pf-004-opt.webp";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia,";
  if (hour >= 12 && hour < 18) return "Boa tarde,";
  return "Boa noite,";
};

// Lista de imagens de carreiras para preload
const CARREIRAS_IMAGES = [
  carreiraAdvogado, carreiraJuiz, carreiraDelegado,
  carreiraPromotor, carreiraPrf, carreiraPf
];

const HERO_IMAGES_STATIC: Record<string, string> = {
  jornada: '/hero-banner-themis-advogado-v2.webp',
  estudos: '/hero-banner-themis-advogado-v2.webp',
  explorar: '/hero-banner-themis-chorando.webp',
};

type JornadaTipo = 'conceitos' | 'oab';

const JORNADAS_OPTIONS = [
  { id: 'conceitos' as JornadaTipo, label: 'Conceitos', sublabel: 'Fundamentos do Direito', icon: GraduationCap },
  { id: 'oab' as JornadaTipo, label: 'OAB', sublabel: '1ª e 2ª Fase', icon: Scale },
];

type MainTab = 'jornada' | 'estudos' | 'leis' | 'explorar';
type FaculdadeSubTab = 'estudos' | 'ferramentas';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDesktop } = useDeviceType();
  const { handleLinkHover } = useRoutePrefetch();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Parallax scroll state
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Buscar nome do usuário para saudação
  const [userName, setUserName] = useState<string | null>(null);
  useEffect(() => {
    if (!user) { setUserName(null); return; }
    supabase.from('profiles').select('nome').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.nome) setUserName(data.nome.split(' ')[0]);
      });
  }, [user]);

  // Premium celebration for new subscribers
  const [showCelebration, setShowCelebration] = useState(() => {
    if (!user) return false;
    const key = `just_subscribed_${user.id}`;
    if (localStorage.getItem(key) === 'true') {
      localStorage.removeItem(key);
      return true;
    }
    return false;
  });

  // Intro carousel for first-time users
  const [showIntro, setShowIntro] = useState(() => {
    if (!user) return false;
    return !localStorage.getItem(`intro_carousel_seen_${user.id}`);
  });

  const handleIntroComplete = useCallback(() => {
    if (user) {
      localStorage.setItem(`intro_carousel_seen_${user.id}`, 'true');
    }
    setShowIntro(false);
  }, [user]);
  
  // Ler tab da URL para navegação de volta (default agora é 'ferramentas' / Estudos)
  const tabFromUrl = searchParams.get('tab') as MainTab | null;
  const [mainTab, setMainTab] = useState<MainTab>(tabFromUrl || 'estudos');
  const [faculdadeSubTab, setFaculdadeSubTab] = useState<FaculdadeSubTab>('estudos');

  // Jornada selector state (Conceitos / OAB)
  const [jornadaAtiva, setJornadaAtiva] = useState<JornadaTipo>(() => {
    return (localStorage.getItem('jornada_ativa') as JornadaTipo) || 'conceitos';
  });
  const [showJornadaSelector, setShowJornadaSelector] = useState(false);

  const handleSelectJornada = (tipo: JornadaTipo) => {
    setJornadaAtiva(tipo);
    localStorage.setItem('jornada_ativa', tipo);
    setShowJornadaSelector(false);
  };

  const jornadaInfo = JORNADAS_OPTIONS.find(j => j.id === jornadaAtiva)!;

  // Função para mudar tab e notificar o header
  const changeMainTab = (tab: MainTab) => {
    setMainTab(tab);
    // Notificar o DesktopTopNav
    window.dispatchEvent(new CustomEvent('desktop-nav-tab-change', { detail: { tab } }));
  };

  // Preload das imagens de carreiras assim que o app monta
  useEffect(() => {
    preloadImages(CARREIRAS_IMAGES);
  }, []);

  // Atualizar tab quando URL mudar
  useEffect(() => {
    if (tabFromUrl && ['jornada', 'estudos', 'leis', 'explorar'].includes(tabFromUrl)) {
      changeMainTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Escutar cliques do header desktop
  useEffect(() => {
    const handleHeaderClick = (e: CustomEvent<{ tab: string }>) => {
      const tab = e.detail.tab as MainTab;
      if (['jornada', 'estudos', 'leis', 'explorar'].includes(tab)) {
        setMainTab(tab);
      }
    };
    
    window.addEventListener('header-nav-tab-click' as any, handleHeaderClick);
    return () => window.removeEventListener('header-nav-tab-click' as any, handleHeaderClick);
  }, []);

  // Esconder menu de rodapé quando não estiver em "Ferramentas"
  useEffect(() => {
    const bottomNav = document.querySelector('[data-bottom-nav]');
    if (bottomNav) {
      (bottomNav as HTMLElement).style.display = mainTab === 'estudos' ? '' : 'none';
    }
    return () => {
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
      }
    };
  }, [mainTab]);

  // Controlar visibilidade das sidebars no desktop (ocultar quando em abas expandidas)
  useEffect(() => {
    if (isDesktop && mainTab !== 'jornada') {
      window.dispatchEvent(new CustomEvent('hide-desktop-sidebars'));
    } else {
      window.dispatchEvent(new CustomEvent('show-desktop-sidebars'));
    }
    
    return () => {
      // Sempre restaurar sidebars ao sair da página
      window.dispatchEvent(new CustomEvent('show-desktop-sidebars'));
    };
  }, [isDesktop, mainTab]);
  
  const heroImage = mainTab === 'leis' ? '/hero-banner-tribunal.webp' : (HERO_IMAGES_STATIC[mainTab] || HERO_IMAGES_STATIC.jornada);

  // Crossfade: track previous hero image
  const prevHeroRef = useRef(heroImage);
  const [displayedHero, setDisplayedHero] = useState(heroImage);
  const [heroOpacity, setHeroOpacity] = useState(1);

  useEffect(() => {
    if (heroImage !== displayedHero) {
      // Keep old image visible, start fade
      prevHeroRef.current = displayedHero;
      setHeroOpacity(0);
      // Small delay to allow opacity-0 to render, then switch and fade in
      const t = requestAnimationFrame(() => {
        setDisplayedHero(heroImage);
        setHeroOpacity(1);
      });
      return () => cancelAnimationFrame(t);
    }
  }, [heroImage]);

  const {
    featuredNews,
    loading: loadingNews,
  } = useFeaturedNews();

  // Componente de botão de aba principal
  const TabButton = ({ tab, icon: Icon, label }: { tab: MainTab; icon: React.ElementType; label: string }) => {
    const isActive = mainTab === tab;

    return (
      <button
        onClick={() => changeMainTab(tab)}
        className={`flex-1 min-w-0 basis-0 px-2 md:px-4 py-2.5 md:py-3 rounded-full text-xs md:text-base font-medium transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.4)] ${
          isActive
            ? 'bg-red-600 text-white shadow-[0_4px_16px_rgba(220,38,38,0.5)]'
            : 'bg-neutral-800/80 hover:bg-neutral-700/80'
        }`}
      >
        {isActive ? (
          <>
            <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 text-white" />
            <span className="text-white">{label}</span>
          </>
        ) : (
          <>
            <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 animate-icon-shimmer" />
            <span
              className="animate-shimmer bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(90deg, rgb(163 163 163) 40%, rgb(250 250 250) 50%, rgb(163 163 163) 60%)',
                backgroundSize: '200% 100%',
              }}
            >
              {label}
            </span>
          </>
        )}
      </button>
    );
  };


  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0 relative">
      {/* Animação de celebração Premium */}
      {showCelebration && <PremiumCelebration onComplete={() => setShowCelebration(false)} />}
      {/* Carrossel de introdução para novos usuários */}
      {showIntro && <IntroCarousel onComplete={handleIntroComplete} />}
      {/* Áudio de boas-vindas para novos usuários */}
      <WelcomeAudioPlayer />
      
      {/* Ícone de busca flutuante - independente do hero para funcionar sempre */}
      {mainTab === 'jornada' && (
        <button
          onClick={() => navigate('/pesquisar')}
          className="md:hidden fixed top-4 right-5 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors active:scale-95"
          style={{ zIndex: 50 }}
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Hero Banner Mobile - fixo, cobre do topo até incluir os tabs */}
      <div className="md:hidden fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 1, height: '18rem' }}>
        <div className="w-full h-full overflow-hidden rounded-b-[32px]" style={{ position: 'relative' }}>
          {/* Previous hero image (fading out) */}
          {prevHeroRef.current !== displayedHero && (
            <img 
              src={prevHeroRef.current}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ease-in-out opacity-0"
              style={{
                transform: `translateY(${scrollY * 0.25}px) scale(1.1)`,
                willChange: 'transform',
              }}
            />
          )}
          {/* Current hero image (fading in) */}
          <img 
            src={displayedHero}
            alt="Juridiquê"
            className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ease-in-out"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            style={{
              opacity: heroOpacity,
              transform: `translateY(${scrollY * 0.25}px) scale(1.1)`,
              willChange: 'transform, opacity',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/80" />
          {/* Saudação personalizada ou título da aba - com fade-in */}
          <div key={mainTab} className="absolute bottom-24 left-0 right-0 text-center pointer-events-auto animate-fade-in" style={{ textShadow: '0 4px 16px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)' }}>
            {(mainTab === 'jornada' || mainTab === 'estudos') && userName ? (
              <>
                <p className="font-playfair text-2xl font-semibold text-white/90 leading-tight">{getGreeting()},</p>
                <p className="font-playfair text-4xl font-bold text-white leading-tight">{userName}</p>
              </>
            ) : mainTab === 'leis' ? (
              <>
                <p className="font-playfair text-2xl font-semibold text-white/90 leading-tight">Vade Mecum</p>
                <p className="font-playfair text-4xl font-bold text-white leading-tight">Legislação</p>
              </>
            ) : mainTab === 'explorar' ? (
              <>
                <p className="font-playfair text-2xl font-semibold text-white/90 leading-tight">Fique por dentro</p>
                <p className="font-playfair text-4xl font-bold text-white leading-tight">Explorar</p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Header com gradiente sutil - Desktop */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none h-96" />

      {/* Spacer para revelar a imagem hero */}
      <div className="md:hidden h-28" style={{ zIndex: 1 }} />

      {/* Jornada selector - above tabs, only when on Jornada tab */}
      {mainTab === 'jornada' && (
        <div className="md:hidden relative px-4 mb-3" style={{ zIndex: 4 }}>
          <button
            onClick={() => setShowJornadaSelector(!showJornadaSelector)}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-card/90 backdrop-blur-md border border-border/50 hover:border-amber-500/30 transition-all"
          >
            <div className="p-2 bg-red-500/20 rounded-xl">
              <jornadaInfo.icon className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-playfair text-lg font-bold text-foreground tracking-tight leading-tight">
                {jornadaInfo.label}
              </h3>
              <p className="text-xs text-muted-foreground leading-tight">
                {jornadaInfo.sublabel}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Settings className="w-4 h-4" />
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showJornadaSelector ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Floating card dropdown */}
          {showJornadaSelector && (
            <div className="absolute left-4 right-4 top-full mt-2 z-50 bg-card border border-border rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in">
              <p className="px-4 pt-3.5 pb-1.5 text-sm text-muted-foreground font-medium">Escolha sua jornada</p>
              {JORNADAS_OPTIONS.map((jornada) => {
                const Icon = jornada.icon;
                const isActive = jornadaAtiva === jornada.id;
                return (
                  <button
                    key={jornada.id}
                    onClick={() => handleSelectJornada(jornada.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${
                      isActive 
                        ? 'bg-red-500/10 text-foreground' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${isActive ? 'bg-red-500/20' : 'bg-muted'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-red-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-semibold">{jornada.label}</p>
                      <p className="text-xs text-muted-foreground">{jornada.sublabel}</p>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-2.5 h-2.5 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tabs dentro da imagem hero, na parte inferior */}
      <div className="md:hidden relative px-4 mb-2" style={{ zIndex: 3 }}>
        <div className="flex gap-1.5 h-[44px]">
          <TabButton tab="jornada" icon={Route} label="Jornada" />
          <TabButton tab="estudos" icon={GraduationCap} label="Estudos" />
          <TabButton tab="leis" icon={Scale} label="Leis" />
          <TabButton tab="explorar" icon={Compass} label="Explorar" />
        </div>
      </div>


      {/* Conteúdo principal - Mobile */}
      <div key={mainTab} className={`md:hidden relative min-h-screen pb-20 rounded-t-[32px] animate-fade-in ${mainTab === 'jornada' ? 'bg-[#0d0d14] overflow-hidden' : 'bg-muted'}`} style={{ zIndex: 2 }}>
        {/* Cards de acesso rápido - Aulas e Biblioteca */}
        {mainTab === 'estudos' && (
          <div className="px-4 pt-6 pb-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Flame className="w-5 h-5 text-amber-100" />
              </div>
              <div>
                <h2 className="font-playfair text-xl font-bold text-foreground tracking-tight">Em alta</h2>
                <p className="text-xs text-muted-foreground">Aprofunde os estudos</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/aulas')}
              className="overflow-hidden rounded-2xl text-left border border-border/30 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.6)] transition-all group bg-card"
            >
              <div className="relative h-[70px] overflow-hidden">
                <img src={cardAulasThumb} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-foreground">Aulas</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Jornada de estudos</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </button>

            <button
              onClick={() => navigate('/bibliotecas')}
              className="overflow-hidden rounded-2xl text-left border border-border/30 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.6)] transition-all group bg-card"
            >
              <div className="relative h-[70px] overflow-hidden">
                <img src={bibliotecaThumb} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Library className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-foreground">Biblioteca</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Acervo completo</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </button>
            </div>
          </div>
        )}

        <div className="px-4 pt-4 pb-2 space-y-5">
        </div>

        {/* Conteúdo das abas mobile */}
        <div className="px-2 space-y-6">
          {/* ABA JORNADA - Mobile */}
          {mainTab === 'jornada' && (
            <JornadaHomeSection jornadaAtiva={jornadaAtiva} />
          )}

          {/* ABA ESTUDOS - Mobile */}
          {mainTab === 'estudos' && (
            <>
              <EmAltaSection isDesktop={false} navigate={navigate} handleLinkHover={handleLinkHover} />
              <RecomendacaoHomeSection isDesktop={false} navigate={navigate} handleLinkHover={handleLinkHover} />
            </>
          )}

          {/* ABA DESTAQUES - Mobile */}
          {mainTab === 'explorar' && (
            <>
              {/* Notícias em Destaque */}
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <Newspaper className="w-5 h-5 text-amber-100" />
                    </div>
                    <div>
                      <h3 className="font-playfair text-xl font-bold text-amber-100 tracking-tight">Notícias Jurídicas</h3>
                      <p className="text-white/70 text-xs">Fique atualizado</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/noticias-juridicas')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                  >
                    <span>Ver mais</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <ScrollArea className="w-full">
                  <div className="flex gap-3 pb-4 touch-pan-x">
                    {featuredNews.slice(0, 6).map((noticia, index) => (
                      <NoticiaCarouselCard 
                        key={noticia.id} 
                        noticia={noticia} 
                        priority={index < 3}
                      />
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>

              {/* Política */}
              <PoliticaHomeSection isDesktop={false} navigate={navigate} handleLinkHover={handleLinkHover} />
            </>
          )}

          {/* ABA LEIS - Mobile */}
          {mainTab === 'leis' && (
            <MobileLeisHome />
          )}
        </div>
      </div>

      {/* ===== Desktop Layout ===== */}
      <div className="hidden md:block flex-1 px-6 py-8 space-y-8 relative" style={{ zIndex: 2 }}>
        {/* Desktop tabs */}
        <div className="flex gap-1.5 mb-2 relative z-20 h-[44px] mt-4">
          <TabButton tab="jornada" icon={Route} label="Jornada" />
          <TabButton tab="estudos" icon={GraduationCap} label="Estudos" />
          <TabButton tab="leis" icon={Scale} label="Leis" />
          <TabButton tab="explorar" icon={Compass} label="Explorar" />
        </div>

        {mainTab === 'jornada' && <DesktopHomeDestaque />}

        {mainTab === 'explorar' && <DesktopHomeDestaque />}

        {mainTab === 'leis' && (
          <div className="relative min-h-[70vh]">
            <div className="fixed left-0 right-0 bottom-0 z-0 pointer-events-none" style={{ top: '160px' }}>
              <img 
                src={heroVadeMecumPlanalto} 
                alt="Vade Mecum"
                className="w-full h-full object-cover object-top opacity-60"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
            </div>
            <div className="relative z-10">
              <DesktopVadeMecumHome />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;