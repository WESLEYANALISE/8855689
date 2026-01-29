import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Play, Loader2, Volume2, Clock, Scale, Gavel, Building } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useImagePreload, isImageCached } from "@/hooks/useImagePreload";
import { useInstantCache } from "@/hooks/useInstantCache";
interface Slide {
  imagem_url: string;
  titulo: string;
}

interface ResumoDisponivel {
  id: string;
  data: string;
  total_noticias: number;
  slides: Slide[];
  tipo: 'juridica' | 'politica' | 'concurso';
}

type TabType = 'direito' | 'concurso' | 'politica';

interface ResumosDisponiveisCarouselProps {
  tipo?: 'politica' | 'juridica' | 'concurso' | 'ambos';
  dataAtiva?: Date;
  showTabs?: boolean;
}

// Usar função do hook centralizado
const checkImageCache = isImageCached;

export default function ResumosDisponiveisCarousel({ tipo = 'ambos', dataAtiva, showTabs = false }: ResumosDisponiveisCarouselProps) {
  const navigate = useNavigate();
  const [generatingDates, setGeneratingDates] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState<string>("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Track quais imagens já carregaram
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  // Tab ativo quando showTabs está habilitado
  const [activeTab, setActiveTab] = useState<TabType>('direito');

  // Cache-first loading com useInstantCache - dados aparecem instantaneamente
  const { data: resumosRaw, refresh: refreshResumos } = useInstantCache<any[]>({
    cacheKey: 'resumos-diarios-carousel-v2', // Nova versão do cache para invalidar o antigo
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resumos_diarios')
        .select('id, data, total_noticias, slides, tipo')
        .order('data', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data || [];
    },
    cacheDuration: 30 * 1000, // 30 segundos para dados sempre frescos
    preloadImages: true,
    imageExtractor: (data) => 
      data.flatMap((r: any) => 
        Array.isArray(r.slides) 
          ? r.slides.map((s: any) => s.imagem_url).filter(Boolean) 
          : []
      ),
  });

  // Sempre buscar dados frescos ao montar para garantir boletins recentes
  useEffect(() => {
    refreshResumos();
  }, []);

  // Determinar qual tipo filtrar baseado no modo
  const tipoFiltro = useMemo(() => {
    if (showTabs) {
      // Quando showTabs está ativo, usar o tab selecionado
      if (activeTab === 'direito') return 'juridica';
      if (activeTab === 'concurso') return 'concurso';
      return 'politica';
    }
    return tipo;
  }, [showTabs, activeTab, tipo]);

  // Filtrar por tipo e formatar dados
  const resumos = useMemo<ResumoDisponivel[]>(() => {
    if (!resumosRaw) return [];
    
    let filtered = resumosRaw;
    if (tipoFiltro !== 'ambos') {
      // Mapear 'juridica' para incluir também 'direito' no filtro
      if (tipoFiltro === 'juridica') {
        filtered = resumosRaw.filter((r: any) => r.tipo === 'juridica' || r.tipo === 'direito');
      } else {
        filtered = resumosRaw.filter((r: any) => r.tipo === tipoFiltro);
      }
    }
    
    return filtered.map((item: any) => ({
      ...item,
      slides: Array.isArray(item.slides) ? (item.slides as Slide[]) : [],
      tipo: item.tipo as 'juridica' | 'politica' | 'concurso'
    }));
  }, [resumosRaw, tipoFiltro]);

  // Preload das capas dos boletins para exibição instantânea
  const capasUrls = useMemo(() => 
    resumos.flatMap(r => r.slides.map(s => s.imagem_url)).filter(Boolean),
    [resumos]
  );
  useImagePreload(capasUrls);

  // Verificar cache das imagens quando resumos mudam
  useEffect(() => {
    if (resumos.length > 0) {
      const cached = new Set<string>();
      resumos.forEach(resumo => {
        resumo.slides.forEach(slide => {
          if (slide.imagem_url && checkImageCache(slide.imagem_url)) {
            cached.add(slide.imagem_url);
          }
        });
      });
      if (cached.size > 0) {
        setLoadedImages(prev => new Set([...prev, ...cached]));
      }
    }
  }, [resumos]);

  // Handler para quando imagem carrega
  const handleImageLoad = useCallback((url: string) => {
    setLoadedImages(prev => new Set([...prev, url]));
  }, []);

  // Obter data/hora atual no fuso de Brasília (UTC-3, sem horário de verão desde 2019)
  const getDataHoraSaoPaulo = (): { year: number; month: number; day: number; hours: number; minutes: number; seconds: number } => {
    const now = new Date();
    // Calcular UTC e subtrair 3 horas para Brasília
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasiliaTime = new Date(utc - (3 * 60 * 60 * 1000)); // UTC-3
    
    return {
      year: brasiliaTime.getFullYear(),
      month: brasiliaTime.getMonth() + 1,
      day: brasiliaTime.getDate(),
      hours: brasiliaTime.getHours(),
      minutes: brasiliaTime.getMinutes(),
      seconds: brasiliaTime.getSeconds()
    };
  };

  // Obter data de hoje no fuso de São Paulo (formato yyyy-MM-dd)
  const getHojeSaoPaulo = (): string => {
    const { year, month, day } = getDataHoraSaoPaulo();
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  // Calcular contagem regressiva para 21:50 de Brasília (horário do cron job dos boletins)
  // OTIMIZAÇÃO: Só atualiza quando o componente está visível na tela
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let isVisible = true;
    
    const calcularCountdown = () => {
      if (!isVisible) return;
      
      const sp = getDataHoraSaoPaulo();
      
      // Horário do cron job: 21:50 BRT (ambos os boletins)
      const horaAlvo = 21;
      const minutoAlvo = 50;
      
      // Se já passou das 21:50 em Brasília, não mostra countdown e para o intervalo
      if (sp.hours > horaAlvo || (sp.hours === horaAlvo && sp.minutes >= minutoAlvo)) {
        setCountdown("");
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        return;
      }
      
      // Calcular segundos restantes
      const segundosAgora = sp.hours * 3600 + sp.minutes * 60 + sp.seconds;
      const segundosAlvo = horaAlvo * 3600 + minutoAlvo * 60;
      const segundosRestantes = segundosAlvo - segundosAgora;
      
      if (segundosRestantes <= 0) {
        setCountdown("");
        return;
      }
      
      const horas = Math.floor(segundosRestantes / 3600);
      const minutos = Math.floor((segundosRestantes % 3600) / 60);
      const segundos = segundosRestantes % 60;
      
      setCountdown(
        `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
      );
    };
    
    // Usar IntersectionObserver para pausar quando não visível
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? false;
        if (isVisible && !interval) {
          calcularCountdown();
          interval = setInterval(calcularCountdown, 1000);
        } else if (!isVisible && interval) {
          clearInterval(interval);
          interval = null;
        }
      },
      { threshold: 0.1 }
    );
    
    // Observar o componente
    const element = scrollContainerRef.current?.parentElement;
    if (element) {
      observer.observe(element);
    }
    
    // Iniciar countdown
    calcularCountdown();
    interval = setInterval(calcularCountdown, 1000);
    
    return () => {
      if (interval) clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // Gerar lista dos últimos 5 dias (baseado no horário de São Paulo)
  const getUltimos5Dias = () => {
    const dias: string[] = [];
    const hojeSP = getHojeSaoPaulo();
    const [year, month, day] = hojeSP.split('-').map(Number);
    const hojeDate = new Date(year, month - 1, day);
    
    for (let i = 0; i < 5; i++) {
      const date = subDays(hojeDate, i);
      dias.push(format(date, 'yyyy-MM-dd'));
    }
    return dias;
  };

  // Scroll para o boletim da data ativa
  useEffect(() => {
    if (!dataAtiva || !scrollContainerRef.current || resumos.length === 0) return;
    
    // Pequeno delay para garantir que o DOM está renderizado
    const timer = setTimeout(() => {
      const dataStr = format(dataAtiva, 'yyyy-MM-dd');
      const targetElement = scrollContainerRef.current?.querySelector(`[data-date="${dataStr}"]`) as HTMLElement;
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [dataAtiva, resumos]);

  // Converter data string YYYY-MM-DD para Date local sem problemas de timezone
  const parseDateLocal = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getDateLabel = (dataStr: string, extenso: boolean = false) => {
    const hojeSP = getHojeSaoPaulo();
    const [yearHoje, monthHoje, dayHoje] = hojeSP.split('-').map(Number);
    const hojeDate = new Date(yearHoje, monthHoje - 1, dayHoje);
    const ontemDate = subDays(hojeDate, 1);
    
    const date = parseDateLocal(dataStr);
    
    // Comparar usando apenas ano/mês/dia
    if (date.getFullYear() === hojeDate.getFullYear() && 
        date.getMonth() === hojeDate.getMonth() && 
        date.getDate() === hojeDate.getDate()) {
      return "Hoje";
    }
    if (date.getFullYear() === ontemDate.getFullYear() && 
        date.getMonth() === ontemDate.getMonth() && 
        date.getDate() === ontemDate.getDate()) {
      return "Ontem";
    }
    
    // Formato por extenso: "9 de janeiro de 2025"
    if (extenso) {
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    
    return format(date, "dd/MM", { locale: ptBR });
  };

  const handleClick = (resumo: ResumoDisponivel) => {
    navigate(`/resumo-do-dia/${resumo.tipo}?data=${resumo.data}`);
  };

  const [generatingProgress, setGeneratingProgress] = useState<{
    key: string;
    message: string;
    progress: number;
    currentSlide?: number;
    totalSlides?: number;
  } | null>(null);

  const handleGenerate = async (dataStr: string, tipoBoletim: 'juridica' | 'politica') => {
    const key = `${dataStr}-${tipoBoletim}`;
    setGeneratingDates(prev => new Set(prev).add(key));
    setGeneratingProgress({ key, message: 'Iniciando geração...', progress: 0 });
    
    try {
      // Usar streaming para mostrar progresso
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-resumo-diario`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ tipo: tipoBoletim, data: dataStr, stream: true })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao gerar boletim');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                setGeneratingProgress({
                  key,
                  message: data.message || 'Processando...',
                  progress: data.progress || 0,
                  currentSlide: data.currentSlide,
                  totalSlides: data.totalSlides
                });
              } catch {}
            }
            if (line.startsWith('event: done')) {
              toast.success('Boletim gerado com sucesso!');
              refreshResumos();
            }
            if (line.startsWith('event: error')) {
              const errorLine = lines.find(l => l.startsWith('data: '));
              if (errorLine) {
                const errorData = JSON.parse(errorLine.slice(6));
                throw new Error(errorData.error || 'Erro ao gerar');
              }
            }
          }
        }
      }

      // Recarregar ao finalizar
      refreshResumos();
      toast.success('Boletim gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar boletim:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao gerar boletim';
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        toast.error('Limite de API atingido. Tente novamente mais tarde.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setGeneratingDates(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setGeneratingProgress(null);
    }
  };

  // Sem loading state - dados aparecem instantaneamente do cache

  const ultimos5Dias = getUltimos5Dias();
  const hoje = getHojeSaoPaulo();

  // Detectar se é desktop (md breakpoint = 768px)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gerar itens do carrossel baseado no tipo - APENAS boletins que já existem
  // Desktop: 7 itens, Mobile: 5 itens
  const getCarouselItems = () => {
    const maxItems = isDesktop ? 7 : 5;
    const items: { dataStr: string; tipoBoletim: 'juridica' | 'politica' | 'concurso' | 'combinado' | 'countdown-single'; resumo?: ResumoDisponivel; resumoTipo?: 'juridica' | 'politica' | 'concurso' }[] = [];
    
    // Quando showTabs está ativo ou tipo específico
    const sortedResumos = [...resumos].sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );
    
    for (const resumo of sortedResumos) {
      if (items.length >= maxItems) break;
      items.push({ 
        dataStr: resumo.data, 
        tipoBoletim: resumo.tipo, 
        resumo 
      });
    }
    
    return items;
  };

  const carouselItems = getCarouselItems();

  const getTitulo = () => {
    if (showTabs) return 'Boletins';
    if (tipo === 'ambos') return 'Boletins Jurídicos';
    if (tipo === 'concurso') return 'Boletins de Concursos';
    return tipo === 'juridica' ? 'Boletins Jurídicos' : 'Boletins Políticos';
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'direito', label: 'Direito', icon: Scale },
    { id: 'concurso', label: 'Concursos', icon: Gavel },
    { id: 'politica', label: 'Política', icon: Building },
  ];

  // Se showTabs está ativo, envolve em container amarelo
  if (showTabs) {
    return (
      <div className="space-y-3">
        {/* Header FORA do container - estilo Em Alta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Mic className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="font-playfair text-lg font-bold text-amber-100">{getTitulo()}</h2>
              <p className="text-amber-200/70 text-xs">O essencial do dia em minutos</p>
            </div>
          </div>
          
          {/* Countdown ao lado */}
          {countdown && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20">
              <Clock className="w-4 h-4 text-white/70" />
              <span className="text-[10px] text-white/60 mr-1">Próximo</span>
              <span className="text-sm font-mono font-bold text-white">{countdown}</span>
            </div>
          )}
        </div>

        {/* Container amarelo */}
        <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
          {/* Menu de alternância */}
          <div className="flex gap-2 mb-4 relative z-10">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? 'bg-white/25 text-white shadow-lg border border-white/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white border border-transparent'
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
                  )}
                  <Icon className="w-3.5 h-3.5 text-amber-100 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <ScrollArea className="w-full">
            <div ref={scrollContainerRef} className="flex gap-3 pb-3">
              {carouselItems.map((item, index) => {
                const { dataStr, tipoBoletim, resumo } = item;
                const dateLabel = getDateLabel(dataStr, showTabs);
                const key = `${dataStr}-${tipoBoletim}`;
                const isGenerating = generatingDates.has(key) || generatingDates.has(`${dataStr}-juridica`) || generatingDates.has(`${dataStr}-politica`);
                const isHoje = dateLabel === "Hoje";
                const isDataAtiva = dataAtiva && isSameDay(parseDateLocal(dataStr), dataAtiva);

                if (tipoBoletim === 'combinado' || tipoBoletim === 'countdown-single') {
                  return null;
                }

                const getTagStyles = () => {
                  if (tipoBoletim === 'juridica') return 'bg-blue-500/20 text-blue-400';
                  if (tipoBoletim === 'politica') return 'bg-purple-500/20 text-purple-400';
                  return 'bg-amber-500/20 text-amber-400';
                };
                const tagStyles = getTagStyles();
                const tagLabel = tipoBoletim === 'juridica' ? 'Jurídico' : tipoBoletim === 'politica' ? 'Política' : 'Concurso';

                if (resumo) {
                  const coverImage = resumo.slides?.[0]?.imagem_url;
                  const isImageLoaded = coverImage ? loadedImages.has(coverImage) : true;
                  
                    return (
                    <button
                      key={`${dataStr}-${tipoBoletim}-${index}`}
                      onClick={() => navigate(`/resumo-diario/${dataStr}?tipo=${tipoBoletim}`)}
                      className="group flex-shrink-0 w-36 min-w-36 text-left"
                    >
                      <div className="relative h-20 rounded-xl overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.4)' }}>
                        {/* Capa do boletim */}
                        {coverImage ? (
                          <>
                            {!isImageLoaded && (
                              <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                              </div>
                            )}
                            <img
                              src={coverImage}
                              alt={`Boletim ${dateLabel}`}
                              className={`w-full h-full object-cover transition-all duration-200 group-hover:scale-105 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                              loading={index < 2 ? "eager" : "lazy"}
                              onLoad={() => handleImageLoad(coverImage)}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                                handleImageLoad(coverImage);
                              }}
                            />
                          </>
                        ) : (
                          <div className={`absolute inset-0 ${
                            tipoBoletim === 'juridica' 
                              ? 'bg-gradient-to-br from-blue-600/40 to-blue-900/60' 
                              : tipoBoletim === 'politica'
                              ? 'bg-gradient-to-br from-purple-600/40 to-purple-900/60'
                              : 'bg-gradient-to-br from-amber-600/40 to-amber-900/60'
                          }`} />
                        )}
                        
                        {/* Ícone de áudio no centro */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center group-hover:bg-amber-500/90 transition-colors">
                            <Volume2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-1.5 px-0.5">
                        <span className="text-xs text-white/80">{dateLabel}</span>
                      </div>
                    </button>
                  );
                }

                return null;
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Layout padrão sem container
  return (
    <div className="space-y-3">
      {/* Título, subtítulo e countdown lado a lado */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-base">{getTitulo()}</h2>
          </div>
          <p className="text-xs text-muted-foreground pl-7">O essencial do dia em minutos</p>
        </div>
        
        {/* Countdown ao lado - só mostra se tiver countdown ativo */}
        {countdown && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-[10px] text-muted-foreground mr-1">Próximo boletim</span>
            <span className="text-sm font-mono font-bold text-red-400">{countdown}</span>
          </div>
        )}
      </div>

      {/* Menu de alternância quando showTabs está ativo - estilo Em Alta */}
      {showTabs && (
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'bg-red-600/90 text-white shadow-lg border border-red-500/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <ScrollArea className="w-full">
        <div ref={scrollContainerRef} className="flex gap-3 pb-3">
          {carouselItems.map((item, index) => {
            const { dataStr, tipoBoletim, resumo } = item;
            const dateLabel = getDateLabel(dataStr, showTabs);
            const key = `${dataStr}-${tipoBoletim}`;
            const isGenerating = generatingDates.has(key) || generatingDates.has(`${dataStr}-juridica`) || generatingDates.has(`${dataStr}-politica`);
            const isHoje = dateLabel === "Hoje";
            const isDataAtiva = dataAtiva && isSameDay(parseDateLocal(dataStr), dataAtiva);

            // Card combinado - NÃO MOSTRAR (countdown já está no título)
            if (tipoBoletim === 'combinado') {
              return null;
            }

            // Card com countdown para tipo específico - NÃO MOSTRAR (countdown já está no título)
            if (tipoBoletim === 'countdown-single') {
              return null;
            }

            // Tag styling para cards individuais
            const getTagStyles = () => {
              if (tipoBoletim === 'juridica') return 'bg-red-500/20 text-red-400';
              if (tipoBoletim === 'concurso') return 'bg-amber-500/20 text-amber-400';
              return 'bg-blue-500/20 text-blue-400';
            };
            const getTagLabel = () => {
              if (tipoBoletim === 'juridica') return 'Direito';
              if (tipoBoletim === 'concurso') return 'Concursos';
              return 'Política';
            };
            const tagStyles = getTagStyles();
            const tagLabel = getTagLabel();

            // Card de boletim existente
            if (resumo) {
              const coverImage = resumo.slides[0]?.imagem_url || '/placeholder.svg';
              const isImageLoaded = loadedImages.has(coverImage);
              
              return (
                <button
                  data-date={dataStr}
                  key={key}
                  onClick={() => handleClick(resumo)}
                  className="flex-shrink-0 w-36 group text-left"
                >
                  {/* Capa com ícone de áudio */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted/30 mb-1.5">
                    {/* Placeholder enquanto carrega */}
                    {!isImageLoaded && (
                      <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                      </div>
                    )}
                    <img
                      src={coverImage}
                      alt={`Resumo ${dateLabel}`}
                      className={`w-full h-full object-cover transition-all duration-200 group-hover:scale-105 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      loading={index < 2 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                      onLoad={() => handleImageLoad(coverImage)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                        handleImageLoad(coverImage);
                      }}
                    />
                    
                    {/* Ícone de áudio no centro */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-primary/90 transition-colors">
                        <Volume2 className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Overlay de play no hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Tag e Data embaixo - quando showTabs ativo, só mostra data à esquerda */}
                  <div className={`flex items-center mt-1.5 px-0.5 ${showTabs ? 'justify-start' : 'justify-between'}`}>
                    {!showTabs && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${tagStyles}`}>
                        {tagLabel}
                      </span>
                    )}
                    <span className={`text-xs text-foreground ${showTabs ? 'font-normal' : 'font-medium'}`}>
                      {dateLabel}
                    </span>
                  </div>
                </button>
            );
            }

            // Não mostrar cards para gerar - só mostramos boletins que já existem
            return null;
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
