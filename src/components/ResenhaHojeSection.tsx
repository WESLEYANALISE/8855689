import { memo, useCallback, useState, useMemo, useEffect } from "react";
import { ScrollText, ArrowRight, Loader2, Scale, ChevronRight, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ResenhaHojeSectionProps {
  isDesktop: boolean;
  navigate: (path: string) => void;
  handleLinkHover: (path: string) => void;
}

interface LeiRecente {
  id: string;
  numero_lei: string;
  tipo_ato: string | null;
  ementa: string | null;
  data_publicacao: string | null;
  texto_formatado: string | null;
  pendente?: boolean;
  fonte?: 'resenha_diaria' | 'leis_push_2025';
}

export const ResenhaHojeSection = memo(({ isDesktop, navigate, handleLinkHover }: ResenhaHojeSectionProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Gerar últimos 7 dias
  const lastDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)),
    []
  );

  // Buscar dias que têm leis
  const { data: diasComLeis = [], isLoading: loadingDias } = useQuery({
    queryKey: ['resenha-dias-home'],
    queryFn: async () => {
      const { data: leisPushData } = await supabase
        .from('leis_push_2025')
        .select('data_publicacao')
        .not('texto_formatado', 'is', null)
        .not('data_publicacao', 'is', null);

      const todasDatas = (leisPushData || []).map((d: any) => d.data_publicacao);
      return [...new Set(todasDatas.filter(Boolean))] as string[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Encontrar o último dia com leis e selecionar automaticamente
  useEffect(() => {
    if (!loadingDias && diasComLeis.length > 0 && !selectedDate) {
      for (const day of lastDays) {
        if (diasComLeis.includes(format(day, 'yyyy-MM-dd'))) {
          setSelectedDate(day);
          break;
        }
      }
    } else if (!loadingDias && diasComLeis.length === 0 && !selectedDate) {
      setSelectedDate(new Date());
    }
  }, [loadingDias, diasComLeis, lastDays, selectedDate]);

  // Buscar leis da data selecionada
  const { data: leisDoDia = [], isLoading: loadingLeis } = useQuery({
    queryKey: ['resenha-leis-home', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      const dataFormatada = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('leis_push_2025')
        .select('id, numero_lei, tipo_ato, ementa, data_publicacao, texto_formatado')
        .eq('data_publicacao', dataFormatada)
        .not('texto_formatado', 'is', null)
        .order('ordem_dou', { ascending: true })
        .limit(10);
      
      if (error) throw error;
      return (data || []) as LeiRecente[];
    },
    enabled: !!selectedDate,
    staleTime: 5 * 60 * 1000,
  });

  const handleNavigate = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  const handleLeiClick = useCallback((lei: LeiRecente) => {
    navigate(`/vade-mecum/resenha/push-${lei.id}`);
  }, [navigate]);

  const diaTemLeis = (day: Date): boolean => {
    return diasComLeis.includes(format(day, 'yyyy-MM-dd'));
  };

  const formatWeekday = (date: Date) => {
    if (isToday(date)) return 'Hoje';
    return format(date, "EEE", { locale: ptBR });
  };

  return (
    <div className="space-y-3" data-tutorial="resenha-diaria">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-xl">
            <ScrollText className="w-5 h-5 text-orange-300" />
          </div>
          <div>
            <h3 className="font-playfair text-xl md:text-lg font-bold text-orange-200 tracking-tight">
              Resenha Diária
            </h3>
            <p className="text-white/70 text-xs">
              Atualizações do Diário Oficial
            </p>
          </div>
        </div>
        
        <button
          onClick={() => handleNavigate('/vade-mecum/resenha-diaria')}
          onMouseEnter={() => handleLinkHover('/vade-mecum/resenha-diaria')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-orange-500/20 text-orange-200 hover:bg-orange-500/30"
        >
          <span>Ver tudo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Container */}
      <div className="bg-gradient-to-br from-orange-950 via-orange-900 to-orange-950/95 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-orange-800/30">
        {/* Navegação de Dias - Calendário horizontal */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {loadingDias ? (
            <div className="flex items-center justify-center w-full py-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-300" />
            </div>
          ) : (
            lastDays.map((day) => {
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const temLeis = diaTemLeis(day);
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center min-w-[52px] h-[60px] px-2 py-1.5 rounded-xl transition-all relative ${
                    isSelected 
                      ? 'bg-white text-orange-900' 
                      : temLeis
                        ? 'bg-white/15 text-white/90 hover:bg-white/20'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  <span className={`text-[9px] uppercase font-medium ${
                    isSelected 
                      ? 'text-orange-600' 
                      : temLeis 
                        ? 'text-white/60' 
                        : 'text-white/30'
                  }`}>
                    {formatWeekday(day)}
                  </span>
                  <span className={`text-base font-bold ${!temLeis && !isSelected ? 'opacity-50' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  <span className={`text-[9px] uppercase ${
                    isSelected 
                      ? 'text-orange-600' 
                      : temLeis 
                        ? 'text-white/50' 
                        : 'text-white/25'
                  }`}>
                    {format(day, 'MMM', { locale: ptBR })}
                  </span>
                  
                  {/* Indicador de que tem leis */}
                  {temLeis && !isSelected && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Lista de Leis */}
        {loadingLeis ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-orange-300" />
          </div>
        ) : leisDoDia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-orange-300/60">
            <ScrollText className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs text-center">
              {selectedDate && isToday(selectedDate) 
                ? 'Sem publicações hoje' 
                : 'Sem publicações neste dia'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {leisDoDia.map((lei) => (
              <button
                key={lei.id}
                onClick={() => handleLeiClick(lei)}
                className="w-full bg-white/10 hover:bg-white/15 rounded-xl p-3 text-left transition-all group border border-white/5 hover:border-orange-400/30"
              >
                <div className="flex items-start gap-3">
                  <Scale className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm group-hover:text-orange-200 transition-colors">
                      {lei.numero_lei}
                    </h4>
                    {lei.ementa && (
                      <p className="text-white/60 text-[11px] leading-snug line-clamp-2 mt-0.5">
                        {lei.ementa}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-orange-300 flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Contador de leis */}
        {!loadingLeis && leisDoDia.length > 0 && (
          <div className="flex justify-center mt-3">
            <span className="text-[10px] text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
              {leisDoDia.length} {leisDoDia.length === 1 ? 'lei' : 'leis'} {selectedDate && isToday(selectedDate) ? 'hoje' : 'neste dia'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

ResenhaHojeSection.displayName = 'ResenhaHojeSection';

export default ResenhaHojeSection;
